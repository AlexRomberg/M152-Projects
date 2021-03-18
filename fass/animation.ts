const Fass = document.getElementById('fass');
const Balken1 = document.getElementById('balken1');
const Balken2 = document.getElementById('balken2');
const Background = document.getElementById('bg');

const Left = 70;
const Width = 1000;
const MoveDist = 5;
let Moving = "left", PosX = 0, RotDeg = 0;

setTimeout(() => {
    const FassTop = Background.offsetHeight - Fass.offsetHeight;
    const FassWidth = Fass.offsetHeight;
    const FassDegConversion = 360 / (FassWidth * 3.141592653589793238462643383);

    init();
    setInterval(() => {
        if (Moving == "left") {
            if (PosX > 0) {
                moveLeft(MoveDist);
            } else {
                Moving = "right"
                moveRight(MoveDist);
            }
        } else if (Moving == "right") {
            if (PosX + FassWidth < Width) {
                moveRight(MoveDist);
            } else {
                Moving = "left"
                moveLeft(MoveDist);
            }
        }
        update();
    }, 10);

    function moveLeft(length: number) {
        PosX -= length;
        RotDeg -= length * FassDegConversion
    }

    function moveRight(length: number) {
        PosX += length;
        RotDeg += length * FassDegConversion
    }

    function update() {
        Fass.style.transform = `translateX(${PosX}px) rotate(${RotDeg}deg)`
    }

    function init() {
        Balken1.style.left = (Left - Balken1.offsetWidth) + "px"
        Balken2.style.left = (Left + Width) + "px"
        Fass.style.left = Left + "px";
        Fass.style.top = FassTop + "px";
    }

}, 100);
