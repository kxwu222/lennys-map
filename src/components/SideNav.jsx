import { useLocation, useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import { getSettings } from '../utils/storage';

const tabs = [
    { path: '/', label: 'Home', icon: '⌂' },
    { path: '/ask', label: 'Ask', icon: '◉', isAsk: true },
    { path: '/map', label: 'Map', icon: '✦' },
];

const MIN_WIDTH = 180;
const MAX_WIDTH = 400;

export default function SideNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const settings = getSettings();
    const initials = settings.role
        ? settings.role.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
        : 'LM';

    const [width, setWidth] = useState(260);
    const dragging = useRef(false);
    const [active, setActive] = useState(false);

    function handleMouseDown(e) {
        e.preventDefault();
        dragging.current = true;
        setActive(true);
        const onMove = (e) => {
            if (!dragging.current) return;
            const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
            setWidth(newWidth);
        };
        const onUp = () => {
            dragging.current = false;
            setActive(false);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

    return (
        <aside className="sidenav" style={{ width }}>
            <div className="sidenav-top" onClick={() => navigate('/')}>
                <div className="sidenav-logo">
                    <span className="sidenav-logo-icon">◆</span>
                    <span className="sidenav-logo-text">Lenny's Map</span>
                </div>
            </div>

            <nav className="sidenav-nav">
                {tabs.map(tab => {
                    const active = location.pathname === tab.path;
                    return (
                        <button
                            key={tab.path}
                            className={`sidenav-item${active ? ' active' : ''}${tab.isAsk ? ' sidenav-ask' : ''}`}
                            onClick={() => navigate(tab.path)}
                        >
                            <span className="sidenav-icon">{tab.icon}</span>
                            <span className="sidenav-label">{tab.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="sidenav-footer">
                <button className="sidenav-profile" onClick={() => navigate('/settings')}>
                    <div className="sidenav-avatar">{initials}</div>
                    <div className="sidenav-profile-info">
                        <span className="sidenav-profile-name">Settings</span>
                        <span className="sidenav-profile-role">{settings.role || 'Member'}</span>
                    </div>
                </button>
            </div>

            <div
                className={`resize-handle${active ? ' resize-handle--active' : ''}`}
                style={{ right: 0 }}
                onMouseDown={handleMouseDown}
            />
        </aside>
    );
}
