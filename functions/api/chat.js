// Cloudflare Pages Function: keeps the Gemini API key on the server side.
// The browser calls this same-origin endpoint; it never receives the key.
export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) {
    return jsonError("The Gemini API key is not configured on the server.", 500);
  }

  // Only accept requests coming from this deployed site. This is an origin
  // check for browsers, not a substitute for rate limiting the public endpoint.
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) {
    return jsonError("This site is not allowed to use the chat endpoint.", 403);
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return jsonError("Expected a JSON request.", 415);
  }

  let bodyText;
  try {
    bodyText = await request.text();
  } catch {
    return jsonError("Could not read the request.", 400);
  }

  // Keep requests small so this endpoint cannot be used to forward large uploads.
  if (new TextEncoder().encode(bodyText).byteLength > 100_000) {
    return jsonError("The chat request is too large.", 413);
  }

  let payload;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return jsonError("The request body is not valid JSON.", 400);
  }

  if (!payload || !Array.isArray(payload.contents) || !payload.systemInstruction) {
    return jsonError("The chat request is missing required fields.", 400);
  }

  try {
    const upstream = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:streamGenerateContent?alt=sse",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY
        },
        body: JSON.stringify(payload)
      }
    );

    // Forward Gemini's stream directly so replies can appear as they arrive.
    const headers = new Headers();
    headers.set("Content-Type", upstream.headers.get("Content-Type") || "application/json");
    headers.set("Cache-Control", "no-store");
    return new Response(upstream.body, {
      status: upstream.status,
      headers
    });
  } catch {
    return jsonError("Could not connect to Gemini. Please try again.", 502);
  }
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
