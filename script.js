
"use strict";

/* =========================================================
   PAC-MAN ULTIMATE
   Complete Game Script
========================================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const TILE = 24;


/* =========================================================
   DIRECTIONS
========================================================= */

const DIRECTIONS = {
    left:  { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    up:    { x: 0, y: -1 },
    down:  { x: 0, y: 1 }
};

const KEY_TO_DIRECTION = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",

    a: "left",
    d: "right",
    w: "up",
    s: "down",

    A: "left",
    D: "right",
    W: "up",
    S: "down"
};


/* =========================================================
   MAZES
========================================================= */

const MAZES = [

    /* ================= LEVEL 1 ================= */

    [
        "############################",
        "#............##............#",
        "#.####.#####.##.#####.####.#",
        "#o####.#####.##.#####.####o#",
        "#..........................#",
        "#.####.##.########.##.####.#",
        "#......##....##....##......#",
        "######.##### ## #####.######",
        "     #.##          ##.#     ",
        "     #.## ###GG### ##.#     ",
        "######.## #      # ##.######",
        "     #.   #      #   .#     ",
        "######.## #      # ##.######",
        "     #.## ######## ##.#     ",
        "     #.##          ##.#     ",
        "######.##### ## #####.######",
        "#............##............#",
        "#.####.#####.##.#####.####.#",
        "#o...#................#...o#",
        "###.#.#.##.######.##.#.#.###",
        "#.....#......##......#.....#",
        "#.##########.##.##########.#",
        "#............P.............#",
        "############################"
    ],

    /* ================= LEVEL 2 ================= */

    [
        "############################",
        "#o.........................o#",
        "#.####.#####.##.#####.####.#",
        "#......#.....##.....#......#",
        "#.####.#.##########.#.####.#",
        "#..........................#",
        "#.####.##.########.##.####.#",
        "#......##....##....##......#",
        "######.##### ## #####.######",
        "     #.##   GGGG   ##.#     ",
        "######.## ######## ##.######",
        "#............##............#",
        "#.####.#####.##.#####.####.#",
        "#o...#................#...o#",
        "###.#.#.##.######.##.#.#.###",
        "#.....#......##......#.....#",
        "#.##########.##.##########.#",
        "#..........................#",
        "#.####.#####.##.#####.####.#",
        "#o.........................o#",
        "#............P.............#",
        "############################",
        "############################",
        "############################"
    ],

    /* ================= LEVEL 3 ================= */

    [
        "############################",
        "#o........................o#",
        "#.####.####.####.####.####.#",
        "#......#........#......#...#",
        "#.####.#.######.#.####.#.#.#",
        "#......#...##...#......#.#.#",
        "######.###.##.###.######.#.#",
        "#..........................#",
        "#.####.##.########.##.####.#",
        "#......##....##....##......#",
        "######.##### ## #####.######",
        "     #.##   GGGG   ##.#     ",
        "######.## ######## ##.######",
        "#............##............#",
        "#.####.#####.##.#####.####.#",
        "#o...#................#...o#",
        "###.#.#.##.######.##.#.#.###",
        "#.....#......##......#.....#",
        "#.##########.##.##########.#",
        "#..........................#",
        "#.####.####.####.####.####.#",
        "#o........................o#",
        "#............P.............#",
        "############################"
    ]
];


/* =========================================================
   GAME STATE
========================================================= */

let maze = [];

let pellets = new Set();
let powerPellets = new Set();

let pacman = {
    x: 1,
    y: 1,
    direction: "right",
    nextDirection: "right",
    mouth: 0,
    alive: true
};

let pacmanStart = {
    x: 1,
    y: 1
};

let ghosts = [];

let score = 0;

let highScore =
    Number(localStorage.getItem("pacmanHighScore")) || 0;

let level = 1;

let lives = 3;

let gameState = "menu";

let frightenedTimer = 0;

let lastTime = 0;

let accumulator = 0;

let animationId = null;

/* Slightly slower speed */
let levelSpeed = 125;

let ghostSpeed = 0.78;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const scoreElement =
    document.getElementById("score");

