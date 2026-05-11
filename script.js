document.addEventListener('DOMContentLoaded', () => {
    initNetworkBackground();
    initGrid();
    setupEventListeners();
    updateExplanation();
});

// State
const GRID_SIZE = 20;
let grid = []; // 2D array: 0=safe, 1=wall, 2=base, 3=victim
let currentTool = 'base';
let isRunning = false;
let startPos = null; // {r, c}
let victimPos = null; // {r, c}  (Currently assuming 1 victim for simpler pathfinding visualization, but can be extended)
let isMouseDown = false;

// DOM Elements
const gridContainer = document.getElementById('grid-map');
const toolBtns = document.querySelectorAll('.tool-btn');
const runBtn = document.getElementById('run-btn');
const resetBtn = document.getElementById('reset-btn');
const randomBtn = document.getElementById('random-btn');
const algoSelect = document.getElementById('algorithm-select');

// Stats Elements
const statTime = document.getElementById('stat-time');
const statNodes = document.getElementById('stat-nodes');
const statDistance = document.getElementById('stat-distance');
const statStatus = document.getElementById('stat-status');
const explanationDiv = document.getElementById('algo-explanation');

// Explanations Data
const explanations = {
    bfs: {
        title: "Breadth First Search (BFS)",
        desc: "Explores all neighboring cells at the present depth prior to moving on to the nodes at the next depth level. Guarantees the shortest path in an unweighted grid."
    },
    ucs: {
        title: "Uniform Cost Search (UCS)",
        desc: "Expands the node with the lowest path cost from the start node. Since our grid has uniform step cost (1), it behaves similarly to BFS but uses a priority queue."
    },
    astar: {
        title: "A* Search Algorithm",
        desc: "Uses a heuristic (Manhattan distance) to guide the search towards the goal. It combines the actual cost from start and estimated cost to goal, making it highly efficient."
    }
};

// --- Initialization ---

function initGrid() {
    gridContainer.innerHTML = '';
    gridContainer.style.gridTemplateColumns = `repeat(${GRID_SIZE}, var(--cell-size))`;
    gridContainer.style.gridTemplateRows = `repeat(${GRID_SIZE}, var(--cell-size))`;
    grid = [];
    startPos = null;
    victimPos = null;

    for (let r = 0; r < GRID_SIZE; r++) {
        let row = [];
        for (let c = 0; c < GRID_SIZE; c++) {
            row.push(0); // 0 corresponds to 'safe'
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.r = r;
            cell.dataset.c = c;
            
            // Mouse events for drawing
            cell.addEventListener('mousedown', (e) => {
                isMouseDown = true;
                applyTool(r, c, cell);
            });
            cell.addEventListener('mouseenter', (e) => {
                if (isMouseDown) applyTool(r, c, cell);
            });
            
            gridContainer.appendChild(cell);
        }
        grid.push(row);
    }
}

function setupEventListeners() {
    // Stop drawing when mouse is released
    document.body.addEventListener('mouseup', () => {
        isMouseDown = false;
    });

    // Tool selection
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isRunning) return;
            toolBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.mode;
        });
    });

    // Algorithm selection
    algoSelect.addEventListener('change', updateExplanation);

    // Buttons
    runBtn.addEventListener('click', startSimulation);
    resetBtn.addEventListener('click', () => {
        if (isRunning) return;
        initGrid();
        resetStats();
    });
    randomBtn.addEventListener('click', generateRandomScenario);
}

function applyTool(r, c, cellElement) {
    if (isRunning) return;

    // Reset cell UI
    cellElement.className = 'cell';

    // If placing a unique element (base/victim), remove previous ones
    if (currentTool === 'base') {
        if (startPos) {
            let oldCell = getCellElement(startPos.r, startPos.c);
            if (oldCell) oldCell.className = 'cell';
            grid[startPos.r][startPos.c] = 0;
        }
        startPos = { r, c };
        grid[r][c] = 2; // base
        cellElement.classList.add('base');
    } else if (currentTool === 'victim') {
        if (victimPos) {
            let oldCell = getCellElement(victimPos.r, victimPos.c);
            if (oldCell) oldCell.className = 'cell';
            grid[victimPos.r][victimPos.c] = 0;
        }
        victimPos = { r, c };
        grid[r][c] = 3; // victim
        cellElement.classList.add('victim');
    } else if (currentTool === 'wall') {
        if ((startPos && startPos.r === r && startPos.c === c) || 
            (victimPos && victimPos.r === r && victimPos.c === c)) return;
        grid[r][c] = 1; // wall
        cellElement.classList.add('wall');
    } else if (currentTool === 'safe' || currentTool === 'clear') {
        if (startPos && startPos.r === r && startPos.c === c) startPos = null;
        if (victimPos && victimPos.r === r && victimPos.c === c) victimPos = null;
        grid[r][c] = 0; // safe
    }
}

