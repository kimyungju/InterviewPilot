import { test, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { INTERVIEW_CARD } from "../../helpers/selectors";
import { createMockInterview } from "../../helpers/interview-factory";

test.describe("Delete Interview", () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/dashboard");
  });

  test("accepting confirm dialog removes the interview card", async ({
    page,
  }) => {
    // Create an interview to delete
    const mockId = await createMockInterview(page);

    // Go back to dashboard
    await page.goto("/dashboard");
    await expect(page.locator(INTERVIEW_CARD).first()).toBeVisible();

    const initialCount = await page.locator(INTERVIEW_CARD).count();

    // Accept the confirmation dialog
    page.on("dialog", (dialog) => dialog.accept());

    // Click the delete button (Trash2 icon button) on the first card
    await page
      .locator(INTERVIEW_CARD)
      .first()
      .locator("button")
      .first()
      .click();

    // Card count should decrease
    await expect(page.locator(INTERVIEW_CARD)).toHaveCount(initialCount - 1, {
      timeout: 10000,
    });
  });

  test("dismissing confirm dialog keeps the card", async ({ page }) => {
    // Ensure there's at least one card
    const cards = page.locator(INTERVIEW_CARD);
    const initialCount = await cards.count();

    if (initialCount === 0) {
      await createMockInterview(page);
      await page.goto("/dashboard");
    }

    const countBefore = await page.locator(INTERVIEW_CARD).count();

    // Dismiss the confirmation dialog
    page.on("dialog", (dialog) => dialog.dismiss());

    // Click delete on the first card
    await page
      .locator(INTERVIEW_CARD)
      .first()
      .locator("button")
      .first()
      .click();

    // Card count should remain the same
    await expect(page.locator(INTERVIEW_CARD)).toHaveCount(countBefore);
  });
});
