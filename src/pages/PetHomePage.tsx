import { useState } from 'react';
import type { Pet } from '../types';
import { getTimeConfig, getActionsForTimeAndKind } from '../data/scenes';

interface PetHomePageProps {
  pet: Pet;
  allPets: Pet[];
  onSwitchPet: (id: string) => void;
  onAddPet: () => void;
}

const sceneDecorations: Record<string, string> = {
  morning: '🌅 ☀️ 🐦',
  daytime: '☀️ 🌿 🌸',
  work: '💤 🌿 ☁️',
  evening: '🌇 🍂 🌙',
  night: '🌙 ⭐ ✨',
};

const premiumFeatures = [
  { id: 'talk', emoji: '💬', label: '話しかける', desc: `${' '}AIがその子らしく返事してくれます` },
  { id: 'album', emoji: '📷', label: 'アルバム', desc: '季節ごとに思い出を残せます' },
  { id: 'theme', emoji: '🎨', label: '雰囲気', desc: '背景テーマを選べます' },
];

export const PetHomePage = ({ pet, allPets, onSwitchPet, onAddPet }: PetHomePageProps) => {
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [showPetList, setShowPetList] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [showPremium, setShowPremium] = useState(false);
  const [tappedFeature, setTappedFeature] = useState<typeof premiumFeatures[0] | null>(null);

  const timeConfig = getTimeConfig();
  const availableActions = getActionsForTimeAndKind(timeConfig.slot, pet.kind);
  const decoration = sceneDecorations[timeConfig.slot] || '🌿';

  const handleAction = (actionId: string, response: (name: string) => string) => {
    setMessage(response(pet.name));
    setShowMessage(true);
    setActiveAction(actionId);
    setTimeout(() => {
      setShowMessage(false);
      setActiveAction(null);
    }, 3000);
  };

  const handlePremiumTap = (feature: typeof premiumFeatures[0]) => {
    setTappedFeature(feature);
    setShowPremium(true);
  };

  const statusEmoji = pet.status === 'rainbow' ? '🌈' : pet.status === 'living' ? '🏠' : '⭐';

  return (
    <div className={`min-h-screen bg-gradient-to-b ${timeConfig.bgGradient} flex flex-col`}>

      {/* ヘッダー */}
      <div className="flex justify-between items-center px-5 pt-10 pb-2">
        <button
          onClick={() => setShowPetList(!showPetList)}
          className="w-9 h-9 rounded-full bg-white/60 backdrop-blur flex items-center justify-center text-base shadow-sm"
        >
          🐾
        </button>
        <div className="text-center">
          <h1 className="text-base font-bold text-amber-900 tracking-widest">いつも一緒</h1>
          <p className="text-xs text-amber-700/70">{timeConfig.emoji} {timeConfig.label}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-white/60 backdrop-blur flex items-center justify-center text-base shadow-sm">
          ⚙️
        </div>
      </div>

      {/* ペット切り替えリスト */}
      {showPetList && (
        <div className="mx-4 mb-2">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-3 flex flex-col gap-2">
            {allPets.map(p => (
              <button
                key={p.id}
                onClick={() => { onSwitchPet(p.id); setShowPetList(false); }}
                className={`flex items-center gap-3 p-2 rounded-xl transition-all ${p.id === pet.id ? 'bg-amber-50 border border-amber-300' : 'hover:bg-gray-50'}`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow">
                  <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-medium text-gray-700">{p.name}</span>
                {p.id === pet.id && <span className="ml-auto text-amber-500 text-xs font-medium">いま</span>}
              </button>
            ))}
            <button
              onClick={() => { onAddPet(); setShowPetList(false); }}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 text-gray-400"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">＋</div>
              <span className="text-sm">あたらしいコを追加</span>
            </button>
          </div>
        </div>
      )}

      {/* メインエリア */}
      <div className="flex-1 flex flex-col items-center px-5">

        {/* シーン装飾 */}
        <div className="text-2xl tracking-widest opacity-40 mb-1 select-none">{decoration}</div>

        {/* シーンラベル */}
        <div className="bg-white/50 backdrop-blur px-4 py-1 rounded-full mb-4">
          <span className="text-xs font-medium text-amber-800">{timeConfig.sceneLabel}</span>
        </div>

        {/* ペット写真エリア */}
        <div className="relative flex flex-col items-center mb-4">
          {showMessage && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 bg-white rounded-2xl px-4 py-3 shadow-lg border border-amber-100 z-10">
              <p className="text-sm text-gray-600 text-center leading-relaxed">{message}</p>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-amber-100 rotate-45" />
            </div>
          )}
          <div className={`relative transition-transform duration-300 ${activeAction ? 'scale-105' : 'scale-100'}`}>
            <div className="w-56 h-56 rounded-full overflow-hidden border-[6px] border-white shadow-2xl">
              <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-base">
              {statusEmoji}
            </div>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-amber-900">{pet.name}</h2>
          {pet.personality && (
            <p className="text-xs text-amber-700/60 mt-1 text-center max-w-xs">{pet.personality}</p>
          )}
        </div>

        {/* 無料アクションボタン */}
        <div className="w-full grid grid-cols-3 gap-2.5 mb-3">
          {availableActions.map(action => (
            <button
              key={action.id}
              onClick={() => handleAction(action.id, action.response)}
              className={`rounded-2xl py-3.5 px-2 flex flex-col items-center gap-1.5 shadow-sm border transition-all active:scale-95
                ${activeAction === action.id
                  ? 'bg-amber-100 border-amber-300 scale-95'
                  : 'bg-white/80 backdrop-blur border-white hover:bg-amber-50 hover:border-amber-200'
                }`}
            >
              <span className="text-2xl">{action.emoji}</span>
              <span className="text-xs text-gray-600 font-medium">{action.label}</span>
            </button>
          ))}
        </div>

        {/* プレミアム機能（鍵付き） */}
        <div className="w-full mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-px bg-amber-200/60" />
            <span className="text-xs text-amber-600/70 font-medium">プレミアム機能</span>
            <div className="flex-1 h-px bg-amber-200/60" />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {premiumFeatures.map(feature => (
              <button
                key={feature.id}
                onClick={() => handlePremiumTap(feature)}
                className="relative rounded-2xl py-3.5 px-2 flex flex-col items-center gap-1.5 bg-white/40 backdrop-blur border border-white/60 shadow-sm active:scale-95 transition-all"
              >
                <span className="text-2xl opacity-50">{feature.emoji}</span>
                <span className="text-xs text-gray-400 font-medium">{feature.label}</span>
                <div className="absolute top-1.5 right-1.5 text-xs">🔒</div>
              </button>
            ))}
          </div>
        </div>

        {/* My Treasury ARF リンク */}
        <a
          href="https://my-treasury-arf.pages.dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full text-center text-xs text-amber-700 bg-white/50 backdrop-blur border border-amber-200/50 rounded-xl py-3 mb-6 hover:bg-white/70 transition-all"
        >
          🌿 ペットのことで迷ったら → <span className="font-medium">My Treasury ARF</span> に相談
        </a>
      </div>

      {/* プレミアム紹介モーダル */}
      {showPremium && tappedFeature && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-50"
          onClick={() => setShowPremium(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-t-3xl p-6 pb-10 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="text-4xl text-center mb-3">{tappedFeature.emoji}</div>
            <h3 className="text-lg font-bold text-center text-gray-800 mb-1">{tappedFeature.label}</h3>
            <p className="text-sm text-gray-500 text-center mb-5">{tappedFeature.desc}</p>

            <div className="bg-amber-50 rounded-2xl p-4 mb-5">
              <p className="text-xs text-amber-700 text-center font-medium">
                🌟 プレミアムプランで使えるようになります
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {premiumFeatures.map(f => (
                  <div key={f.id} className="flex items-center gap-2 text-xs text-gray-600">
                    <span>{f.emoji}</span>
                    <span>{f.label}</span>
                    <span className="text-gray-400">— {f.desc.trim()}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowPremium(false)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-2xl text-sm active:scale-95 transition-all"
            >
              近日公開予定 — お楽しみに 🐾
            </button>
            <button
              onClick={() => setShowPremium(false)}
              className="w-full text-gray-400 text-sm mt-3"
            >
              とじる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
