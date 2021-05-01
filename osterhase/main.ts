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
    private Tries: number = 0;
    public CanvasWidth: number;
    public CanvasHeight: number;
    public Rabbit: CRabbit;
    public Hole: CHole;

    constructor(canvasContext: CanvasRenderingContext2D, imageScale: number = 1) {
        this.CTX = canvasContext;
        this.ImageScale = imageScale;
        this.Floor.src = 'img/floor.png';
        this.Rabbit = new CRabbit(canvasContext, imageScale);
        this.Hole = new CHole(canvasContext, imageScale);
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
        let rabbitEvent = this.Rabbit.render(!this.WinAnimationPlaying);
        this.Hole.renderFront();
        if (rabbitEvent !== null) {
            if (rabbitEvent.event == "stoped") {
                this.handleLoss();
            } else {
                if (this.Hole.validateHit(rabbitEvent.position)) {
                    this.handleWin();
                }
            }
        }
    }

    private handleLoss() {
        this.Rabbit.attach();

        if (this.Tries >= 3) {
            this.placeHole();
        }
    }

    private handleWin() {
        EggCounter++;
        document.getElementById('eggCounter').innerText = EggCounter.toString();
        this.WinAnimationPlaying = true;
        this.Tries = 0;

    }

    private renderFloor() {
        for (let imgIndex = 0; imgIndex < Math.ceil(this.CanvasWidth / (this.Floor.width * this.ImageScale - 2)); imgIndex++) {
            this.CTX.drawImage(this.Floor, this.Floor.width * this.ImageScale * imgIndex - 2, this.CanvasHeight - this.Floor.height * this.ImageScale, this.Floor.width * this.ImageScale, this.Floor.height * this.ImageScale);
        }
    }

    public placeHole(): number {
        let position = (Math.random() * (this.CTX.canvas.width - 300 * this.ImageScale)) + 200 * this.ImageScale;
        this.Hole.setHolePosition(position);
        return position;
    }

    public releaseRabbit() {
        this.Rabbit.detach();
        this.Tries++;
    }

    public updateRabbitPosition(position: number) {
        if (this.Rabbit.IsAttachedToMouse) {
            this.Rabbit.updateY(position)
        }
    }

    public updateImgageSize(scale: number) {
        this.Rabbit.updateImgageSize(scale);
        this.ImageScale = scale;
        this.renderFloor();
    }
}

class CRabbit {
    private CTX: CanvasRenderingContext2D;
    private RabbitImg: HTMLImageElement = new Image();
    private ImageScale: number;
    private X: number = 10;
    private Y: number = 10;
    private FloorY: number;
    private RabbitHeight: number;
    private RabbitWidth: number;
    private RabbitScale = 0.3;
    private VelocityX: number;
    private VelocityY: number;
    private RabbitWeight: number = 7;
    private PixelToMeterFactor: number = 100

    public AnimationRunning
    public IsAttachedToMouse: boolean = true;


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
        this.CTX.drawImage(this.RabbitImg, this.X, this.Y, this.RabbitWidth, this.RabbitHeight);

        if (!this.IsAttachedToMouse && calculateMovement) {
            return this.runCalculation(FramesPerSecond);
        }
        return null;
    }

    private runCalculation(fps: number): null | { event: "stoped" | "hitGround"; position?: number } {
        const deltaTime = 1 / fps;
        this.VelocityY += this.RabbitWeight * 9.81 * deltaTime;
        this.Y += this.VelocityY * deltaTime * this.PixelToMeterFactor;
        this.X += this.VelocityX * deltaTime * this.PixelToMeterFactor;
        return this.checkHitTheGround();
    }

    private checkHitTheGround(): null | { event: "stoped" | "hitGround"; position?: number } {
        if (this.Y >= this.FloorY - this.RabbitHeight && this.VelocityY > 0) {
            this.VelocityY *= -1;
            this.VelocityY *= 0.9;
            this.VelocityX *= 0.9;
            if (this.VelocityX > 0.5 && this.VelocityY < -0.6 && this.X < this.CTX.canvas.width) {
                return { event: "hitGround", position: this.X + this.RabbitWeight / 2 };
            } else {
                return { event: "stoped" };
            }
        }
        return null;
    }

    public detach() {
        this.IsAttachedToMouse = false;
        this.VelocityX = 5;
        this.VelocityY = 0;
    }

    public attach() {
        this.IsAttachedToMouse = true;
        this.X = 10;
        this.Y = MouseYPos;
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
    private X = 0;

    constructor(ctx: CanvasRenderingContext2D, imageScale: number) {
        this.CTX = ctx;
        this.ImageScale = imageScale;
        this.holeBack.src = 'img/hole-back.png';
        this.holeFront.src = 'img/hole-front.png';
    }

    public setHolePosition(x: number) {
        this.X = x;
    }

    public renderBack() {
        this.CTX.drawImage(this.holeBack, this.X, this.CTX.canvas.height - this.holeBack.height * this.ImageScale, this.holeBack.width * this.ImageScale, this.holeBack.height * this.ImageScale);
    }

    public renderFront() {
        this.CTX.drawImage(this.holeFront, this.X, this.CTX.canvas.height - this.holeFront.height * this.ImageScale, this.holeFront.width * this.ImageScale, this.holeFront.height * this.ImageScale);
    }

    public validateHit(position): boolean {
        const tolerance = this.holeBack.width * this.ImageScale / 2;
        const isHit = (position > this.X - tolerance && position < this.X + this.holeBack.width * this.ImageScale + tolerance);
        return isHit;
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

window.addEventListener('click', () => {
    Gameboard.releaseRabbit();
});

// additional functions
function calculateScreensize(): number {
    return 1.25 / 1920 * window.innerWidth;
}