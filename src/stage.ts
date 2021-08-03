import { Canvas } from "./core/canvas.js";
import { CoreEvent } from "./core/core.js";
import { Tilemap } from "./core/tilemap.js";
import { RGBA, Vector2 } from "./core/vector.js";
import { PlayerBlock } from "./player.js";


const MAX_STACK_SIZE = 256;


class TileWallData {

    public srcx : Array<number>;
    public srcy : Array<number>;


    constructor() {

        this.srcx = (new Array<number> (4)).fill(0);
        this.srcy = (new Array<number> (4)).fill(0);
    }
}


class Particle {


    private pos : Vector2;
    private speed : Vector2;

    private timer : number;

    private color : RGBA;

    private exist : boolean;


    constructor() {

        this.pos = new Vector2();
        this.speed = new Vector2();

        this.color = new RGBA();

        this.exist = false;
    }


    public spawn(pos : Vector2, speed : Vector2, time : number,
        color : RGBA) {

        this.pos = pos.clone();
        this.speed = speed.clone();

        this.timer = time;

        this.color = color.clone();

        this.exist = true;
    }


    public update(event : CoreEvent) {

        if (!this.exist) return;

        this.pos.x += this.speed.x * event.step;
        this.pos.y += this.speed.y * event.step;

        if ((this.timer -= event.step) <= 0) {

            this.exist = false;
        }
    }


    public draw(canvas : Canvas) {

        if (!this.exist) return;

        canvas.setFillColor(this.color.r, this.color.g, this.color.b);
        canvas.fillRect(
            Math.round(this.pos.x),
            Math.round(this.pos.y),
            1, 1);
    }


    public doesExist = () : boolean => this.exist;


    public kill() {

        this.exist = false;
    }
}


export enum HitEvent {

    None = 0,
    Stop = 1
};


export class Stage {


    public readonly stageIndex : number;

    public readonly width : number;
    public readonly height : number;

    private stateStack : Array<Array<number>>;
    private activeState : Array<number>;

    private baseMap : Tilemap;

    private wallMap : Array<TileWallData>;

    private players : Array<PlayerBlock>;

    private particles : Array<Particle>;

    private cleared : boolean;


    constructor(index : number, event : CoreEvent) {

        this.baseMap = event.getTilemap(String(index));
        this.stageIndex = index;

        this.width = this.baseMap.width;
        this.height = this.baseMap.height;

        this.activeState = this.baseMap.cloneLayer(0);
        this.stateStack = new Array<Array<number>> ();

        this.wallMap = new Array<TileWallData> (this.width*this.height)
            .fill(null);
        this.computeWallMap();

        this.players = new Array<PlayerBlock> ();
        this.parsePlayers();

        this.particles = new Array<Particle> ();

        this.cleared = false;
    }


    private getTile(x : number, y : number, def = 1) : number {

        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return def;

        return this.activeState[y * this.width + x];
    }


