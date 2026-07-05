import { useState, useEffect } from 'react';
import type { AppState, Pet } from '../types';

const STORAGE_KEY = 'itsumoisshoni_state';

const defaultState: AppState = {
  registeredPets: [],
  currentPetId: null,
  theme: 'warm',
  lastVisited: null,
};

export const useAppState = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
    } catch {
      return defaultState;
    }
  });

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

  const getCurrentPet = (): Pet | null => {
    if (!state.currentPetId) return null;
    return state.registeredPets.find(p => p.id === state.currentPetId) ?? null;
  };

  return { state, registerPet, switchPet, getCurrentPet };
};
