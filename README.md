# RPG Maker MZ Mermaid Diagrams

This repository contains UML-like Mermaid diagrams (`.mmd`) for understanding RPG Maker MZ's core.
All diagrams are based on the v1.10.0 engine code in [`Corescript/js/`](Corescript/js/) and use its real class, method and field names.

## Suggested reading order

1. Startup: `main-bootstrap` → `scenemanager-run` → `scene-boot-new-game`
2. The frame loop: `scenemanager-gameloop` → `scenemanager-scene-change` → `scene-map-update`
3. Events: `game-interpreter-update` → `show-text-message` → [event command reference](reference/event-commands.md)
4. Any topic below as needed

## Sequence diagrams

### Engine core

| Diagram | Flow |
|---|---|
| [main-bootstrap](sequence-diagrams/main-bootstrap.mmd) | `main.js` loads the engine scripts and plugins, then calls `SceneManager.run(Scene_Boot)` |
| [scenemanager-run](sequence-diagrams/scenemanager-run.mmd) | `SceneManager.run()` initializes graphics, audio, input and event handlers and starts the game loop |
| [scenemanager-gameloop](sequence-diagrams/scenemanager-gameloop.mmd) | The per-frame loop from the PIXI ticker through `SceneManager.updateMain()`, with error handling and retry |
| [scenemanager-scene-change](sequence-diagrams/scenemanager-scene-change.mmd) | `goto` / `push` / `pop` → old scene stops and terminates → new scene is created and started |
| [plugin-loading](sequence-diagrams/plugin-loading.mmd) | `PluginManager.setup` loads plugin scripts, reports load errors and dispatches plugin commands |
| [input-polling](sequence-diagrams/input-polling.mmd) | `Input` and `TouchInput` collect DOM events and turn them into per-frame state and queries |
| [imagemanager-load-bitmap](sequence-diagrams/imagemanager-load-bitmap.mmd) | `ImageManager` cache → `Bitmap.load` → load listeners → sprite refresh, and `isReady()` gating scenes |
| [audio-playback](sequence-diagrams/audio-playback.mmd) | Play BGM / SE commands → `AudioManager` → `WebAudio` loading, decoding and playback |
| [config-manager](sequence-diagrams/config-manager.mmd) | `ConfigManager` loads at boot, is edited in the Options screen and saved through `StorageManager` |
| [datamanager-save-load](sequence-diagrams/datamanager-save-load.mmd) | `Scene_Save` / `Scene_Load` → `DataManager` → `StorageManager` (JsonEx, pako, fs / localforage) |
| [autosave](sequence-diagrams/autosave.mmd) | `Scene_Base.requestAutosave` → `DataManager.saveGame(0)` after transfers and battles |
| [window-lifecycle](sequence-diagrams/window-lifecycle.mmd) | A `Window` from creation through windowskin loading, open/close, drawing and `WindowLayer` rendering |
| [sprite-gauge](sequence-diagrams/sprite-gauge.mmd) | `Window_StatusBase.placeGauge` and how `Sprite_Gauge` animates and redraws HP/MP/TP/time gauges |
| [video-playback](sequence-diagrams/video-playback.mmd) | Play Movie → `Video.play` → load, visibility and end, and the interpreter's video wait |
| [effekseer-setup](sequence-diagrams/effekseer-setup.mmd) | Effekseer runtime and context setup, `EffectManager` loading, per-frame update and rendering hooks |

### Scenes and menus

| Diagram | Flow |
|---|---|
| [scene-boot-new-game](sequence-diagrams/scene-boot-new-game.mmd) | `Scene_Boot` loads the database, fonts and config → title → New Game → `setupNewGame` |
| [scene-menu](sequence-diagrams/scene-menu.mmd) | Calling the menu from the map, personal commands to Skill / Equip / Status, and `popScene` |
| [scene-item-use](sequence-diagrams/scene-item-use.mmd) | Choosing and using an item on actors in `Scene_Item`, including common event reservation |
| [scene-equip](sequence-diagrams/scene-equip.mmd) | Slot and item selection, status preview with a temp actor, and `Game_Actor.changeEquip` |
| [scene-shop-buy](sequence-diagrams/scene-shop-buy.mmd) | `Scene_Shop` purchase: how the bought item lands in `$gameParty` |
| [gameover-and-title](sequence-diagrams/gameover-and-title.mmd) | Routes to `Scene_Gameover` and back to `Scene_Title` |
| [window-selectable-input](sequence-diagrams/window-selectable-input.mmd) | How `Window_Selectable` turns keyboard, gamepad and touch input into handler calls |
| [scene-title-and-splash](sequence-diagrams/scene-title-and-splash.mmd) | `Scene_Splash` → `Scene_Title`: background, command window, New Game / Continue / Options |
| [scene-shop](sequence-diagrams/scene-shop.mmd) | Shop Processing: goods setup, buy and sell paths, `Window_ShopNumber`, `doBuy` / `doSell` |
| [scene-skill](sequence-diagrams/scene-skill.mmd) | `Scene_Skill`: skill types, usable skills, actor switching and paying the skill cost |
| [scene-status-and-name](sequence-diagrams/scene-status-and-name.mmd) | `Scene_Status` actor switching, and Name Input Processing through `Scene_Name` |
| [scene-debug](sequence-diagrams/scene-debug.mmd) | The F9 debug scene for editing switches and variables during playtest |

### Map and events

