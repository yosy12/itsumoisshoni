import { useState } from 'react';
import type { Pet, Theme } from '../types';
import { getTimeConfig, getActionsForTimeAndKind } from '../data/scenes';
import { THEMES, getThemePalette } from '../data/themes';
import { ChatModal } from '../components/ChatModal';

interface PetHomePageProps {
  pet: Pet;
  allPets: Pet[];
  theme: Theme;
  onSwitchPet: (id: string) => void;
  onAddPet: () => void;
  onSetTheme: (theme: Theme) => void;
}

const sceneDecorations: Record<string, string> = {
  morning: '🌅 ☀️ 🐦',
  daytime: '☀️ 🌿 🌸',
  work: '💤 🌿 ☁️',
  evening: '🌇 🍂 🌙',
  night: '🌙 ⭐ ✨',
};

const premiumFeatures = [
  { id: 'album', emoji: '📷', label: 'アルバム', desc: '季節ごとに思い出を残せます' },
];

export const PetHomePage = ({ pet, allPets, theme, onSwitchPet, onAddPet, onSetTheme }: PetHomePageProps) => {
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [showPetList, setShowPetList] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [showPremium, setShowPremium] = useState(false);
  const [tappedFeature, setTappedFeature] = useState<typeof premiumFeatures[0] | null>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const timeConfig = getTimeConfig();
  const availableActions = getActionsForTimeAndKind(timeConfig.slot, pet.kind);
  const decoration = sceneDecorations[timeConfig.slot] || '🌿';
  const palette = getThemePalette(theme);

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
    <div className={`min-h-screen bg-gradient-to-b ${palette.bgGradient} flex flex-col`}>

      {/* ヘッダー */}
      <div className="flex justify-between items-center px-5 pt-10 pb-2">
        <button
          onClick={() => setShowPetList(!showPetList)}
          className="w-9 h-9 rounded-full bg-white/60 backdrop-blur flex items-center justify-center text-base shadow-sm"
        >
          🐾
        </button>
        <div className="text-center">
          <h1 className={`text-base font-bold tracking-widest ${palette.headerText}`}>いつも一緒</h1>
          <p className={`text-xs ${palette.subText}`}>{timeConfig.emoji} {timeConfig.label}</p>
        </div>
        <button
          onClick={() => setShowThemePicker(true)}
          className="w-9 h-9 rounded-full bg-white/60 backdrop-blur flex items-center justify-center text-base shadow-sm"
          aria-label="雰囲気テーマを選ぶ"
        >
          ⚙️
        </button>
      </div>

      {/* ペット切り替えリスト */}
      {showPetList && (
        <div className="mx-4 mb-2">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-3 flex flex-col gap-2">
            {allPets.map(p => (
              <button
                key={p.id}
                onClick={() => { onSwitchPet(p.id); setShowPetList(false); }}
                className={`flex items-center gap-3 p-2 rounded-xl transition-all ${p.id === pet.id ? `bg-amber-50 border ${palette.border}` : 'hover:bg-gray-50'}`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow">
                  <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-medium text-gray-700">{p.name}</span>
                {p.id === pet.id && <span className={`ml-auto text-xs font-medium ${palette.accentText}`}>いま</span>}
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
          <span className={`text-xs font-medium ${palette.accentText}`}>{timeConfig.sceneLabel}</span>
        </div>

        {/* ペット写真エリア */}
        <div className="relative flex flex-col items-center mb-4">
          {showMessage && (
            <div className={`absolute -top-16 left-1/2 -translate-x-1/2 w-64 bg-white rounded-2xl px-4 py-3 shadow-lg border ${palette.border} z-10`}>
              <p className="text-sm text-gray-600 text-center leading-relaxed">{message}</p>
              <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b ${palette.border} rotate-45`} />
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
          <h2 className={`mt-4 text-2xl font-bold ${palette.headerText}`}>{pet.name}</h2>
          {pet.personality && (
            <p className={`text-xs mt-1 text-center max-w-xs ${palette.subText}`}>{pet.personality}</p>
          )}
          <button
            onClick={() => setShowChat(true)}
            className={`mt-3 flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-bold text-white shadow-sm active:scale-95 transition-all ${palette.accentBg} ${palette.accentBgHover}`}
          >
            💬 はなしかける
          </button>
        </div>

        {/* 無料アクションボタン */}
        <div className="w-full grid grid-cols-3 gap-2.5 mb-3">
          {availableActions.map(action => (
            <button
              key={action.id}
              onClick={() => handleAction(action.id, action.response)}
              className={`rounded-2xl py-3.5 px-2 flex flex-col items-center gap-1.5 shadow-sm border transition-all active:scale-95
                ${activeAction === action.id
                  ? `bg-amber-100 ${palette.border} scale-95`
                  : `bg-white/80 backdrop-blur border-white ${palette.actionHover}`
                }`}
            >
              <span className="text-2xl">{action.emoji}</span>
              <span className="text-xs text-gray-600 font-medium">{action.label}</span>
            </button>
          ))}
        </div>

        {/* 雰囲気テーマ（無料機能） */}
        <div className="w-full mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-px bg-white/60" />
            <span className={`text-xs font-medium ${palette.accentText}`}>雰囲気テーマ</span>
            <div className="flex-1 h-px bg-white/60" />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {(Object.keys(THEMES) as Theme[]).map(id => {
              const p = getThemePalette(id);
              const selected = id === theme;
              return (
                <button
                  key={id}
                  onClick={() => onSetTheme(id)}
                  className={`rounded-2xl py-3 px-2 flex flex-col items-center gap-1.5 bg-white/70 backdrop-blur border-2 shadow-sm active:scale-95 transition-all ${selected ? palette.border : 'border-transparent'}`}
                >
                  <div className={`w-7 h-7 rounded-full ${p.swatch} ${selected ? 'ring-2 ring-offset-1 ring-white' : ''}`} />
                  <span className="text-[11px] text-gray-600 font-medium">{p.emoji} {p.label.replace(/（.+）/, '')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* プレミアム機能（鍵付き） */}
        <div className="w-full mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-px bg-white/60" />
            <span className={`text-xs font-medium ${palette.subText}`}>プレミアム機能</span>
            <div className="flex-1 h-px bg-white/60" />
          </div>
          <div className="flex justify-center">
            {premiumFeatures.map(feature => (
              <button
                key={feature.id}
                onClick={() => handlePremiumTap(feature)}
                className="relative rounded-2xl py-3.5 px-6 flex flex-col items-center gap-1.5 bg-white/40 backdrop-blur border border-white/60 shadow-sm active:scale-95 transition-all"
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
          href="https://mytreasuryarf.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full text-center text-xs ${palette.accentText} bg-white/50 backdrop-blur border ${palette.border}/50 rounded-xl py-3 mb-6 hover:bg-white/70 transition-all`}
        >
          🌿 ペットのことで迷ったら → <span className="font-medium">My Treasury ARF</span> に相談
        </a>
      </div>

      {/* 雰囲気テーマ選択（設定アイコンからも開ける） */}
      {showThemePicker && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-50"
          onClick={() => setShowThemePicker(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-t-3xl p-6 pb-10 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="text-lg font-bold text-center text-gray-800 mb-4">雰囲気テーマ</h3>
            <div className="flex flex-col gap-2 mb-5">
              {(Object.keys(THEMES) as Theme[]).map(id => {
                const p = getThemePalette(id);
                const selected = id === theme;
                return (
                  <button
                    key={id}
                    onClick={() => onSetTheme(id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${selected ? `${p.border} bg-white` : 'border-transparent bg-gray-50'}`}
                  >
                    <div className={`w-9 h-9 rounded-full ${p.swatch}`} />
                    <div className="text-left flex-1">
                      <p className="text-sm font-bold text-gray-800">{p.emoji} {p.label}</p>
                      <p className="text-xs text-gray-500">{p.desc}</p>
                    </div>
                    {selected && <span className="text-xs font-medium text-gray-400">選択中</span>}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowThemePicker(false)}
              className={`w-full ${palette.accentBg} ${palette.accentBgHover} text-white font-bold py-3.5 rounded-2xl text-sm active:scale-95 transition-all`}
            >
              とじる
            </button>
          </div>
        </div>
      )}

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

      {showChat && <ChatModal pet={pet} palette={palette} onClose={() => setShowChat(false)} />}
    </div>
  );
};
