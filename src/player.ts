import { Canvas } from "./core/canvas.js";
import { CoreEvent } from "./core/core.js";
import { Vector2 } from "./core/vector.js";
import { Stage } from "./stage.js";


const MOVE_TIME = 10;


export class PlayerBlock {


    private pos : Vector2;
    private renderPos : Vector2;

    private moveDir : Vector2;
    private moveTimer : number;
    private moving : boolean;


    constructor(x : number, y : number) {

        this.pos = new Vector2(x, y);
        this.renderPos = new Vector2(x*8, y*8);
    
        this.moveDir = new Vector2(0, 0);
        this.moveTimer = 0;
        this.moving = false;
    }


    private control(stage : Stage, event : CoreEvent) {

        if (this.moving) return;

        let dirx = 0;
        let diry = 0;

        if (event.input.upPress())
            diry = -1;
        else if (event.input.downPress())
            diry = 1;   
        else if (event.input.leftPress())
            dirx = -1;
        else if (event.input.rightPress())
            dirx = 1; 

        if (dirx != 0 || diry != 0) {

            if (!stage.isSolid(this.pos.x + dirx, this.pos.y + diry)) {

                this.moveDir = new Vector2(dirx, diry);
                this.moveTimer = MOVE_TIME;
                this.moving = true;

                stage.setTile(this.pos.x, this.pos.y, 0);
            }
        }
    }


    private move(stage : Stage, event : CoreEvent) {

        if (!this.moving) return;

        if ((this.moveTimer -= event.step) <= 0) {

            this.pos = Vector2.add(this.pos, this.moveDir);

            stage.checkPlayerOverlay(this.pos.x, this.pos.y);

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


    public update(stage : Stage, event : CoreEvent) {

        this.control(stage, event);
        this.move(stage, event);
    }


    public draw(canvas : Canvas, shadow = false) {

        let bmp = canvas.getBitmap("blocks");

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
                this.renderPos.x-1, 
                this.renderPos.y-1);
        }
        else {

            canvas.drawBitmapRegion(bmp, 
                frame*8, 8, 8, 8,
                this.renderPos.x, 
                this.renderPos.y);
        }
    }
}
