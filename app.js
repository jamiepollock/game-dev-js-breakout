var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var gameStates = { "active": 0, "paused": 1, "win": 2, "gameover": 3 };
Object.freeze(gameStates);

var dx = 2;
var dy = -2;

var ballRadius = 10;
var ballColour = "#0095DD";

var paddleHeight = 10;
var paddleWidth = 75;
var paddleX = (canvas.clientWidth - paddleWidth) / 2;
var paddleY = (canvas.clientHeight - paddleHeight) - 10;

var ballX = canvas.clientWidth / 2;
var ballY = paddleY - (ballRadius * 2);

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
        e.preventDefault();

        var touches = e.changedTouches;

        for (var i = 0; i < touches.length; i++) {
            var touch = touches[i];
            movePaddleByClientX(touch.clientX);
        }
    }
}

function movePaddleByClientX(clientX) {
    var relativeX = clientX - canvas.offsetLeft;
    if (relativeX > 0 && (relativeX + (paddleWidth / 2)) < canvas.clientWidth) {
        var newX = relativeX - paddleWidth / 2;

        if (newX <= 0) {
            paddleX = 0;
        } else if (newX >= canvas.clientWidth) {
            paddleX = canvas.clientWidth;
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
                if (ballX > b.x && ballX < b.x + brickWidth && ballY > b.y && ballY < b.y + brickHeight) {
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
    if (ballX + dx > canvas.clientWidth - ballRadius || ballX + dx < ballRadius) {
        dx = -dx;
    }

    if (ballY + dy < ballRadius) {
        dy = -dy;
    } else if (ballY + dy > paddleY - ballRadius) {
        if (ballX > paddleX && ballX < paddleX + paddleWidth) {
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
                ballX = canvas.clientWidth / 2;
                ballY = canvas.clientHeight - 30;
                dx = 2;
                dy = -2;
                paddleX = (canvas.clientWidth - paddleWidth) / 2;
            }
        }
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
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
    ctx.fillText("Lives: " + lives, canvas.clientWidth - 10, 20);
    ctx.closePath();
}

function drawSoundState() {
    var state = playSound ? "On" : "Off";

    ctx.beginPath();
    ctx.font = "16px Courier New";
    ctx.fillStyle = "#0095DD";
    ctx.textAlign = "center";
    ctx.fillText("Sound: " + state, canvas.clientWidth / 2, 20);
    ctx.closePath();
}

function drawOverlay(text) {
    ctx.beginPath();
    ctx.rect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.fillStyle = "rgba(0,0,0,.2)";
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.font = "30px Courier New";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.clientWidth / 2, canvas.clientHeight / 2);
    ctx.closePath();
}


function movePaddle() {
    if (rightPressed && paddleX < canvas.clientWidth - paddleWidth) {
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
        document.addEventListener("touchmove", touchMoveHandler, {passive: false, capture: false});
    }
    function draw() {
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
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

                ballX += dx;
                ballY += dy;
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