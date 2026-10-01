# デプロイ

## 公開先

- 正式公開先: Cloudflare Workers `itsumoisshoni` の Custom Domain https://itsumoisshoni.mytreasuryarf.com/（`wrangler.jsonc` の `routes`。2026-10 移転）
- 旧アドレス: https://itsumoisshoni.y-suda-arf.workers.dev/（`workers_dev: true`）。記録の引き継ぎ元としてしばらく残す。止めない
- GitHub Pages（https://yosy12.github.io/itsumoisshoni/）は 2026-09-29 に停止済み（二重公開の解消）

## 会社ドメインへの移転（記録の引き継ぎ）

記録はブラウザの localStorage にあり、アドレスが変わると新しいアドレスからは見えない。旧アドレスの画面が
新アドレスの画面を別タブで開き、ブラウザの中だけで記録を渡す（`src/services/originMove.ts`）。

- 旧アドレスに来た人: 新アドレスが動いていることを確かめてから、記録が無ければ新アドレスへ自動で移す。
  記録があれば「記録ごと新しいアドレスへ移る」を1回押してもらう。移行後は旧アドレスに来ても新アドレスへ移す
- 新アドレスに来た人: 記録が無い画面に「以前から使っている方は、記録を引き継げます」。押すと旧アドレスから取り寄せる
- 旧アドレスの記録は消さない。新アドレスが動いていなければ（DNS 未設定など）、旧アドレスは今まで通り使える
- 受け渡しの相手は、自分が開いた／自分を開いたタブで、かつ新旧のオリジンに限る（`tests/unit/originMove.test.ts`）

### 反映手順（この順番で行う）

1. このリポの PR をマージし、上の「手順」でデプロイする。`routes` の `custom_domain: true` により、
   デプロイ時に Cloudflare が `itsumoisshoni.mytreasuryarf.com` の DNS レコードと証明書を作る
   - 権限: デプロイ用トークン（Edit Cloudflare Workers）は Workers の Custom Domain 一覧の読み取りまでは確認済み。
     作成ができるかは未確認（作成を試すこと自体が DNS 変更のため）。デプロイで Custom Domain の段だけ
     認証エラーになった場合でも、新しいコードは旧アドレスで動き、新アドレスが応答しないので引き継ぎの案内は出ない
     （安全側）。その時は Cloudflare の画面（Workers & Pages → itsumoisshoni → Settings → Domains & Routes →
     Add → Custom Domain）で `itsumoisshoni.mytreasuryarf.com` を追加する
   - `itsumoisshoni` という名前の DNS レコードは無いこと（2026-10-01 DNS API で確認）。あると作成が失敗する
2. 本番確認: `curl -sI https://itsumoisshoni.mytreasuryarf.com/` が 200、`/favicon.svg` が 200、
   CSP の img-src に新アドレス。旧アドレスを記録の無いブラウザで開くと新アドレスへ移ること。
   記録のあるブラウザで「記録ごと新しいアドレスへ移る」→ 新アドレスに同じコが出ること
3. My Treasury ARF の「いつも一緒」リンク（公式サイト index.html・ポータル Sidebar）を新アドレスに変える PR を
   マージ・デプロイする（新アドレスが動く前にマージしない）
4. 台帳 `arf-ai-agents/ledger/systems.yaml`（itsumoisshoni の production_urls・custom_domain_routing・mta の links_to）を更新する
5. 旧アドレスを止めるのは、引き継ぎ期間を置いてから須田様の判断で（止めると、まだ移っていない人の記録が開けなくなる）

### 検証

- 単体: `npm test`
- 引き継ぎ E2E（localhost と 127.0.0.1 を旧・新に見立てる）: `npm run test:e2e:move`

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
| 2026-09-29 19:20 | `736f7af`（PR#4） | `8c9eec11-43dc-4972-ab0f-6428b53da046` | `106e15a5-e0b5-427d-8b20-3e5840688171` | セキュリティ総点検: 会話 API のペット設定を各100文字に制限（Gemini 有料枠の費用悪用防止）、CSP に frame-ancestors 等、npm audit fix（nanoid）。事後: トップ 200・CSP に frame-ancestors、/api/chat の実呼び出し 200・空入力 400、コンソールエラー0件 |
| 2026-10-01 15:2x | `1a1c687`（PR#6） | `bed98338-d13e-4674-96db-a510b4c019d8` | `8c9eec11-43dc-4972-ab0f-6428b53da046` | 会社ドメイン itsumoisshoni.mytreasuryarf.com（Custom Domain を wrangler で作成）へ移転し、旧アドレスの記録をブラウザ内で引き継ぐ仕組み。須田様が案内文言を承認（10/1）。事後: 新アドレス / ・favicon 200（証明書OK）、記録なしで旧アドレスを開くと新アドレスへ移ることを本番で確認。旧アドレスは残す（停止は須田様判断） |
