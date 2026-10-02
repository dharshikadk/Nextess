import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 90_000 });

const UI_TIMEOUT = 30_000;

async function prepareMissionAccess(
  page: import('@playwright/test').Page,
  missionTitle: string,
) {
  const token = process.env.E2E_TEST_TOKEN;
  if (!token) throw new Error('E2E_TEST_TOKEN is required for locked mission fixtures.');
  const apiBase = process.env.E2E_API_BASE_URL || 'http://127.0.0.1:4000';
  const response = await page.request.post(apiBase + '/v1/test/prepare-mission-access', {
    headers: { 'X-E2E-Token': token },
    data: { missionTitle },
  });
  expect(response.ok()).toBeTruthy();
  const credentials = await response.json();
  const login = await page.request.post(apiBase + '/v1/auth/login', { data: {
    username: credentials.username,
    password: credentials.password,
  }});
  expect(login.ok()).toBeTruthy();
}

async function reachMissionTask(
  page: import('@playwright/test').Page,
  missionTitle = 'The Bicycle That Would Not Stop',
  options: { prepareAccess?: boolean } = {},
) {
  if (options.prepareAccess) await prepareMissionAccess(page, missionTitle);
  await expect(page.getByText('Getting Nextess ready...', { exact: true })).toBeHidden({ timeout: UI_TIMEOUT });
  await page.getByRole('button', { name: /Missions\s+Learning Paths & Discovery/ }).click();

  const trackPattern = /The Bus Fare Decision|The Canteen Price Problem/.test(missionTitle)
    ? /Open Economics Missions/i
    : /Open Physics Missions/i;
  await page.getByRole('button', { name: trackPattern }).first().click();

  await expect(page.getByRole('heading', { name: 'Missions Path' })).toBeVisible({ timeout: UI_TIMEOUT });
  const missionNode = page.getByRole('button', { name: `Select mission ${missionTitle}`, exact: true });
  await expect(missionNode).toBeVisible({ timeout: UI_TIMEOUT });
  await missionNode.click();

  const missionPreview = page.getByRole('dialog', { name: missionTitle, exact: true });
  if (await missionPreview.isVisible().catch(() => false)) {
    await missionPreview.getByRole('button', { name: /Close mission details/i }).click();
    await expect(missionPreview).toBeHidden({ timeout: 5000 });
  }

  const open = page.getByRole('button', { name: /Start Solving Mission/i });
  await expect(open).toBeVisible({ timeout: UI_TIMEOUT });
  await expect(open).toBeEnabled({ timeout: UI_TIMEOUT });
  await open.click();

  await expect(page.getByRole('heading', { name: missionTitle, exact: true })).toBeVisible({ timeout: UI_TIMEOUT });
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

async function reachFirstMissionTask(page: import('@playwright/test').Page) {
  return reachMissionTask(page);
}

test('guest can open the Nextess shell', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Nextess/);
  await expect(page.locator('body')).toContainText('Nextess');
});

