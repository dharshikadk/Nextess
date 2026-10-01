import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 90_000 });

const UI_TIMEOUT = 30_000;

async function reachFirstMissionTask(page: import('@playwright/test').Page) {
  await expect(page.getByText('Getting Nextess ready...', { exact: true })).toBeHidden({ timeout: UI_TIMEOUT });
  await page.getByRole('button', { name: /Missions\s+Learning Paths & Discovery/ }).click();
  await page.getByRole('button', { name: /Open Physics Missions/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Missions Path' })).toBeVisible({ timeout: UI_TIMEOUT });
  const missionNode = page.getByTestId('mission-node').first();
  await expect(missionNode).toBeVisible({ timeout: UI_TIMEOUT });
  await expect(missionNode).toHaveAttribute('aria-label', /Select mission .+/);
  await missionNode.click();
  // Selecting a mission opens the mission-preview dialog. Close that overlay
  // before interacting with the detail-panel CTA underneath it; using .first()
  // here would otherwise resolve the covered button and wait for it to become clickable.
  const missionPreview = page.getByRole('dialog', { name: /The Bicycle That Would Not Stop/i });
  if (await missionPreview.isVisible().catch(() => false)) {
    await missionPreview.getByRole('button', { name: /Close mission details/i }).click();
    await expect(missionPreview).toBeHidden({ timeout: 5000 });
  }

  const open = page.getByRole('button', { name: /Start Solving Mission/i });
  await expect(open).toBeVisible({ timeout: UI_TIMEOUT });
  await expect(open).toBeEnabled({ timeout: UI_TIMEOUT });
  await open.click();

  // "Start Solving Mission" opens the mission file. The runtime is entered
  // from the mission-detail page through its explicit stage control.
  await expect(page.getByRole('heading', { name: /The Bicycle That Would Not Stop/i })).toBeVisible({ timeout: UI_TIMEOUT });
  const openStages = page.getByRole('button', { name: /Open Mission Stages/i });
  await expect(openStages).toBeVisible({ timeout: UI_TIMEOUT });
  await openStages.click();

  await expect(page.getByTestId('mission-runtime-loading')).toBeHidden({ timeout: UI_TIMEOUT });
  await expect(page.getByTestId('mission-runtime-error')).toBeHidden({ timeout: UI_TIMEOUT });
  const missionRuntime = page.getByTestId('mission-runtime');
  await expect(missionRuntime).toBeVisible({ timeout: UI_TIMEOUT });

  const briefStart = page.getByTestId('mission-brief-start');
  await expect(briefStart).toBeVisible({ timeout: UI_TIMEOUT });
  const briefLabel = await briefStart.textContent();
  await briefStart.click();

  if (briefLabel?.includes('Learning Capsule')) {
    const continueButton = page.getByRole('button', { name: /Continue to Level 1/i });
    const nextConceptButton = page.getByRole('button', { name: /Next Concept/i });

    for (let section = 0; section < 20; section += 1) {
      if (await continueButton.isVisible().catch(() => false)) {
        await continueButton.click();
        break;
      }

      await expect(nextConceptButton).toBeVisible({ timeout: UI_TIMEOUT });
      await nextConceptButton.click();
    }

    await expect(page.getByTestId('mission-task')).toBeVisible({ timeout: UI_TIMEOUT });
  }

  const missionTask = page.getByTestId('mission-task');
  await expect(missionTask).toBeVisible({ timeout: UI_TIMEOUT });
  await expect(missionTask).toHaveAttribute('aria-busy', 'false', { timeout: UI_TIMEOUT });
  await expect(missionTask.locator('h2')).not.toContainText('Loading investigation task', { timeout: UI_TIMEOUT });
  await expect(page.getByTestId('mission-submit')).toBeVisible({ timeout: UI_TIMEOUT });
}

test('guest can open the Nextess shell', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Nextess/);
  await expect(page.locator('body')).toContainText('Nextess');
});

test('mission catalogue, first task, feedback, and refresh resume are reachable through the real UI', async ({ page }) => {
  await page.goto('/');
  await reachFirstMissionTask(page);

  const firstOption = page.locator('[data-testid="mission-task"] button[aria-pressed]').first();
  if (await firstOption.count()) {
    await firstOption.click();
  } else {
    const numericAnswer = page.getByLabel(/Numeric answer/i).first();
    await expect(numericAnswer).toBeVisible({ timeout: 5000 });
    await numericAnswer.fill('1');
  }
  await page.getByTestId('mission-submit').click();
  await expect(page.getByRole('status')).toBeVisible({ timeout: UI_TIMEOUT });
  await page.reload();
  await expect(page.getByText(/LEVEL|Mission Brief|Learning Capsule/i).first()).toBeVisible({ timeout: UI_TIMEOUT });
});

