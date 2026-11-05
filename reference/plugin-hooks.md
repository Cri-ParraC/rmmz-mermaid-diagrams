# Plugin hook guide

A practical list of the engine methods that plugins most often alias in RPG Maker MZ v1.10.0, grouped by area, with
what each one controls. Every method listed exists in [`Corescript/js/`](../Corescript/js/). For how plugins are
loaded, see [plugin-loading.mmd](../sequence-diagrams/plugin-loading.mmd).

## Load order and timing

- `main.js` loads the core scripts and `js/plugins.js` (which defines `$plugins`). When the last one has loaded,
  `Main.onScriptLoad()` calls `PluginManager.setup($plugins)`.
- `PluginManager.setup()` skips plugins with `status` false and duplicate file names; for each other plugin it calls
  `setParameters(name, plugin.parameters)` **before** `loadScript(plugin.name)` adds a `<script>` tag
  (`async = false`, so plugins run in list order). Load failures are collected by `onError()` and thrown later by
  `SceneManager.checkPluginErrors()` → `PluginManager.checkErrors()`.
- Plugin code therefore runs after every core class is defined but before `SceneManager.run(Scene_Boot)` creates any
  scene, and before the database (`$dataXxx`) is loaded. Code that needs the database belongs in an alias of
  `Scene_Boot.prototype.onDatabaseLoaded` or later, not at the top level of the plugin.

## The aliasing pattern

```js
(() => {
    const pluginName = "MyPlugin"; // must match the file name js/plugins/MyPlugin.js
    const params = PluginManager.parameters(pluginName);
    const bonus = Number(params["bonus"] || 0);

    // Keep the original and call it, so other plugins that alias the same method still work.
    const _Game_Actor_paramPlus = Game_Actor.prototype.paramPlus;
    Game_Actor.prototype.paramPlus = function(paramId) {
        return _Game_Actor_paramPlus.call(this, paramId) + (paramId === 2 ? bonus : 0);
    };

    // Static methods are aliased the same way, without .prototype.
    const _DataManager_createGameObjects = DataManager.createGameObjects;
    DataManager.createGameObjects = function() {
        _DataManager_createGameObjects.call(this);
        // create extra global objects here
    };

    PluginManager.registerCommand(pluginName, "addBonus", function(args) {
        // `this` is the Game_Interpreter running the command; args values are strings.
        $gameVariables.setValue(Number(args.variableId), Number(args.amount));
    });
})();
```

Notes from the code:

- `PluginManager.parameters(name)` returns `this._parameters[name.toLowerCase()] || {}`, so the lookup is
  case-insensitive and a wrong name silently gives `{}`. Values are the strings stored in `plugins.js`; structs and
  arrays (`@type struct<...>`, `@type number[]`) arrive as JSON strings and need `JSON.parse()`.
- `PluginManager.registerCommand(pluginName, commandName, func)` stores `func` under the key
  `pluginName + ":" + commandName`. This key is **not** lower-cased.
- Event command 357 (`Game_Interpreter.command357`) calls
  `PluginManager.callCommand(this, Utils.extractFileName(params[0]), params[1], params[3])`, which does
  `func.bind(self)(args)` only if the key exists; an unknown command is ignored without error.
- `Game_Interpreter.prototype.pluginCommand` (code 356, the MV-style text command) is an empty stub that MV plugins
  can still alias.
- Prefer `return original.call(this, ...)` / `original.apply(this, arguments)` over replacing a method. A plain
  replacement breaks every plugin loaded before yours that aliased it.

## Scene lifecycle

`SceneManager.updateMain()` runs `changeScene()` (calls `terminate()` on the old scene and `create()` on the new one)
then `updateScene()` (waits for `isReady()`, then calls `start()` once, then `update()` every frame).
Diagrams: [scenemanager-scene-change.mmd](../sequence-diagrams/scenemanager-scene-change.mmd),
[scenemanager-gameloop.mmd](../sequence-diagrams/scenemanager-gameloop.mmd),
[scene-boot-new-game.mmd](../sequence-diagrams/scene-boot-new-game.mmd).

