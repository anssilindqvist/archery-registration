import { NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import { getAllAvailability } from "@/lib/sheets";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Fetch live categories from Google Sheets
  let categories: Record<string, { name: string; max: number; registered: number; available: boolean; memberPrice: number; price: number }> = {};
  try {
    categories = await getAllAvailability();
  } catch (e) {
    console.error("Failed to fetch availability:", e);
  }

  const fullSystemPrompt = buildSystemPrompt(categories);

  // Anthropic requires at least one message; for the initial greeting, send a starter prompt
  const apiMessages =
    messages.length === 0
      ? [{ role: "user" as const, content: "Hei, haluaisin ilmoittautua kilpailuun." }]
      : messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        }));

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
      system: fullSystemPrompt,
      messages: apiMessages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Anthropic API error:", response.status, error);
    return NextResponse.json(
      { error: "Anthropic API error", details: error },
      { status: response.status }
    );
  }

  const data = await response.json();
  const reply = data.content[0].text;

  return NextResponse.json({ reply });
}
