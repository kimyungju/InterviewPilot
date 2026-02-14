import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateFromPrompt(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });
  return response.choices[0].message.content || "";
}

export function cleanJsonResponse(text: string): string {
  return text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}
