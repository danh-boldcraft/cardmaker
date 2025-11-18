// Breakout Game Implementation
// Canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'start'; // 'start', 'playing', 'paused', 'gameOver', 'won'
let score = 0;
let lives = 3;
let level = 1;
let animationId;

// Paddle
const paddle = {
    width: 100,
    height: 15,
    x: canvas.width / 2 - 50,
    y: canvas.height - 30,
    speed: 8,
    dx: 0
};

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 8,
    speed: 4,
    dx: 4,
    dy: -4
};

// Bricks
const brickConfig = {
    rows: 5,
    cols: 9,
    width: 75,
    height: 20,
    padding: 10,
    offsetTop: 60,
    offsetLeft: 35
};

let bricks = [];

// Colors for different brick rows
const brickColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

// Initialize bricks
function initBricks() {
    bricks = [];
    for (let row = 0; row < brickConfig.rows; row++) {
        bricks[row] = [];
        for (let col = 0; col < brickConfig.cols; col++) {
            bricks[row][col] = {
                x: col * (brickConfig.width + brickConfig.padding) + brickConfig.offsetLeft,
                y: row * (brickConfig.height + brickConfig.padding) + brickConfig.offsetTop,
                status: 1, // 1 = visible, 0 = broken
                points: (brickConfig.rows - row) * 10 // Higher rows worth more points
            };
        }
    }
}

// Draw paddle
function drawPaddle() {
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Add gradient effect
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, '#34495E');
    gradient.addColorStop(1, '#2C3E50');
    ctx.fillStyle = gradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Add border
    ctx.strokeStyle = '#1A252F';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

// Draw ball
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#E74C3C';
    ctx.fill();
    ctx.strokeStyle = '#C0392B';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

// Draw bricks
function drawBricks() {
    for (let row = 0; row < brickConfig.rows; row++) {
        for (let col = 0; col < brickConfig.cols; col++) {
            const brick = bricks[row][col];
            if (brick.status === 1) {
                ctx.fillStyle = brickColors[row];
                ctx.fillRect(brick.x, brick.y, brickConfig.width, brickConfig.height);

                // Add 3D effect
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.lineWidth = 1;
                ctx.strokeRect(brick.x, brick.y, brickConfig.width, brickConfig.height);

                // Add highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(brick.x, brick.y, brickConfig.width, 5);
            }
        }
    }
}

// Move paddle
function movePaddle() {
    paddle.x += paddle.dx;

    // Wall detection
    if (paddle.x < 0) {
        paddle.x = 0;
    }
    if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
    }
}

// Move ball
function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collision (left and right)
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx *= -1;
    }

    // Wall collision (top)
    if (ball.y - ball.radius < 0) {
        ball.dy *= -1;
    }

    // Paddle collision
    if (
        ball.y + ball.radius > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width
    ) {
        // Calculate where ball hit the paddle (for angle variation)
        const hitPos = (ball.x - paddle.x) / paddle.width;
        const angle = (hitPos - 0.5) * Math.PI / 3; // Max 60 degree angle

        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        ball.dx = speed * Math.sin(angle);
        ball.dy = -speed * Math.cos(angle);
    }

    // Ball falls below paddle
    if (ball.y + ball.radius > canvas.height) {
        lives--;
        updateLives();

        if (lives === 0) {
            gameOver();
        } else {
            resetBall();
        }
    }
}

// Brick collision detection
function brickCollision() {
    for (let row = 0; row < brickConfig.rows; row++) {
        for (let col = 0; col < brickConfig.cols; col++) {
            const brick = bricks[row][col];

            if (brick.status === 1) {
                if (
                    ball.x > brick.x &&
                    ball.x < brick.x + brickConfig.width &&
                    ball.y > brick.y &&
                    ball.y < brick.y + brickConfig.height
                ) {
                    ball.dy *= -1;
                    brick.status = 0;
                    score += brick.points;
                    updateScore();

                    // Check if all bricks are broken
                    if (checkWin()) {
                        nextLevel();
                    }
                }
            }
        }
    }
}

// Check if all bricks are broken
function checkWin() {
    for (let row = 0; row < brickConfig.rows; row++) {
        for (let col = 0; col < brickConfig.cols; col++) {
            if (bricks[row][col].status === 1) {
                return false;
            }
        }
    }
    return true;
}

// Update UI
function updateScore() {
    document.getElementById('score').textContent = score;
}

function updateLives() {
    document.getElementById('lives').textContent = lives;
}

function updateLevel() {
    document.getElementById('level').textContent = level;
}

// Reset ball position
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = -4;
}

