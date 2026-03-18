import { del } from "@vercel/blob";

import { deleteEntry, ensureSchema, listAllEntries, saveEntry } from "../_lib/db.js";
import { normalizeEntryPayload } from "../_lib/entries.js";
import { error, json, readJson } from "../_lib/http.js";
import { hasAdminAccess, readSession } from "../_lib/security.js";

async function authorize(request) {
  const session = readSession(request);
  if (!hasAdminAccess(session)) {
    return error("Mark access is required for this action.", 401);
  }
  return null;
}

export async function GET(request) {
  const authError = await authorize(request);
  if (authError) {
    return authError;
  }

  try {
    await ensureSchema();
    const entries = await listAllEntries();
    return json({ entries });
  } catch (issue) {
    return error(issue.message || "Could not load entries.", issue.status || 500);
  }
}

export async function POST(request) {
  const authError = await authorize(request);
  if (authError) {
    return authError;
  }

  try {
    await ensureSchema();
    const payload = await readJson(request);
    const entry = normalizeEntryPayload(payload);
    const result = await saveEntry(entry);
    await deleteRemovedBlobs(result.previousImages, result.entry.images);
    return json({ entry: result.entry });
  } catch (issue) {
    return error(issue.message || "Could not update entries.", issue.status || 500);
  }
}

export async function DELETE(request) {
  const authError = await authorize(request);
  if (authError) {
    return authError;
  }

  try {
    await ensureSchema();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return error("Choose an entry to delete.", 400);
    }

    const result = await deleteEntry(id);
    if (!result.deleted) {
      return error("That entry no longer exists.", 404);
    }

    await deleteBlobs(result.images);
    return json({ ok: true });
  } catch (issue) {
    return error(issue.message || "Could not update entries.", issue.status || 500);
  }
}

async function deleteRemovedBlobs(previousImages, nextImages) {
  const nextImageSet = new Set(nextImages);
  const removed = previousImages.filter((image) => !nextImageSet.has(image));
  await deleteBlobs(removed);
}

async function deleteBlobs(urls) {
  if (!Array.isArray(urls) || urls.length === 0) {
    return;
  }

  try {
    await del(urls);
  } catch {
    // Leaving an orphaned blob is safer than failing the content save.
  }
}
