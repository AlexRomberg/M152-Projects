var CMain = /** @class */ (function () {
    function CMain(imageScale, fps) {
        // elements
        this.Canvas = null;
        this.Glass = new Image();
        this.Foam = new Image();
        this.BubbleList = [];
        this.Canvas = document.getElementById('canv');
        this.CTX = this.Canvas.getContext('2d');
        this.Glass.src = 'Bier.png';
        this.Foam.src = 'Schaum.png';
        this.ImageScale = imageScale;
        this.FPS = fps;
    }
    CMain.prototype.calculateParams = function () {
        this.Canvas.width = this.Glass.width * ImageScale;
        this.Canvas.height = this.Glass.height * ImageScale;
        // calculate dynamic params
        this.XLeft = this.Canvas.width / 4;
        this.XRight = this.Canvas.width / 4 * 3;
        this.YBottom = this.Canvas.height / 10 * 8.75;
        this.YTop = this.Foam.height * ImageScale;
    };
    CMain.prototype.renderFrame = function () {
        this.clearCanvas();
        this.renderGlass();
        this.BubbleList.forEach(function (bubble) {
            bubble.renderBubble();
        });
        this.cleanDoneBubble();
        this.renderFoam();
    };
    CMain.prototype.cleanDoneBubble = function () {
        for (var bubbleId = this.BubbleList.length - 1; bubbleId >= 0; bubbleId--) {
            if (this.BubbleList[bubbleId].done) {
                this.BubbleList.splice(bubbleId, 1);
            }
        }
    };
    CMain.prototype.addBubble = function () {
        this.BubbleList.push(new CBubble(this, this.CTX));
    };
    CMain.prototype.clearCanvas = function () {
        this.CTX.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
    };
    CMain.prototype.renderGlass = function () {
        this.CTX.drawImage(this.Glass, 0, 0, this.Canvas.width, this.Canvas.height);
    };
    CMain.prototype.renderFoam = function () {
        this.CTX.drawImage(this.Foam, 0, 0, this.Foam.width * ImageScale, this.Foam.height * ImageScale);
    };
    CMain.BUBBLE_STROKE = '#fff';
    return CMain;
}());
var CBubble = /** @class */ (function () {
    function CBubble(mainClass, renderingContext) {
        this.done = false;
        this.MainClass = mainClass;
        this.PosX = (Math.random() * (mainClass.XRight - mainClass.XLeft)) + mainClass.XLeft;
        this.PosY = mainClass.YBottom;
        this.Size = (Math.random() * 5 + 1) * mainClass.ImageScale;
        this.RenderingContext = renderingContext;
    }
    CBubble.prototype.renderBubble = function () {
        this.RenderingContext.strokeStyle = CMain.BUBBLE_STROKE;
        this.RenderingContext.beginPath();
        this.RenderingContext.ellipse(this.PosX, this.PosY, this.Size, this.Size, 0, 0, Math.PI * 2);
        this.RenderingContext.stroke();
        this.calculateMovement();
    };
    CBubble.prototype.calculateMovement = function () {
        this.PosY -= this.Size;
        if (this.PosY < this.MainClass.YTop) {
            this.done = true;
        }
    };
    return CBubble;
}());
// fix params
var ImageScale = 1.25, FPS = 50, BubbleIntesity = 2; /* BubbleIntesity ist ein Wert [0-99] für die Anzahl Frames pro Blase. */
var mainClass = new CMain(ImageScale, FPS);
var FrameCount = 0;
// start Animation
setTimeout(function () {
    mainClass.calculateParams();
    setInterval(function () {
        FrameCount++;
        mainClass.renderFrame();
        if (FrameCount % BubbleIntesity == 0) {
            mainClass.addBubble();
        }
    }, 1000 / FPS);
}, 100);
