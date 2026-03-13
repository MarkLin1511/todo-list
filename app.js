const HABIT_STORAGE_KEY = "habit-garden-data";
const TODO_STORAGE_KEY = "momentum-list-items";
const TAB_STORAGE_KEY = "momentum-desk-active-tab";

const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll(".tab-panel");
const habitStat = document.querySelector("#habit-stat");
const taskStat = document.querySelector("#task-stat");

const habitForm = document.querySelector("#habit-form");
const habitNameInput = document.querySelector("#habit-name");
const habitColorInput = document.querySelector("#habit-color");
const habitList = document.querySelector("#habit-list");
const todayDate = document.querySelector("#today-date");
const todaySummary = document.querySelector("#today-summary");
const resetTodayButton = document.querySelector("#reset-today");
const habitEmptyTemplate = document.querySelector("#habit-empty-template");

const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const todoCategorySelect = document.querySelector("#todo-category");
const todoList = document.querySelector("#todo-list");
const filterButtons = document.querySelectorAll(".filter-button");
const openCount = document.querySelector("#open-count");
const doneCount = document.querySelector("#done-count");
const clearCompletedButton = document.querySelector("#clear-completed");
const todoEmptyTemplate = document.querySelector("#todo-empty-template");

let activeTab = loadActiveTab();
let currentFilter = "all";
let habits = loadHabits();
let todos = loadTodos();

bindEvents();
render();
setActiveTab(activeTab);

function bindEvents() {
  habitForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = habitNameInput.value.trim();
    if (!name) {
      return;
    }

    habits.unshift({
      id: crypto.randomUUID(),
      name,
      color: habitColorInput.value,
      completions: [],
      totalCompletions: 0,
    });

    persistHabits();
    habitForm.reset();
    habitColorInput.value = "sun";
    habitNameInput.focus();
  });

  habitList.addEventListener("click", (event) => {
    const target = event.target;
    const card = target.closest(".habit-card");

    if (!card) {
      return;
    }

    const habit = habits.find(({ id }) => id === card.dataset.id);
    if (!habit) {
      return;
    }

    const today = getTodayKey();

    if (target.matches("[data-action='toggle']")) {
      if (habit.completions.includes(today)) {
        habit.completions = habit.completions.filter((entry) => entry !== today);
        habit.totalCompletions = Math.max(0, habit.totalCompletions - 1);
      } else {
        habit.completions.push(today);
        habit.completions.sort();
        habit.totalCompletions += 1;
      }

      persistHabits();
    }

    if (target.matches("[data-action='delete']")) {
      habits = habits.filter(({ id }) => id !== habit.id);
      persistHabits();
    }
  });

  resetTodayButton.addEventListener("click", () => {
    const today = getTodayKey();

    habits = habits.map((habit) => {
      if (!habit.completions.includes(today)) {
        return habit;
      }

      return {
        ...habit,
        completions: habit.completions.filter((entry) => entry !== today),
        totalCompletions: Math.max(0, habit.totalCompletions - 1),
      };
    });

    persistHabits();
  });

  todoForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = todoInput.value.trim();
    if (!title) {
      return;
    }

    todos.unshift({
      id: crypto.randomUUID(),
      title,
      category: todoCategorySelect.value,
      completed: false,
      createdAt: new Date().toISOString(),
    });

    persistTodos();
    todoForm.reset();
    todoCategorySelect.value = "School";
    todoInput.focus();
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;

      filterButtons.forEach((item) => {
        item.classList.toggle("active", item === button);
      });

      renderTodos();
      updateStats();
    });
  });

  clearCompletedButton.addEventListener("click", () => {
    todos = todos.filter((todo) => !todo.completed);
    persistTodos();
  });

  todoList.addEventListener("click", (event) => {
    const target = event.target;
    const item = target.closest(".todo-item");

    if (!item) {
      return;
    }

    const { id } = item.dataset;

    if (target.matches("[data-action='delete']")) {
      todos = todos.filter((todo) => todo.id !== id);
      persistTodos();
    }
  });

  todoList.addEventListener("change", (event) => {
    const target = event.target;

    if (!target.matches(".checkbox")) {
      return;
    }

    const item = target.closest(".todo-item");
    const todo = todos.find(({ id }) => id === item.dataset.id);

    if (!todo) {
      return;
    }

    todo.completed = target.checked;
    persistTodos();
  });

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.tab);
    });
  });
}

function render() {
  renderHabits();
  renderTodos();
  updateStats();
}

function renderHabits() {
  const today = getTodayKey();
  const completedToday = habits.filter((habit) => habit.completions.includes(today)).length;

  todayDate.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  todaySummary.textContent = `${completedToday} of ${habits.length} habits completed`;
  resetTodayButton.disabled = completedToday === 0;
  resetTodayButton.style.opacity = completedToday === 0 ? "0.45" : "1";

  habitList.innerHTML = "";

  if (habits.length === 0) {
    habitList.append(habitEmptyTemplate.content.cloneNode(true));
    return;
  }

  habits.forEach((habit) => {
    habitList.append(createHabitCard(habit, today));
  });
}

function renderTodos() {
  const filteredTodos = todos.filter((todo) => {
    if (currentFilter === "open") {
      return !todo.completed;
    }

    if (currentFilter === "done") {
      return todo.completed;
    }

    return true;
  });

  todoList.innerHTML = "";

  if (filteredTodos.length === 0) {
    todoList.append(todoEmptyTemplate.content.cloneNode(true));
  } else {
    filteredTodos.forEach((todo) => {
      todoList.append(createTodoElement(todo));
    });
  }

  const done = todos.filter((todo) => todo.completed).length;
  const open = todos.length - done;

  openCount.textContent = String(open);
  doneCount.textContent = String(done);
  clearCompletedButton.disabled = done === 0;
  clearCompletedButton.style.opacity = done === 0 ? "0.45" : "1";
}

