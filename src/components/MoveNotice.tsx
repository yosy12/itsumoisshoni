import type { MovePhase } from '../hooks/useOriginMove';

// 新アドレスで表示する、記録の引き継ぎの進み具合のお知らせ。
interface MoveNoticeProps {
  phase: MovePhase;
  onClose: () => void;
}

const messageOf = (phase: MovePhase): { text: string; error?: boolean } | null => {
  switch (phase.kind) {
    case 'receiving':
    case 'pulling':
      return { text: '前のアドレスから記録を受け取っています…' };
    case 'received':
      return phase.petCount > 0
        ? { text: `前のアドレスから${phase.petCount}匹の記録を引き継ぎました` }
        : { text: '前のアドレスには、引き継ぐ記録がありませんでした' };
    case 'receiveFailed':
      return { text: 'うまく引き継げませんでした。記録は前のアドレスに残っています。ポップアップを許可してもう一度お試しください', error: true };
    default:
      return null;
  }
};

export const MoveNotice = ({ phase, onClose }: MoveNoticeProps) => {
  const message = messageOf(phase);
  if (!message) return null;
  const done = phase.kind === 'received' || phase.kind === 'receiveFailed';
  return (
    <div
      role="status"
      className={`fixed top-3 inset-x-0 z-50 mx-auto w-[calc(100%-2rem)] max-w-sm shadow-lg rounded-2xl px-4 py-3 text-sm flex items-start gap-2 border ${message.error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-100 border-amber-300 text-amber-800'}`}
    >
      <span className="flex-1">{message.text}</span>
      {done && <button onClick={onClose} aria-label="お知らせを閉じる" className="px-1">×</button>}
    </div>
  );
};