const highScoreElement =
    document.getElementById("highScore");

const levelElement =
    document.getElementById("level");

const livesElement =
    document.getElementById("lives");

const message =
    document.getElementById("message");

const messageTitle =
    document.getElementById("messageTitle");

const messageText =
    document.getElementById("messageText");

const messageButton =
    document.getElementById("messageButton");

const messageStats =
    document.getElementById("messageStats");

const finalScore =
    document.getElementById("finalScore");

const finalLevel =
    document.getElementById("finalLevel");

const newHighScore =
    document.getElementById("newHighScore");

const pauseButton =
    document.getElementById("pauseButton");

const restartButton =
    document.getElementById("restartButton");


/* =========================================================
   SCORE
========================================================= */

function updateScore() {

    scoreElement.textContent = score;

    highScoreElement.textContent =
        highScore;
}

function addScore(points) {

    score += points;

    if (score > highScore) {

        highScore = score;

        localStorage.setItem(
            "pacmanHighScore",
            highScore
        );
    }

    updateScore();
}


/* =========================================================
   LIVES
========================================================= */

function updateLives() {

    if (lives <= 0) {

        livesElement.textContent = "💀";

        return;
    }

    livesElement.textContent =
        "❤️ ".repeat(lives).trim();
}


/* =========================================================
   LEVEL UI
========================================================= */

function updateLevelUI() {

    levelElement.textContent =
        `LEVEL ${level}`;
}


/* =========================================================
   DIFFICULTY
========================================================= */

function updateDifficulty() {

    /*
       Level 1 = slower
       Each level becomes slightly faster
    */

    levelSpeed =
        Math.max(
            88,
            125 - ((level - 1) * 7)
        );

    ghostSpeed =
        Math.min(
            1.08,
            0.78 + ((level - 1) * 0.06)
        );
}


/* =========================================================
   MAP HELPERS
========================================================= */

function positionKey(x, y) {

    return `${x},${y}`;
}

function isInside(x, y) {

    return (
        y >= 0 &&
        y < maze.length &&
        x >= 0 &&
        x < maze[y].length
    );
}

function isWall(x, y) {

    if (!isInside(x, y)) {

        return true;
    }

    return maze[y][x] === "#";
}

function canMove(x, y) {

    return !isWall(x, y);
}

function canMoveDirection(
    x,
    y,
    direction
) {

    const dir =
        DIRECTIONS[direction];

    return canMove(
        x + dir.x,
        y + dir.y
    );
}


/* =========================================================
   LOAD LEVEL
========================================================= */

function loadLevel(levelNumber) {

    const mazeIndex =
        (levelNumber - 1) % MAZES.length;

    const source =
        MAZES[mazeIndex];

    maze =
        source.map(row => row.split(""));

    pellets.clear();
    powerPellets.clear();

    let playerStart = null;
    const ghostStarts = [];

    for (
        let y = 0;
        y < maze.length;
        y++
    ) {

        for (
            let x = 0;
            x < maze[y].length;
            x++
        ) {

            const cell =
                maze[y][x];

            if (cell === ".") {

                pellets.add(
                    positionKey(x, y)
                );
            }

            if (cell === "o") {

                powerPellets.add(
                    positionKey(x, y)
                );
            }

            if (cell === "P") {

                playerStart = {
                    x: x,
                    y: y
                };

                maze[y][x] = " ";
            }

            if (cell === "G") {

                ghostStarts.push({
                    x: x,
                    y: y
                });

                maze[y][x] = " ";
            }
        }
    }

    /*
       Fallback player position
    */

    if (!playerStart) {

        playerStart = {
            x: 1,
            y: 1
        };
    }

    pacmanStart = {
        x: playerStart.x,
        y: playerStart.y
    };

    pacman = {

        x: playerStart.x,

        y: playerStart.y,

        direction: "left",

        nextDirection: "left",

        mouth: 0,

        alive: true
    };

    createGhosts(ghostStarts);

    resizeCanvas();

    updateLevelUI();

    updateDifficulty();

    frightenedTimer = 0;

    draw();
}


