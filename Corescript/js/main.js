//=============================================================================
// main.js v1.10.0
//=============================================================================

const scriptUrls = [
    "js/libs/pixi.js",
    "js/libs/pako.min.js",
    "js/libs/localforage.min.js",
    "js/libs/effekseer.min.js",
    "js/libs/vorbisdecoder.js",
    // "js/rmmz_core.js",
    "js/rmmz_core/JsExtensions.js",
    "js/rmmz_core/Utils.js",
    "js/rmmz_core/Graphics.js",
    "js/rmmz_core/Point.js",
    "js/rmmz_core/Rectangle.js",
    "js/rmmz_core/Bitmap.js",
    "js/rmmz_core/Sprite.js",
    "js/rmmz_core/Tilemap.js",
    "js/rmmz_core/TilingSprite.js",
    "js/rmmz_core/ScreenSprite.js",
    "js/rmmz_core/Window.js",
    "js/rmmz_core/WindowLayer.js",
    "js/rmmz_core/Weather.js",
    "js/rmmz_core/ColorFilter.js",
    "js/rmmz_core/Stage.js",
    "js/rmmz_core/WebAudio.js",
    "js/rmmz_core/Video.js",
    "js/rmmz_core/Input.js",
    "js/rmmz_core/TouchInput.js",
    "js/rmmz_core/JsonEx.js",
    // "js/rmmz_managers.js",
    "js/rmmz_managers/DataManager.js",
    "js/rmmz_managers/ConfigManager.js",
    "js/rmmz_managers/StorageManager.js",
    "js/rmmz_managers/FontManager.js",
    "js/rmmz_managers/ImageManager.js",
    "js/rmmz_managers/EffectManager.js",
    "js/rmmz_managers/AudioManager.js",
    "js/rmmz_managers/SoundManager.js",
    "js/rmmz_managers/TextManager.js",
    "js/rmmz_managers/ColorManager.js",
    "js/rmmz_managers/SceneManager.js",
    "js/rmmz_managers/BattleManager.js",
    "js/rmmz_managers/PluginManager.js",
    // "js/rmmz_objects.js",
    "js/rmmz_objects/Game_Temp.js",
    "js/rmmz_objects/Game_System.js",
    "js/rmmz_objects/Game_Timer.js",
    "js/rmmz_objects/Game_Message.js",
    "js/rmmz_objects/Game_Switches.js",
    "js/rmmz_objects/Game_Variables.js",
    "js/rmmz_objects/Game_SelfSwitches.js",
    "js/rmmz_objects/Game_Screen.js",
    "js/rmmz_objects/Game_Picture.js",
    "js/rmmz_objects/Game_Item.js",
    "js/rmmz_objects/Game_Action.js",
    "js/rmmz_objects/Game_ActionResult.js",
    "js/rmmz_objects/Game_BattlerBase.js",
    "js/rmmz_objects/Game_Battler.js",
    "js/rmmz_objects/Game_Actor.js",
    "js/rmmz_objects/Game_Enemy.js",
    "js/rmmz_objects/Game_Actors.js",
    "js/rmmz_objects/Game_Unit.js",
    "js/rmmz_objects/Game_Party.js",
    "js/rmmz_objects/Game_Troop.js",
    "js/rmmz_objects/Game_Map.js",
    "js/rmmz_objects/Game_CommonEvent.js",
    "js/rmmz_objects/Game_CharacterBase.js",
    "js/rmmz_objects/Game_Character.js",
    "js/rmmz_objects/Game_Player.js",
    "js/rmmz_objects/Game_Follower.js",
    "js/rmmz_objects/Game_Followers.js",
    "js/rmmz_objects/Game_Vehicle.js",
    "js/rmmz_objects/Game_Event.js",
    "js/rmmz_objects/Game_Interpreter.js",
    // "js/rmmz_scenes.js",
    "js/rmmz_scenes/Scene_Base.js",
    "js/rmmz_scenes/Scene_Boot.js",
    "js/rmmz_scenes/Scene_Splash.js",
    "js/rmmz_scenes/Scene_Title.js",
    "js/rmmz_scenes/Scene_Message.js",
    "js/rmmz_scenes/Scene_Map.js",
    "js/rmmz_scenes/Scene_MenuBase.js",
    "js/rmmz_scenes/Scene_Menu.js",
    "js/rmmz_scenes/Scene_ItemBase.js",
    "js/rmmz_scenes/Scene_Item.js",
    "js/rmmz_scenes/Scene_Skill.js",
    "js/rmmz_scenes/Scene_Equip.js",
    "js/rmmz_scenes/Scene_Status.js",
    "js/rmmz_scenes/Scene_Options.js",
    "js/rmmz_scenes/Scene_File.js",
    "js/rmmz_scenes/Scene_Save.js",
    "js/rmmz_scenes/Scene_Load.js",
    "js/rmmz_scenes/Scene_GameEnd.js",
    "js/rmmz_scenes/Scene_Shop.js",
    "js/rmmz_scenes/Scene_Name.js",
    "js/rmmz_scenes/Scene_Debug.js",
    "js/rmmz_scenes/Scene_Battle.js",
    "js/rmmz_scenes/Scene_Gameover.js",
    // "js/rmmz_sprites.js",
    "js/rmmz_sprites/Sprite_Clickable.js",
    "js/rmmz_sprites/Sprite_Button.js",
    "js/rmmz_sprites/Sprite_Character.js",
    "js/rmmz_sprites/Sprite_Battler.js",
    "js/rmmz_sprites/Sprite_Actor.js",
    "js/rmmz_sprites/Sprite_Enemy.js",
    "js/rmmz_sprites/Sprite_Animation.js",
    "js/rmmz_sprites/Sprite_AnimationMV.js",
    "js/rmmz_sprites/Sprite_Battleback.js",
    "js/rmmz_sprites/Sprite_Damage.js",
    "js/rmmz_sprites/Sprite_Gauge.js",
    "js/rmmz_sprites/Sprite_Name.js",
    "js/rmmz_sprites/Sprite_StateIcon.js",
    "js/rmmz_sprites/Sprite_StateOverlay.js",
    "js/rmmz_sprites/Sprite_Weapon.js",
    "js/rmmz_sprites/Sprite_Balloon.js",
    "js/rmmz_sprites/Sprite_Picture.js",
    "js/rmmz_sprites/Sprite_Timer.js",
    "js/rmmz_sprites/Sprite_Destination.js",
    "js/rmmz_sprites/Spriteset_Base.js",
    "js/rmmz_sprites/Spriteset_Map.js",
    "js/rmmz_sprites/Spriteset_Battle.js",
    // "js/rmmz_windows.js",
    "js/rmmz_windows/Window_Base.js",
    "js/rmmz_windows/Window_Scrollable.js",
    "js/rmmz_windows/Window_Selectable.js",
    "js/rmmz_windows/Window_Command.js",
    "js/rmmz_windows/Window_HorzCommand.js",
    "js/rmmz_windows/Window_Help.js",
    "js/rmmz_windows/Window_Gold.js",
    "js/rmmz_windows/Window_StatusBase.js",
    "js/rmmz_windows/Window_MenuCommand.js",
    "js/rmmz_windows/Window_MenuStatus.js",
    "js/rmmz_windows/Window_MenuActor.js",
    "js/rmmz_windows/Window_ItemCategory.js",
    "js/rmmz_windows/Window_ItemList.js",
    "js/rmmz_windows/Window_SkillType.js",
    "js/rmmz_windows/Window_SkillStatus.js",
    "js/rmmz_windows/Window_SkillList.js",
    "js/rmmz_windows/Window_EquipStatus.js",
    "js/rmmz_windows/Window_EquipCommand.js",
    "js/rmmz_windows/Window_EquipSlot.js",
    "js/rmmz_windows/Window_EquipItem.js",
    "js/rmmz_windows/Window_Status.js",
    "js/rmmz_windows/Window_StatusParams.js",
    "js/rmmz_windows/Window_StatusEquip.js",
    "js/rmmz_windows/Window_Options.js",
    "js/rmmz_windows/Window_SavefileList.js",
    "js/rmmz_windows/Window_ShopCommand.js",
    "js/rmmz_windows/Window_ShopBuy.js",
    "js/rmmz_windows/Window_ShopSell.js",
    "js/rmmz_windows/Window_ShopNumber.js",
    "js/rmmz_windows/Window_ShopStatus.js",
    "js/rmmz_windows/Window_NameEdit.js",
    "js/rmmz_windows/Window_NameInput.js",
    "js/rmmz_windows/Window_NameBox.js",
    "js/rmmz_windows/Window_ChoiceList.js",
    "js/rmmz_windows/Window_NumberInput.js",
    "js/rmmz_windows/Window_EventItem.js",
    "js/rmmz_windows/Window_Message.js",
    "js/rmmz_windows/Window_ScrollText.js",
    "js/rmmz_windows/Window_MapName.js",
    "js/rmmz_windows/Window_BattleLog.js",
    "js/rmmz_windows/Window_PartyCommand.js",
    "js/rmmz_windows/Window_ActorCommand.js",
    "js/rmmz_windows/Window_BattleStatus.js",
    "js/rmmz_windows/Window_BattleActor.js",
    "js/rmmz_windows/Window_BattleEnemy.js",
    "js/rmmz_windows/Window_BattleSkill.js",
    "js/rmmz_windows/Window_BattleItem.js",
    "js/rmmz_windows/Window_TitleCommand.js",
    "js/rmmz_windows/Window_GameEnd.js",
    "js/rmmz_windows/Window_DebugRange.js",
    "js/rmmz_windows/Window_DebugEdit.js",
    "js/plugins.js"
];
const effekseerWasmUrl = "js/libs/effekseer.wasm";

