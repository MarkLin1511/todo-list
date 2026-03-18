import { json } from "../_lib/http.js";
import { clearSessionCookie } from "../_lib/security.js";

export async function POST() {
  return json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": clearSessionCookie(),
      },
    }
  );
}
