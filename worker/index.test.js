import test from "node:test";
import assert from "node:assert/strict";
import { buildSystemInstruction, sanitizePet } from "./index.js";

// 2026-09-29 セキュリティ総点検: ペットの設定は Gemini への入力になるため長さを制限する
test("ペットの設定は各100文字までに切り詰め、想定外の項目は捨てる", () => {
  const pet = sanitizePet({ name: "ポチ", personality: "あ".repeat(5000), extra: "x".repeat(10000) });
  assert.equal(pet.name, "ポチ");
  assert.equal(pet.personality.length, 100);
  assert.equal("extra" in pet, false);
  assert.ok(buildSystemInstruction(pet).length < 1000);
});

test("pet が無い・文字列以外でも落ちない", () => {
  assert.equal(sanitizePet(undefined).name, "");
  assert.equal(sanitizePet({ name: 123 }).name, "123");
});
