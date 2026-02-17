import { type Page, expect } from "@playwright/test";
import {
  ADD_NEW_INTERVIEW,
  MODE_AUTO,
  START_INTERVIEW_BUTTON,
  QUESTION_TEXT,
  ANSWER_TEXTAREA,
  SUBMIT_ANSWER_BUTTON,
} from "./selectors";

/**
 * Creates a mock interview through the UI dialog (auto mode).
 * Returns the mockId extracted from the redirect URL.
 */
export async function createMockInterview(
  page: Page,
  options?: {
    jobPosition?: string;
    jobDesc?: string;
    jobExperience?: string;
  }
): Promise<string> {
  const jobPosition = options?.jobPosition ?? "Test Engineer";
  const jobDesc = options?.jobDesc ?? "Writing automated tests for web applications";
  const jobExperience = options?.jobExperience ?? "3";

  // Open create dialog
  await page.locator(ADD_NEW_INTERVIEW).click();

  // Select auto mode
  await page.locator(MODE_AUTO).click();

  // Fill form
  await page.locator("#jobPosition").fill(jobPosition);
  await page.locator("#jobDesc").fill(jobDesc);
  await page.locator("#jobExperience").fill(jobExperience);

  // Submit form (goes to resume step)
  await page.locator('button[type="submit"]').click();

  // Skip resume step — click "Start Interview" button
  await page.locator(START_INTERVIEW_BUTTON).click();

  // Wait for navigation to interview setup page
  await page.waitForURL(/\/dashboard\/interview\/[\w-]+$/);

  const url = page.url();
  const mockId = url.split("/interview/")[1];
  return mockId;
}

/**
 * Completes all questions in an interview using the textarea fallback.
 * Assumes page is on the interview start page.
 */
export async function completeInterview(page: Page): Promise<void> {
  // Wait for questions to load
  await expect(page.locator(QUESTION_TEXT)).toBeVisible({ timeout: 15000 });

  // Find the total number of question tabs
  const questionTabs = page.locator("button:has-text('Q')").filter({
    hasText: /^Q\d+$/,
  });
  const count = await questionTabs.count();

  for (let i = 0; i < count; i++) {
    // Wait for question text to be visible
    await expect(page.locator(QUESTION_TEXT)).toBeVisible();

    // Type answer in textarea fallback
    const textarea = page.locator(ANSWER_TEXTAREA);
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await textarea.fill(`This is my answer to question ${i + 1}. I have experience with this topic and can elaborate on the key concepts involved.`);

    // Submit
    await page.locator(SUBMIT_ANSWER_BUTTON).first().click();

    // Wait for the submit to process
    // After submission, either:
    // 1. A follow-up question appears (skip it)
    // 2. We move to the next question
    // 3. We navigate to feedback (last question)

    // Give time for follow-up generation
    await page.waitForTimeout(1000);

    // If follow-up mode appeared, skip it
    const skipButton = page.getByText("Skip", { exact: false }).filter({
      has: page.locator("svg"),
    });
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
    }
  }
}
