# Event command reference

Reference for every event command handler `Game_Interpreter.prototype.commandNNN` in
[`Corescript/js/rmmz_objects/Game_Interpreter.js`](../Corescript/js/rmmz_objects/Game_Interpreter.js)
(RPG Maker MZ v1.10.0): 114 handlers in total. For the per-frame loop that drives them, see
[game-interpreter-update.mmd](../sequence-diagrams/game-interpreter-update.mmd).

## How commands are executed

- **Dispatch.** `update()` loops while `isRunning()`; each pass calls `updateChild()` and `updateWait()`,
  stops if `SceneManager.isSceneChanging()`, then calls `executeCommand()`. `executeCommand()` takes
  `currentCommand()`, copies `command.indent` into `_indent`, and calls `this["command" + command.code](command.parameters)`.
  If no method with that name exists, the command is silently skipped. When the list runs out it calls `terminate()`.
  `checkFreeze()` breaks the loop after 100000 commands in one frame.
- **Retry.** If a handler returns `false`, `_index` is *not* advanced and `update()` breaks; the same command is
  executed again next frame. Every handler returns `true` except where the tables say otherwise.
- **Waiting.** `wait(n)` sets `_waitCount` (frames, counted down by `updateWaitCount()`). `setWaitMode(mode)` sets
  `_waitMode`, checked each frame by `updateWaitMode()` until its condition is false:

  | Wait mode | Waits while |
  |---|---|
  | `"message"` | `$gameMessage.isBusy()` |
  | `"transfer"` | `$gamePlayer.isTransferring()` |
  | `"scroll"` | `$gameMap.isScrolling()` |
  | `"route"` | `character(_characterId).isMoveRouteForcing()` |
  | `"animation"` | `character(_characterId).isAnimationPlaying()` |
  | `"balloon"` | `character(_characterId).isBalloonPlaying()` |
  | `"gather"` | `$gamePlayer.areFollowersGathering()` |
  | `"action"` | `BattleManager.isActionForced()` |
  | `"video"` | `Video.isPlaying()` |
  | `"image"` | `!ImageManager.isReady()` (no core handler sets this mode; it is there for plugins) |

  A running child interpreter (from Common Event, 117) also blocks the parent through `updateChild()`.
- **Branching.** `_indent` is the indent of the command being executed. Branch-opening commands store a result in
  `_branch[_indent]` (111 stores a boolean; the Show Choices callback stores the choice index; the Battle Processing
  callback stores 0 = win, 1 = escape, 2 = lose). The branch commands at the same indent (402, 403, 411, 601–603) read
  it and call `skipBranch()`, which advances `_index` past every following command with a deeper indent.
- **Continuation codes.** Some codes are read by their parent and are never dispatched:
  401 (text line, read by 101), 405 (scrolling text line, 105), 408 (comment line, 108), 655 (script line, 355) and
  605 (shop goods, 302). When 102, 103 or 104 comes right after a 101, 101 reads it too (`setupChoices()`,
  `setupNumInput()`, `setupItemChoice()`). Other codes **are** dispatched in the normal way, because they have
  handlers: 402 (When), 403 (When Cancel), 411 (Else), 413 (Repeat Above), 601/602/603 (If Win/Escape/Lose).
  404 (end of choices), 412 (end of branch), 604 (end of battle branch), 657 (plugin command argument text) and 0
  (end of list) have no handler, so `executeCommand()` just steps past them.

## Message

| Code | Command | Handler does | Main calls | Waits / retries |
|---|---|---|---|---|
| 101 | Show Text | Sets face, background, position and speaker name, adds following 401 lines, and handles a 102/103/104 that comes right after. | `$gameMessage.setFaceImage()`, `setBackground()`, `setPositionType()`, `setSpeakerName()`, `add()`, `setupChoices()` | Returns `false` while `$gameMessage.isBusy()`; then `"message"` |
| 102 | Show Choices | Shows choices on their own; the callback stores the chosen index in `_branch[_indent]`. | `setupChoices()` | `false` while busy; `"message"` |
| 402 | When [choice] | Skips its block unless `_branch[_indent] === params[0]`. | `skipBranch()` | — |
| 403 | When Cancel | Skips its block unless a cancel happened (branch value < 0). | `skipBranch()` | — |
| 103 | Input Number | Asks for a number; params[0] is the variable ID, params[1] the number of digits. | `setupNumInput()` → `$gameMessage.setNumberInput()` | `false` while busy; `"message"` |
| 104 | Select Item | Opens item selection; params[0] is the variable, params[1] the item type (default 2). | `setupItemChoice()` → `$gameMessage.setItemChoice()` | `false` while busy; `"message"` |
| 105 | Show Scrolling Text | Sets speed and no-fast flag, adds following 405 lines. | `$gameMessage.setScroll()`, `$gameMessage.add()` | `false` while busy; `"message"` |

