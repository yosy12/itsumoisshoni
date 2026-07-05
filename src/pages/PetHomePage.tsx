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

export const PetHomePage = ({ pet, allPets, onSwitchPet, onAddPet }: PetHomePageProps) => {
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [showPetList, setShowPetList] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

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

          {/* セリフバブル */}
          {showMessage && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 bg-white rounded-2xl px-4 py-3 shadow-lg border border-amber-100 z-10">
              <p className="text-sm text-gray-600 text-center leading-relaxed">{message}</p>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-amber-100 rotate-45" />
            </div>
          )}

          {/* ペット写真 */}
          <div className={`relative transition-transform duration-300 ${activeAction ? 'scale-105' : 'scale-100'}`}>
            <div className="w-56 h-56 rounded-full overflow-hidden border-[6px] border-white shadow-2xl">
              <img
                src={pet.photo}
                alt={pet.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* ステータスバッジ */}
            <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-base">
              {statusEmoji}
            </div>
          </div>

          {/* 名前 */}
          <h2 className="mt-4 text-2xl font-bold text-amber-900">{pet.name}</h2>
          {pet.personality && (
            <p className="text-xs text-amber-700/60 mt-1 text-center max-w-xs">{pet.personality}</p>
          )}
        </div>

        {/* アクションボタン */}
        <div className="w-full grid grid-cols-3 gap-2.5 mb-4">
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
    </div>
  );
};
