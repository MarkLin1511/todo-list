const STORAGE_KEY = "momentum-list-items";

const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const categorySelect = document.querySelector("#todo-category");
const todoList = document.querySelector("#todo-list");
const filterButtons = document.querySelectorAll(".filter-button");
const openCount = document.querySelector("#open-count");
const doneCount = document.querySelector("#done-count");
const clearCompletedButton = document.querySelector("#clear-completed");
const emptyStateTemplate = document.querySelector("#empty-state-template");

let currentFilter = "all";
let todos = loadTodos();

render();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = input.value.trim();
  if (!title) {
    return;
  }

  todos.unshift({
    id: crypto.randomUUID(),
    title,
    category: categorySelect.value,
    completed: false,
    createdAt: new Date().toISOString(),
  });

  persistAndRender();
  form.reset();
  categorySelect.value = "Work";
  input.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    filterButtons.forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    render();
  });
});

clearCompletedButton.addEventListener("click", () => {
  todos = todos.filter((todo) => !todo.completed);
  persistAndRender();
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
    persistAndRender();
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
  persistAndRender();
});

function persistAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  render();
}

function loadTodos() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function render() {
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
    todoList.append(emptyStateTemplate.content.cloneNode(true));
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
      <button class="icon-button" type="button" data-action="delete" aria-label="Delete ${
        escapeHtml(todo.title)
      }">
        Delete
      </button>
    </div>
  `;

  return item;
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
