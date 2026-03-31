import { useNavigate } from 'react-router-dom';
import { getSettings } from '../utils/storage';

export default function TopBar() {
  const navigate = useNavigate();
  const settings = getSettings();
  const initials = settings.role
    ? settings.role.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
    : 'LM';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <header className="topbar">
      <div className="topbar-left" onClick={() => navigate('/')}>
        <span className="topbar-greeting">{greeting}</span>
        <div className="topbar-logo">
          <span className="topbar-logo-icon">◆</span>
          <span className="topbar-logo-text">Lenny's Map</span>
        </div>
      </div>
      <button className="topbar-avatar" onClick={() => navigate('/settings')}>
        {initials}
      </button>
    </header>
  );
}
