import { z } from "zod";

/**
 * Schema + normalizer for the structured feedback the LLM returns in
 * `submitAnswer`. The model is asked for JSON, but a raw `JSON.parse` trusts
 * whatever comes back — an out-of-range rating (e.g. 7/5), a stringified
 * number, or missing competencies would otherwise flow straight into the
 * database and the PDF report. This validates and clamps the output to the
 * contract the rest of the app assumes.
 */

// Coerce "4" -> 4, clamp to 1..5, round to an integer. Ratings the model
// emits as strings or out of range are normalized rather than rejected.
const ratingField = z.coerce
  .number()
  .transform((n) => Math.min(5, Math.max(1, Math.round(n))));

const competenciesSchema = z.object({
  technicalKnowledge: ratingField,
  communicationClarity: ratingField,
  problemSolving: ratingField,
  relevance: ratingField,
});

// Optional free-text fields default to "" so the consumer never sees undefined.
const text = z.string().default("");

export const feedbackSchema = z.object({
  rating: ratingField,
  competencies: competenciesSchema,
  strengths: text,
  praise: text,
  correction: text,
  actionableTip: text,
  improvements: text,
  suggestedAnswer: text,
});

export type Feedback = z.infer<typeof feedbackSchema>;

const DEFAULT_COMPETENCIES = {
  technicalKnowledge: 3,
  communicationClarity: 3,
  problemSolving: 3,
  relevance: 3,
};

/**
 * Validate and normalize raw parsed feedback into a safe shape.
 *
 * - Valid, in-range responses pass through unchanged (same behavior as before).
 * - Out-of-range or stringified ratings are coerced and clamped to 1..5.
 * - Missing competencies fall back to a neutral 3 rather than crashing.
 * - Throws only when `raw` is not an object at all (unrecoverable).
 */
export function normalizeFeedback(raw: unknown): Feedback {
  if (raw === null || typeof raw !== "object") {
    throw new Error("AI returned invalid feedback (not an object)");
  }

  const withDefaults = {
    ...(raw as Record<string, unknown>),
    competencies: {
      ...DEFAULT_COMPETENCIES,
      ...((raw as Record<string, unknown>).competencies as object | undefined),
    },
  };

  const result = feedbackSchema.safeParse(withDefaults);
  if (!result.success) {
    // Last-resort: rating is the one field the DB/UI hard-depends on.
    const ratingResult = ratingField.safeParse(
      (raw as Record<string, unknown>).rating
    );
    if (!ratingResult.success) {
      throw new Error("AI returned invalid feedback (no usable rating)");
    }
    return {
      rating: ratingResult.data,
      competencies: DEFAULT_COMPETENCIES,
      strengths: "",
      praise: "",
      correction: "",
      actionableTip: "",
      improvements: "",
      suggestedAnswer: "",
    };
  }

  return result.data;
}
