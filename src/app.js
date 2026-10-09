import {
  toKey, isDone, nextStatus, STATUS,
  currentStreak, bestStreak, monthCount, dailyHint,
} from "./streaks.js";

const STORAGE_KEY = "habit-tracker-v1";

const HINTS = {
  done: "Hoy ya cuenta. Buen trabajo.",
  must: "Ayer no entrenaste: hoy es obligatorio, aunque sea la versión mínima.",
  rest: "Ayer entrenaste. Hoy puedes descansar, pero no faltes dos días seguidos.",
};

// ---------- Estado ----------
const today = new Date();
today.setHours(0, 0, 0, 0);

let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
let data = loadData();

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage puede fallar (modo privado, cuota llena): la app sigue funcionando
  }
}

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const grid = $("grid");

function renderStats() {
  $("stat-current").textContent = currentStreak(data, today);
  $("stat-best").textContent = bestStreak(data);
  $("stat-month").textContent = monthCount(data, viewDate.getFullYear(), viewDate.getMonth());
  $("hint").textContent = HINTS[dailyHint(data, today)];
}

function createDayButton(year, month, dayNumber) {
  const date = new Date(year, month, dayNumber);
  const key = toKey(date);
  const status = data[key];

  const btn = document.createElement("button");
  btn.className = "day";
  btn.textContent = dayNumber;

  if (status === STATUS.FULL) btn.classList.add("full");
  else if (status === STATUS.MIN) btn.classList.add("min");
  else if (date < today) btn.classList.add("missed");

  if (date.getTime() === today.getTime()) btn.classList.add("today");
  if (date > today) btn.classList.add("future");

  btn.addEventListener("click", () => {
    const next = nextStatus(data[key]);
    if (next) data[key] = next;
    else delete data[key];
    saveData();
    render();
  });
  return btn;
}

function renderCalendar() {
  grid.innerHTML = "";

  for (const name of ["L", "M", "X", "J", "V", "S", "D"]) {
    const el = document.createElement("div");
    el.className = "weekday";
    el.textContent = name;
    grid.appendChild(el);
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const offset = (viewDate.getDay() + 6) % 7; // semana empieza en lunes
  for (let i = 0; i < offset; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    grid.appendChild(empty);
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let n = 1; n <= daysInMonth; n++) {
    grid.appendChild(createDayButton(year, month, n));
  }

  $("month-title").textContent = viewDate.toLocaleDateString("es", {
    month: "long",
    year: "numeric",
  });
}

function render() {
  renderCalendar();
  renderStats();
}

// ---------- Eventos ----------
$("prev").addEventListener("click", () => {
  viewDate.setMonth(viewDate.getMonth() - 1);
  render();
});
$("next").addEventListener("click", () => {
  viewDate.setMonth(viewDate.getMonth() + 1);
  render();
});
$("reset").addEventListener("click", () => {
  if (confirm("¿Borrar todos los datos?")) {
    data = {};
    saveData();
    render();
  }
});

render();
