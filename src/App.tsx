import { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { RegisterPage } from './pages/RegisterPage';
import { PetHomePage } from './pages/PetHomePage';
import { useAppState } from './hooks/useAppState';
import type { Pet, PetKind, PetStatus } from './types';

type Screen = 'home' | 'register' | 'mypet';

interface PrefilledPet {
  name?: string;
  kind?: PetKind;
  photo?: string;
  status?: PetStatus;
  fromOsewa?: boolean;
}

const parseUrlParams = (): PrefilledPet => {
  const params = new URLSearchParams(window.location.search);
  const kind = params.get('kind');
  const status = params.get('status');
  return {
    name: params.get('name') || undefined,
    kind: (['dog','cat','bird','other'].includes(kind || '') ? kind as PetKind : undefined),
    photo: params.get('photo') || undefined,
    status: (['rainbow','living','virtual'].includes(status || '') ? status as PetStatus : undefined),
    fromOsewa: params.get('from') === 'osewa',
  };
};

function App() {
  const { state, registerPet, switchPet, getCurrentPet } = useAppState();
  const prefilled = parseUrlParams();

  const getInitialScreen = (): Screen => {
    if (prefilled.fromOsewa) return 'register';
    if (state.registeredPets.length > 0) return 'mypet';
    return 'home';
  };

  const [screen, setScreen] = useState<Screen>(getInitialScreen);

  const handleRegisterComplete = (pet: Pet) => {
    registerPet(pet);
    // URLパラメータをクリア
    window.history.replaceState({}, '', window.location.pathname);
    setScreen('mypet');
  };

  const currentPet = getCurrentPet();

  return (
    <div className="w-full max-w-sm mx-auto min-h-screen">
      {screen === 'home' && (
        <HomePage onRegister={() => setScreen('register')} />
      )}
      {screen === 'register' && (
        <RegisterPage
          onComplete={handleRegisterComplete}
          onBack={() => setScreen(state.registeredPets.length > 0 ? 'mypet' : 'home')}
          prefilled={prefilled}
        />
      )}
      {screen === 'mypet' && currentPet && (
        <PetHomePage
          pet={currentPet}
          allPets={state.registeredPets}
          onSwitchPet={(id) => switchPet(id)}
          onAddPet={() => setScreen('register')}
        />
      )}
    </div>
  );
}

export default App;
