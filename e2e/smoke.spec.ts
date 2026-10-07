import { expect, test } from '@playwright/test';

test('boots the static build without outbound requests', async ({ page }) => {
  const outbound: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1')) outbound.push(request.url());
  });
  await page.goto('./');
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Пушистое бюро');
  expect(outbound).toEqual([]);
});
