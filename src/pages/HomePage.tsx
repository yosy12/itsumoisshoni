import { useState } from 'react';
import { samplePets } from '../data/samplePets';
import { getTimeConfig, getActionsForTimeAndKind } from '../data/scenes';
import type { Pet } from '../types';

interface HomePageProps {
  onRegister: () => void;
}

export const HomePage = ({ onRegister }: HomePageProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  const timeConfig = getTimeConfig();
  const pet: Pet = samplePets[currentIndex];
  const availableActions = getActionsForTimeAndKind(timeConfig.slot, pet.kind);

  const handleAction = (response: (name: string) => string) => {
    setMessage(response(pet.name));
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };

  const prev = () => setCurrentIndex(i => (i - 1 + samplePets.length) % samplePets.length);
  const next = () => setCurrentIndex(i => (i + 1) % samplePets.length);

  return (
    <div className={`min-h-screen bg-gradient-to-b ${timeConfig.bgGradient} flex flex-col items-center`}>
      {/* ヘッダー */}
      <div className="w-full max-w-sm px-4 pt-8 pb-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-amber-800 tracking-widest">いつも一緒</h1>
          <p className="text-xs text-amber-600 mt-1">{timeConfig.emoji} {timeConfig.label}</p>
        </div>
      </div>

      {/* シーンカード */}
      <div className="w-full max-w-sm px-4 flex-1 flex flex-col items-center">
        <div className="w-full bg-white/70 backdrop-blur rounded-3xl shadow-lg overflow-hidden">

          {/* シーンラベル */}
          <div className="bg-amber-100/80 text-center py-2">
            <span className="text-xs font-medium text-amber-700">{timeConfig.sceneLabel}</span>
          </div>

          {/* ペット写真 */}
          <div className="relative pt-6 pb-4 px-6 flex flex-col items-center">
            <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-md">
              <img
                src={pet.photo}
                alt={pet.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="mt-3 text-xl font-bold text-gray-700">{pet.name}</h2>
            <p className="text-xs text-gray-400 mt-1">{pet.personality}</p>

            {/* セリフバブル */}
            {showMessage && (
              <div className="absolute top-4 right-4 left-4 bg-white rounded-2xl p-3 shadow-md border border-amber-100 text-sm text-gray-600 text-center">
                {message}
              </div>
            )}
          </div>

          {/* サンプル切り替え */}
          <div className="flex justify-center items-center gap-4 pb-3">
            <button onClick={prev} className="text-gray-400 hover:text-gray-600 text-xl px-3 py-1">‹</button>
            <div className="flex gap-1">
              {samplePets.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentIndex ? 'bg-amber-400' : 'bg-gray-200'}`} />
              ))}
            </div>
            <button onClick={next} className="text-gray-400 hover:text-gray-600 text-xl px-3 py-1">›</button>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="w-full mt-4 grid grid-cols-3 gap-2">
          {availableActions.map(action => (
            <button
              key={action.id}
              onClick={() => handleAction(action.response)}
              className="bg-white/80 hover:bg-amber-50 active:scale-95 transition-all rounded-2xl py-3 px-2 flex flex-col items-center gap-1 shadow-sm border border-amber-100"
            >
              <span className="text-2xl">{action.emoji}</span>
              <span className="text-xs text-gray-600 font-medium">{action.label}</span>
            </button>
          ))}
        </div>

        {/* 登録CTA */}
        <div className="w-full mt-6 mb-8">
          <button
            onClick={onRegister}
            className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all text-white font-bold py-4 rounded-2xl shadow-md text-base tracking-wide"
          >
            🐾 自分のコを登録する
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">無料ではじめられます</p>
        </div>
      </div>
    </div>
  );
};
