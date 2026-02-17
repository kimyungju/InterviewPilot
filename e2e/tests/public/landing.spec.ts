import { test, expect } from "@playwright/test";
import { HERO_TITLE, HERO_CTA, NAV_SIGN_IN } from "../../helpers/selectors";

test.describe("Landing Page", () => {
  test("renders hero section with title and CTA", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator(HERO_TITLE)).toBeVisible();
    await expect(page.locator(HERO_CTA)).toBeVisible();
    await expect(page.locator(NAV_SIGN_IN)).toBeVisible();
  });

  test("sign-in link navigates toward dashboard", async ({ page }) => {
    await page.goto("/");

    await page.locator(NAV_SIGN_IN).click();

    // Should redirect to /dashboard or Clerk sign-in
    await expect(page).not.toHaveURL("/");
  });

  test("CTA button navigates toward dashboard", async ({ page }) => {
    await page.goto("/");

    await page.locator(HERO_CTA).click();

    await expect(page).not.toHaveURL("/");
  });
});
