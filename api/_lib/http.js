export function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(data, { ...init, headers });
}

export function error(message, status = 400, extra = {}) {
  return json({ error: message, ...extra }, { status });
}

export function httpError(message, status = 400) {
  const issue = new Error(message);
  issue.status = status;
  return issue;
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw httpError("The request body was not valid JSON.", 400);
  }
}
