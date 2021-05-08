const Body = document.getElementsByTagName('body')[0];
const Canvas = document.getElementById('canvas') as HTMLCanvasElement;
const CanvContext = Canvas.getContext('2d');
const FramesPerSecond = 50;
let MouseYPos = 0;
let EggCounter = 0;

class CGameboard {
    private CTX: CanvasRenderingContext2D;
    private Floor: HTMLImageElement = new Image();
    private ImageScale: number;
    private WinAnimationPlaying: boolean = false;
    private RabbitAnimationPlaying: boolean = false;
    private Tries: number = 0;
    private isStopped: number = 0;
    public CanvasWidth: number;
    public CanvasHeight: number;
    public Rabbit: CRabbit;
    public Hole: CHole;
    public Egg: CEgg;
    public Audio: CAudio;

    constructor(canvasContext: CanvasRenderingContext2D, imageScale: number = 1) {
        this.CTX = canvasContext;
        this.ImageScale = imageScale;
        this.Floor.src = 'img/floor.png';
        this.Rabbit = new CRabbit(canvasContext, imageScale);
        this.Hole = new CHole(canvasContext, imageScale);
        this.Egg = new CEgg(canvasContext);
        this.Audio = new CAudio();
    }

    public updateCanvasParams(body: HTMLElement) {
        this.CTX.canvas.width = body.clientWidth;
        this.CTX.canvas.height = body.clientHeight;
        this.CanvasWidth = this.CTX.canvas.clientWidth;
        this.CanvasHeight = this.CTX.canvas.clientHeight;
    }

    public clearCanvas() {
        this.CTX.clearRect(0, 0, this.CTX.canvas.width, this.CTX.canvas.height);
    }

    public renderFrame() {
        this.renderFloor();
        this.Hole.renderBack();
        let rabbitEvent = this.Rabbit.render(!(this.WinAnimationPlaying || this.RabbitAnimationPlaying || this.isStopped > 0));
        this.Hole.renderFront();
        this.Egg.render();

        if (this.isStopped > 1) {
            this.isStopped--;
        } else if (this.isStopped === 1) {
            this.Rabbit.attach();
            this.isStopped = 0;
        } else {
            this.evaluateEvents(rabbitEvent);
        }

        this.stopWinAnimation();
    }

    private stopWinAnimation() {
        if (this.RabbitAnimationPlaying) {
            if (!this.Rabbit.AnimationRunning) {
                this.Egg.startAnimation();
                this.WinAnimationPlaying = true;
                this.RabbitAnimationPlaying = false;
            }
        } else if (this.WinAnimationPlaying && !this.Egg.IsAnimationRunning) {
            this.Rabbit.attach();
            EggCounter++;
            document.getElementById('eggCounter').innerText = EggCounter.toString();
            this.WinAnimationPlaying = false;
            this.placeHole();
        }
    }

    private evaluateEvents(rabbitEvent: { event: "stoped" | "hitGround"; position?: number; }) {
        if (rabbitEvent !== null) {
            if (rabbitEvent.event == "stoped") {
                this.handleLoss();
            } else {
                if (this.Hole.validateHit(rabbitEvent.position)) {
                    this.Rabbit.X = this.Hole.X + 10 * this.ImageScale;
                    this.handleWin();
                } else {
                    this.Audio.playBounceSound();
                }
            }
        }
    }

    private handleLoss() {
        this.Audio.playLoseSound();
        this.isStopped = 50;

        if (this.Tries >= 3) {
            this.placeHole();
            this.Tries = 0;
        }
    }

    private handleWin() {
        this.Tries = 0;
        this.RabbitAnimationPlaying = true;
        this.Rabbit.AnimationRunning = true;
        this.Audio.playwWinSound();
    }

    private renderFloor() {
        for (let imgIndex = 0; imgIndex < Math.ceil(this.CanvasWidth / (this.Floor.width * this.ImageScale - 2)); imgIndex++) {
            this.CTX.drawImage(this.Floor, this.Floor.width * this.ImageScale * imgIndex - 2, this.CanvasHeight - this.Floor.height * this.ImageScale, this.Floor.width * this.ImageScale + 2, this.Floor.height * this.ImageScale);
        }
    }

    public placeHole(): number {
        let position = (Math.random() * (this.CTX.canvas.width - 200) / 2) + (this.CTX.canvas.width / 2);
        this.Hole.setHolePosition(position);
        return position;
    }

    public releaseRabbit(clickPositionX: number) {
        this.Rabbit.detach((clickPositionX + 100) / this.CTX.canvas.width); // +100 to prevent speed of 0
        this.Tries++;
    }

    public updateRabbitPosition(position: number) {
        if (this.Rabbit.IsAttachedToMouse) {
            this.Rabbit.updateY(position)
        }
    }

