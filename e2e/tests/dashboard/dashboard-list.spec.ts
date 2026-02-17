import { test, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import {
  DASHBOARD_TITLE,
  INTERVIEW_GRID,
  INTERVIEW_CARD,
  CARD_JOB_POSITION,
  CARD_FEEDBACK_LINK,
  CARD_START_LINK,
} from "../../helpers/selectors";

test.describe("Dashboard List", () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/dashboard");
  });

  test("loads dashboard with title visible", async ({ page }) => {
    await expect(page.locator(DASHBOARD_TITLE)).toBeVisible();
  });

  test("displays interview grid", async ({ page }) => {
    await expect(page.locator(INTERVIEW_GRID)).toBeVisible();
  });

  test("interview cards show job position and action links", async ({
    page,
  }) => {
    // Check if there are interview cards (may be empty for new test user)
    const cards = page.locator(INTERVIEW_CARD);
    const count = await cards.count();

    if (count > 0) {
      // First card should have job position text
      await expect(cards.first().locator(CARD_JOB_POSITION)).toBeVisible();

      // Action links should be present
      await expect(cards.first().locator(CARD_FEEDBACK_LINK)).toBeVisible();
      await expect(cards.first().locator(CARD_START_LINK)).toBeVisible();
    }
  });

  test("start link navigates to interview setup page", async ({ page }) => {
    const cards = page.locator(INTERVIEW_CARD);
    const count = await cards.count();

    if (count > 0) {
      const startLink = cards.first().locator(CARD_START_LINK);
      await startLink.click();
      await expect(page).toHaveURL(/\/dashboard\/interview\/[\w-]+$/);
    }
  });
});
