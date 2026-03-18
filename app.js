const STORAGE_KEY = "frames-and-days-data-v1";
const SESSION_KEY = "frames-and-days-session-v1";
const APP_YEAR = 2026;

const DEFAULT_STATE = {
  guestPassword: "bowling",
  markPassword: "strike",
  entries: [],
};

const dom = {
  gateView: document.querySelector("#gate-view"),
  guestView: document.querySelector("#guest-view"),
  adminView: document.querySelector("#admin-view"),
  markLoginLaunch: document.querySelector("#mark-login-launch"),
  guestLoginForm: document.querySelector("#guest-login-form"),
  guestPasswordInput: document.querySelector("#guest-password-input"),
  guestLoginFeedback: document.querySelector("#guest-login-feedback"),
  guestLogoutButton: document.querySelector("#guest-logout"),
  jumpLatestButton: document.querySelector("#jump-latest"),
  yearHeatmap: document.querySelector("#year-heatmap"),
  publishedCount: document.querySelector("#published-count"),
  photoCount: document.querySelector("#photo-count"),
  streakCount: document.querySelector("#streak-count"),
  searchInput: document.querySelector("#search-input"),
  tagFilter: document.querySelector("#tag-filter"),
  entryList: document.querySelector("#entry-list"),
  spotlightEmpty: document.querySelector("#spotlight-empty"),
  entrySpotlight: document.querySelector("#entry-spotlight"),
  entryDate: document.querySelector("#entry-date"),
  entryTitle: document.querySelector("#entry-title"),
  entryMeta: document.querySelector("#entry-meta"),
  entryExcerpt: document.querySelector("#entry-excerpt"),
  entryTags: document.querySelector("#entry-tags"),
  entryGallery: document.querySelector("#entry-gallery"),
  entryBody: document.querySelector("#entry-body"),
  entryJournal: document.querySelector("#entry-journal"),
  adminNewEntry: document.querySelector("#admin-new-entry"),
  adminPreviewGuest: document.querySelector("#admin-preview-guest"),
  adminLogout: document.querySelector("#admin-logout"),
  adminEntryCount: document.querySelector("#admin-entry-count"),
  adminDraftCount: document.querySelector("#admin-draft-count"),
  editorHeading: document.querySelector("#editor-heading"),
  entryForm: document.querySelector("#entry-form"),
  entryIdInput: document.querySelector("#entry-id"),
  entryDateInput: document.querySelector("#entry-date-input"),
  entryStatusInput: document.querySelector("#entry-status-input"),
  entryTitleInput: document.querySelector("#entry-title-input"),
  entryLocationInput: document.querySelector("#entry-location-input"),
  entryMoodInput: document.querySelector("#entry-mood-input"),
  entryExcerptInput: document.querySelector("#entry-excerpt-input"),
  entryTagsInput: document.querySelector("#entry-tags-input"),
  entryBodyInput: document.querySelector("#entry-body-input"),
  entryJournalInput: document.querySelector("#entry-journal-input"),
  entryPhotosInput: document.querySelector("#entry-photos-input"),
  editorGallery: document.querySelector("#editor-gallery"),
  clearEditorButton: document.querySelector("#clear-editor"),
  deleteEntryButton: document.querySelector("#delete-entry"),
  editorFeedback: document.querySelector("#editor-feedback"),
  adminEntryList: document.querySelector("#admin-entry-list"),
  passwordForm: document.querySelector("#password-form"),
  guestPasswordSetting: document.querySelector("#guest-password-setting"),
  markPasswordSetting: document.querySelector("#mark-password-setting"),
  passwordFeedback: document.querySelector("#password-feedback"),
  exportDataButton: document.querySelector("#export-data"),
  importDataInput: document.querySelector("#import-data"),
  markLoginModal: document.querySelector("#mark-login-modal"),
  markModalBackdrop: document.querySelector("#mark-modal-backdrop"),
  closeMarkModalButton: document.querySelector("#close-mark-modal"),
  markLoginForm: document.querySelector("#mark-login-form"),
  markPasswordInput: document.querySelector("#mark-password-input"),
  markLoginFeedback: document.querySelector("#mark-login-feedback"),
  lightbox: document.querySelector("#lightbox"),
  lightboxImage: document.querySelector("#lightbox-image"),
  closeLightboxButton: document.querySelector("#close-lightbox"),
};

