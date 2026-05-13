const state = {
  size: 4,
  running: true,
  packet: 24,
  elapsed: 14.2,
  battery: 91,
  speed: 18.4,
  step: 6,
  path: [],
  timer: null,
};

const samplePaths = {
  4: [
    [0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2], [3, 3],
    [2, 3], [1, 3], [0, 3]
  ],
  8: [
    [0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [4, 1], [4, 2], [4, 3],
    [5, 3], [6, 3], [6, 4], [6, 5], [5, 5], [4, 5], [4, 6], [4, 7]
  ],
  16: [
    [0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [4, 1], [5, 1], [5, 2],
    [6, 2], [7, 2], [7, 3], [8, 3], [8, 4], [8, 5], [9, 5], [10, 5],
    [10, 6], [10, 7], [9, 7], [8, 7], [8, 8], [7, 8], [7, 9], [7, 10]
  ],
};

const history = [
  { track: "4x4", time: "00:18.4", speed: "19,2 cm/s", ok: true },
  { track: "8x8", time: "01:04.8", speed: "17,6 cm/s", ok: true },
  { track: "16x16", time: "02:41.5", speed: "16,9 cm/s", ok: true },
  { track: "4x4", time: "00:21.9", speed: "18,1 cm/s", ok: false },
  { track: "8x8", time: "00:58.3", speed: "20,4 cm/s", ok: true },
];

const elements = {
  grid: document.querySelector("#mazeGrid"),
  title: document.querySelector("#mazeTitle"),
  currentCell: document.querySelector("#currentCell"),
  batteryValue: document.querySelector("#batteryValue"),
  batteryBar: document.querySelector("#batteryBar"),
  speedValue: document.querySelector("#speedValue"),
  timeValue: document.querySelector("#timeValue"),
  challengeStatus: document.querySelector("#challengeStatus"),
  statusLine: document.querySelector("#statusLine"),
  pathCount: document.querySelector("#pathCount"),
  batterySpent: document.querySelector("#batterySpent"),
  packetCount: document.querySelector("#packetCount"),
  finishFlag: document.querySelector("#finishFlag"),
  toggleRun: document.querySelector("#toggleRun"),
  toggleIcon: document.querySelector("#toggleIcon"),
  resetRun: document.querySelector("#resetRun"),
  statusDot: document.querySelector("#statusDot"),
  connectionStatus: document.querySelector("#connectionStatus"),
  historyFilter: document.querySelector("#historyFilter"),
  historyList: document.querySelector("#historyList"),
};

function formatTime(value) {
  const minutes = Math.floor(value / 60).toString().padStart(2, "0");
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  const decimal = Math.floor((value % 1) * 10);
  return `${minutes}:${seconds}.${decimal}`;
}

function isPathCell(x, y) {
  return state.path.some(([px, py]) => px === x && py === y);
}

function wallClasses(x, y) {
  const classes = [];
  if (x === 0) classes.push("wall-left");
  if (y === 0) classes.push("wall-top");
  if (x === state.size - 1) classes.push("wall-right");
  if (y === state.size - 1) classes.push("wall-bottom");
  if ((x + y) % 5 === 0 && x > 0) classes.push("wall-left");
  if ((x * 2 + y) % 7 === 0 && y > 0) classes.push("wall-top");
  return classes;
}

function renderMaze() {
  const path = samplePaths[state.size];
  const robot = path[state.step % path.length];
  const goal = path[path.length - 1];
  state.path = path.slice(0, (state.step % path.length) + 1);

  elements.grid.style.gridTemplateColumns = `repeat(${state.size}, 1fr)`;
  elements.grid.innerHTML = "";

  for (let y = 0; y < state.size; y += 1) {
    for (let x = 0; x < state.size; x += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.classList.add(...wallClasses(x, y));
      if (isPathCell(x, y)) cell.classList.add("is-visited");
      if (state.path.some(([px, py], index) => px === x && py === y && index >= state.path.length - 3)) {
        cell.classList.add("is-path");
      }
      if (x === goal[0] && y === goal[1]) cell.classList.add("is-goal");
      if (x === robot[0] && y === robot[1]) cell.classList.add("is-robot");
      elements.grid.appendChild(cell);
    }
  }

  elements.currentCell.textContent = `Célula ${robot[0] + 1},${robot[1] + 1}`;
  elements.title.textContent = `Labirinto ${state.size}x${state.size}`;
}

function renderMetrics() {
  const finished = state.step % samplePaths[state.size].length === samplePaths[state.size].length - 1;
  elements.batteryValue.textContent = `${Math.max(0, Math.round(state.battery))}%`;
  elements.batteryBar.style.width = `${Math.max(0, state.battery)}%`;
  elements.speedValue.textContent = `${state.speed.toFixed(1).replace(".", ",")} cm/s`;
  elements.timeValue.textContent = formatTime(state.elapsed);
  elements.challengeStatus.textContent = finished ? "Concluído" : "Em corrida";
  elements.statusLine.textContent = `Pacote ${String(state.packet).padStart(3, "0")} recebido`;
  elements.pathCount.textContent = `${state.path.length} células`;
  elements.batterySpent.textContent = `${Math.max(0, 100 - Math.round(state.battery))}%`;
  elements.packetCount.textContent = state.packet.toString();
  elements.finishFlag.textContent = finished ? "Finalizada" : "Ativa";
}

function renderHistory() {
  const filter = elements.historyFilter.value;
  const rows = history.filter((item) => filter === "todos" || item.track === filter);
  elements.historyList.innerHTML = "";

  rows.forEach((item) => {
    const row = document.createElement("article");
    row.className = "history-item";
    row.innerHTML = `
      <strong>${item.track}</strong>
      <span class="${item.ok ? "ok" : ""}">${item.ok ? "sucesso" : "falha"}</span>
      <small>${item.time}</small>
      <small>${item.speed}</small>
    `;
    elements.historyList.appendChild(row);
  });
}

function tick() {
  if (!state.running) return;
  state.step += 1;
  state.packet += 1;
  state.elapsed += 0.8;
  state.battery = Math.max(8, state.battery - 0.16);
  state.speed = 17.5 + Math.sin(state.step / 2) * 2.2 + state.size / 20;
  renderMaze();
  renderMetrics();
}

function setRunning(value) {
  state.running = value;
  elements.toggleIcon.textContent = state.running ? "II" : "▶";
  elements.statusDot.classList.toggle("is-paused", !state.running);
  elements.connectionStatus.textContent = state.running ? "Conectado ao simulador" : "Simulação pausada";
}

function reset() {
  state.step = 0;
  state.packet = 1;
  state.elapsed = 0;
  state.battery = 100;
  state.speed = 0;
  renderMaze();
  renderMetrics();
}

document.querySelectorAll("[data-size]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-size]").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    state.size = Number(button.dataset.size);
    reset();
  });
});

elements.toggleRun.addEventListener("click", () => setRunning(!state.running));
elements.resetRun.addEventListener("click", reset);
elements.historyFilter.addEventListener("change", renderHistory);

renderMaze();
renderMetrics();
renderHistory();
state.timer = window.setInterval(tick, 900);
