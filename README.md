# Consultor IA — Cloudflare Worker

Cloudflare Worker que sirve un chat frontend y llama **directamente** a la Anthropic API. Sin backend intermediario.

## Arquitectura

```
Browser → Cloudflare Worker → Anthropic API
```

## Setup

### 1. Instalar dependencias
```bash
npm install
```

### 2. Autenticarse en Cloudflare
```bash
npx wrangler login
```

### 3. Configurar API Key (local dev)
Crea un archivo `.dev.vars` (no se sube a git):
```
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Desarrollo local
```bash
npm run dev
# → http://localhost:8787
```

### 5. Deploy
```bash
# Primero sube la API key como secret (una sola vez):
npx wrangler secret put ANTHROPIC_API_KEY

# Luego deploy:
npm run deploy
```

## Endpoints

| Método | Path | Descripción |
|--------|------|-------------|
| `GET` | `/` | Frontend HTML |
| `POST` | `/api/chat` | Chat con Anthropic |
| `OPTIONS` | `*` | CORS preflight |

### POST /api/chat

**Request:**
```json
{
  "messages": [{ "role": "user", "content": "¿Qué es un grant?" }],
  "system": "Eres un consultor de financiamiento",
  "model": "claude-sonnet-4-6",
  "max_tokens": 1024
}
```

**Response:** Respuesta directa de Anthropic API.

## Variables de entorno

| Variable | Dónde | Descripción |
|----------|-------|-------------|
| `ANTHROPIC_API_KEY` | `wrangler secret` / `.dev.vars` | API key de Anthropic |

**Nunca pongas la API key en `wrangler.toml` o código fuente.**
