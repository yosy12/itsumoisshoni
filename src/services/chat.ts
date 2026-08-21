import type { Pet } from '../types';

export interface ChatResult {
  ok: true;
  reply: string;
  remaining: number;
  limit: number;
}

export interface ChatError {
  ok: false;
  error: 'daily_limit_reached' | 'ai_not_configured' | 'ai_failed' | string;
  limit?: number;
}

export const sendChatMessage = async (pet: Pet, message: string): Promise<ChatResult | ChatError> => {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message,
      pet: {
        name: pet.name,
        kind: pet.kind,
        status: pet.status,
        personality: pet.personality,
        likes: pet.likes,
        dislikes: pet.dislikes,
      },
    }),
  });
  return res.json();
};
