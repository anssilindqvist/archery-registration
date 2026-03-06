"use client";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-green-800/50 rounded-2xl rounded-bl-sm w-fit">
      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  );
}
