import crypto from "node:crypto";

import { BlobNotFoundError, head, put } from "@vercel/blob";

import { httpError } from "./http.js";
import { hashPassword } from "./security.js";

const STATE_PATH = "__internal/archive-state.json";
let stateCache = null;

export async function ensureSchema() {
  if (!stateCache) {
    stateCache = await loadState();
  }
}

export async function getSettings() {
  await ensureSchema();
  return clone(stateCache.settings);
}

export async function updateSettings(passwordHashes) {
  await ensureSchema();
  const nextState = clone(stateCache);
  nextState.settings = {
    guest_password_hash: passwordHashes.guestPasswordHash,
    mark_password_hash: passwordHashes.markPasswordHash,
    updated_at: new Date().toISOString(),
  };
  await saveState(nextState);
}

export async function listPublicEntries(year) {
  await ensureSchema();
  return sortEntries(stateCache.entries).filter(
    (entry) => entry.status === "published" && entry.date.startsWith(`${year}-`)
  );
}

export async function listAllEntries() {
  await ensureSchema();
  return sortEntries(stateCache.entries);
}

export async function saveEntry(entry) {
  await ensureSchema();
  const duplicate = stateCache.entries.find((item) => item.date === entry.date && item.id !== entry.id);
  if (duplicate) {
    throw httpError("There is already an entry for that date.", 409);
  }

  const nextState = clone(stateCache);
  const existing = nextState.entries.find((item) => item.id === entry.id);
  const nextEntry = normalizeEntry({
    ...entry,
    updatedAt: new Date().toISOString(),
  });

  nextState.entries = sortEntries([
    ...nextState.entries.filter((item) => item.id !== entry.id),
    nextEntry,
  ]);

  await saveState(nextState);

  return {
    entry: nextEntry,
    previousImages: Array.isArray(existing?.images) ? existing.images : [],
  };
}

export async function deleteEntry(id) {
  await ensureSchema();
  const existing = stateCache.entries.find((entry) => entry.id === id);
  if (!existing) {
    return {
      deleted: false,
      images: [],
    };
  }

  const nextState = clone(stateCache);
  nextState.entries = nextState.entries.filter((entry) => entry.id !== id);
  await saveState(nextState);

  return {
    deleted: true,
    images: Array.isArray(existing.images) ? existing.images : [],
  };
}

export async function replaceAllEntries(entries) {
  await ensureSchema();
  const nextState = clone(stateCache);
  nextState.entries = sortEntries(entries.map(normalizeEntry));
  await saveState(nextState);
}

async function loadState() {
  try {
    const blob = await head(STATE_PATH);
    const response = await fetch(blob.url, { cache: "no-store" });
    const encrypted = await response.text();
    return normalizeState(decryptState(encrypted));
  } catch (issue) {
    if (!(issue instanceof BlobNotFoundError)) {
      throw issue;
    }

    const defaultState = createDefaultState();
    await persistState(defaultState);
    return defaultState;
  }
}

async function saveState(nextState) {
  const normalized = normalizeState(nextState);
  await persistState(normalized);
  stateCache = normalized;
}

async function persistState(nextState) {
  const payload = encryptState(nextState);
  await put(STATE_PATH, payload, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

function createDefaultState() {
  const guestPassword = process.env.DEFAULT_GUEST_PASSWORD || "bowling";
  const markPassword = process.env.DEFAULT_MARK_PASSWORD || "strike";

  return {
    settings: {
      guest_password_hash: hashPassword(guestPassword),
      mark_password_hash: hashPassword(markPassword),
      updated_at: new Date().toISOString(),
    },
    entries: [],
  };
}

function normalizeState(raw) {
  return {
    settings: {
      guest_password_hash: String(raw?.settings?.guest_password_hash || hashPassword("bowling")),
      mark_password_hash: String(raw?.settings?.mark_password_hash || hashPassword("strike")),
      updated_at: String(raw?.settings?.updated_at || new Date().toISOString()),
    },
    entries: Array.isArray(raw?.entries) ? raw.entries.map(normalizeEntry) : [],
  };
}

function normalizeEntry(entry) {
  return {
    id: String(entry.id),
    date: String(entry.date).slice(0, 10),
    status: entry.status === "draft" ? "draft" : "published",
    title: String(entry.title || "").trim(),
    location: String(entry.location || "").trim(),
    mood: String(entry.mood || "").trim(),
    excerpt: String(entry.excerpt || "").trim(),
    body: String(entry.body || "").trim(),
    journal: String(entry.journal || "").trim(),
    tags: normalizeArray(entry.tags),
    images: normalizeArray(entry.images),
    updatedAt: String(entry.updatedAt || new Date().toISOString()),
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

function encryptState(state) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(state), "utf8"), cipher.final()]);

  return JSON.stringify({
    data: encrypted.toString("base64url"),
    iv: iv.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    version: 1,
  });
}

function decryptState(serialized) {
  const payload = JSON.parse(serialized);
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(payload.iv, "base64url")
  );
  decipher.setAuthTag(Buffer.from(payload.tag, "base64url"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.data, "base64url")),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}

function getEncryptionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
