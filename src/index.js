/**
 * Consultor IA — Cloudflare Worker
 *
 * Llama directamente a Anthropic API.
 * No hay backend intermedio.
 *
 * Endpoints:
 *   GET  /          → interfaz HTML de chat
 *   POST /api/chat  → llama a Anthropic, devuelve respuesta
 *   OPTIONS *       → CORS preflight
 *
 * Secret requerido (wrangler secret put ANTHROPIC_API_KEY):
 *   ANTHROPIC_API_KEY
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-haiku-4-5";
const DEFAULT_MAX_TOKENS = 6000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // GET / → HTML frontend
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(getHTML(), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // POST /api/chat → Anthropic API
    if (url.pathname === "/api/chat" && request.method === "POST") {
      return handleChat(request, env);
    }

    return new Response(JSON.stringify({ error: "Not found", path: url.pathname }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  },
};

// ---------------------------------------------------------------------------
// Chat handler
// ---------------------------------------------------------------------------

async function handleChat(request, env) {
  // Verificar que la API key está configurada
  if (!env.ANTHROPIC_API_KEY) {
    return jsonResponse(
      { error: "ANTHROPIC_API_KEY not configured. Run: wrangler secret put ANTHROPIC_API_KEY" },
      500
    );
  }

  // Parsear body
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  const { messages, system, model, max_tokens } = body;

  // Validar messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonResponse({ error: "messages must be a non-empty array." }, 400);
  }

  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      return jsonResponse(
        { error: 'Each message must have "role" and "content".' },
        400
      );
    }
    if (!["user", "assistant"].includes(msg.role)) {
      return jsonResponse(
        { error: 'Message role must be "user" or "assistant".' },
        400
      );
    }
  }

  // Llamar a Anthropic
  try {
    const anthropicRes = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        max_tokens: max_tokens || DEFAULT_MAX_TOKENS,
        ...(system ? { system } : {}),
        messages,
      }),
    });

    const responseText = await anthropicRes.text();

    if (!anthropicRes.ok) {
      console.error("Anthropic error:", anthropicRes.status, responseText);
      return jsonResponse(
        { error: "Anthropic API error.", status: anthropicRes.status },
        anthropicRes.status
      );
    }

    return new Response(responseText, {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  } catch (err) {
    console.error("Fetch error:", err);
    return jsonResponse({ error: "Failed to reach Anthropic API." }, 502);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

// ---------------------------------------------------------------------------
// Frontend HTML (fallback — el frontend real está en GitHub Pages)
// ---------------------------------------------------------------------------

function getHTML() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Consultor IA — Worker</title>
</head>
<body>
  <h1>✅ Worker activo</h1>
  <p>Endpoint disponible: <code>POST /api/chat</code></p>
  <p>Frontend: <a href="https://previriegom-ship-it.github.io/Consultor-AI/">GitHub Pages</a></p>
</body>
</html>`;
}
