import { Canvas } from "./core/canvas.js";
import { CoreEvent, Scene } from "./core/core.js";
import { clamp } from "./core/mathext.js";
import { Vector2 } from "./core/vector.js";
import { Dust } from "./dust.js";
import { GameScene } from "./game.js";


const FLOOR_Y = 48;


export class StoryIntro implements Scene  {


    private bugPos : Vector2;
    private bugSpeed : Vector2;
    private playerPos : Vector2;

    private dust : Array<Dust>;
    private dustTimer : number;


    constructor(param : any, event : CoreEvent) {

        const BUG_SPEED_X = 0.5;

        this.bugPos = new Vector2(-4, FLOOR_Y);
        this.bugSpeed = new Vector2(BUG_SPEED_X, 0);

        this.playerPos = new Vector2(-36, FLOOR_Y);

        event.transition.deactivate();

        this.dust = new Array<Dust> ();
        this.dustTimer = 0;
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

        dust.spawn(this.playerPos.x-4, this.playerPos.y-8, ANIM_SPEED);
    }



    public update(event : CoreEvent) {

        const JUMP_HEIGHT = -1.0;
        const FRICTION = 0.05;
        const DUST_TIME = 6;

        if (event.transition.isActive()) return;

        let vol = 1.0;

        if (this.bugSpeed.y > 0 && this.bugPos.y > FLOOR_Y) {

            this.bugPos.y = FLOOR_Y;
            this.bugSpeed.y = JUMP_HEIGHT;

            if (this.bugPos.x >= 68)
                vol = clamp(1.0 - (this.bugPos.x-68)/64.0, 0.01, 1.0);
            
            event.audio.playSample(event.getSample("jump"), 0.80 * vol);
        }

        this.bugSpeed.y += FRICTION * event.step;
        
        this.bugPos.x += this.bugSpeed.x * event.step;
        this.bugPos.y += this.bugSpeed.y * event.step;

        if ((this.playerPos.x += this.bugSpeed.x * event.step) > 80) {

            event.changeScene(GameScene);
        }

        for (let d of this.dust) {

            d.update(event);
        }

        if ((this.dustTimer += event.step) >= DUST_TIME) {

            this.generateDust();
            this.dustTimer -= DUST_TIME;
        }
    }


    public redraw(canvas : Canvas) {

        let bmp = canvas.getBitmap("blocks");

        canvas.clear(0, 0, 0);

        for (let d of this.dust) {

            d.draw(canvas);
        }

        canvas.drawBitmapRegion(bmp, 32, 0, 8, 8,
            Math.round(this.bugPos.x)-4,
            Math.round(this.bugPos.y)-8);

        canvas.drawBitmapRegion(bmp, 8, 8, 8, 8,
            Math.round(this.playerPos.x)-4,
            Math.round(this.playerPos.y)-8);
    }


    public dispose() : any {

        return <any> 1;
    }
}
