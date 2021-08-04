import { Canvas } from "./core/canvas.js";
import { CoreEvent } from "./core/core.js";
import { negMod } from "./core/mathext.js";
import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";
import { HitEvent, Stage } from "./stage.js";


const MOVE_TIME = 10;


class Dust {

    
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


export class PlayerBlock {


    private pos : Vector2;
    private renderPos : Vector2;

    private moveDir : Vector2;
    private moveTimer : number;
    private moving : boolean;
    private preventDir : Vector2;

    private dust : Array<Dust>;
    private dustTimer : number;


    constructor(x : number, y : number) {

        this.pos = new Vector2(x, y);
        this.renderPos = new Vector2(x*8, y*8);
    
        this.moveDir = new Vector2(0, 0);
        this.moveTimer = 0;
        this.moving = false;
    
        this.dust = new Array<Dust> ();

        this.preventDir = new Vector2();
    }


    // What
    private removePreventedDirection(stick : Vector2) {

        const EPS = 0.1;

        let sx = Math.abs(stick.x) > Math.abs(stick.y);
        let sy = !sx;

        if ((this.preventDir.y < -EPS && !(sy && stick.y < -EPS)) ||
            (this.preventDir.y > EPS && !(sy && stick.y > EPS)) ||
            (this.preventDir.x < -EPS && !(sx && stick.x < -EPS)) ||
            (this.preventDir.x > EPS && !(sx && stick.x > EPS))) {

            this.preventDir.zeros();
        }
    }   


    public control(stage : Stage, preventDir : Vector2, event : CoreEvent) : boolean {

        const EPS = 0.25;

        if (this.moving) return false;

        let dirx = 0;
        let diry = 0;

        let stick = event.input.getStick();
        if (stick.length() < EPS) {
            
            this.preventDir.zeros();
            return false;
        }

        if (this.preventDir.length() > EPS) {

            this.removePreventedDirection(stick);
        }

        let sx = Math.abs(stick.x) > Math.abs(stick.y);
        let sy = !sx;

        if (preventDir.y > -EPS &&
            sy && stick.y < -EPS)
            diry = -1;
        else if (preventDir.y < EPS &&
            sy && stick.y > EPS)
            diry = 1;   
        else if (preventDir.x > -EPS &&
            sx && stick.x < -EPS)
            dirx = -1;
        else if (preventDir.x < EPS &&
            sx && stick.x > EPS)
            dirx = 1; 

        if (dirx != 0 || diry != 0) {

            if (!stage.isSolid(this.pos.x + dirx, this.pos.y + diry)) {

                this.moveDir = new Vector2(dirx, diry);
                this.moveTimer = MOVE_TIME;
                this.moving = true;

                stage.storeState();
                stage.setTile(this.pos.x, this.pos.y, 0);

                this.dustTimer = 0;

                return true;
            }
        }
        return false;
    }


    private move(stage : Stage, event : CoreEvent) {

        if (!this.moving) return;

        let ret : HitEvent;

        if ((this.moveTimer -= event.step) <= 0) {

            this.pos = Vector2.add(this.pos, this.moveDir);
            this.pos.x = negMod(this.pos.x, stage.width);
            this.pos.y = negMod(this.pos.y, stage.height);

            ret = stage.checkPlayerOverlay(
                negMod(this.pos.x + this.moveDir.x, stage.width), 
                negMod(this.pos.y + this.moveDir.y, stage.width),
                this.moveDir.x, this.moveDir.y, event);

            if (!stage.isSolid(
                this.pos.x + this.moveDir.x, 
                this.pos.y + this.moveDir.y, true) &&
                ret != HitEvent.Stop) {

                this.moveTimer += MOVE_TIME;
                this.moving = true;
            }
            else {

                this.renderPos = Vector2.scalarMultiply(this.pos, 8);
                this.moving = false;

                stage.setTile(this.pos.x, this.pos.y, 2);

                if (ret == HitEvent.Stop) {

                    this.preventDir = this.moveDir.clone();
                }
                else {

                    event.audio.playSample(event.getSample("hit"), 1.00);
                }

                return;
            }
        }

        let target = new Vector2(
            this.pos.x + this.moveDir.x,
            this.pos.y + this.moveDir.y);

        this.renderPos = Vector2.scalarMultiply(
            Vector2.lerp(this.pos, target, 1.0 - this.moveTimer / MOVE_TIME),
            8.0);
    }


