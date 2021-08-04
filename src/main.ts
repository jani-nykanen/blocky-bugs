import { Core } from "./core/core.js"
import { AudioIntro } from "./audiointro.js";


window.onload = () : void => (new Core(64, 64))
    .addInputAction("fire1", "KeyZ", "Space", 0)
    .addInputAction("restart", "KeyR", null, 3)
    .addInputAction("start", "Enter", null, 9, 7)
    .addInputAction("back", "Escape", null, 8, 6)
    .addInputAction("undo", "Backspace", null, 1)
    .loadAssets("assets/index.json")
    .run(AudioIntro,
        event => {

            //event.audio.setGlobalMusicVolume(0.0);
            //event.audio.setGlobalSampleVolume(0.0);
            event.audio.toggle(false);
        });
