import { test, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import {
  QUESTION_TEXT,
  ANSWER_TEXTAREA,
  SUBMIT_ANSWER_BUTTON,
} from "../../helpers/selectors";
import { createMockInterview } from "../../helpers/interview-factory";

test.describe("Interview Execution", () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/dashboard");
    const mockId = await createMockInterview(page);
    // Navigate to start page
    await page.goto(`/dashboard/interview/${mockId}/start`);
  });

  test("renders question tabs and question text", async ({ page }) => {
    // Wait for questions to load
    await expect(page.locator(QUESTION_TEXT)).toBeVisible({ timeout: 15000 });

    // Question tabs should be visible (Q1, Q2, etc.)
    await expect(page.locator("button:has-text('Q1')")).toBeVisible();
  });

  test("textarea fallback is visible in headless mode", async ({ page }) => {
    // Headless Chromium has no SpeechRecognition, so textarea fallback should appear
    await expect(page.locator(QUESTION_TEXT)).toBeVisible({ timeout: 15000 });
    await expect(page.locator(ANSWER_TEXTAREA)).toBeVisible();
  });

  test("typing answer and submitting works", async ({ page }) => {
    await expect(page.locator(QUESTION_TEXT)).toBeVisible({ timeout: 15000 });

    // Type an answer
    await page.locator(ANSWER_TEXTAREA).fill(
      "REST APIs use resource-based URLs with standard HTTP methods. I prefer REST for simple CRUD operations."
    );

    // Submit button should be enabled
    const submitButton = page.locator(SUBMIT_ANSWER_BUTTON).first();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Wait for submission to process
    await page.waitForTimeout(2000);

    // After submitting, either a follow-up appears or we advance
    // The textarea should be cleared for the next answer
    const currentUrl = page.url();
    const isStillOnStartPage = currentUrl.includes("/start");

    if (isStillOnStartPage) {
      // Either follow-up appeared or moved to next question
      // Check if there's a follow-up skip button or a fresh textarea
      const skipButton = page.getByText("Skip", { exact: false }).filter({
        has: page.locator("svg"),
      });
      const hasFollowUp = await skipButton.isVisible().catch(() => false);

      if (hasFollowUp) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("completing all questions navigates to feedback", async ({ page }) => {
    await expect(page.locator(QUESTION_TEXT)).toBeVisible({ timeout: 15000 });

    // Count question tabs
    const tabs = page.locator("button").filter({ hasText: /^Q\d+$/ });
    const count = await tabs.count();

    for (let i = 0; i < count; i++) {
      // Wait for question to display
      await expect(page.locator(QUESTION_TEXT)).toBeVisible();

      // Fill answer
      await page.locator(ANSWER_TEXTAREA).fill(
        `Answer ${i + 1}: I have strong experience in this area and can discuss the key principles involved.`
      );

      // Submit
      await page.locator(SUBMIT_ANSWER_BUTTON).first().click();

      // Wait for processing
      await page.waitForTimeout(2000);

      // Skip follow-up if it appears
      const skipButton = page.getByText("Skip", { exact: false }).filter({
        has: page.locator("svg"),
      });
      if (await skipButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await skipButton.click();
        await page.waitForTimeout(500);
      }
    }

    // After all questions, should navigate to feedback page
    await page.waitForURL(/\/feedback$/, { timeout: 15000 });
    expect(page.url()).toContain("/feedback");
  });
});