test('guest progress can be converted into an authenticated account', async ({ page }) => {
  await page.goto('/');
  await reachFirstMissionTask(page);

  const signIn = page.getByRole('button', { name: 'Sign In' }).last();
  await expect(signIn).toBeVisible({ timeout: UI_TIMEOUT });
  await signIn.click();

  const authDialog = page.getByRole('dialog', { name: 'Cadet Access Station' });
  await expect(authDialog).toBeVisible({ timeout: 5000 });
  await authDialog.getByRole('tab', { name: 'Sign Up', exact: true }).click();

  const suffix = Date.now().toString().slice(-8);
  await authDialog.getByLabel('Name', { exact: true }).fill('E2E Cadet');
  await authDialog.getByLabel('Username', { exact: true }).fill('e2e_cadet_' + suffix);
  await authDialog.getByLabel('Password', { exact: true }).fill('NextessE2E!2026');
  const authMeResponse = page.waitForResponse((response) =>
    response.url().includes('/v1/auth/me') && response.request().method() === 'GET' && response.status() === 200,
  );
  await authDialog.getByRole('button', { name: 'Create account', exact: true }).click();

  await expect(page.getByText('Account synchronized with Nextess.')).toBeVisible({ timeout: UI_TIMEOUT });
  await authMeResponse;
  await page.reload();
  await expect(page.getByTestId('authenticated-user-name')).toHaveText('E2E Cadet', { timeout: UI_TIMEOUT });
  await expect(page.getByTestId('authenticated-user-handle')).toContainText('e2e_cadet_', { timeout: UI_TIMEOUT });
  await expect(page.getByText('The Bicycle That Would Not Stop')).toBeVisible({ timeout: UI_TIMEOUT });
});


test('API exposes health, readiness, correlation and security headers', async ({ page }) => {
  const apiBase = process.env.E2E_API_BASE_URL || 'http://127.0.0.1:4000';
  const response = await page.request.get(apiBase + '/health', {
    headers: { 'X-Request-Id': 'e2e-health-check' },
  });
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['x-request-id']).toBe('e2e-health-check');
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  expect(response.headers()['x-frame-options']).toBe('DENY');
  await expect.poll(async () => (await page.request.get(apiBase + '/ready')).status()).toBe(200);
});

test('mobile-sized mission shell remains horizontally usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByText('Nextess').first()).toBeVisible({ timeout: UI_TIMEOUT });
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});

test('logout invalidates the server-side cookie session', async ({ page }) => {
  await page.goto('/');
  const signIn = page.getByRole('button', { name: 'Sign In' }).last();
  await expect(signIn).toBeVisible({ timeout: UI_TIMEOUT });
  await signIn.click();

  const authDialog = page.getByRole('dialog', { name: 'Cadet Access Station' });
  await authDialog.getByRole('tab', { name: 'Sign Up', exact: true }).click();

  const suffix = Date.now().toString().slice(-8);
  await authDialog.getByLabel('Name', { exact: true }).fill('Logout E2E Cadet');
  await authDialog.getByLabel('Username', { exact: true }).fill('logout_e2e_' + suffix);
  await authDialog.getByLabel('Password', { exact: true }).fill('NextessE2E!2026');
  const authMeResponse = page.waitForResponse((response) =>
    response.url().includes('/v1/auth/me') && response.request().method() === 'GET' && response.status() === 200,
  );
  await authDialog.getByRole('button', { name: 'Create account', exact: true }).click();

  await expect(page.getByText('Account synchronized with Nextess.')).toBeVisible({ timeout: UI_TIMEOUT });
  await authMeResponse;
  const apiBase = process.env.E2E_API_BASE_URL || 'http://127.0.0.1:4000';
  expect((await page.request.get(apiBase + '/v1/auth/me')).status()).toBe(200);
  expect((await page.request.post(apiBase + '/v1/auth/logout')).status()).toBe(200);
  expect((await page.request.get(apiBase + '/v1/auth/me')).status()).toBe(401);
});


test('mission simulation asset loads and controller state restores after refresh', async ({ page }) => {
  await page.goto('/');
  await reachFirstMissionTask(page);

  const iframe = page.locator('iframe[title="Nextess mission simulation"]');
  await expect(iframe).toBeVisible({ timeout: UI_TIMEOUT });
  const frame = page.frameLocator('iframe[title="Nextess mission simulation"]');
  await expect(frame.locator('[aria-label="Bicycle braking simulation"]')).toBeVisible({ timeout: UI_TIMEOUT });

  const mass = frame.getByLabel('Total mass');
  await expect(mass).toBeVisible();
  const saveResponse = page.waitForResponse((response) =>
    response.url().includes('/v1/investigations/') &&
    response.url().endsWith('/simulation-state') &&
    response.request().method() === 'POST' &&
    response.status() === 200,
  );
  await mass.fill('72');
  await saveResponse;
  await expect.poll(async () => mass.inputValue()).toBe('72');

  await page.reload();
  await expect(page.getByTestId('mission-runtime-loading')).toBeHidden({ timeout: UI_TIMEOUT });
  await expect(page.getByTestId('mission-runtime-error')).toBeHidden({ timeout: UI_TIMEOUT });
  await expect(page.getByTestId('mission-runtime')).toBeVisible({ timeout: UI_TIMEOUT });
  await expect(page.getByTestId('mission-task')).toBeVisible({ timeout: UI_TIMEOUT });
  await expect(page.getByTestId('mission-task')).toHaveAttribute('aria-busy', 'false', { timeout: UI_TIMEOUT });
  const restoredFrame = page.frameLocator('iframe[title="Nextess mission simulation"]');
  await expect(restoredFrame.locator('[aria-label="Bicycle braking simulation"]')).toBeVisible({ timeout: UI_TIMEOUT });
  const restoredMass = restoredFrame.getByLabel('Total mass');
  await expect(restoredMass).toBeVisible({ timeout: UI_TIMEOUT });
  await expect.poll(async () => restoredMass.inputValue()).toBe('72');
});