    public updateImgageSize(scale: number) {
        this.Rabbit.updateImgageSize(scale);
        this.Hole.updateImgageSize(scale);
        this.ImageScale = scale;
        this.renderFloor();
    }
}

class CRabbit {
    private CTX: CanvasRenderingContext2D;
    private RabbitImg: HTMLImageElement = new Image();
    private ImageScale: number;
    private Y: number = 10;
    private FloorY: number;
    private RabbitHeight: number;
    private RabbitWidth: number;
    private RabbitScale = 0.3;
    private VelocityX: number;
    private VelocityY: number;
    private RabbitWeight: number = 7;
    private PixelToMeterFactor: number = 100
    private hideAnimationProgress: number = 0;
    private RabbitHiddingTime = 1;
    private IsVisible: boolean = true;

    public AnimationRunning: boolean = false;
    public IsAttachedToMouse: boolean = true;
    public X: number = 10;


    constructor(ctx: CanvasRenderingContext2D, imageScale: number) {
        this.CTX = ctx;
        this.ImageScale = imageScale;
        this.RabbitImg.onload = () => {
            this.RabbitHeight = this.RabbitImg.height * imageScale * this.RabbitScale;
            this.RabbitWidth = this.RabbitImg.width * imageScale * this.RabbitScale;
        };
        this.RabbitImg.src = 'img/hase.png';
        this.FloorY = this.CTX.canvas.clientHeight - 125 * imageScale;
    }

    public render(calculateMovement: boolean): null | { event: "stoped" | "hitGround"; position?: number } {
        let event = null;
        if (!this.IsAttachedToMouse && calculateMovement) {
            this.runCalculation(FramesPerSecond);
            event = this.checkHitTheGround();
        }

        if (this.AnimationRunning) {
            let hideFrames = this.RabbitHiddingTime * FramesPerSecond;
            this.CTX.drawImage(this.RabbitImg, 0, 0, this.RabbitImg.width, this.RabbitImg.height / hideFrames * (hideFrames - this.hideAnimationProgress), this.X, this.Y + this.RabbitHeight / hideFrames * this.hideAnimationProgress, this.RabbitWidth, this.RabbitHeight / hideFrames * (hideFrames - this.hideAnimationProgress));

            if (this.hideAnimationProgress > hideFrames) {
                this.AnimationRunning = false;
                this.hideAnimationProgress = 0;
                this.IsVisible = false;
            } else {
                this.hideAnimationProgress++;
            }
        } else if (this.IsVisible) {
            this.CTX.drawImage(this.RabbitImg, this.X, this.Y, this.RabbitWidth, this.RabbitHeight);
        }

        return event;
    }

    private runCalculation(fps: number) {
        const deltaTime = 1 / fps;
        this.VelocityY += this.RabbitWeight * 9.81 * deltaTime;
        this.Y += this.VelocityY * deltaTime * this.PixelToMeterFactor * this.ImageScale;
        this.X += this.VelocityX * deltaTime * this.PixelToMeterFactor * this.ImageScale;
    }

    private checkHitTheGround(): null | { event: "stoped" | "hitGround"; position?: number } {
        if (this.Y >= this.FloorY - this.RabbitHeight && this.VelocityY > 0) {
            this.VelocityY *= -1;
            this.VelocityY *= 0.9;
            this.VelocityX *= 0.9;
            if (this.VelocityX > 0.5 && this.VelocityY < -0.6 && this.X + this.RabbitWidth < this.CTX.canvas.width + 10) {
                this.Y = this.FloorY - this.RabbitHeight + 15; // prevent rabbit being drawn in the ground
                return { event: "hitGround", position: this.X + this.RabbitWidth / 2 };
            } else {
                return { event: "stoped" };
            }
        } else if (this.X + this.RabbitWidth > this.CTX.canvas.width + 10) {
            console.log();

            return { event: "stoped" }
        }
        return null;
    }

    public detach(speed: number) {
        this.IsAttachedToMouse = false;
        this.VelocityX = 10 * speed;
        this.VelocityY = 0;
    }

    public attach() {
        this.IsAttachedToMouse = true;
        this.X = 10;
        this.Y = MouseYPos;
        this.IsVisible = true;
    }

    public updateY(mousePosition: number) {
        let newYPos = mousePosition - (this.RabbitHeight / 2);
        if (mousePosition > this.FloorY - this.RabbitHeight / 2) {
            newYPos = this.FloorY - this.RabbitHeight;
        }
        this.Y = newYPos;
    }

    public updateImgageSize(scale: number) {
        this.ImageScale = scale;
        this.RabbitHeight = this.RabbitImg.height * scale * this.RabbitScale;
        this.RabbitWidth = this.RabbitImg.width * scale * this.RabbitScale;
        this.FloorY = this.CTX.canvas.clientHeight - 125 * scale;
        this.render(true);
    }
}

