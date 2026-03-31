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
        if (tab.isAsk) {
          return (
            <button
              key={tab.path}
              className={`tab-bar-item tab-bar-ask ${active ? 'active' : ''}`}
              onClick={() => navigate(tab.path)}
            >
              <span className="tab-bar-icon tab-bar-ask-icon">{tab.icon}</span>
              <span className="tab-bar-label tab-bar-ask-label">{tab.label}</span>
            </button>
          );
        }
        return (
          <button
            key={tab.path}
            className={`tab-bar-item ${active ? 'active' : ''}`}
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
