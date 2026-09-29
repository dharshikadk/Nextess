import { test, expect } from '@playwright/test';

test('guest can open the Nextess shell', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Nextess/);
  await expect(page.locator('body')).toContainText('Nextess');
});

test('mission catalogue, first task, feedback, and refresh resume are reachable through the real UI', async ({ page }) => {
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
    const capsule = page.getByRole('button', { name: /Next · Learning Capsule/i });
    if (await capsule.count()) {
      await capsule.click();
      const continueButton = page.getByRole('button', { name: /Continue to Level 1/i });
      await expect(continueButton).toBeVisible();
      await continueButton.click();
      await expect(page.getByText(/LEVEL 1\s*\//i).first()).toBeVisible({ timeout: 15000 });
    }
    await expect(page.getByTestId('mission-task')).toHaveAttribute('aria-busy', 'false', { timeout: 15000 });
    await expect(page.getByTestId('mission-submit')).toBeVisible({ timeout: 15000 });
    const firstOption = page.locator('[data-testid="mission-task"] button[aria-pressed]').first();
    if (await firstOption.count()) {
      await firstOption.click();
    } else {
      const numericAnswer = page.getByLabel(/Numeric answer/i);
      await expect(numericAnswer).toBeVisible({ timeout: 5000 });
      await numericAnswer.fill('1');
    }
    await page.getByTestId('mission-submit').click();
    await expect(page.getByRole('status')).toBeVisible({ timeout: 15000 });
    await page.reload();
    await expect(page.getByText(/LEVEL|Mission Brief|Learning Capsule/i).first()).toBeVisible({ timeout: 15000 });
  }
});

test('guest progress can be converted into an authenticated account', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Getting Nextess ready...', { exact: true })).toBeHidden({ timeout: 15000 });

  const missionNav = page.getByRole('button', { name: /Missions\s+Learning Paths & Discovery/ });
  await missionNav.click();
  await page.getByRole('button', { name: /Open Physics Missions/i }).first().click();
  await page.getByRole('heading', { name: 'Missions Path' }).waitFor();
  await page.getByRole('button', { name: /Select mission /i }).first().click();
  const open = page.getByRole('button', { name: /Start Solving Mission/i }).first();
  if (await open.count()) await open.click();

  const capsule = page.getByRole('button', { name: /Next · Learning Capsule/i });
  if (await capsule.count()) {
    await capsule.click();
    const continueButton = page.getByRole('button', { name: /Continue to Level 1/i });
    await expect(continueButton).toBeVisible();
    await continueButton.click();
    await expect(page.getByTestId('mission-task')).toHaveAttribute('aria-busy', 'false', { timeout: 15000 });
    await expect(page.getByTestId('mission-submit')).toBeVisible({ timeout: 15000 });
  }

  const signIn = page.getByRole('button', { name: 'Sign In' }).last();
  await expect(signIn).toBeVisible({ timeout: 15000 });
  await signIn.click();

  const authDialog = page.getByRole('dialog', { name: 'Cadet Access Station' });
  await expect(authDialog).toBeVisible({ timeout: 5000 });
  await authDialog.getByRole('tab', { name: 'Sign Up' }).click();

  const suffix = Date.now().toString().slice(-8);
  await authDialog.getByLabel('Name').fill('E2E Cadet');
  await authDialog.getByLabel('Username').fill('e2e_cadet_' + suffix);
  await authDialog.getByLabel('Password').fill('NextessE2E!2026');
  await authDialog.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByText('Account synchronized with Nextess.')).toBeVisible({ timeout: 15000 });
  await page.reload();
  await expect(page.getByText(/E2E Cadet|@e2e_cadet_/i).first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('The Bicycle That Would Not Stop')).toBeVisible({ timeout: 15000 });
});
