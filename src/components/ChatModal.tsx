import { useEffect, useRef, useState } from 'react';
import type { Pet } from '../types';
import { sendChatMessage } from '../services/chat';
import type { ThemePalette } from '../data/themes';

interface ChatMessage {
  id: string;
  from: 'user' | 'pet';
  text: string;
}

interface ChatModalProps {
  pet: Pet;
  palette: ThemePalette;
  onClose: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  daily_limit_reached: '今日はもうたくさんお話ししたね。また明日お話ししよう！',
  ai_not_configured: '今は会話の準備中みたい。少し待っててね。',
  ai_failed: 'うまく聞き取れなかったみたい。もう一度話しかけてみて。',
};

export const ChatModal = ({ pet, palette, onClose }: ChatModalProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', from: 'pet', text: `${pet.name}「なにかお話しする？」` },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [remaining, setRemaining] = useState<number | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setErrorText('');
    setInput('');
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, from: 'user', text }]);
    setSending(true);

    const result = await sendChatMessage(pet, text);
    setSending(false);

    if (result.ok) {
      setMessages(prev => [...prev, { id: `p-${Date.now()}`, from: 'pet', text: result.reply }]);
      setRemaining(result.remaining);
    } else {
      setErrorText(ERROR_MESSAGES[result.error] || 'うまくお話しできなかったみたい。もう一度ためしてみてね。');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-50" onClick={onClose}>
      <div
        className="w-full max-w-sm h-[80vh] bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="w-8" />
          <h3 className="text-sm font-bold text-gray-800">{pet.name} とおはなし</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 text-lg">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 bg-gray-50/50">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                  m.from === 'user'
                    ? `${palette.accentBg} text-white`
                    : 'bg-white text-gray-700 shadow-sm border border-gray-100'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-400 shadow-sm border border-gray-100 rounded-2xl px-4 py-2 text-sm">
                …
              </div>
            </div>
          )}
          <div ref={listEndRef} />
        </div>

        {errorText && (
          <div className="px-4 py-2 text-xs text-center text-amber-600 bg-amber-50 border-t border-amber-100">
            {errorText}
          </div>
        )}
        {remaining !== null && remaining <= 5 && !errorText && (
          <div className="px-4 py-1.5 text-xs text-center text-gray-400">
            今日はあと{remaining}回お話しできるよ
          </div>
        )}

        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="話しかけてみよう"
            className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
            maxLength={300}
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 disabled:opacity-40 ${palette.accentBg} ${palette.accentBgHover}`}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};
