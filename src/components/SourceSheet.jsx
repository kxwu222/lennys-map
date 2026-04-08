import { useRef, useState } from 'react';
import { getSourceById } from '../utils/metadata';

export default function SourceSheet({ sourceId, citedText, onClose, onAskQuestion }) {
  const source = getSourceById(sourceId);
  const sheetRef = useRef(null);
  const dragStart = useRef(null);
  const [translateY, setTranslateY] = useState(0);

  if (!source) return null;

  function handleTouchStart(e) {
    dragStart.current = e.touches[0].clientY;
  }

  function handleTouchMove(e) {
    if (dragStart.current === null) return;
    const delta = e.touches[0].clientY - dragStart.current;
    if (delta > 0) setTranslateY(delta);
  }

  function handleTouchEnd() {
    if (translateY > 80) {
      onClose();
    }
    setTranslateY(0);
    dragStart.current = null;
  }

  const relatedQuestions = [
    `What else does ${source.source} say about ${source.topics[0]}?`,
    `How does ${source.topics[0]} connect to ${source.topics[1] || 'product strategy'}?`,
    `What are the key takeaways from ${source.title}?`,
  ];

  return (
    <div className="source-sheet-backdrop" onClick={onClose}>
      <div
        className="source-sheet"
        ref={sheetRef}
        style={{ transform: `translateY(${translateY}px)` }}
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="source-sheet-handle" />

        <div className="source-sheet-header">
          <div className="source-sheet-source">
            <span className="source-sheet-dot">&#9679;</span>
            <span>{source.source}</span>
          </div>
          <h3 className="source-sheet-title">{source.title}</h3>
          {source.guest && (
            <span className="source-sheet-guest">with {source.guest}</span>
          )}
          <button className="source-sheet-close" onClick={onClose}>&times;</button>
        </div>

        <div className="source-sheet-content">
          {citedText && (
            <div className="source-sheet-zone source-sheet-cited">
              <p className="source-sheet-cited-text">{citedText}</p>
              <p className="source-sheet-disclosure">
                From transcript, lightly edited for readability
              </p>
            </div>
          )}

          <div className="source-sheet-zone source-sheet-summary">
            <p className="source-sheet-zone-label">In plain terms</p>
            <p>
              This {source.guest ? 'episode' : 'issue'} covers{' '}
              {source.topics.join(', ')} — exploring how these ideas connect to
              everyday product and design work.
            </p>
          </div>

          <div className="source-sheet-zone source-sheet-context">
            <p>
              {source.guest
                ? `${source.guest} joins ${source.source} to discuss ${source.title.toLowerCase()}. The conversation covers ${source.topics.slice(0, 3).join(', ')}.`
                : `${source.source} explores ${source.title.toLowerCase()}, covering ${source.topics.slice(0, 3).join(', ')}.`}
            </p>
            <p className="source-sheet-readtime">{source.readTime} min {source.guest ? 'listen' : 'read'}</p>
            {source.sourceUrl && (
              <div className="source-sheet-sources">
                <p className="source-sheet-zone-label">Sources</p>
                <a
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-sheet-source-link"
                >
                  Read on {source.source} ↗
                </a>
              </div>
            )}
          </div>

          <div className="source-sheet-zone source-sheet-more">
            <p className="source-sheet-zone-label">More from this source</p>
            {relatedQuestions.map((q, i) => (
              <button
                key={i}
                className="chat-chip"
                onClick={() => {
                  onAskQuestion?.(q);
                  onClose();
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="source-sheet-footer">
          <button className="source-sheet-back" onClick={onClose}>
            &larr; Back to chat
          </button>
          <span className="source-sheet-footer-label">
            {source.source}
          </span>
        </div>
      </div>
    </div>
  );
}
