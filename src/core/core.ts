import { AssetManager } from "./assets.js";
import { AudioPlayer } from "./audioplayer.js";
import { Canvas } from "./canvas.js";
import { InputManager } from "./input.js";
import { AudioSample } from "./sample.js";
import { Tilemap } from "./tilemap.js";
import { TransitionEffectManager } from "./transition.js";


export class CoreEvent {


    public readonly step : number;
    public readonly transition : TransitionEffectManager;
    public readonly audio : AudioPlayer;
    public readonly input : InputManager;

    private readonly assets : AssetManager;
    private readonly core : Core;
    private readonly canvas : Canvas;


    constructor(step : number, core : Core,
        input : InputManager, assets : AssetManager,
        transition : TransitionEffectManager,
        canvas : Canvas, audio : AudioPlayer) {

        this.core = core;
        this.step = step;
        this.input = input;
        this.assets = assets;
        this.transition = transition;
        this.canvas = canvas;
        this.audio = audio;
    }


    public changeScene(newScene : Function) {

        this.core.changeScene(newScene);
    }
    

    public getSample = (name : string) : AudioSample => this.assets.getSample(name);
    public getTilemap = (name : string) : Tilemap => this.assets.getTilemap(name);


    public shake = (shakeAmount : number, shakeTime : number) : void => 
        this.canvas.shake(shakeTime, shakeAmount);
}


export interface Scene {

    update(ev : CoreEvent) : void;
    redraw(canvas : Canvas) : void;

    // TODO: Replace any with... something 
    // Maybe generics? (Generic interface...?)
    dispose() : any;
}


export class Core {

    private canvas : Canvas;
    private assets : AssetManager;
    private input : InputManager;
    private transition : TransitionEffectManager;
    private event : CoreEvent;
    private audio : AudioPlayer;

    private activeScene : Scene;
    private activeSceneType : Function;

    private timeSum : number;
    private oldTime : number;

    private initialized : boolean;


    constructor(canvasWidth : number, canvasHeight : number, frameSkip = 0) {

        this.audio = new AudioPlayer();
        this.assets = new AssetManager(this.audio,);
        this.canvas = new Canvas(canvasWidth, canvasHeight, this.assets);
        this.assets.passCanvas(this.canvas);

        this.input = new InputManager();
        this.input.addAction("left", null, "ArrowLeft", 14)
            .addAction("up", null, "ArrowUp", 12)
            .addAction("right", null, "ArrowRight", 15)
            .addAction("down", null, "ArrowDown", 13),

        this.transition = new TransitionEffectManager();
        
        this.event = new CoreEvent(frameSkip+1, this,
            this.input, this.assets, this.transition,
            this.canvas, this.audio);

        this.timeSum = 0.0;
        this.oldTime = 0.0;

        this.initialized = false;

        this.activeScene = null;
        this.activeSceneType = null;
    }


    private drawLoadingScreen(canvas : Canvas) {

        const BAR_BORDER_WIDTH = 1;

        let barWidth = canvas.width / 4;
        let barHeight = barWidth / 8;

        canvas.clear(0, 0, 0);
    
        let t = this.assets.dataLoadedUnit();
        let x = canvas.width/2 - barWidth/2;
        let y = canvas.height/2 - barHeight/2;

        x |= 0;
        y |= 0;
    
        // Outlines
        canvas.setFillColor(255);
        canvas.fillRect(x-BAR_BORDER_WIDTH*2, y-BAR_BORDER_WIDTH*2, 
            barWidth+BAR_BORDER_WIDTH*4, barHeight+BAR_BORDER_WIDTH*4);
        canvas.setFillColor(0);
        canvas.fillRect(x-BAR_BORDER_WIDTH, y-BAR_BORDER_WIDTH, 
            barWidth+BAR_BORDER_WIDTH*2, barHeight+BAR_BORDER_WIDTH*2);
    
        // Bar
        let w = (barWidth*t) | 0;
        canvas.setFillColor(255);
        canvas.fillRect(x, y, w, barHeight);
        
    }


    private loop(ts : number, onLoad : ((ev : CoreEvent) => void)) {

        const MAX_REFRESH_COUNT = 5;
        const FRAME_WAIT = 16.66667 * this.event.step;

        this.timeSum += ts - this.oldTime;
        this.timeSum = Math.min(MAX_REFRESH_COUNT * FRAME_WAIT, this.timeSum);
        this.oldTime = ts;

        let refreshCount = (this.timeSum / FRAME_WAIT) | 0;
        while ((refreshCount --) > 0) {

            if (!this.initialized && this.assets.hasLoaded()) {
                
                onLoad(this.event);

                if (this.activeSceneType != null)
                    this.activeScene = new this.activeSceneType.prototype.constructor(null, this.event);
                    
                this.initialized = true;
            }

            this.input.preUpdate();

            if (this.initialized && this.activeScene != null) {

                this.activeScene.update(this.event);
            }
            this.transition.update(this.event);

            this.input.postUpdate();

            this.timeSum -= FRAME_WAIT;
        }

        if (this.initialized) {

            if (this.activeScene != null)
                this.activeScene.redraw(this.canvas);
            this.transition.draw(this.canvas);
        }
        else {

            this.drawLoadingScreen(this.canvas);
        }

        window.requestAnimationFrame(ts => this.loop(ts, onLoad));
    }


    public addInputAction(name : string, 
        key1 : string, key2 = null, 
        button1 = -1, button2 = -1) : Core {

        this.input.addAction(name, key1, key2, button1, button2);

        return this;
    }


    public loadAssets(indexFilePath : string) : Core {

        this.assets.parseAssetIndexFile(indexFilePath);

        return this;
    }


    public run(initialScene : Function, onLoad : ((ev : CoreEvent) => void) = () => {}) {

        this.activeSceneType = initialScene;

        this.loop(0, onLoad);
    }


    public changeScene(newScene : Function) {

        let param = this.activeScene.dispose();
        this.activeScene = new newScene.prototype.constructor(param, this.event);
    }
    
}