## Game Progression

| Code | Command | Handler does | Main calls | Waits / retries |
|---|---|---|---|---|
| 121 | Control Switches | Sets switches params[0]..params[1] to ON (params[2] = 0) or OFF. | `$gameSwitches.setValue()` | — |
| 122 | Control Variables | Gets an operand (constant, variable, random, game data or script) and applies set/add/sub/mul/div/mod to a range of variables. | `gameDataOperand()`, `operateVariable()`, `$gameVariables.setValue()`, `Math.randomInt()` | — |
| 123 | Control Self Switch | Sets self switch params[0] of the current event (only if `_eventId > 0`). | `$gameSelfSwitches.setValue()` | — |
| 124 | Control Timer | Starts the timer for params[1] seconds (× 60 frames), or stops it. | `$gameTimer.start()`, `$gameTimer.stop()` | — |

## Flow Control

| Code | Command | Handler does | Main calls | Waits / retries |
|---|---|---|---|---|
| 111 | Conditional Branch | Checks one condition (switch, variable, self switch, timer, actor, enemy, character, gold, item, weapon, armor, button, script, vehicle), stores it in `_branch[_indent]` and skips the block if false. | `$gameSwitches.value()`, `$gameVariables.value()`, `$gameParty.hasItem()`, `Input.isPressed()`, `character()`, `eval()`, `skipBranch()` | — |
| 411 | Else | Skips the Else block unless the branch result is `false`. | `skipBranch()` | — |
| 112 | Loop | Does nothing; marks the start of the loop. | — | — |
| 413 | Repeat Above | Moves `_index` back to the previous command at the same indent (the 112). | `currentCommand()` | — |
| 113 | Break Loop | Scans forward to the matching 413, counting nested 112s. | `currentCommand()` | — |
| 115 | Exit Event Processing | Sets `_index` to the list length so the interpreter terminates. | — | — |
| 117 | Common Event | Runs common event params[0] in a child interpreter (depth + 1; over 100 throws). | `setupChild()`, `$dataCommonEvents` | Parent blocks via `updateChild()` until the child ends |
| 118 | Label | Does nothing; target for 119. | — | — |
| 119 | Jump to Label | Finds the first 118 with the same name and jumps there, clearing `_branch` for indents it crosses. | `jumpTo()` | — |
| 108 | Comment | Stores the comment and following 408 lines in `_comments`. | `nextEventCode()` | — |
| 109 | Skip | Skips the following deeper-indented block (no editor command adds it). | `skipBranch()` | — |

## Party

| Code | Command | Handler does | Main calls | Waits / retries |
|---|---|---|---|---|
| 125 | Change Gold | Adds or subtracts gold (constant or variable). | `operateValue()`, `$gameParty.gainGold()` | — |
| 126 | Change Items | Adds or removes item params[0]. | `operateValue()`, `$gameParty.gainItem()` | — |
| 127 | Change Weapons | Adds or removes a weapon; params[4] includes equipped ones. | `operateValue()`, `$gameParty.gainItem()` | — |
| 128 | Change Armors | Adds or removes an armor; params[4] includes equipped ones. | `operateValue()`, `$gameParty.gainItem()` | — |
| 129 | Change Party Member | Adds an actor (re-initialized with `setup()` if params[2]) or removes it. | `$gameActors.actor()`, `Game_Actor.setup()`, `$gameParty.addActor()`, `$gameParty.removeActor()` | — |

## Actor

Most actor commands target "fixed actor or variable" via `iterateActorEx()` (actor ID 0 = whole party).

