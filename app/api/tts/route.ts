import OpenAI from "openai";
import { NextRequest } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30_000,
});

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json();
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice || "nova",
      input: text || "",
      response_format: "mp3",
    });
    const buffer = await response.arrayBuffer();
    return new Response(buffer, {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "TTS generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