let state = loadState();
let session = loadSession();
let ui = {
  currentView: session.adminUnlocked ? "admin" : session.guestUnlocked ? "guest" : "gate",
  selectedEntryId: null,
  activeTag: "all",
  searchQuery: "",
  editorImages: [],
};

seedEditorDate();
ensureSelectedEntry();
bindEvents();
render();

function bindEvents() {
  dom.guestLoginForm.addEventListener("submit", handleGuestLogin);
  dom.guestLogoutButton.addEventListener("click", lockArchive);
  dom.jumpLatestButton.addEventListener("click", openLatestEntry);
  dom.markLoginLaunch.addEventListener("click", handleMarkButtonClick);
  dom.markLoginForm.addEventListener("submit", handleMarkLogin);
  dom.markModalBackdrop.addEventListener("click", closeMarkModal);
  dom.closeMarkModalButton.addEventListener("click", closeMarkModal);

  dom.searchInput.addEventListener("input", (event) => {
    ui.searchQuery = event.target.value;
    renderGuestList();
  });

  dom.tagFilter.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tag]");
    if (!button) {
      return;
    }

    ui.activeTag = button.dataset.tag;
    renderGuestList();
  });

  dom.entryList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-entry-id]");
    if (!button) {
      return;
    }

    selectEntry(button.dataset.entryId);
  });

  dom.yearHeatmap.addEventListener("click", (event) => {
    const button = event.target.closest("[data-entry-id]");
    if (!button) {
      return;
    }

    selectEntry(button.dataset.entryId);
  });

  dom.entryGallery.addEventListener("click", (event) => {
    const button = event.target.closest("[data-image-src]");
    if (!button) {
      return;
    }

    openLightbox(button.dataset.imageSrc, button.dataset.imageAlt || "Blog image");
  });

  dom.adminNewEntry.addEventListener("click", () => {
    resetEditor("Fresh page ready.", "success");
  });

  dom.adminPreviewGuest.addEventListener("click", () => {
    setView("guest");
  });

  dom.adminLogout.addEventListener("click", () => {
    session = { guestUnlocked: false, adminUnlocked: false };
    saveSession();
    closeMarkModal();
    setView("gate");
    setFeedback(dom.markLoginFeedback, "");
    setFeedback(dom.guestLoginFeedback, "");
  });

  dom.entryForm.addEventListener("submit", handleEntrySave);
  dom.clearEditorButton.addEventListener("click", () => {
    resetEditor("Composer cleared.", "success");
  });

  dom.deleteEntryButton.addEventListener("click", handleDeleteEntry);
  dom.entryPhotosInput.addEventListener("change", handlePhotoUpload);

  dom.editorGallery.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-image]");
    if (!button) {
      return;
    }

    ui.editorImages.splice(Number(button.dataset.removeImage), 1);
    renderEditorGallery();
  });

  dom.adminEntryList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-admin-action]");
    if (!button) {
      return;
    }

    const entry = state.entries.find(({ id }) => id === button.dataset.entryId);
    if (!entry) {
      return;
    }

    if (button.dataset.adminAction === "edit") {
      populateEditor(entry);
      setFeedback(dom.editorFeedback, `Editing ${formatFullDate(entry.date)}.`, "success");
    }

    if (button.dataset.adminAction === "preview") {
      if (entry.status === "published" && entry.date.startsWith(`${APP_YEAR}-`)) {
        ui.selectedEntryId = entry.id;
        setView("guest");
      } else {
        setFeedback(
          dom.editorFeedback,
          "Preview only works for published 2026 entries because the guest archive is the 2026 view.",
          "error"
        );
      }
    }
  });

  dom.passwordForm.addEventListener("submit", handlePasswordSave);
  dom.exportDataButton.addEventListener("click", exportData);
  dom.importDataInput.addEventListener("change", importData);

  dom.closeLightboxButton.addEventListener("click", closeLightbox);
  dom.lightbox.addEventListener("click", (event) => {
    if (event.target === dom.lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMarkModal();
      closeLightbox();
    }
  });
}

function render() {
  ensureSelectedEntry();
  renderScreenState();
  renderCornerButton();
  renderGuest();
  renderAdmin();
}

function renderScreenState() {
  dom.gateView.hidden = ui.currentView !== "gate";
  dom.guestView.hidden = ui.currentView !== "guest";
  dom.adminView.hidden = ui.currentView !== "admin";
}

