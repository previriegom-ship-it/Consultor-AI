"use client";

import { useState, useRef, useEffect } from "react";

const API_URL = "https://consultor-ai.previriegom.workers.dev/api/chat";
const SYSTEM_PROMPT =
  "Eres un consultor experto en financiamiento, grants e inversión para emprendedores. Responde de forma clara, práctica y concisa en español.";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  card: {
    background: "#fff",
    borderRadius: "14px",
    boxShadow: "0 12px 48px rgba(0,0,0,.22)",
    width: "100%",
    maxWidth: "640px",
    padding: "36px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  header: {},
  title: {
    fontSize: "26px",
    fontWeight: 800,
    color: "#222",
    marginBottom: "4px",
  },
  subtitle: {
    fontSize: "13px",
    color: "#777",
  },
  chat: {
    background: "#f6f6f8",
    borderRadius: "10px",
    padding: "14px",
    minHeight: "200px",
    maxHeight: "380px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  msgUser: {
    background: "#667eea",
    color: "#fff",
    alignSelf: "flex-end",
    maxWidth: "85%",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "13.5px",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  msgAssistant: {
    background: "#e8e8ee",
    color: "#222",
    alignSelf: "flex-start",
    maxWidth: "85%",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "13.5px",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  inputRow: {
    display: "flex",
    gap: "10px",
  },
  input: {
    flex: 1,
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    outline: "none",
    transition: "border-color .2s",
    fontFamily: "inherit",
  },
  btnActive: {
    background: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background .2s",
  },
  btnDisabled: {
    background: "#bbb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "not-allowed",
    whiteSpace: "nowrap",
  },
  status: {
    fontSize: "12px",
    color: "#999",
    minHeight: "16px",
  },
  errorBox: {
    background: "#fff0f0",
    color: "#c33",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ConsultorIA() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Hola, soy tu Consultor IA. Pregúntame sobre financiamiento, grants, inversión o cómo escalar tu emprendimiento.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);
    setStatus("Pensando…");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Exclude the initial assistant greeting from the API call
          messages: nextMessages.filter(
            (m) =>
              !(
                m.role === "assistant" &&
                m.content.startsWith("👋")
              )
          ),
          system: SYSTEM_PROMPT,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }

      const reply = data.content?.[0]?.text ?? "Sin respuesta.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setStatus("✓");
    } catch (err) {
      setError(err.message);
      setStatus("");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🤖 Consultor IA</h1>
          <p style={styles.subtitle}>
            Asistente experto en financiamiento y emprendimiento
          </p>
        </div>

        {/* Error */}
        {error && <div style={styles.errorBox}>❌ {error}</div>}

        {/* Chat */}
        <div style={styles.chat} ref={chatRef}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={
                msg.role === "user" ? styles.msgUser : styles.msgAssistant
              }
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div style={styles.msgAssistant}>
              <em style={{ color: "#999" }}>Escribiendo…</em>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={styles.inputRow}>
          <input
            ref={inputRef}
            type="text"
            style={styles.input}
            placeholder="Escribe tu pregunta…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
            autoComplete="off"
          />
          <button
            style={loading ? styles.btnDisabled : styles.btnActive}
            onClick={send}
            disabled={loading}
          >
            {loading ? "…" : "Enviar"}
          </button>
        </div>

        {/* Status */}
        <div style={styles.status}>{status}</div>
      </div>
    </div>
  );
}
