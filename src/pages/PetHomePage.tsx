import { useState } from 'react';
import type { Pet } from '../types';
import { getTimeConfig, getActionsForTimeAndKind } from '../data/scenes';

interface PetHomePageProps {
  pet: Pet;
  allPets: Pet[];
  onSwitchPet: (id: string) => void;
  onAddPet: () => void;
}

export const PetHomePage = ({ pet, allPets, onSwitchPet, onAddPet }: PetHomePageProps) => {
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [showPetList, setShowPetList] = useState(false);

  const timeConfig = getTimeConfig();
  const availableActions = getActionsForTimeAndKind(timeConfig.slot, pet.kind);

  const handleAction = (response: (name: string) => string) => {
    setMessage(response(pet.name));
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };

  const statusEmoji = pet.status === 'rainbow' ? '🌈' : pet.status === 'living' ? '🏠' : '⭐';

  return (
    <div className={`min-h-screen bg-gradient-to-b ${timeConfig.bgGradient} flex flex-col items-center`}>

      {/* ヘッダー */}
      <div className="w-full max-w-sm px-4 pt-8 pb-2 flex justify-between items-center">
        <button
          onClick={() => setShowPetList(!showPetList)}
          className="text-amber-600 text-sm bg-white/60 px-3 py-1 rounded-full"
        >
          🐾 {allPets.length > 1 ? 'きりかえ' : 'マイペット'}
        </button>
        <h1 className="text-lg font-bold text-amber-800">いつも一緒</h1>
        <button className="text-amber-600 text-sm bg-white/60 px-3 py-1 rounded-full">⚙️</button>
      </div>

      {/* ペット切り替えリスト */}
      {showPetList && (
        <div className="w-full max-w-sm px-4 mb-2">
          <div className="bg-white/90 rounded-2xl shadow p-3 flex flex-col gap-2">
            {allPets.map(p => (
              <button
                key={p.id}
                onClick={() => { onSwitchPet(p.id); setShowPetList(false); }}
                className={`flex items-center gap-3 p-2 rounded-xl transition-all ${p.id === pet.id ? 'bg-amber-50 border border-amber-300' : 'hover:bg-gray-50'}`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-medium text-gray-700">{p.name}</span>
                {p.id === pet.id && <span className="ml-auto text-amber-500 text-xs">いま</span>}
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

      {/* タイムラベル */}
      <div className="text-center mb-2">
        <span className="text-xs text-amber-700 bg-amber-100/80 px-3 py-1 rounded-full">
          {timeConfig.emoji} {timeConfig.sceneLabel}
        </span>
      </div>

      {/* メインカード */}
      <div className="w-full max-w-sm px-4 flex-1 flex flex-col items-center">
        <div className="w-full bg-white/70 backdrop-blur rounded-3xl shadow-lg overflow-hidden">

          <div className="relative pt-6 pb-4 px-6 flex flex-col items-center">

            {/* ステータスバッジ */}
            <div className="absolute top-3 right-4 text-xs text-gray-400">
              {statusEmoji}
            </div>

            {/* ペット写真 */}
            <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-md">
              <img
                src={pet.photo}
                alt={pet.name}
                className="w-full h-full object-cover"
              />
            </div>

            <h2 className="mt-3 text-xl font-bold text-gray-700">{pet.name}</h2>
            {pet.personality && (
              <p className="text-xs text-gray-400 mt-1 text-center">{pet.personality}</p>
            )}

            {/* セリフバブル */}
            {showMessage && (
              <div className="absolute top-4 left-4 right-4 bg-white rounded-2xl p-3 shadow-md border border-amber-100 text-sm text-gray-600 text-center leading-relaxed">
                {message}
              </div>
            )}
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

        {/* My Treasury ARF リンク */}
        <div className="w-full mt-6 mb-8">
          <a
            href="https://my-treasury-arf.pages.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full block text-center text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl py-3 hover:bg-amber-100 transition-all"
          >
            🌿 ペットのことで迷ったら相談できます → My Treasury ARF
          </a>
        </div>
      </div>
    </div>
  );
};
