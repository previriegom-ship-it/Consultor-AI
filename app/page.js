"use client";

import { useState, useRef, useEffect } from "react";

const API_URL = "https://consultor-ai.previriegom.workers.dev/api/chat";
const SYSTEM_PROMPT =
  `Eres un consultor experto en automatización con IA para empresas. Tu misión es hacer un diagnóstico de automatización a través de una conversación estructurada.

PROCESO DE DIAGNÓSTICO (sigue este orden):
1. Pregunta el sector/industria y tamaño de la empresa.
2. Pregunta cuáles son sus procesos más repetitivos o que consumen más tiempo.
3. Pregunta qué herramientas o software usan actualmente.
4. Pregunta dónde sienten los mayores cuellos de botella operativos.
5. Pregunta cuántas horas a la semana estiman que se pierden en tareas manuales.

CUANDO TENGAS SUFICIENTE INFORMACIÓN (mínimo 3 respuestas):
Genera un informe de diagnóstico con estas secciones:
- 🔍 CUELLOS DE BOTELLA IDENTIFICADOS
- 🚀 OPORTUNIDADES DE AUTOMATIZACIÓN (top 3, ordenadas por impacto)
- 💰 AHORRO ESTIMADO (horas/semana y costo aproximado)
- ⚡ QUICK WINS (automatizaciones que pueden implementarse en menos de 2 semanas)
- 📋 PRÓXIMOS PASOS RECOMENDADOS

Responde siempre en español, de forma clara y práctica. Haz una pregunta a la vez para no abrumar al usuario.`;

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
    gap: "8px",
    alignItems: "stretch",
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
  btnMic: {
    background: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "18px",
    cursor: "pointer",
    transition: "background .2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  btnMicListening: {
    background: "#e53e3e",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    animation: "pulse 1.2s ease-in-out infinite",
  },
  btnMicDisabled: {
    background: "#bbb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "18px",
    cursor: "not-allowed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  status: {
    fontSize: "12px",
    color: "#999",
    minHeight: "16px",
  },
  statusListening: {
    fontSize: "12px",
    color: "#e53e3e",
    minHeight: "16px",
    fontWeight: 500,
  },
  errorBox: {
    background: "#fff0f0",
    color: "#c33",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
  },
  micErrorBox: {
    background: "#fff8e1",
    color: "#b45309",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "12px",
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
        "👋 Hola, soy tu Consultor IA especializado en automatización. Voy a hacerte un diagnóstico personalizado para identificar qué procesos de tu empresa se pueden automatizar con IA y cuánto tiempo podrías ahorrar. ¿En qué sector opera tu empresa y cuántas personas trabajan en ella?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState(null);

  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // These refs let event handlers (closures) read current values without stale state
  const isListeningRef = useRef(false);   // mirrors isListening for use inside callbacks
  const baseTextRef = useRef("");          // text in input when mic session started
  const sessionFinalRef = useRef("");      // accumulated final transcript this session

  // Keep isListeningRef in sync
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Speech-to-text
  // ---------------------------------------------------------------------------

  function getSpeechRecognition() {
    if (typeof window === "undefined") return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  function startRecognition() {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "es-ES";
    recognition.continuous = true;       // don't auto-stop on silence
    recognition.interimResults = true;   // show text as you speak
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
    };

    recognition.onresult = (event) => {
      let newFinal = "";
      let interim = "";

      // Walk only the new results since the last event
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinal += t;
        } else {
          interim += t;
        }
      }

      // Append newly confirmed words to the session accumulator
      if (newFinal) {
        sessionFinalRef.current =
          sessionFinalRef.current
            ? sessionFinalRef.current + " " + newFinal
            : newFinal;
      }

      // Build the full input value:
      //   [text before mic started] + [confirmed this session] + [in-progress word(s)]
      const confirmed = sessionFinalRef.current;
      const live = interim;
      const combined =
        baseTextRef.current +
        (baseTextRef.current && (confirmed || live) ? " " : "") +
        (confirmed && live ? confirmed + " " + live : confirmed + live);

      setInput(combined.trimStart());
    };

    recognition.onend = () => {
      // If the user hasn't pressed stop, restart automatically.
      // Chrome/Edge terminate continuous sessions after ~60 s of audio or
      // when the tab loses focus; this keeps the session alive.
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          // Recognition object can't be restarted — create a fresh one
          startRecognition();
        }
      } else {
        setStatus("");
        inputRef.current?.focus();
      }
    };

    recognition.onerror = (event) => {
      // "no-speech" is not fatal in continuous mode — the browser fires it
      // after a long silence window but we can just restart.
      if (event.error === "no-speech") {
        // onend will fire right after and restart us if still listening
        return;
      }

      // Abort on real errors
      isListeningRef.current = false;
      setIsListening(false);
      setStatus("");

      if (event.error === "not-allowed" || event.error === "permission-denied") {
        setMicError(
          "Se requiere acceso al micrófono para usar esta función. Permite el permiso en tu navegador."
        );
      } else if (event.error === "network") {
        setMicError("Error de red al procesar el audio. Verifica tu conexión.");
      } else {
        setMicError(`Error de reconocimiento: ${event.error}`);
      }
    };

    try {
      recognition.start();
    } catch {
      setMicError("No se pudo iniciar el micrófono. Intenta de nuevo.");
      setIsListening(false);
      isListeningRef.current = false;
    }
  }

  function toggleListening() {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      setMicError(
        "Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge."
      );
      return;
    }

    if (isListening) {
      // ── STOP ──
      isListeningRef.current = false;
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      // Sync the base so next mic press appends to current text
      baseTextRef.current = inputRef.current?.value ?? input;
      sessionFinalRef.current = "";
      setStatus("");
      return;
    }

    // ── START ──
    setMicError(null);
    // Snapshot whatever is already in the input box
    baseTextRef.current = input;
    sessionFinalRef.current = "";
    isListeningRef.current = true;
    setStatus("🎤 Escuchando… (presiona ⏹ para parar)");
    startRecognition();
  }

  // ---------------------------------------------------------------------------
  // Chat send
  // ---------------------------------------------------------------------------

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    // Stop mic if active
    if (isListening) {
      isListeningRef.current = false;
      setIsListening(false);
      if (recognitionRef.current) recognitionRef.current.stop();
      baseTextRef.current = "";
      sessionFinalRef.current = "";
    }

    const userMsg = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];

    setMessages(nextMessages);
    setInput("");
    setMicError(null);
    setLoading(true);
    setError(null);
    setStatus("Pensando…");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.filter(
            (m) => !(m.role === "assistant" && m.content.startsWith("👋"))
          ),
          system: SYSTEM_PROMPT,
          max_tokens: 6000,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);

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

  const speechSupported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0 rgba(229,62,62,0.6); }
          60%  { box-shadow: 0 0 0 9px rgba(229,62,62,0); }
          100% { box-shadow: 0 0 0 0 rgba(229,62,62,0); }
        }
      `}</style>

      <div style={styles.page}>
        <div style={styles.card}>

          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.title}>🤖 Consultor IA</h1>
            <p style={styles.subtitle}>
              Diagnóstico de automatización con IA para tu empresa
            </p>
          </div>

          {/* Chat error */}
          {error && <div style={styles.errorBox}>❌ {error}</div>}

          {/* Chat area */}
          <div style={styles.chat} ref={chatRef}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={msg.role === "user" ? styles.msgUser : styles.msgAssistant}
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

          {/* Mic error */}
          {micError && <div style={styles.micErrorBox}>⚠️ {micError}</div>}

          {/* Input row */}
          <div style={styles.inputRow}>
            <input
              ref={inputRef}
              type="text"
              style={styles.input}
              placeholder={
                isListening
                  ? "Escuchando… habla con pausas naturales"
                  : "Escribe tu respuesta o usa 🎤…"
              }
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // If user edits manually while not listening, update base
                if (!isListeningRef.current) {
                  baseTextRef.current = e.target.value;
                  sessionFinalRef.current = "";
                }
              }}
              onKeyDown={handleKey}
              disabled={loading}
              autoComplete="off"
            />

            {/* Mic button */}
            <button
              style={
                loading
                  ? styles.btnMicDisabled
                  : isListening
                  ? styles.btnMicListening
                  : styles.btnMic
              }
              onClick={toggleListening}
              disabled={loading}
              title={
                !speechSupported
                  ? "Reconocimiento de voz no disponible en este navegador"
                  : isListening
                  ? "Detener grabación"
                  : "Dictar respuesta por voz (acumula texto)"
              }
              aria-label={isListening ? "Detener grabación" : "Iniciar grabación de voz"}
            >
              {isListening ? "⏹" : "🎤"}
            </button>

            {/* Send button */}
            <button
              style={loading ? styles.btnDisabled : styles.btnActive}
              onClick={send}
              disabled={loading}
            >
              {loading ? "…" : "Enviar"}
            </button>
          </div>

          {/* Status */}
          <div style={isListening ? styles.statusListening : styles.status}>
            {status}
          </div>

        </div>
      </div>
    </>
  );
}
