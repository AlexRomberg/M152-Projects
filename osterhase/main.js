var Body = document.getElementsByTagName('body')[0];
var Canvas = document.getElementById('canvas');
var CanvContext = Canvas.getContext('2d');
var FramesPerSecond = 50;
var MouseYPos = 0;
var EggCounter = 0;
var CGameboard = /** @class */ (function () {
    function CGameboard(canvasContext, imageScale) {
        if (imageScale === void 0) { imageScale = 1; }
        this.Floor = new Image();
        this.WinAnimationPlaying = false;
        this.RabbitAnimationPlaying = false;
        this.Tries = 0;
        this.isStopped = 0;
        this.CTX = canvasContext;
        this.ImageScale = imageScale;
        this.Floor.src = 'img/floor.png';
        this.Rabbit = new CRabbit(canvasContext, imageScale);
        this.Hole = new CHole(canvasContext, imageScale);
        this.Egg = new CEgg(canvasContext);
        this.Audio = new CAudio();
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
        var rabbitEvent = this.Rabbit.render(!(this.WinAnimationPlaying || this.RabbitAnimationPlaying || this.isStopped > 0));
        this.Hole.renderFront();
        this.Egg.render();
        if (this.isStopped > 1) {
            this.isStopped--;
        }
        else if (this.isStopped === 1) {
            this.Rabbit.attach();
            this.isStopped = 0;
        }
        else {
            this.evaluateEvents(rabbitEvent);
        }
        this.stopWinAnimation();
    };
    CGameboard.prototype.stopWinAnimation = function () {
        if (this.RabbitAnimationPlaying) {
            if (!this.Rabbit.AnimationRunning) {
                this.Egg.startAnimation();
                this.WinAnimationPlaying = true;
                this.RabbitAnimationPlaying = false;
            }
        }
        else if (this.WinAnimationPlaying && !this.Egg.IsAnimationRunning) {
            this.Rabbit.attach();
            EggCounter++;
            document.getElementById('eggCounter').innerText = EggCounter.toString();
            this.WinAnimationPlaying = false;
            this.placeHole();
        }
    };
    CGameboard.prototype.evaluateEvents = function (rabbitEvent) {
        if (rabbitEvent !== null) {
            if (rabbitEvent.event == "stoped") {
                this.handleLoss();
            }
            else {
                if (this.Hole.validateHit(rabbitEvent.position)) {
                    this.Rabbit.X = this.Hole.X + 10 * this.ImageScale;
                    this.handleWin();
                }
                else {
                    this.Audio.playBounceSound();
                }
            }
        }
    };
    CGameboard.prototype.handleLoss = function () {
        this.Audio.playLoseSound();
        this.isStopped = 50;
        if (this.Tries >= 3) {
            this.placeHole();
            this.Tries = 0;
        }
    };
    CGameboard.prototype.handleWin = function () {
        this.Tries = 0;
        this.RabbitAnimationPlaying = true;
        this.Rabbit.AnimationRunning = true;
        this.Audio.playwWinSound();
    };
    CGameboard.prototype.renderFloor = function () {
        for (var imgIndex = 0; imgIndex < Math.ceil(this.CanvasWidth / (this.Floor.width * this.ImageScale - 2)); imgIndex++) {
            this.CTX.drawImage(this.Floor, this.Floor.width * this.ImageScale * imgIndex - 2, this.CanvasHeight - this.Floor.height * this.ImageScale, this.Floor.width * this.ImageScale + 2, this.Floor.height * this.ImageScale);
        }
    };
    CGameboard.prototype.placeHole = function () {
        var position = (Math.random() * (this.CTX.canvas.width - 200) / 2) + (this.CTX.canvas.width / 2);
        this.Hole.setHolePosition(position);
        return position;
    };
    CGameboard.prototype.releaseRabbit = function (clickPositionX) {
        this.Rabbit.detach((clickPositionX + 100) / this.CTX.canvas.width); // +100 to prevent speed of 0
        this.Tries++;
    };
    CGameboard.prototype.updateRabbitPosition = function (position) {
        if (this.Rabbit.IsAttachedToMouse) {
            this.Rabbit.updateY(position);
        }
    };
    CGameboard.prototype.updateImgageSize = function (scale) {
        this.Rabbit.updateImgageSize(scale);
        this.Hole.updateImgageSize(scale);
        this.ImageScale = scale;
        this.renderFloor();
    };
    return CGameboard;
}());
var CRabbit = /** @class */ (function () {
    function CRabbit(ctx, imageScale) {
        var _this = this;
        this.RabbitImg = new Image();
        this.Y = 10;
        this.RabbitScale = 0.3;
        this.RabbitWeight = 7;
        this.PixelToMeterFactor = 100;
        this.hideAnimationProgress = 0;
        this.RabbitHiddingTime = 1;
        this.IsVisible = true;
        this.AnimationRunning = false;
        this.IsAttachedToMouse = true;
        this.X = 10;
        this.CTX = ctx;
        this.ImageScale = imageScale;
        this.RabbitImg.onload = function () {
            _this.RabbitHeight = _this.RabbitImg.height * imageScale * _this.RabbitScale;
            _this.RabbitWidth = _this.RabbitImg.width * imageScale * _this.RabbitScale;
        };
        this.RabbitImg.src = 'img/hase.png';
        this.FloorY = this.CTX.canvas.clientHeight - 125 * imageScale;
    }
    CRabbit.prototype.render = function (calculateMovement) {
        var event = null;
        if (!this.IsAttachedToMouse && calculateMovement) {
            this.runCalculation(FramesPerSecond);
            event = this.checkHitTheGround();
        }
        if (this.AnimationRunning) {
            var hideFrames = this.RabbitHiddingTime * FramesPerSecond;
            this.CTX.drawImage(this.RabbitImg, 0, 0, this.RabbitImg.width, this.RabbitImg.height / hideFrames * (hideFrames - this.hideAnimationProgress), this.X, this.Y + this.RabbitHeight / hideFrames * this.hideAnimationProgress, this.RabbitWidth, this.RabbitHeight / hideFrames * (hideFrames - this.hideAnimationProgress));
            if (this.hideAnimationProgress > hideFrames) {
                this.AnimationRunning = false;
                this.hideAnimationProgress = 0;
                this.IsVisible = false;
            }
            else {
                this.hideAnimationProgress++;
            }
        }
        else if (this.IsVisible) {
            this.CTX.drawImage(this.RabbitImg, this.X, this.Y, this.RabbitWidth, this.RabbitHeight);
        }
        return event;
    };
    CRabbit.prototype.runCalculation = function (fps) {
        var deltaTime = 1 / fps;
        this.VelocityY += this.RabbitWeight * 9.81 * deltaTime;
        this.Y += this.VelocityY * deltaTime * this.PixelToMeterFactor * this.ImageScale;
        this.X += this.VelocityX * deltaTime * this.PixelToMeterFactor * this.ImageScale;
    };
    CRabbit.prototype.checkHitTheGround = function () {
        if (this.Y >= this.FloorY - this.RabbitHeight && this.VelocityY > 0) {
            this.VelocityY *= -1;
            this.VelocityY *= 0.9;
            this.VelocityX *= 0.9;
            if (this.VelocityX > 0.5 && this.VelocityY < -0.6 && this.X + this.RabbitWidth < this.CTX.canvas.width + 10) {
                this.Y = this.FloorY - this.RabbitHeight + 15; // prevent rabbit being drawn in the ground
                return { event: "hitGround", position: this.X + this.RabbitWidth / 2 };
            }
            else {
                return { event: "stoped" };
            }
        }
        else if (this.X + this.RabbitWidth > this.CTX.canvas.width + 10) {
            console.log();
            return { event: "stoped" };
        }
        return null;
    };
    CRabbit.prototype.detach = function (speed) {
        this.IsAttachedToMouse = false;
        this.VelocityX = 10 * speed;
        this.VelocityY = 0;
    };
    CRabbit.prototype.attach = function () {
        this.IsAttachedToMouse = true;
        this.X = 10;
        this.Y = MouseYPos;
        this.IsVisible = true;
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
        this.render(true);
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
    CHole.prototype.updateImgageSize = function (scale) {
        this.ImageScale = scale;
        if (this.X + this.holeBack.width * this.ImageScale > this.CTX.canvas.width) {
            var position = (Math.random() * (this.CTX.canvas.width - 200) / 2) + (this.CTX.canvas.width / 2);
            this.setHolePosition(position);
        }
    };
    CHole.prototype.renderBack = function () {
        this.CTX.drawImage(this.holeBack, this.X, this.CTX.canvas.height - this.holeBack.height * this.ImageScale, this.holeBack.width * this.ImageScale, this.holeBack.height * this.ImageScale);
    };
    CHole.prototype.renderFront = function () {
        this.CTX.drawImage(this.holeFront, this.X, this.CTX.canvas.height - this.holeFront.height * this.ImageScale, this.holeFront.width * this.ImageScale, this.holeFront.height * this.ImageScale);
    };
    CHole.prototype.validateHit = function (position) {
        var tolerance = -20 * this.ImageScale;
        var isHit = (position > this.X - tolerance && position < this.X + this.holeBack.width * this.ImageScale + tolerance);
        return isHit;
    };
    return CHole;
}());
var CEgg = /** @class */ (function () {
    function CEgg(ctx) {
        this.Egg = new Image();
        this.IsAnimationRunning = false;
        this.CTX = ctx;
        this.Egg.src = 'img/egg.png';
    }
    CEgg.prototype.startAnimation = function () {
        this.IsAnimationRunning = true;
        this.X = this.CTX.canvas.width / 2 - 150;
        this.Y = this.CTX.canvas.height;
        this.End = this.CTX.canvas.height / 2 - 150;
        this.Step = (this.Y - this.End) / 50;
    };
    CEgg.prototype.render = function () {
        if (this.IsAnimationRunning) {
            if (this.Y < this.End) {
                this.IsAnimationRunning = false;
                this.CTX.drawImage(this.Egg, this.X, this.Y, 300, 300);
            }
            else {
                this.Y -= this.Step;
                this.CTX.drawImage(this.Egg, this.X, this.Y, 300, 300);
            }
        }
    };
    return CEgg;
}());
var CAudio = /** @class */ (function () {
    function CAudio() {
        var _this = this;
        this.winSound = new Audio();
        this.bounceSound = new Audio();
        this.loseSound = new Audio();
        this.audioOn = true;
        this.winSound.src = 'res/win.mp3';
        this.bounceSound.src = 'res/bounce.mp3';
        this.loseSound.src = 'res/lose.mp3';
        var btn = document.getElementById('audioBtn');
        btn.addEventListener('click', function () {
            if (_this.audioOn) {
                btn.innerText = "Ton einschalten";
                _this.audioOn = false;
            }
            else {
                btn.innerText = "Ton ausschalten";
                _this.audioOn = true;
            }
            return false;
        });
    }
    CAudio.prototype.playwWinSound = function () {
        if (this.audioOn) {
            this.winSound.currentTime = 0;
            this.winSound.play();
        }
    };
    CAudio.prototype.playBounceSound = function () {
        if (this.audioOn) {
            this.bounceSound.currentTime = 0;
            this.bounceSound.play();
        }
    };
    CAudio.prototype.playLoseSound = function () {
        if (this.audioOn) {
            this.loseSound.currentTime = 0;
            this.loseSound.play();
        }
    };
    return CAudio;
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
window.addEventListener('click', function (e) {
    Gameboard.releaseRabbit(e.clientX);
});
// additional functions
function calculateScreensize() {
    return 1.25 / 1920 * window.innerWidth;
}