function updateStats() {
  const today = getTodayKey();
  const completedHabits = habits.filter((habit) => habit.completions.includes(today)).length;
  const openTasks = todos.filter((todo) => !todo.completed).length;

  habitStat.textContent = String(completedHabits);
  taskStat.textContent = String(openTasks);
}

function setActiveTab(tabName) {
  activeTab = tabName === "todos" ? "todos" : "habits";
  localStorage.setItem(TAB_STORAGE_KEY, activeTab);

  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === activeTab;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  tabPanels.forEach((panel) => {
    const isActive = panel.id === `panel-${activeTab}`;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });
}

function persistHabits() {
  localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify(habits));
  render();
}

function persistTodos() {
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
  render();
}

function loadHabits() {
  try {
    const stored = JSON.parse(localStorage.getItem(HABIT_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(stored)) {
      return [];
    }

    return stored.map((habit) => ({
      ...habit,
      completions: Array.isArray(habit.completions) ? [...new Set(habit.completions)] : [],
      totalCompletions:
        typeof habit.totalCompletions === "number"
          ? habit.totalCompletions
          : Array.isArray(habit.completions)
            ? habit.completions.length
            : 0,
    }));
  } catch {
    return [];
  }
}

function loadTodos() {
  try {
    const stored = JSON.parse(localStorage.getItem(TODO_STORAGE_KEY) ?? "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function loadActiveTab() {
  return localStorage.getItem(TAB_STORAGE_KEY) === "todos" ? "todos" : "habits";
}

function createHabitCard(habit, today) {
  const card = document.createElement("li");
  const completedToday = habit.completions.includes(today);
  const streak = calculateStreak(habit.completions);
  const currentYear = new Date().getFullYear();

  card.className = `habit-card${completedToday ? " is-complete" : ""}`;
  card.dataset.id = habit.id;
  card.dataset.color = habit.color;

  card.innerHTML = `
    <div class="habit-badge" aria-hidden="true"></div>
    <div class="habit-content">
      <p class="habit-name">${escapeHtml(habit.name)}</p>
      <p class="habit-meta">
        Current streak: ${streak} day${streak === 1 ? "" : "s"} ·
        Total check-ins: ${habit.totalCompletions}
      </p>
      <div class="heatmap">
        <div class="heatmap-header">
          <p class="heatmap-title">${currentYear} overview</p>
          <p class="heatmap-legend">Colored cells = completed days</p>
        </div>
        ${createHeatmapMarkup(habit.completions, currentYear)}
      </div>
    </div>
    <div class="habit-actions">
      <button class="check-button" type="button" data-action="toggle">
        ${completedToday ? "Checked today" : "Mark done"}
      </button>
      <button class="delete-button" type="button" data-action="delete">
        Delete
      </button>
    </div>
  `;

  return card;
}

function createTodoElement(todo) {
  const item = document.createElement("li");
  item.className = `todo-item${todo.completed ? " done" : ""}`;
  item.dataset.id = todo.id;

  item.innerHTML = `
    <input
      class="checkbox"
      type="checkbox"
      aria-label="Mark ${escapeHtml(todo.title)} as complete"
      ${todo.completed ? "checked" : ""}
    />
    <div class="task-copy">
      <p class="task-title">${escapeHtml(todo.title)}</p>
      <p class="task-meta">${escapeHtml(todo.category)} · ${formatDate(todo.createdAt)}</p>
    </div>
    <div class="task-actions">
      <button class="delete-button" type="button" data-action="delete" aria-label="Delete ${
        escapeHtml(todo.title)
      }">
        Delete
      </button>
    </div>
  `;

  return item;
}

function createHeatmapMarkup(completions, year) {
  const completed = new Set(completions.filter((entry) => entry.startsWith(`${year}-`)));
  const formatter = new Intl.DateTimeFormat(undefined, { month: "short" });
  const rows = [];

  for (let month = 0; month < 12; month += 1) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let day = 1; day <= 31; day += 1) {
      if (day > daysInMonth) {
        cells.push('<span class="heatmap-cell is-filler" aria-hidden="true"></span>');
        continue;
      }

      const dayKey = [year, String(month + 1).padStart(2, "0"), String(day).padStart(2, "0")].join("-");
      const label = new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(`${dayKey}T12:00:00`));

      cells.push(
        `<span class="heatmap-cell${completed.has(dayKey) ? " is-complete" : ""}" title="${label}"></span>`
      );
    }

    rows.push(`
      <div class="heatmap-row">
        <span class="heatmap-month">${formatter.format(new Date(year, month, 1))}</span>
        ${cells.join("")}
      </div>
    `);
  }

  return `<div class="heatmap-rows">${rows.join("")}</div>`;
}

function calculateStreak(completions) {
  if (!Array.isArray(completions) || completions.length === 0) {
    return 0;
  }

  const uniqueDays = [...new Set(completions)].sort();
  const today = getTodayKey();
  const yesterday = shiftDayKey(today, -1);
  const latest = uniqueDays[uniqueDays.length - 1];

  if (latest !== today && latest !== yesterday) {
    return 0;
  }

  let streak = 1;
  let cursor = latest;

  for (let index = uniqueDays.length - 2; index >= 0; index -= 1) {
    if (uniqueDays[index] === shiftDayKey(cursor, -1)) {
      streak += 1;
      cursor = uniqueDays[index];
    } else if (uniqueDays[index] !== cursor) {
      break;
    }
  }

  return streak;
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDayKey(dayKey, offset) {
  const date = new Date(`${dayKey}T12:00:00`);
  date.setDate(date.getDate() + offset);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
