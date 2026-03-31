import { useState, useRef, useEffect } from 'react';
import HeroCard from './HeroCard';

export default function CardDeck({ cards, onExplore }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [flyingOff, setFlyingOff] = useState(null); // null | 'right' | 'left'
  const [isEntering, setIsEntering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [nudged, setNudged] = useState(false);
  const touchStart = useRef(null);
  const mouseStart = useRef(null);
  const flyEndFiredRef = useRef(false);

  // Nudge the card once on mount to hint swipeability
  useEffect(() => {
    const t = setTimeout(() => setNudged(true), 1200);
    return () => clearTimeout(t);
  }, []);

  function cancelNudge() {
    setNudged(false);
  }

  function getSwipeThreshold() {
    // Viewport-relative threshold: 14% of screen width, capped at 60px
    return typeof window !== 'undefined'
      ? Math.min(60, window.innerWidth * 0.14)
      : 52;
  }

  function handleSwipe(delta) {
    if (Math.abs(delta) <= getSwipeThreshold()) {
      setSwipeOffset(0);
      return;
    }
    flyEndFiredRef.current = false; // reset guard for this swipe
    setFlyingOff(delta > 0 ? 'right' : 'left');
    // swipeOffset stays — fly animation starts from current drag position
  }

  function handleFlyEnd() {
    // Guard against animationend bubbling from children or double-fire in StrictMode
    if (flyEndFiredRef.current) return;
    flyEndFiredRef.current = true;

    const wasRight = flyingOff === 'right';
    setFlyingOff(null);
    setSwipeOffset(0);
    if (wasRight) {
      onExplore?.(cards[currentIndex]);
    } else {
      // Always advance — loop back to start when reaching the end
      setCurrentIndex(i => (i < cards.length - 1 ? i + 1 : 0));
      setIsEntering(true);
    }
  }

  function handleEntranceEnd() {
    setIsEntering(false);
  }

  function handleTouchStart(e) {
    cancelNudge();
    touchStart.current = e.touches[0].clientX;
  }

  function handleTouchMove(e) {
    if (touchStart.current === null) return;
    setSwipeOffset(e.touches[0].clientX - touchStart.current);
  }

  function handleTouchEnd(e) {
    if (touchStart.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    handleSwipe(delta);
  }

  function handleMouseDown(e) {
    cancelNudge();
    mouseStart.current = e.clientX;
    setIsDragging(true);
  }

  function handleMouseMove(e) {
    if (mouseStart.current === null) return;
    setSwipeOffset(e.clientX - mouseStart.current);
  }

  function handleMouseUp(e) {
    if (mouseStart.current === null) return;
    const delta = e.clientX - mouseStart.current;
    mouseStart.current = null;
    setIsDragging(false);
    handleSwipe(delta);
  }

  function handleMouseLeave() {
    if (mouseStart.current !== null) {
      mouseStart.current = null;
      setIsDragging(false);
      setSwipeOffset(0);
    }
  }

  // Show up to 8 dots; current position wraps around
  const dotCount = Math.min(cards.length, 8);
  const activeDot = currentIndex % dotCount;

  return (
    <div className="card-deck-wrapper">
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
          if (offset < 0) return null;
          if (offset > 2) return null;

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
                top: offset * 6,
                transform: isFlyingOff
                  ? undefined
                  : `scale(${1 - offset * 0.04})${isFront && swipeOffset ? ` translateX(${swipeOffset}px) rotate(${flyRot}deg)` : ''}`,
                '--fly-x': `${swipeOffset}px`,
                '--fly-rot': `${flyRot}deg`,
                opacity: isFront ? 1 : offset === 1 ? 0.7 : 0.45,
                zIndex: 3 - offset,
                pointerEvents: isFront ? 'auto' : 'none',
                transition: (swipeOffset || isFlyingOff) ? 'none' : 'all 0.3s ease',
              }}
            />
          );
        })}
      </div>

      <div className="card-deck-footer">
        <span className="card-deck-footer-hint hint-left">
          <span className="hint-arrow">←</span>
          skip
        </span>
        <div className="card-deck-footer-center">
          <div className="card-deck-footer-dots">
            {Array.from({ length: dotCount }).map((_, i) => (
              <span key={i} className={`card-deck-dot${i === activeDot ? ' active' : ''}`} />
            ))}
          </div>
          <span className="card-deck-swipe-label">swipe to explore</span>
        </div>
        <span className="card-deck-footer-hint hint-right">
          explore
          <span className="hint-arrow">→</span>
        </span>
      </div>
    </div>
  );
}