function getCellElement(r, c) {
    return document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
}

function updateExplanation() {
    const algo = algoSelect.value;
    const data = explanations[algo];
    explanationDiv.querySelector('h3').textContent = data.title;
    explanationDiv.querySelector('p').textContent = data.desc;
}

function resetStats() {
    statTime.textContent = '0 ms';
    statNodes.textContent = '0';
    statDistance.textContent = '0';
    statStatus.textContent = 'Ready';
    statStatus.className = 'stat-value text-glow-blue';
}

function clearSearchVisualization() {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            let cell = getCellElement(r, c);
            if (cell.classList.contains('search') || cell.classList.contains('path')) {
                cell.classList.remove('search', 'path');
            }
        }
    }
}

function generateRandomScenario() {
    if (isRunning) return;
    initGrid();
    resetStats();

    // Place base
    let br = Math.floor(Math.random() * GRID_SIZE);
    let bc = Math.floor(Math.random() * GRID_SIZE);
    applyToolWrapper('base', br, bc);

    // Place victim far away
    let vr, vc;
    do {
        vr = Math.floor(Math.random() * GRID_SIZE);
        vc = Math.floor(Math.random() * GRID_SIZE);
    } while (Math.abs(vr - br) + Math.abs(vc - bc) < 10);
    applyToolWrapper('victim', vr, vc);

    // Place random walls
    const numWalls = Math.floor(GRID_SIZE * GRID_SIZE * 0.25); // 25% walls
    let wallsPlaced = 0;
    while (wallsPlaced < numWalls) {
        let wr = Math.floor(Math.random() * GRID_SIZE);
        let wc = Math.floor(Math.random() * GRID_SIZE);
        if (grid[wr][wc] === 0) {
            applyToolWrapper('wall', wr, wc);
            wallsPlaced++;
        }
    }
}

function applyToolWrapper(tool, r, c) {
    let oldTool = currentTool;
    currentTool = tool;
    applyTool(r, c, getCellElement(r, c));
    currentTool = oldTool;
}

// --- Algorithms ---

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function startSimulation() {
    if (isRunning) return;
    if (!startPos) {
        alert("Please place a Rescue Base first.");
        return;
    }
    if (!victimPos) {
        alert("Please place a Victim first.");
        return;
    }

    isRunning = true;
    clearSearchVisualization();
    resetStats();
    statStatus.textContent = 'Running...';
    statStatus.className = 'stat-value text-glow-blue';
    
    runBtn.disabled = true;
    runBtn.style.opacity = '0.5';

    const algo = algoSelect.value;
    const startTime = performance.now();
    let result = null;

    if (algo === 'bfs') result = await runBFS();
    else if (algo === 'ucs') result = await runUCS();
    else if (algo === 'astar') result = await runAStar();

    const endTime = performance.now();
    statTime.textContent = Math.round(endTime - startTime) + ' ms';

    if (result && result.path) {
        statStatus.textContent = 'Victim Found!';
        statStatus.style.color = '#00ff88';
        statDistance.textContent = result.path.length;
        await animatePath(result.path);
    } else {
        statStatus.textContent = 'No Path Found';
        statStatus.style.color = '#ff3366';
    }

    isRunning = false;
    runBtn.disabled = false;
    runBtn.style.opacity = '1';
}

function getNeighbors(r, c) {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // up, down, left, right
    const neighbors = [];
    for (let [dr, dc] of directions) {
        let nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc] !== 1) {
            neighbors.push({ r: nr, c: nc });
        }
    }
    return neighbors;
}

