# ARIA

A mobile-first AI companion PWA with a server-side Gemini integration.

## Stack
- React + Vite mobile web app
- Express API on Node 20+
- Gemini API called only from the server
- Render deployment blueprint included

## Local development
1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and add a Gemini API key locally.
4. Run `npm run dev` for the Vite interface.
5. In a second terminal, run `npm start` for the API (or build and run production).

## Render
Deploy this repository as a Node web service. Build: `npm install && npm run build`. Start: `npm start`. Add `GEMINI_API_KEY` as a secret environment variable in Render. Do not commit real credentials.

## Security baseline
- API key remains server-side.
- Request body validation and bounded message history.
- Per-IP chat rate limit.
- Helmet security headers and same-origin-by-default CORS.
- No conversation persistence is enabled in this starter.
