import { del } from "@vercel/blob";

import { ensureSchema, listAllEntries, replaceAllEntries } from "../_lib/db.js";
import { normalizeImportEntries } from "../_lib/entries.js";
import { error, json, readJson } from "../_lib/http.js";
import { hasAdminAccess, readSession } from "../_lib/security.js";

export async function POST(request) {
  const session = readSession(request);
  if (!hasAdminAccess(session)) {
    return error("Mark access is required for this action.", 401);
  }

  try {
    await ensureSchema();
    const existingEntries = await listAllEntries();
    const payload = await readJson(request);
    const entries = normalizeImportEntries(Array.isArray(payload) ? payload : payload?.entries);

    await replaceAllEntries(entries);

    const nextUrls = new Set(entries.flatMap((entry) => entry.images));
    const removedUrls = existingEntries
      .flatMap((entry) => entry.images)
      .filter((url) => !nextUrls.has(url));

    if (removedUrls.length > 0) {
      try {
        await del(removedUrls);
      } catch {
        // The content import is still valid even if old blobs remain behind.
      }
    }

    return json({ ok: true, count: entries.length });
  } catch (issue) {
    return error(issue.message || "Could not import the backup.", issue.status || 500);
  }
}
