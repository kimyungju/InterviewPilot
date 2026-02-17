import { test, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import {
  OVERALL_RATING,
  FEEDBACK_QUESTION,
  BACK_TO_DASHBOARD,
} from "../../helpers/selectors";
import {
  createMockInterview,
  completeInterview,
} from "../../helpers/interview-factory";

test.describe("Feedback Display", () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/dashboard");

    // Create and complete an interview to generate feedback
    const mockId = await createMockInterview(page);
    await page.goto(`/dashboard/interview/${mockId}/start`);
    await completeInterview(page);

    // Should now be on the feedback page
    await page.waitForURL(/\/feedback$/, { timeout: 30000 });
  });

  test("displays overall rating", async ({ page }) => {
    await expect(page.locator(OVERALL_RATING)).toBeVisible({ timeout: 10000 });

    const ratingText = await page.locator(OVERALL_RATING).textContent();
    // Should contain a number like "4.0" and "/5"
    expect(ratingText).toMatch(/\d+\.?\d*\/5/);
  });

  test("shows collapsible question sections", async ({ page }) => {
    const questions = page.locator(FEEDBACK_QUESTION);
    await expect(questions.first()).toBeVisible({ timeout: 10000 });

    const count = await questions.count();
    expect(count).toBeGreaterThan(0);
  });

  test("expanding a question shows feedback details", async ({ page }) => {
    const firstQuestion = page.locator(FEEDBACK_QUESTION).first();
    await expect(firstQuestion).toBeVisible({ timeout: 10000 });

    // Click to expand
    await firstQuestion.click();

    // Expanded content should show rating and feedback sections
    await expect(page.getByText(/\/5/).first()).toBeVisible();
  });

  test("back to dashboard button works", async ({ page }) => {
    await expect(page.locator(BACK_TO_DASHBOARD)).toBeVisible({
      timeout: 10000,
    });
    await page.locator(BACK_TO_DASHBOARD).click();

    await page.waitForURL("**/dashboard");
    expect(page.url()).toContain("/dashboard");
  });
});
