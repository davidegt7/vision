/**
 * Vercel serverless proxy for Muse.
 * Keeps provider calls server-side (avoids browser CORS) while using the
 * user's API key from the Authorization header — key is not stored by us.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  try {
    const auth = String(req.headers.authorization || "");
    const key =
      auth.replace(/^Bearer\s+/i, "").trim() ||
      String(process.env.OPENAI_API_KEY || process.env.MUSE_API_KEY || "");

    if (!key) {
      res.status(401).json({
        error:
          "Missing API key. Add yours in Muse settings, or set OPENAI_API_KEY on Vercel.",
      });
      return;
    }

    const body = req.body || {};
    const model = String(body.model || "gpt-4o-mini");
    const messages = body.messages;
    const temperature =
      typeof body.temperature === "number" ? body.temperature : 0.85;
    let baseUrl = String(body.baseUrl || "https://api.openai.com/v1").replace(
      /\/$/,
      "",
    );

    // Basic SSRF guard — only allow http(s) API hosts
    if (!/^https?:\/\//i.test(baseUrl)) {
      res.status(400).json({ error: "Invalid baseUrl" });
      return;
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages required" });
      return;
    }

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
      }),
    });

    const text = await upstream.text();
    let data: unknown = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      res.status(upstream.status).json({
        error: text.slice(0, 300) || `Upstream HTTP ${upstream.status}`,
      });
      return;
    }

    if (!upstream.ok) {
      const err = data as { error?: { message?: string } | string };
      const msg =
        typeof err.error === "string"
          ? err.error
          : err.error?.message || `Upstream HTTP ${upstream.status}`;
      res.status(upstream.status).json({ error: msg });
      return;
    }

    const content = (
      data as { choices?: Array<{ message?: { content?: string } }> }
    ).choices?.[0]?.message?.content;

    res.status(200).json({ content: content || "", raw: data });
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
