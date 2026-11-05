# Trait reference

Reference for every trait code `Game_BattlerBase.TRAIT_*` in
[`Corescript/js/rmmz_objects/Game_BattlerBase.js`](../Corescript/js/rmmz_objects/Game_BattlerBase.js)
(RPG Maker MZ v1.10.0): 25 trait codes. A trait is a `{ code, dataId, value }` object in the `traits` array of an
actor, class, weapon, armor, enemy or state in the database. For what skills and items *do* to a target, see the
[effect reference](effects.md).

## How traits are collected and combined

- **Collection.** `traitObjects()` returns every database object whose traits apply to the battler. `allTraits()`
  concatenates their `traits` arrays; `traits(code)` filters by code, `traitsWithId(code, id)` filters by code and
  `dataId`.
- **Combination helpers** (all in `Game_BattlerBase`):

  | Helper | Formula | Value when no trait matches |
  |---|---|---|
  | `traitsPi(code, id)` | Product of `value` of traits with that code and `dataId` | `1` |
  | `traitsSum(code, id)` | Sum of `value` of traits with that code and `dataId` | `0` |
  | `traitsSumAll(code)` | Sum of `value` of all traits with that code (any `dataId`) | `0` |
  | `traitsSet(code)` | Array of the `dataId` of all traits with that code (duplicates kept) | `[]` |

  Some readers then reduce the set further: `Math.max(...set)` (attack skill, slot type, collapse type),
  `.includes(id)` (seals, equip types, resist), `.some(...)` (special flags, party abilities), or map the `value`s
  (`actionPlusSet()`).
- **Values.** Rates are stored as fractions (`1.5` = 150 %). The editor shows Ex-Parameters as "+ n %", which is why
  `xparam()` adds while `sparam()` and the rates multiply.

### `traitObjects()` per battler type

| Class | `traitObjects()` returns | Notes |
|---|---|---|
| `Game_BattlerBase` | `this.states()` | States only (the comment in the code says so). |
| `Game_Battler` | (inherited) | No override. |
| `Game_Actor` | states + `this.actor()` + `this.currentClass()` + every non-null item of `this.equips()` | Built by calling `Game_Battler.prototype.traitObjects` and pushing the rest. Equipment traits therefore disappear as soon as the item is removed. |
| `Game_Enemy` | states + `this.enemy()` | `Game_Battler.prototype.traitObjects.call(this).concat(this.enemy())`. |

Because `allTraits()` rebuilds the list on every call, every trait reader is computed live; nothing is cached.

## Trait codes

### Rate (11–14)

| Code | Constant | Editor name | `dataId` | Combined by | Read by |
|---|---|---|---|---|---|
| 11 | `TRAIT_ELEMENT_RATE` | Element Rate | Element ID | `traitsPi` | `elementRate(elementId)` → `Game_Action.calcElementRate()` / `elementsMaxRate()` |
| 12 | `TRAIT_DEBUFF_RATE` | Debuff Rate | Param ID (0–7) | `traitsPi` | `debuffRate(paramId)` → `Game_Action.itemEffectAddDebuff()` (chance) |
| 13 | `TRAIT_STATE_RATE` | State Rate | State ID | `traitsPi` | `stateRate(stateId)` → `itemEffectAddNormalState()`, `itemEffectAddAttackState()` |
| 14 | `TRAIT_STATE_RESIST` | State Resist | State ID | `traitsSet` | `stateResistSet()`, `isStateResist(stateId)` → `Game_Battler.isStateAddable()`; `refresh()` erases resisted states |

### Parameter (21–23)

| Code | Constant | Editor name | `dataId` | Combined by | Read by |
|---|---|---|---|---|---|
| 21 | `TRAIT_PARAM` | Parameter | Param ID (0–7) | `traitsPi` | `paramRate(paramId)` → `param()` |
| 22 | `TRAIT_XPARAM` | Ex-Parameter | Ex-param ID (0–9) | `traitsSum` | `xparam(xparamId)` → `hit`, `eva`, `cri`, ... getters |
| 23 | `TRAIT_SPARAM` | Sp-Parameter | Sp-param ID (0–9) | `traitsPi` | `sparam(sparamId)` → `tgr`, `grd`, `rec`, ... getters |

