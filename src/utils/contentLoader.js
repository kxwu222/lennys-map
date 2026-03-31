// Content loader: imports all condensed .md files at build time via Vite glob
// No runtime fetches — everything bundled into JS (~50KB)

const kbModules = import.meta.glob('/src/assets/kb/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/**
 * Parse YAML frontmatter + body from a raw markdown string.
 * Handles our known fields without a full YAML library.
 */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const meta = {};
  const yamlBlock = match[1];

  // Parse simple YAML key-value pairs
  for (const line of yamlBlock.split('\n')) {
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (!kvMatch) continue;

    const [, key, rawVal] = kvMatch;
    let val = rawVal.trim();

    // Handle arrays: ["item1", "item2"]
    if (val.startsWith('[')) {
      try {
        val = JSON.parse(val);
      } catch {
        val = val.replace(/[\[\]]/g, '').split(',').map(s => s.trim().replace(/^"|"$/g, ''));
      }
    }
    // Handle quoted strings
    else if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    // Handle null
    else if (val === 'null') {
      val = null;
    }
    // Handle numbers
    else if (/^\d+$/.test(val)) {
      val = parseInt(val, 10);
    }

    meta[key] = val;
  }

  return { meta, body: match[2].trim() };
}

/**
 * KB_CONTENT: { [id]: { id, title, source, guest, topics, date, subtitle, wordCount, sections[] } }
 * Sections are the body split by ## headings.
 */
export const KB_CONTENT = {};

for (const [path, raw] of Object.entries(kbModules)) {
  const { meta, body } = parseFrontmatter(raw);
  if (!meta.id) {
    // Derive id from filename as fallback
    const filenameMatch = path.match(/\/([^/]+)\.md$/);
    meta.id = filenameMatch ? filenameMatch[1] : path;
  }

  // Split body into sections (each starts with "## ")
  const sections = body
    .split(/^## /m)
    .filter(Boolean)
    .map(s => s.trim());

  KB_CONTENT[meta.id] = {
    id: meta.id,
    title: meta.title || '',
    source: meta.source || '',
    guest: meta.guest || null,
    topics: meta.topics || [],
    date: meta.date || '',
    subtitle: meta.subtitle || '',
    wordCount: meta.wordCount || 0,
    sections,
  };
}

// Common stop words to exclude from keyword matching
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her',
  'was', 'one', 'our', 'out', 'has', 'had', 'how', 'its', 'may', 'who',
  'did', 'get', 'let', 'say', 'she', 'too', 'use', 'him', 'his', 'why',
  'what', 'when', 'with', 'that', 'this', 'from', 'they', 'been', 'have',
  'many', 'some', 'them', 'than', 'each', 'make', 'like', 'long', 'look',
  'most', 'over', 'such', 'take', 'into', 'just', 'also', 'about', 'would',
  'could', 'should', 'there', 'their', 'which', 'these', 'other', 'being',
  'does', 'will', 'more',
]);

/**
 * Score all sources by relevance to a question using keyword overlap.
 * Returns top `limit` sources sorted by score (highest first).
 */
export function findRelevantSources(question, limit = 6) {
  // Extract meaningful words from question
  const words = question
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const scored = Object.values(KB_CONTENT).map(entry => {
    // Build searchable text from all content
    const text = [
      entry.title,
      entry.subtitle,
      entry.guest || '',
      ...(entry.topics || []),
      ...entry.sections,
    ]
      .join(' ')
      .toLowerCase();

    // Score: count keyword hits, weighting title/topic matches higher
    const titleText = [entry.title, entry.subtitle, entry.guest || '', ...(entry.topics || [])]
      .join(' ')
      .toLowerCase();

    let score = 0;
    for (const w of words) {
      if (titleText.includes(w)) score += 3; // Title/topic matches worth more
      if (text.includes(w)) score += 1;       // Body matches
    }

    return { ...entry, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get the total count of loaded knowledge base entries.
 */
export function getKBSize() {
  return Object.keys(KB_CONTENT).length;
}
