import { useState, useEffect, useRef, useCallback } from 'react';

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

export function useMazeSimulator(initialGridSize = 16) {
    const [gridSize, setGridSize] = useState(initialGridSize);
    
    // Keep raw mutable state in refs to avoid closure hell in setInterval
    const memory = useRef({
        truthWalls: [],
        knownWalls: [],
        distances: [],
        robot: { x: 0, y: initialGridSize - 1, dir: 0 },
        steps: 0,
        turns: 0,
        bfsCount: 0,
        timeMs: 0,
        explored: [],
        status: 'Aguardando',
        goals: []
    });

    const [triggerRender, setTriggerRender] = useState(0);
    const forceRender = () => setTriggerRender(prev => prev + 1);

    const [isRunning, setIsRunning] = useState(false);
    const [speed, setSpeed] = useState(50);
    const [showTruth, setShowTruth] = useState(false);

    const getGoals = useCallback((size) => {
        const mid = Math.floor(size / 2);
        return [
            {x: mid - 1, y: mid - 1}, {x: mid, y: mid - 1},
            {x: mid - 1, y: mid}, {x: mid, y: mid}
        ];
    }, []);

    const generateMaze = useCallback((size) => {
        const mem = memory.current;
        let tWalls = Array(size).fill(null).map(() => 
            Array(size).fill(null).map(() => ({0: true, 1: true, 2: true, 3: true}))
        );

        let startY = size - 1;
        let stack = [{x: 0, y: startY}];
        let visited = Array(size).fill(null).map(() => Array(size).fill(false));
        visited[0][startY] = true;

        while (stack.length > 0) {
            let curr = stack[stack.length - 1];
            let unvisitedNeighbors = [];

            for (let d = 0; d < 4; d++) {
                let nx = curr.x + DX[d];
                let ny = curr.y + DY[d];
                if (nx >= 0 && nx < size && ny >= 0 && ny < size && !visited[nx][ny]) {
                    unvisitedNeighbors.push({dir: d, x: nx, y: ny});
                }
            }

            if (unvisitedNeighbors.length > 0) {
                let next = unvisitedNeighbors[Math.floor(Math.random() * unvisitedNeighbors.length)];
                tWalls[curr.x][curr.y][next.dir] = false;
                tWalls[next.x][next.y][(next.dir + 2) % 4] = false;
                
                visited[next.x][next.y] = true;
                stack.push(next);
            } else {
                stack.pop();
            }
        }

        const currentGoals = getGoals(size);
        for (let g1 of currentGoals) {
            for (let d = 0; d < 4; d++) {
                let nx = g1.x + DX[d];
                let ny = g1.y + DY[d];
                if (currentGoals.some(g2 => g2.x === nx && g2.y === ny)) {
                    tWalls[g1.x][g1.y][d] = false;
                }
            }
        }

        const loops = Math.floor(size * size * 0.15); // Adjust loops based on size
        for (let i = 0; i < loops; i++) {
            let rx = Math.floor(Math.random() * (size - 2)) + 1;
            let ry = Math.floor(Math.random() * (size - 2)) + 1;
            let rd = Math.floor(Math.random() * 4);
            let nx = rx + DX[rd];
            let ny = ry + DY[rd];
            tWalls[rx][ry][rd] = false;
            tWalls[nx][ny][(rd + 2) % 4] = false;
        }
        
        mem.truthWalls = tWalls;
        mem.goals = currentGoals;
    }, [getGoals]);

    const initRobotMemory = useCallback((size) => {
        const mem = memory.current;
        mem.knownWalls = Array(size).fill(null).map((_, x) => 
            Array(size).fill(null).map((_, y) => ({
                0: y === 0,
                1: x === size - 1,
                2: y === size - 1,
                3: x === 0
            }))
        );
        mem.wallInspected = Array(size).fill(null).map((_, x) => 
            Array(size).fill(null).map((_, y) => ({
                0: y === 0,
                1: x === size - 1,
                2: y === size - 1,
                3: x === 0
            }))
        );
        mem.distances = Array(size).fill(null).map(() => Array(size).fill(255));
        mem.explored = Array(size).fill(null).map(() => Array(size).fill(false));
    }, []);

    const floodFill = useCallback((size) => {
        const mem = memory.current;
        mem.bfsCount++;

        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                mem.distances[x][y] = 255;
            }
        }

        let queue = [];
        for (let g of mem.goals) {
            mem.distances[g.x][g.y] = 0;
            queue.push(g);
        }

        while (queue.length > 0) {
            let curr = queue.shift();
            for (let d = 0; d < 4; d++) {
                if (!mem.knownWalls[curr.x][curr.y][d]) {
                    let nx = curr.x + DX[d];
                    let ny = curr.y + DY[d];
                    if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                        if (mem.distances[nx][ny] === 255) {
                            mem.distances[nx][ny] = mem.distances[curr.x][curr.y] + 1;
                            queue.push({x: nx, y: ny});
                        }
                    }
                }
            }
        }
    }, []);

    const checkDeadEnd = useCallback((x, y, size) => {
        const mem = memory.current;
        let walls = 0;
        for (let i = 0; i < 4; i++) {
            if (mem.knownWalls[x][y][i]) walls++;
        }
        
        if (walls === 3) {
            for (let i = 0; i < 4; i++) {
                if (!mem.wallInspected[x][y][i]) {
                    mem.knownWalls[x][y][i] = true;
                    mem.wallInspected[x][y][i] = true;
                    
                    let nx = x + DX[i];
                    let ny = y + DY[i];
                    if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                        mem.knownWalls[nx][ny][(i + 2) % 4] = true;
                        mem.wallInspected[nx][ny][(i + 2) % 4] = true;
                        checkDeadEnd(nx, ny, size);
                    }
                    break;
                }
            }
        }
    }, []);

    const senseWalls = useCallback((size) => {
        const mem = memory.current;
        let changed = false;
        let rx = mem.robot.x;
        let ry = mem.robot.y;

        for (let d = 0; d < 4; d++) {
            mem.wallInspected[rx][ry][d] = true;
            
            if (mem.truthWalls[rx][ry][d] && !mem.knownWalls[rx][ry][d]) {
                mem.knownWalls[rx][ry][d] = true;
                changed = true;
                let nx = rx + DX[d];
                let ny = ry + DY[d];
                if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                    mem.knownWalls[nx][ny][(d + 2) % 4] = true;
                    mem.wallInspected[nx][ny][(d + 2) % 4] = true;
                    checkDeadEnd(nx, ny, size);
                }
            }
        }
        mem.explored[rx][ry] = true;
        return changed;
    }, [checkDeadEnd]);

    const getBestNeighbor = useCallback((size) => {
        const mem = memory.current;
        let bestDir = -1;
        let minVal = Infinity;
        let rDir = mem.robot.dir;

        const checkOrder = [
            (rDir + 3) % 4, // Left
            (rDir + 2) % 4, // Rear
            (rDir + 1) % 4, // Right
            rDir            // Front
        ];

        for (let d of checkOrder) {
            if (!mem.knownWalls[mem.robot.x][mem.robot.y][d]) {
                let nx = mem.robot.x + DX[d];
                let ny = mem.robot.y + DY[d];
                
                if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                    if (mem.distances[nx][ny] <= minVal) {
                        minVal = mem.distances[nx][ny];
                        bestDir = d;
                    }
                }
            }
        }
        return bestDir;
    }, []);

    const resetSimulation = useCallback((newMaze = false, forceSize = null) => {
        setIsRunning(false);
        const mem = memory.current;
        const currentSize = forceSize || gridSize;
        
        if (newMaze || mem.truthWalls.length !== currentSize) {
            generateMaze(currentSize);
        }

        mem.robot = { x: 0, y: currentSize - 1, dir: 0 };
        mem.steps = 0;
        mem.turns = 0;
        mem.bfsCount = 0;
        mem.timeMs = 0;
        mem.status = 'Aguardando';
        // Pista física: 18 cm por célula → 180 mm. Centro da célula = celula*180 + 90.
        mem.pathHistory = [{
            x: 0 * 180 + 90,
            y: (currentSize - 1) * 180 + 90,
            z: 9.81,
        }];
        mem.batteryStartV = 8.0;
        mem.batteryEndV = 7.1;
        mem.startedAtIso = null;
        mem.startedAtMs = 0;

        initRobotMemory(currentSize);
        floodFill(currentSize);
        forceRender();
    }, [gridSize, generateMaze, initRobotMemory, floodFill]);

    const changeGridSize = useCallback((newSize) => {
        setGridSize(newSize);
        resetSimulation(true, newSize);
    }, [resetSimulation]);

    // Initial load
    useEffect(() => {
        if (memory.current.truthWalls.length !== gridSize) {
            resetSimulation(true);
        }
    }, [resetSimulation, gridSize]);

    const step = useCallback(() => {
        const mem = memory.current;
        
        let changed = senseWalls(gridSize);
        if (changed) {
            floodFill(gridSize);
        }

        if (mem.goals.some(g => g.x === mem.robot.x && g.y === mem.robot.y)) {
            setIsRunning(false);
            mem.status = "Centro Alcançado!";
            forceRender();
            return;
        }

        let moveDir = getBestNeighbor(gridSize);

        if (moveDir === -1) {
            setIsRunning(false);
            mem.status = "Preso!";
            forceRender();
            return;
        }

        if (moveDir !== mem.robot.dir) {
            mem.turns++;
            mem.robot.dir = moveDir;
        }

        mem.robot.x += DX[mem.robot.dir];
        mem.robot.y += DY[mem.robot.dir];
        mem.steps++;
        mem.timeMs += speed;

        // Acumula posição em mm para enviar como path_traversed ao backend.
        mem.pathHistory.push({
            x: mem.robot.x * 180 + 90,
            y: mem.robot.y * 180 + 90,
            z: 9.81,
        });

        forceRender();
    }, [gridSize, senseWalls, floodFill, getBestNeighbor, speed]);

    useEffect(() => {
        let interval;
        if (isRunning) {
            const mem = memory.current;
            mem.status = "Mapeando...";
            // Marca início da corrida na primeira vez que sai de pausa.
            if (!mem.startedAtIso) {
                mem.startedAtIso = new Date().toISOString();
                mem.startedAtMs = Date.now();
            }
            interval = setInterval(step, speed);
        }
        return () => clearInterval(interval);
    }, [isRunning, speed, step]);

    return {
        memory: memory.current,
        isRunning,
        setIsRunning,
        speed,
        setSpeed,
        showTruth,
        setShowTruth,
        resetSimulation,
        gridSize,
        changeGridSize,
        triggerRender
    };
}