test('mission stage opens its metadata panel on the first click', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Getting Nextess ready...', { exact: true })).toBeHidden({ timeout: UI_TIMEOUT });
  await page.getByRole('button', { name: /Missions\s+Learning Paths & Discovery/ }).click();
  await page.getByRole('button', { name: /Open Physics Missions/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Missions Path' })).toBeVisible({ timeout: UI_TIMEOUT });

  const missionNode = page.getByTestId('mission-node').first();
  await missionNode.click();
  const missionTitle = (await missionNode.getAttribute('aria-label'))!.replace(/^Select mission /, '');
  const preview = page.getByRole('dialog', { name: missionTitle, exact: true });
  await expect(preview).toBeVisible({ timeout: UI_TIMEOUT });
  await preview.getByRole('button', { name: /Close mission details/i }).click();
  await expect(preview).toBeHidden({ timeout: 5000 });

  // The mission preview is an overlay on the mission map. Close it, then enter
  // the mission detail view through the real user-facing CTA before inspecting
  // the stage ladder.
  const startMission = page.getByRole('button', { name: /Start Solving Mission/i });
  await expect(startMission).toBeVisible({ timeout: UI_TIMEOUT });
  await startMission.click();
  await expect(page.getByRole('heading', { name: missionTitle, exact: true })).toBeVisible({ timeout: UI_TIMEOUT });

  const stage = page.getByRole('button', { name: /Stage 01.*Mission Brief/i });
  await expect(stage).toBeVisible({ timeout: UI_TIMEOUT });
  await stage.click();

  const stageDialog = page.getByRole('dialog', { name: 'Mission Brief', exact: true });
  await expect(stageDialog).toBeVisible({ timeout: UI_TIMEOUT });
  await expect(stageDialog).toContainText('Role');
  await expect(stageDialog).toContainText('Concept used');
  await expect(stageDialog).toContainText('KP earned');
  await expect(stageDialog).toContainText('Coins earned');
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


test('solar panel simulation controller state persists after refresh', async ({ page }) => {
  await page.goto('/');
  await reachMissionTask(page, 'The Solar Panel That Lost Power', { prepareAccess: true });

  const iframe = page.locator('iframe[title="Nextess mission simulation"]');
  await expect(iframe).toBeVisible({ timeout: UI_TIMEOUT });
  const frame = page.frameLocator('iframe[title="Nextess mission simulation"]');
  await expect(frame.locator('[aria-label="Solar panel angle simulation"]')).toBeVisible({ timeout: UI_TIMEOUT });

  const angle = frame.locator('input[type="range"][aria-label="Sunlight angle"]');
  const power = frame.locator('input[type="range"][aria-label="Maximum panel power"]');
  const saveResponse = page.waitForResponse((response) =>
    response.url().includes('/v1/investigations/') &&
    response.url().endsWith('/simulation-state') &&
    response.request().method() === 'POST',
  );
  await angle.fill('42');
  const solarSave = await saveResponse;
  expect(solarSave.status(), await solarSave.text()).toBe(200);
  await expect.poll(async () => angle.inputValue()).toBe('42');

  const powerSave = page.waitForResponse((response) =>
    response.url().includes('/v1/investigations/') &&
    response.url().endsWith('/simulation-state') &&
    response.request().method() === 'POST',
  );
  await power.fill('150');
  const powerResponse = await powerSave;
  expect(powerResponse.status(), await powerResponse.text()).toBe(200);

  await page.reload();
  const restoredFrame = page.frameLocator('iframe[title="Nextess mission simulation"]');
  await expect(restoredFrame.locator('[aria-label="Solar panel angle simulation"]')).toBeVisible({ timeout: UI_TIMEOUT });
  await expect.poll(async () => restoredFrame.locator('input[type="range"][aria-label="Sunlight angle"]').inputValue()).toBe('42');
  await expect.poll(async () => restoredFrame.locator('input[type="range"][aria-label="Maximum panel power"]').inputValue()).toBe('150');
});

test('bus fare simulation controller state persists after refresh', async ({ page }) => {
  await page.goto('/');
  await reachMissionTask(page, 'The Bus Fare Decision', { prepareAccess: true });

  const iframe = page.locator('iframe[title="Nextess mission simulation"]');
  await expect(iframe).toBeVisible({ timeout: UI_TIMEOUT });
  const frame = page.frameLocator('iframe[title="Nextess mission simulation"]');
  await expect(frame.locator('[aria-label="Bus fare demand simulation"]')).toBeVisible({ timeout: UI_TIMEOUT });

  const fare = frame.locator('input[type="range"][aria-label="Bus fare"]');
  const saveResponse = page.waitForResponse((response) =>
    response.url().includes('/v1/investigations/') &&
    response.url().endsWith('/simulation-state') &&
    response.request().method() === 'POST',
  );
  await fare.fill('14');
  const busSave = await saveResponse;
  expect(busSave.status(), await busSave.text()).toBe(200);

  const competitor = frame.getByRole('button', { name: /OFF — ORIGINAL MARKET/i });
  const competitorSave = page.waitForResponse((response) =>
    response.url().includes('/v1/investigations/') &&
    response.url().endsWith('/simulation-state') &&
    response.request().method() === 'POST',
  );
  await competitor.click();
  const competitorResponse = await competitorSave;
  expect(competitorResponse.status(), await competitorResponse.text()).toBe(200);

  await page.reload();
  const restoredFrame = page.frameLocator('iframe[title="Nextess mission simulation"]');
  await expect(restoredFrame.locator('[aria-label="Bus fare demand simulation"]')).toBeVisible({ timeout: UI_TIMEOUT });
  await expect.poll(async () => restoredFrame.locator('input[type="range"][aria-label="Bus fare"]').inputValue()).toBe('14');
  await expect(restoredFrame.getByRole('button', { name: /ON — DEMAND SHIFT/i })).toBeVisible();
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
