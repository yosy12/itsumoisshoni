# デプロイ

## 公開先

- 正式公開先: Cloudflare Workers `itsumoisshoni`（https://itsumoisshoni.y-suda-arf.workers.dev/）
- GitHub Pages（https://yosy12.github.io/itsumoisshoni/）は 2026-09-29 に停止済み（二重公開の解消）

## 手順

1. `main` の HEAD を clean な worktree で用意する（`git fetch && git worktree add --detach <dir> origin/main`）
2. `npm ci && npm run build`
3. 戻し先を控える: `bluelamp-secret exec "CLOUDFLARE_API_TOKEN=Cloudflare API Token - My Treasury ARF (Edit Cloudflare Workers, scoped)" -- npx wrangler deployments status`
4. `bluelamp-secret exec "CLOUDFLARE_API_TOKEN=Cloudflare API Token - My Treasury ARF (Edit Cloudflare Workers, scoped)" -- npx wrangler deploy`
5. 本番を curl で確認し、下のデプロイログに追記する
6. 戻す場合: `npx wrangler rollback <戻し先 Version ID>`（同じトークンで実行）

## デプロイログ

| 日時 (JST) | commit | Version ID | 戻し先 Version ID | 内容 |
|---|---|---|---|---|
| 2026-09-29 | 61e3ee7 | 106e15a5-e0b5-427d-8b20-3e5840688171 | a6c6056d-383c-4678-afd1-5574588ec5bb | MTA へのリンクを https://mytreasuryarf.com/ に変更（PR #1）、workers_dev 明記、Pages workflow 削除（PR #2） |
