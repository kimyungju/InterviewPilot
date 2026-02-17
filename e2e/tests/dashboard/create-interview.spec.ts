import { test, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import {
  ADD_NEW_INTERVIEW,
  MODE_AUTO,
  START_INTERVIEW_BUTTON,
} from "../../helpers/selectors";

test.describe("Create Interview", () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/dashboard");
  });

  test("opens create dialog and shows mode selection", async ({ page }) => {
    await page.locator(ADD_NEW_INTERVIEW).click();

    // Mode selection should appear
    await expect(page.locator(MODE_AUTO)).toBeVisible();
  });

  test("auto mode: fill form and create interview", async ({ page }) => {
    await page.locator(ADD_NEW_INTERVIEW).click();
    await page.locator(MODE_AUTO).click();

    // Fill the form
    await page.locator("#jobPosition").fill("Software Engineer");
    await page.locator("#jobDesc").fill("Building scalable web applications with React and Node.js");
    await page.locator("#jobExperience").fill("3");

    // Submit form (goes to resume step)
    await page.locator('button[type="submit"]').click();

    // Should be on resume step — click Start Interview
    await expect(page.locator(START_INTERVIEW_BUTTON)).toBeVisible({
      timeout: 5000,
    });
    await page.locator(START_INTERVIEW_BUTTON).click();

    // Should redirect to interview setup page
    await page.waitForURL(/\/dashboard\/interview\/[\w-]+$/, {
      timeout: 30000,
    });
    expect(page.url()).toMatch(/\/dashboard\/interview\/[\w-]+$/);
  });

  test("back button returns to mode selection", async ({ page }) => {
    await page.locator(ADD_NEW_INTERVIEW).click();
    await page.locator(MODE_AUTO).click();

    // Should be on form step
    await expect(page.locator("#jobPosition")).toBeVisible();

    // Click Back
    await page.getByRole("button", { name: /back/i }).click();

    // Should return to mode selection
    await expect(page.locator(MODE_AUTO)).toBeVisible();
  });

  test("cancel button closes dialog", async ({ page }) => {
    await page.locator(ADD_NEW_INTERVIEW).click();
    await page.locator(MODE_AUTO).click();

    // Click Cancel
    await page.getByRole("button", { name: /cancel/i }).click();

    // Dialog should close — mode button should not be visible
    await expect(page.locator(MODE_AUTO)).not.toBeVisible();
  });
});
