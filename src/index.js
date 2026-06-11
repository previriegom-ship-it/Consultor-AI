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
const DEFAULT_MODEL = "claude-3-5-haiku-20241022";
const DEFAULT_MAX_TOKENS = 1024;

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

    return new Response("Not found", { status: 404 });
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
// Frontend HTML
// ---------------------------------------------------------------------------

function getHTML() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Consultor IA</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .card {
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 12px 48px rgba(0,0,0,.22);
      width: 100%;
      max-width: 620px;
      padding: 36px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    h1 { font-size: 26px; color: #222; }
    .subtitle { font-size: 13px; color: #777; margin-top: 4px; }

    .chat {
      background: #f6f6f8;
      border-radius: 10px;
      padding: 14px;
      min-height: 160px;
      max-height: 340px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .msg {
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13.5px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .msg.user      { background: #667eea; color: #fff; align-self: flex-end; max-width: 85%; }
    .msg.assistant { background: #e8e8ee; color: #222; align-self: flex-start; max-width: 85%; }

    .input-row {
      display: flex;
      gap: 10px;
    }

    input[type="text"] {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 14px;
      outline: none;
      transition: border-color .2s;
    }
    input[type="text"]:focus { border-color: #667eea; }

    button {
      background: #667eea;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background .2s;
      white-space: nowrap;
    }
    button:hover    { background: #5566d4; }
    button:disabled { background: #bbb; cursor: not-allowed; }

    .status { font-size: 12px; color: #999; min-height: 16px; }

    .error-box {
      background: #fff0f0;
      color: #c33;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      display: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <div>
      <h1>🤖 Consultor IA</h1>
      <p class="subtitle">Asistente experto en financiamiento y emprendimiento</p>
    </div>

    <div class="error-box" id="errorBox"></div>

    <div class="chat" id="chat"></div>

    <div class="input-row">
      <input
        type="text"
        id="input"
        placeholder="Escribe tu pregunta..."
        autocomplete="off"
      />
      <button id="btn">Enviar</button>
    </div>

    <div class="status" id="status"></div>
  </div>

<script>
  const chatEl   = document.getElementById("chat");
  const inputEl  = document.getElementById("input");
  const btnEl    = document.getElementById("btn");
  const statusEl = document.getElementById("status");
  const errorEl  = document.getElementById("errorBox");

  const SYSTEM = "Eres un consultor experto en financiamiento, grants e inversión para emprendedores. Responde de forma clara, práctica y concisa en español.";
  let messages = [];

  function addMsg(role, text) {
    const el = document.createElement("div");
    el.className = "msg " + role;
    el.textContent = text;
    chatEl.appendChild(el);
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  async function send() {
    const text = inputEl.value.trim();
    if (!text) return;

    addMsg("user", text);
    messages.push({ role: "user", content: text });
    inputEl.value = "";

    btnEl.disabled = true;
    statusEl.textContent = "Pensando…";
    errorEl.style.display = "none";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, system: SYSTEM }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error " + res.status);
      }

      const reply = data.content[0].text;
      addMsg("assistant", reply);
      messages.push({ role: "assistant", content: reply });
      statusEl.textContent = "✓";
    } catch (err) {
      errorEl.textContent = "❌ " + err.message;
      errorEl.style.display = "block";
      statusEl.textContent = "";
    } finally {
      btnEl.disabled = false;
      inputEl.focus();
    }
  }

  btnEl.addEventListener("click", send);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  });

  // Mensaje inicial
  addMsg("assistant", "👋 Hola, soy tu Consultor IA. Pregúntame sobre financiamiento, grants, inversión o cómo escalar tu emprendimiento.");
</script>
</body>
</html>`;
}