/* =========================================================
   CREATE GHOSTS
========================================================= */

function createGhosts(starts) {

    const colors = [
        "#ff3333",
        "#ff77dd",
        "#00eaff",
        "#ff9d24"
    ];

    const names = [
        "Blinky",
        "Pinky",
        "Inky",
        "Clyde"
    ];

    ghosts = [];

    for (
        let i = 0;
        i < 4;
        i++
    ) {

        const fallback = {
            x:
                Math.floor(
                    maze[0].length / 2
                ) + (i - 1),

            y:
                Math.floor(
                    maze.length / 2
                )
        };

        const start =
            starts[i] || fallback;

        ghosts.push({

            name: names[i],

            x: start.x,

            y: start.y,

            startX: start.x,

            startY: start.y,

            direction:
                [
                    "left",
                    "right",
                    "up",
                    "down"
                ][i],

            color: colors[i],

            frightened: false,

            dead: false,

            moveCounter: i * 0.4
        });
    }
}


/* =========================================================
   CANVAS
========================================================= */

function resizeCanvas() {

    canvas.width =
        maze[0].length * TILE;

    canvas.height =
        maze.length * TILE;
}


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        const direction =
            KEY_TO_DIRECTION[event.key];

        if (direction) {

            event.preventDefault();

            if (
                gameState === "menu" ||
                gameState === "gameOver" ||
                gameState === "victory"
            ) {

                startGame();
            }

            if (
                gameState === "paused"
            ) {

                resumeGame();
            }

            if (
                gameState === "playing"
            ) {

                pacman.nextDirection =
                    direction;
            }
        }

        /*
           SPACE / ESC = pause
        */

        if (
            event.key === " " ||
            event.key === "Escape"
        ) {

            event.preventDefault();

            if (
                gameState === "playing"
            ) {

                pauseGame();

            } else if (
                gameState === "paused"
            ) {

                resumeGame();
            }
        }
    }
);


/* =========================================================
   MOBILE BUTTONS
========================================================= */

document
    .querySelectorAll(".control")
    .forEach(button => {

        function handleDirection(event) {

            event.preventDefault();

            const direction =
                button.dataset.direction;

            if (
                gameState === "menu" ||
                gameState === "gameOver" ||
                gameState === "victory"
            ) {

                startGame();
            }

            if (
                gameState === "paused"
            ) {

                resumeGame();
            }

            if (
                gameState === "playing"
            ) {

                pacman.nextDirection =
                    direction;
            }
        }

        button.addEventListener(
            "touchstart",
            handleDirection,
            {
                passive: false
            }
        );

        button.addEventListener(
            "mousedown",
            handleDirection
        );
    });


/* =========================================================
   SWIPE CONTROLS
========================================================= */

let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener(
    "touchstart",
    event => {

        const touch =
            event.changedTouches[0];

        touchStartX =
            touch.clientX;

        touchStartY =
            touch.clientY;
    },
    {
        passive: true
    }
);

canvas.addEventListener(
    "touchend",
    event => {

        const touch =
            event.changedTouches[0];

        const dx =
            touch.clientX -
            touchStartX;

        const dy =
            touch.clientY -
            touchStartY;

        if (
            Math.max(
                Math.abs(dx),
                Math.abs(dy)
            ) < 20
        ) {

            return;
        }

        if (
            Math.abs(dx) >
            Math.abs(dy)
        ) {

            pacman.nextDirection =
                dx > 0
                    ? "right"
                    : "left";

        } else {

            pacman.nextDirection =
                dy > 0
                    ? "down"
                    : "up";
        }

        if (
            gameState === "menu" ||
            gameState === "gameOver" ||
            gameState === "victory"
        ) {

            startGame();
        }

        if (
            gameState === "paused"
        ) {

            resumeGame();
        }
    },
    {
        passive: true
    }
);


/* =========================================================
   PAC-MAN MOVEMENT
========================================================= */