class Main {
    constructor() {
        this.xhrSucceeded = false;
        this.loadCount = 0;
        this.error = null;
    }

    run() {
        this.showLoadingSpinner();
        this.testXhr();
        this.hookNwjsClose();
        alert("CONECTA EL DEBUGGER DE VS CODE AHORA Y LUEGO DALE A OK");
        this.loadMainScripts();
    }

    showLoadingSpinner() {
        const loadingSpinner = document.createElement("div");
        const loadingSpinnerImage = document.createElement("div");
        loadingSpinner.id = "loadingSpinner";
        loadingSpinnerImage.id = "loadingSpinnerImage";
        loadingSpinner.appendChild(loadingSpinnerImage);
        document.body.appendChild(loadingSpinner);
    }

    eraseLoadingSpinner() {
        const loadingSpinner = document.getElementById("loadingSpinner");
        if (loadingSpinner) {
            document.body.removeChild(loadingSpinner);
        }
    }

    testXhr() {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", document.currentScript.src);
        xhr.onload = () => (this.xhrSucceeded = true);
        xhr.send();
    }

    hookNwjsClose() {
        // [Note] When closing the window, the NW.js process sometimes does
        //   not terminate properly. This code is a workaround for that.
        if (typeof nw === "object") {
            nw.Window.get().on("close", () => nw.App.quit());
        }
    }