| Code | Command | Handler does | Main calls | Waits / retries |
|---|---|---|---|---|
| 311 | Change HP | Changes HP; params[5] allows death, otherwise HP stays at least 1. | `operateValue()`, `iterateActorEx()`, `changeHp()` | — |
| 312 | Change MP | Changes MP. | `operateValue()`, `iterateActorEx()`, `gainMp()` | — |
| 326 | Change TP | Changes TP. | `operateValue()`, `iterateActorEx()`, `gainTp()` | — |
| 313 | Change State | Adds or removes a state; plays collapse if the actor just died. | `iterateActorEx()`, `addState()`, `removeState()`, `performCollapse()`, `clearResult()` | — |
| 314 | Recover All | Fully restores the actor(s). | `iterateActorEx()`, `recoverAll()` | — |
| 315 | Change EXP | Changes EXP; params[5] shows level-up message. | `operateValue()`, `iterateActorEx()`, `changeExp()`, `currentExp()` | — |
| 316 | Change Level | Changes level; params[5] shows level-up message. | `operateValue()`, `iterateActorEx()`, `changeLevel()` | — |
| 317 | Change Parameter | Adds to base parameter params[2]. | `operateValue()`, `iterateActorEx()`, `addParam()` | — |
| 318 | Change Skill | Learns or forgets skill params[3]. | `iterateActorEx()`, `learnSkill()`, `forgetSkill()` | — |
| 319 | Change Equipment | Equips item params[2] in equipment type params[1]. | `$gameActors.actor()`, `changeEquipById()` | — |
| 320 | Change Name | Sets the actor's name. | `setName()` | — |
| 321 | Change Class | Changes class; params[2] keeps EXP. | `changeClass()` | — |
| 324 | Change Nickname | Sets the nickname. | `setNickname()` | — |
| 325 | Change Profile | Sets the profile text. | `setProfile()` | — |

## Movement

| Code | Command | Handler does | Main calls | Waits / retries |
|---|---|---|---|---|
| 201 | Transfer Player | Reserves a transfer to a map/x/y (direct or variables) with direction and fade type. | `$gamePlayer.reserveTransfer()`, `$gameVariables.value()` | `false` while in battle or `$gameMessage.isBusy()`; then `"transfer"` |
| 202 | Set Vehicle Location | Moves vehicle params[0] to a map/x/y. | `$gameMap.vehicle()`, `setLocation()` | — |
| 203 | Set Event Location | Places a character at x/y (direct or variables) or swaps it with another event; optional direction. | `character()`, `locate()`, `swap()`, `setDirection()` | — |
| 204 | Scroll Map | Starts a map scroll (direction, distance, speed); no effect in battle. | `$gameMap.startScroll()`, `$gameMap.isScrolling()` | If already scrolling: `"scroll"` and returns `false`; params[3] → `"scroll"` |
| 205 | Set Movement Route | Forces a move route on a character and stores its ID in `_characterId`. | `$gameMap.refreshIfNeeded()`, `character()`, `forceMoveRoute()` | `"route"` if `route.wait` |
| 206 | Get on/off Vehicle | Boards or leaves a vehicle. | `$gamePlayer.getOnOffVehicle()` | — |

## Character

| Code | Command | Handler does | Main calls | Waits / retries |
|---|---|---|---|---|
| 211 | Change Transparency | Makes the player transparent (params[0] = 0) or visible. | `$gamePlayer.setTransparent()` | — |
| 216 | Change Player Followers | Shows or hides followers. | `$gamePlayer.showFollowers()`, `hideFollowers()`, `refresh()` | — |
| 217 | Gather Followers | Gathers followers onto the player (map only). | `$gamePlayer.gatherFollowers()` | `"gather"` |
| 212 | Show Animation | Plays animation params[1] on a character. | `character()`, `$gameTemp.requestAnimation()` | `"animation"` if params[2] |
| 213 | Show Balloon Icon | Shows balloon params[1] above a character. | `character()`, `$gameTemp.requestBalloon()` | `"balloon"` if params[2] |
| 214 | Erase Event | Erases the running event (only on its own map). | `$gameMap.eraseEvent()` | — |

## Picture