function movePacman() {

    if (!pacman.alive) return;

    /*
       Try requested direction first
    */

    if (
        canMoveDirection(
            pacman.x,
            pacman.y,
            pacman.nextDirection
        )
    ) {

        pacman.direction =
            pacman.nextDirection;
    }

    /*
       Move in current direction
    */

    if (
        canMoveDirection(
            pacman.x,
            pacman.y,
            pacman.direction
        )
    ) {

        const dir =
            DIRECTIONS[
                pacman.direction
            ];

        pacman.x += dir.x;
        pacman.y += dir.y;

        pacman.mouth++;

        eatCurrentTile();
    }
}


/* =========================================================
   EAT PELLETS
========================================================= */

function eatCurrentTile() {

    const current =
        positionKey(
            pacman.x,
            pacman.y
        );

    /*
       Normal pellet
    */

    if (
        pellets.has(current)
    ) {

        pellets.delete(current);

        addScore(10);
    }

    /*
       Power pellet
    */

    if (
        powerPellets.has(current)
    ) {

        powerPellets.delete(current);

        addScore(50);

        frightenedTimer = 7000;

        ghosts.forEach(
            ghost => {

                if (!ghost.dead) {

                    ghost.frightened = true;
                }
            }
        );
    }

    /*
       Level complete
    */

    if (
        pellets.size === 0 &&
        powerPellets.size === 0
    ) {

        completeLevel();
    }
}


/* =========================================================
   GHOST MOVEMENT
========================================================= */

function moveGhosts() {

    ghosts.forEach(
        (ghost, index) => {

            if (ghost.dead) {

                moveGhostHome(ghost);

                return;
            }

            ghost.moveCounter +=
                ghostSpeed;

            if (
                ghost.moveCounter < 1
            ) {

                return;
            }

            ghost.moveCounter = 0;

            const possible =
                getPossibleDirections(
                    ghost.x,
                    ghost.y
                );

            if (
                possible.length === 0
            ) {

                return;
            }

            /*
               Occasionally make a random choice
            */

            if (
                Math.random() < 0.18
            ) {

                ghost.direction =
                    possible[
                        Math.floor(
                            Math.random() *
                            possible.length
                        )
                    ];

            } else {

                const target =
                    getGhostTarget(
                        ghost,
                        index
                    );

                ghost.direction =
                    chooseBestDirection(
                        ghost,
                        possible,
                        target
                    );
            }

            const dir =
                DIRECTIONS[
                    ghost.direction
                ];

            ghost.x += dir.x;
            ghost.y += dir.y;
        }
    );
}


/* =========================================================
   POSSIBLE DIRECTIONS
========================================================= */

function getPossibleDirections(
    x,
    y
) {

    return [
        "left",
        "right",
        "up",
        "down"
    ].filter(
        direction =>
            canMoveDirection(
                x,
                y,
                direction
            )
    );
}


/* =========================================================
   GHOST TARGETS
========================================================= */

function getGhostTarget(
    ghost,
    index
) {

    /*
       Frightened ghosts move away
    */

    if (
        frightenedTimer > 0
    ) {

        return {
            x:
                maze[0].length - 2,

            y:
                maze.length - 2
        };
    }

    /*
       Blinky
    */

    if (index === 0) {

        return {
            x: pacman.x,
            y: pacman.y
        };
    }

    /*
       Pinky
    */

    if (index === 1) {

        const dir =
            DIRECTIONS[
                pacman.direction
            ];

        return {
            x:
                pacman.x +
                dir.x * 4,

            y:
                pacman.y +
                dir.y * 4
        };
    }

    /*
       Inky
    */

    if (index === 2) {

        const blinky =
            ghosts[0];

        return {
            x:
                pacman.x +
                (
                    pacman.x -
                    blinky.x
                ),

            y:
                pacman.y +
                (
                    pacman.y -
                    blinky.y
                )
        };
    }

    /*
       Clyde
    */

    const distance =
        Math.abs(
            ghost.x -
            pacman.x
        ) +
        Math.abs(
            ghost.y -
            pacman.y
        );

    if (
        distance < 7
    ) {

        return {
            x: 1,
            y:
                maze.length - 2
        };
    }

    return {
        x: pacman.x,
        y: pacman.y
    };
}


