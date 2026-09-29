import { test, expect } from '@playwright/test';

test('guest can open the Nextess shell', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Nextess/);
  await expect(page.locator('body')).toContainText('Nextess');
});

test('mission catalogue and runtime are reachable through the real UI', async ({ page }) => {
  await page.goto('/');
  const missionNav = page.getByText('Missions', { exact: true }).first();
  await expect(missionNav).toBeVisible();
  await missionNav.click();
  await expect(page.getByText(/Missions Path|Mission Catalogue/)).toBeVisible();

  const missionButton = page.getByRole('button', { name: /Mission 01|Select mission/i }).first();
  if (await missionButton.count()) {
    await missionButton.click();
    const open = page.getByRole('button', { name: /Open Mission Stages|Continue Mission/i }).first();
    if (await open.count()) {
      await open.click();
      await expect(page.getByText(/Mission Brief|Learning Capsule|LEVEL/i)).toBeVisible();
    }
  }
});
