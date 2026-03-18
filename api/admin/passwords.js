import { ensureSchema, updateSettings } from "../_lib/db.js";
import { error, json, readJson } from "../_lib/http.js";
import { hashPassword, hasAdminAccess, readSession } from "../_lib/security.js";

export async function POST(request) {
  const session = readSession(request);
  if (!hasAdminAccess(session)) {
    return error("Mark access is required for this action.", 401);
  }

  try {
    await ensureSchema();
    const body = await readJson(request);
    const guestPassword = typeof body?.guestPassword === "string" ? body.guestPassword.trim() : "";
    const markPassword = typeof body?.markPassword === "string" ? body.markPassword.trim() : "";

    if (!guestPassword || !markPassword) {
      return error("Enter both passwords before saving.", 400);
    }

    await updateSettings({
      guestPasswordHash: hashPassword(guestPassword),
      markPasswordHash: hashPassword(markPassword),
    });

    return json({ ok: true });
  } catch (issue) {
    return error(issue.message || "Could not update the passwords.", 500);
  }
}
