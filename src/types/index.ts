export type PetKind = 'dog' | 'cat' | 'bird' | 'other';
export type PetStatus = 'rainbow' | 'living' | 'virtual';
export type TimeSlot = 'morning' | 'daytime' | 'work' | 'evening' | 'night';
export type Theme = 'warm' | 'calm' | 'seasonal';

export interface Pet {
  id: string;
  name: string;
  photo: string;
  kind: PetKind;
  status: PetStatus;
  personality: string;
  likes: string;
  dislikes: string;
  isOwner?: boolean;
}

export interface AlbumPhoto {
  id: string;
  petId: string;
  url: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  caption?: string;
  withOwner?: boolean;
}

export interface AppState {
  registeredPets: Pet[];
  currentPetId: string | null;
  theme: Theme;
  lastVisited: string | null;
}

export interface SceneAction {
  id: string;
  label: string;
  emoji: string;
  timeSlots: TimeSlot[];
  kinds: PetKind[];
  response: (petName: string) => string;
}
