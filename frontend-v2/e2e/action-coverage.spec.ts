import { test, expect } from '@playwright/test';

const UI_TIMEOUT = 15000;

test.describe('production action coverage', () => {
  test('guest navigation controls are actionable', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Getting Nextess ready...', { exact: true })).toBeHidden({ timeout: UI_TIMEOUT });

    for (const label of ['Dashboard','Missions','Streaks & Leaderboard','Profile & Badges','Settings','About']) {
      const control = page.getByRole('button', { name: label, exact: false }).first();
      if (await control.isVisible().catch(() => false)) {
        await expect(control).toBeEnabled();
        await control.click();
      }
    }

    await expect(page.locator('main')).toBeVisible();
  });

  test('guest auth action opens and closes the auth modal', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Getting Nextess ready...', { exact: true })).toBeHidden({ timeout: UI_TIMEOUT });

    const authTrigger = page.getByRole('button', { name: /Sign In|Create account|Account/i }).first();
    await expect(authTrigger).toBeVisible({ timeout: UI_TIMEOUT });
    await authTrigger.click();

    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: UI_TIMEOUT });
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: UI_TIMEOUT });
  });

  test('visible production buttons have accessible names and are keyboard reachable', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Getting Nextess ready...', { exact: true })).toBeHidden({ timeout: UI_TIMEOUT });

    const unnamed = await page.locator('button:visible').evaluateAll((buttons) =>
      buttons.filter(button => {
        const aria = button.getAttribute('aria-label')?.trim();
        const text = (button.textContent || '').trim();
        return !aria && !text;
      }).map(button => button.outerHTML.slice(0, 200))
    );
    expect(unnamed, `Found visible buttons without accessible names: ${unnamed.join('\n')}`).toEqual([]);

    const firstButton = page.locator('button:visible').first();
    if (await firstButton.count()) {
      await firstButton.focus();
      await expect(firstButton).toBeFocused();
    }
  });

  test('layout remains usable at mobile and desktop widths', async ({ page }) => {
    for (const viewport of [{width:390,height:844},{width:1024,height:768},{width:1440,height:900}]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await expect(page.getByText('Getting Nextess ready...', { exact: true })).toBeHidden({ timeout: UI_TIMEOUT });
      await expect(page.locator('main')).toBeVisible();
      const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(horizontalOverflow, `Unexpected horizontal overflow at ${viewport.width}px`).toBeFalsy();
    }
  });
});
