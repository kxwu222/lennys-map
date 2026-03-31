import { useState, useRef, useEffect } from 'react';
import HeroCard from './HeroCard';

export default function CardDeck({ cards, onExplore }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [flyingOff, setFlyingOff] = useState(null);
  const [isEntering, setIsEntering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [nudged, setNudged] = useState(false);
  const touchStart = useRef(null);
  const mouseStart = useRef(null);
  const flyEndFiredRef = useRef(false);

  // Nudge on mount to hint swipeability
  useEffect(() => {
    const t = setTimeout(() => setNudged(true), 1200);
    return () => clearTimeout(t);
  }, []);

  function cancelNudge() { setNudged(false); }

  function getSwipeThreshold() {
    return typeof window !== 'undefined'
      ? Math.min(60, window.innerWidth * 0.14)
      : 52;
  }

  function handleSwipe(delta) {
    if (Math.abs(delta) <= getSwipeThreshold()) { setSwipeOffset(0); return; }
    flyEndFiredRef.current = false;
    setFlyingOff(delta > 0 ? 'right' : 'left');
  }

  function handleFlyEnd() {
    if (flyEndFiredRef.current) return;
    flyEndFiredRef.current = true;
    const wasRight = flyingOff === 'right';
    setFlyingOff(null);
    setSwipeOffset(0);
    if (wasRight) {
      onExplore?.(cards[currentIndex]);
    } else {
      setCurrentIndex(i => (i < cards.length - 1 ? i + 1 : 0));
      setIsEntering(true);
    }
  }

  function handleEntranceEnd() { setIsEntering(false); }

  // Touch
  function handleTouchStart(e) { cancelNudge(); touchStart.current = e.touches[0].clientX; }
  function handleTouchMove(e) { if (touchStart.current === null) return; setSwipeOffset(e.touches[0].clientX - touchStart.current); }
  function handleTouchEnd(e) { if (touchStart.current === null) return; const d = e.changedTouches[0].clientX - touchStart.current; touchStart.current = null; handleSwipe(d); }

  // Mouse
  function handleMouseDown(e) { cancelNudge(); mouseStart.current = e.clientX; setIsDragging(true); }
  function handleMouseMove(e) { if (mouseStart.current === null) return; setSwipeOffset(e.clientX - mouseStart.current); }
  function handleMouseUp(e) { if (mouseStart.current === null) return; const d = e.clientX - mouseStart.current; mouseStart.current = null; setIsDragging(false); handleSwipe(d); }
  function handleMouseLeave() { if (mouseStart.current !== null) { mouseStart.current = null; setIsDragging(false); setSwipeOffset(0); } }

  // Progress bar fill
  const progress = cards.length > 1 ? (currentIndex / (cards.length - 1)) * 100 : 100;

  return (
    <div className="card-deck-wrapper">
      {/* Card stack */}
      <div
        className={`card-deck${isDragging ? ' is-dragging' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {cards.map((card, i) => {
          const offset = i - currentIndex;
          if (offset < 0 || offset > 2) return null;

          const isFront = offset === 0;
          const isFlyingOff = isFront && flyingOff !== null;
          const flyRot = swipeOffset * 0.06;
          const isNudging = isFront && nudged && !isFlyingOff && !isEntering;

          const handleAnimEnd = isFront ? () => {
            if (isFlyingOff) handleFlyEnd();
            else if (isEntering) handleEntranceEnd();
            else if (nudged) setNudged(false);
          } : undefined;

          return (
            <HeroCard
              key={card.sourceId}
              card={card}
              onExplore={onExplore}
              swipeOffset={isFront ? swipeOffset : 0}
              isFirst={isFront && currentIndex === 0}
              className={[
                isFront ? 'hero-card-front' : '',
                isFlyingOff ? `flying-${flyingOff}` : '',
                isFront && isEntering ? 'card-entering' : '',
                isNudging ? 'card-nudge' : '',
              ].filter(Boolean).join(' ')}
              onAnimationEnd={handleAnimEnd}
              style={{
                position: isFront ? 'relative' : 'absolute',
                top: offset * 8,
                transform: isFlyingOff
                  ? undefined
                  : `scale(${1 - offset * 0.04})${isFront && swipeOffset ? ` translateX(${swipeOffset}px) rotate(${flyRot}deg)` : ''}`,
                '--fly-x': `${swipeOffset}px`,
                '--fly-rot': `${flyRot}deg`,
                opacity: isFront ? 1 : offset === 1 ? 0.65 : 0.35,
                zIndex: 3 - offset,
                pointerEvents: isFront ? 'auto' : 'none',
                transition: (swipeOffset || isFlyingOff) ? 'none' : 'all 0.3s ease',
              }}
            />
          );
        })}
      </div>

      {/* Footer: action buttons + progress bar */}
      <div className="card-deck-footer">
        {/* Skip button */}
        <button
          className="card-deck-action card-deck-action-skip"
          aria-label="Skip"
          onClick={() => {
            flyEndFiredRef.current = false;
            setFlyingOff('left');
          }}
        >
          <span className="card-deck-action-icon">✕</span>
          <span className="card-deck-action-label">Skip</span>
        </button>

        {/* Progress bar */}
        <div className="card-deck-progress">
          <div
            className="card-deck-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Explore button */}
        <button
          className="card-deck-action card-deck-action-explore"
          aria-label="Explore"
          onClick={() => {
            flyEndFiredRef.current = false;
            setFlyingOff('right');
          }}
        >
          <span className="card-deck-action-label">Explore</span>
          <span className="card-deck-action-icon">→</span>
        </button>
      </div>
    </div>
  );
}
