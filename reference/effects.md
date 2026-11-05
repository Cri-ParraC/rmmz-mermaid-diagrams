# Effect and damage reference

Reference for how skills and items act on a target, from
[`Corescript/js/rmmz_objects/Game_Action.js`](../Corescript/js/rmmz_objects/Game_Action.js) (RPG Maker MZ v1.10.0):
the 13 effect codes `Game_Action.EFFECT_*`, `SPECIAL_EFFECT_ESCAPE`, the hit types, the damage types, the scopes and
the damage pipeline. Most rates used here (`pdr`, `rec`, `eva`, `stateRate()` ...) come from traits, see the
[trait reference](traits.md). For the battle flow around `apply()`, see
[battle-turn.mmd](../sequence-diagrams/battle-turn.mmd) and [damage-popup.mmd](../sequence-diagrams/damage-popup.mmd);
for menu use, see [scene-item-use.mmd](../sequence-diagrams/scene-item-use.mmd).

## Order of one use

1. **Once per use** — `applyGlobal()` reserves every Common Event effect with
   `$gameTemp.reserveCommonEvent(effect.dataId)` and records the last used skill/item and last subject. In battle,
   `BattleManager.startAction()` calls `subject.useItem()` (pay cost) and `applyGlobal()` *before* any target is hit.
   In the menu, `Scene_ItemBase.applyItem()` calls `apply()` for each target first and `applyGlobal()` last.
2. **Targets** — in battle, `makeTargets()` picks targets from the scope (or a confusion target), then
   `repeatTargets()` repeats each one `numRepeats()` times (`item.repeats`, plus `attackTimesAdd()` for the attack
   skill). In the menu, `itemTargetActors()` gives the actors and `applyItem()` loops `numRepeats()` times per actor.
3. **Per target** — `BattleManager.invokeAction()`: with chance `itemCnt(target)` the target counters
   (`invokeCounterAttack()`: a new attack action from the target applied to the user); else with chance
   `itemMrf(target)` the action is reflected (`invokeMagicReflection()`: `_reflectionTarget` is set and the action is
   applied to the user); else `invokeNormalAction()` → `applySubstitute()` → `apply(realTarget)`.
4. **`apply(target)`**:
   - `result.used = testApply(target)`;
   - `result.missed = used && Math.random() >= itemHit(target)`;
   - `result.evaded = !missed && Math.random() < itemEva(target)`;
   - if `result.isHit()` (used, not missed, not evaded):
     - if `item.damage.type > 0`: `result.critical = Math.random() < itemCri(target)`, then
       `makeDamageValue()` and `executeDamage()`;
     - `applyItemEffect(target, effect)` for every effect, in database order;
     - `applyItemUserEffect(target)`: the **user** gains `floor(item.tpGain × user.tcr)` TP silently;
   - `updateLastTarget(target)` (always).

## Hit types

| Value | Constant | Editor name | Hit chance `itemHit()` | Evasion `itemEva()` | Counter / reflect |
|---|---|---|---|---|---|
| 0 | `HITTYPE_CERTAIN` | Certain Hit | `successRate × 0.01` | 0 | Neither. Also skips `stateRate` and luck for normal Add State, and is never covered by a substitute. |
| 1 | `HITTYPE_PHYSICAL` | Physical Attack | `successRate × 0.01 × user.hit` | `target.eva` | Can be countered (`cnt`) if the target `canMove()`. Damage × `target.pdr`. |
| 2 | `HITTYPE_MAGICAL` | Magical Attack | `successRate × 0.01` | `target.mev` | Can be reflected (`mrf`). Damage × `target.mdr`. |

Critical chance `itemCri()` is `user.cri × (1 − target.cev)` if `item.damage.critical`, else 0, for any hit type.

## Damage types (`item.damage.type`)

| Type | Editor name | `isHpEffect` | `isMpEffect` | Group | Formula sign |
|---|---|---|---|---|---|
| 0 | None | — | — | No damage step | — |
| 1 | HP Damage | yes | — | `isDamage()` | +1 |
| 2 | MP Damage | — | yes | `isDamage()` | +1 |
| 3 | HP Recover | yes | — | `isRecover()`, `isHpRecover()` | −1 |
| 4 | MP Recover | — | yes | `isRecover()`, `isMpRecover()` | −1 |
| 5 | HP Drain | yes | — | `isDrain()` | +1 |
| 6 | MP Drain | — | yes | `isDrain()` | +1 |

## Damage pipeline

`makeDamageValue(target, critical)`, in code order:

| Step | Code | Detail |
|---|---|---|
| 1 | `baseValue = evalDamageFormula(target)` | `eval(item.damage.formula)` with these locals in scope: `item` (the skill/item), `a` (the user, `subject()`), `b` (the target), `v` (`$gameVariables._data`, so `v[1]` is variable 1), `sign` (−1 for types 3 and 4, else 1). The result is `Math.max(result, 0) × sign`: a formula cannot go below 0, recovery comes only from the sign. `NaN` → 0; any exception → 0. |
| 2 | `× calcElementRate(target)` | `damage.elementId < 0` ("Normal Attack"): `elementsMaxRate(target, user.attackElements())`, the **highest** `target.elementRate()` among the user's attack elements (1 if none). Otherwise `target.elementRate(elementId)`. |
| 3 | `× target.pdr` / `× target.mdr` | Physical / magical hit type only. |
| 4 | `× target.rec` | Only when `baseValue < 0` (recovery). |
| 5 | `applyCritical(value)` | If critical: `value × 3`. |
| 6 | `applyVariance(value, item.damage.variance)` | `amp = floor(max(abs(value) × variance / 100, 0))`; `v = randomInt(amp + 1) + randomInt(amp + 1) − amp` (triangular, −amp…+amp); added away from zero (`value + v` if `value >= 0`, else `value − v`). |
| 7 | `applyGuard(value, target)` | `value / (value > 0 && target.isGuard() ? 2 × target.grd : 1)`. |
| 8 | `Math.round(value)` | Returned. Positive = damage, negative = recovery. |

Then `executeDamage(target, value)`:

- `value === 0` clears `result.critical`.
- HP types (1, 3, 5) → `executeHpDamage()`: drain caps `value` at `target.hp`; `makeSuccess()`; `target.gainHp(-value)`;
  if `value > 0`, `target.onDamage(value)` (`removeStatesByDamage()` and `chargeTpByDamage(value / mhp)`, which gives
  `floor(50 × rate × tcr)` TP); `gainDrainedHp(value)` gives the drained HP to the user, or to `_reflectionTarget` when
  reflected.
- MP types (2, 4, 6) → `executeMpDamage()`: unless MP recover, caps `value` at `target.mp`; `makeSuccess()` only if
  `value !== 0`; `target.gainMp(-value)`; `gainDrainedMp(value)`.

`evaluate()` / `evaluateWithTarget()` (auto battle and confused AI) call the same `makeDamageValue(target, false)`.

## Effect codes

`testItemEffect(target, effect)` is used by `testApply()` (through `hasItemAnyValidEffects()`) outside battle. In
battle `testApply()` only checks `testLifeAndDeath()`. Outside battle it also needs HP recover with `hp < mhp`, MP
recover with `mp < mmp`, or at least one effect passing the test; `Scene_ItemBase.isItemEffectsValid()` uses this, so
an item that would do nothing cannot be used from the menu. When `testApply()` is false, `result.used` is false and nothing is applied. `applyItemEffect()` dispatches to the handler.
`lukEffectRate(target) = max(1 + (user.luk − target.luk) × 0.001, 0)`.