function renderCornerButton() {
  dom.markLoginLaunch.hidden = ui.currentView === "admin";
}

function renderGuest() {
  const entries = getGuestEntries();
  const photoCount = entries.reduce((total, entry) => total + entry.images.length, 0);

  dom.publishedCount.textContent = String(entries.length);
  dom.photoCount.textContent = String(photoCount);
  dom.streakCount.textContent = String(calculateCurrentStreak(entries));

  renderHeatmap(entries);
  renderGuestList();
  renderSpotlight();
}

function renderHeatmap(entries) {
  const entryByDate = new Map(entries.map((entry) => [entry.date, entry]));
  const formatter = new Intl.DateTimeFormat(undefined, { month: "short" });
  const rows = [];

  for (let month = 0; month < 12; month += 1) {
    const daysInMonth = new Date(APP_YEAR, month + 1, 0).getDate();
    const cells = [];

    for (let day = 1; day <= 31; day += 1) {
      if (day > daysInMonth) {
        cells.push('<span class="heatmap-cell filler" aria-hidden="true"></span>');
        continue;
      }

      const dateKey = createDateKey(APP_YEAR, month + 1, day);
      const entry = entryByDate.get(dateKey);
      const isSelected = entry && entry.id === ui.selectedEntryId;
      const label = entry
        ? `${formatFullDate(dateKey)} — ${entry.title}`
        : `${formatFullDate(dateKey)} — no entry published`;

      cells.push(`
        <button
          class="heatmap-cell${entry ? " has-entry" : ""}${isSelected ? " is-selected" : ""}"
          type="button"
          title="${escapeHtml(label)}"
          aria-label="${escapeHtml(label)}"
          ${entry ? `data-entry-id="${entry.id}"` : "disabled"}
        ></button>
      `);
    }

    rows.push(`
      <div class="heatmap-row">
        <span class="heatmap-month">${formatter.format(new Date(APP_YEAR, month, 1))}</span>
        ${cells.join("")}
      </div>
    `);
  }

  dom.yearHeatmap.innerHTML = rows.join("");
}

function renderGuestList() {
  const guestEntries = getGuestEntries();
  const availableTags = collectTags(guestEntries);

  if (ui.activeTag !== "all" && !availableTags.includes(ui.activeTag)) {
    ui.activeTag = "all";
  }

  dom.tagFilter.innerHTML = renderTagButtons(availableTags);
  dom.searchInput.value = ui.searchQuery;

  const filteredEntries = getFilteredGuestEntries();
  if (filteredEntries.length === 0) {
    dom.entryList.innerHTML = `
      <li class="empty-state">
        <h3>No matching days</h3>
        <p>Try another search or clear the current tag filter.</p>
      </li>
    `;
    return;
  }

  dom.entryList.innerHTML = filteredEntries
    .map((entry) => {
      const isSelected = entry.id === ui.selectedEntryId;
      const meta = compactMeta([
        entry.location,
        entry.mood,
        `${estimateReadingTime(entry.body)} min read`,
      ]);

      return `
        <li>
          <button
            class="entry-link${isSelected ? " is-selected" : ""}"
            type="button"
            data-entry-id="${entry.id}"
          >
            <span class="entry-link-date">${formatShortDate(entry.date)}</span>
            <strong>${escapeHtml(entry.title)}</strong>
            <span class="entry-link-meta">${escapeHtml(meta)}</span>
            <span class="entry-link-excerpt">${escapeHtml(getEntryExcerpt(entry))}</span>
          </button>
        </li>
      `;
    })
    .join("");
}