/* =========================================================
   CHOOSE GHOST DIRECTION
========================================================= */

function chooseBestDirection(
    ghost,
    possible,
    target
) {

    let best =
        possible[0];

    let bestDistance =
        Infinity;

    for (
        const direction of possible
    ) {

        /*
           Don't immediately reverse
        */

        if (
            isOpposite(
                direction,
                ghost.direction
            ) &&
            possible.length > 1
        ) {

            continue;
        }

        const dir =
            DIRECTIONS[
                direction
            ];

        const nx =
            ghost.x + dir.x;

        const ny =
            ghost.y + dir.y;

        const distance =
            Math.abs(
                nx - target.x
            ) +
            Math.abs(
                ny - target.y
            );

        if (
            distance <
            bestDistance
        ) {

            bestDistance =
                distance;

            best =
                direction;
        }
    }

    return best;
}


/* =========================================================
   OPPOSITE DIRECTION
========================================================= */

function isOpposite(a, b) {

    return (
        (a === "left" && b === "right") ||
        (a === "right" && b === "left") ||
        (a === "up" && b === "down") ||
        (a === "down" && b === "up")
    );
}


/* =========================================================
   GHOST RETURN HOME
========================================================= */

function moveGhostHome(ghost) {

    if (
        ghost.x === ghost.startX &&
        ghost.y === ghost.startY
    ) {

        ghost.dead = false;

        ghost.frightened =
            frightenedTimer > 0;

        return;
    }

    const possible =
        getPossibleDirections(
            ghost.x,
            ghost.y
        );

    if (
        possible.length === 0
    ) {

        return;
    }

    let best =
        possible[0];

    let bestDistance =
        Infinity;

    for (
        const direction of possible
    ) {

        const dir =
            DIRECTIONS[
                direction
            ];

        const nx =
            ghost.x + dir.x;

        const ny =
            ghost.y + dir.y;

        const distance =
            Math.abs(
                nx - ghost.startX
            ) +
            Math.abs(
                ny - ghost.startY
            );

        if (
            distance <
            bestDistance
        ) {

            bestDistance =
                distance;

            best =
                direction;
        }
    }

    ghost.direction =
        best;

    const dir =
        DIRECTIONS[best];

    ghost.x += dir.x;
    ghost.y += dir.y;
}


/* =========================================================
   COLLISION
========================================================= */

function checkGhostCollision() {

    for (
        const ghost of ghosts
    ) {

        if (
            ghost.dead
        ) {

            continue;
        }

        if (
            ghost.x !== pacman.x ||
            ghost.y !== pacman.y
        ) {

            continue;
        }

        /*
           Power mode
        */

        if (
            frightenedTimer > 0
        ) {

            ghost.dead = true;

            ghost.frightened = false;

            addScore(200);

            continue;
        }

        /*
           Normal collision
        */

        loseLife();

        return;
    }
}


/* =========================================================
   LOSE LIFE
========================================================= */

function loseLife() {

    if (
        gameState !== "playing"
    ) {

        return;
    }

    lives--;

    updateLives();

    pacman.alive = false;

    /*
       Game over
    */

    if (
        lives <= 0
    ) {

        gameState = "gameOver";

        setTimeout(
            gameOver,
            500
        );

        return;
    }

    /*
       Life lost
    */

    gameState = "lifeLost";

    setTimeout(
        () => {

            resetPositions();

            gameState = "playing";

            lastTime =
                performance.now();

        },
        800
    );
}


/* =========================================================
   RESET POSITIONS
========================================================= */

function resetPositions() {

    pacman.x =
        pacmanStart.x;

    pacman.y =
        pacmanStart.y;

    pacman.direction =
        "left";

    pacman.nextDirection =
        "left";

    pacman.alive = true;

    ghosts.forEach(
        ghost => {

            ghost.x =
                ghost.startX;

            ghost.y =
                ghost.startY;

            ghost.dead = false;

            ghost.frightened =
                frightenedTimer > 0;

            ghost.moveCounter = 0;
        }
    );
}


