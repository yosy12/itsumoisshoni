// 旧アドレス → 新アドレスへの記録の引き継ぎ（ブラウザの中だけで完結し、サーバーには送らない）。
//
// localStorage はアドレス（オリジン）ごとに分かれるため、旧アドレスの記録は新アドレスから読めない。
// 旧と新の画面を親子のタブ（window.open）でつなぎ、postMessage で記録を渡す。相手（peer）は自分が開いたタブ
// か、自分を開いたタブ（opener）のどちらか。宛先・送り主のオリジンは必ず旧／新に限定して確かめる。
//   旧から（旧アドレスのブックマークで来た人）: 旧でボタン → 新を開く(?move=receive) → 新が ready
//     → 旧が記録を送る → 新が保存して done → 旧が「移行済み」を記録
//   新から（新アドレスで「前のアドレスの記録を引き継ぐ」）: 新でボタン → 旧を開く(?move=send)
//     → 旧が開いた元（新）へ記録を送る → 新が保存して done → 旧が「移行済み」を記録して閉じる
// 旧の記録は消さない（何かあっても旧アドレスに戻れば残っている）。
// iframe で旧アドレスを埋め込む方式は、ブラウザのストレージ分離（第三者 iframe は別の保存領域）で
// 本物の記録が読めないため採らない。
import type { AppState, Pet, PetKind, PetStatus, Theme } from '../types';

export const MOVE_PARAM = 'move';
export const MOVE_RECEIVE = 'receive';
export const MOVE_SEND = 'send';
export const MOVED_AT_KEY = 'itsumoisshoni_moved_at';

const MSG_READY = 'itsumoisshoni:move-ready';
const MSG_STATE = 'itsumoisshoni:move-state';
const MSG_DONE = 'itsumoisshoni:move-done';

const PET_KINDS: readonly PetKind[] = ['dog', 'cat', 'bird', 'other'];
const PET_STATUSES: readonly PetStatus[] = ['rainbow', 'living', 'virtual'];
const THEMES: readonly Theme[] = ['warm', 'calm', 'seasonal'];

export interface MessageTarget {
  postMessage(message: unknown, targetOrigin: string): void;
}