function renderSpotlight() {
  const entry = getGuestEntries().find(({ id }) => id === ui.selectedEntryId);

  if (!entry) {
    dom.spotlightEmpty.hidden = false;
    dom.entrySpotlight.hidden = true;
    return;
  }

  dom.spotlightEmpty.hidden = true;
  dom.entrySpotlight.hidden = false;

  dom.entryDate.textContent = formatFullDate(entry.date);
  dom.entryTitle.textContent = entry.title;
  dom.entryMeta.textContent = compactMeta([
    entry.location,
    entry.mood,
    `${estimateReadingTime(entry.body)} min read`,
    `${entry.images.length} photo${entry.images.length === 1 ? "" : "s"}`,
  ]);
  dom.entryExcerpt.textContent = getEntryExcerpt(entry);
  dom.entryTags.innerHTML = entry.tags.length
    ? entry.tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join("")
    : '<span class="tag-chip muted">No tags</span>';
  dom.entryGallery.innerHTML = entry.images.length
    ? entry.images
        .map(
          (image, index) => `
            <button
              class="gallery-card"
              type="button"
              data-image-src="${image}"
              data-image-alt="${escapeHtml(`${entry.title} photo ${index + 1}`)}"
            >
              <img src="${image}" alt="${escapeHtml(`${entry.title} photo ${index + 1}`)}" />
            </button>
          `
        )
        .join("")
    : `
        <div class="empty-gallery">
          <p>No photos were added for this day yet.</p>
        </div>
      `;
  dom.entryBody.innerHTML = renderRichText(entry.body);
  dom.entryJournal.innerHTML = renderRichText(entry.journal);
}

function renderAdmin() {
  const draftCount = state.entries.filter((entry) => entry.status === "draft").length;
  dom.adminEntryCount.textContent = String(state.entries.length);
  dom.adminDraftCount.textContent = String(draftCount);
  dom.guestPasswordSetting.value = state.guestPassword;
  dom.markPasswordSetting.value = state.markPassword;

  renderAdminLibrary();
  renderEditorGallery();
  updateEditorHeading();
}

function renderAdminLibrary() {
  if (state.entries.length === 0) {
    dom.adminEntryList.innerHTML = `
      <li class="empty-state">
        <h3>No entries yet</h3>
        <p>Create your first day in the composer and it will show up here.</p>
      </li>
    `;
    return;
  }

  dom.adminEntryList.innerHTML = state.entries
    .map((entry) => {
      const isEditing = entry.id === dom.entryIdInput.value;
      const statusLabel = entry.status === "published" ? "Published" : "Draft";
      const isPreviewable = entry.status === "published" && entry.date.startsWith(`${APP_YEAR}-`);
      const meta = compactMeta([
        entry.location,
        entry.mood,
        `${entry.images.length} photo${entry.images.length === 1 ? "" : "s"}`,
      ]);

      return `
        <li class="library-item${isEditing ? " is-editing" : ""}">
          <div class="library-copy">
            <p class="library-date">${formatFullDate(entry.date)}</p>
            <strong>${escapeHtml(entry.title)}</strong>
            <p class="library-meta">${escapeHtml(meta)}</p>
            <span class="status-pill ${entry.status}">${statusLabel}</span>
          </div>

          <div class="library-actions">
            <button
              class="secondary-button"
              type="button"
              data-admin-action="edit"
              data-entry-id="${entry.id}"
            >
              Edit
            </button>
            <button
              class="secondary-button"
              type="button"
              data-admin-action="preview"
              data-entry-id="${entry.id}"
              ${isPreviewable ? "" : "disabled"}
            >
              Preview
            </button>
          </div>
        </li>
      `;
    })
    .join("");
}

function renderEditorGallery() {
  if (ui.editorImages.length === 0) {
    dom.editorGallery.innerHTML = `
      <div class="editor-empty">
        <p>No photos loaded for this day yet.</p>
      </div>
    `;
    return;
  }

  dom.editorGallery.innerHTML = ui.editorImages
    .map(
      (image, index) => `
        <figure class="editor-image-card">
          <img src="${image}" alt="Uploaded photo ${index + 1}" />
          <button
            class="image-remove-button"
            type="button"
            data-remove-image="${index}"
            aria-label="Remove photo ${index + 1}"
          >
            Remove
          </button>
        </figure>
      `
    )
    .join("");
}

function handleGuestLogin(event) {
  event.preventDefault();
  const candidate = dom.guestPasswordInput.value.trim();

  if (candidate !== state.guestPassword) {
    setFeedback(dom.guestLoginFeedback, "That guest password does not match.", "error");
    return;
  }

  session.guestUnlocked = true;
  saveSession();
  dom.guestPasswordInput.value = "";
  setFeedback(dom.guestLoginFeedback, "");
  setView("guest");
}

function handleMarkLogin(event) {
  event.preventDefault();
  const candidate = dom.markPasswordInput.value.trim();

  if (candidate !== state.markPassword) {
    setFeedback(dom.markLoginFeedback, "That Mark password does not match.", "error");
    return;
  }

  session.adminUnlocked = true;
  session.guestUnlocked = true;
  saveSession();
  dom.markPasswordInput.value = "";
  setFeedback(dom.markLoginFeedback, "");
  closeMarkModal();
  setView("admin");
}