| Method | When it is called | What aliasing it affects |
|---|---|---|
| `Scene_Base.prototype.create` | Once, by `SceneManager.changeScene()` right after the scene becomes current. | Where scenes build sprites and windows (subclasses call `createDisplayObjects()` / `createAllWindows()` from here or from `onMapLoaded()`). |
| `Scene_Base.prototype.isReady` | Every frame until it returns true, before `start()`. | Return false to keep the scene waiting (e.g. for your own bitmaps). Base checks `ImageManager`, `EffectManager`, `FontManager`. |
| `Scene_Base.prototype.start` | Once, when `isReady()` first returns true. | Fade-in and first-frame setup. |
| `Scene_Base.prototype.update` | Every frame while the scene is started and the game is active. | Per-frame logic of any scene; subclasses call it via `Scene_Message`/`Scene_MenuBase`. |
| `Scene_Base.prototype.stop` | When `SceneManager.goto/push/pop` asks the scene to leave. | Start of the fade-out; `isActive()` becomes false. |
| `Scene_Base.prototype.terminate` | Once, by `changeScene()` before the next scene's `create()`. | Cleanup; `Scene_Map.terminate()` takes the menu background snapshot here. |
| `SceneManager.goto` / `push` / `pop` | When code requests a scene change. | Redirect scene changes globally (e.g. replace `Scene_Title`). |
| `SceneManager.onSceneStart` | After every scene's `start()`. | Global "scene started" hook. |
| `Scene_Boot.prototype.onDatabaseLoaded` | Once, from `Scene_Boot.isReady()` when all `$dataXxx` files are loaded. | Parse notetags / `meta` of the database, preload images. |
| `Scene_Boot.prototype.start` | After the boot scene is ready. | Choose the first scene (battle test, event test, title skip, `startNormalGame()`). |
| `Scene_Title.prototype.createCommandWindow` | During `Scene_Title.create()`. | Add handlers for extra title commands (together with `Window_TitleCommand.prototype.makeCommandList`). |
| `Scene_Title.prototype.commandNewGame` | When "New Game" is chosen. | `DataManager.setupNewGame()`, then `SceneManager.goto(Scene_Map)`. |
| `Scene_Menu.prototype.createCommandWindow` | During `Scene_Menu.create()`. | `setHandler()` for menu commands; add handlers for commands added in `addOriginalCommands()`. |
| `DataManager.extractMetadata` | For every database object (and map) as it is loaded, via `DataManager.onLoad()`. | Builds `data.meta` from `<key>` / `<key:value>` tags in `note`. |

## Map update

Diagrams: [scene-map-update.mmd](../sequence-diagrams/scene-map-update.mmd),
[scene-map-transfer.mmd](../sequence-diagrams/scene-map-transfer.mmd),
[event-page-refresh.mmd](../sequence-diagrams/event-page-refresh.mmd),
[game-interpreter-update.mmd](../sequence-diagrams/game-interpreter-update.mmd),
[common-events.mmd](../sequence-diagrams/common-events.mmd),
[spriteset-map-render.mmd](../sequence-diagrams/spriteset-map-render.mmd).