/* =========================================================
   LEVEL COMPLETE
========================================================= */

function completeLevel() {

    if (
        gameState !== "playing"
    ) {

        return;
    }

    gameState =
        "levelComplete";

    /*
       Final level
    */

    if (
        level >= MAZES.length
    ) {

        setTimeout(
            showVictory,
            500
        );

        return;
    }

    /*
       Next level
    */

    showMessage(
        `LEVEL ${level} CLEARED!`,
        `Great job! Get ready for Level ${level + 1}.`,
        "NEXT LEVEL",
        nextLevel
    );
}


/* =========================================================
   NEXT LEVEL
========================================================= */

function nextLevel() {

    level++;

    loadLevel(level);

    hideMessage();

    gameState =
        "playing";

    lastTime =
        performance.now();

    accumulator = 0;
}


/* =========================================================
   GAME OVER
========================================================= */

function gameOver() {

    gameState =
        "gameOver";

    showEndStats();

    /*
       Check whether this run achieved
       a new high score.
    */

    if (
        score >= highScore &&
        score > 0
    ) {

        newHighScore.classList.remove(
            "hidden"
        );

    } else {

        newHighScore.classList.add(
            "hidden"
        );
    }

    showMessage(
        "GAME OVER",
        "The ghosts got you! Ready for another run?",
        "PLAY AGAIN",
        restartGame
    );
}


/* =========================================================
   VICTORY
========================================================= */

function showVictory() {

    gameState =
        "victory";

    showEndStats();

    newHighScore.classList.add(
        "hidden"
    );

    showMessage(
        "YOU WIN! 👑",
        "You cleared every level! Incredible work!",
        "PLAY AGAIN",
        restartGame
    );
}


/* =========================================================
   END SCREEN STATS
========================================================= */

function showEndStats() {

    finalScore.textContent =
        score;

    finalLevel.textContent =
        level;

    messageStats.classList.remove(
        "hidden"
    );
}

function hideEndStats() {

    messageStats.classList.add(
        "hidden"
    );

    newHighScore.classList.add(
        "hidden"
    );
}


/* =========================================================
   MESSAGE SCREEN
========================================================= */

function showMessage(
    title,
    text,
    buttonText,
    action
) {

    messageTitle.textContent =
        title;

    messageText.textContent =
        text;

    messageButton.textContent =
        buttonText;

    messageButton.onclick =
        action;

    message.classList.remove(
        "hidden"
    );
}

function hideMessage() {

    message.classList.add(
        "hidden"
    );
}


/* =========================================================
   START GAME
========================================================= */

function startGame() {

    /*
       Only start from a screen state
    */

    if (
        gameState !== "menu" &&
        gameState !== "gameOver" &&
        gameState !== "victory"
    ) {

        return;
    }

    score = 0;

    level = 1;

    lives = 3;

    updateScore();

    updateLives();

    hideEndStats();

    loadLevel(level);

    hideMessage();

    gameState =
        "playing";

    lastTime =
        performance.now();

    accumulator = 0;

    if (
        animationId === null
    ) {

        animationId =
            requestAnimationFrame(
                gameLoop
            );
    }
}


/* =========================================================
   RESTART
========================================================= */

function restartGame() {

    score = 0;

    level = 1;

    lives = 3;

    updateScore();

    updateLives();

    hideEndStats();

    loadLevel(level);

    hideMessage();

    gameState =
        "playing";

    lastTime =
        performance.now();

    accumulator = 0;
}


/* =========================================================
   PAUSE
========================================================= */

function pauseGame() {

    if (
        gameState !== "playing"
    ) {

        return;
    }

    gameState =
        "paused";

    pauseButton.textContent =
        "▶ RESUME";

    showMessage(
        "PAUSED",
        "Take a break. The ghosts are waiting...",
        "RESUME",
        resumeGame
    );
}


/* =========================================================
   RESUME
========================================================= */

