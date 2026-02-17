import OpenAI from "openai";
import { NextRequest } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60_000,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const language = (formData.get("language") as string) || "en";

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: "No audio file provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: language === "ko" ? "ko" : "en",
      response_format: "json",
    });

    return new Response(
      JSON.stringify({ text: transcription.text }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Transcription failed:", error);
    return new Response(
      JSON.stringify({ error: "Transcription failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
