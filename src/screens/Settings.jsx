import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings, updateSettings, fl_clear, getSessionCount, getNodes } from '../utils/storage';
import { getClusterCount } from '../utils/mapData';
import { METADATA_INDEX } from '../utils/metadata';

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(getSettings());
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editingRole, setEditingRole] = useState(false);
  const [roleInput, setRoleInput] = useState(settings.role || '');

  const nodes = getNodes();
  const sessions = getSessionCount();
  const clusters = getClusterCount();

  function update(key, value) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    updateSettings({ [key]: value });
  }

  function saveRole() {
    update('role', roleInput.trim());
    setEditingRole(false);
  }

  function handleClear() {
    fl_clear();
    setShowClearConfirm(false);
    navigate('/');
    window.location.reload();
  }

  const initials = settings.role
    ? settings.role.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
    : 'LM';

  return (
    <div className="settings">
      <div className="settings-inner">
        <div className="settings-sidebar">
          <div className="settings-header">
            <button className="settings-back" onClick={() => navigate(-1)}>
              &larr;
            </button>
            <h2>Settings</h2>
          </div>

          {/* Profile hero */}
          <div className="settings-profile">
            <div className="settings-avatar">{initials}</div>
            <div className="settings-profile-info">
              {editingRole ? (
                <div className="settings-role-edit">
                  <input
                    value={roleInput}
                    onChange={e => setRoleInput(e.target.value)}
                    placeholder="e.g. Product manager at a startup"
                    className="settings-role-input"
                    autoFocus
                  />
                  <button className="settings-role-save" onClick={saveRole}>Save</button>
                </div>
              ) : (
                <>
                  <p className="settings-role">{settings.role || 'No role set'}</p>
                  <button className="settings-role-edit-btn" onClick={() => setEditingRole(true)}>
                    Edit how the app sees you
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="settings-main">
          {/* Map stats */}
          <div className="settings-section">
            <h3 className="settings-section-title">Your map so far</h3>
            <div className="settings-stats">
              <div className="settings-stat">
                <span className="settings-stat-number">{nodes.length}</span>
                <span className="settings-stat-label">ideas explored</span>
              </div>
              <div className="settings-stat">
                <span className="settings-stat-number">{sessions}</span>
                <span className="settings-stat-label">sessions</span>
              </div>
              <div className="settings-stat">
                <span className="settings-stat-number">{clusters}</span>
                <span className="settings-stat-label">clusters formed</span>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="settings-section">
            <h3 className="settings-section-title">Preferences</h3>

            <div className="settings-pref">
              <label>Default depth</label>
              <div className="settings-pref-options">
                {[
                  { value: '5min', label: '5 min' },
                  { value: '20min', label: '20 min' },
                  { value: 'inflow', label: 'In flow' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`settings-pref-btn ${settings.defaultDepth === opt.value ? 'active' : ''}`}
                    onClick={() => update('defaultDepth', opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-pref">
              <label>Serendipity level</label>
              <div className="settings-pref-options">
                {[
                  { value: 'close', label: 'Close' },
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'surprise', label: 'Surprise me' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`settings-pref-btn ${settings.serendipityLevel === opt.value ? 'active' : ''}`}
                    onClick={() => update('serendipityLevel', opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-pref settings-pref-toggle">
              <label>Coach nudges</label>
              <button
                className={`settings-toggle ${settings.coachNudges ? 'active' : ''}`}
                onClick={() => update('coachNudges', !settings.coachNudges)}
              >
                <span className="settings-toggle-thumb" />
              </button>
            </div>
          </div>

          {/* Knowledge base */}
          <div className="settings-section">
            <h3 className="settings-section-title">Knowledge base</h3>
            <p className="settings-kb-info">
              {METADATA_INDEX.length} sources &middot; Last updated March 2026
            </p>
          </div>

          {/* Clear data */}
          <div className="settings-section">
            <h3 className="settings-section-title">Your data</h3>
            <button
              className="settings-clear-btn"
              onClick={() => setShowClearConfirm(true)}
            >
              Clear my map and history
            </button>
          </div>
        </div>
      </div>

      {/* Clear confirmation */}
      {showClearConfirm && (
        <div className="settings-confirm-backdrop" onClick={() => setShowClearConfirm(false)}>
          <div className="settings-confirm" onClick={e => e.stopPropagation()}>
            <h3>Clear everything?</h3>
            <p>This removes all your explored ideas, sessions, and preferences. This can't be undone.</p>
            <div className="settings-confirm-actions">
              <button className="settings-confirm-cancel" onClick={() => setShowClearConfirm(false)}>
                Keep my data
              </button>
              <button className="settings-confirm-delete" onClick={handleClear}>
                Clear everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}
