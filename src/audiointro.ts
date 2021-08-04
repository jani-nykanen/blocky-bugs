import { Canvas } from "./core/canvas.js";
import { CoreEvent, Scene } from "./core/core.js";
import { GameScene } from "./game.js";
import { Menu, MenuButton } from "./menu.js";


const TEXT =
`ENABLE\nAUDIO?`;


export class AudioIntro implements Scene {


    static INITIAL_SAMPLE_VOLUME = 0.50;
    static INITIAL_MUSIC_VOLUME = 0.60;


    private yesNoMenu : Menu;
    private readonly width : number;


    constructor(param : any, event : CoreEvent) {

        this.yesNoMenu = new Menu(
            [
                new MenuButton("YES",
                    event => {

                        event.audio.toggle(true);

                        event.audio.setGlobalMusicVolume(AudioIntro.INITIAL_MUSIC_VOLUME);
                        event.audio.setGlobalSampleVolume(AudioIntro.INITIAL_SAMPLE_VOLUME);

                        event.changeScene(GameScene);
                    }),

                new MenuButton("NO",
                    event => {

                        event.audio.toggle(false);

                        event.changeScene(GameScene);
                    })
            ]
        );

        this.yesNoMenu.activate(0);

        this.width = Math.max(...TEXT.split('\n').map(s => s.length));
    }


    public update(event : CoreEvent) {

        this.yesNoMenu.update(event);
    }


    public redraw(canvas : Canvas) {

        canvas.clear(0, 170, 255);

        canvas.drawText(canvas.getBitmap("font"), TEXT,
            canvas.width/2 - 15, 12, -3, 0, false);

        this.yesNoMenu.draw(canvas, canvas.width/2 - 10, 36, -3, 8);
    }


    public dispose = () : any => <any>0;

}