| Code | Constant | Editor name | `dataId` | `value1` | `value2` | Handler | `testItemEffect` passes when |
|---|---|---|---|---|---|---|---|
| 11 | `EFFECT_RECOVER_HP` | Recover HP | — | Rate of max HP (1.0 = 100 %) | Flat amount | `itemEffectRecoverHp()`: `floor((mhp × value1 + value2) × target.rec × (item ? user.pha : 1))`, `gainHp()` if ≠ 0 | `hp < mhp`, or `value1 < 0`, or `value2 < 0` |
| 12 | `EFFECT_RECOVER_MP` | Recover MP | — | Rate of max MP | Flat amount | `itemEffectRecoverMp()`: same formula with `mmp`, `gainMp()` | `mp < mmp`, or `value1 < 0`, or `value2 < 0` |
| 13 | `EFFECT_GAIN_TP` | Gain TP | — | Amount | — | `itemEffectGainTp()`: `gainTp(floor(value1))` if ≠ 0 | always |
| 21 | `EFFECT_ADD_STATE` | Add State | State ID, or 0 = Normal Attack | Chance (1.0 = 100 %) | — | `itemEffectAddState()` → `itemEffectAddNormalState()`: `value1 × stateRate × lukEffectRate` (both skipped for Certain Hit); or, for `dataId` 0, `itemEffectAddAttackState()`: for each `user.attackStates()`, `value1 × stateRate × user.attackStatesRate × lukEffectRate` | target is not already in the state |
| 22 | `EFFECT_REMOVE_STATE` | Remove State | State ID | Chance | — | `itemEffectRemoveState()`: `removeState()` if `random < value1` | target has the state |
| 31 | `EFFECT_ADD_BUFF` | Add Buff | Param ID (0–7) | Turns | — | `itemEffectAddBuff()`: `addBuff(dataId, value1)`, no chance roll | not at max buff (+2) |
| 32 | `EFFECT_ADD_DEBUFF` | Add Debuff | Param ID | Turns | — | `itemEffectAddDebuff()`: chance `debuffRate(dataId) × lukEffectRate`, then `addDebuff()` | not at max debuff (−2) |
| 33 | `EFFECT_REMOVE_BUFF` | Remove Buff | Param ID | — | — | `itemEffectRemoveBuff()`: `removeBuff()` if buffed | `isBuffAffected()` |
| 34 | `EFFECT_REMOVE_DEBUFF` | Remove Debuff | Param ID | — | — | `itemEffectRemoveDebuff()`: `removeBuff()` if debuffed | `isDebuffAffected()` |
| 41 | `EFFECT_SPECIAL` | Special Effect | `SPECIAL_EFFECT_ESCAPE` (0) | — | — | `itemEffectSpecial()`: `target.escape()` (hide in battle, clear actions and states, play escape SE) | always |
| 42 | `EFFECT_GROW` | Grow | Param ID | Amount | — | `itemEffectGrow()`: `addParam(dataId, floor(value1))` (permanent `_paramPlus`) | always |
| 43 | `EFFECT_LEARN_SKILL` | Learn Skill | Skill ID | — | — | `itemEffectLearnSkill()`: `learnSkill()` for actors | target is an actor and `!isLearnedSkill(dataId)` |
| 44 | `EFFECT_COMMON_EVENT` | Common Event | Common event ID | — | — | `itemEffectCommonEvent()` is an **empty** method; the event is reserved once per use by `applyGlobal()` | always |

Every handler that changes something calls `makeSuccess(target)` (`result.success = true`).

## Scopes (`item.scope`)

Each `isForX()` method is `checkItemScope(list)`, i.e. `list.includes(item.scope)`.

| Scope | Editor name | Opponent | Friend | One | All | Random | Needs selection | Other |
|---|---|---|---|---|---|---|---|---|
| 0 | None | | | | | | | No method matches; `makeTargets()` returns `[]`. |
| 1 | 1 Enemy | ✓ | | ✓ | | | ✓ | |
| 2 | All Enemies | ✓ | | | ✓ | | | |
| 3 | 1 Random Enemy | ✓ | | ✓ | | ✓ | | `numTargets()` = scope − 2 = 1 |
| 4 | 2 Random Enemies | ✓ | | | | ✓ | | 2 targets |
| 5 | 3 Random Enemies | ✓ | | | | ✓ | | 3 targets |
| 6 | 4 Random Enemies | ✓ | | | | ✓ | | 4 targets |
| 7 | 1 Ally | | ✓ | ✓ | | | ✓ | `isForAliveFriend` |
| 8 | All Allies | | ✓ | | ✓ | | | `isForAliveFriend` |
| 9 | 1 Ally (Dead) | | ✓ | ✓ | | | ✓ | `isForDeadFriend` |
| 10 | All Allies (Dead) | | ✓ | | ✓ | | | `isForDeadFriend` |
| 11 | The User | | ✓ | ✓ | | | | `isForUser`, `isForAliveFriend` |
| 12 | 1 Ally (Dead or Alive) | | ✓ | ✓ | | | ✓ | `targetsForDeadAndAlive()` |
| 13 | All Allies (Dead or Alive) | | ✓ | | ✓ | | | `targetsForDeadAndAlive()` |
| 14 | Enemies & Allies | ✓ | ✓ | | ✓ | | | `isForEveryone`, `isForAliveFriend`; `targetsForEveryone()` = alive opponents + alive friends |

Method lists, as in the code:

| Method | Scopes |
|---|---|
| `isForOpponent()` | 1, 2, 3, 4, 5, 6, 14 |
| `isForFriend()` | 7, 8, 9, 10, 11, 12, 13, 14 |
| `isForEveryone()` | 14 |
| `isForAliveFriend()` | 7, 8, 11, 14 |
| `isForDeadFriend()` | 9, 10 |
| `isForUser()` | 11 |
| `isForOne()` | 1, 3, 7, 9, 11, 12 |
| `isForRandom()` | 3, 4, 5, 6 |
| `isForAll()` | 2, 8, 10, 13, 14 |
| `needsSelection()` | 1, 7, 9, 12 |

`testLifeAndDeath()` requires a living target for opponent and alive-friend scopes, a dead target for 9/10, and
accepts either for 12/13. Random targets use `Game_Unit.randomTarget()`, weighted by `tgr`.
