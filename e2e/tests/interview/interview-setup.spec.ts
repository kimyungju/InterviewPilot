import { test, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import {
  SETUP_POSITION,
  START_INTERVIEW_BUTTON,
} from "../../helpers/selectors";
import { createMockInterview } from "../../helpers/interview-factory";

test.describe("Interview Setup", () => {
  let mockId: string;

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/dashboard");
    mockId = await createMockInterview(page);
  });

  test("displays job position and tips section", async ({ page }) => {
    // Should already be on setup page after createMockInterview
    await expect(page.locator(SETUP_POSITION)).toBeVisible();
    await expect(page.locator(SETUP_POSITION)).toHaveText("Test Engineer");

    // Tips section should be visible (lightbulb icon section)
    await expect(
      page.locator("text=Before You Begin").or(page.locator("text=시작하기 전에"))
    ).toBeVisible();
  });

  test("start interview button navigates to /start", async ({ page }) => {
    await expect(page.locator(START_INTERVIEW_BUTTON)).toBeVisible();
    await page.locator(START_INTERVIEW_BUTTON).click();

    await page.waitForURL(/\/start$/);
    expect(page.url()).toContain(`/dashboard/interview/${mockId}/start`);
  });
});
