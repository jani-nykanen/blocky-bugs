import { Canvas } from "./core/canvas.js";
import { CoreEvent, Scene } from "./core/core.js";
import { TransitionEffectType } from "./core/transition.js";
import { State } from "./core/types.js";
import { Vector2 } from "./core/vector.js";
import { Stage } from "./stage.js";


export class GameScene implements Scene {


    private stage : Stage;


    constructor(param : any, event : CoreEvent) {

        this.stage = new Stage(1, event);
    }   

    
    public update(event : CoreEvent) {

        if (event.transition.isActive())
            return;

        this.stage.update(event);

        if(event.input.getAction("undo") == State.Pressed) {

            this.stage.undo(event);
        }

        if (event.input.getAction("restart") == State.Pressed) {

            event.transition.activate(true, TransitionEffectType.CirleIn,
                1.0/30.0, event => {
                    this.stage.reset();
                })
                .setCenter(new Vector2(32, 32));
        }
    }


    public redraw(canvas : Canvas) {

        canvas.clear(170, 170, 170);

        this.stage.draw(canvas);
    }


    public dispose() : any {

        return null;
    }
}
