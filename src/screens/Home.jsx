import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CardDeck from '../components/CardDeck';
import { getDailyDeck, SERENDIPITY_PROMPTS } from '../utils/metadata';
import { getSettings, fl_get, fl_set } from '../utils/storage';
import { addExplorationNode } from '../utils/mapData';

export default function Home() {
  const navigate = useNavigate();
  const settings = getSettings();
  const [deck, setDeck] = useState([]);
  const lastVisit = settings.lastVisitTimestamp;
  const isLapsed = lastVisit && (Date.now() - lastVisit > 7 * 24 * 60 * 60 * 1000);
  const isReturning = lastVisit && !isLapsed;

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const cachedDate = fl_get('deck_date');
    if (cachedDate === today) {
      setDeck(fl_get('deck_cards') || getDailyDeck());
    } else {
      const newDeck = getDailyDeck();
      fl_set('deck_date', today);
      fl_set('deck_cards', newDeck);
      setDeck(newDeck);
    }
  }, []);

  function handleExplore(card) {
    addExplorationNode({
      id: card.sourceId,
      label: card.tag,
      category: card.tag,
      relatedIds: [],
    });
    navigate('/ask', { state: { question: card.question } });
  }

  const allCards = deck.length > 0
    ? [...deck, ...SERENDIPITY_PROMPTS.filter(p => !deck.find(d => d.sourceId === p.sourceId))]
    : [];

  const lastThreads = fl_get('last_threads') || [];

  return (
    <div className="home">
      {/* Returning user: compact banner */}
      {isReturning && lastThreads.length > 0 && (
        <div className="home-returning">
          <div className="home-returning-banner">
            <button
              className="home-returning-continue"
              onClick={() => navigate('/ask', { state: { question: lastThreads[0] } })}
            >
              <span className="home-returning-continue-label">&larr; Continue:</span>
              <span className="home-returning-continue-title">{lastThreads[0]}</span>
            </button>
            <span className="home-returning-or">or explore below</span>
          </div>
          {lastThreads.length > 1 && (
            <div className="home-chips-wrap">
              <p className="home-section-label">Other recent threads</p>
              <div className="home-chips-row">
                {lastThreads.slice(1, 5).map((t, i) => (
                  <button
                    key={i}
                    className="home-topic-chip"
                    onClick={() => navigate('/ask', { state: { question: t } })}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lapsed user state */}
      {isLapsed && (
        <div className="home-lapsed">
          <div className="home-lapsed-card">
            <p className="home-lapsed-headline">
              It's been a little while. No catching up required.
            </p>
            <p className="home-lapsed-sub">
              Lenny's archive has been quietly growing. Pick something that sparks right now.
            </p>
            <button
              className="home-lapsed-cta"
              onClick={() => {
                const random = SERENDIPITY_PROMPTS[Math.floor(Math.random() * SERENDIPITY_PROMPTS.length)];
                navigate('/ask', { state: { question: random.question } });
              }}
            >
              Show me something fresh &rarr;
            </button>
          </div>
          {lastThreads.length > 0 && (
            <div className="home-lapsed-threads">
              <p className="home-section-label">Or pick up an old thread</p>
              {lastThreads.slice(0, 3).map((t, i) => (
                <button
                  key={i}
                  className="home-topic-chip"
                  onClick={() => navigate('/ask', { state: { question: t } })}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <CardDeck cards={allCards} onExplore={handleExplore} />
    </div>
  );
}
