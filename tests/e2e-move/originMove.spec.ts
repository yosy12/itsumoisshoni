import { test, expect, type BrowserContext } from '@playwright/test';
import { LEGACY, CANONICAL } from '../../playwright.move.config';

// 旧アドレス → 新アドレスの記録の引き継ぎ E2E（src/services/originMove.ts・src/hooks/useOriginMove.ts）
const STORAGE_KEY = 'itsumoisshoni_state';
const SHOTS = '/tmp/bluelamp-screenshots';

const legacyState = {
  registeredPets: [
    { id: 'pet_1', name: 'モカ', photo: '/pets/chuck.jpg', kind: 'dog', status: 'rainbow', personality: 'あまえんぼう', likes: 'おさんぽ', dislikes: '' },
    { id: 'pet_2', name: 'ルル', photo: '/pets/mila.jpg', kind: 'cat', status: 'living', personality: '', likes: '', dislikes: '' },
  ],
  currentPetId: 'pet_1',
  theme: 'calm',
  lastVisited: null,
};

// 旧アドレス役のオリジンにだけ、既存利用者の記録を置く
const seedLegacy = (context: BrowserContext) =>
  context.addInitScript(({ origin, key, state }) => {
    if (location.origin === origin && !localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
  }, { origin: LEGACY, key: STORAGE_KEY, state: legacyState });

const storedPets = async (context: BrowserContext, origin: string) => {
  const page = await context.newPage();
  await page.route(`${origin}/**`, route => route.fulfill({ body: '<html></html>', contentType: 'text/html' }));
  await page.goto(`${origin}/blank`);
  const raw = await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY);
  await page.close();
  return raw ? (JSON.parse(raw).registeredPets as { name: string }[]).map(p => p.name) : [];
};

test('旧アドレス: 記録ありなら案内 → 1タップで新アドレスへ移り、次からは新アドレスへ自動で移る', async ({ context, page }) => {
  await seedLegacy(context);
  await page.goto(`${LEGACY}/`);
  await expect(page.getByRole('heading', { name: /新しいアドレスに引っ越しました/ })).toBeVisible();
  await expect(page.getByText('登録したコの記録（2匹）')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/itsumoisshoni-move-offer.png`, fullPage: true });

  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('button', { name: '記録ごと新しいアドレスへ移る' }).click(),
  ]);
  await expect(popup.getByText('前のアドレスから2匹の記録を引き継ぎました')).toBeVisible();
  await expect(popup.getByRole('heading', { name: 'モカ' })).toBeVisible();
  expect(new URL(popup.url()).origin).toBe(CANONICAL);
  expect(new URL(popup.url()).search).toBe('');
  await popup.screenshot({ path: `${SHOTS}/itsumoisshoni-move-received.png`, fullPage: true });

  await expect(page.getByRole('heading', { name: '引っ越しが終わりました' })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/itsumoisshoni-move-sent.png`, fullPage: true });

  expect(await storedPets(context, CANONICAL)).toEqual(['モカ', 'ルル']);
  expect(await storedPets(context, LEGACY)).toEqual(['モカ', 'ルル']); // 旧の記録は消さない

  await page.goto(`${LEGACY}/`);
  await page.waitForURL(`${CANONICAL}/`);
  await expect(page.getByRole('heading', { name: 'モカ' })).toBeVisible();
});

test('旧アドレス: 記録が無ければ、URL のクエリを保ったまま新アドレスへ自動で移る', async ({ page }) => {
  await page.goto(`${LEGACY}/?from=osewa&name=%E3%83%9D%E3%83%81&kind=cat`);
  await page.waitForURL(`${CANONICAL}/?from=osewa&name=%E3%83%9D%E3%83%81&kind=cat`);
  await expect(page.getByPlaceholder('例：チャック')).toHaveValue('ポチ');
});

test('旧アドレス: 新アドレスが動いていなければ、今まで通り旧アドレスで使える', async ({ context, page }) => {
  await seedLegacy(context);
  await context.route(`${CANONICAL}/favicon.svg*`, route => route.abort());
  await page.goto(`${LEGACY}/`);
  await expect(page.getByRole('heading', { name: 'モカ' })).toBeVisible();
  expect(new URL(page.url()).origin).toBe(LEGACY);
});

test('旧アドレス: 「今はこのまま使う」で旧アドレスのまま使える', async ({ context, page }) => {
  await seedLegacy(context);
  await page.goto(`${LEGACY}/`);
  await page.getByRole('button', { name: '今はこのまま使う' }).click();
  await expect(page.getByRole('heading', { name: 'モカ' })).toBeVisible();
});

test('新アドレス: 「以前から使っている方」から1タップで取り寄せ、旧のタブは自動で閉じる', async ({ context, page }) => {
  await seedLegacy(context);
  await page.goto(`${CANONICAL}/`);
  await page.screenshot({ path: `${SHOTS}/itsumoisshoni-move-pull-link.png`, fullPage: true });
  const [legacyTab] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('button', { name: /以前から使っている方/ }).click(),
  ]);
  await expect(page.getByText('前のアドレスから2匹の記録を引き継ぎました')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'モカ' })).toBeVisible();
  await expect.poll(() => legacyTab.isClosed()).toBe(true);
  expect(await storedPets(context, CANONICAL)).toEqual(['モカ', 'ルル']);
});

test('新アドレス: 前のアドレスに記録が無ければ、その旨を伝える', async ({ context, page }) => {
  await page.goto(`${CANONICAL}/`);
  const [legacyTab] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('button', { name: /以前から使っている方/ }).click(),
  ]);
  await expect(page.getByText('前のアドレスには、引き継ぐ記録がありませんでした')).toBeVisible();
  await expect.poll(() => legacyTab.isClosed()).toBe(true);
  await expect(page.getByRole('button', { name: /自分のコを登録する/ })).toBeVisible();
});

test('新アドレス: 旧アドレス以外から開かれても記録を受け取らない（?move=receive を直接開く）', async ({ page }) => {
  await page.goto(`${CANONICAL}/?move=receive`);
  await expect(page.getByRole('button', { name: /自分のコを登録する/ })).toBeVisible();
  await expect(page.getByText('前のアドレスから記録を受け取っています')).toHaveCount(0);
});
