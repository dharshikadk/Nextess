import { test, expect } from '@playwright/test';

test('guest can open the Nextess shell', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Nextess/);
  await expect(page.locator('body')).toContainText('Nextess');
});

test('mission catalogue and runtime are reachable through the real UI', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Getting Nextess ready...', { exact: true })).toBeHidden({ timeout: 15000 });

  const missionNav = page.getByRole('button', { name: /Missions\s+Learning Paths & Discovery/ });
  await expect(missionNav).toBeVisible();
  await missionNav.click();

  // "Missions" is the discovery entry point; the actual catalogue is the
  // Missions Path screen selected by the discipline card.
  const physicsCard = page.getByRole('button', { name: /Open Physics Missions/i }).first();
  await expect(physicsCard).toBeVisible({ timeout: 15000 });
  await physicsCard.click();

  await expect(page.getByRole('heading', { name: 'Missions Path' })).toBeVisible({ timeout: 15000 });

  const missionButton = page.getByRole('button', { name: /Select mission /i }).first();
  await expect(missionButton).toBeVisible({ timeout: 15000 });
  await missionButton.click();

  // Mission selection is intentionally single-click; opening a mission is a
  // separate action in the real UI.
  const open = page.getByRole('button', { name: /Start Solving Mission/i }).first();
  if (await open.count()) {
    await open.click();
    await expect(page.getByText(/Mission Brief|Learning Capsule|LEVEL/i).first()).toBeVisible({ timeout: 15000 });
  }
});
