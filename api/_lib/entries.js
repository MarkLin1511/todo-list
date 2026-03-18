import crypto from "node:crypto";

import { httpError } from "./http.js";

export function normalizeEntryPayload(payload) {
  const date = cleanText(payload?.date);
  const title = cleanText(payload?.title);
  const body = cleanText(payload?.body);
  const journal = cleanText(payload?.journal);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw httpError("Entries need a valid date in YYYY-MM-DD format.", 400);
  }

  if (!title || !body || !journal) {
    throw httpError("Date, title, blog post, and journal are required.", 400);
  }

  return {
    id: typeof payload?.id === "string" && payload.id ? payload.id : crypto.randomUUID(),
    date,
    title,
    location: cleanText(payload?.location),
    mood: cleanText(payload?.mood),
    excerpt: cleanText(payload?.excerpt),
    body,
    journal,
    tags: normalizeTags(payload?.tags),
    images: normalizeImages(payload?.images),
    status: payload?.status === "draft" ? "draft" : "published",
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeImportEntries(entries) {
  if (!Array.isArray(entries)) {
    throw httpError("The backup file did not include an entries array.", 400);
  }

  return entries.map(normalizeEntryPayload);
}

export function sanitizeFileName(name) {
  const cleaned = cleanText(name, "photo.jpg")
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "photo.jpg";
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return dedupeStrings(value);
  }

  if (typeof value === "string") {
    return dedupeStrings(value.split(","));
  }

  return [];
}

function normalizeImages(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry) => typeof entry === "string" && entry);
}

function dedupeStrings(values) {
  const seen = new Set();

  return values
    .map((entry) => cleanText(entry))
    .filter(Boolean)
    .filter((entry) => {
      const key = entry.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function cleanText(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}
