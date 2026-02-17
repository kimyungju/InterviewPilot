import { test, expect } from "@playwright/test";
import { HERO_TITLE, HERO_CTA, NAV_SIGN_IN } from "../../helpers/selectors";

test.describe("Landing Page", () => {
  test("renders hero section with title and CTA", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator(HERO_TITLE)).toBeVisible();
    await expect(page.locator(HERO_CTA)).toBeVisible();
    await expect(page.locator(NAV_SIGN_IN)).toBeVisible();
  });

  test("sign-in link has correct href", async ({ page }) => {
    await page.goto("/");

    const href = await page.locator(NAV_SIGN_IN).getAttribute("href");
    expect(href).toBe("/dashboard");
  });

  test("CTA link has correct href", async ({ page }) => {
    await page.goto("/");

    const href = await page.locator(HERO_CTA).getAttribute("href");
    expect(href).toBe("/dashboard");
  });
});