async function runBFS() {
    let queue = [{ r: startPos.r, c: startPos.c, path: [] }];
    let visited = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
    visited[startPos.r][startPos.c] = true;

    let nodesExplored = 0;

    while (queue.length > 0) {
        let current = queue.shift();
        
        if (current.r === victimPos.r && current.c === victimPos.c) {
            return { path: current.path };
        }

        // Visualize search
        if (!(current.r === startPos.r && current.c === startPos.c)) {
            let cell = getCellElement(current.r, current.c);
            cell.classList.add('search');
            nodesExplored++;
            statNodes.textContent = nodesExplored;
            if (nodesExplored % 3 === 0) await sleep(10); // Batch animations slightly for speed
        }

        for (let neighbor of getNeighbors(current.r, current.c)) {
            if (!visited[neighbor.r][neighbor.c]) {
                visited[neighbor.r][neighbor.c] = true;
                queue.push({
                    r: neighbor.r,
                    c: neighbor.c,
                    path: [...current.path, { r: current.r, c: current.c }]
                });
            }
        }
    }
    return null;
}

class PriorityQueue {
    constructor() { this.elements = []; }
    enqueue(item, priority) {
        this.elements.push({ item, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }
    dequeue() { return this.elements.shift().item; }
    isEmpty() { return this.elements.length === 0; }
}

async function runUCS() {
    let pq = new PriorityQueue();
    pq.enqueue({ r: startPos.r, c: startPos.c, path: [], cost: 0 }, 0);
    
    let visited = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
    let nodesExplored = 0;

    while (!pq.isEmpty()) {
        let current = pq.dequeue();

        if (visited[current.r][current.c]) continue;
        visited[current.r][current.c] = true;

        if (current.r === victimPos.r && current.c === victimPos.c) {
            return { path: current.path };
        }

        if (!(current.r === startPos.r && current.c === startPos.c)) {
            let cell = getCellElement(current.r, current.c);
            cell.classList.add('search');
            nodesExplored++;
            statNodes.textContent = nodesExplored;
            if (nodesExplored % 3 === 0) await sleep(10);
        }

        for (let n of getNeighbors(current.r, current.c)) {
            if (!visited[n.r][n.c]) {
                let newCost = current.cost + 1;
                pq.enqueue({
                    r: n.r, c: n.c,
                    path: [...current.path, { r: current.r, c: current.c }],
                    cost: newCost
                }, newCost);
            }
        }
    }
    return null;
}

function heuristic(a, b) {
    // Manhattan distance
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

async function runAStar() {
    let pq = new PriorityQueue();
    pq.enqueue({ r: startPos.r, c: startPos.c, path: [], cost: 0 }, 0);
    
    let costs = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(Infinity));
    costs[startPos.r][startPos.c] = 0;
    
    let nodesExplored = 0;

    while (!pq.isEmpty()) {
        let current = pq.dequeue();

        if (current.r === victimPos.r && current.c === victimPos.c) {
            return { path: current.path };
        }

        // Just to prevent re-expanding nodes that got a cheaper path before this was popped
        if (current.cost > costs[current.r][current.c]) continue;

        if (!(current.r === startPos.r && current.c === startPos.c)) {
            let cell = getCellElement(current.r, current.c);
            if (!cell.classList.contains('search')) {
                cell.classList.add('search');
                nodesExplored++;
                statNodes.textContent = nodesExplored;
                if (nodesExplored % 3 === 0) await sleep(10);
            }
        }

        for (let n of getNeighbors(current.r, current.c)) {
            let newCost = current.cost + 1;
            if (newCost < costs[n.r][n.c]) {
                costs[n.r][n.c] = newCost;
                let priority = newCost + heuristic(n, victimPos);
                pq.enqueue({
                    r: n.r, c: n.c,
                    path: [...current.path, { r: current.r, c: current.c }],
                    cost: newCost
                }, priority);
            }
        }
    }
    return null;
}

async function animatePath(path) {
    for (let i = 1; i < path.length; i++) { // Skip start pos
        let node = path[i];
        let cell = getCellElement(node.r, node.c);
        cell.classList.remove('search');
        cell.classList.add('path');
        await sleep(30);
    }
}

// --- Network Background ---

function initNetworkBackground() {
    const canvas = document.getElementById('network-bg');
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 80;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 1
        });
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        
        // Update particles
        for (let p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 229, 255, 0.5)';
            ctx.fill();
        }

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                let dx = particles[i].x - particles[j].x;
                let dy = particles[i].y - particles[j].y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 150) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(0, 229, 255, ${0.2 * (1 - dist / 150)})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(draw);
    }
    
    draw();
}
