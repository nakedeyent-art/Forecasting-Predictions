import { expect, test } from "@playwright/test";

test("analyzes a decision and exposes the in-app manual", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Decision Workspace" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Instruction Manual" })).toBeVisible();

  const analyzeButton = page.getByRole("button", { name: /Analyze Decision/i });
  await expect(analyzeButton).toBeEnabled();
  await page.waitForTimeout(500);
  await analyzeButton.click();
  await expect(page.getByText("What would change my mind", { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Illustrative fallback evidence")).toBeVisible();
});
