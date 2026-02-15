"use server";

import { db } from "@/lib/db";
import { UserAnswer } from "@/lib/schema";
import { generateFromPrompt } from "@/lib/gemini";
import { eq, and } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

interface EnhancedFeedback {
  rating: number;
  competencies: {
    technicalKnowledge: number;
    communicationClarity: number;
    problemSolving: number;
    relevance: number;
  };
  strengths: string;
  improvements: string;
  suggestedAnswer: string;
}

export async function submitAnswer(
  mockIdRef: string,
  question: string,
  correctAns: string,
  userAns: string,
  language?: string
) {
  const user = await currentUser();
  if (!user?.emailAddresses?.[0]?.emailAddress) {
    throw new Error("Unauthorized");
  }
  const userEmail = user.emailAddresses[0].emailAddress;

  const feedbackPrompt = language === "ko"
    ? `당신은 전문 면접 코치입니다. 다음 면접 답변을 평가하세요.

질문: "${question}"
예상 답변: "${correctAns}"
지원자의 답변: "${userAns}"

채점 기준 (1-5점 전체 범위를 사용하세요 — 높은 점수를 기본값으로 하지 마세요):
- 5점: 우수 — 모든 핵심 요점을 깊이 있게 다루고, 명확한 논리와 좋은 예시를 제시함.
- 4점: 양호 — 대부분의 핵심 요점을 다루지만, 일부 세부 사항이나 깊이가 부족함.
- 3점: 보통 — 부분적 이해를 보여줌; 일부 핵심 요점은 다루지만 중요한 부분을 놓침.
- 2점: 미흡 — 이해도가 낮음; 대부분 모호하거나, 불완전하거나, 간접적으로만 관련됨.
- 1점: 부족 — 근본적으로 틀리거나, 완전히 주제에서 벗어나거나, 사실상 답변이 없음.

추가 사항:
- 답변은 음성 인식으로 수집되므로 문법 오류, 불필요한 단어, 전사 오류는 무시하세요.
- 예상 답변의 핵심 요점과 답변의 실질적 내용을 비교하세요. 3점은 핵심 요점의 약 절반을 다룬 수준입니다.
- "communicationClarity"는 아이디어 구성과 전달력을 측정합니다. 문법이 아닙니다.
- "relevance"는 답변이 질문의 핵심 주제를 다루는지를 측정합니다.

다음 JSON 형식으로만 응답하세요 (마크다운이나 추가 텍스트 없이):
{
  "rating": <1-5점 전체 점수>,
  "competencies": {
    "technicalKnowledge": <1-5점>,
    "communicationClarity": <1-5점>,
    "problemSolving": <1-5점>,
    "relevance": <1-5점>
  },
  "strengths": "<잘한 점, 1-2문장, 한국어로>",
  "improvements": "<개선할 부분, 1-2문장, 한국어로>",
  "suggestedAnswer": "<더 나은 답변 예시, 2-3문장, 한국어로>"
}`
    : `You are an expert interview coach. Evaluate the following interview answer.

Question: "${question}"
Expected Answer: "${correctAns}"
User's Answer: "${userAns}"

Scoring rubric (use the FULL 1-5 scale — do not default to high scores):
- 5: Excellent — covers all key points with depth, clear reasoning, and strong examples.
- 4: Good — covers most key points but missing some detail or depth.
- 3: Adequate — demonstrates partial understanding; covers some key points but misses important ones.
- 2: Weak — shows minimal understanding; mostly vague, incomplete, or only tangentially related.
- 1: Poor — fundamentally wrong, completely off-topic, or essentially empty.

Additional notes:
- Answers are captured via speech recognition, so ignore grammar mistakes, filler words, and transcription artifacts.
- Compare the substance of the answer against the expected answer's key points. A score of 3 means roughly half the key points are addressed.
- "communicationClarity" measures how well the candidate structures and conveys ideas, not grammar.
- "relevance" measures whether the answer addresses the question's core topic.

Respond with ONLY a JSON object (no markdown, no extra text) in this exact format:
{
  "rating": <overall score 1-5>,
  "competencies": {
    "technicalKnowledge": <score 1-5>,
    "communicationClarity": <score 1-5>,
    "problemSolving": <score 1-5>,
    "relevance": <score 1-5>
  },
  "strengths": "<what the candidate did well, 1-2 sentences>",
  "improvements": "<specific areas to improve, 1-2 sentences>",
  "suggestedAnswer": "<a stronger version of the answer, 2-3 sentences>"
}`;

  const responseText = await generateFromPrompt(feedbackPrompt);
  let parsed: EnhancedFeedback;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error("AI returned invalid response. Please try again.");
  }

  const feedbackJson = JSON.stringify({
    rating: parsed.rating,
    competencies: parsed.competencies,
    strengths: parsed.strengths,
    improvements: parsed.improvements,
    suggestedAnswer: parsed.suggestedAnswer,
  });

  await db.insert(UserAnswer).values({
    mockIdRef,
    question,
    correctAns,
    userAns,
    feedback: feedbackJson,
    rating: String(parsed.rating),
    userEmail,
    createdAt: new Date().toISOString(),
  });

  return { rating: parsed.rating, feedback: feedbackJson };
}

export async function getAnswers(mockIdRef: string) {
  const user = await currentUser();
  if (!user?.emailAddresses?.[0]?.emailAddress) {
    throw new Error("Unauthorized");
  }
  const userEmail = user.emailAddresses[0].emailAddress;

  return db
    .select()
    .from(UserAnswer)
    .where(
      and(eq(UserAnswer.mockIdRef, mockIdRef), eq(UserAnswer.userEmail, userEmail))
    );
}
