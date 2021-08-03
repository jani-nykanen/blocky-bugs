import { Canvas } from "./core/canvas.js";
import { CoreEvent } from "./core/core.js";
import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";
import { Stage } from "./stage.js";


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

    private dust : Array<Dust>;
    private dustTimer : number;


    constructor(x : number, y : number) {

        this.pos = new Vector2(x, y);
        this.renderPos = new Vector2(x*8, y*8);
    
        this.moveDir = new Vector2(0, 0);
        this.moveTimer = 0;
        this.moving = false;
    
        this.dust = new Array<Dust> ();
    }


    private control(stage : Stage, event : CoreEvent) {

        const EPS = 0.25;

        if (this.moving) return;

        let dirx = 0;
        let diry = 0;

        let stick = event.input.getStick();
        if (stick.length() < EPS) return;

        let sx = Math.abs(stick.x) > Math.abs(stick.y);
        let sy = !sx;

        if (sy && stick.y < -EPS)
            diry = -1;
        else if (sy && stick.y > EPS)
            diry = 1;   
        else if (sx && stick.x < -EPS)
            dirx = -1;
        else if (sx && stick.x > EPS)
            dirx = 1; 

        if (dirx != 0 || diry != 0) {

            if (!stage.isSolid(this.pos.x + dirx, this.pos.y + diry)) {

                this.moveDir = new Vector2(dirx, diry);
                this.moveTimer = MOVE_TIME;
                this.moving = true;

                stage.storeState();
                stage.setTile(this.pos.x, this.pos.y, 0);

                this.dustTimer = 0;
            }
        }
    }


    private move(stage : Stage, event : CoreEvent) {

        if (!this.moving) return;

        if ((this.moveTimer -= event.step) <= 0) {

            this.pos = Vector2.add(this.pos, this.moveDir);

            stage.checkPlayerOverlay(
                this.pos.x + this.moveDir.x, 
                this.pos.y + this.moveDir.y);

            if (!stage.isSolid(
                this.pos.x + this.moveDir.x, 
                this.pos.y + this.moveDir.y, true)) {

                this.moveTimer += MOVE_TIME;
                this.moving = true;

            }
            else {

                this.renderPos = Vector2.scalarMultiply(this.pos, 8);
                this.moving = false;

                stage.setTile(this.pos.x, this.pos.y, 2);

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

        this.control(stage, event);
        this.move(stage, event);

        this.updateDust(event);
    }


    public draw(canvas : Canvas, shadow = false) {

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

        if (shadow) {

            canvas.drawBitmapRegion(bmp, 
                43, 3, 10, 10,
                Math.round(this.renderPos.x)-1, 
                Math.round(this.renderPos.y)-1);
        }
        else {

            canvas.drawBitmapRegion(bmp, 
                frame*8, 8, 8, 8,
                Math.round(this.renderPos.x), 
                Math.round(this.renderPos.y));
        }
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
}