| Diagram | Flow |
|---|---|
| [scene-map-update](sequence-diagrams/scene-map-update.mmd) | One `Scene_Map.update` frame: map, events, player movement and event triggers |
| [scene-map-transfer](sequence-diagrams/scene-map-transfer.mmd) | Transfer Player → fade out → new `Scene_Map` loads the map → `performTransfer` |
| [game-interpreter-update](sequence-diagrams/game-interpreter-update.mmd) | `Game_Interpreter` setup and its `update` / `executeCommand` loop, waits and child interpreters |
| [event-page-refresh](sequence-diagrams/event-page-refresh.mmd) | `Game_Map.refresh` → `Game_Event.refresh` → choosing and applying the active event page |
| [common-events](sequence-diagrams/common-events.mmd) | Reserved, autorun and parallel common events |
| [move-route](sequence-diagrams/move-route.mmd) | Set Movement Route and custom move routes, step by step |
| [followers](sequence-diagrams/followers.mmd) | `Game_Followers` refresh, chasing the player and gathering |
| [vehicles](sequence-diagrams/vehicles.mmd) | Getting on, driving and getting off boats, ships and the airship |
| [timer](sequence-diagrams/timer.mmd) | Control Timer → `Game_Timer` countdown → expiry and `Sprite_Timer` |
| [map-passability](sequence-diagrams/map-passability.mmd) | `canPass` → tile passage flags, vehicles and character collisions |
| [touch-destination-pathfinding](sequence-diagrams/touch-destination-pathfinding.mmd) | Clicking the map → `setDestination` → `findDirectionTo` path search → arrival triggers |
| [encounter-steps](sequence-diagrams/encounter-steps.mmd) | The random-encounter step counter and how a troop is picked |

### Messages and text

| Diagram | Flow |
|---|---|
| [show-text-message](sequence-diagrams/show-text-message.mmd) | Show Text → `$gameMessage` → `Window_Message` → `$gameMessage.clear()` |
| [message-choices-input](sequence-diagrams/message-choices-input.mmd) | Show Choices, Input Number and Select Item through the message sub-windows |
| [window-text-escape-codes](sequence-diagrams/window-text-escape-codes.mmd) | `drawTextEx` and how escape codes are converted and processed |
| [message-scroll-text](sequence-diagrams/message-scroll-text.mmd) | Show Scrolling Text → `Window_ScrollText` scrolling, fast forward and termination |

### Rendering and screen

| Diagram | Flow |
|---|---|
| [spriteset-map-render](sequence-diagrams/spriteset-map-render.mmd) | `Spriteset_Map`, `Tilemap` and `Sprite_Character` creation and per-frame drawing |
| [show-picture](sequence-diagrams/show-picture.mmd) | Show / Move / Erase Picture → `Game_Picture` → `Sprite_Picture` |
| [screen-effects](sequence-diagrams/screen-effects.mmd) | Tint, flash, shake and weather from `Game_Screen` to the spriteset |
| [animation-playback](sequence-diagrams/animation-playback.mmd) | Animation requests → `Sprite_Animation` (Effekseer) / `Sprite_AnimationMV`, and balloons |

### Battle

| Diagram | Flow |
|---|---|
| [battle-start](sequence-diagrams/battle-start.mmd) | Random encounter or Battle Processing → `BattleManager.setup` → encounter effect → `Scene_Battle` |
| [battle-turn](sequence-diagrams/battle-turn.mmd) | Turn-based phases: input, action order, action execution, turn end and battle end |
| [battle-tpb](sequence-diagrams/battle-tpb.mmd) | Time-progress battle: charge, cast, action queueing and actor input |
| [damage-popup](sequence-diagrams/damage-popup.mmd) | `Game_ActionResult` → `Window_BattleLog` → `Sprite_Damage` |
| [battle-escape](sequence-diagrams/battle-escape.mmd) | Escape command and escape effects → success or failure → battle end |
| [battle-enemy-actions](sequence-diagrams/battle-enemy-actions.mmd) | How enemies choose actions from their action patterns, and auto-battle / confused actors |
| [battle-forced-action](sequence-diagrams/battle-forced-action.mmd) | Force Action → `BattleManager.forceAction` → `processForcedAction` |
| [states-and-buffs](sequence-diagrams/states-and-buffs.mmd) | Adding, counting down and removing states and buffs, and how they are shown |
| [skill-cost-and-usability](sequence-diagrams/skill-cost-and-usability.mmd) | `canUse` checks, where windows call them, and paying skill costs / consuming items |
| [exp-and-level-up](sequence-diagrams/exp-and-level-up.mmd) | EXP rewards and Change EXP / Level / Class → `changeExp` → level up and learned skills |
| [actor-params-and-traits](sequence-diagrams/actor-params-and-traits.mmd) | How `param()`, `xparam()` and `sparam()` are computed from base values, equipment and traits |

## Class diagrams

- `class-diagrams/<group>.mmd`: overview of one group (managers, objects, scenes, sprites, windows) with inheritance and key ownership links only.
- `class-diagrams/<group>/<group>-hierarchy.mmd`: the inheritance tree of the group.
- `class-diagrams/<group>/<Class>.mmd`: every field and method of one class.

## Reference

- [Event command reference](reference/event-commands.md): every `Game_Interpreter` command handler, what it calls and when it waits.
- [Trait codes](reference/traits.md): every trait code, how values are combined, and the param / xparam / sparam indices.
- [Item effects and damage](reference/effects.md): effect codes, hit and damage types, scopes, and the damage pipeline.
- [Text escape codes](reference/escape-codes.md): every message escape code and exactly how it is processed.
- [Plugin hooks](reference/plugin-hooks.md): commonly aliased engine methods, grouped by area, for plugin authors.