    private parsePlayers() {

        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                if (this.getTile(x, y) == 2) {

                    this.players.push(new PlayerBlock(x, y));
                }
            }
        }
    }


    private computeWallMapTile(dx : number, dy : number) : TileWallData {

        let t = new TileWallData();

        let x : number;
        let y : number;
        let i : number;

        let neighborhood = new Array<boolean> (9);

        for (i = 0; i < 4; ++ i) {

            t.srcx[i] = (i % 2);
            t.srcy[i] = (i / 2);
        }

        for (x = 0; x < 3; ++ x) {

            for (y = 0; y < 3; ++ y) {
    
                neighborhood[y * 3 + x] = 
                    this.getTile(dx + x - 1, dy + y - 1) == 1;
            }
        }
    
        // Bottom
        if (!neighborhood[7]) {
    
            if (neighborhood[3]) 
                t.srcx[2] = 2;
            if (neighborhood[5]) 
                t.srcx[3] = 2;
        }
    
        // Top
        if (!neighborhood[1]) {
    
            if (neighborhood[3]) 
                t.srcx[0] = 2;
            if (neighborhood[5]) 
                t.srcx[1] = 2;
        }
    
        // Right
        if (!neighborhood[5]) {
    
            t.srcy[1] = 1;
            t.srcy[3] = 1;
    
            t.srcx[1] = 3;
            t.srcx[3] = 3;
    
            if (!neighborhood[1]) {
    
                t.srcy[1] = 0;
                t.srcx[1] = 1;
            }
    
            if (!neighborhood[7]) {
    
                t.srcy[3] = 1;
                t.srcx[3] = 1;
            }
        }
    
        // Left
        if (!neighborhood[3]) {
    
            t.srcy[0] = 0;
            t.srcy[2] = 0;
    
            t.srcx[0] = 3;
            t.srcx[2] = 3;
    
            if (!neighborhood[1]) {
    
                t.srcy[0] = 0;
                t.srcx[0] = 0;
            }
    
            if (!neighborhood[7]) {
    
                t.srcy[2] = 1;
                t.srcx[2] = 0;
            }
        }
    
        // "Empty" corners
        // (it looks like these might be non-integer without | 0
        // for some weird, *weird* reason)
        if (neighborhood[1] && neighborhood[3]) {
    
            t.srcx[0] = (4 + 2 * Number(neighborhood[0])) | 0;
        }
        if (neighborhood[1] && neighborhood[5]) {
    
            t.srcx[1] = (5 + 2 * Number(neighborhood[2])) | 0;
        }
        if (neighborhood[7] && neighborhood[3]) {
    
            t.srcx[2] = (4 + 2 * Number(neighborhood[6])) | 0;
        }
        if (neighborhood[7] && neighborhood[5]) {
    
            t.srcx[3] = (5 + 2 * Number(neighborhood[8])) | 0;
        }
        
        return t;
    }


    private computeWallMap() {

        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                if (this.getTile(x, y) == 1) {

                    this.wallMap[y * this.width + x] = this.computeWallMapTile(x, y);
                }
            }
        }
    }


    public update(event : CoreEvent) {

        for (let p of this.players) {

            p.update(this, event, !this.cleared);
        }

        for (let p of this.particles) {

            p.update(event);
        }
    }


    private drawTile(canvas : Canvas, bmp : HTMLImageElement,
        tile : TileWallData, dx : number, dy : number) {

        let sx : number;
        let sy : number;

        for (let y = 0; y < 2; ++ y) {

            for (let x = 0; x < 2; ++ x) {

                sx = tile.srcx[y*2 + x] | 0;
                sy = tile.srcy[y*2 + x] | 0;

                canvas.drawBitmapRegion(bmp,
                    sx*4, sy*4, 4, 4,
                    dx + x*4, dy + y*4);
            }
        }
    }


    private drawStaticLayer(canvas : Canvas) {

        let tile : TileWallData;
        let bmp = canvas.getBitmap("tileset");

        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                tile = this.wallMap[y * this.width + x];
                if (tile != null) {

                    this.drawTile(canvas, bmp,
                        tile, x*8, y*8);
                }
                else {

                    canvas.drawBitmapRegion(bmp,
                       Number(x % 2 == y % 2) * 8, 8, 8, 8,
                       x*8, y*8);
                }
            }
        }
    }


    private drawShadowLayer(canvas : Canvas) {

        //
        // If this wasn't for a game jam, I would
        // store shadow tile positions to an array
        // and use it to draw these things. 
        //
        // But for now, let us enjoy if statements
        //

        let bmp = canvas.getBitmap("tileset");

        let corner = false;

        canvas.setGlobalAlpha(0.33);

        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                if (this.getTile(x, y) == 1) continue;

                corner = this.getTile(x-1, y) == 1 &&
                         this.getTile(x, y-1) == 1;

                if (this.getTile(x-1, y-1) == 1) {

                    if (corner) {

                        canvas.drawBitmapRegion(bmp,
                            20, 12, 4, 4, x*8, y*8);
                    }
                    else if (this.getTile(x-1, y) != 1 &&
                             this.getTile(x, y-1) != 1) {

                        canvas.drawBitmapRegion(bmp,
                            16, 8, 4, 4, x*8, y*8);
                    }
                }
                else {

                    if (this.getTile(x-1, y) == 1) {

                        canvas.drawBitmapRegion(bmp,
                            20, 8, 4, 4, x*8, y*8);

                        corner = true;
                    }

                    if (this.getTile(x, y-1) == 1) {

                        canvas.drawBitmapRegion(bmp,
                            16, 12, 4, 4, x*8, y*8);

                        corner = true;
                    }
                }

                if (this.getTile(x-1, y) == 1) {

                    if (!corner) {
                        
                        canvas.drawBitmapRegion(bmp,
                            24, 8, 4, 4, x*8, y*8);
                    }
                    canvas.drawBitmapRegion(bmp,
                        24, 8, 4, 4, x*8, y*8 + 4);
                }
                if (this.getTile(x, y-1) == 1) {

                    if (!corner) {

                        canvas.drawBitmapRegion(bmp,
                            28, 8, 4, 4, x*8, y*8);
                    }
                    canvas.drawBitmapRegion(bmp,
                        28, 8, 4, 4, x*8 + 4, y*8);
                }
            }
        }

        canvas.setGlobalAlpha();
    }


    private drawActiveLayer(canvas : Canvas, shadow = false) {

        let bmp = canvas.getBitmap("blocks");

        let id : number;

        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                id = this.getTile(x, y);
                switch (id) {

                case 3:
                case 4:
                case 5:
                case 6:

                    if (shadow) {

                        canvas.drawBitmapRegion(bmp, 
                            43, 3, 10, 10,
                            x*8-1, y*8-1);
                    }
                    else {

                        canvas.drawBitmapRegion(bmp, 
                            (id - 3) * 8, 0, 8, 8,
                            x*8, y*8);
                    }
                    break;

                default:
                    break;
                }
            }
        }

        for (let p of this.players) {

            p.draw(canvas, this, shadow);
        }
    }


    public draw(canvas : Canvas) {

        this.drawStaticLayer(canvas);
        this.drawShadowLayer(canvas);

        this.drawActiveLayer(canvas, true);
        this.drawActiveLayer(canvas, false);

        for (let p of this.particles) {

            p.draw(canvas);
        }
    }


    public isSolid(x : number, y : number, ignoreBlocks = false) {

        const SOLID_TILES_BASE = [1, 2, 3, 4, 5, 6];
        const SOLID_TILES_IGNORE_BLOCKS = [1, 2];

        return (ignoreBlocks ?
                SOLID_TILES_IGNORE_BLOCKS : 
                SOLID_TILES_BASE)
                .includes(this.getTile(x, y, 0)); 
    }


    public setTile(x : number, y : number, value : number) {

        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return;

        this.activeState[y * this.width + x] = value;
    }


    private spawnParticle(pos : Vector2, speed : Vector2, 
        time : number, color : RGBA) {

        let part = <Particle> null;

        for (let p of this.particles) {

            if (!p.doesExist()) {

                part = p;
                break;
            }
        }

        if (part == null) {

            part = new Particle();
            this.particles.push(part);
        }

        part.spawn(pos, speed, time, color);
    }


    private spawnParticles(x : number, y : number, count : number, id = 0) {

        const LIFE_TIME = 16;
        const MIN_SPEED = 0.5;
        const MAX_SPEED = 1.0;

        const COLORS = [
            [new RGBA(0, 85, 0), new RGBA(85, 170, 0), new RGBA(170, 255, 0)],
            [new RGBA(85, 0, 170), new RGBA(170, 85, 255), new RGBA(255, 170, 255)]
        ];

        let pos = new Vector2(x*8 + 4, y*8 + 4);
        let speedVec : Vector2;
        let speed : number;
        let angle : number;

        for (let i = 0; i < count; ++ i) {

            speed = (Math.random() * (MAX_SPEED - MIN_SPEED)) + MIN_SPEED;
            angle = Math.random() * Math.PI * 2;

            speedVec = new Vector2(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed);

            this.spawnParticle(pos, speedVec, LIFE_TIME,
                COLORS[id][(Math.random() * 3) | 0]);
        }
    }


    private checkIfCleared() : boolean {

        return !this.activeState.includes(3) &&
               !this.activeState.includes(4);
    }
 

    public checkPlayerOverlay(x : number, y : number) : HitEvent {

        const RETURN_VALUE = [HitEvent.None, HitEvent.Stop];
        const PARTICLE_COUNT = 24;

        let id = this.getTile(x, y, 0);

        if (id == 3 || id == 4) {

            this.setTile(x, y, 0);
            this.spawnParticles(x, y, PARTICLE_COUNT, id-3);

            this.cleared = this.checkIfCleared();

            return RETURN_VALUE[id - 3];
        }

        return HitEvent.None;
    }


    public storeState() {

        this.stateStack.push(Array.from(this.activeState));

        if (this.stateStack.length > MAX_STACK_SIZE) {

            this.stateStack.shift();
        }
    }


    private resetPlayers() {

        let p = 0;
        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                if (this.getTile(x, y) == 2) {

                    this.players[p ++].setPosition(x, y);
                }
            }
        }
    }


    public undo(event : CoreEvent) {

        if (this.stateStack.length == 0) return;

        for (let p of this.players) {

            if (p.isMoving()) return;
        }

        this.activeState = this.stateStack.pop();

        this.resetPlayers();
    }


    public reset() {

        this.stateStack.length = 0;
        this.activeState = this.baseMap.cloneLayer(0);

        this.resetPlayers();

        for (let p of this.particles) {

            p.kill();
        }

        this.cleared = false;
    }


    public isCleared = () : boolean => this.cleared;
}
