const PREFIX = 'fl_';

export function fl_get(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function fl_set(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // localStorage full or unavailable
  }
}

export function fl_remove(key) {
  localStorage.removeItem(PREFIX + key);
}

export function fl_clear() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach(k => localStorage.removeItem(k));
}

export function getSettings() {
  return fl_get('settings') || {
    role: '',
    defaultDepth: '5min',
    serendipityLevel: 'balanced',
    coachNudges: true,
    lastVisitTimestamp: null,
  };
}

export function updateSettings(partial) {
  const current = getSettings();
  fl_set('settings', { ...current, ...partial });
}

export function isOnboarded() {
  return fl_get('onboarded') === true;
}

export function setOnboarded() {
  fl_set('onboarded', true);
}

export function getNodes() {
  return fl_get('nodes') || [];
}

export function saveNodes(nodes) {
  fl_set('nodes', nodes);
}

export function addNode(node) {
  const nodes = getNodes();
  const existing = nodes.findIndex(n => n.id === node.id);
  if (existing >= 0) {
    nodes[existing].visitCount += 1;
    nodes[existing].timestamp = Date.now();
  } else {
    nodes.push({ ...node, visitCount: 1, timestamp: Date.now() });
  }
  saveNodes(nodes);
}

export function incrementSessions() {
  const count = fl_get('sessions') || 0;
  fl_set('sessions', count + 1);
}

export function getSessionCount() {
  return fl_get('sessions') || 0;
}
