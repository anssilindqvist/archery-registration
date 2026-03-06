import { NextResponse } from "next/server";
import { systemPrompt } from "@/lib/systemPrompt";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json(
      { error: "Anthropic API error" },
      { status: response.status }
    );
  }

  const data = await response.json();
  const reply = data.content[0].text;

  return NextResponse.json({ reply });
}
