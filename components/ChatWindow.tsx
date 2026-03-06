"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "@/types";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

function stripMarkers(text: string): string {
  return text.replace("[REGISTRATION_COMPLETE]", "").replace("[WAITLIST_COMPLETE]", "").trim();
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const submittedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    inputRef.current?.focus();
  }, [messages, loading]);

  // Auto-start conversation
  useEffect(() => {
    sendToChat([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendToChat(chatMessages: ChatMessage[]) {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatMessages }),
      });
      const data = await res.json();
      if (data.reply) {
        const rawReply = data.reply;
        const cleanReply = stripMarkers(rawReply);

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: cleanReply,
        };
        const updated = [...chatMessages, assistantMsg];
        setMessages(updated);

        // Check for registration completion
        if (rawReply.includes("[REGISTRATION_COMPLETE]") && !submittedRef.current) {
          submittedRef.current = true;
          extractAndSubmit(updated, false);
        } else if (rawReply.includes("[WAITLIST_COMPLETE]") && !submittedRef.current) {
          submittedRef.current = true;
          extractAndSubmit(updated, true);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Pahoittelut, jokin meni pieleen. Yritä uudelleen.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function extractAndSubmit(
    chatMessages: ChatMessage[],
    isWaitlist: boolean
  ) {
    try {
      const extractRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...chatMessages,
            {
              role: "user",
              content: `Pura ilmoittautumistiedot JSON-muodossa. Vastaa VAIN JSON:lla, ei muuta tekstiä. Käytä luokan koodia (esim. AMLB). Muoto: {"name": "...", "age": "...", "club": "...", "category": "...", "email": "..."${isWaitlist ? ', "preferredCategory": "..."' : ""}}`,
            },
          ],
        }),
      });
      const extractData = await extractRes.json();
      const jsonMatch = extractData.reply?.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Failed to extract JSON from reply");
        return;
      }
      const fields = JSON.parse(jsonMatch[0]);
      const submitRes = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          waitlist: isWaitlist,
        }),
      });

      if (!submitRes.ok) {
        const err = await submitRes.json();
        console.error("Submit failed:", err);
        if (err.error === "full") {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Valitettavasti luokka ${err.category} on juuri täyttynyt. Aloita uusi keskustelu yrittääksesi uudelleen.`,
            },
          ]);
        }
      }
    } catch (e) {
      console.error("Failed to extract/submit registration:", e);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    await sendToChat(updated);
  }

  return (
    <div className="flex flex-col h-dvh bg-gradient-to-b from-green-950 to-emerald-950">
      {/* Header */}
      <div className="bg-green-900/80 border-b border-emerald-800/50 px-4 py-3">
        <h1 className="text-emerald-100 font-semibold text-center">
          Kevät Flint 26 - Ilmoittautuminen
        </h1>
        <p className="text-emerald-400/70 text-xs text-center">
          Järvenpään Jousiampujat
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-green-900/60 border-t border-emerald-800/50 px-4 py-3">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Kirjoita viesti..."
            disabled={loading}
            className="flex-1 bg-green-800/50 text-emerald-50 placeholder-emerald-600 rounded-lg px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            Lähetä
          </button>
        </div>
      </div>
    </div>
  );
}
