import { defineConfig, devices } from '@playwright/test';

// 旧アドレス → 新アドレスの記録の引き継ぎを、手元で2つのオリジンを作って確かめる E2E。
// 同じビルドを localhost（旧アドレス役）と 127.0.0.1（新アドレス役）で開くと、ブラウザは別オリジンとして扱う。
// 実行: npm run test:e2e:move
const PORT = Number(process.env.MOVE_E2E_PORT ?? 4635);
export const LEGACY = `http://localhost:${PORT}`;
export const CANONICAL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e-move',
  outputDir: './tests/temp',
  timeout: 60000,
  workers: 1,
  reporter: [['list']],
  use: { headless: true, trace: 'off' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx vite build --outDir dist-move-e2e && npx vite preview --outDir dist-move-e2e --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `${CANONICAL}/`,
    reuseExistingServer: false,
    timeout: 120000,
    env: { VITE_LEGACY_ORIGIN: LEGACY, VITE_CANONICAL_ORIGIN: CANONICAL },
  },
});