function handleMarkButtonClick() {
  if (session.adminUnlocked) {
    setView("admin");
    return;
  }

  openMarkModal();
}

function handleEntrySave(event) {
  event.preventDefault();

  const entryId = dom.entryIdInput.value || crypto.randomUUID();
  const date = dom.entryDateInput.value;
  const title = dom.entryTitleInput.value.trim();
  const location = dom.entryLocationInput.value.trim();
  const mood = dom.entryMoodInput.value.trim();
  const excerpt = dom.entryExcerptInput.value.trim();
  const body = dom.entryBodyInput.value.trim();
  const journal = dom.entryJournalInput.value.trim();
  const tags = parseTags(dom.entryTagsInput.value);
  const status = dom.entryStatusInput.value === "draft" ? "draft" : "published";

  if (!date || !title || !body || !journal) {
    setFeedback(dom.editorFeedback, "Date, title, blog post, and journal are required.", "error");
    return;
  }

  const duplicate = state.entries.find((entry) => entry.date === date && entry.id !== entryId);
  if (duplicate) {
    setFeedback(
      dom.editorFeedback,
      "There is already an entry for that date. Open it from the library to edit it instead.",
      "error"
    );
    return;
  }

  const nextEntry = normalizeEntry({
    id: entryId,
    date,
    title,
    location,
    mood,
    excerpt,
    body,
    journal,
    tags,
    images: ui.editorImages,
    status,
    updatedAt: new Date().toISOString(),
  });

  state.entries = sortEntries([
    ...state.entries.filter((entry) => entry.id !== entryId),
    nextEntry,
  ]);

  saveState();

  if (nextEntry.status === "published" && nextEntry.date.startsWith(`${APP_YEAR}-`)) {
    ui.selectedEntryId = nextEntry.id;
  } else {
    ensureSelectedEntry();
  }

  populateEditor(nextEntry);
  render();
  setFeedback(
    dom.editorFeedback,
    `${nextEntry.status === "published" ? "Published" : "Saved draft for"} ${formatFullDate(nextEntry.date)}.`,
    "success"
  );
}

function handleDeleteEntry() {
  const entryId = dom.entryIdInput.value;
  if (!entryId) {
    return;
  }

  const entry = state.entries.find((item) => item.id === entryId);
  if (!entry) {
    return;
  }

  const confirmed = window.confirm(`Delete "${entry.title}" from ${formatFullDate(entry.date)}?`);
  if (!confirmed) {
    return;
  }

  state.entries = state.entries.filter((item) => item.id !== entryId);
  saveState();

  if (ui.selectedEntryId === entryId) {
    ui.selectedEntryId = null;
  }

  resetEditor(`Deleted ${formatFullDate(entry.date)}.`, "success");
  render();
}

async function handlePhotoUpload(event) {
  const files = Array.from(event.target.files ?? []);
  if (files.length === 0) {
    return;
  }

  try {
    const images = await Promise.all(files.map(readFileAsDataUrl));
    ui.editorImages.push(...images);
    renderEditorGallery();
    setFeedback(dom.editorFeedback, `${files.length} photo${files.length === 1 ? "" : "s"} added.`, "success");
  } catch {
    setFeedback(dom.editorFeedback, "One of those photos could not be loaded.", "error");
  } finally {
    dom.entryPhotosInput.value = "";
  }
}