| Code | Command | Handler does | Main calls | Waits / retries |
|---|---|---|---|---|
| 231 | Show Picture | Shows picture params[0] with origin, position, scale, opacity, blend mode. | `picturePoint()`, `$gameScreen.showPicture()` | — |
| 232 | Move Picture | Moves/scales/fades a picture over params[10] frames with easing params[12]. | `picturePoint()`, `$gameScreen.movePicture()` | `wait(params[10])` if params[11] |
| 233 | Rotate Picture | Sets rotation speed. | `$gameScreen.rotatePicture()` | — |
| 234 | Tint Picture | Tints a picture over params[2] frames. | `$gameScreen.tintPicture()` | `wait(params[2])` if params[3] |
| 235 | Erase Picture | Erases a picture. | `$gameScreen.erasePicture()` | — |

## Timing

| Code | Command | Handler does | Main calls | Waits / retries |
|---|---|---|---|---|
| 230 | Wait | Waits params[0] frames. | `wait()` | `wait(params[0])` |

## Screen

| Code | Command | Handler does | Main calls | Waits / retries |
|---|---|---|---|---|
| 221 | Fadeout Screen | Fades the screen out at `fadeSpeed()` (24 frames). | `$gameScreen.startFadeOut()`, `fadeSpeed()` | `false` while message busy; `wait(24)` |
| 222 | Fadein Screen | Fades the screen in at `fadeSpeed()`. | `$gameScreen.startFadeIn()`, `fadeSpeed()` | `false` while message busy; `wait(24)` |
| 223 | Tint Screen | Tints the screen over params[1] frames. | `$gameScreen.startTint()` | `wait(params[1])` if params[2] |
| 224 | Flash Screen | Flashes a color over params[1] frames. | `$gameScreen.startFlash()` | `wait(params[1])` if params[2] |
| 225 | Shake Screen | Shakes with power, speed, duration. | `$gameScreen.startShake()` | `wait(params[2])` if params[3] |
| 236 | Set Weather Effect | Changes weather type/power over params[2] frames (map only). | `$gameScreen.changeWeather()` | `wait(params[2])` if params[3] |

## Audio & Video

| Code | Command | Handler does | Main calls | Waits / retries |
|---|---|---|---|---|
| 241 | Play BGM | Plays BGM. | `AudioManager.playBgm()` | — |
| 242 | Fadeout BGM | Fades out BGM over params[0] seconds. | `AudioManager.fadeOutBgm()` | — |
| 243 | Save BGM | Stores the current BGM. | `$gameSystem.saveBgm()` | — |
| 244 | Resume BGM | Replays the saved BGM. | `$gameSystem.replayBgm()` | — |
| 245 | Play BGS | Plays BGS. | `AudioManager.playBgs()` | — |
| 246 | Fadeout BGS | Fades out BGS. | `AudioManager.fadeOutBgs()` | — |
| 249 | Play ME | Plays ME. | `AudioManager.playMe()` | — |
| 250 | Play SE | Plays SE. | `AudioManager.playSe()` | — |
| 251 | Stop SE | Stops all SE. | `AudioManager.stopSe()` | — |
| 261 | Play Movie | Plays `movies/<name>` as `.webm` or `.mp4`. | `videoFileExt()`, `Utils.canPlayWebm()`, `Video.play()` | `false` while message busy; `"video"` if a name is set |

## Scene Control

| Code | Command | Handler does | Main calls | Waits / retries |
|---|---|---|---|---|
| 301 | Battle Processing | Picks a troop (direct, variable or random encounter), sets up the battle and pushes `Scene_Battle`; the callback stores the result in `_branch[_indent]`. No effect in battle. | `$gamePlayer.makeEncounterTroopId()`, `BattleManager.setup()`, `BattleManager.setEventCallback()`, `$gamePlayer.makeEncounterCount()`, `SceneManager.push()` | Loop stops on scene change |
| 601 | If Win | Skips its block unless the result is 0. | `skipBranch()` | — |
| 602 | If Escape | Skips its block unless the result is 1. | `skipBranch()` | — |
| 603 | If Lose | Skips its block unless the result is 2. | `skipBranch()` | — |
| 302 | Shop Processing | Collects goods from itself and following 605s, pushes `Scene_Shop`; params[4] = purchase only. | `SceneManager.push()`, `SceneManager.prepareNextScene()` | Loop stops on scene change |
| 303 | Name Input Processing | Pushes `Scene_Name` for actor params[0] with max length params[1]. | `SceneManager.push()`, `SceneManager.prepareNextScene()` | Loop stops on scene change |
| 351 | Open Menu Screen | Pushes `Scene_Menu` and resets the menu cursor (map only). | `SceneManager.push()`, `Window_MenuCommand.initCommandPosition()` | Loop stops on scene change |
| 352 | Open Save Screen | Pushes `Scene_Save` (map only). | `SceneManager.push()` | Loop stops on scene change |
| 353 | Game Over | Goes to `Scene_Gameover`. | `SceneManager.goto()` | Loop stops on scene change |
| 354 | Return to Title Screen | Goes to `Scene_Title`. | `SceneManager.goto()` | Loop stops on scene change |

