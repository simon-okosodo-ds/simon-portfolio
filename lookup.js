// netlify/functions/lookup.js
// V2 syntax (current Netlify Functions API -- standard Request/Response objects,
// not the older AWS-Lambda-style event/context handler).
//
// What this does: takes a content_id from the visitor, looks it up in the real,
// already-scored FlyRank queue data, and returns the real diagnosis/action --
// or an honest "not found" if it's not a real id, never a guess.

import queueData from "./queue-data.json" with { type: "json" };

export default async (req) => {
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
    // Honest, not a guess -- most typed IDs won't be real ones, and that's fine.
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
