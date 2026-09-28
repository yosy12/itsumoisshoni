import { test, expect } from '@playwright/test';
import { actions } from '../../src/data/scenes';

// ホーム画面（サンプル体験）E2Eテスト
// 対象: src/pages/HomePage.tsx（未登録時のトップ画面、URLは "/" 固定・screen state で切替）
// 仕様書: docs/e2e-specs/home-e2e.md（E2E-HOME-001〜005）
//
// ページ並列実行モード: 全 test() を有効化（test.only なし）

// アクションボタンのラベル（時間帯によって表示されるアクションが変わるため、
// scenes.ts から動的に取得して正規表現化する。ハードコードしない）
const actionLabelPattern = new RegExp(actions.map(a => a.label).join('|'));

// サンプルペット1件目・2件目の名前（src/data/samplePets.ts に基づく固定値）
const FIRST_PET_NAME = 'チャック';
const SECOND_PET_NAME = 'アダム';
const LAST_PET_NAME = 'ソフィー';

test('E2E-HOME-001: 初期表示', async ({ page }) => {
  await page.goto('/');

  // ペット写真（alt属性=ペット名）
  await expect(page.getByAltText(FIRST_PET_NAME)).toBeVisible();

  // ペット名
  await expect(page.getByRole('heading', { name: FIRST_PET_NAME })).toBeVisible();

  // 時間帯ラベル（getTimeConfig() の label のいずれか）
  await expect(
    page.getByText(/おはようの時間|午前の時間|おひるの時間|おしごとの時間|ゆうがたの時間|よるの時間|おやすみの時間/)
  ).toBeVisible();

  // お世話アクションボタン（少なくとも1つ表示）
  await expect(page.getByRole('button', { name: actionLabelPattern }).first()).toBeVisible();

  // 登録CTA
  await expect(page.getByRole('button', { name: /自分のコを登録する/ })).toBeVisible();
});

test('E2E-HOME-002: サンプルペット切り替え', async ({ page }) => {
  await page.goto('/');

  // 初期表示は1件目
  await expect(page.getByRole('heading', { name: FIRST_PET_NAME })).toBeVisible();

  // › ボタンで次のペットへ切り替え
  await page.getByRole('button', { name: '›' }).click();
  await expect(page.getByRole('heading', { name: SECOND_PET_NAME })).toBeVisible();
  await expect(page.getByAltText(SECOND_PET_NAME)).toBeVisible();

  // ‹ ボタンで元のペットへ戻る
  await page.getByRole('button', { name: '‹' }).click();
  await expect(page.getByRole('heading', { name: FIRST_PET_NAME })).toBeVisible();

  // さらに ‹ で1件目から末尾（ループ）のペットへ切り替わる
  await page.getByRole('button', { name: '‹' }).click();
  await expect(page.getByRole('heading', { name: LAST_PET_NAME })).toBeVisible();
  await expect(page.getByAltText(LAST_PET_NAME)).toBeVisible();
});

test('E2E-HOME-003: お世話アクションフロー', async ({ page }) => {
  await page.goto('/');

  // 表示されているアクションボタンのうち先頭のものをタップ
  const actionButton = page.getByRole('button', { name: actionLabelPattern }).first();
  await expect(actionButton).toBeVisible();
  await actionButton.click();

  // セリフバブルが表示され、その中にメッセージ文言（「」で囲まれた発言）が表示される
  // 表示後3秒で自動的に消えるため、表示直後に検証する
  const bubbleMessage = page.getByText(/「.+」/);
  await expect(bubbleMessage).toBeVisible();

  // メッセージにはペット名が含まれる（response関数は `${name}「...」` 形式）
  await expect(bubbleMessage).toContainText(FIRST_PET_NAME);
});

test('E2E-HOME-004: 登録導線', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /自分のコを登録する/ }).click();

  // 登録画面（名前入力欄）に遷移する
  await expect(page.getByRole('heading', { name: 'このコについて' })).toBeVisible();
  await expect(page.getByPlaceholder('例：チャック')).toBeVisible();
});

test('E2E-HOME-005: 外部相談リンク', async ({ page }) => {
  await page.goto('/');

  const consultLink = page.getByRole('link', { name: /My Treasury ARF/ });
  await expect(consultLink).toBeVisible();
  await expect(consultLink).toHaveAttribute('href', 'https://mytreasuryarf.com/');
  await expect(consultLink).toHaveAttribute('target', '_blank');
});
