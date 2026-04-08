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
    // Merge related entries (dedupe by id+question)
    const incoming = node.related || [];
    const current = nodes[existing].related ||
      (nodes[existing].relatedIds || []).map(id => ({ id, question: null }));
    const merged = [...current];
    incoming.forEach(r => {
      if (!merged.some(e => e.id === r.id && e.question === r.question)) {
        merged.push(r);
      }
    });
    nodes[existing].related = merged;
  } else {
    const related = node.related ||
      (node.relatedIds || []).map(id => ({ id, question: null }));
    nodes.push({ ...node, related, visitCount: 1, timestamp: Date.now() });
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

// Threads stored as { text, date } objects
export function saveThread(text) {
  const threads = fl_get('last_threads') || [];
  const entry = { text, date: new Date().toISOString() };
  const updated = [entry, ...threads.filter(t => (t.text || t) !== text)].slice(0, 20);
  fl_set('last_threads', updated);
}

export function getThreads() {
  const raw = fl_get('last_threads') || [];
  // normalise legacy plain-string entries
  return raw.map(t => typeof t === 'string' ? { text: t, date: null } : t);
}

// Returns 3 chips daily: 2 fresh serendipity + 1 history (preferring unexplored)
// If no history yet: 3 fresh serendipity picks
export function getDailyThreads(serendipityPrompts = []) {
  const today = new Date().toISOString().slice(0, 10);
  const seed = today.split('-').reduce((acc, n) => acc + parseInt(n), 0);

  // seeded LCG pseudo-random
  let s = seed;
  const rand = (max) => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s % max;
  };

  const results = [];

  // — 2 fresh serendipity picks, rotated daily —
  if (serendipityPrompts.length > 0) {
    const shuffledPrompts = [...serendipityPrompts];
    for (let i = shuffledPrompts.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [shuffledPrompts[i], shuffledPrompts[j]] = [shuffledPrompts[j], shuffledPrompts[i]];
    }
    shuffledPrompts.slice(0, 2).forEach(p =>
      results.push({ text: p.question, date: null, fresh: true })
    );
  }

  // — 1 history pick: prefer unexplored, fall back to most recent —
  const threads = getThreads();
  if (threads.length > 0) {
    const unexplored = threads.find(t => !getConversation(t.text));
    const pick = unexplored || threads[0];
    results.push({ ...pick, fresh: false });
  }

  return results;
}

// Persist and restore full conversations keyed by the opening question
export function saveConversation(question, messages) {
  // strip non-serialisable callbacks before storing
  const serialisable = messages.map(m => ({
    role: m.role,
    content: m.content ?? null,
    data: m.data ?? null,
  }));
  fl_set('conv_' + question.slice(0, 80), { question, messages: serialisable, savedAt: new Date().toISOString() });
}

export function getConversation(question) {
  return fl_get('conv_' + question.slice(0, 80)) || null;
}

export function formatThreadAge(isoDate) {
  if (!isoDate) return null;
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)}w ago`;
}
