import { Canvas } from "./core/canvas.js";
import { CoreEvent, Scene } from "./core/core.js";
import { TransitionEffectType } from "./core/transition.js";
import { State } from "./core/types.js";
import { RGBA, Vector2 } from "./core/vector.js";
import { Ending } from "./ending.js";
import { Menu, MenuButton } from "./menu.js";
import { Stage } from "./stage.js";
import { TitleScreen } from "./titlescreen.js";


const CLEAR_TIME = [60, 60];
const START_TIME = 60;


export class GameScene implements Scene {


    private stage : Stage;
    private pauseMenu : Menu;
    private yesNoMenu : Menu;

    private stageClearTimer : number;
    private clearPhase : number;

    private startTimer : number;
    private isFinalStage : boolean;


    constructor(param : any, event : CoreEvent) {

        let startIndex = 1;
        if (param != null) {

            startIndex = Number(param);
        }

        this.stage = new Stage(startIndex, event); // this.findLatestStage(event), event);

        this.stageClearTimer = 0;
        this.clearPhase = 0;

        this.startTimer = START_TIME;

        this.pauseMenu = new Menu(
            [
                new MenuButton("RESUME",
                    event => {
                        this.pauseMenu.deactivate();
                        //event.audio.resumeMusic();
                    }),

                new MenuButton("RESTART",
                    event => {

                        this.pauseMenu.deactivate();
                        this.reset(event);

                        //event.audio.resumeMusic();
                    }),
                new MenuButton("QUIT",
                event => {

                    this.yesNoMenu.activate(1);
                })
            ]
        );

        this.yesNoMenu = new Menu(
            [
                new MenuButton("YES",
                event => {
                    
                    this.yesNoMenu.deactivate();
                    this.pauseMenu.deactivate();

                    event.audio.stopMusic();

                    event.transition.activate(true, 
                        TransitionEffectType.BoxVertical,
                        1.0/30.0, event => {
                            
                            event.changeScene(TitleScreen);
                        });
                }),

                new MenuButton("NO", 
                event => {

                    this.yesNoMenu.deactivate();
                })
            ]
        );

        event.transition.activate(false, 
            TransitionEffectType.CirleIn,
            1.0/30.0, null)
            .setCenter(new Vector2(32, 32));

        this.isFinalStage = false;


        // event.audio.fadeInMusic(event.getSample("theme"), 0.80, 1000);
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

        try {

            window.localStorage.setItem("bughunt_save", 
                String(this.stage.stageIndex + 1));
        }   
        catch(e) {
            
            console.log(e);
        }

        event.transition.activate(true, TransitionEffectType.CirleIn,
            1.0/30.0, event => {

                this.stage = new Stage(this.stage.stageIndex + 1, event);
                this.resetProperties();

                this.startTimer = START_TIME;
            })
            .setCenter(new Vector2(32, 32));
    }

    
    public update(event : CoreEvent) {

        const END_TIME = 240;

        if (event.transition.isActive()) {

            if (this.isFinalStage) {

                this.stage.update(event);
            }

            return;
        }

        if (this.startTimer > 0.0) {

            this.startTimer -= event.step;
            return;
        }

        if (this.pauseMenu.isActive()) {

            if (this.yesNoMenu.isActive()) {

                this.yesNoMenu.update(event);
                return;
            }

            this.pauseMenu.update(event);
            return;
        }

        if(!this.stage.isCleared() &&
            event.input.getAction("start") == State.Pressed) {

            event.audio.playSample(event.getSample("pause"), 0.80);
            this.pauseMenu.activate(0);

           //  event.audio.pauseMusic();

            return;
        }

        let oldStageClearedState = this.stage.isCleared();

        this.stage.update(event);

        if (this.stage.isCleared()) {

            this.isFinalStage = this.stage.stageIndex == this.findLatestStage(event);

            if (!oldStageClearedState) {

                if (this.isFinalStage)
                    event.audio.playSample(event.getSample("destroy"), 0.70);
                else
                    event.audio.playSample(event.getSample("victory"), 1.0);
            }

            if (this.isFinalStage) {

                event.transition.activate(
                    true, TransitionEffectType.CirleIn,
                    1.0/END_TIME,
                    event => {

                        event.changeScene(Ending);

                    }, new RGBA(255, 255, 255))
                    .setCenter(this.stage.getEndPos());

                event.shake(1, END_TIME);

                return;
            }

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

                event.audio.playSample(event.getSample("restart"), 0.70);
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

        canvas.drawText(canvas.getBitmap("font"),
            TOP_ROW.substring(0, len), 17, 24, -3, 0, false);    
        if (len < 6) {

            canvas.drawText(canvas.getBitmap("font"),
                TOP_ROW[len], 17 + 5 * len, -8 + y, -3, 0, false);   
        } 
        canvas.drawText(canvas.getBitmap("font"),
            BOTTOM_ROW.substring(0, len), 17, 32, -3, 0, false);  
        if (len < 6) {

            canvas.drawText(canvas.getBitmap("font"),
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

        if (this.yesNoMenu.isActive()) {

            canvas.drawText(canvas.getBitmap("font"), "REALLY?",
                canvas.width/2, 20, -3, 0, true);
            this.yesNoMenu.draw(canvas, 16, 30, -3, 8);
        }
        else {

            this.pauseMenu.draw(canvas, 10, 20, -3, 8);
        }
    }


    public drawStartMessage(canvas : Canvas) {

        canvas.setFillColor(0, 0, 0, 0.33);
        canvas.fillRect(0, 0, 64, 64);

        let y = 0;

        if (this.startTimer < START_TIME/2) {

            y = Math.round((1.0 - (this.startTimer / (START_TIME/2))) * 40);
        }

        canvas.drawText(canvas.getBitmap("font"),
            "STAGE " + String(this.stage.stageIndex),
            canvas.width/2, canvas.height/2 - 3 - y, 
            -3, 0, true);
    }


    public redraw(canvas : Canvas) {

        canvas.clear(170, 170, 170);

        canvas.applyShake();
        this.stage.draw(canvas);
        canvas.moveTo();

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
