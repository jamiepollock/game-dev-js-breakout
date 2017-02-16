var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var gameStates = { "active": 0, "paused": 1, "win": 2, "gameover": 3 };
Object.freeze(gameStates);

var x = canvas.width / 2;
var y = canvas.height - 30;
var dx = 2;
var dy = -2;

var ballRadius = 10;
var ballColour = "#0095DD";

var paddleHeight = 10;
var paddleWidth = 75;
var paddleX = (canvas.width - paddleWidth) / 2;
var paddleY = (canvas.height - paddleHeight) - 10;

var rightPressed = false;
var leftPressed = false;

var gameState = gameStates.active;

var destroyedBricksCount = 0;
var score = 0;
var lives = 3;

var pointSound = new sound("assets/sound-effects/beep.mp3", 0.4);
var lifeLostSound = new sound("assets/sound-effects/life-lost.mp3", 0.4);
var gameOverSound = new sound("assets/sound-effects/game-over.mp3");
var winSound = new sound("assets/sound-effects/win.mp3");

var playSound = true;

var brickRowCount = 3;
var brickColumnCount = 5;
var brickWidth = 75;
var brickHeight = 20;
var brickPadding = 10;
var brickOffsetTop = 30;
var brickOffsetLeft = 30;

var bricks = [];
for (column = 0; column < brickColumnCount; column++) {
    bricks[column] = [];
    for (row = 0; row < brickRowCount; row++) {
        bricks[column][row] = { x: 0, y: 0, status: getRandomBrickStatus() };
    }
}

function getRandomBrickStatus() {
    min = 1;
    max = 3;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getBrickColour(status) {
    switch (status) {
        case 1:
            return "#4ca33a";
        case 2:
            return "#ffe83a";
        case 3:
            return "#ff3a3a";
    }
}

function keyDownHandler(e) {
    if (e.keyCode == 39) {
        rightPressed = true;
    }
    else if (e.keyCode == 37) {
        leftPressed = true;
    }
    else if (e.keyCode == 32) {
        togglePauseGame();
    }
    else if (e.keyCode == 82) {
        resetGame();
    }
    else if (e.keyCode == 83) {
        toggleAudio();
    }
}
function keyUpHandler(e) {
    if (e.keyCode == 39) {
        rightPressed = false;
    }
    else if (e.keyCode == 37) {
        leftPressed = false;
    }
}
function mouseMoveHandler(e) {
    if (gameState === gameStates.active) {
        movePaddleByClientX(e.clientX);
    }
}

function touchMoveHandler(e) {
    if (gameState === gameStates.active) {
        var touches = e.changedTouches;

        for (var i = 0; i < touches.length; i++) {
            var touch = touches[i];
            movePaddleByClientX(touch.clientX);
        }
    }
}

function movePaddleByClientX(clientX) {
    var relativeX = clientX - canvas.offsetLeft;
    if (relativeX > 0 && (relativeX + (paddleWidth / 2)) < canvas.width) {
        var newX = relativeX - paddleWidth / 2;

        if (newX <= 0) {
            paddleX = 0;
        } else if (newX >= canvas.width) {
            paddleX = canvas.width;
        } else {
            paddleX = newX;
        }
    }
}

function collisionDetection() {
    brickCollisionDetection();
    wallCollisionDetection();
}

function brickCollisionDetection() {
    for (column = 0; column < brickColumnCount; column++) {
        for (row = 0; row < brickRowCount; row++) {
            var b = bricks[column][row];

            if (b.status > 0) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.status--;

                    if (b.status == 0) {
                        destroyedBricksCount++;
                    }

                    score++;

                    if (playSound) {
                        pointSound.play();
                    }
                    if (destroyedBricksCount == brickRowCount * brickColumnCount) {
                        if (playSound) {
                            winSound.play();
                        }
                        gameState = gameStates.win;
                    }
                }
            }
        }
    }
}