    loadMainScripts() {
        for (const url of scriptUrls) {
            const script = document.createElement("script");
            script.type = "text/javascript";
            script.src = url;
            script.async = false;
            script.defer = true;
            script.onload = this.onScriptLoad.bind(this);
            script.onerror = this.onScriptError.bind(this);
            script._url = url;
            document.body.appendChild(script);
        }
        this.numScripts = scriptUrls.length;
        window.addEventListener("load", this.onWindowLoad.bind(this));
        window.addEventListener("error", this.onWindowError.bind(this));
    }

    onScriptLoad() {
        if (++this.loadCount === this.numScripts) {
            PluginManager.setup($plugins);
        }
    }

    onScriptError(e) {
        this.printError("Failed to load", e.target._url);
    }

    printError(name, message) {
        this.eraseLoadingSpinner();
        if (!document.getElementById("errorPrinter")) {
            const errorPrinter = document.createElement("div");
            errorPrinter.id = "errorPrinter";
            errorPrinter.innerHTML = this.makeErrorHtml(name, message);
            document.body.appendChild(errorPrinter);
        }
    }

    makeErrorHtml(name, message) {
        const nameDiv = document.createElement("div");
        const messageDiv = document.createElement("div");
        nameDiv.id = "errorName";
        messageDiv.id = "errorMessage";
        nameDiv.innerHTML = name;
        messageDiv.innerHTML = message;
        return nameDiv.outerHTML + messageDiv.outerHTML;
    }

    onWindowLoad() {
        if (!this.xhrSucceeded) {
            const message = "Your browser does not allow to read local files.";
            this.printError("Error", message);
        } else if (this.isPathRandomized()) {
            const message = "Please move the Game.app to a different folder.";
            this.printError("Error", message);
        } else if (this.error) {
            this.printError(this.error.name, this.error.message);
        } else {
            this.initEffekseerRuntime();
        }
    }

    onWindowError(event) {
        if (!this.error) {
            this.error = event.error;
        }
    }

    isPathRandomized() {
        // [Note] We cannot save the game properly when Gatekeeper Path
        //   Randomization is in effect.
        return (
            typeof process === "object" &&
            process.mainModule.filename.startsWith("/private/var")
        );
    }

    initEffekseerRuntime() {
        const onLoad = this.onEffekseerLoad.bind(this);
        const onError = this.onEffekseerError.bind(this);
        effekseer.initRuntime(effekseerWasmUrl, onLoad, onError);
    }

    onEffekseerLoad() {
        this.eraseLoadingSpinner();
        SceneManager.run(Scene_Boot);
    }

    onEffekseerError() {
        this.printError("Failed to load", effekseerWasmUrl);
    }
}

const main = new Main();
main.run();

//-----------------------------------------------------------------------------
