import { getSettings } from './storage';
import { findRelevantSources, getKBSize } from './contentLoader';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';

function buildSystemPrompt(relevantSources) {
  const settings = getSettings();

  const identity = `You are Lenny's Map, a learning companion for people who work in product, UX, and AI. You answer questions grounded in Lenny Rachitsky's archive of newsletter posts and podcast interviews about startups, product management, growth, B2B SaaS, pricing, leadership, career development, workplace soft skills, and AI product work.`;

  const scope = `Only answer from the provided knowledge base excerpts below. These are condensed summaries of real content from Lenny's Newsletter and Lenny's Podcast (${getKBSize()} sources total, ${relevantSources.length} most relevant shown). Each excerpt has a title, guest (for podcasts), topics, and key insights. If a question falls outside this scope, return the JSON structure with outOfScope: true and two alternative questions in alternativeQuestions.`;

  const userContext = settings.role
    ? `The user describes their work as: "${settings.role}". Use this to make answers relevant to their context.`
    : '';

  const depthMap = {
    '5min': 'Keep answers concise — the user has about 5 minutes.',
    '20min': 'The user has about 20 minutes — go deeper with examples and connections.',
    'inflow': 'The user is in flow mode — be thorough, explore connections between ideas.',
  };
  const depth = depthMap[settings.defaultDepth] || depthMap['5min'];

  const format = `Return a JSON object with these exact fields:
- hook: One sentence only (max 20 words). The sharpest, most surprising insight — make the user want to keep reading.
- body: Exactly 2 short paragraphs. Each paragraph is 2–3 sentences maximum. No preamble, no "here's why", no restating the question. Start with the insight, not the context.
- highlight: One sentence (max 20 words). The single most actionable or memorable idea from the answer.
- sources: Array of { id, name, label } for each source used.
- followUps: Array of exactly 3 follow-up questions. Each question under 9 words.
- coachNudge: ${settings.role && settings.coachNudges ? 'One short question (max 15 words) connecting the answer to the user\'s role.' : 'null'}
- outOfScope: boolean
- alternativeQuestions: Array of 2 in-scope question strings (only if outOfScope is true, otherwise empty array).

Return ONLY valid JSON. No markdown, no code fences, no extra keys.`;

  const tone = `Warm, direct, like a knowledgeable friend who has read everything. No jargon. No preamble. Lead with the insight, not the setup.`;

  // Build targeted content section from relevant sources
  const contentSection = relevantSources
    .map(src => {
      const body = src.sections.join('\n\n');
      const header = `### ${src.title}${src.guest ? ` (${src.guest})` : ''}`;
      const meta = `Source: ${src.source} | Date: ${src.date} | ID: ${src.id}`;
      return `${header}\n${meta}\n${body}`;
    })
    .join('\n\n---\n\n');

  const metadataSection = `Relevant knowledge base content (${relevantSources.length} of ${getKBSize()} sources):\n\n${contentSection}`;

  return [identity, scope, userContext, depth, format, tone, metadataSection]
    .filter(Boolean)
    .join('\n\n');
}

export function isApiConfigured() {
  return !!API_KEY;
}

export async function queryKnowledgeBase(userMessage) {
  if (!API_KEY) {
    throw new Error('NOT_CONFIGURED');
  }

  const relevant = findRelevantSources(userMessage, 6);
  const systemPrompt = buildSystemPrompt(relevant);

  const body = {
    model: MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Anthropic API error', res.status, err);
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw = data.content?.[0]?.text || '';
  // Strip markdown code fences if the model wraps the JSON (e.g. ```json ... ```)
  const text = raw.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();

  try {
    return JSON.parse(text);
  } catch {
    return {
      hook: '',
      body: text,
      highlight: '',
      sources: [],
      followUps: [],
      coachNudge: null,
      outOfScope: false,
      alternativeQuestions: [],
    };
  }
}
