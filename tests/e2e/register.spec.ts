import { test, expect } from '@playwright/test';

// 登録画面（RegisterPage）E2Eテスト
// 対象: src/pages/RegisterPage.tsx（screen === 'register' の場合に表示、URLは "/" 固定）
// 仕様書: docs/e2e-specs/register-e2e.md（E2E-REG-001〜006）
//
// ページ並列実行モード: 全 test() を有効化（test.only なし）
// 各テストは独立した browser context で実行されるため localStorage は自動的に未登録状態から始まる

// 登録画面へは直接URLがないため、ホーム画面から遷移するヘルパー
const goToRegisterPage = async (page: import('@playwright/test').Page) => {
  await page.goto('/');
  await page.getByRole('button', { name: /自分のコを登録する/ }).click();
  await expect(page.getByRole('heading', { name: 'このコについて' })).toBeVisible();
};

const PHOTO_PATH = '/home/yosy/MyFirstApp/chuck.jpg';

test('E2E-REG-001: 種類選択フロー', async ({ page }) => {
  await goToRegisterPage(page);

  const catButton = page.getByRole('button', { name: /ねこ/ });
  await expect(catButton).toBeVisible();

  // 未選択状態を確認
  await expect(catButton).not.toHaveClass(/bg-amber-400/);

  await catButton.click();

  // 選択状態（強調表示）になることを確認
  await expect(catButton).toHaveClass(/bg-amber-400/);
});

test('E2E-REG-002: ステータス選択フロー', async ({ page }) => {
  await goToRegisterPage(page);

  const livingButton = page.getByRole('button', { name: /今いるコ/ });
  await expect(livingButton).toBeVisible();

  // 未選択状態を確認
  await expect(livingButton).not.toHaveClass(/bg-amber-50/);

  await livingButton.click();

  // 選択状態になることを確認
  await expect(livingButton).toHaveClass(/bg-amber-50/);
  await expect(livingButton).toHaveClass(/border-amber-400/);
});

test('E2E-REG-003: 名前未入力時のボタン無効化', async ({ page }) => {
  await goToRegisterPage(page);

  const submitButton = page.getByRole('button', { name: /登録する/ });

  // 名前欄が空のまま → 登録ボタンは disabled
  await expect(submitButton).toBeDisabled();

  // 名前を入力すると有効化される
  await page.getByPlaceholder('例：チャック').fill('ポチ');
  await expect(submitButton).toBeEnabled();
});

test('E2E-REG-004: 登録完了フロー', async ({ page }) => {
  await goToRegisterPage(page);

  const petName = 'モモ';
  const petPersonality = '元気いっぱいで甘えん坊';

  await page.getByPlaceholder('例：チャック').fill(petName);
  await page.getByRole('button', { name: /いぬ/ }).click();
  await page.getByRole('button', { name: /今いるコ/ }).click();
  await page.getByPlaceholder(/甘えん坊で食いしん坊/).fill(petPersonality);
  await page.getByPlaceholder(/おやつ、お散歩/).fill('おもちゃ、おさんぽ');

  await page.getByRole('button', { name: /登録する/ }).click();

  // マイペット画面に遷移し、入力した名前・性格が表示される
  await expect(page.getByRole('heading', { name: petName })).toBeVisible();
  await expect(page.getByText(petPersonality)).toBeVisible();
});

test('E2E-REG-005: もどる導線（未登録時）', async ({ page }) => {
  await goToRegisterPage(page);

  await page.getByRole('button', { name: /もどる/ }).click();

  // 未登録状態のため、ホーム画面（サンプル体験）に戻る
  await expect(page.getByRole('button', { name: /自分のコを登録する/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'このコについて' })).not.toBeVisible();
});

test('E2E-REG-006: 写真アップロードフロー', async ({ page }) => {
  await goToRegisterPage(page);

  // アップロード前はカメラ絵文字プレースホルダーが表示されている
  await expect(page.getByText('📷')).toBeVisible();

  // 写真ファイルを選択
  await page.locator('input[type="file"]').setInputFiles(PHOTO_PATH);

  // 選択した画像がプレビューとして円形写真エリアに表示される
  await expect(page.getByAltText('pet')).toBeVisible();
});
