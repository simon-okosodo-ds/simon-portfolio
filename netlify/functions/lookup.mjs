// netlify/functions/lookup.mjs
// Renamed from .js to .mjs to FORCE this file to be parsed as an ES module,
// regardless of whether a package.json with "type": "module" exists in the repo.
// This site has no build step / no package.json, so this explicit signal matters.
//
// Also dropped the custom /api/lookup path config -- using Netlify's guaranteed
// default function URL instead, since the custom-path feature has real,
// documented reliability issues. Reachable at:
//   /.netlify/functions/lookup?content_id=...
//
// CORS: this function is now called cross-origin, from the portfolio's
// GitHub Pages address (simon-okosodo-ds.github.io) instead of a same-domain
// Netlify page. Without an Access-Control-Allow-Origin header, the browser
// discards the response even when the function itself succeeds (200 OK) --
// that's exactly what showed up in the browser console.
import { readFileSync } from "node:fs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://simon-okosodo-ds.github.io",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

let queueData;
try {
  const raw = readFileSync(new URL("./queue-data.json", import.meta.url));
  queueData = JSON.parse(raw);
} catch (err) {
  console.error("FAILED TO LOAD queue-data.json:", err.message);
  queueData = null;
}

export default async (req) => {
  // Preflight safety net -- simple GET requests like this one usually don't
  // trigger a browser preflight, but handling OPTIONS costs nothing and
  // protects against edge cases (e.g. future added headers).
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (!queueData) {
    return new Response(
      JSON.stringify({ error: "Server data failed to load. Check function logs." }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }
  const url = new URL(req.url);
  const contentId = url.searchParams.get("content_id")?.trim();
  if (!contentId) {
    return new Response(
      JSON.stringify({ error: "Please provide a content_id." }),
      { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }
  const match = queueData[contentId];
  if (!match) {
    return new Response(
      JSON.stringify({
        found: false,
        message: `No match for "${contentId}". Try one of the real sample IDs below the form.`,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }
  return new Response(
    JSON.stringify({
      found: true,
      content_id: contentId,
      client_id: match.client_id,
      score: match.score,
      reason_code: match.reason_code,
      action_label: match.action_label,
    }),
    { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
  );
};