function resumeGame() {

    if (
        gameState !== "paused"
    ) {

        return;
    }

    hideMessage();

    gameState =
        "playing";

    pauseButton.textContent =
        "⏸ PAUSE";

    lastTime =
        performance.now();
}


/* =========================================================
   PAUSE BUTTON
========================================================= */

pauseButton.addEventListener(
    "click",
    () => {

        if (
            gameState === "playing"
        ) {

            pauseGame();

        } else if (
            gameState === "paused"
        ) {

            resumeGame();
        }
    }
);


/* =========================================================
   RESTART BUTTON
========================================================= */

restartButton.addEventListener(
    "click",
    () => {

        restartGame();
    }
);


/* =========================================================
   DRAW WALLS
========================================================= */

function drawMaze() {

    for (
        let y = 0;
        y < maze.length;
        y++
    ) {

        for (
            let x = 0;
            x < maze[y].length;
            x++
        ) {

            if (
                maze[y][x] !== "#"
            ) {

                continue;
            }

            const px =
                x * TILE;

            const py =
                y * TILE;

            /*
               Outer wall
            */

            ctx.fillStyle =
                "#0617c9";

            ctx.fillRect(
                px + 1,
                py + 1,
                TILE - 2,
                TILE - 2
            );

            /*
               Inner highlight
            */

            ctx.strokeStyle =
                "#304cff";

            ctx.lineWidth = 1;

            ctx.strokeRect(
                px + 3,
                py + 3,
                TILE - 6,
                TILE - 6
            );
        }
    }
}


/* =========================================================
   DRAW PELLETS
========================================================= */

