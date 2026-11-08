import { useEffect, useRef, useState } from "react";

const starter = {
  role: "assistant",
  content: "I'm here. We can think things through, build something, explore an idea, or simply talk. Where would you like to begin?"
};

export default function App() {
  const [messages, setMessages] = useState([starter]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
  }, []);

  async function sendMessage(text = draft) {
    const content = text.trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setDraft("");
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-20) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err.message || "Couldn't connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function toggleVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input isn't supported in this browser. Try Safari on a current iPhone.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((r) => r[0].transcript).join("");
      setDraft(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  function speakLast() {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(last.content);
    utterance.rate = 0.96;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">A</span><div><strong>ARIA</strong><small>YOUR AI COMPANION</small></div></div>
        <span className="connection"><i /> PRIVATE SPACE</span>
      </header>

      <section className="presence">
        <div className={`aura ${busy ? "thinking" : ""} ${speaking ? "speaking" : ""}`}>
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="core"><span className="core-letter">A</span><span className="core-glow" /></div>
        </div>
        <div className="presence-copy">
          <span className="eyebrow">{busy ? "GATHERING A THOUGHT" : listening ? "LISTENING" : "HERE WITH YOU"}</span>
          <h1>{busy ? "One moment." : "Hello, I'm ARIA."}</h1>
          <p>A space to think, create, learn, and talk.</p>
        </div>
      </section>

      <section className="conversation" aria-label="Conversation">
        <div className="section-label"><span>YOUR CONVERSATION</span><span className="line" /></div>
        <div className="messages">
          {messages.map((message, index) => (
            <article className={`message ${message.role}`} key={index}>
              {message.role === "assistant" && <span className="message-avatar">A</span>}
              <div className="message-content"><span className="speaker">{message.role === "assistant" ? "ARIA" : "YOU"}</span><p>{message.content}</p></div>
            </article>
          ))}
          {busy && <div className="typing"><span /><span /><span /></div>}
          <div ref={bottomRef} />
        </div>
      </section>

      <div className="composer-wrap">
        {error && <p className="error-message" role="alert">{error}</p>}
        <form className="composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
          <button className={`voice-button ${listening ? "active" : ""}`} type="button" onClick={toggleVoice} aria-label="Use voice input">⌁</button>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write something to ARIA..." aria-label="Message ARIA" maxLength={6000} />
          <button className="send-button" type="submit" disabled={!draft.trim() || busy} aria-label="Send message">↑</button>
        </form>
        <div className="composer-footer"><span>YOUR SPACE. YOUR PACE.</span><button type="button" className="speak-button" onClick={speakLast}>{speaking ? "STOP VOICE" : "READ LAST REPLY ↗"}</button></div>
      </div>
      <footer className="footer-note">Built with care · Your conversations are sent securely to the configured AI service.</footer>
    </main>
  );
}