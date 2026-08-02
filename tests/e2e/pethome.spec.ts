import { test, expect, type Page } from '@playwright/test';
import { actions } from '../../src/data/scenes';
import type { Pet, AppState } from '../../src/types';

// マイペット画面（PetHomePage）E2Eテスト
// 対象: src/pages/PetHomePage.tsx（screen === 'mypet' の場合に表示、URLは "/" 固定）
// 仕様書: docs/e2e-specs/pethome-e2e.md（E2E-PET-001〜005）
//
// このページは「ペット登録済み」状態でないと表示されないため、各テストの冒頭で
// localStorage の itsumoisshoni_state に登録済み状態を注入してからリロードする。
// バックエンド/DBが存在せずlocalStorageのみが状態を持つSPAのため、これが唯一の状態作成手段。
//
// ページ並列実行モード: 全 test() を有効化（test.only なし）

const STORAGE_KEY = 'itsumoisshoni_state';

// アクションボタンのラベル（時間帯によって表示されるアクションが変わるため、
// scenes.ts から動的に取得して正規表現化する。ハードコードしない）
const actionLabelPattern = new RegExp(actions.map(a => a.label).join('|'));

const makePet = (overrides: Partial<Pet> & { id: string; name: string }): Pet => ({
  photo: '/pets/chuck.jpg',
  kind: 'dog',
  status: 'living',
  personality: 'げんきいっぱいの甘えん坊',
  likes: 'おやつ、おさんぽ',
  dislikes: 'あめ',
  ...overrides,
});

// localStorage にペット登録済み状態をセットしてリロードするヘルパー
const setupPets = async (page: Page, pets: Pet[], currentPetId: string) => {
  await page.goto('/');
  const state: AppState = {
    registeredPets: pets,
    currentPetId,
    theme: 'warm',
    lastVisited: null,
  };
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: STORAGE_KEY, value: JSON.stringify(state) }
  );
  await page.reload();
};

test('E2E-PET-001: 初期表示', async ({ page }) => {
  const pet = makePet({ id: 'e2e-pet-001', name: 'ポチ' });
  await setupPets(page, [pet], pet.id);

  // ペット名
  await expect(page.getByRole('heading', { name: pet.name })).toBeVisible();

  // ペット写真（alt属性=ペット名）
  await expect(page.getByAltText(pet.name)).toBeVisible();

  // お世話アクションボタン（少なくとも1つ表示）
  await expect(page.getByRole('button', { name: actionLabelPattern }).first()).toBeVisible();
});

test('E2E-PET-002: お世話アクションフロー', async ({ page }) => {
  const pet = makePet({ id: 'e2e-pet-002', name: 'タマ' });
  await setupPets(page, [pet], pet.id);

  const actionButton = page.getByRole('button', { name: actionLabelPattern }).first();
  await expect(actionButton).toBeVisible();
  await actionButton.click();

  // セリフバブルが表示され、その中にメッセージ文言（「」で囲まれた発言）が表示される
  // 表示後3秒で自動的に消えるため、表示直後に検証する
  const bubbleMessage = page.getByText(/「.+」/);
  await expect(bubbleMessage).toBeVisible();
  await expect(bubbleMessage).toContainText(pet.name);
});

test('E2E-PET-003: プレミアム機能紹介フロー', async ({ page }) => {
  const pet = makePet({ id: 'e2e-pet-003', name: 'ハチ' });
  await setupPets(page, [pet], pet.id);

  // プレミアム機能ボタン（話しかける）をタップ
  const talkButton = page.getByRole('button', { name: /話しかける/ });
  await expect(talkButton).toBeVisible();
  await talkButton.click();

  // モーダルに機能説明が表示される
  await expect(page.getByRole('heading', { name: '話しかける' })).toBeVisible();
  await expect(page.getByText('AIがその子らしく返事してくれます', { exact: true })).toBeVisible();

  const closeButton = page.getByRole('button', { name: 'とじる' });
  await expect(closeButton).toBeVisible();
  await closeButton.click();

  // 「とじる」でモーダルが閉じられる
  await expect(closeButton).not.toBeVisible();
  await expect(page.getByRole('heading', { name: '話しかける' })).not.toBeVisible();
});

test('E2E-PET-004: ペット切り替えフロー', async ({ page }) => {
  const petA = makePet({ id: 'e2e-pet-004-a', name: 'ソラ' });
  const petB = makePet({ id: 'e2e-pet-004-b', name: 'ミント', photo: '/pets/adam.jpg', kind: 'cat' });
  await setupPets(page, [petA, petB], petA.id);

  // 初期表示は petA
  await expect(page.getByRole('heading', { name: petA.name })).toBeVisible();

  // 切り替えボタン（🐾アイコン、header左上）をタップしてペット一覧を表示
  await page.getByRole('button', { name: '🐾', exact: true }).click();

  // 一覧に両方のペット名が表示される
  const petListItem = page.getByRole('button', { name: petB.name });
  await expect(petListItem).toBeVisible();

  // petB を選択
  await petListItem.click();

  // petB の名前・写真に切り替わる
  await expect(page.getByRole('heading', { name: petB.name })).toBeVisible();
  await expect(page.getByAltText(petB.name)).toBeVisible();
});

test('E2E-PET-005: ペット追加導線', async ({ page }) => {
  const pet = makePet({ id: 'e2e-pet-005', name: 'クッキー' });
  await setupPets(page, [pet], pet.id);

  // 切り替えボタン（🐾アイコン）をタップして一覧を表示
  await page.getByRole('button', { name: '🐾', exact: true }).click();

  // 「あたらしいコを追加」をタップ
  await page.getByRole('button', { name: 'あたらしいコを追加' }).click();

  // 登録画面（RegisterPage）に遷移する
  await expect(page.getByRole('heading', { name: 'このコについて' })).toBeVisible();
});
