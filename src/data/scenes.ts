import type { SceneAction, TimeSlot, PetKind } from '../types';

export interface TimeConfig {
  slot: TimeSlot;
  label: string;
  emoji: string;
  bgGradient: string;
  sceneLabel: string;
}

export const getTimeConfig = (): TimeConfig => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return {
    slot: 'morning', label: 'おはようの時間', emoji: '🌅',
    bgGradient: 'from-orange-100 via-amber-50 to-yellow-50',
    sceneLabel: 'おうちの朝',
  };
  if (hour >= 10 && hour < 12) return {
    slot: 'daytime', label: '午前の時間', emoji: '☀️',
    bgGradient: 'from-sky-100 via-blue-50 to-white',
    sceneLabel: 'お外で遊ぼう',
  };
  if (hour >= 12 && hour < 14) return {
    slot: 'daytime', label: 'おひるの時間', emoji: '🌞',
    bgGradient: 'from-yellow-100 via-amber-50 to-orange-50',
    sceneLabel: 'おひるのひなたぼっこ',
  };
  if (hour >= 14 && hour < 17) return {
    slot: 'work', label: 'おしごとの時間', emoji: '💼',
    bgGradient: 'from-blue-50 via-indigo-50 to-purple-50',
    sceneLabel: 'のんびりまってるよ',
  };
  if (hour >= 17 && hour < 19) return {
    slot: 'evening', label: 'ゆうがたの時間', emoji: '🌇',
    bgGradient: 'from-orange-200 via-pink-100 to-rose-50',
    sceneLabel: 'おかえりのじかん',
  };
  if (hour >= 19 && hour < 22) return {
    slot: 'evening', label: 'よるの時間', emoji: '🌙',
    bgGradient: 'from-indigo-100 via-purple-50 to-pink-50',
    sceneLabel: 'ゆっくりくつろいで',
  };
  return {
    slot: 'night', label: 'おやすみの時間', emoji: '✨',
    bgGradient: 'from-indigo-200 via-purple-100 to-blue-50',
    sceneLabel: 'おやすみなさい',
  };
};

export const getMorningMessage = (name: string): string => {
  const msgs = [
    `おはよう！${name}だよ〜！`,
    `${name}、起きてたよ！おはようっ♪`,
    `おはよう！今日もいっしょにいようね`,
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
};

export const actions: SceneAction[] = [
  {
    id: 'morning',
    label: 'おはよう',
    emoji: '🌅',
    timeSlots: ['morning'],
    kinds: ['dog', 'cat', 'bird', 'other'],
    response: (name) => `${name}「おはよう！今日もいっしょにいようね♪」`,
  },
  {
    id: 'meal',
    label: 'ごはん',
    emoji: '🍚',
    timeSlots: ['morning', 'evening'],
    kinds: ['dog', 'cat', 'bird', 'other'],
    response: (name) => `${name}「わーい！ごはんごはん！大好き〜！」`,
  },
  {
    id: 'snack',
    label: 'おやつ',
    emoji: '🦴',
    timeSlots: ['morning', 'daytime', 'work', 'evening'],
    kinds: ['dog', 'cat', 'bird', 'other'],
    response: (name) => `${name}「おやつ！？やったー！ありがとう！」`,
  },
  {
    id: 'walk',
    label: 'おさんぽ',
    emoji: '🐾',
    timeSlots: ['morning', 'daytime', 'evening'],
    kinds: ['dog', 'other'],
    response: (name) => `${name}「おそとっ！おそとっ！わーい！」`,
  },
  {
    id: 'play',
    label: 'あそぶ',
    emoji: '🎾',
    timeSlots: ['morning', 'daytime', 'evening'],
    kinds: ['dog', 'cat', 'bird', 'other'],
    response: (name) => `${name}「あそぼ！あそぼ！もっと！もっと！」`,
  },
  {
    id: 'cafe',
    label: 'カフェ',
    emoji: '☕',
    timeSlots: ['daytime', 'work'],
    kinds: ['dog', 'cat', 'other'],
    response: (name) => `${name}「おしゃれなところ〜！一緒に来れてうれしい」`,
  },
  {
    id: 'nap',
    label: 'おひるね',
    emoji: '😴',
    timeSlots: ['daytime', 'work'],
    kinds: ['dog', 'cat', 'bird', 'other'],
    response: (name) => `${name}「zzz...（きもちいい夢みてるよ）」`,
  },
  {
    id: 'peek',
    label: 'のぞく',
    emoji: '👀',
    timeSlots: ['work'],
    kinds: ['dog', 'cat', 'bird', 'other'],
    response: (name) => `${name}「あっ！きてくれた！ちゃんとまってたよ〜」`,
  },
  {
    id: 'cuddle',
    label: 'ぎゅっと',
    emoji: '🤗',
    timeSlots: ['morning', 'evening', 'night'],
    kinds: ['dog', 'cat', 'bird', 'other'],
    response: (name) => `${name}「...（しあわせ）」`,
  },
  {
    id: 'goodnight',
    label: 'おやすみ',
    emoji: '🌙',
    timeSlots: ['night'],
    kinds: ['dog', 'cat', 'bird', 'other'],
    response: (name) => `${name}「おやすみ。明日もいっしょにいようね」`,
  },
];

export const getActionsForTimeAndKind = (slot: TimeSlot, kind: PetKind): SceneAction[] => {
  return actions.filter(a => a.timeSlots.includes(slot) && a.kinds.includes(kind));
};
