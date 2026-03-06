"use client";

import type { ChatMessage } from "@/types";

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed ${
          isUser
            ? "bg-emerald-600 text-white rounded-br-sm"
            : "bg-green-800/50 text-emerald-50 rounded-bl-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
