const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

context.scale(20, 20); // Scale the grid so each block is 20x20 pixels

// Define Tetromino colors
const colors = [
    null,
    '#FF0D72', // T
    '#0DC2FF', // O
    '#0DFF72', // L
    '#F538FF', // J
    '#FF8E0D', // I
    '#FFE138', // S
    '#3877FF', // Z
];

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10;
        rowCount *= 2;
    }
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'T') {
        return [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
        ];
    } else if (type === 'O') {
        return [
            [2, 2],
            [2, 2],
        ];
    } else if (type === 'L') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3],
        ];
    } else if (type === 'J') {
        return [
            [0, 4, 0],
            [0, 4, 0],
            [4, 4, 0],
        ];
    } else if (type === 'I') {
        return [
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'Z') {
        return [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0],
        ];
    }
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x,
                                 y + offset.y,
                                 1, 1);
            }
        });
    });
}

function drawGrid() {
    context.strokeStyle = '#222';
    context.lineWidth = 0.05;
    for (let x = 0; x < canvas.width / 20; x++) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height / 20);
        context.stroke();
    }
    for (let y = 0; y < canvas.height / 20; y++) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width / 20, y);
        context.stroke();
    }
}

function getGhostPos() {
    const ghost = {
        matrix: player.matrix,
        pos: { x: player.pos.x, y: player.pos.y }
    };
    while (!collide(arena, ghost)) {
        ghost.pos.y++;
    }
    ghost.pos.y--;
    return ghost.pos;
}

function drawGhost() {
    const ghostPos = getGhostPos();
    context.globalAlpha = 0.2;
    drawMatrix(player.matrix, ghostPos);
    context.globalAlpha = 1.0;
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawMatrix(arena, {x: 0, y: 0});

    if (player.matrix) {
        drawGhost();
        drawMatrix(player.matrix, player.pos);
    }
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    const pieces = 'ILJOTSZ';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);

    // Game Over
    if (collide(arena, player)) {
        saveScore();
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
        isPlaying = false;
        document.getElementById('name-modal').style.display = 'flex'; // Show modal again
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

let dropCounter = 0;
let dropInterval = 1000;

let lastTime = 0;
let isPlaying = false;
let playerName = 'Player1';
let leaderboard = JSON.parse(localStorage.getItem('tetrisLeaderboard')) || [];

function saveScore() {
    if (player.score > 0) {
        leaderboard.push({ name: playerName, score: player.score });
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 5); // Keep top 5
        localStorage.setItem('tetrisLeaderboard', JSON.stringify(leaderboard));
        updateLeaderboardDisplay();
    }
}

function updateLeaderboardDisplay() {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';
    leaderboard.forEach((entry, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${index + 1}. ${entry.name}</span> <span>${entry.score}</span>`;
        list.appendChild(li);
    });
}

function update(time = 0) {
    if (!isPlaying) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
}

const arena = createMatrix(12, 20);

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
};

updateLeaderboardDisplay();

document.addEventListener('keydown', event => {
    if (!isPlaying) return;

    if (event.keyCode === 37) {
        playerMove(-1);
    } else if (event.keyCode === 39) {
        playerMove(1);
    } else if (event.keyCode === 40) {
        playerDrop();
    } else if (event.keyCode === 38) {
        playerRotate(1);
    }
});

// Mobile Controls
function setupMobileControls() {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnDown = document.getElementById('btn-down');
    const btnUp = document.getElementById('btn-up');

    // Helper to handle both touch and mouse events
    function addPressEvent(element, action) {
        element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (isPlaying) action();
        }, {passive: false});

        element.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if (isPlaying) action();
        });
    }

    addPressEvent(btnLeft, () => playerMove(-1));
    addPressEvent(btnRight, () => playerMove(1));
    addPressEvent(btnDown, () => playerDrop());
    addPressEvent(btnUp, () => playerRotate(1));
}

setupMobileControls();

document.getElementById('save-name-btn').addEventListener('click', () => {
    const inputName = document.getElementById('player-name-input').value.trim();
    if (inputName) {
        playerName = inputName.toUpperCase();
    }
    document.getElementById('display-name').innerText = playerName;
    document.getElementById('name-modal').style.display = 'none';

    if (!isPlaying) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        isPlaying = true;
        playerReset();
        updateScore();
        update();
    }
});

document.getElementById('start-btn').addEventListener('click', () => {
    if (isPlaying) {
        saveScore();
    }
    arena.forEach(row => row.fill(0));
    player.score = 0;
    isPlaying = false;
    document.getElementById('name-modal').style.display = 'flex';
});

// Initial setup
draw();
