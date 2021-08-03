import { Canvas } from "./core/canvas.js";
import { CoreEvent, Scene } from "./core/core.js";
import { TransitionEffectType } from "./core/transition.js";
import { State } from "./core/types.js";
import { Vector2 } from "./core/vector.js";
import { Menu, MenuButton } from "./menu.js";
import { Stage } from "./stage.js";


export class GameScene implements Scene {


    private stage : Stage;
    private pauseMenu : Menu;


    constructor(param : any, event : CoreEvent) {

        this.stage = new Stage(1, event);

        this.pauseMenu = new Menu(
            [
                new MenuButton("RESUME",
                    event => {
                        this.pauseMenu.deactivate();
                    }),

                new MenuButton("RESTART",
                    event => {

                        this.pauseMenu.deactivate();
                        this.reset(event);
                    }),
                new MenuButton("QUIT",
                event => {

                    // ...
                })
            ]
        );
    }   


    private reset(event : CoreEvent) {

        event.transition.activate(true, TransitionEffectType.CirleIn,
            1.0/20.0, event => {
                this.stage.reset();
            })
            .setCenter(new Vector2(32, 32));
    }

    
    public update(event : CoreEvent) {

        if (event.transition.isActive())
            return;

        if (this.pauseMenu.isActive()) {

            this.pauseMenu.update(event);
            return;
        }

        if(event.input.getAction("start") == State.Pressed) {

            this.pauseMenu.activate(0);
            return;
        }

        this.stage.update(event);

        if(event.input.getAction("undo") == State.Pressed) {

            this.stage.undo(event);
        }

        if (event.input.getAction("restart") == State.Pressed) {

            this.reset(event);
        }
    }


    public redraw(canvas : Canvas) {

        canvas.clear(170, 170, 170);

        this.stage.draw(canvas);

        if (this.pauseMenu.isActive()) {

            canvas.setFillColor(85, 170, 255);
            canvas.fillRect(0, 0, canvas.width, canvas.height);

            this.pauseMenu.draw(canvas, 8, 20, -3, 8);
        }
    }


    public dispose() : any {

        return null;
    }
}
