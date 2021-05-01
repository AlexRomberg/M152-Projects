var Body = document.getElementsByTagName('body')[0];
var Canvas = document.getElementById('canvas');
var CanvContext = Canvas.getContext('2d');
var FramesPerSecond = 50;
var MouseYPos = 0;
var CGameboard = /** @class */ (function () {
    function CGameboard(canvasContext, imageScale) {
        if (imageScale === void 0) { imageScale = 1; }
        this.Floor = new Image();
        this.CTX = canvasContext;
        this.ImageScale = imageScale;
        this.Floor.src = 'img/floor.png';
        this.Rabbit = new CRabbit(canvasContext, imageScale);
        this.Hole = new CHole(canvasContext, imageScale);
    }
    CGameboard.prototype.updateCanvasParams = function (body) {
        this.CTX.canvas.width = body.clientWidth;
        this.CTX.canvas.height = body.clientHeight;
        this.CanvasWidth = this.CTX.canvas.clientWidth;
        this.CanvasHeight = this.CTX.canvas.clientHeight;
    };
    CGameboard.prototype.clearCanvas = function () {
        this.CTX.clearRect(0, 0, this.CTX.canvas.width, this.CTX.canvas.height);
    };
    CGameboard.prototype.renderFrame = function () {
        this.renderFloor();
        this.Hole.renderBack();
        var rabbitEvent = this.Rabbit.render();
        this.Hole.renderFront();
        if (rabbitEvent !== null) {
            // console.log(rabbitEvent);
            if (rabbitEvent.event == "stoped") {
                this.Rabbit.attach();
            }
        }
    };
    CGameboard.prototype.renderFloor = function () {
        for (var imgIndex = 0; imgIndex < Math.ceil(this.CanvasWidth / (this.Floor.width * this.ImageScale - 2)); imgIndex++) {
            this.CTX.drawImage(this.Floor, this.Floor.width * this.ImageScale * imgIndex - 2, this.CanvasHeight - this.Floor.height * this.ImageScale, this.Floor.width * this.ImageScale, this.Floor.height * this.ImageScale);
        }
    };
    CGameboard.prototype.placeHole = function () {
        var position = (Math.random() * (this.CTX.canvas.width - 300 * this.ImageScale)) + 200 * this.ImageScale;
        this.Hole.setHolePosition(position);
        return position;
    };
    CGameboard.prototype.releaseRabbit = function () {
        this.Rabbit.detach();
    };
    CGameboard.prototype.updateRabbitPosition = function (position) {
        if (this.Rabbit.IsAttachedToMouse) {
            this.Rabbit.updateY(position);
        }
    };
    CGameboard.prototype.updateImgageSize = function (scale) {
        this.Rabbit.updateImgageSize(scale);
        this.ImageScale = scale;
        this.renderFloor();
    };
    return CGameboard;
}());
var CRabbit = /** @class */ (function () {
    function CRabbit(ctx, imageScale) {
        var _this = this;
        this.RabbitImg = new Image();
        this.X = 10;
        this.Y = 10;
        this.RabbitScale = 0.3;
        this.RabbitWeight = 7;
        this.PixelToMeterFactor = 100;
        this.IsAttachedToMouse = true;
        this.CTX = ctx;
        this.ImageScale = imageScale;
        this.RabbitImg.onload = function () {
            _this.RabbitHeight = _this.RabbitImg.height * imageScale * _this.RabbitScale;
            _this.RabbitWidth = _this.RabbitImg.width * imageScale * _this.RabbitScale;
        };
        this.RabbitImg.src = 'img/hase.png';
        this.FloorY = this.CTX.canvas.clientHeight - 125 * imageScale;
    }
    CRabbit.prototype.render = function () {
        this.CTX.drawImage(this.RabbitImg, this.X, this.Y, this.RabbitWidth, this.RabbitHeight);
        if (!this.IsAttachedToMouse) {
            return this.runCalculation(FramesPerSecond);
        }
        return null;
    };
    CRabbit.prototype.runCalculation = function (fps) {
        var deltaTime = 1 / fps;
        this.VelocityY += this.RabbitWeight * 9.81 * deltaTime;
        this.Y += this.VelocityY * deltaTime * this.PixelToMeterFactor;
        this.X += this.VelocityX * deltaTime * this.PixelToMeterFactor;
        return this.checkHitTheGround();
    };
    CRabbit.prototype.checkHitTheGround = function () {
        if (this.Y >= this.FloorY - this.RabbitHeight && this.VelocityY > 0) {
            this.VelocityY *= -1;
            this.VelocityY *= 0.9;
            this.VelocityX *= 0.9;
            console.table({ velX: this.VelocityX, velY: this.VelocityY });
            if (this.VelocityX > 0.5 && this.VelocityY < -0.6) {
                return { event: "hitGround", position: this.X };
            }
            else {
                return { event: "stoped" };
            }
        }
        return null;
    };
    CRabbit.prototype.detach = function () {
        this.IsAttachedToMouse = false;
        this.VelocityX = 5;
        this.VelocityY = 0;
    };
    CRabbit.prototype.attach = function () {
        this.IsAttachedToMouse = true;
        this.X = 10;
        this.Y = MouseYPos;
    };
    CRabbit.prototype.updateY = function (mousePosition) {
        var newYPos = mousePosition - (this.RabbitHeight / 2);
        if (mousePosition > this.FloorY - this.RabbitHeight / 2) {
            newYPos = this.FloorY - this.RabbitHeight;
        }
        this.Y = newYPos;
    };
    CRabbit.prototype.updateImgageSize = function (scale) {
        this.ImageScale = scale;
        this.RabbitHeight = this.RabbitImg.height * scale * this.RabbitScale;
        this.RabbitWidth = this.RabbitImg.width * scale * this.RabbitScale;
        this.FloorY = this.CTX.canvas.clientHeight - 125 * scale;
        this.render();
    };
    return CRabbit;
}());
var CHole = /** @class */ (function () {
    function CHole(ctx, imageScale) {
        this.holeBack = new Image();
        this.holeFront = new Image();
        this.X = 0;
        this.CTX = ctx;
        this.ImageScale = imageScale;
        this.holeBack.src = 'img/hole-back.png';
        this.holeFront.src = 'img/hole-front.png';
    }
    CHole.prototype.setHolePosition = function (x) {
        this.X = x;
    };
    CHole.prototype.renderBack = function () {
        this.CTX.drawImage(this.holeBack, this.X, this.CTX.canvas.height - this.holeBack.height * this.ImageScale, this.holeBack.width * this.ImageScale, this.holeBack.height * this.ImageScale);
    };
    CHole.prototype.renderFront = function () {
        this.CTX.drawImage(this.holeFront, this.X, this.CTX.canvas.height - this.holeFront.height * this.ImageScale, this.holeFront.width * this.ImageScale, this.holeFront.height * this.ImageScale);
    };
    return CHole;
}());
var Gameboard = new CGameboard(CanvContext, calculateScreensize());
Gameboard.updateCanvasParams(Body);
Gameboard.placeHole();
setTimeout(function () {
    setInterval(function () {
        Gameboard.clearCanvas();
        Gameboard.renderFrame();
    }, 1000 / FramesPerSecond);
}, 500);
// eventlisteners
window.addEventListener('resize', function () {
    Gameboard.updateCanvasParams(Body);
    Gameboard.updateImgageSize(calculateScreensize());
});
window.addEventListener('mousemove', function (e) {
    MouseYPos = e.clientY;
    Gameboard.updateRabbitPosition(MouseYPos);
});
window.addEventListener('click', function () {
    Gameboard.releaseRabbit();
});
// additional functions
function calculateScreensize() {
    return 1.25 / 1920 * window.innerWidth;
}
