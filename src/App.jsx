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
  const [quantumBusy, setQuantumBusy] = useState(false);
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


  async function runQuantumCoin() {
    if (busy || quantumBusy) return;
    setQuantumBusy(true);
    setError("");
    try {
      const submitted = await fetch("/api/quantum/coin-toss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shots: 10 })
      });
      const job = await submitted.json();
      if (!submitted.ok) throw new Error(job.error || "Atlas couldn't start the quantum run.");
      let status;
      for (let attempt = 0; attempt < 25; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const response = await fetch(`/api/quantum/jobs/${encodeURIComponent(job.jobId)}/status`);
        status = await response.json();
        if (!response.ok) throw new Error(status.error || "Couldn't check the Atlas job.");
        if (["completed", "failed", "cancelled"].includes(status.status)) break;
      }
      if (status?.status !== "completed") throw new Error(status?.error || "The quantum run is taking longer than expected. Your normal chat is still ready.");
      const response = await fetch(`/api/quantum/jobs/${encodeURIComponent(job.jobId)}/result`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Couldn't retrieve the quantum result.");
      const result = typeof payload.result === "string" ? JSON.parse(payload.result) : payload.result;
      const heads = Number(result?.heads);
      const tails = Number(result?.tails);
      const shots = Number(result?.shots ?? heads + tails);
      if (!Number.isFinite(heads) || !Number.isFinite(tails)) throw new Error("Atlas returned an unexpected result format.");
      setMessages((current) => [...current, {
        role: "assistant",
        content: `I ran 10 quantum coin measurements through Moth Atlas (emulator). The result was ${result.output || (heads >= tails ? "heads" : "tails")}: ${heads} heads and ${tails} tails across ${shots} measurements. This is a playful quantum experiment, not a source of guaranteed randomness.`
      }]);
    } catch (err) {
      setError(err.message || "The quantum experiment couldn't complete.");
    } finally {
      setQuantumBusy(false);
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
        <div className="composer-footer"><span>YOUR SPACE. YOUR PACE.</span><span className="footer-actions"><button type="button" className="speak-button" onClick={runQuantumCoin} disabled={quantumBusy || busy}>{quantumBusy ? "RUNNING QUANTUM…" : "QUANTUM COIN ✧"}</button><button type="button" className="speak-button" onClick={speakLast}>{speaking ? "STOP VOICE" : "READ LAST REPLY ↗"}</button></span></div>
      </div>
      <footer className="footer-note">Built with care · Your conversations are sent securely to the configured AI service.</footer>
    </main>
  );
}