    private generateDust() {

        const ANIM_SPEED = 9;

        let dust = <Dust>null;

        for (let d of this.dust) {

            if (!d.doesExist()) {

                dust = d;
                break;
            }
        }
        if (dust == null) {

            dust = new Dust();
            this.dust.push(dust);
        }

        dust.spawn(this.renderPos.x, this.renderPos.y, ANIM_SPEED);
    }


    private updateDust(event : CoreEvent) {

        const DUST_TIME = 6;

        for (let d of this.dust) {

            d.update(event);
        }

        if (!this.moving) return;

        if ((this.dustTimer += event.step) >= DUST_TIME) {

            this.generateDust();
            this.dustTimer -= DUST_TIME;
        }
    }


    public update(stage : Stage, event : CoreEvent) {

        this.move(stage, event);
        this.updateDust(event);
    }


    private drawBase(canvas : Canvas, bmp : HTMLImageElement,
        frame : number, xoff : number, yoff : number, shadow = false) {

         if (shadow) {

            canvas.drawBitmapRegion(bmp, 
                43, 3, 10, 10,
                Math.round(this.renderPos.x)-1 + xoff, 
                Math.round(this.renderPos.y)-1 + yoff);
        }
        else {

            canvas.drawBitmapRegion(bmp, 
                frame*8, 8, 8, 8,
                Math.round(this.renderPos.x) + xoff, 
                Math.round(this.renderPos.y) + yoff);
        }
    }


    public draw(canvas : Canvas, stage : Stage, shadow = false) {

        let bmp = canvas.getBitmap("blocks");

        if (shadow) {

            for (let d of this.dust) {

                d.draw(canvas);
            }
        }

        let frame = 0;
        if (this.moving) {

            if (this.moveDir.x > 0)
                frame = 1;
            else if (this.moveDir.x < 0)
                frame = 3;
            else if (this.moveDir.y > 0)
                frame = 4;
            else if (this.moveDir.y < 0)
                frame = 2;
        }

        if (this.renderPos.x < 0)
            this.drawBase(canvas, bmp, frame, stage.width*8, 0, shadow);
        else if (this.renderPos.x >= (stage.width-1)*8 )
            this.drawBase(canvas, bmp, frame, -stage.width*8, 0, shadow);
        
        if (this.renderPos.y < 0)
            this.drawBase(canvas, bmp, frame, 0, stage.height*8, shadow);
        else if (this.renderPos.y >= (stage.height-1)*8 )
            this.drawBase(canvas, bmp, frame, 0, -stage.height*8, shadow);

        this.drawBase(canvas, bmp, frame, 0, 0, shadow);

    }


    public isMoving = () : boolean => this.moving;


    public setPosition(x : number, y : number) {

        this.pos = new Vector2(x, y);
        this.renderPos = Vector2.scalarMultiply(this.pos, 8);

        for (let d of this.dust) {

            d.kill();
        }

        this.moving = false;
    }


    public checkConflict(stage : Stage) {

        if (stage.isSolid(this.pos.x + this.moveDir.x,
            this.pos.y + this.moveDir.y, true)) {

            this.moving = false;
            this.renderPos = Vector2.scalarMultiply(this.pos, 8);

            this.moveTimer = 0;
        }
    }


    public getTargetPos = () : Vector2 => 
        Vector2.scalarMultiply(
            Vector2.add(this.pos, this.moveDir), 8);
}
