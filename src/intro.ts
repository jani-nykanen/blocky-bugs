import { Canvas } from "./core/canvas.js";
import { CoreEvent, Scene } from "./core/core.js";
import { TransitionEffectType } from "./core/transition.js";
import { RGBA } from "./core/vector.js";
import { TitleScreen } from "./titlescreen.js";


const WAIT_TIME = 90;


export class Intro implements Scene  {


    private timer : number;
    private phase : number;


    constructor(param : any, event : CoreEvent) {

        event.transition.activate(false,
            TransitionEffectType.Fade, 1.0/30.0,
            null, new RGBA(0, 0, 0), 4);

        this.phase = 0;
        this.timer = WAIT_TIME;
    }


    public update(event : CoreEvent) {

        if (event.transition.isActive()) return;

        if (event.input.anyPressed())
            this.timer = 0;

        if ((this.timer -= event.step) <= 0) {

            this.timer += WAIT_TIME;
            event.transition.activate(true, TransitionEffectType.Fade,
                1.0/30.0, event => {

                    if (++ this.phase == 2) {

                        event.changeScene(TitleScreen);
                    }
                }, new RGBA(0, 0, 0), 4);
        }
    }


    public redraw(canvas : Canvas) {

        let bmp = canvas.getBitmap("author");

        canvas.drawBitmapRegion(bmp, this.phase*64, 0, 64, 64,
            0, 0);
    }


    public dispose() : any {

        return <any> null;
    }
}
