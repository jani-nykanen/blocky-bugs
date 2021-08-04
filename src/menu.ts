

import { Canvas } from "./core/canvas.js";
import { CoreEvent } from "./core/core.js";
import { negMod } from "./core/mathext.js";
import { State } from "./core/types.js";


export class MenuButton {


    private text : string;
    private callback : (event : CoreEvent) => void;


    constructor(text : string, callback : (event : CoreEvent) => void) {

        this.text = text;
        this.callback = callback;
    }


    public getText = () : string => this.text;
    public evaluateCallback = (event : CoreEvent) => this.callback(event);


    public clone() : MenuButton {

        return new MenuButton(this.text, this.callback);
    }


    public changeText(newText : string) {

        this.text = newText;
    }
}


export class Menu {


    static BASE_SCALE = 1.25;
    
    private buttons : Array<MenuButton>;

    private cursorPos : number;
    private active : boolean;


    constructor(buttons : Array<MenuButton>) {

        this.buttons = (new Array<MenuButton> (buttons.length))
            .fill(null)
            .map((b, i) => buttons[i].clone());

        this.cursorPos = 0;
        this.active = false;
    }


    public activate(cursorPos = -1) {

        if (cursorPos >= 0)
            this.cursorPos = cursorPos % this.buttons.length;

        this.active = true;
    }


    public deactivate() {

        this.active = false;
    }


    public update(event : CoreEvent) {

        if (!this.active) return;

        let oldPos = this.cursorPos;

        if (event.input.upPress()) {

            -- this.cursorPos;
        }
        else if (event.input.downPress()) {

            ++ this.cursorPos;
        }

        if (oldPos != this.cursorPos) {

            event.audio.playSample(event.getSample("choose"), 0.70);

            this.cursorPos = negMod(this.cursorPos, this.buttons.length);
        }

        let activeButton = this.buttons[this.cursorPos];
        
        if (event.input.getAction("fire1") == State.Pressed ||
            event.input.getAction("start") == State.Pressed) {

            activeButton.evaluateCallback(event);
            event.audio.playSample(event.getSample("select"), 0.60);
        }
    }


    public draw(canvas : Canvas, x : number, y : number,
        xoff = -4, yoff = 0) {

        let str = "";

        let font = canvas.getBitmap("font");
        let fontYellow = canvas.getBitmap("fontYellow");

        for (let i = 0; i < this.buttons.length; ++ i) {

            str = i == this.cursorPos ? ">" : " ";
            str += this.buttons[i].getText();

            canvas.drawText(i == this.cursorPos ? fontYellow : font, 
                str, x, y + i * yoff, xoff, 0);
        } 
    }


    public isActive = () : boolean => this.active;


    public changeButtonText(index : number, text : string) {

        this.buttons[index].changeText(text);
    }
}
