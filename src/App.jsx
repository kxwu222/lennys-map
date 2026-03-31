import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import TopBar from './components/TopBar';
import TabBar from './components/TabBar';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import Ask from './screens/Ask';
import MapScreen from './screens/Map';
import Settings from './screens/Settings';
import { isOnboarded, updateSettings, incrementSessions } from './utils/storage';

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <TopBar />
      <main className="app-main">{children}</main>
      <TabBar />
    </div>
  );
}

export default function App() {
  const [onboarded, setOnboardedState] = useState(isOnboarded());

  useEffect(() => {
    if (onboarded) {
      updateSettings({ lastVisitTimestamp: Date.now() });
      incrementSessions();
    }
  }, [onboarded]);

  useEffect(() => {
    const check = () => setOnboardedState(isOnboarded());
    window.addEventListener('storage', check);
    const interval = setInterval(check, 500);
    return () => {
      window.removeEventListener('storage', check);
      clearInterval(interval);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {!onboarded && (
          <Route path="*" element={<Onboarding />} />
        )}
        {onboarded && (
          <>
            <Route path="/" element={<AppLayout><Home /></AppLayout>} />
            <Route path="/ask" element={<AppLayout><Ask /></AppLayout>} />
            <Route path="/map" element={<AppLayout><MapScreen /></AppLayout>} />
            <Route path="/settings" element={<Settings />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}