function handlePasswordSave(event) {
  event.preventDefault();
  const guestPassword = dom.guestPasswordSetting.value.trim();
  const markPassword = dom.markPasswordSetting.value.trim();

  if (!guestPassword || !markPassword) {
    setFeedback(dom.passwordFeedback, "Both passwords need a value.", "error");
    return;
  }

  state.guestPassword = guestPassword;
  state.markPassword = markPassword;
  saveState();
  setFeedback(dom.passwordFeedback, "Passwords updated for this archive.", "success");
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `frames-and-days-backup-${getTodayKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  setFeedback(dom.passwordFeedback, "Backup exported.", "success");
}

async function importData(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const imported = Array.isArray(parsed) ? { ...state, entries: parsed } : { ...state, ...parsed };
    state = normalizeState(imported);
    saveState();
    ensureSelectedEntry();
    resetEditor("Backup imported.", "success");
    render();
    setFeedback(dom.passwordFeedback, "Backup imported successfully.", "success");
  } catch {
    setFeedback(dom.passwordFeedback, "That file was not a valid backup.", "error");
  } finally {
    dom.importDataInput.value = "";
  }
}

function openLatestEntry() {
  const [latest] = getGuestEntries();
  if (!latest) {
    return;
  }

  selectEntry(latest.id);
}

function selectEntry(entryId) {
  ui.selectedEntryId = entryId;
  renderGuest();
  dom.entrySpotlight.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setView(view) {
  if (view === "admin" && !session.adminUnlocked) {
    openMarkModal();
    return;
  }

  if (view === "guest" && !session.guestUnlocked && !session.adminUnlocked) {
    ui.currentView = "gate";
  } else {
    ui.currentView = view;
  }

  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function lockArchive() {
  session.guestUnlocked = false;
  saveSession();
  setView("gate");
}

function openMarkModal() {
  dom.markLoginModal.hidden = false;
  requestAnimationFrame(() => {
    dom.markPasswordInput.focus();
  });
}

function closeMarkModal() {
  dom.markLoginModal.hidden = true;
}

function openLightbox(src, alt) {
  dom.lightbox.hidden = false;
  dom.lightboxImage.src = src;
  dom.lightboxImage.alt = alt;
}

function closeLightbox() {
  dom.lightbox.hidden = true;
  dom.lightboxImage.src = "";
  dom.lightboxImage.alt = "";
}

function resetEditor(message = "", tone = "success") {
  dom.entryForm.reset();
  dom.entryIdInput.value = "";
  dom.entryStatusInput.value = "published";
  dom.entryDateInput.value = getTodayKey();
  ui.editorImages = [];
  renderEditorGallery();
  updateEditorHeading();
  dom.deleteEntryButton.hidden = true;
  setFeedback(dom.editorFeedback, message, tone);
}

function populateEditor(entry) {
  dom.entryIdInput.value = entry.id;
  dom.entryDateInput.value = entry.date;
  dom.entryStatusInput.value = entry.status;
  dom.entryTitleInput.value = entry.title;
  dom.entryLocationInput.value = entry.location;
  dom.entryMoodInput.value = entry.mood;
  dom.entryExcerptInput.value = entry.excerpt;
  dom.entryTagsInput.value = entry.tags.join(", ");
  dom.entryBodyInput.value = entry.body;
  dom.entryJournalInput.value = entry.journal;
  ui.editorImages = [...entry.images];
  dom.deleteEntryButton.hidden = false;
  renderEditorGallery();
  updateEditorHeading();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateEditorHeading() {
  const entryId = dom.entryIdInput.value;
  if (!entryId) {
    dom.editorHeading.textContent = "New day";
    return;
  }

  const entry = state.entries.find((item) => item.id === entryId);
  dom.editorHeading.textContent = entry ? `Editing ${formatFullDate(entry.date)}` : "New day";
}

function ensureSelectedEntry() {
  const guestEntries = getGuestEntries();
  if (guestEntries.length === 0) {
    ui.selectedEntryId = null;
    return;
  }

  const current = guestEntries.some((entry) => entry.id === ui.selectedEntryId);
  if (!current) {
    ui.selectedEntryId = guestEntries[0].id;
  }
}

function getGuestEntries() {
  return state.entries.filter((entry) => entry.status === "published" && entry.date.startsWith(`${APP_YEAR}-`));
}

function getFilteredGuestEntries() {
  return getGuestEntries().filter((entry) => {
    if (ui.activeTag !== "all" && !entry.tags.includes(ui.activeTag)) {
      return false;
    }

    const query = ui.searchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    const haystack = [
      entry.title,
      entry.location,
      entry.mood,
      entry.excerpt,
      entry.body,
      entry.journal,
      entry.tags.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

function renderTagButtons(tags) {
  const items = ["all", ...tags];

  return items
    .map((tag) => {
      const isActive = tag === ui.activeTag;
      const label = tag === "all" ? "All" : tag;
      return `
        <button
          class="tag-button${isActive ? " active" : ""}"
          type="button"
          data-tag="${escapeHtml(tag)}"
        >
          ${escapeHtml(label)}
        </button>
      `;
    })
    .join("");
}

function collectTags(entries) {
  return [...new Set(entries.flatMap((entry) => entry.tags))].sort((left, right) =>
    left.localeCompare(right)
  );
}

function getEntryExcerpt(entry) {
  return entry.excerpt || `${entry.body.slice(0, 155).trim()}${entry.body.length > 155 ? "..." : ""}`;
}

function renderRichText(value) {
  const paragraphs = value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return "<p>Nothing written yet.</p>";
  }

  return paragraphs
    .map((block) => `<p>${escapeHtml(block).replaceAll("\n", "<br />")}</p>`)
    .join("");
}

function parseTags(value) {
  const seen = new Set();
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function compactMeta(parts) {
  return parts.filter(Boolean).join(" • ");
}

function calculateCurrentStreak(entries) {
  if (entries.length === 0) {
    return 0;
  }

  const uniqueDates = [...new Set(entries.map((entry) => entry.date))].sort();
  const latest = uniqueDates[uniqueDates.length - 1];
  const today = getTodayKey();
  const yesterday = shiftDayKey(today, -1);

  if (latest !== today && latest !== yesterday) {
    return 0;
  }

  let streak = 1;
  let cursor = latest;

  for (let index = uniqueDates.length - 2; index >= 0; index -= 1) {
    if (uniqueDates[index] === shiftDayKey(cursor, -1)) {
      streak += 1;
      cursor = uniqueDates[index];
      continue;
    }

    if (uniqueDates[index] !== cursor) {
      break;
    }
  }

  return streak;
}

function estimateReadingTime(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(new Error("Could not read file.")));
    reader.readAsDataURL(file);
  });
}

function seedEditorDate() {
  if (!dom.entryDateInput.value) {
    dom.entryDateInput.value = getTodayKey();
  }
}

function setFeedback(node, message, tone = "neutral") {
  node.textContent = message;
  node.dataset.tone = message ? tone : "";
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return normalizeState(parsed ?? DEFAULT_STATE);
  } catch {
    return normalizeState(DEFAULT_STATE);
  }
}

function normalizeState(raw) {
  const guestPassword = typeof raw?.guestPassword === "string" && raw.guestPassword.trim()
    ? raw.guestPassword.trim()
    : DEFAULT_STATE.guestPassword;
  const markPassword = typeof raw?.markPassword === "string" && raw.markPassword.trim()
    ? raw.markPassword.trim()
    : DEFAULT_STATE.markPassword;
  const entries = Array.isArray(raw?.entries) ? raw.entries.map(normalizeEntry) : [];

  return {
    guestPassword,
    markPassword,
    entries: sortEntries(entries),
  };
}

function normalizeEntry(raw) {
  return {
    id: typeof raw?.id === "string" && raw.id ? raw.id : crypto.randomUUID(),
    date: isDateKey(raw?.date) ? raw.date : getTodayKey(),
    title: cleanText(raw?.title, "Untitled day"),
    location: cleanText(raw?.location),
    mood: cleanText(raw?.mood),
    excerpt: cleanText(raw?.excerpt),
    body: cleanText(raw?.body),
    journal: cleanText(raw?.journal),
    tags: Array.isArray(raw?.tags)
      ? parseTags(raw.tags.join(","))
      : typeof raw?.tags === "string"
        ? parseTags(raw.tags)
        : [],
    images: Array.isArray(raw?.images)
      ? raw.images.filter((image) => typeof image === "string" && image)
      : [],
    status: raw?.status === "draft" ? "draft" : "published",
    updatedAt: typeof raw?.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
  };
}

function sortEntries(entries) {
  return [...entries].sort((left, right) => {
    if (left.date === right.date) {
      return right.updatedAt.localeCompare(left.updatedAt);
    }

    return right.date.localeCompare(left.date);
  });
}

function cleanText(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function loadSession() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null");
    return {
      guestUnlocked: Boolean(parsed?.guestUnlocked),
      adminUnlocked: Boolean(parsed?.adminUnlocked),
    };
  } catch {
    return {
      guestUnlocked: false,
      adminUnlocked: false,
    };
  }
}

function saveSession() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function getTodayKey() {
  return formatDateKey(new Date());
}

function shiftDayKey(dayKey, offset) {
  const date = new Date(`${dayKey}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return formatDateKey(date);
}

function createDateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDateKey(date) {
  return createDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function formatFullDate(dateKey) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateKey}T12:00:00`));
}

function formatShortDate(dateKey) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateKey}T12:00:00`));
}

function isDateKey(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
