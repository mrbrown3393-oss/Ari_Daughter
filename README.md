# ARIA

A mobile-first AI companion PWA powered by Grok, with a server-side Moth Atlas quantum experiment integration.

## Stack
- React + Vite mobile web app
- Express API on Node 20+
- Grok Responses API called only from the server
- Moth Atlas quantum experiment API called only from the server
- Render deployment

## Local development
1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and add your xAI and Moth API keys locally.
4. Run `npm run dev` for the Vite interface.
5. In a second terminal, run `npm start` for the API (or build and run production).

## Render
Deploy this repository as a Node web service. Build: `npm install && npm run build`. Start: `npm start`. Add `XAI_API_KEY` and `MOTH_API_KEY` as secret environment variables in Render. Optionally set `GROK_MODEL` (defaults to `grok-4.7`). Do not commit real credentials.

## Security baseline
- Provider API keys remain server-side.
- Grok uses the xAI Responses API with request storage disabled.
- Request body validation and bounded message history.
- Per-IP chat and quantum rate limits.
- Helmet security headers and same-origin-by-default CORS.
- No conversation persistence is enabled by the app.
