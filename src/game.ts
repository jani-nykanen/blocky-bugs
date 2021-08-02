import { Canvas } from "./core/canvas.js";
import { CoreEvent, Scene } from "./core/core.js";


export class GameScene implements Scene {


    constructor(param : any, event : CoreEvent) {


    }   

    
    public update(event : CoreEvent) {

        if (event.transition.isActive())
            return;
    }


    public redraw(canvas : Canvas) {

        canvas.clear(170, 170, 170);
    }


    public dispose() : any {

        return null;
    }
}
