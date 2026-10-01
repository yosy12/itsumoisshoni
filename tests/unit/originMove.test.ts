// 旧アドレス → 新アドレスへの記録の引き継ぎ（src/services/originMove.ts）の単体テスト。
// 実行: npm test（node:test。型は Node の型除去で実行する）
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  announceReady, createReceiver, createSender, decideLegacyAction, mergeStates, normalizeState,
  receiveUrl, sendUrl, toCanonicalUrl, type MessageTarget,
} from '../../src/services/originMove.ts';
import type { AppState, Pet } from '../../src/types/index.ts';

const LEGACY = 'https://itsumoisshoni.y-suda-arf.workers.dev';
const CANONICAL = 'https://itsumoisshoni.mytreasuryarf.com';

const pet = (id: string, name = id): Pet => ({
  id, name, photo: 'data:image/png;base64,AAAA', kind: 'dog', status: 'rainbow',
  personality: 'おっとり', likes: 'おさんぽ', dislikes: '',
});
const stateOf = (pets: Pet[], extra: Partial<AppState> = {}): AppState => ({
  registeredPets: pets, currentPetId: pets[0]?.id ?? null, theme: 'warm', lastVisited: null, ...extra,
});

const recorder = () => {
  const sent: { message: unknown; targetOrigin: string }[] = [];
  const target: MessageTarget = { postMessage: (message, targetOrigin) => { sent.push({ message, targetOrigin }); } };
  return { target, sent };
};

test('normalizeState: 形の違う値は取り込まない', () => {
  assert.equal(normalizeState(null), null);
  assert.equal(normalizeState('x'), null);
  assert.equal(normalizeState({ registeredPets: 'x' }), null);
  assert.equal(normalizeState([]), null);
});

test('normalizeState: id・名前の無いペットと想定外の項目は捨て、種類などは既定値に寄せる', () => {
  const state = normalizeState({
    registeredPets: [{ id: 'p1', name: 'ポチ', kind: 'dragon', status: 'x', evil: '<script>' }, { id: 'p2' }, 5],
    currentPetId: 'missing', theme: 'neon', lastVisited: 7, extra: 1,
  });
  assert.ok(state);
  assert.equal(state.registeredPets.length, 1);
  assert.deepEqual(state.registeredPets[0], {
    id: 'p1', name: 'ポチ', photo: '', kind: 'other', status: 'living', personality: '', likes: '', dislikes: '',
  });
  assert.equal(state.currentPetId, 'p1');
  assert.equal(state.theme, 'warm');
  assert.equal(state.lastVisited, null);
  assert.equal('extra' in state, false);
});

test('normalizeState: 正しい記録はそのまま通す（写真のデータも保つ）', () => {
  const original = stateOf([pet('a'), { ...pet('b'), isOwner: true }], { currentPetId: 'b', theme: 'calm', lastVisited: '2026-09-30' });
  assert.deepEqual(normalizeState(JSON.parse(JSON.stringify(original))), original);
});

test('mergeStates: 新アドレスが空なら旧の記録がそのまま入る', () => {
  const incoming = stateOf([pet('a'), pet('b')], { currentPetId: 'b', theme: 'seasonal' });
  assert.deepEqual(mergeStates(stateOf([]), incoming), incoming);
});

test('mergeStates: 新アドレスの記録は消さず、同じ id は新アドレス側を残して足りないものだけ足す', () => {
  const current = stateOf([{ ...pet('a'), name: '新で直した名前' }], { theme: 'calm', lastVisited: '2026-10-02' });
  const incoming = stateOf([pet('a'), pet('b')], { currentPetId: 'b', theme: 'seasonal', lastVisited: '2026-09-30' });
  const merged = mergeStates(current, incoming);
  assert.deepEqual(merged.registeredPets.map(p => [p.id, p.name]), [['a', '新で直した名前'], ['b', 'b']]);
  assert.equal(merged.currentPetId, 'a');
  assert.equal(merged.theme, 'calm');
  assert.equal(merged.lastVisited, '2026-10-02');
});

test('mergeStates: 2回受け取っても重複しない', () => {
  const incoming = stateOf([pet('a')]);
  const once = mergeStates(stateOf([]), incoming);
  assert.deepEqual(mergeStates(once, incoming), once);
});

test('decideLegacyAction: 記録なし→新へ移す / 記録あり→案内 / 移行済み→新へ / 新から頼まれた→移行済みでも案内', () => {
  assert.equal(decideLegacyAction(stateOf([]), null, false), 'redirect');
  assert.equal(decideLegacyAction(stateOf([]), null, true), 'redirect');
  assert.equal(decideLegacyAction(stateOf([pet('a')]), null, false), 'offerMove');
  assert.equal(decideLegacyAction(stateOf([pet('a')]), '2026-10-01T00:00:00Z', false), 'redirect');
  assert.equal(decideLegacyAction(stateOf([pet('a')]), '2026-10-01T00:00:00Z', true), 'offerMove');
});

