import { useState } from 'react';
import { samplePets } from '../data/samplePets';
import { getTimeConfig, getActionsForTimeAndKind } from '../data/scenes';
import type { Pet } from '../types';

interface HomePageProps {
  onRegister: () => void;
}

const sceneDecorations: Record<string, string> = {
  morning: '🌅 ☀️ 🐦',
  daytime: '☀️ 🌿 🌸',
  work: '💤 🌿 ☁️',
  evening: '🌇 🍂 🌙',
  night: '🌙 ⭐ ✨',
};

export const HomePage = ({ onRegister }: HomePageProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const timeConfig = getTimeConfig();
  const pet: Pet = samplePets[currentIndex];
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

  const prev = () => {
    setShowMessage(false);
    setCurrentIndex(i => (i - 1 + samplePets.length) % samplePets.length);
  };
  const next = () => {
    setShowMessage(false);
    setCurrentIndex(i => (i + 1) % samplePets.length);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${timeConfig.bgGradient} flex flex-col`}>

      {/* ヘッダー */}
      <div className="text-center pt-10 pb-2 px-5">
        <h1 className="text-xl font-bold text-amber-900 tracking-widest">いつも一緒</h1>
        <p className="text-xs text-amber-700/70 mt-0.5">{timeConfig.emoji} {timeConfig.label}</p>
      </div>

      <div className="flex-1 flex flex-col items-center px-5">

        {/* シーン装飾 */}
        <div className="text-2xl tracking-widest opacity-40 mb-1 select-none">{decoration}</div>

        {/* シーンラベル */}
        <div className="bg-white/50 backdrop-blur px-4 py-1 rounded-full mb-6">
          <span className="text-xs font-medium text-amber-800">{timeConfig.sceneLabel}</span>
        </div>

        {/* ペット写真エリア */}
        <div className="relative flex flex-col items-center mb-5">

          {/* セリフバブル */}
          {showMessage && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 bg-white rounded-2xl px-4 py-3 shadow-lg border border-amber-100 z-10">
              <p className="text-sm text-gray-600 text-center leading-relaxed">{message}</p>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-amber-100 rotate-45" />
            </div>
          )}

          {/* ペット写真 */}
          <div className={`transition-transform duration-300 ${activeAction ? 'scale-105' : 'scale-100'}`}>
            <div className="w-56 h-56 rounded-full overflow-hidden border-[6px] border-white shadow-2xl">
              <img
                src={pet.photo}
                alt={pet.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* 名前・切り替え */}
          <div className="flex items-center gap-3 mt-4">
            <button onClick={prev} className="text-amber-600/60 hover:text-amber-700 text-2xl w-8 text-center">‹</button>
            <div className="text-center">
              <h2 className="text-xl font-bold text-amber-900">{pet.name}</h2>
              <div className="flex gap-1 justify-center mt-1">
                {samplePets.map((_, i) => (
                  <div key={i} className={`rounded-full transition-all ${i === currentIndex ? 'w-4 h-1.5 bg-amber-400' : 'w-1.5 h-1.5 bg-amber-200'}`} />
                ))}
              </div>
            </div>
            <button onClick={next} className="text-amber-600/60 hover:text-amber-700 text-2xl w-8 text-center">›</button>
          </div>

          <p className="text-xs text-amber-700/50 mt-1 text-center">{pet.personality}</p>
        </div>

        {/* アクションボタン */}
        <div className="w-full grid grid-cols-3 gap-2.5 mb-5">
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

        {/* 登録CTA */}
        <div className="w-full mb-8">
          <button
            onClick={onRegister}
            className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all text-white font-bold py-4 rounded-2xl shadow-lg text-base tracking-wide"
          >
            🐾 自分のコを登録する
          </button>
          <p className="text-center text-xs text-amber-700/50 mt-2">無料ではじめられます</p>
        </div>
      </div>
    </div>
  );
};
