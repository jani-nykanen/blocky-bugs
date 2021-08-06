import { Canvas } from "./core/canvas.js";
import { CoreEvent } from "./core/core.js";
import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";


export class Dust {

    
    private pos : Vector2;
    private spr : Sprite;
    private animSpeed : number;
    private exist : boolean;


    constructor() {

        this.pos = new Vector2();
        this.spr = new Sprite(8, 8);
        this.animSpeed = 0;

        this.exist = false;
    }


    public spawn(x : number, y : number, speed : number) {

        this.pos = new Vector2(x, y);
        this.animSpeed = speed;

        this.spr.setFrame(0, 0);

        this.exist = true;
    }


    public update(event : CoreEvent) {

        if (!this.exist) return;

        this.spr.animate(2, 0, 4, this.animSpeed, event.step);
        if (this.spr.getColumn() == 4) {

            this.exist = false;
        }
    }


    public draw(canvas : Canvas) {

        if (!this.exist) return;

        canvas.drawSprite(this.spr, canvas.getBitmap("blocks"),
            this.pos.x | 0, this.pos.y | 0);
    }


    public doesExist = () : boolean => this.exist;


    public kill() {

        this.exist = false;
    }
}

