import { ensureSchema, getSettings } from "../_lib/db.js";
import { error, json, readJson } from "../_lib/http.js";
import { createSessionCookie, verifyPassword } from "../_lib/security.js";

export async function POST(request) {
  try {
    await ensureSchema();
    const body = await readJson(request);
    const password = typeof body?.password === "string" ? body.password.trim() : "";
    if (!password) {
      return error("Enter the guest password to continue.", 400);
    }

    const settings = await getSettings();
    if (!verifyPassword(password, settings.guest_password_hash)) {
      return error("That guest password does not match.", 401);
    }

    return json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": createSessionCookie("guest"),
        },
      }
    );
  } catch (issue) {
    return error(issue.message || "Could not process the guest login.", 500);
  }
}
