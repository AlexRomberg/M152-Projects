class CMain {
    // elements
    private Canvas: HTMLCanvasElement = null;
    private CTX: CanvasRenderingContext2D;
    private Glass: HTMLImageElement = new Image();
    private Foam: HTMLImageElement = new Image();
    private BubbleList: CBubble[] = [];

    // dynamic params
    public XLeft: number;
    public XRight: number;
    public YBottom: number;
    public YTop: number;
    public ImageScale: number;
    public FPS: number;
    static BUBBLE_STROKE = '#fff';

    constructor(imageScale: number, fps :number) {
        this.Canvas = document.getElementById('canv') as HTMLCanvasElement;
        this.CTX = this.Canvas.getContext('2d');

        this.Glass.src = 'Bier.png';
        this.Foam.src = 'Schaum.png';

        this.ImageScale = imageScale;
        this.FPS = fps;
    }

    public calculateParams() {
        this.Canvas.width = this.Glass.width * ImageScale;
        this.Canvas.height = this.Glass.height * ImageScale;

        // calculate dynamic params
        this.XLeft = this.Canvas.width / 4;
        this.XRight = this.Canvas.width / 4 * 3;
        this.YBottom = this.Canvas.height / 10 * 8.75;
        this.YTop = this.Foam.height * ImageScale;
    }

    public renderFrame() {
        this.clearCanvas();
        this.renderGlass();

        this.BubbleList.forEach(bubble => {
            bubble.renderBubble();
        });

        this.cleanDoneBubble();

        this.renderFoam();
    }

    private cleanDoneBubble() {
        for (let bubbleId = this.BubbleList.length - 1; bubbleId >= 0; bubbleId--) {
            if(this.BubbleList[bubbleId].done) {
                this.BubbleList.splice(bubbleId, 1);
            }
        }
    }

    public addBubble() {
        this.BubbleList.push(new CBubble(this, this.CTX));
    }

    private clearCanvas() {
        this.CTX.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
    }

    private renderGlass() {
        this.CTX.drawImage(this.Glass, 0, 0, this.Canvas.width, this.Canvas.height);
    }

    private renderFoam() {
        this.CTX.drawImage(this.Foam, 0, 0, this.Foam.width * ImageScale, this.Foam.height * ImageScale);
    }
}

class CBubble {
    private MainClass: CMain;
    private PosX: number;
    private PosY: number;
    private Size: number;
    private RenderingContext: CanvasRenderingContext2D;
    private Velocity

    public done = false;

    constructor(mainClass: CMain, renderingContext: CanvasRenderingContext2D) {
        this.MainClass = mainClass;
        this.PosX = (Math.random() * (mainClass.XRight - mainClass.XLeft)) + mainClass.XLeft;
        this.PosY = mainClass.YBottom;
        this.Size = (Math.random() * 5 + 1) * mainClass.ImageScale;
        this.RenderingContext = renderingContext;
    }

    public renderBubble() {
        this.RenderingContext.strokeStyle = CMain.BUBBLE_STROKE;
        this.RenderingContext.beginPath();
        this.RenderingContext.ellipse(this.PosX, this.PosY, this.Size, this.Size, 0, 0, Math.PI * 2);
        this.RenderingContext.stroke();

        this.calculateMovement();
    }

    private calculateMovement() {
        this.PosY -= this.Size;
        if (this.PosY < this.MainClass.YTop) {
            this.done = true;
        }
    }
}



// fix params
const ImageScale = 1.25, FPS = 50, BubbleIntesity = 2; /* BubbleIntesity ist ein Wert [0-99] für die Anzahl Frames pro Blase. */
const mainClass = new CMain(ImageScale, FPS);
let FrameCount = 0;

// start Animation
setTimeout(() => {
    mainClass.calculateParams();
    setInterval(() => {
        FrameCount++;
        mainClass.renderFrame();
        if (FrameCount % BubbleIntesity == 0) {
            mainClass.addBubble();
        }
    }, 1000 / FPS);
}, 100);