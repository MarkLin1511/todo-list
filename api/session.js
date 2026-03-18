import { json } from "./_lib/http.js";
import { hasAdminAccess, hasGuestAccess, readSession } from "./_lib/security.js";

export async function GET(request) {
  const session = readSession(request);

  return json({
    adminUnlocked: hasAdminAccess(session),
    guestUnlocked: hasGuestAccess(session),
  });
}
