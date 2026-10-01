import { useEffect, useState } from 'react';
import type { AppState } from '../types';
import { CANONICAL_ORIGIN, LEGACY_ORIGIN } from '../config/origins';
import {
  MOVE_PARAM, MOVE_RECEIVE, MOVE_SEND, MOVED_AT_KEY,
  announceReady, createReceiver, createSender, decideLegacyAction,
  receiveUrl, sendState, sendUrl, toCanonicalUrl,
  type MessageTarget, type MoveEvent,
} from '../services/originMove';

// 相手のタブが開いて応答するまで待つ時間。過ぎたら「うまくいかなかった」と表示し、記録は旧アドレスに残す。
const HANDSHAKE_TIMEOUT_MS = 30_000;
// 新アドレスが本当にこのアプリを返しているかの確認（DNS 未設定・旧サーバー 403 なら false）。
const REACH_TIMEOUT_MS = 4_000;

export type MovePhase =
  | { kind: 'off' }
  // 旧アドレス
  | { kind: 'checking' }
  | { kind: 'offer' }
  | { kind: 'sending' }
  | { kind: 'sent'; petCount: number }
  | { kind: 'sendFailed' }
  | { kind: 'handingOver' }
  // 新アドレス
  | { kind: 'receiving' }
  | { kind: 'pulling' }
  | { kind: 'received'; petCount: number }
  | { kind: 'receiveFailed' };

// 新アドレスの画像が読めれば「新アドレスでこのアプリが動いている」とみなす（CSP img-src に新アドレスを許可済み）。
const checkReachable = (origin: string): Promise<boolean> =>
  new Promise(resolve => {
    const img = new Image();
    const timer = setTimeout(() => resolve(false), REACH_TIMEOUT_MS);
    const finish = (ok: boolean) => { clearTimeout(timer); resolve(ok); };
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.src = `${origin}/favicon.svg?reach=${Date.now()}`;
  });

// message を待ち、期限で打ち切る。戻り値で待ち受けを止める。
const listen = (handler: (event: MoveEvent) => void, onTimeout: () => void): (() => void) => {
  const listener = (event: MessageEvent) => handler(event);
  const timer = setTimeout(() => { stop(); onTimeout(); }, HANDSHAKE_TIMEOUT_MS);
  function stop() { window.removeEventListener('message', listener); clearTimeout(timer); }
  window.addEventListener('message', listener);
  return stop;
};

const moveParam = () => new URLSearchParams(window.location.search).get(MOVE_PARAM);

const initialPhase = (): MovePhase => {
  const origin = window.location.origin;
  if (origin === LEGACY_ORIGIN) return moveParam() === MOVE_SEND && window.opener ? { kind: 'handingOver' } : { kind: 'checking' };
  if (origin === CANONICAL_ORIGIN && moveParam() === MOVE_RECEIVE && window.opener) return { kind: 'receiving' };
  return { kind: 'off' };
};

const markMoved = () => localStorage.setItem(MOVED_AT_KEY, new Date().toISOString());

export const useOriginMove = (opts: {
  state: AppState;
  importState: (incoming: AppState) => AppState;
  onImported: () => void;
}) => {
  const [phase, setPhase] = useState<MovePhase>(initialPhase);
  const { state, importState, onImported } = opts;

  // 新アドレス側の受け取り（旧アドレスから開かれた時、または旧アドレスを開いた後）。
  const receiveFrom = (peer: MessageTarget, sayReady: boolean) => {
    let stop = () => {};
    const handler = createReceiver({
      peer,
      legacyOrigin: LEGACY_ORIGIN,
      onState: incoming => {
        const merged = importState(incoming);
        stop();
        if (merged.registeredPets.length > 0) onImported();
        setPhase({ kind: 'received', petCount: incoming.registeredPets.length });
        return incoming.registeredPets.length;
      },
    });
    stop = listen(event => {
      try { handler(event); } catch { stop(); setPhase({ kind: 'receiveFailed' }); }
    }, () => setPhase({ kind: 'receiveFailed' }));
    if (sayReady) announceReady(peer, LEGACY_ORIGIN);
    return stop;
  };

  // 旧アドレス: 新アドレスが動いているのを確かめてから、移すか案内するかを決める。動いていなければ今まで通り使える。
  useEffect(() => {
    if (phase.kind !== 'checking') return;
    let cancelled = false;
    checkReachable(CANONICAL_ORIGIN).then(ok => {
      if (cancelled) return;
      if (!ok) return setPhase({ kind: 'off' });
      const action = decideLegacyAction(state, localStorage.getItem(MOVED_AT_KEY), moveParam() === MOVE_SEND);
      if (action === 'redirect') window.location.replace(toCanonicalUrl(window.location.href, CANONICAL_ORIGIN));
      else setPhase({ kind: 'offer' });
    });
    return () => { cancelled = true; };
  }, [phase.kind, state]);

  // 旧アドレス（新アドレスから開かれた）: 開いた元へ記録を渡し、完了したら閉じる。
  useEffect(() => {
    if (phase.kind !== 'handingOver') return;
    const opener = window.opener as Window;
    const stop = listen(createSender({
      peer: opener,
      canonicalOrigin: CANONICAL_ORIGIN,
      state,
      onDone: () => { stop(); markMoved(); window.close(); },
    }), () => setPhase({ kind: 'sendFailed' }));
    sendState(opener, CANONICAL_ORIGIN, state);
    return stop;
  }, [phase.kind, state]);

  // 新アドレス（旧アドレスから開かれた）: 開いた元へ ready を送って記録を待つ。
  // receiveFrom は描画ごとに作り直されるが、待ち受けは受け取りの開始時に1回だけ張る（依存は phase.kind のみ）。
  useEffect(() => {
    if (phase.kind !== 'receiving') return;
    window.history.replaceState({}, '', window.location.pathname);
    return receiveFrom(window.opener as Window, true);
  }, [phase.kind]);

  // 旧アドレス: 新アドレスを開いて記録を渡す（ボタンの操作から呼ぶ。ポップアップ許可のため）。
  const pushToCanonical = () => {
    const popup = window.open(receiveUrl(CANONICAL_ORIGIN), '_blank');
    if (!popup) return setPhase({ kind: 'sendFailed' });
    setPhase({ kind: 'sending' });
    const stop = listen(createSender({
      peer: popup,
      canonicalOrigin: CANONICAL_ORIGIN,
      state,
      onDone: petCount => { stop(); markMoved(); setPhase({ kind: 'sent', petCount }); },
    }), () => setPhase({ kind: 'sendFailed' }));
  };

  // 新アドレス: 旧アドレスを開いて記録を取り寄せる（ボタンの操作から呼ぶ）。
  const pullFromLegacy = () => {
    const popup = window.open(sendUrl(LEGACY_ORIGIN), '_blank');
    if (!popup) return setPhase({ kind: 'receiveFailed' });
    setPhase({ kind: 'pulling' });
    receiveFrom(popup, false);
  };

  return {
    phase,
    isCanonical: window.location.origin === CANONICAL_ORIGIN,
    pushToCanonical,
    pullFromLegacy,
    dismiss: () => setPhase({ kind: 'off' }),
  };
};
