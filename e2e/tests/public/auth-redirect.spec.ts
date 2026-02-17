import { test, expect } from "@playwright/test";

test.describe("Auth Redirects", () => {
  test("unauthenticated visit to /dashboard redirects to sign-in", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Clerk middleware should redirect unauthenticated users
    // The URL should no longer be /dashboard
    await page.waitForURL((url) => !url.pathname.startsWith("/dashboard"), {
      timeout: 10000,
    });

    const url = page.url();
    // Should be redirected to sign-in page or Clerk's auth URL
    expect(
      url.includes("/sign-in") || url.includes("clerk")
    ).toBeTruthy();
  });
});