test('toCanonicalUrl: パス・クエリ・# を保ち、引き継ぎ用の move だけ落とす', () => {
  assert.equal(toCanonicalUrl(`${LEGACY}/`, CANONICAL), `${CANONICAL}/`);
  assert.equal(
    toCanonicalUrl(`${LEGACY}/?from=osewa&name=%E3%83%9D%E3%83%81&move=send#x`, CANONICAL),
    `${CANONICAL}/?from=osewa&name=%E3%83%9D%E3%83%81#x`,
  );
  assert.equal(receiveUrl(CANONICAL), `${CANONICAL}/?move=receive`);
  assert.equal(sendUrl(LEGACY), `${LEGACY}/?move=send`);
});

test('送り側: 自分が開いたタブ・新オリジンからの ready にだけ記録を返し、宛先は新オリジンに限る', () => {
  const popup = recorder();
  const other = recorder();
  const done: number[] = [];
  const state = stateOf([pet('a')]);
  const handle = createSender({ peer: popup.target, canonicalOrigin: CANONICAL, state, onDone: n => done.push(n) });
  const ready = { type: 'itsumoisshoni:move-ready' };

  handle({ origin: 'https://evil.example', source: popup.target, data: ready });
  handle({ origin: CANONICAL, source: other.target, data: ready });
  handle({ origin: LEGACY, source: popup.target, data: ready });
  handle({ origin: CANONICAL, source: popup.target, data: 'itsumoisshoni:move-ready' });
  assert.equal(popup.sent.length, 0);

  handle({ origin: CANONICAL, source: popup.target, data: ready });
  assert.equal(popup.sent.length, 1);
  assert.equal(popup.sent[0].targetOrigin, CANONICAL);
  assert.deepEqual(popup.sent[0].message, { type: 'itsumoisshoni:move-state', state });
  assert.equal(other.sent.length, 0);

  handle({ origin: 'https://evil.example', source: popup.target, data: { type: 'itsumoisshoni:move-done', petCount: 1 } });
  assert.deepEqual(done, []);
  handle({ origin: CANONICAL, source: popup.target, data: { type: 'itsumoisshoni:move-done', petCount: 1 } });
  assert.deepEqual(done, [1]);
});

test('受け側: ready は旧オリジン宛て。旧オリジンかつ相手のタブからの記録だけ取り込み、done を返す', () => {
  const opener = recorder();
  const imported: AppState[] = [];
  const handle = createReceiver({
    peer: opener.target, legacyOrigin: LEGACY, onState: s => { imported.push(s); return s.registeredPets.length; },
  });
  announceReady(opener.target, LEGACY);
  assert.deepEqual(opener.sent[0], { message: { type: 'itsumoisshoni:move-ready' }, targetOrigin: LEGACY });

  const message = { type: 'itsumoisshoni:move-state', state: stateOf([pet('a'), pet('b')]) };
  handle({ origin: 'https://evil.example', source: opener.target, data: message });
  handle({ origin: LEGACY, source: {}, data: message });
  handle({ origin: CANONICAL, source: opener.target, data: message });
  handle({ origin: LEGACY, source: opener.target, data: { type: 'itsumoisshoni:move-state', state: 'broken' } });
  assert.equal(imported.length, 0);

  handle({ origin: LEGACY, source: opener.target, data: message });
  assert.equal(imported.length, 1);
  assert.equal(imported[0].registeredPets.length, 2);
  assert.deepEqual(opener.sent[1], { message: { type: 'itsumoisshoni:move-done', petCount: 2 }, targetOrigin: LEGACY });
});

test('受け側: 保存に失敗したら done を返さない（旧アドレスは「移行済み」にならない）', () => {
  const opener = recorder();
  const handle = createReceiver({
    peer: opener.target, legacyOrigin: LEGACY, onState: () => { throw new Error('QuotaExceededError'); },
  });
  assert.throws(() => handle({
    origin: LEGACY, source: opener.target, data: { type: 'itsumoisshoni:move-state', state: stateOf([pet('a')]) },
  }));
  assert.equal(opener.sent.length, 0);
});

test('CSP の img-src に正式アドレスが入っている（旧アドレスから新アドレスの稼働確認に使う）', () => {
  const config = readFileSync(new URL('../../src/config/origins.ts', import.meta.url), 'utf8');
  const canonical = config.match(/VITE_CANONICAL_ORIGIN \?\? '([^']+)'/)?.[1];
  assert.equal(canonical, CANONICAL);
  const headers = readFileSync(new URL('../../public/_headers', import.meta.url), 'utf8');
  const imgSrc = headers.match(/img-src ([^;]+);/)?.[1].split(' ') ?? [];
  assert.ok(imgSrc.includes(CANONICAL));
  const wrangler = readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8');
  assert.ok(wrangler.includes(`"pattern": "${new URL(CANONICAL).host}", "custom_domain": true`));
});
