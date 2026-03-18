import { ensureSchema, listPublicEntries } from "./_lib/db.js";
import { error, json } from "./_lib/http.js";
import { hasGuestAccess, readSession } from "./_lib/security.js";

export async function GET(request) {
  const session = readSession(request);
  if (!hasGuestAccess(session)) {
    return error("Enter the guest password first.", 401);
  }

  try {
    await ensureSchema();
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get("year") || "2026");
    const entries = await listPublicEntries(Number.isFinite(year) ? year : 2026);
    return json({ entries });
  } catch (issue) {
    return error(issue.message || "Could not load published entries.", 500);
  }
}
