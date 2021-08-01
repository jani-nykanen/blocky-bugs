import { GameScene } from "./game.js";
import { Core } from "./core/core.js"


window.onload = () : void => (new Core(64, 64))
    .addInputAction("fire1", "KeyZ", "Space", 0)
    .addInputAction("fire2", "KeyX", "ShiftLeft", 2)
    .addInputAction("start", "Enter", null, 9, 7)
    .addInputAction("back", "Escape", null, 8, 6)
    .loadAssets("assets/index.json")
    .run(GameScene,
        event => {

            //event.audio.setGlobalMusicVolume(0.0);
            //event.audio.setGlobalSampleVolume(0.0);
            event.audio.toggle(true);
        });