| Method | When it is called | What aliasing it affects |
|---|---|---|
| `Scene_Map.prototype.onMapLoaded` | From `Scene_Map.isReady()` once `$dataMap` is loaded. | Runs `performTransfer()` (if transferring) and `createDisplayObjects()`; `$dataMap` is available here. |
| `Scene_Map.prototype.createAllWindows` | From `createDisplayObjects()`. | Add map windows (HUDs); call the original so message windows exist. |
| `Scene_Map.prototype.createSpriteset` | From `createDisplayObjects()`. | Replace or extend `Spriteset_Map`. |
| `Scene_Map.prototype.update` | Every map frame. | Map-scene logic (menu button, map name, `updateMainMultiply()`, `updateScene()`). |
| `Scene_Map.prototype.updateMain` | Once per frame, twice while fast-forwarding. | Updates `$gameMap`, `$gamePlayer`, `$gameTimer`, `$gameScreen`; game-logic code placed here runs at fast-forward speed too. |
| `Scene_Map.prototype.updateScene` | Every frame while `isSceneChangeOk()`. | Checks game over, transfer, encounter, menu call and debug call in that order. |
| `Scene_Map.prototype.isMenuCalled` / `callMenu` | Menu key / menu button check and opening. | Block or replace the main menu. |
| `Scene_Map.prototype.onTransferEnd` | In `start()` after a transfer. | Map name window, `$gameMap.autoplay()`, autosave request. |
| `Game_Map.prototype.setup` | When a new map is entered (`Game_Player.performTransfer()`). | Per-map initialization; creates `Game_Event`s and parallel common events. |
| `Game_Map.prototype.update` | From `Scene_Map.updateMain()`. | Refresh, interpreter, scroll, events, vehicles, parallax. |
| `Game_Map.prototype.setupStartingEvent` | When the map interpreter is idle. | Order of reserved common events, test event, map events and autorun common events. |
| `Game_Player.prototype.update` | From `Scene_Map.updateMain()`. | Dashing, `moveByInput()`, scrolling, vehicles, encounter/trigger checks, followers. |
| `Game_Player.prototype.canMove` | From `moveByInput()`. | Lock player movement under your own conditions. |
| `Game_Player.prototype.encounterProgressValue` | Each step, from `updateEncounterCount()`. | Encounter speed (bush ×2, Encounter Half ×0.5, ship ×0.5). |
| `Game_Event.prototype.meetsConditions` | For each page, from `findProperPageIndex()`. | Add custom page conditions (e.g. from comments or notetags). |
| `Game_Event.prototype.setupPageSettings` | When the active page changes. | Read page data (image, move route, trigger, `list()`). |
| `Game_Interpreter.prototype.executeCommand` | For each command executed. | Global command hook; per-command handlers are `commandNNN` (see [event-commands.md](event-commands.md)). |
| `Game_Temp.prototype.reserveCommonEvent` | When a skill/item Common Event effect is used (`Game_Action.applyGlobal()` is its only core caller; command 117 runs a child interpreter instead). | Track or filter reserved common events. |
| `Spriteset_Map.prototype.createCharacters` | When the map spriteset is built. | Add sprites that follow characters. |

## Battle flow

Diagrams: [battle-start.mmd](../sequence-diagrams/battle-start.mmd),
[battle-turn.mmd](../sequence-diagrams/battle-turn.mmd), [battle-tpb.mmd](../sequence-diagrams/battle-tpb.mmd),
[battle-escape.mmd](../sequence-diagrams/battle-escape.mmd), [damage-popup.mmd](../sequence-diagrams/damage-popup.mmd).
Rules for the numbers: [traits.md](traits.md), [effects.md](effects.md).

