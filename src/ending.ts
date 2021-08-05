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
            null, new RGBA(255, 255, 255), 4);

        this.waveTimer = WAVE_TIME;
    }


    public update(event : CoreEvent) {

        if (this.waveTimer > 0) {

            this.waveTimer -= event.step;
        }
    }


    public redraw(canvas : Canvas) {

        const FACTOR_1 = 40;
        const FACTOR_2 = 4;

        let bmp = canvas.getBitmap("theEnd");

        let t = this.waveTimer / WAVE_TIME;

        if (this.waveTimer <= 0) {

            canvas.drawBitmap(bmp, 0, 0);
        }
        else {

            canvas.clear(0, 0, 0);
            canvas.drawWavingImage(bmp, 0, 0, t, FACTOR_1, FACTOR_2);
        }
    }


    public dispose() : any {

        return <any> null;
    }
}