export interface MoveEvent {
  origin: string;
  source: unknown;
  data: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const str = (value: unknown): string => (typeof value === 'string' ? value : '');

const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

const normalizePet = (raw: unknown): Pet | null => {
  if (!isRecord(raw) || !str(raw.id) || !str(raw.name)) return null;
  const pet: Pet = {
    id: str(raw.id),
    name: str(raw.name),
    photo: str(raw.photo),
    kind: pick(raw.kind, PET_KINDS, 'other'),
    status: pick(raw.status, PET_STATUSES, 'living'),
    personality: str(raw.personality),
    likes: str(raw.likes),
    dislikes: str(raw.dislikes),
  };
  if (raw.isOwner === true) pet.isOwner = true;
  return pet;
};

// 受け取った値を AppState の形に整える。形が違えば null（取り込まない）。
// ペットは id・名前がそろっているものだけを取り込み、想定外の項目は捨てる。
export const normalizeState = (raw: unknown): AppState | null => {
  if (!isRecord(raw) || !Array.isArray(raw.registeredPets)) return null;
  const registeredPets = raw.registeredPets.map(normalizePet).filter((p): p is Pet => p !== null);
  const currentPetId = str(raw.currentPetId);
  const lastVisited = str(raw.lastVisited);
  return {
    registeredPets,
    currentPetId: registeredPets.some(p => p.id === currentPetId) ? currentPetId : registeredPets[0]?.id ?? null,
    theme: pick(raw.theme, THEMES, 'warm'),
    lastVisited: lastVisited || null,
  };
};

// 新アドレスに既に記録があっても消さない。同じ id のペットは新アドレス側を残し、無いものだけ足す。
export const mergeStates = (current: AppState, incoming: AppState): AppState => {
  const knownIds = new Set(current.registeredPets.map(p => p.id));
  const added = incoming.registeredPets.filter(p => !knownIds.has(p.id));
  const hasCurrent = current.registeredPets.length > 0;
  const lastVisited = [current.lastVisited, incoming.lastVisited].filter(Boolean).sort().pop() ?? null;
  return {
    registeredPets: [...current.registeredPets, ...added],
    currentPetId: hasCurrent ? current.currentPetId : incoming.currentPetId,
    theme: hasCurrent ? current.theme : incoming.theme,
    lastVisited,
  };
};

export type LegacyAction = 'redirect' | 'offerMove';

// 旧アドレスでの振る舞い: 記録が無い・移行済みなら新アドレスへ移す。記録があれば引き継ぎを案内する。
// 新アドレスの「前のアドレスの記録を引き継ぐ」から来た時（?move=send）は、移行済みでも案内する（再引き継ぎ）。
export const decideLegacyAction = (state: AppState, movedAt: string | null, requested: boolean): LegacyAction => {
  if (state.registeredPets.length === 0) return 'redirect';
  if (movedAt && !requested) return 'redirect';
  return 'offerMove';
};

// 旧アドレスの URL を、同じパス・クエリ・# のまま新アドレスへ置き換える（お世話管理からの ?from=osewa 等を保つ）。
// 引き継ぎ用の ?move= は落とす。
export const toCanonicalUrl = (currentHref: string, canonicalOrigin: string): string => {
  const url = new URL(currentHref);
  url.searchParams.delete(MOVE_PARAM);
  return `${canonicalOrigin}${url.pathname}${url.search}${url.hash}`;
};

export const receiveUrl = (canonicalOrigin: string): string => `${canonicalOrigin}/?${MOVE_PARAM}=${MOVE_RECEIVE}`;

export const sendUrl = (legacyOrigin: string): string => `${legacyOrigin}/?${MOVE_PARAM}=${MOVE_SEND}`;

// 旧アドレス側。記録を新オリジンだけに宛てて送る。
export const sendState = (peer: MessageTarget, canonicalOrigin: string, state: AppState): void => {
  peer.postMessage({ type: MSG_STATE, state }, canonicalOrigin);
};

// 旧アドレス側。相手のタブ（peer）かつ新オリジンからの ready には記録を、done には完了処理を返す。
export const createSender = (opts: {
  peer: MessageTarget;
  canonicalOrigin: string;
  state: AppState;
  onDone: (petCount: number) => void;
}) => (event: MoveEvent): void => {
  if (event.origin !== opts.canonicalOrigin || event.source !== opts.peer || !isRecord(event.data)) return;
  if (event.data.type === MSG_READY) {
    sendState(opts.peer, opts.canonicalOrigin, opts.state);
  } else if (event.data.type === MSG_DONE && typeof event.data.petCount === 'number') {
    opts.onDone(event.data.petCount);
  }
};

// 新アドレス側。相手のタブへ「受け取れます」を伝える。宛先は旧オリジンに限定。
export const announceReady = (peer: MessageTarget, legacyOrigin: string): void => {
  peer.postMessage({ type: MSG_READY }, legacyOrigin);
};

// 新アドレス側。相手のタブ（peer）かつ旧オリジンからの記録だけを取り込む。
// onState は保存まで終えて取り込んだ件数を返す（保存に失敗したら例外を投げる → done を返さない）。
export const createReceiver = (opts: {
  peer: MessageTarget;
  legacyOrigin: string;
  onState: (state: AppState) => number;
}) => (event: MoveEvent): void => {
  if (event.origin !== opts.legacyOrigin || event.source !== opts.peer || !isRecord(event.data)) return;
  if (event.data.type !== MSG_STATE) return;
  const state = normalizeState(event.data.state);
  if (!state) return;
  const petCount = opts.onState(state);
  opts.peer.postMessage({ type: MSG_DONE, petCount }, opts.legacyOrigin);
};
