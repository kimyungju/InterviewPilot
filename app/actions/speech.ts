"use server";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30_000,
});

export async function generateSpeech(
  text: string,
  voice: "nova" | "onyx" = "nova"
): Promise<string> {
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice,
    input: text,
    response_format: "mp3",
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:audio/mp3;base64,${buffer.toString("base64")}`;
}