// Next level
function nextLevel() {
    level++;
    updateLevel();

    // Increase difficulty
    const speedIncrease = 1.1;
    ball.speed *= speedIncrease;
    ball.dx *= speedIncrease;
    ball.dy *= speedIncrease;

    // Bonus points for completing level
    score += level * 100;
    updateScore();

    // Reset board
    initBricks();
    resetBall();
    paddle.x = canvas.width / 2 - paddle.width / 2;

    // Show level message
    showOverlay('Level ' + level, 'Keep going! Speed increased!', false);

    setTimeout(() => {
        hideOverlay();
    }, 2000);
}

// Game over
function gameOver() {
    gameState = 'gameOver';
    cancelAnimationFrame(animationId);

    showOverlay(
        'Game Over!',
        'Better luck next time!',
        true,
        'Final Score: ' + score
    );

    // TODO: Future feature - submit score to leaderboard
    // submitScore(score);
}

// Win game
function winGame() {
    gameState = 'won';
    cancelAnimationFrame(animationId);

    showOverlay(
        'You Won!',
        'Congratulations! You cleared all levels!',
        true,
        'Final Score: ' + score
    );

    // TODO: Future feature - submit score to leaderboard
    // submitScore(score);
}

// Show overlay
function showOverlay(title, message, showScore = false, scoreText = '') {
    const overlay = document.getElementById('gameOverlay');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlayMessage = document.getElementById('overlayMessage');
    const finalScore = document.getElementById('finalScore');

    overlayTitle.textContent = title;
    overlayMessage.textContent = message;

    if (showScore && scoreText) {
        finalScore.textContent = scoreText;
        finalScore.classList.remove('hidden');
    } else {
        finalScore.classList.add('hidden');
    }

    overlay.classList.remove('hidden');
}

// Hide overlay
function hideOverlay() {
    document.getElementById('gameOverlay').classList.add('hidden');
}

// Reset game
function resetGame() {
    score = 0;
    lives = 3;
    level = 1;

    updateScore();
    updateLives();
    updateLevel();

    ball.speed = 4;
    initBricks();
    resetBall();
    paddle.x = canvas.width / 2 - paddle.width / 2;

    hideOverlay();
    gameState = 'playing';
    draw();
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw game elements
    drawBricks();
    drawBall();
    drawPaddle();

    if (gameState === 'playing') {
        movePaddle();
        moveBall();
        brickCollision();

        animationId = requestAnimationFrame(draw);
    }
}

// Keyboard controls
function keyDown(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        paddle.dx = paddle.speed;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        paddle.dx = -paddle.speed;
    }
}

function keyUp(e) {
    if (
        e.key === 'Right' ||
        e.key === 'ArrowRight' ||
        e.key === 'Left' ||
        e.key === 'ArrowLeft'
    ) {
        paddle.dx = 0;
    }
}

// Mouse controls
function mouseMove(e) {
    const relativeX = e.clientX - canvas.offsetLeft;

    if (relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width / 2;
    }
}

// Touch controls for mobile
function touchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const relativeX = touch.clientX - rect.left;

    if (relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width / 2;
    }
}

// Event listeners
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);
canvas.addEventListener('mousemove', mouseMove);
canvas.addEventListener('touchmove', touchMove, { passive: false });

document.getElementById('restartBtn').addEventListener('click', resetGame);

// Environment detection (from config.js)
function detectEnvironment() {
    const hostname = window.location.hostname;
    const envLabel = document.getElementById('environmentLabel');

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        envLabel.textContent = 'LOCAL';
        document.getElementById('environmentBanner').className = 'environment-banner local';
    } else if (window.API_CONFIG && window.API_CONFIG.environment === 'test') {
        envLabel.textContent = 'TEST ENVIRONMENT';
        document.getElementById('environmentBanner').className = 'environment-banner test';
    } else if (window.API_CONFIG && window.API_CONFIG.environment === 'prod') {
        envLabel.textContent = 'PRODUCTION';
        document.getElementById('environmentBanner').className = 'environment-banner prod';
    }
}

// Initialize game on page load
window.addEventListener('load', () => {
    detectEnvironment();
    initBricks();
    draw();

    showOverlay(
        'Welcome to Breakout!',
        'Click "Start New Game" to begin',
        false
    );
});

// TODO: Future feature - Submit score to leaderboard
// function submitScore(finalScore) {
//     const endpoint = window.API_CONFIG ? window.API_CONFIG.endpoint : 'http://localhost:3001';
//
//     fetch(`${endpoint}/game/score`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ score: finalScore, level: level })
//     })
//     .then(response => response.json())
//     .then(data => console.log('Score submitted:', data))
//     .catch(error => console.error('Error submitting score:', error));
// }
