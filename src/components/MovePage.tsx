import type { MovePhase } from '../hooks/useOriginMove';
import { CANONICAL_ORIGIN } from '../config/origins';

// 旧アドレスで表示する「新しいアドレスへ引っ越しました」の画面。
interface MovePageProps {
  phase: MovePhase;
  petCount: number;
  onMove: () => void;
  onStay: () => void;
}

const canonicalHost = new URL(CANONICAL_ORIGIN).host;

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col items-center justify-center px-6 py-12 gap-5 text-center">
    {children}
  </div>
);

const PrimaryButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all text-white font-bold py-4 rounded-2xl shadow-lg text-base"
  >
    {children}
  </button>
);

const StayButton = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="text-sm text-amber-700 underline underline-offset-4 py-2">
    今はこのまま使う
  </button>
);

export const MovePage = ({ phase, petCount, onMove, onStay }: MovePageProps) => {
  if (phase.kind === 'checking' || phase.kind === 'handingOver') {
    return <Frame><p className="text-amber-700">よみこみ中…</p></Frame>;
  }
  if (phase.kind === 'sending') {
    return (
      <Frame>
        <p className="text-amber-800 font-bold">新しい画面に記録を渡しています…</p>
        <p className="text-sm text-gray-500">開いた新しい画面は、そのままにしてください。</p>
      </Frame>
    );
  }
  if (phase.kind === 'sent') {
    return (
      <Frame>
        <h1 className="text-xl font-bold text-amber-800">引っ越しが終わりました</h1>
        <p className="text-sm text-gray-600">{phase.petCount}匹の記録を新しいアドレスに移しました。<br />このページは閉じてかまいません。</p>
        <a href={CANONICAL_ORIGIN} className="w-full bg-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg">
          新しいアドレスで開く
        </a>
      </Frame>
    );
  }
  return (
    <Frame>
      <h1 className="text-xl font-bold text-amber-800">「いつも一緒」は<br />新しいアドレスに引っ越しました</h1>
      <p className="text-sm text-gray-600 break-all">新しいアドレス: <span className="font-medium">{canonicalHost}</span></p>
      <p className="text-sm text-gray-600">
        登録したコの記録（{petCount}匹）を、そのまま新しいアドレスへ移せます。<br />
        記録はこの端末の中だけで受け渡し、インターネットには送りません。
      </p>
      {phase.kind === 'sendFailed' && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
          うまく移せませんでした。記録はこのアドレスに残っています。<br />
          新しい画面が開かなかった場合は、ポップアップを許可してもう一度お試しください。
        </p>
      )}
      <PrimaryButton onClick={onMove}>{phase.kind === 'sendFailed' ? 'もう一度ためす' : '記録ごと新しいアドレスへ移る'}</PrimaryButton>
      <StayButton onClick={onStay} />
    </Frame>
  );
};