class CHole {
    private CTX: CanvasRenderingContext2D;
    private ImageScale: number;
    private holeBack: HTMLImageElement = new Image();
    private holeFront: HTMLImageElement = new Image();
    public X = 0;

    constructor(ctx: CanvasRenderingContext2D, imageScale: number) {
        this.CTX = ctx;
        this.ImageScale = imageScale;
        this.holeBack.src = 'img/hole-back.png';
        this.holeFront.src = 'img/hole-front.png';
    }

    public setHolePosition(x: number) {
        this.X = x;
    }

    public updateImgageSize(scale: number) {
        this.ImageScale = scale;
        if (this.X + this.holeBack.width * this.ImageScale > this.CTX.canvas.width) {
            let position = (Math.random() * (this.CTX.canvas.width - 200) / 2) + (this.CTX.canvas.width / 2);
            this.setHolePosition(position);
        }
    }

    public renderBack() {
        this.CTX.drawImage(this.holeBack, this.X, this.CTX.canvas.height - this.holeBack.height * this.ImageScale, this.holeBack.width * this.ImageScale, this.holeBack.height * this.ImageScale);
    }

    public renderFront() {
        this.CTX.drawImage(this.holeFront, this.X, this.CTX.canvas.height - this.holeFront.height * this.ImageScale, this.holeFront.width * this.ImageScale, this.holeFront.height * this.ImageScale);
    }

    public validateHit(position): boolean {
        const tolerance = -20 * this.ImageScale;
        const isHit = (position > this.X - tolerance && position < this.X + this.holeBack.width * this.ImageScale + tolerance);
        return isHit;
    }
}

class CEgg {
    private CTX: CanvasRenderingContext2D;
    private Egg: HTMLImageElement = new Image();
    private X: number;
    private Y: number;
    private End: number;
    private Step: number;
    public IsAnimationRunning = false;

    constructor(ctx: CanvasRenderingContext2D) {
        this.CTX = ctx;
        this.Egg.src = 'img/egg.png';
    }

    public startAnimation() {
        this.IsAnimationRunning = true;
        this.X = this.CTX.canvas.width / 2 - 150;
        this.Y = this.CTX.canvas.height;
        this.End = this.CTX.canvas.height / 2 - 150;
        this.Step = (this.Y - this.End) / 50

    }

    public render() {
        if (this.IsAnimationRunning) {
            if (this.Y < this.End) {
                this.IsAnimationRunning = false;
                this.CTX.drawImage(this.Egg, this.X, this.Y, 300, 300);
            } else {
                this.Y -= this.Step;
                this.CTX.drawImage(this.Egg, this.X, this.Y, 300, 300);
            }
        }
    }
}

class CAudio {
    public winSound = new Audio();
    public bounceSound = new Audio();
    public loseSound = new Audio();
    public audioOn: boolean = true;

    constructor() {
        this.winSound.src = 'res/win.mp3';
        this.bounceSound.src = 'res/bounce.mp3';
        this.loseSound.src = 'res/lose.mp3';

        let btn = document.getElementById('audioBtn') as HTMLButtonElement;
        btn.addEventListener('click', ()=>{
            if (this.audioOn) {
                btn.innerText = "Ton einschalten";
                this.audioOn = false;
            } else {
                btn.innerText = "Ton ausschalten";
                this.audioOn = true;
            }
            return false;
        });

    }

    public playwWinSound() {
        if (this.audioOn) {
            this.winSound.currentTime = 0;
            this.winSound.play();
        }
    }
    public playBounceSound() {
        if (this.audioOn) {
            this.bounceSound.currentTime = 0;
            this.bounceSound.play();
        }
    }
    public playLoseSound() {
        if (this.audioOn) {
            this.loseSound.currentTime = 0;
            this.loseSound.play();
        }
    }

}

const Gameboard = new CGameboard(CanvContext, calculateScreensize());
Gameboard.updateCanvasParams(Body);
Gameboard.placeHole();

setTimeout(() => {
    setInterval(() => {
        Gameboard.clearCanvas();
        Gameboard.renderFrame();
    }, 1000 / FramesPerSecond);
}, 500);

// eventlisteners
window.addEventListener('resize', () => {
    Gameboard.updateCanvasParams(Body);
    Gameboard.updateImgageSize(calculateScreensize());
});

window.addEventListener('mousemove', (e: MouseEvent) => {
    MouseYPos = e.clientY;
    Gameboard.updateRabbitPosition(MouseYPos);
});

window.addEventListener('click', (e: MouseEvent) => {
    Gameboard.releaseRabbit(e.clientX);
});

// additional functions
function calculateScreensize(): number {
    return 1.25 / 1920 * window.innerWidth;
}