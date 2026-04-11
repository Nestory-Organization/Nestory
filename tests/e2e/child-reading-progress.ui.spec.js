// @ts-check
const { test, expect } = require('@playwright/test');

const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Playwright Reader',
  email: 'pw-reader@nestory.com',
  role: 'child',
  childProfile: '507f1f77bcf86cd799439012',
  mustChangePassword: false,
  isActive: true,
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
};

const progressOverview = {
  generatedAt: '2026-04-10T12:00:00.000Z',
  summary: {
    activeWithDeadline: 0,
    overdueCount: 0,
    completedOnTime: 0,
    completedEarly: 0,
    completedLate: 0,
  },
  assignments: [],
};

const activitySummary = {
  days: 7,
  periodStart: '2026-04-03T00:00:00.000Z',
  periodEnd: '2026-04-10T23:59:59.999Z',
  totalPagesLogged: 42,
  totalMinutesLogged: 35,
  progressSaveCount: 6,
};

test.describe('Child reading progress & analytics UI', () => {
  test('shows weekly pages and minutes from reading analytics API', async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockUser }),
      });
    });

    await page.route('**/api/assignments/me/progress', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: progressOverview }),
      });
    });

    await page.route('**/api/sessions/me/activity-summary**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: activitySummary }),
      });
    });

    await page.addInitScript(
      ({ token, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: user._id,
            name: user.name,
            email: user.email,
            role: 'child',
            childProfile: user.childProfile,
            mustChangePassword: user.mustChangePassword,
            isActive: true,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }),
        );
      },
      { token: 'playwright-mock-jwt', user: mockUser },
    );

    await page.goto('/child/progress');

    await expect(page.getByRole('heading', { name: /your reading progress/i })).toBeVisible();
    const weekSection = page.locator('.card').filter({ hasText: 'This week' });
    await expect(weekSection).toBeVisible();
    await expect(
      weekSection.locator('.rounded-lg').filter({ hasText: 'Pages' }).getByText('42', { exact: true }),
    ).toBeVisible();
    await expect(
      weekSection.locator('.rounded-lg').filter({ hasText: 'Minutes' }).getByText('35', { exact: true }),
    ).toBeVisible();
    await expect(
      weekSection.locator('.rounded-lg').filter({ hasText: 'Saves' }).getByText('6', { exact: true }),
    ).toBeVisible();
  });
});
