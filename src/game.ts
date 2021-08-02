import { Canvas } from "./core/canvas.js";
import { CoreEvent, Scene } from "./core/core.js";
import { Stage } from "./stages.js";


export class GameScene implements Scene {


    private stage : Stage;


    constructor(param : any, event : CoreEvent) {

        this.stage = new Stage(1, event);
    }   

    
    public update(event : CoreEvent) {

        if (event.transition.isActive())
            return;

        this.stage.update(event);
    }


    public redraw(canvas : Canvas) {

        canvas.clear(170, 170, 170);

        this.stage.draw(canvas);
/*
        canvas.drawText(canvas.getBitmap("font"), "HELLO\nWORLD!",
            1, 1, -4, -2);
*/
    }


    public dispose() : any {

        return null;
    }
}
