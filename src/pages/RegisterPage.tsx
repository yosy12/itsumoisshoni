import { useState, useRef } from 'react';
import type { Pet, PetKind, PetStatus } from '../types';

interface PrefilledPet {
  name?: string;
  kind?: PetKind;
  photo?: string;
  status?: PetStatus;
  fromOsewa?: boolean;
}

interface RegisterPageProps {
  onComplete: (pet: Pet) => void;
  onBack: () => void;
  prefilled?: PrefilledPet;
}

const kindOptions: { value: PetKind; label: string; emoji: string }[] = [
  { value: 'dog', label: 'いぬ', emoji: '🐕' },
  { value: 'cat', label: 'ねこ', emoji: '🐈' },
  { value: 'bird', label: 'ことり', emoji: '🦜' },
  { value: 'other', label: 'その他', emoji: '🐾' },
];

const statusOptions: { value: PetStatus; label: string; desc: string }[] = [
  { value: 'rainbow', label: 'お空にいるコ', desc: '虹の橋を渡ったあの子' },
  { value: 'living', label: '今いるコ', desc: '一緒に暮らしているコ' },
  { value: 'virtual', label: '架空のコ', desc: '夢の子・想像のコ' },
];

export const RegisterPage = ({ onComplete, onBack, prefilled }: RegisterPageProps) => {
  const [name, setName] = useState(prefilled?.name || '');
  const [kind, setKind] = useState<PetKind>(prefilled?.kind || 'dog');
  const [status, setStatus] = useState<PetStatus>(prefilled?.status || 'rainbow');
  const [personality, setPersonality] = useState('');
  const [likes, setLikes] = useState('');
  const [photo, setPhoto] = useState<string>(prefilled?.photo || '');
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const pet: Pet = {
      id: `pet_${Date.now()}`,
      name: name.trim(),
      photo: photo || `${import.meta.env.BASE_URL}pets/chuck.jpg`,
      kind,
      status,
      personality: personality.trim(),
      likes: likes.trim(),
      dislikes: '',
    };
    onComplete(pet);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center px-4 pt-8 pb-4">
        <button onClick={onBack} className="text-amber-600 text-lg p-2">‹ もどる</button>
        <h1 className="flex-1 text-center text-lg font-bold text-amber-800 mr-8">このコについて</h1>
      </div>

      {/* お世話管理からの引き継ぎバナー */}
      {prefilled?.fromOsewa && (
        <div className="mx-4 mb-2 bg-amber-100 border border-amber-300 rounded-2xl px-4 py-3 text-sm text-amber-800 text-center">
          🌈 お世話管理アプリから引き継ぎました。<br />
          <span className="text-xs text-amber-600">内容を確認して登録してください</span>
        </div>
      )}

      <div className="flex-1 px-4 pb-8 flex flex-col gap-5 max-w-sm mx-auto w-full">

        {/* 写真 */}
        <div className="flex flex-col items-center gap-2">
          <div
            onClick={() => fileRef.current?.click()}
            className="w-32 h-32 rounded-full overflow-hidden border-4 border-amber-200 shadow cursor-pointer bg-amber-50 flex items-center justify-center"
          >
            {photo
              ? <img src={photo} alt="pet" className="w-full h-full object-cover" />
              : <span className="text-4xl">📷</span>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <p className="text-xs text-gray-400">タップして写真を変更</p>
        </div>

        {/* 名前 */}
        <div>
          <label className="text-sm font-medium text-gray-600 mb-1 block">名前</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="例：チャック"
            className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-base outline-none focus:border-amber-400"
          />
        </div>

        {/* 種別 */}
        <div>
          <label className="text-sm font-medium text-gray-600 mb-2 block">種類</label>
          <div className="grid grid-cols-4 gap-2">
            {kindOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setKind(opt.value)}
                className={`py-3 rounded-xl flex flex-col items-center gap-1 border transition-all ${kind === opt.value ? 'bg-amber-400 border-amber-400 text-white' : 'bg-white border-amber-200 text-gray-600'}`}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className="text-xs">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ステータス */}
        <div>
          <label className="text-sm font-medium text-gray-600 mb-2 block">このコは…</label>
          <div className="flex flex-col gap-2">
            {statusOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`py-3 px-4 rounded-xl text-left border transition-all ${status === opt.value ? 'bg-amber-50 border-amber-400' : 'bg-white border-amber-100'}`}
              >
                <span className={`text-sm font-medium ${status === opt.value ? 'text-amber-700' : 'text-gray-700'}`}>{opt.label}</span>
                <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 性格 */}
        <div>
          <label className="text-sm font-medium text-gray-600 mb-1 block">性格・特徴</label>
          <textarea
            value={personality}
            onChange={e => setPersonality(e.target.value)}
            placeholder="例：甘えん坊で食いしん坊。でも臆病なところも…"
            rows={3}
            className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400 resize-none"
          />
        </div>

        {/* 好きなもの */}
        <div>
          <label className="text-sm font-medium text-gray-600 mb-1 block">好きなもの</label>
          <input
            type="text"
            value={likes}
            onChange={e => setLikes(e.target.value)}
            placeholder="例：おやつ、お散歩、ぎゅっとされること"
            className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400"
          />
        </div>

        {/* 登録ボタン */}
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="w-full bg-amber-500 disabled:bg-gray-300 hover:bg-amber-600 active:scale-95 transition-all text-white font-bold py-4 rounded-2xl shadow-md text-base tracking-wide"
        >
          🐾 登録する
        </button>
      </div>
    </div>
  );
};
