import { useNavigate } from 'react-router-dom';
import { getSettings } from '../utils/storage';

export default function TopBar() {
  const navigate = useNavigate();
  const settings = getSettings();
  const initials = settings.role
    ? settings.role.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
    : 'LM';

  return (
    <header className="topbar">
      <div className="topbar-logo" onClick={() => navigate('/')}>
        <span className="topbar-logo-icon">&#9670;</span>
        <span className="topbar-logo-text">Lenny's Map</span>
      </div>
      <button className="topbar-avatar" onClick={() => navigate('/settings')}>
        {initials}
      </button>
    </header>
  );
}
