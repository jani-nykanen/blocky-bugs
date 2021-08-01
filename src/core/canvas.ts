import { AssetManager } from "./assets.js";
import { CoreEvent } from "./core.js";
import { Sprite } from "./sprite.js";
import { clamp } from "./mathext.js";
import { Vector2 } from "./vector.js";


export enum Flip {

    None = 0,
    Horizontal = 1,
    Vertical = 2,
    Both = 3,
};


export class Canvas {

    public readonly width : number;
    public readonly height : number;

    private assets : AssetManager;

    private canvas : HTMLCanvasElement;
    private ctx : CanvasRenderingContext2D;

    private translation : Vector2;

    private shakeTimer : number;
    private shakeAmount : number;


    constructor(width : number, height : number, assets : AssetManager) {

        this.width = width;
        this.height = height;    

        this.translation = new Vector2();

        this.assets = assets;

        this.createHtml5Canvas(width, height);
        window.addEventListener("resize", () => this.resize(
            window.innerWidth, window.innerHeight));
    
        this.shakeTimer = 0;
        this.shakeAmount = 0;
    }


    private createHtml5Canvas(width : number, height : number) {

        let cdiv = document.createElement("div");
        cdiv.setAttribute("style", 
            "position: absolute; top: 0; left: 0; z-index: -1;");

        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;

        this.canvas.setAttribute(
            "style", 
            "position: absolute; top: 0; left: 0; z-index: -1;" + 
            "image-rendering: optimizeSpeed;" + 
            "image-rendering: pixelated;" +
            "image-rendering: -moz-crisp-edges;"
            );
        cdiv.appendChild(this.canvas);
        document.body.appendChild(cdiv);

        this.ctx = this.canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;

        this.resize(window.innerWidth, window.innerHeight);
    }


    private getColorString(r : number, g : number, b : number, a = 1.0) : string {

        return "rgba(" + String(r | 0) + "," + 
            String(g | 0) + "," + 
            String(b | 0) + "," + 
            String(clamp(a, 0.0, 1.0));
    }


    private resize(width : number, height : number) {

        let c = this.canvas;

        // Find the best multiplier for
        // square pixels (unless too small for that)
        let mul = Math.min(
            width / c.width, 
            height / c.height);
        if (mul >= 1.0) {

            mul = Math.floor(mul);
        }

        let totalWidth = c.width * mul;
        let totalHeight = c.height * mul;
        let x = width/2 - totalWidth/2;
        let y = height/2 - totalHeight/2;

        let top = String(y | 0) + "px";
        let left = String(x | 0) + "px";

        c.style.width = String(totalWidth | 0) + "px";
        c.style.height = String(totalHeight | 0) + "px";
        
        c.style.top = top;
        c.style.left = left;
    }


    public moveTo(x = 0.0, y = 0.0) {

        this.translation.x = x | 0;
        this.translation.y = y | 0;
    }


    public move(x : number, y : number) {

        this.translation.x += x | 0;
        this.translation.y += y | 0;
    }


    public clear(r : number, g : number, b : number) {

        this.ctx.fillStyle = this.getColorString(r, g, b);
        this.ctx.fillRect(0, 0, this.width, this.height);
    }


    public setFillColor(r : number, g = r, b = g, a = 1.0) {

        let colorStr = this.getColorString(r, g, b, a);

        this.ctx.fillStyle = colorStr;
        // this.ctx.strokeStyle = colorStr;
    }


    public setGlobalAlpha(a = 1.0) {

        this.ctx.globalAlpha = clamp(a, 0, 1);
    }


    public fillRect(x : number, y : number, w : number, h : number) {

        x += this.translation.x;
        y += this.translation.y;

        this.ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
    }


    public drawBitmap(bmp : HTMLImageElement, 
        dx : number, dy : number, flip = Flip.None) {

        this.drawBitmapRegion(bmp, 
            0, 0, bmp.width, bmp.height,
            dx, dy, flip);
    }


    public drawScaledBitmap(bmp : HTMLImageElement, 
        dx : number, dy : number, dw : number, dh : number,
         flip = Flip.None) {

        this.drawScaledBitmapRegion(bmp, 
            0, 0, bmp.width, bmp.height,
            dx, dy, dw, dh, flip);
    }

    
    public drawBitmapRegion(bmp : HTMLImageElement, 
        sx : number, sy : number, sw : number, sh : number, 
        dx : number, dy : number, flip = Flip.None) {

        this.drawScaledBitmapRegion(bmp, sx, sy, sw, sh,
            dx, dy, sw, sh, flip);
    }


    public drawScaledBitmapRegion(bmp : HTMLImageElement, 
        sx : number, sy : number, sw : number, sh : number, 
        dx : number, dy : number, dw : number, dh : number, 
        flip = Flip.None) {

        if (bmp == null || sw <= 0 || sh <= 0) 
            return;

        let c = this.ctx;

        dx += this.translation.x;
        dy += this.translation.y;

        sx |= 0;
        sy |= 0;
        sw |= 0;
        sh |= 0;

        dx |= 0;
        dy |= 0;
        dw |= 0;
        dh |= 0;

        flip = flip | Flip.None;
        
        if (flip != Flip.None) {
            c.save();
        }

        if ((flip & Flip.Horizontal) != 0) {

            c.translate(dw, 0);
            c.scale(-1, 1);
            dx *= -1;
        }
        if ((flip & Flip.Vertical) != 0) {

            c.translate(0, dh);
            c.scale(1, -1);
            dy *= -1;
        }

        c.drawImage(bmp, sx, sy, sw, sh, dx, dy, dw, dh);

        if (flip != Flip.None) {

            c.restore();
        }
    }