| Method | When it is called | What aliasing it affects |
|---|---|---|
| `BattleManager.setup` | Before `Scene_Battle` is pushed (encounter or Battle Processing). | Troop setup, `canEscape` / `canLose`, escape ratio. |
| `BattleManager.startBattle` | From `Scene_Battle.start()`. | `onBattleStart()` for system, party and troop; start messages. |
| `BattleManager.update` | Every frame from `Scene_Battle.updateBattleProcess()`. | Runs `updateEvent()`, then `updatePhase()` (`"start"`, `"turn"`, `"action"`, `"turnEnd"`, `"battleEnd"`). |
| `BattleManager.startInput` | At the start of each turn (turn-based). | `makeActions()` for both sides; skips input on surprise or when no actor can input. |
| `BattleManager.startTurn` | After command input. | Turn counter, action order (`makeActionOrders()`), log window. |
| `BattleManager.makeActionOrders` | From `startTurn()` (turn-based). | Who acts in what order (sorted by `speed()`). |
| `BattleManager.startAction` | When a battler's action begins. | `makeTargets()`, cost payment (`useItem()`), `applyGlobal()`, log "uses X". |
| `BattleManager.invokeAction` | Once per target. | Counter / reflection / normal path. |
| `BattleManager.endTurn` / `updateTurnEnd` | At turn end. | `endAllBattlersTurn()` (turn-based) → `Game_Battler.onTurnEnd()`. |
| `BattleManager.checkBattleEnd` | After actions and events. | Win/lose/escape detection. |
| `BattleManager.processVictory` | When all enemies are dead. | Victory ME, rewards (`makeRewards()`, `displayRewards()`, `gainRewards()`). |
| `BattleManager.makeRewards` | From `processVictory()`. | `gold`, `exp` and drop `items` totals. |
| `BattleManager.processEscape` | When the party command Escape is chosen. | Escape roll: always succeeds on a preemptive turn, else `Math.random() < _escapeRatio`. |
| `BattleManager.endBattle` | Win, escape, defeat or abort. | Calls the event callback (branch 0/1/2), `$gameSystem.onBattleWin/Escape()`. |
| `Game_Action.prototype.apply` | Once per hit. | Hit/evade rolls, damage, effects. |
| `Game_Action.prototype.makeDamageValue` | From `apply()` and AI `evaluate()`. | Final damage number. |
| `Game_Action.prototype.evalDamageFormula` | From `makeDamageValue()`. | Formula evaluation and its variables. |
| `Game_Action.prototype.executeDamage` | From `apply()` when damage type > 0. | How damage is applied to HP/MP. |
| `Game_Action.prototype.applyItemEffect` | Once per effect per hit. | Add custom effect codes (`effect.code`). |
| `Game_Battler.prototype.onBattleStart` / `onBattleEnd` | Battle begin / end for every battler. | Initial TP, clearing battle-only states and buffs. |
| `Game_Battler.prototype.onTurnEnd` | Every turn end (`endAllBattlersTurn()`), each battler's TPB turn end (`updateTpbBattler()`), and on the map every 20 steps (`Game_Actor.turnEndOnMap()`). | Regeneration, state/buff turn counters, auto-removal. |
| `Game_Battler.prototype.makeActionTimes` | From `makeActions()`. | Number of actions per turn (Action Times + traits). |
| `Scene_Battle.prototype.createAllWindows` | During `Scene_Battle.create()`. | Add battle windows. |
| `Window_ActorCommand.prototype.makeCommandList` | When an actor's command window refreshes. | Add actor commands (attack, skill types, guard, item). |
| `Window_PartyCommand.prototype.makeCommandList` | When the party command window refreshes. | Fight / Escape list. |

## Messages

Diagrams: [show-text-message.mmd](../sequence-diagrams/show-text-message.mmd),
[message-choices-input.mmd](../sequence-diagrams/message-choices-input.mmd),
[window-text-escape-codes.mmd](../sequence-diagrams/window-text-escape-codes.mmd). Codes: [escape-codes.md](escape-codes.md).

