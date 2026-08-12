// netlify/functions/lookup.js
// More robust version: reads the JSON file manually with fs.readFileSync instead
// of relying on newer "import ... with { type: 'json' }" syntax, which requires a
// fairly recent Node version and may not be supported by Netlify's default runtime.
// This approach works on essentially any Node version Netlify uses.

import { readFileSync } from "node:fs";

let queueData;
try {
  const raw = readFileSync(new URL("./queue-data.json", import.meta.url));
  queueData = JSON.parse(raw);
} catch (err) {
  // If the data file itself fails to load, we want a clear, specific error in
  // the logs -- not a silent crash that just looks like "something broke."
  console.error("FAILED TO LOAD queue-data.json:", err.message);
  queueData = null;
}

export default async (req) => {
  if (!queueData) {
    return new Response(
      JSON.stringify({ error: "Server data failed to load. Check function logs." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const url = new URL(req.url);
  const contentId = url.searchParams.get("content_id")?.trim();

  if (!contentId) {
    return new Response(
      JSON.stringify({ error: "Please provide a content_id." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const match = queueData[contentId];

  if (!match) {
    return new Response(
      JSON.stringify({
        found: false,
        message: `No match for "${contentId}". Try one of the real sample IDs below the form.`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
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
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};

export const config = {
  path: "/api/lookup",
};
