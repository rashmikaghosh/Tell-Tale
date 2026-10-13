# Tell-Tale

Tell-Tale is a browser-based face tracking and chat page. MediaPipe runs in the browser. Chat requests go through a Cloudflare Pages Function so the Gemini API key stays on the server and is not included in the page source.

## Publish it

1. Connect this GitHub repository to a new Cloudflare Pages project.
2. Use the `main` branch, no build command, and `.` as the build output directory.
3. In the Cloudflare Pages project, open **Settings → Variables and Secrets** and add an encrypted secret named `GEMINI_API_KEY` with your Gemini API key.
4. Deploy or redeploy the site. Open the Cloudflare Pages URL and allow camera access.

The page calls `/api/chat`, which is handled by `functions/api/chat.js`. The function adds the server-side key and streams Gemini's response back to the page. The key must never be added to this repository or to `index.html`.

## Protect the shared API quota

The deployed page uses your Gemini key for all visitors, so their requests share the same quota. Before sharing the public URL broadly, configure a Cloudflare rate limit for `/api/chat` and monitor Gemini usage. The function checks the browser request origin and limits request size, but an origin check alone does not prevent direct scripted requests.

## Camera and privacy

The browser asks for camera permission. Face tracking runs locally in the browser; camera frames are not sent to Gemini. Text chat and emotion labels are sent through the Cloudflare Function to Gemini.
