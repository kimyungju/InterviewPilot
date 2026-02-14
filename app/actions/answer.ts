"use server";

import { db } from "@/lib/db";
import { UserAnswer } from "@/lib/schema";
import { generateFromPrompt, cleanJsonResponse } from "@/lib/gemini";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

export async function submitAnswer(
  mockIdRef: string,
  question: string,
  correctAns: string,
  userAns: string
) {
  const user = await currentUser();
  if (!user?.emailAddresses?.[0]?.emailAddress) {
    throw new Error("Unauthorized");
  }
  const userEmail = user.emailAddresses[0].emailAddress;

  const feedbackPrompt = `Question: "${question}". User Answer: "${userAns}". Based on the question and user answer, please give a rating out of 5 and feedback in 3-5 lines in JSON format with "rating" and "feedback" fields.`;

  const responseText = await generateFromPrompt(feedbackPrompt);
  const parsed = JSON.parse(cleanJsonResponse(responseText));

  await db.insert(UserAnswer).values({
    mockIdRef,
    question,
    correctAns,
    userAns,
    feedback: parsed.feedback,
    rating: String(parsed.rating),
    userEmail,
    createdAt: new Date().toISOString(),
  });

  return { rating: parsed.rating, feedback: parsed.feedback };
}

export async function getAnswers(mockIdRef: string) {
  return db
    .select()
    .from(UserAnswer)
    .where(eq(UserAnswer.mockIdRef, mockIdRef));
}
