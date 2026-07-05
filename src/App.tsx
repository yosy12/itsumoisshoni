import { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { RegisterPage } from './pages/RegisterPage';
import { PetHomePage } from './pages/PetHomePage';
import { useAppState } from './hooks/useAppState';
import type { Pet } from './types';

type Screen = 'home' | 'register' | 'mypet';

function App() {
  const { state, registerPet, switchPet, getCurrentPet } = useAppState();

  const getInitialScreen = (): Screen => {
    if (state.registeredPets.length > 0) return 'mypet';
    return 'home';
  };

  const [screen, setScreen] = useState<Screen>(getInitialScreen);

  const handleRegisterComplete = (pet: Pet) => {
    registerPet(pet);
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