### Attack (31–35)

| Code | Constant | Editor name | `dataId` / `value` | Combined by | Read by |
|---|---|---|---|---|---|
| 31 | `TRAIT_ATTACK_ELEMENT` | Attack Element | Element ID | `traitsSet` | `attackElements()` → `Game_Action.calcElementRate()` when the skill's element is "Normal Attack" (`elementId < 0`). `Game_Actor` overrides it to add `bareHandsElementId()` (1) when `hasNoWeapons()`. |
| 32 | `TRAIT_ATTACK_STATE` | Attack State | State ID / chance | `traitsSet` (IDs), `traitsSum` (chance) | `attackStates()`, `attackStatesRate(stateId)` → `itemEffectAddAttackState()` (Add State effect with `dataId` 0) |
| 33 | `TRAIT_ATTACK_SPEED` | Attack Speed | — / speed | `traitsSumAll` | `attackSpeed()` → `Game_Action.speed()` when `isAttack()` |
| 34 | `TRAIT_ATTACK_TIMES` | Attack Times + | — / extra hits | `traitsSumAll`, then `Math.max(…, 0)` | `attackTimesAdd()` → `Game_Action.numRepeats()` when `isAttack()` (result is `Math.floor`ed) |
| 35 | `TRAIT_ATTACK_SKILL` | Attack Skill | Skill ID | `traitsSet`, then `Math.max` (default 1) | `attackSkillId()` → `Game_Action.setAttack()`, `isAttack()`, `canAttack()` |

### Skill (41–44)

| Code | Constant | Editor name | `dataId` | Combined by | Read by |
|---|---|---|---|---|---|
| 41 | `TRAIT_STYPE_ADD` | Add Skill Type | Skill type ID | `traitsSet` | `addedSkillTypes()` → `Game_Actor.skillTypes()` (sorted, de-duplicated) |
| 42 | `TRAIT_STYPE_SEAL` | Seal Skill Type | Skill type ID | `traitsSet` + `includes` | `isSkillTypeSealed(stypeId)` → `meetsSkillConditions()` |
| 43 | `TRAIT_SKILL_ADD` | Add Skill | Skill ID | `traitsSet` | `addedSkills()` → `Game_Actor.skills()` |
| 44 | `TRAIT_SKILL_SEAL` | Seal Skill | Skill ID | `traitsSet` + `includes` | `isSkillSealed(skillId)` → `meetsSkillConditions()` |

### Equip (51–55)

| Code | Constant | Editor name | `dataId` | Combined by | Read by |
|---|---|---|---|---|---|
| 51 | `TRAIT_EQUIP_WTYPE` | Equip Weapon | Weapon type ID | `traitsSet` + `includes` | `isEquipWtypeOk(wtypeId)` → `canEquipWeapon()` |
| 52 | `TRAIT_EQUIP_ATYPE` | Equip Armor | Armor type ID | `traitsSet` + `includes` | `isEquipAtypeOk(atypeId)` → `canEquipArmor()` |
| 53 | `TRAIT_EQUIP_LOCK` | Lock Equip | Equip type ID | `traitsSet` + `includes` | `isEquipTypeLocked(etypeId)` → `Game_Actor.isEquipChangeOk()` |
| 54 | `TRAIT_EQUIP_SEAL` | Seal Equip | Equip type ID | `traitsSet` + `includes` | `isEquipTypeSealed(etypeId)` → `canEquipWeapon()`, `canEquipArmor()`, `Game_Actor.isEquipChangeOk()` |
| 55 | `TRAIT_SLOT_TYPE` | Slot Type | 0 = Normal, 1 = Dual Wield | `traitsSet`, then `Math.max` (default 0) | `slotType()`, `isDualWield()` → `Game_Actor.equipSlots()` turns slot 2 into a weapon slot (etype 1) |

