import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { path: '/', label: 'Home', icon: '⌂' },
  { path: '/ask', label: 'Ask', icon: '◉', isAsk: true },
  { path: '/map', label: 'Map', icon: '✦' },
];

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="tab-bar">
      {tabs.map(tab => {
        const active = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            className={`tab-bar-item${active ? ' active' : ''}${tab.isAsk ? ' tab-bar-ask' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <span className="tab-bar-icon">{tab.icon}</span>
            <span className="tab-bar-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