## System Settings

| Code | Command | Handler does | Main calls | Waits / retries |
|---|---|---|---|---|
| 132 | Change Battle BGM | Sets the battle BGM. | `$gameSystem.setBattleBgm()` | — |
| 133 | Change Victory ME | Sets the victory ME. | `$gameSystem.setVictoryMe()` | — |
| 139 | Change Defeat ME | Sets the defeat ME. | `$gameSystem.setDefeatMe()` | — |
| 140 | Change Vehicle BGM | Sets a vehicle's BGM. | `$gameMap.vehicle()`, `setBgm()` | — |
| 134 | Change Save Access | Disables (params[0] = 0) or enables saving. | `$gameSystem.disableSave()`, `enableSave()` | — |
| 135 | Change Menu Access | Disables or enables the menu. | `$gameSystem.disableMenu()`, `enableMenu()` | — |
| 136 | Change Encounter | Disables or enables encounters and resets the encounter count. | `$gameSystem.disableEncounter()`, `enableEncounter()`, `$gamePlayer.makeEncounterCount()` | — |
| 137 | Change Formation Access | Disables or enables formation. | `$gameSystem.disableFormation()`, `enableFormation()` | — |
| 138 | Change Window Color | Sets the window tone. | `$gameSystem.setWindowTone()` | — |
| 322 | Change Actor Images | Sets character, face and battler images, then refreshes the player. | `setCharacterImage()`, `setFaceImage()`, `setBattlerImage()`, `$gamePlayer.refresh()` | — |
| 323 | Change Vehicle Image | Sets a vehicle's character image. | `$gameMap.vehicle()`, `setImage()` | — |

## Map

| Code | Command | Handler does | Main calls | Waits / retries |
|---|---|---|---|---|
| 281 | Change Map Name Display | Enables (params[0] = 0) or disables the map name display. | `$gameMap.enableNameDisplay()`, `disableNameDisplay()` | — |
| 282 | Change Tileset | Loads the new tileset images, then switches tileset. | `ImageManager.loadTileset()`, `$gameMap.changeTileset()` | Returns `false` until all tileset bitmaps are ready |
| 283 | Change Battle Background | Sets the battleback images. | `$gameMap.changeBattleback()` | — |
| 284 | Change Parallax | Sets the parallax image, loop flags and scroll speed. | `$gameMap.changeParallax()` | — |
| 285 | Get Location Info | Stores terrain tag, event ID, tile ID (layer 1–4) or region ID at a location in variable params[0]. | `$gameMap.terrainTag()`, `eventIdXy()`, `tileId()`, `regionId()`, `$gameVariables.setValue()` | — |

## Battle

Enemy commands use `iterateEnemyIndex()` (index < 0 = whole troop). Outside battle `$gameTroop.members()` is
usually empty, so they do nothing in practice.

