const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const size = 20;

let level = 1;
let score = 0;
let gameSpeed = 180;
let gameRunning = true;
let gameInterval;

const levels = [
    [ // LEVEL 1: 10x10
        [1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,1,1,0,0,0,1],
        [1,0,1,0,0,0,0,1,0,1],
        [1,0,0,0,1,1,0,0,0,1],
        [1,1,1,0,1,1,0,1,1,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,1,0,1],
        [1,1,1,1,1,1,1,1,1,1]
    ],
    [ // LEVEL 2: 12x12 - FIXED
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,1,0,0,1,0,0,0,1],
        [1,0,1,0,1,0,0,1,0,1,0,1],
        [1,0,1,0,0,0,0,0,0,1,0,1],
        [1,0,1,1,1,1,1,1,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,1,0,1],
        [1,1,1,1,1,0,1,1,1,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,1,1,1,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1]
    ]
];

let maze = JSON.parse(JSON.stringify(levels[0]));
let pacman = {x: 1, y: 1};
let ghosts = [];
let keys = {};

document.addEventListener('keydown', e => { 
    if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault(); // STOP PAGE SCROLL
    }
    if(gameRunning) keys[e.key] = true; 
});

function resizeCanvas() {
    canvas.width = maze[0].length * size;
    canvas.height = maze.length * size;
}

function spawnGhosts() {
    ghosts = [];
    const colors = ['red', 'pink', 'cyan', 'orange'];
    const ghostCount = level + 1;
    const centerX = Math.floor(maze[0].length / 2);
    const centerY = Math.floor(maze.length / 2);
    for(let i = 0; i < ghostCount; i++) {
        ghosts.push({ x: centerX + (i % 2), y: centerY, color: colors[i % colors.length] });
    }
}

function showPopup(title, text, buttonText, onClickFunc) {
    gameRunning = false;
    clearInterval(gameInterval);
    document.getElementById('popup-title').innerText = title;
    document.getElementById('popup-text').innerText = text;
    document.getElementById('popup-button').innerText = buttonText;
    document.getElementById('popup-button').onclick = onClickFunc;
    document.getElementById('popup').classList.remove('hidden');
}

function restartGame() {
    score = 0; level = 1; gameSpeed = 180;
    maze = JSON.parse(JSON.stringify(levels[level-1]));
    resizeCanvas(); pacman = {x: 1, y: 1}; spawnGhosts(); gameRunning = true;
    document.getElementById('score').innerText = 'Score: 0';
    document.getElementById('level').innerText = 'Level: 1';
    document.getElementById('popup').classList.add('hidden');
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
}

function nextLevel() {
    gameRunning = true;
    document.getElementById('popup').classList.add('hidden');
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
}

function movePacman() {
    if(!gameRunning) return;
    let nx = pacman.x, ny = pacman.y;
    if(keys['ArrowRight']) nx++;
    if(keys['ArrowLeft']) nx--;
    if(keys['ArrowUp']) ny--;
    if(keys['ArrowDown']) ny++;
    if(maze[ny] && maze[ny][nx]!== 1) { pacman.x = nx; pacman.y = ny; }
    keys = {};
}

function moveGhosts() {
    if(!gameRunning) return;
    ghosts.forEach(g => {
        const moves = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
        const move = moves[Math.floor(Math.random()*4)];
        if(maze[g.y+move.y] && maze[g.y+move.y][g.x+move.x]!== 1) {
            g.x += move.x; g.y += move.y;
        }
    })
}

function eatDots() {
    if(maze[pacman.y][pacman.x] === 0) {
        maze[pacman.y][pacman.x] = 2;
        score += 10;
        document.getElementById('score').innerText = 'Score: ' + score;
    }
}

function checkWin() {
    for(let y=0; y<maze.length; y++){
        for(let x=0; x<maze[y].length; x++){
            if(maze[y][x] === 0) return;
        }
    }
    level++;
    if(level > levels.length) {
        showPopup('YOU WIN! 👑', `Final Score: ${score}`, "Restart", restartGame);
    } else {
        gameSpeed -= 15;
        maze = JSON.parse(JSON.stringify(levels[level-1]));
        resizeCanvas(); pacman = {x: 1, y: 1}; spawnGhosts();
        document.getElementById('level').innerText = 'Level: ' + level;
        showPopup(`LEVEL ${level-1} CLEARED!`, `Starting Level ${level}`, "Continue", nextLevel);
    }
}

function checkCollision() {
    ghosts.forEach(g => {
        if(g.x === pacman.x && g.y === pacman.y) {
            showPopup('GAME OVER ', `Final Score: ${score}`, "Restart", restartGame);
        }
    })
}

function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let y=0; y<maze.length; y++){
        for(let x=0; x<maze[y].length; x++){
            if(maze[y][x] === 1) {
                ctx.fillStyle = 'blue';
                ctx.fillRect(x*size, y*size, size, size);
            }
            if(maze[y][x] === 0) {
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(x*size+size/2, y*size+size/2, 3, 0, Math.PI*2);
                ctx.fill();
            }
        }
    }
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(pacman.x*size+size/2, pacman.y*size+size/2, size/2-2, 0, Math.PI*2);
    ctx.fill();
    ghosts.forEach(g => {
        ctx.fillStyle = g.color;
        ctx.fillRect(g.x*size+2, g.y*size+2, size-4, size-4);
    })
}

function gameLoop() {
    movePacman();
    moveGhosts();
    eatDots();
    checkCollision();
    checkWin();
    draw();
}

// START
resizeCanvas();
spawnGhosts();
gameInterval = setInterval(gameLoop, gameSpeed);