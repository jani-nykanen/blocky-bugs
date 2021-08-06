import { Canvas } from "./core/canvas.js";
import { CoreEvent, Scene } from "./core/core.js";
import { TransitionEffectType } from "./core/transition.js";
import { State } from "./core/types.js";
import { RGBA, Vector2 } from "./core/vector.js";
import { GameScene } from "./game.js";
import { Menu, MenuButton } from "./menu.js";
import { StoryIntro } from "./storyintro.js";


const WAVE_TIME = 90;


export class TitleScreen implements Scene  {


    private waveTimer : number;
    private phase : number;

    private menu : Menu;

    private startIndex : number;


    constructor(param : any, event : CoreEvent) {

        event.transition.activate(false,
            TransitionEffectType.Fade, 1.0/30.0,
            null, new RGBA(0, 0, 0), 4);

        this.waveTimer = WAVE_TIME;

        this.phase = 0;

        this.menu = new Menu(
            [
                new MenuButton("NEW GAME",
                event => {

                    this.startGame(true, event);
                }),

                new MenuButton("CONTINUE",
                event => {
                    
                    this.startGame(false, event);
                })
            ]
        );
        this.menu.activate(0);

        this.startIndex = 0;
    }


    private startGame(newGame : boolean, event : CoreEvent) {

        this.startIndex = 1;
        let num = -1;
        if (!newGame) {

            try {

                num = Number(window.localStorage.getItem("bughunt_save"));
            }   
            catch(e) {

                num = -1;
                console.log(e);
            }
        }
        if (num > this.startIndex) {

            this.startIndex = num;
        }

        event.transition.activate(true,
            TransitionEffectType.CirleIn,
            1.0/30.0, event => {

                event.changeScene(this.startIndex == 1 ? StoryIntro : GameScene);
            })
            .setCenter(new Vector2(32, 32));
    }


    public update(event : CoreEvent) {

        const ENTER_WAVE_SPEED = 0.1;

        if (this.phase == 0) {

            if ((this.waveTimer -= event.step) <= 0) {

                ++ this.phase;
            }
        }
        else if (this.phase == 1) {

            if (event.input.getAction("start") == State.Pressed ||
                event.input.getAction("fire1") == State.Pressed) {

                ++ this.phase;
                event.audio.playSample(event.getSample("start"), 0.70);
            }

            this.waveTimer = (this.waveTimer + ENTER_WAVE_SPEED * event.step) % (Math.PI*2);
        }
        else {

            this.menu.update(event);
        }
    }


    public redraw(canvas : Canvas) {

        const FACTOR_1 = 32;
        const FACTOR_2 = 4;

        let bmp = canvas.getBitmap("logo");
        let font = canvas.getBitmap("font");

        let t = this.waveTimer / WAVE_TIME;

        canvas.clear(85, 160, 255);

        if (this.phase > 0) {

            canvas.drawBitmap(bmp, 0, 0);
        }
        else {

            canvas.drawWavingImage(bmp, 0, 0, t, FACTOR_1, FACTOR_2);
        }

        if (this.phase == 1) {

            canvas.drawText(font, "PRESS ENTER", 
                canvas.width/2, canvas.height-18,
                -3, 0, true, 1, 1, this.waveTimer,
                2, Math.PI / 5);
        }
        else if (this.phase == 2) {

            this.menu.draw(canvas, 8, canvas.height-22,
                -3, 8);
        }
    }


    public dispose() : any {

        return <any> this.startIndex;
    }
}
