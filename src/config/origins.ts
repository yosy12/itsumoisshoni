// アプリの公開アドレス（オリジン）の正本。
// 2026-10 会社ドメインへ移転: 新しいアドレスが正式、旧アドレス（workers.dev）は記録の引き継ぎ元としてしばらく残す。
// ビルド時の VITE_* で上書きできるのはローカル検証（2つのオリジンを手元で再現する E2E）のため。
// public/_headers の CSP（img-src）にも同じ新アドレスを書いている。変えるときは両方直す。
export const CANONICAL_ORIGIN: string =
  import.meta.env.VITE_CANONICAL_ORIGIN ?? 'https://itsumoisshoni.mytreasuryarf.com';
export const LEGACY_ORIGIN: string =
  import.meta.env.VITE_LEGACY_ORIGIN ?? 'https://itsumoisshoni.y-suda-arf.workers.dev';
