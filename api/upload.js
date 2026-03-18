import { put } from "@vercel/blob";

import { sanitizeFileName } from "./_lib/entries.js";
import { error, json } from "./_lib/http.js";
import { hasAdminAccess, readSession } from "./_lib/security.js";

export async function POST(request) {
  const session = readSession(request);
  if (!hasAdminAccess(session)) {
    return error("Mark access is required for photo uploads.", 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image");
    const date = typeof formData.get("date") === "string" ? formData.get("date") : "undated";

    if (!(file instanceof File)) {
      return error("Select a photo before uploading.", 400);
    }

    const pathname = `entries/${date}/${sanitizeFileName(file.name)}`;
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type || undefined,
      multipart: true,
    });

    return json({
      pathname: blob.pathname,
      url: blob.url,
    });
  } catch (issue) {
    return error(issue.message || "Could not upload that photo.", 500);
  }
}
