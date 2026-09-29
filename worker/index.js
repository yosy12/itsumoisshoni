// 「話しかける」機能のバックエンド。GEMINI_API_KEYはフロントに一切露出させず、
// このWorker経由でのみ呼び出す。課金・アカウントはまだ無いため、悪用防止の
// 暫定措置としてIPベースの1日あたり上限のみ設ける（本格的な有料化は別途）。
const DAILY_LIMIT = 30;
// gemini-3.6-flashは常時「思考」を行い18秒前後かかる上に大半のトークンが
// 思考に消費される。gemini-3.5-flash-liteは思考なしで1秒未満・キャラクター
// らしさも十分だったため、この軽い会話用途にはこちらを採用。
const GEMINI_MODEL = "gemini-3.5-flash-lite";
const MAX_MESSAGE_LENGTH = 300;
// ペットの設定（名前・性格など）も Gemini への入力になるため長さを制限する（有料枠の費用の悪用防止）
const MAX_PET_FIELD_LENGTH = 100;

const KIND_LABEL = { dog: "犬", cat: "猫", bird: "小鳥", other: "ペット" };
const STATUS_DESC = {
  rainbow: "虹の橋を渡って、今はお空にいる",
  living: "今も一緒に暮らしている",
  virtual: "空想上の、夢の中の存在",
};

function corsJson(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

const clip = (value) => (value == null ? "" : String(value).trim().slice(0, MAX_PET_FIELD_LENGTH));

export function sanitizePet(raw) {
  const pet = raw && typeof raw === "object" ? raw : {};
  return {
    name: clip(pet.name),
    kind: clip(pet.kind),
    status: clip(pet.status),
    personality: clip(pet.personality),
    likes: clip(pet.likes),
    dislikes: clip(pet.dislikes),
  };
}

export function buildSystemInstruction(pet) {
  const kind = KIND_LABEL[pet.kind] || "ペット";
  const statusDesc = STATUS_DESC[pet.status] || "";
  return [
    `あなたは「${pet.name}」という名前の${kind}です。飼い主とチャットで会話します。`,
    pet.personality ? `性格・特徴: ${pet.personality}` : "",
    pet.likes ? `好きなもの: ${pet.likes}` : "",
    pet.dislikes ? `苦手なもの: ${pet.dislikes}` : "",
    statusDesc ? `状態: ${statusDesc}` : "",
    "",
    "ルール:",
    "- 常に一人称視点のペットとして、日本語のひらがな多めの、親しみやすい話し方で返答する",
    "- 1〜2文程度の短い返答にする",
    "- 人間向けの医療・しつけ等の専門的なアドバイスはせず、そういった相談には「ちゃんとした人に聞いてみてね」と自然に促す",
    "- 攻撃的・不適切な内容の入力には、やんわりとはぐらかして応じない",
  ]
    .filter(Boolean)
    .join("\n");
}

async function callGemini(env, pet, message) {
  const systemInstruction = buildSystemInstruction(pet);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: message }] }],
        generationConfig: {
          maxOutputTokens: 300,
          temperature: 0.9,
        },
      }),
    }
  );
  if (!res.ok) {
    console.error("gemini_failed", res.status, await res.text());
    return null;
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return text || null;
}

async function handleChat(request, env) {
  if (request.method !== "POST") return corsJson({ ok: false, error: "method_not_allowed" }, 405);
  if (!env.GEMINI_API_KEY) return corsJson({ ok: false, error: "ai_not_configured" }, 501);

  let body;
  try {
    body = await request.json();
  } catch {
    return corsJson({ ok: false, error: "invalid_json" }, 400);
  }

  const message = (body.message || "").toString().trim().slice(0, MAX_MESSAGE_LENGTH);
  const pet = sanitizePet(body.pet);
  if (!message || !pet.name) return corsJson({ ok: false, error: "missing_required_fields" }, 400);

  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const today = new Date().toISOString().slice(0, 10);
  const kvKey = `chat:${ip}:${today}`;

  const countStr = await env.CHAT_RATE_LIMIT.get(kvKey);
  const count = countStr ? parseInt(countStr, 10) : 0;
  if (count >= DAILY_LIMIT) {
    return corsJson({ ok: false, error: "daily_limit_reached", limit: DAILY_LIMIT }, 429);
  }

  const reply = await callGemini(env, pet, message);
  if (!reply) return corsJson({ ok: false, error: "ai_failed" }, 502);

  await env.CHAT_RATE_LIMIT.put(kvKey, String(count + 1), { expirationTtl: 60 * 60 * 26 });

  return corsJson({ ok: true, reply, remaining: DAILY_LIMIT - count - 1, limit: DAILY_LIMIT });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/chat") {
      return handleChat(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
