import { ensureSchema, listAllEntries } from "../_lib/db.js";
import { error, json } from "../_lib/http.js";
import { hasAdminAccess, readSession } from "../_lib/security.js";

export async function GET(request) {
  const session = readSession(request);
  if (!hasAdminAccess(session)) {
    return error("Mark access is required for this action.", 401);
  }

  try {
    await ensureSchema();
    const entries = await listAllEntries();
    return json({
      exportedAt: new Date().toISOString(),
      version: 2,
      entries,
    });
  } catch (issue) {
    return error(issue.message || "Could not export the archive.", 500);
  }
}
