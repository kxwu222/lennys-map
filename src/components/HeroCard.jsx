import { getSourceById } from '../utils/metadata';
import { KB_CONTENT } from '../utils/contentLoader';

export default function HeroCard({ card, onExplore, style, className = '', swipeOffset = 0, onAnimationEnd, isFirst = false }) {
  const source = getSourceById(card.sourceId);

  const kbEntry = KB_CONTENT[card.sourceId];
  const rawSummary = kbEntry?.sections[0] || '';
  const summaryBody = rawSummary.split('\n').slice(1).join('\n').trim();
  const firstSentence = summaryBody.split(/\.\s/)[0];
  const teaser = firstSentence
    ? (firstSentence.length > 120 ? firstSentence.slice(0, 117) + '...' : firstSentence + '.')
    : '';

  const clampedAbs = Math.min(Math.abs(swipeOffset), 90);
  const overlayOpacity = Math.max(0, (clampedAbs - 20) / 70);
  const direction = swipeOffset > 0 ? 'explore' : swipeOffset < 0 ? 'skip' : null;
  const isExploring = direction === 'explore' && overlayOpacity > 0.12;

  function handleAnimationEnd(e) {
    if (e.target !== e.currentTarget) return;
    onAnimationEnd?.(e);
  }

  return (
    <div className={`hero-card ${className}`} style={style} onAnimationEnd={handleAnimationEnd}>

      {/* Swipe overlay stamp */}
      {direction && overlayOpacity > 0 && (
        <div className={`hero-card-swipe-overlay ${direction}`} style={{ opacity: overlayOpacity }}>
          <span className="hero-card-stamp">
            {direction === 'explore' ? 'EXPLORE →' : '← SKIP'}
          </span>
        </div>
      )}

      {/* Top row: tag + date/social */}
      <div className="hero-card-top">
        <span className="hero-card-tag">{card.tag}</span>
        {isFirst ? (
          <span className="hero-card-date">
            Today · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        ) : (
          <span className="hero-card-social">{card.socialLabel}</span>
        )}
      </div>

      {/* Source */}
      <div className="hero-card-source">
        <span className="hero-card-dot">&#9679;</span>
        <span>{source?.source || 'Knowledge Base'}</span>
        {source?.guest && (
          <span className="hero-card-guest">with {source.guest}</span>
        )}
      </div>

      {/* Main idea */}
      <p className="hero-card-idea">
        {card.idea.split(' — ').length > 1 ? (
          <>
            {card.idea.split(' — ')[0]} — <em>{card.idea.split(' — ')[1]}</em>
          </>
        ) : (
          card.idea
        )}
      </p>

      {/* Teaser quote */}
      {teaser && (
        <div className="hero-card-teaser">
          <div className="hero-card-teaser-rule" />
          <p className="hero-card-teaser-text">&ldquo;{teaser}&rdquo;</p>
        </div>
      )}

      {/* Explore CTA — full-width pill */}
      <div className="hero-card-bottom">
        <button
          className={`hero-card-explore${isExploring ? ' is-revealing' : ''}`}
          onClick={() => onExplore?.(card)}
        >
          Explore this idea →
        </button>
      </div>
    </div>
  );
}
