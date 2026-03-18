import crypto from "node:crypto";

const SESSION_COOKIE = "frames_days_session";
const GUEST_MAX_AGE = 60 * 60 * 24 * 30;
const ADMIN_MAX_AGE = 60 * 60 * 12;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const digest = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${digest}`;
}

export function verifyPassword(password, storedHash) {
  if (typeof storedHash !== "string" || !storedHash.includes(":")) {
    return false;
  }

  const [salt, expectedDigest] = storedHash.split(":");
  const actualDigest = crypto.scryptSync(password, salt, 64).toString("hex");
  return safeCompare(actualDigest, expectedDigest);
}

export function readSession(request) {
  const cookieHeader = typeof request.headers?.get === "function"
    ? request.headers.get("cookie")
    : request.headers?.cookie;
  const cookies = parseCookies(cookieHeader ?? "");
  const token = cookies[SESSION_COOKIE];

  if (!token || !token.includes(".")) {
    return null;
  }

  const [payloadPart, signaturePart] = token.split(".");
  const expectedSignature = sign(payloadPart);
  if (!safeCompare(signaturePart, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
    if (!payload?.role || typeof payload.exp !== "number" || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function hasGuestAccess(session) {
  return session?.role === "guest" || session?.role === "admin";
}

export function hasAdminAccess(session) {
  return session?.role === "admin";
}

export function createSessionCookie(role) {
  const maxAge = role === "admin" ? ADMIN_MAX_AGE : GUEST_MAX_AGE;
  const payload = {
    role,
    exp: Date.now() + maxAge * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encodedPayload);

  return serializeCookie(SESSION_COOKIE, `${encodedPayload}.${signature}`, {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "Strict",
    secure: true,
  });
}

export function clearSessionCookie() {
  return serializeCookie(SESSION_COOKIE, "", {
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "Strict",
    secure: true,
  });
}

function sign(value) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }

  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function parseCookies(cookieHeader = "") {
  return String(cookieHeader || "")
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((cookies, chunk) => {
      const separatorIndex = chunk.indexOf("=");
      if (separatorIndex === -1) {
        return cookies;
      }

      const name = chunk.slice(0, separatorIndex).trim();
      const value = chunk.slice(separatorIndex + 1).trim();
      cookies[name] = decodeURIComponent(value);
      return cookies;
    }, {});
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  if (options.expires) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }

  if (options.httpOnly) {
    parts.push("HttpOnly");
  }

  if (options.path) {
    parts.push(`Path=${options.path}`);
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  if (options.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