    public drawRotatedScaledBitmapRegion(bmp : HTMLImageElement, 
        sx : number, sy : number, sw : number, sh : number, 
        dx : number, dy : number, dw : number, dh : number, 
        angle : number, centerx : number, centery : number,
        flip = Flip.None) {

        if (bmp == null || sw <= 0 || sh <= 0) 
            return;

        let c = this.ctx;

        dx += this.translation.x;
        dy += this.translation.y;

        sx |= 0;
        sy |= 0;
        sw |= 0;
        sh |= 0;

        dx |= 0;
        dy |= 0;
        dw |= 0;
        dh |= 0;

        flip = flip | Flip.None;
        
        c.save();

        if ((flip & Flip.Horizontal) != 0) {

            c.translate(dw, 0);
            c.scale(-1, 1);
            dx *= -1;
        }
        if ((flip & Flip.Vertical) != 0) {

            c.translate(0, dh);
            c.scale(1, -1);
            dy *= -1;
        }

        c.translate(dx, dy);
        c.rotate(angle);

        c.drawImage(bmp, sx, sy, sw, sh, -dw/2, -dh/2, dw, dh);

        c.restore();
        
    }


    public drawText(font : HTMLImageElement, str : string, 
        dx : number, dy : number, 
        xoff = 0.0, yoff = 0.0, center = false, scalex = 1, scaley = 1,
        wave = 0.0, amplitude = 0.0, period = 0.0) {

        let cw = (font.width / 16) | 0;
        let ch = cw;

        let x = dx;
        let y = dy;
        let c : number;

        let yoffset : number;

        if (center) {

            dx -= ((str.length+1) * (cw + xoff) * scalex)/ 2.0 ;
            x = dx;
        }

        for (let i = 0; i < str.length; ++ i) {

            c = str.charCodeAt(i);
            if (c == '\n'.charCodeAt(0)) {

                x = dx;
                y += (ch + yoff) * scaley;
                continue;
            }

            yoffset = Math.sin(wave + i * period) * amplitude;

            this.drawScaledBitmapRegion(
                font, 
                (c % 16) * cw, ((c/16)|0) * ch,
                cw, ch, 
                x, y + yoffset, 
                cw * scalex, ch * scaley, Flip.None);

            x += (cw + xoff) * scalex;
        }
    }


    public drawScaledSpriteFrame(spr : Sprite, bmp : HTMLImageElement, 
        column : number, row : number,
        dx : number, dy : number, dw : number, dh : number,
        flip = Flip.None) {

        spr.drawScaledFrame(this, bmp, column, row, dx, dy, dw, dh, flip);
    }


    public drawSpriteFrame(spr : Sprite, bmp : HTMLImageElement, 
        column : number, row : number,
        dx : number, dy : number, flip = Flip.None) {

        spr.drawFrame(this, bmp, column, row, dx, dy, flip);
    }


    public drawSprite(spr : Sprite, bmp : HTMLImageElement, 
        dx : number, dy : number, flip = Flip.None) {

        spr.draw(this, bmp, dx, dy, flip);
    }
    

    public drawScaledSprite(spr : Sprite, bmp : HTMLImageElement, 
        dx : number, dy : number, dw : number, dh : number, 
        flip = Flip.None) {

        spr.drawScaled(this, bmp, dx, dy, dw, dh, flip);
    }


    public fillCircleOutside(r : number, cx : number, cy : number) {

        let c = this.ctx;

        if (r <= 0) {

            c.fillRect(0, 0, this.width, this.height);
            return;
        }
        else if (r*r >= this.width*this.width + this.height*this.height) {

            return;
        }

        if (cx == null)
            cx = this.width / 2;
        if (cy == null)
            cy = this.height / 2;
        
        let start = Math.max(0, cy - r) | 0;
        let end = Math.min(this.height, cy + r) | 0;

        // Areas below and on the top of the circle area
        if (start > 0)
            c.fillRect(0, 0, this.width, start);
        if (end < this.height)
            c.fillRect(0, end, this.width, this.height - end);

        let dy : number;
        let px1 : number;
        let px2 : number;
        
        for (let y = start; y < end; ++ y) {

            dy = y - cy;

            if (Math.abs(dy) >= r) {

                c.fillRect(0, y | 0, this.width | 0, 1);
                continue;
            }

            px1 = Math.round(cx - Math.sqrt(r*r - dy*dy));
            px2 = Math.round(cx + Math.sqrt(r*r - dy*dy));

            // Left side
            if (px1 > 0)
                c.fillRect(0, y | 0, px1 | 0, 1);
            // Right side
            if (px2 < this.width)
                c.fillRect(px2 | 0, y | 0, (this.width-px1) | 0, 1);
        }
    }


    public getBitmap(name : string) : HTMLImageElement {

        return this.assets.getBitmap(name);
    }


    public shake(shakeTime : number, shakeAmount : number) {

        this.shakeTimer = shakeTime;
        this.shakeAmount = shakeAmount;
    }


    public update(event : CoreEvent) {

        if (this.shakeTimer > 0) {

            this.shakeTimer -= event.step;
        }
    }


    public applyShake() {

        let shakex = Math.round((Math.random() * this.shakeAmount * 2) - this.shakeAmount);
        let shakey = Math.round((Math.random() * this.shakeAmount * 2) - this.shakeAmount);

        this.move(shakex, shakey);
    }
}
