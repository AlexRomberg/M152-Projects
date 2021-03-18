var Fass = document.getElementById('fass');
var Balken1 = document.getElementById('balken1');
var Balken2 = document.getElementById('balken2');
var Background = document.getElementById('bg');
var Left = 70;
var Width = 1000;
var MoveDist = 5;
var Moving = "left", PosX = 0, RotDeg = 0;
setTimeout(function () {
    var FassTop = Background.offsetHeight - Fass.offsetHeight;
    var FassWidth = Fass.offsetHeight;
    var FassDegConversion = 360 / (FassWidth * 3.141592653589793238462643383);
    init();
    setInterval(function () {
        if (Moving == "left") {
            if (PosX > 0) {
                moveLeft(MoveDist);
            }
            else {
                Moving = "right";
                moveRight(MoveDist);
            }
        }
        else if (Moving == "right") {
            if (PosX + FassWidth < Width) {
                moveRight(MoveDist);
            }
            else {
                Moving = "left";
                moveLeft(MoveDist);
            }
        }
        update();
    }, 10);
    function moveLeft(length) {
        PosX -= length;
        RotDeg -= length * FassDegConversion;
    }
    function moveRight(length) {
        PosX += length;
        RotDeg += length * FassDegConversion;
    }
    function update() {
        Fass.style.transform = "translateX(" + PosX + "px) rotate(" + RotDeg + "deg)";
    }
    function init() {
        Balken1.style.left = (Left - Balken1.offsetWidth) + "px";
        Balken2.style.left = (Left + Width) + "px";
        Fass.style.left = Left + "px";
        Fass.style.top = FassTop + "px";
    }
}, 100);