| Code | Command | Handler does | Main calls | Waits / retries |
|---|---|---|---|---|
| 331 | Change Enemy HP | Changes enemy HP; params[4] allows death. | `operateValue()`, `iterateEnemyIndex()`, `changeHp()` | — |
| 332 | Change Enemy MP | Changes enemy MP. | `operateValue()`, `iterateEnemyIndex()`, `gainMp()` | — |
| 342 | Change Enemy TP | Changes enemy TP. | `operateValue()`, `iterateEnemyIndex()`, `gainTp()` | — |
| 333 | Change Enemy State | Adds or removes a state; collapses newly dead enemies. | `iterateEnemyIndex()`, `addState()`, `removeState()`, `performCollapse()`, `clearResult()` | — |
| 334 | Enemy Recover All | Fully restores enemies. | `iterateEnemyIndex()`, `recoverAll()` | — |
| 335 | Enemy Appear | Makes hidden enemies appear and renames duplicates. | `iterateEnemyIndex()`, `appear()`, `$gameTroop.makeUniqueNames()` | — |
| 336 | Enemy Transform | Turns enemies into enemy params[1]. | `iterateEnemyIndex()`, `transform()`, `$gameTroop.makeUniqueNames()` | — |
| 337 | Show Battle Animation | Plays an animation on living enemies (params[2] = all). | `iterateEnemyIndex()`, `$gameTemp.requestAnimation()` | — |
| 339 | Force Action | Forces a battler (enemy index or actor ID) to use skill params[2] on target params[3]; battle only. | `iterateBattler()`, `isDeathStateAffected()`, `forceAction()`, `BattleManager.forceAction()` | `"action"` |
| 340 | Abort Battle | Ends the battle. | `BattleManager.abort()` | — |

## Advanced

| Code | Command | Handler does | Main calls | Waits / retries |
|---|---|---|---|---|
| 355 | Script | Joins its line and following 655 lines and evaluates them. | `currentCommand()`, `nextEventCode()`, `eval()` | — |
| 356 | Plugin Command MV (deprecated) | Splits the text into command and args and calls an empty stub. | `pluginCommand()` | — |
| 357 | Plugin Command | Calls a registered MZ plugin command (plugin name, command name params[1], args params[3]). | `Utils.extractFileName()`, `PluginManager.callCommand()` | — |

## Helpers

| Helper | Purpose |
|---|---|
| `character(param)` | `null` in battle; `$gamePlayer` for -1; the event `param` (0 = this event) on the current map. |
| `iterateActorId(param, cb)` | Calls `cb` for actor `param`, or for every party member if 0. |
| `iterateActorEx(p1, p2, cb)` | Like `iterateActorId()`, with `p2` read as an actor ID (p1 = 0) or as a variable ID holding it. |
| `iterateActorIndex(param, cb)` | Calls `cb` for party member at index `param`, or all if < 0 (no core handler uses it). |
| `iterateEnemyIndex(param, cb)` | Calls `cb` for troop member at index `param`, or all if < 0. |
| `iterateBattler(p1, p2, cb)` | Battle only: enemies by index (p1 = 0) or actors by ID. |
| `operateValue(op, type, operand)` | Constant or variable value, negated if `op` is 1 (decrease). |
| `operateVariable(id, opType, value)` | Applies set/add/sub/mul/div/mod to a variable; sets 0 on exception. |
| `gameDataOperand(type, p1, p2)` | "Game Data" operand of 122 (items, actor/enemy stats, character position, party, last action, other). |
| `changeHp(target, value, allowDeath)` | Changes HP of a living battler; keeps 1 HP unless `allowDeath`; calls `performCollapse()` on death. |
| `setupChoices(params)` | Sets up choices, default/cancel, position and background, with a callback that writes `_branch[_indent]`. |
| `setupNumInput(params)` | `$gameMessage.setNumberInput(variableId, digits)`. |
| `setupItemChoice(params)` | `$gameMessage.setItemChoice(variableId, itemType)`. |
| `setupChild(list, eventId)` | Creates a child `Game_Interpreter` at depth + 1 and sets it up. |
| `picturePoint(params)` | Returns a `Point` from params[4]/[5], direct or from variables (params[3]). |
| `skipBranch()` | Advances past all following commands with a deeper indent. |
| `jumpTo(index)` | Moves `_index`, clearing `_branch` for indents crossed. |
| `nextEventCode()` / `currentCommand()` | Peek at the next code / return the current command. |
| `wait(n)` / `setWaitMode(mode)` / `fadeSpeed()` | Frame wait / mode wait / fade duration (24). |
| `videoFileExt()` | `.webm` if `Utils.canPlayWebm()`, else `.mp4`. |
| `pluginCommand()` | Empty stub kept for MV plugins (356). |
