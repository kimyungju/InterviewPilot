import OpenAI from "openai";
import { NextRequest } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30_000,
});

export async function POST(req: NextRequest) {
  const { text, voice } = await req.json();
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: voice || "nova",
    input: text || "",
    response_format: "mp3",
  });
  return new Response(response.body as ReadableStream, {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
