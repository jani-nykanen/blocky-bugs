import { Canvas } from "./core/canvas.js";
import { CoreEvent, Scene } from "./core/core.js";
import { TransitionEffectType } from "./core/transition.js";
import { RGBA } from "./core/vector.js";


const WAVE_TIME = 120;


export class Ending implements Scene  {


    private waveTimer : number;


    constructor(param : any, event : CoreEvent) {

        event.transition.activate(false,
            TransitionEffectType.Fade, 1.0/60.0,
            null, new RGBA(255, 255, 255), 8);

        this.waveTimer = WAVE_TIME;
    }


    public update(ev : CoreEvent) {

        if (this.waveTimer > 0) {

            this.waveTimer -= ev.step;
        }
    }


    public redraw(canvas : Canvas) {

        const FACTOR_1 = 40;
        const FACTOR_2 = 4;

        let bmp = canvas.getBitmap("theEnd");

        let t = this.waveTimer / WAVE_TIME;
        let p : number;

        if (this.waveTimer <= 0) {

            canvas.drawBitmap(bmp, 0, 0);
        }
        else {

            canvas.clear(0, 0, 0);

            for (let y = 0; y < 64; ++ y) {

                p = Math.sin(((y / 64) * FACTOR_2 + t) * Math.PI*2) * FACTOR_1 * t;

                canvas.drawBitmapRegion(bmp, 0, y, 64, 1,
                    Math.round(p), y);
            }
        }
    }


    public dispose() : any {

        return <any> null;
    }
}
