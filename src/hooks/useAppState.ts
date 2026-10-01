import { useState, useEffect } from 'react';
import type { AppState, Pet, Theme } from '../types';
import { mergeStates } from '../services/originMove';

const STORAGE_KEY = 'itsumoisshoni_state';

const defaultState: AppState = {
  registeredPets: [],
  currentPetId: null,
  theme: 'warm',
  lastVisited: null,
};

const loadState = (): AppState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
  } catch {
    return defaultState;
  }
};

export const useAppState = () => {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const registerPet = (pet: Pet) => {
    setState(prev => ({
      ...prev,
      registeredPets: [...prev.registeredPets, pet],
      currentPetId: pet.id,
    }));
  };

  const switchPet = (petId: string) => {
    setState(prev => ({ ...prev, currentPetId: petId }));
  };

  const setTheme = (theme: Theme) => {
    setState(prev => ({ ...prev, theme }));
  };

  // 旧アドレスから受け取った記録を合流させる。受け取り完了を旧アドレスへ返す前に保存を終えるため、
  // effect を待たずにここで書き込む（容量超過などで失敗したら例外のまま呼び出し元へ返す）。
  const importState = (incoming: AppState): AppState => {
    const merged = mergeStates(loadState(), incoming);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    setState(merged);
    return merged;
  };

  const getCurrentPet = (): Pet | null => {
    if (!state.currentPetId) return null;
    return state.registeredPets.find(p => p.id === state.currentPetId) ?? null;
  };

  return { state, registerPet, switchPet, setTheme, importState, getCurrentPet };
};