function drawPellets() {

    /*
       Normal pellets
    */

    ctx.fillStyle = "#fff";

    pellets.forEach(
        position => {

            const parts =
                position
                    .split(",")
                    .map(Number);

            const x = parts[0];
            const y = parts[1];

            ctx.beginPath();

            ctx.arc(
                x * TILE + TILE / 2,
                y * TILE + TILE / 2,
                2.2,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    );

    /*
       Power pellets
    */

    const pulse =
        4 +
        Math.sin(
            performance.now() / 150
        ) * 1;

    powerPellets.forEach(
        position => {

            const parts =
                position
                    .split(",")
                    .map(Number);

            const x = parts[0];
            const y = parts[1];

            ctx.beginPath();

            ctx.arc(
                x * TILE + TILE / 2,
                y * TILE + TILE / 2,
                pulse,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    );
}


/* =========================================================
   DRAW PAC-MAN
========================================================= */

function drawPacman() {

    if (!pacman.alive) {

        return;
    }

    const centerX =
        pacman.x * TILE +
        TILE / 2;

    const centerY =
        pacman.y * TILE +
        TILE / 2;

    const radius =
        TILE / 2 - 2;

    const mouth =
        0.18 +
        Math.abs(
            Math.sin(
                pacman.mouth * 0.8
            )
        ) * 0.25;

    let angle = 0;

    if (
        pacman.direction === "right"
    ) {

        angle = 0;
    }

    if (
        pacman.direction === "down"
    ) {

        angle = Math.PI / 2;
    }

    if (
        pacman.direction === "left"
    ) {

        angle = Math.PI;
    }

    if (
        pacman.direction === "up"
    ) {

        angle = -Math.PI / 2;
    }

    ctx.fillStyle =
        "#ffff00";

    ctx.beginPath();

    ctx.moveTo(
        centerX,
        centerY
    );

    ctx.arc(
        centerX,
        centerY,
        radius,
        angle + mouth,
        angle +
            Math.PI * 2 -
            mouth
    );

    ctx.closePath();

    ctx.fill();
}


/* =========================================================
   DRAW GHOST
========================================================= */

function drawGhost(ghost) {

    const x =
        ghost.x * TILE;

    const y =
        ghost.y * TILE;

    const centerX =
        x + TILE / 2;

    const top =
        y + 3;

    const radius =
        TILE / 2 - 3;

    /*
       Dead ghost = eyes only
    */

    if (ghost.dead) {

        drawGhostEyes(
            centerX,
            y + TILE / 2
        );

        return;
    }

    let color =
        ghost.color;

    /*
       Frightened mode
    */

    if (
        ghost.frightened
    ) {

        if (
            frightenedTimer < 2000 &&
            Math.floor(
                frightenedTimer / 150
            ) % 2 === 0
        ) {

            color = "#fff";

        } else {

            color = "#164cff";
        }
    }

    ctx.fillStyle =
        color;

    ctx.beginPath();

    /*
       Head
    */

    ctx.arc(
        centerX,
        top + radius,
        radius,
        Math.PI,
        0
    );

    /*
       Body
    */

    ctx.lineTo(
        x + TILE - 3,
        y + TILE - 3
    );

    /*
       Bottom waves
    */

    ctx.lineTo(
        x + TILE * 0.75,
        y + TILE - 7
    );

    ctx.lineTo(
        x + TILE * 0.5,
        y + TILE - 3
    );

    ctx.lineTo(
        x + TILE * 0.25,
        y + TILE - 7
    );

    ctx.lineTo(
        x + 3,
        y + TILE - 3
    );

    ctx.closePath();

    ctx.fill();

    /*
       Eyes
    */

    if (
        !ghost.frightened
    ) {

        drawGhostEyes(
            centerX,
            y + TILE / 2
        );
    }
}


/* =========================================================
   GHOST EYES
========================================================= */

function drawGhostEyes(
    centerX,
    centerY
) {

    const offset = 4;

    /*
       White
    */

    ctx.fillStyle =
        "#fff";

    ctx.beginPath();

    ctx.arc(
        centerX - offset,
        centerY - 2,
        3.3,
        0,
        Math.PI * 2
    );

    ctx.arc(
        centerX + offset,
        centerY - 2,
        3.3,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
       Pupils
    */

    ctx.fillStyle =
        "#111";

    ctx.beginPath();

    ctx.arc(
        centerX - offset,
        centerY - 2,
        1.6,
        0,
        Math.PI * 2
    );

    ctx.arc(
        centerX + offset,
        centerY - 2,
        1.6,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


/* =========================================================
   DRAW EVERYTHING
========================================================= */

function draw() {

    /*
       Background
    */

    ctx.fillStyle =
        "#000";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawMaze();

    drawPellets();

    ghosts.forEach(
        drawGhost
    );

    drawPacman();
}


/* =========================================================
   UPDATE
========================================================= */

function update(delta) {

    if (
        gameState !== "playing"
    ) {

        return;
    }

    accumulator += delta;

    while (
        accumulator >= levelSpeed
    ) {

        accumulator -=
            levelSpeed;

        movePacman();

        if (
            gameState !== "playing"
        ) {

            break;
        }

        moveGhosts();

        checkGhostCollision();
    }

    /*
       Power mode timer
    */

    if (
        frightenedTimer > 0
    ) {

        frightenedTimer -= delta;

        if (
            frightenedTimer <= 0
        ) {

            frightenedTimer = 0;

            ghosts.forEach(
                ghost => {

                    if (
                        !ghost.dead
                    ) {

                        ghost.frightened =
                            false;
                    }
                }
            );
        }
    }
}


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(timestamp) {

    const delta =
        Math.min(
            timestamp - lastTime,
            100
        );

    lastTime =
        timestamp;

    update(delta);

    draw();

    animationId =
        requestAnimationFrame(
            gameLoop
        );
}


/* =========================================================
   INITIALIZE
========================================================= */

highScoreElement.textContent =
    highScore;

updateScore();

updateLives();

loadLevel(1);

/*
   Initial Start Screen
*/

showMessage(
    "PAC-MAN",
    "Eat every pellet, collect power pellets and avoid the ghosts!",
    "START GAME",
    startGame
);

gameState = "menu";

draw();

/*
   Start animation loop immediately
   so pellets remain animated.
*/

animationId =
    requestAnimationFrame(
        timestamp => {

            lastTime = timestamp;

            animationId =
                requestAnimationFrame(
                    gameLoop
                );
        }
    );