### Other (61–64)

| Code | Constant | Editor name | `dataId` / `value` | Combined by | Read by |
|---|---|---|---|---|---|
| 61 | `TRAIT_ACTION_PLUS` | Action Times + | — / probability | `traits(code).map(t => t.value)` | `actionPlusSet()` → `Game_Battler.makeActionTimes()`: starts at 1 and adds 1 for each value with `Math.random() < value` |
| 62 | `TRAIT_SPECIAL_FLAG` | Special Flag | Flag ID (below) | `traits(code).some(dataId === flagId)` | `specialFlag(flagId)` |
| 63 | `TRAIT_COLLAPSE_TYPE` | Collapse Effect | 0 Normal, 1 Boss, 2 Instant, 3 No Disappear | `traitsSet`, then `Math.max` (default 0) | `collapseType()` → `Game_Enemy.performCollapse()` (`"collapse"`, `"bossCollapse"`, `"instantCollapse"`; 3 has no case, so the sprite stays) |
| 64 | `TRAIT_PARTY_ABILITY` | Party Ability | Ability ID (below) | `traits(code).some(dataId === abilityId)` | `partyAbility(abilityId)` → `Game_Party.partyAbility()` (true if any **battle member** has it) |

#### Special flags (code 62)

| `dataId` | Constant | Getter | Effect |
|---|---|---|---|
| 0 | `Game_BattlerBase.FLAG_ID_AUTO_BATTLE` | `isAutoBattle()` | `canInput()` is false; `Game_Actor.makeActions()` calls `makeAutoBattleActions()`. |
| 1 | `Game_BattlerBase.FLAG_ID_GUARD` | `isGuard()` (also needs `canMove()`) | `Game_Action.applyGuard()` divides positive damage by `2 * grd`. |
| 2 | `Game_BattlerBase.FLAG_ID_SUBSTITUTE` | `isSubstitute()` (also needs `canMove()`) | `Game_Unit.substituteBattler()` → `BattleManager.applySubstitute()` covers a dying ally hit by a non-certain-hit action. |
| 3 | `Game_BattlerBase.FLAG_ID_PRESERVE_TP` | `isPreserveTp()` | TP is not reset by `initTp()` at battle start or `clearTp()` at battle end. |

`Game_BattlerBase.isGuard()` (the trait flag) is different from `Game_Action.isGuard()` (the action is the guard
skill, `guardSkillId()` = 2). Choosing Guard only reduces damage if that skill adds a state with the Guard flag, as
the default database does.

#### Party abilities (code 64)

| `dataId` | Constant | `Game_Party` getter | Used by |
|---|---|---|---|
| 0 | `Game_Party.ABILITY_ENCOUNTER_HALF` | `hasEncounterHalf()` | `Game_Player.encounterProgressValue()` × 0.5 |
| 1 | `Game_Party.ABILITY_ENCOUNTER_NONE` | `hasEncounterNone()` | `Game_Player.canEncounter()` |
| 2 | `Game_Party.ABILITY_CANCEL_SURPRISE` | `hasCancelSurprise()` | `Game_Party.rateSurprise()` → 0 |
| 3 | `Game_Party.ABILITY_RAISE_PREEMPTIVE` | `hasRaisePreemptive()` | `Game_Party.ratePreemptive()` × 4 |
| 4 | `Game_Party.ABILITY_GOLD_DOUBLE` | `hasGoldDouble()` | `Game_Troop.goldRate()` → 2 |
| 5 | `Game_Party.ABILITY_DROP_ITEM_DOUBLE` | `hasDropItemDouble()` | `Game_Enemy.dropItemRate()` → 2 |

## Parameter indices

### Basic parameters — `param(paramId)`, trait 21

`param(paramId) = round(clamp(paramBasePlus × paramRate × paramBuffRate, paramMin, paramMax))`, where

