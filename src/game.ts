import { Canvas } from "./core/canvas.js";
import { CoreEvent, Scene } from "./core/core.js";
import { TransitionEffectType } from "./core/transition.js";
import { State } from "./core/types.js";
import { Vector2 } from "./core/vector.js";
import { Menu, MenuButton } from "./menu.js";
import { Stage } from "./stage.js";


const CLEAR_TIME = [60, 60];
const START_TIME = 120;


export class GameScene implements Scene {


    private stage : Stage;
    private pauseMenu : Menu;

    private stageClearTimer : number;
    private clearPhase : number;

    private startTimer : number;


    constructor(param : any, event : CoreEvent) {

        this.stage = new Stage(
            1 // this.findLatestStage(event)
            , event);

        this.stageClearTimer = 0;
        this.clearPhase = 0;

        this.startTimer = START_TIME;

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

        event.transition.activate(false, 
            TransitionEffectType.CirleIn,
            1.0/30.0, null)
            .setCenter(new Vector2(32, 32));
    }   

    
    private findLatestStage(event : CoreEvent) : number {

        let n = 1;

        while (event.getTilemap(String(++ n)) != null);

        return n-1;
    }


    private resetProperties() {

        this.stageClearTimer = 0;
        this.clearPhase = 0;
    }


    private reset(event : CoreEvent) {

        event.transition.activate(true, TransitionEffectType.BoxVertical,
            1.0/20.0, event => {

                this.resetProperties();
                this.stage.reset();
            });
    }


    private nextStage(event : CoreEvent) {

        event.transition.activate(true, TransitionEffectType.CirleIn,
            1.0/30.0, event => {

                this.stage = new Stage(this.stage.stageIndex + 1, event);
                this.resetProperties();

                this.startTimer = START_TIME;
            })
            .setCenter(new Vector2(32, 32));
    }

    
    public update(event : CoreEvent) {

        if (event.transition.isActive())
            return;

        if (this.startTimer > 0.0) {

            this.startTimer -= event.step;
            return;
        }

        if (this.pauseMenu.isActive()) {

            this.pauseMenu.update(event);
            return;
        }

        if(!this.stage.isCleared() &&
            event.input.getAction("start") == State.Pressed) {

            this.pauseMenu.activate(0);
            return;
        }

        this.stage.update(event);

        if (this.stage.isCleared()) {

            if ((this.stageClearTimer += event.step) >= CLEAR_TIME[this.clearPhase]) {

                this.stageClearTimer = 0;
                ++ this.clearPhase;
            }

            if ((this.clearPhase == 1 && event.input.anyPressed()) ||
                this.clearPhase == 2) {

                this.nextStage(event);
            }
        }
        else {

            if(event.input.getAction("undo") == State.Pressed) {

                this.stage.undo(event);
            }

            if (event.input.getAction("restart") == State.Pressed) {

                this.reset(event);
            }
        }
    }


    private drawStageClearMessage(canvas : Canvas) {

        const TOP_ROW = "STAGE ";
        const BOTTOM_ROW = "CLEAR!";

        canvas.setFillColor(0, 0, 0, 0.33);
        canvas.fillRect(0, 0, 64, 64);

        let len = 6;
        let y = 0;
        if (this.clearPhase == 0) {
            
            len = Math.floor(6 * this.stageClearTimer / CLEAR_TIME[0]);
            y = 32 * (this.stageClearTimer % (CLEAR_TIME[0] / 6)) / (CLEAR_TIME[0] / 6);
        }

        canvas.drawText(canvas.getBitmap("fontYellow"),
            TOP_ROW.substring(0, len), 17, 24, -3, 0, false);    
        if (len < 6) {

            canvas.drawText(canvas.getBitmap("fontYellow"),
                TOP_ROW[len], 17 + 5 * len, -8 + y, -3, 0, false);   
        } 
        canvas.drawText(canvas.getBitmap("fontYellow"),
            BOTTOM_ROW.substring(0, len), 17, 32, -3, 0, false);  
        if (len < 6) {

            canvas.drawText(canvas.getBitmap("fontYellow"),
                BOTTOM_ROW[len], 17 + 5 * len, 64 - y, -3, 0, false);  
        } 
    }


    private drawPause(canvas : Canvas) {

        const BOX_WIDTH = 44;
        const BOX_HEIGHT = 28;

        canvas.setFillColor(0, 0, 0, 0.67);
        canvas.fillRect(0, 0, 64, 64);

        canvas.setFillColor(0, 85, 170);
        canvas.fillRect(
            canvas.width/2 - BOX_WIDTH/2-1, 
            canvas.height/2 - BOX_HEIGHT/2-1, 
            BOX_WIDTH+2, BOX_HEIGHT+2);
        canvas.setFillColor(85, 170, 255);
        canvas.fillRect(
            canvas.width/2 - BOX_WIDTH/2, 
            canvas.height/2 - BOX_HEIGHT/2, 
            BOX_WIDTH, BOX_HEIGHT);

        this.pauseMenu.draw(canvas, 10, 20, -3, 8);
    }


    public drawStartMessage(canvas : Canvas) {

        canvas.setFillColor(0, 0, 0, 0.33);
        canvas.fillRect(0, 0, 64, 64);

        let str = "STAGE " + String(this.stage.stageIndex);
        let end = str.length;
        let t : number;
        let y : number;

        let limit = START_TIME / 2;

        if (this.startTimer < limit) {

            t = this.startTimer / limit;
            end = ((str.length) * t) | 0;

            t = 1.0 - (this.startTimer % (limit / (str.length))) / 
                      (limit / (str.length));
            y = Math.round(35 * t);

            if (str[end] == " ") {

                this.startTimer -= (limit / (str.length));
                -- end;
            }   

            canvas.drawText(canvas.getBitmap("fontYellow"),
                str[end],
                canvas.width/2 - (str.length * 5)/2 + end*5, 
                canvas.height/2 - 3 + y, 
                -3, 0, false);
        }

        canvas.drawText(canvas.getBitmap("fontYellow"),
            str.substring(0, end),
            canvas.width/2 - (str.length * 5)/2, 
            canvas.height/2 - 3, -3, 0, false);
    }


    public redraw(canvas : Canvas) {

        canvas.clear(170, 170, 170);

        this.stage.draw(canvas);

        if (this.startTimer > 0) {

            this.drawStartMessage(canvas);
            return;
        }

        if (this.stage.isCleared()) {

            this.drawStageClearMessage(canvas);
        }

        if (this.pauseMenu.isActive()) {

            this.drawPause(canvas);
        }

    }


    public dispose() : any {

        return null;
    }
}
