const APP_YEAR = 2026;

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

let state = {
  entries: [],
  publicEntries: [],
};

let session = {
  adminUnlocked: false,
  guestUnlocked: false,
};

let ui = {
  currentView: "gate",
  selectedEntryId: null,
  activeTag: "all",
  searchQuery: "",
  editorImages: [],
};

bindEvents();
seedEditorDate();
render();
boot();

function bindEvents() {
  dom.guestLoginForm.addEventListener("submit", handleGuestLogin);
  dom.guestLogoutButton.addEventListener("click", handleLogout);
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

  dom.adminLogout.addEventListener("click", handleLogout);
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

async function boot() {
  try {
    await refreshSessionAndData();
  } catch (issue) {
    setFeedback(
      dom.guestLoginFeedback,
      issue.message || "The backend is not reachable yet. Finish the Vercel setup and redeploy.",
      "error"
    );
    render();
  }
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
        ? `${formatFullDate(dateKey)} - ${entry.title}`
        : `${formatFullDate(dateKey)} - no entry published`;

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

async function handleGuestLogin(event) {
  event.preventDefault();

  try {
    await apiFetch("/api/auth/guest-login", {
      method: "POST",
      body: JSON.stringify({
        password: dom.guestPasswordInput.value.trim(),
      }),
    });

    dom.guestPasswordInput.value = "";
    setFeedback(dom.guestLoginFeedback, "");
    await refreshSessionAndData();
    setView("guest");
  } catch (issue) {
    setFeedback(dom.guestLoginFeedback, issue.message, "error");
  }
}

async function handleMarkLogin(event) {
  event.preventDefault();

  try {
    await apiFetch("/api/auth/mark-login", {
      method: "POST",
      body: JSON.stringify({
        password: dom.markPasswordInput.value.trim(),
      }),
    });

    dom.markPasswordInput.value = "";
    setFeedback(dom.markLoginFeedback, "");
    closeMarkModal();
    await refreshSessionAndData();
    setView("admin");
  } catch (issue) {
    setFeedback(dom.markLoginFeedback, issue.message, "error");
  }
}

function handleMarkButtonClick() {
  if (session.adminUnlocked) {
    setView("admin");
    return;
  }

  openMarkModal();
}

async function handleEntrySave(event) {
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

  try {
    const response = await apiFetch("/api/admin/entries", {
      method: "POST",
      body: JSON.stringify({
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
      }),
    });

    const nextEntry = normalizeEntry(response.entry);
    upsertEntry(nextEntry);

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
  } catch (issue) {
    setFeedback(dom.editorFeedback, issue.message, "error");
  }
}

async function handleDeleteEntry() {
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

  try {
    await apiFetch(`/api/admin/entries?id=${encodeURIComponent(entryId)}`, {
      method: "DELETE",
    });

    state.entries = state.entries.filter((item) => item.id !== entryId);
    state.publicEntries = state.publicEntries.filter((item) => item.id !== entryId);

    if (ui.selectedEntryId === entryId) {
      ui.selectedEntryId = null;
    }

    resetEditor(`Deleted ${formatFullDate(entry.date)}.`, "success");
    render();
  } catch (issue) {
    setFeedback(dom.editorFeedback, issue.message, "error");
  }
}

async function handlePhotoUpload(event) {
  const files = Array.from(event.target.files ?? []);
  if (files.length === 0) {
    return;
  }

  setFeedback(dom.editorFeedback, "Uploading photos...", "success");

  try {
    const uploadedUrls = [];

    for (const file of files) {
      const optimized = await optimizeImage(file);
      const uploaded = await uploadImage(optimized);
      uploadedUrls.push(uploaded.url);
    }

    ui.editorImages.push(...uploadedUrls);
    renderEditorGallery();
    setFeedback(
      dom.editorFeedback,
      `${uploadedUrls.length} photo${uploadedUrls.length === 1 ? "" : "s"} uploaded.`,
      "success"
    );
  } catch (issue) {
    setFeedback(dom.editorFeedback, issue.message || "One of the photos could not be uploaded.", "error");
  } finally {
    dom.entryPhotosInput.value = "";
  }
}

async function handlePasswordSave(event) {
  event.preventDefault();

  const guestPassword = dom.guestPasswordSetting.value.trim();
  const markPassword = dom.markPasswordSetting.value.trim();

  if (!guestPassword || !markPassword) {
    setFeedback(dom.passwordFeedback, "Enter both passwords before saving.", "error");
    return;
  }

  try {
    await apiFetch("/api/admin/passwords", {
      method: "POST",
      body: JSON.stringify({
        guestPassword,
        markPassword,
      }),
    });

    dom.guestPasswordSetting.value = "";
    dom.markPasswordSetting.value = "";
    setFeedback(dom.passwordFeedback, "Passwords updated for this archive.", "success");
  } catch (issue) {
    setFeedback(dom.passwordFeedback, issue.message, "error");
  }
}

async function exportData() {
  try {
    const payload = await apiFetch("/api/admin/export");
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `frames-and-days-backup-${getTodayKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setFeedback(dom.passwordFeedback, "Backup exported.", "success");
  } catch (issue) {
    setFeedback(dom.passwordFeedback, issue.message, "error");
  }
}

async function importData(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    await apiFetch("/api/admin/import", {
      method: "POST",
      body: JSON.stringify(parsed),
    });

    await refreshSessionAndData();
    resetEditor("Backup imported.", "success");
    setFeedback(dom.passwordFeedback, "Backup imported successfully.", "success");
  } catch (issue) {
    setFeedback(dom.passwordFeedback, issue.message || "That file was not a valid backup.", "error");
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

async function handleLogout() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Even if logout response fails, reset the local UI below.
  }

  closeMarkModal();
  setFeedback(dom.guestLoginFeedback, "");
  setFeedback(dom.markLoginFeedback, "");
  await refreshSessionAndData();
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
  return state.publicEntries.filter((entry) => entry.date.startsWith(`${APP_YEAR}-`));
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

async function refreshSessionAndData() {
  const nextSession = await apiFetch("/api/session");
  session = {
    adminUnlocked: Boolean(nextSession?.adminUnlocked),
    guestUnlocked: Boolean(nextSession?.guestUnlocked),
  };

  if (session.guestUnlocked || session.adminUnlocked) {
    const guestPromise = apiFetch(`/api/entries?year=${APP_YEAR}`);

    if (session.adminUnlocked) {
      const [guestPayload, adminPayload] = await Promise.all([
        guestPromise,
        apiFetch("/api/admin/entries"),
      ]);

      state.publicEntries = sortEntries((guestPayload.entries ?? []).map(normalizeEntry));
      state.entries = sortEntries((adminPayload.entries ?? []).map(normalizeEntry));
    } else {
      const guestPayload = await guestPromise;
      state.publicEntries = sortEntries((guestPayload.entries ?? []).map(normalizeEntry));
      state.entries = [];
    }
  } else {
    state.publicEntries = [];
    state.entries = [];
  }

  syncViewToSession();
  ensureSelectedEntry();
  render();
}

function syncViewToSession() {
  if (session.adminUnlocked) {
    if (ui.currentView === "gate") {
      ui.currentView = "admin";
    }
    return;
  }

  if (session.guestUnlocked) {
    if (ui.currentView === "gate" || ui.currentView === "admin") {
      ui.currentView = "guest";
    }
    return;
  }

  ui.currentView = "gate";
}

function upsertEntry(entry) {
  state.entries = sortEntries([...state.entries.filter((item) => item.id !== entry.id), entry]);

  if (entry.status === "published" && entry.date.startsWith(`${APP_YEAR}-`)) {
    state.publicEntries = sortEntries([
      ...state.publicEntries.filter((item) => item.id !== entry.id),
      entry,
    ]);
  } else {
    state.publicEntries = state.publicEntries.filter((item) => item.id !== entry.id);
  }
}

async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("date", dom.entryDateInput.value || getTodayKey());

  return apiFetch("/api/upload", {
    method: "POST",
    body: formData,
  });
}

async function optimizeImage(file) {
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    throw new Error("Only image files can be uploaded.");
  }

  if (!("createImageBitmap" in window) || file.type === "image/gif") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const maxDimension = 2200;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));

  if (scale === 1 && file.size <= 3_800_000) {
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, outputType, 0.82);
  });

  if (!blob) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  const extension = outputType === "image/png" ? "png" : "jpg";
  return new File([blob], `${baseName}.${extension}`, { type: outputType });
}

async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const config = {
    ...options,
    credentials: "same-origin",
    headers,
  };

  if (config.body && !(config.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, config);
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(payload?.error || payload || `Request failed with status ${response.status}.`);
  }

  return payload;
}

function seedEditorDate() {
  if (!dom.entryDateInput.value) {
    dom.entryDateInput.value = getTodayKey();
  }
}

function normalizeEntry(entry) {
  return {
    id: String(entry.id),
    date: String(entry.date).slice(0, 10),
    status: entry.status === "draft" ? "draft" : "published",
    title: cleanText(entry.title, "Untitled day"),
    location: cleanText(entry.location),
    mood: cleanText(entry.mood),
    excerpt: cleanText(entry.excerpt),
    body: cleanText(entry.body),
    journal: cleanText(entry.journal),
    tags: Array.isArray(entry.tags) ? entry.tags.filter(Boolean) : [],
    images: Array.isArray(entry.images) ? entry.images.filter(Boolean) : [],
    updatedAt: cleanText(entry.updatedAt, new Date().toISOString()),
  };
}

function cleanText(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function sortEntries(entries) {
  return [...entries].sort((left, right) => {
    if (left.date === right.date) {
      return right.updatedAt.localeCompare(left.updatedAt);
    }

    return right.date.localeCompare(left.date);
  });
}

function setFeedback(node, message, tone = "neutral") {
  node.textContent = message;
  node.dataset.tone = message ? tone : "";
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