- `paramBasePlus(id) = max(0, paramBase(id) + paramPlus(id))`;
- `paramBase`: `Game_Actor` → `currentClass().params[id][level]`; `Game_Enemy` → `enemy().params[id]`; base class → 0;
- `paramPlus`: `_paramPlus[id]` (from Grow effects and Change Parameter); `Game_Actor` adds `item.params[id]` of every equip;
- `paramRate(id) = traitsPi(TRAIT_PARAM, id)`; `paramBuffRate(id) = _buffs[id] × 0.25 + 1` (buff level −2…+2);
- `paramMin` is 1 for MHP and 0 for the rest; `paramMax` is `Infinity` (no class overrides it in v1.10.0).

| ID | Getter | Meaning |
|---|---|---|
| 0 | `mhp` | Max HP |
| 1 | `mmp` | Max MP |
| 2 | `atk` | Attack |
| 3 | `def` | Defense |
| 4 | `mat` | Magic Attack |
| 5 | `mdf` | Magic Defense |
| 6 | `agi` | Agility |
| 7 | `luk` | Luck |

`hp`, `mp` and `tp` are also getters, but they return the stored `_hp`, `_mp`, `_tp`.

### Ex-parameters — `xparam(xparamId)`, trait 22 (sum, default 0)

| ID | Getter | Meaning | Main reader |
|---|---|---|---|
| 0 | `hit` | Hit rate | `Game_Action.itemHit()` (physical only) |
| 1 | `eva` | Evasion rate | `itemEva()` (physical) |
| 2 | `cri` | Critical rate | `itemCri()`: `cri × (1 − target.cev)` |
| 3 | `cev` | Critical evasion | `itemCri()` |
| 4 | `mev` | Magic evasion | `itemEva()` (magical) |
| 5 | `mrf` | Magic reflection | `itemMrf()` → `BattleManager.invokeMagicReflection()` |
| 6 | `cnt` | Counter attack | `itemCnt()` (physical, target can move) → `invokeCounterAttack()` |
| 7 | `hrg` | HP regeneration | `Game_Battler.regenerateHp()`: `floor(mhp × hrg)`, not below `-maxSlipDamage()` |
| 8 | `mrg` | MP regeneration | `regenerateMp()`: `floor(mmp × mrg)` |
| 9 | `trg` | TP regeneration | `regenerateTp()`: `floor(100 × trg)` |

### Sp-parameters — `sparam(sparamId)`, trait 23 (product, default 1)

| ID | Getter | Meaning | Main reader |
|---|---|---|---|
| 0 | `tgr` | Target rate | `Game_Unit.tgrSum()`, `randomTarget()` (weighted pick) |
| 1 | `grd` | Guard effect | `Game_Action.applyGuard()` |
| 2 | `rec` | Recovery effect | `makeDamageValue()` (negative base value), `itemEffectRecoverHp/Mp()` |
| 3 | `pha` | Pharmacology | `itemEffectRecoverHp/Mp()` when the action is an item; `Scene_Item.user()` picks the movable member with the best `pha` |
| 4 | `mcr` | MP cost rate | `skillMpCost()`: `floor(mpCost × mcr)` |
| 5 | `tcr` | TP charge rate | `chargeTpByDamage()`, `Game_Action.applyItemUserEffect()` |
| 6 | `pdr` | Physical damage rate | `makeDamageValue()` (physical) |
| 7 | `mdr` | Magic damage rate | `makeDamageValue()` (magical) |
| 8 | `fdr` | Floor damage rate | `Game_Actor.executeFloorDamage()` |
| 9 | `exr` | Experience rate | `Game_Actor.finalExpRate()` |

## Related

- [effects.md](effects.md): damage pipeline and item/skill effects, where most of these rates are consumed.
- [battle-turn.mmd](../sequence-diagrams/battle-turn.mmd), [damage-popup.mmd](../sequence-diagrams/damage-popup.mmd),
  [scene-equip.mmd](../sequence-diagrams/scene-equip.mmd).