function wallCollisionDetection() {
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }

    if (y + dy < ballRadius) {
        dy = -dy;
    } else if (y + dy > paddleY - ballRadius) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy;
            if (playSound) {
                pointSound.play();
            }
        }
        else {
            lives--;

            if (!lives) {
                if (playSound) {
                    gameOverSound.play();
                }
                gameState = gameStates.gameover;
            } else {
                if (playSound) {
                    lifeLostSound.play();
                }
                x = canvas.width / 2;
                y = canvas.height - 30;
                dx = 2;
                dy = -2;
                paddleX = (canvas.width - paddleWidth) / 2;
            }
        }
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = ballColour;
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, paddleY, paddleWidth, paddleHeight);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

function drawMenu() {
    drawOverlay("Game Paused!");
}

function drawGameOver() {
    drawOverlay("Game Over!");
}
function drawWin() {
    drawOverlay("You Win!");
}

function drawBricks() {
    for (column = 0; column < brickColumnCount; column++) {
        for (row = 0; row < brickRowCount; row++) {
            var brick = bricks[column][row];
            if (brick.status > 0) {
                var brickX = (column * (brickWidth + brickPadding)) + brickOffsetLeft;
                var brickY = (row * (brickHeight + brickPadding)) + brickOffsetTop;
                brick.x = brickX;
                brick.y = brickY;

                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = getBrickColour(brick.status);
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

function drawScore() {
    ctx.beginPath();
    ctx.font = "16px Courier New";
    ctx.fillStyle = "#0095DD";
    ctx.textAlign = "left";
    ctx.fillText("Score: " + score, 10, 20);
    ctx.closePath();
}
function drawLives() {
    ctx.beginPath();
    ctx.font = "16px Courier New";
    ctx.fillStyle = "#0095DD";
    ctx.textAlign = "right";
    ctx.fillText("Lives: " + lives, canvas.width - 10, 20);
    ctx.closePath();
}

function drawSoundState() {
    var state = playSound ? "On" : "Off";

    ctx.beginPath();
    ctx.font = "16px Courier New";
    ctx.fillStyle = "#0095DD";
    ctx.textAlign = "center";
    ctx.fillText("Sound: " + state, canvas.width / 2, 20);
    ctx.closePath();
}

function drawOverlay(text) {
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,.2)";
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.font = "30px Courier New";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    ctx.closePath();
}


function movePaddle() {
    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7;
    }
    else if (leftPressed && paddleX > 0) {
        paddleX -= 7;
    }
}

function togglePauseGame() {
    if (gameState === gameStates.active) {
        gameState = gameStates.paused;
    } else if (gameState === gameStates.paused) {
        gameState = gameStates.active;
    }
}

function restartGame() {
    document.location.reload();
}

function toggleAudio() {
    if (gameState === gameStates.active || gameState === gameStates.paused) {
        playSound = !playSound;
    }
}

; (function () {
    function registerInputControls() {
        document.addEventListener("keydown", keyDownHandler, false);
        document.addEventListener("keyup", keyUpHandler, false);
        document.addEventListener("mousemove", mouseMoveHandler, false);
        document.addEventListener("touchmove", touchMoveHandler, false);
    }
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBricks();
        drawBall();
        drawPaddle();

        switch (gameState) {
            case gameStates.win:
                drawWin();
                break;
            case gameStates.gameover:
                drawGameOver();
                break;
            case gameStates.paused:
                drawMenu();
                break;
            case gameStates.active:
                collisionDetection();
                movePaddle();

                x += dx;
                y += dy;
        }

        drawSoundState();
        drawScore();
        drawLives();

        requestAnimationFrame(draw);
    }

    registerInputControls();
    draw();
})();

function sound(src, volume) {
    this.sound = document.createElement("audio");
    this.sound.src = src;

    if (volume && volume > 0) {
        this.sound.volume = volume;
    }

    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function (volume) {

        if (volume && volume > 0) {
            this.sound.volume = volume;
        }


        this.sound.play();
    }
    this.stop = function () {
        this.sound.pause();
    }
}