| Method | When it is called | What aliasing it affects |
|---|---|---|
| `Window_Base.prototype.convertEscapeCharacters` | Once per text, before drawing (every `drawTextEx()` and every message). | Add text-replacement codes (like `\V`, `\N`). |
| `Window_Base.prototype.processEscapeCharacter` | For each `\CODE` while drawing. | Add drawing codes (like `\C`, `\I`); fall through to the original for the rest. |
| `Window_Message.prototype.processEscapeCharacter` | Same, in the message window only. | Add message-only codes (waits, sounds). |
| `Window_Base.prototype.obtainEscapeCode` | When an ESC character is reached. | Change which characters can form a code (the default regex allows symbols `$ . \| ^ ! > < { } \` or a run of letters). |
| `Window_Message.prototype.startMessage` | When `$gameMessage` has text and the window starts a message. | Text, placement, background, name box start. |
| `Window_Message.prototype.newPage` | At the start of every page. | Font reset, flags, speaker name, face loading. |
| `Window_Message.prototype.updatePlacement` | From `startMessage()`. | Message window position (top/middle/bottom) and gold window position. |
| `Window_Message.prototype.terminateMessage` | When the message ends. | Closing and `$gameMessage.clear()`. |
| `Window_NameBox.prototype.updatePlacement` | From `Window_NameBox.start()`. | Where the speaker name box goes. |
| `Game_Message.prototype.add` | For each text line (command 101 and battle messages). | Preprocess message lines. |
| `Game_Interpreter.prototype.command101` | Show Text. | Face, background, position and speaker name setup. |
| `Scene_Message.prototype.createAllWindows` | In `Scene_Map` / `Scene_Battle` creation. | Message, scroll text, gold, name box, choice, number and item windows. |

## Save data

Diagrams: [datamanager-save-load.mmd](../sequence-diagrams/datamanager-save-load.mmd),
[autosave.mmd](../sequence-diagrams/autosave.mmd), [config-manager.mmd](../sequence-diagrams/config-manager.mmd).

| Method | When it is called | What aliasing it affects |
|---|---|---|
| `DataManager.createGameObjects` | New game (`setupNewGame()`) and before extracting a load (`loadGame()`). | Create your own `$gameXxx` globals. |
| `DataManager.makeSaveContents` | `saveGame()` (manual save and autosave). | Add fields to the saved object (`contents.myData = $myData`). |
| `DataManager.extractSaveContents` | `loadGame()`, after `createGameObjects()`. | Restore your fields; old saves do not have them, so keep the defaults from `createGameObjects()`. |
| `DataManager.makeSavefileInfo` | After a successful save. | Data shown in the save list (`title`, `characters`, `faces`, `playtime`, `timestamp`). |
| `DataManager.setupNewGame` | "New Game" and title skip. | Initial game state. |
| `Game_System.prototype.onBeforeSave` | `Scene_Save.executeSave()` and `Scene_Base.executeAutosave()`. | Store values just before saving (save count, version, frame count, BGM/BGS). |
| `Game_System.prototype.onAfterLoad` | `Scene_Load.terminate()` after a successful load. | Restore runtime state (frame count, BGM/BGS) after loading. |
| `Scene_Map.prototype.shouldAutosave` / `Scene_Base.prototype.isAutosaveEnabled` | After transfers / battles. | When autosave runs. |
| `ConfigManager.makeData` / `ConfigManager.applyData` | Saving / loading `config`. | Add options to the config file (pair with `Window_Options.prototype.addGeneralOptions`). |

Any field you add to an existing saved object (`Game_System`, `Game_Party`, `Game_Actor` ...) is saved automatically,
because `JsonEx` serializes the whole object and restores its class with `window[value["@"]]`. A class you save must
therefore be a global (defined with `function` or assigned to `window`), and saves made before your plugin was added
will not have the field, so initialize it lazily.

## Windows

Diagrams: [window-selectable-input.mmd](../sequence-diagrams/window-selectable-input.mmd),
[scene-menu.mmd](../sequence-diagrams/scene-menu.mmd).

| Method | When it is called | What aliasing it affects |
|---|---|---|
| `Window_Base.prototype.initialize` | When any window is constructed (with a `Rectangle`). | Skin, padding, opacity, tone and contents creation for every window. |
| `Window_Base.prototype.update` | Every frame for every window. | Tone, open/close animation, dimmer. |
| `Window_Base.prototype.lineHeight` | Layout of almost every window (36). | Row height of all windows. |
| `Window_Base.prototype.resetFontSettings` | Before `drawTextEx()` and every message page. | Default font face, size and color. |
| `Window_Selectable.prototype.maxItems` / `drawItem` | On `refresh()` → `paint()` → `drawAllItems()`. | Number of rows and how each row is drawn. |
| `Window_Selectable.prototype.processOk` | OK on the selected row. | Enabled check, OK sound, then `callOkHandler()`. |
| `Window_Command.prototype.makeCommandList` | From `Window_Command.refresh()`. | The commands of any command window (subclasses override it). |
| `Window_Command.prototype.addCommand` | Inside `makeCommandList()`. | Signature `(name, symbol, enabled = true, ext = null)`. |
| `Window_MenuCommand.prototype.addOriginalCommands` | Between Formation and Options in `makeCommandList()`. | Empty in the core; the intended place to add menu commands. |
| `Window_TitleCommand.prototype.makeCommandList` | Title command window refresh. | New Game / Continue / Options list. |
| `Window_Options.prototype.addGeneralOptions` / `addVolumeOptions` | From `Window_Options.makeCommandList()`. | Options screen rows. |
| `Window_StatusBase.prototype.drawActorSimpleStatus` | Menu status rows. | Name, level, icons, class, gauges. |
