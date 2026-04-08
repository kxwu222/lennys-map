import { getKBSize } from '../utils/contentLoader';

const microFacts = [
  'The average user decides to stay or leave in the first 8 seconds.',
  'Most successful products solve one job to be done extremely well.',
  'The best onboarding flows feel like a conversation, not a form.',
  'Network effects get stronger with every new user who joins.',
  'Retention is the silent metric that makes or breaks growth.',
  'Great product writing is invisible — it never makes you stop and think.',
];

export default function LoadingState({ isResuming = false }) {
  const fact = microFacts[Math.floor(Math.random() * microFacts.length)];
  const sourceCount = getKBSize();

  return (
    <div className="loading-state">
      <div className="loading-thinking">
        <div className="loading-dots">
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
        </div>
        <p className="loading-label">
          {isResuming
            ? 'Taking you back where you left off…'
            : `Reading across ${sourceCount} sources...`}
        </p>
      </div>

      <div className="loading-skeleton">
        <div className="skeleton" style={{ height: 16, width: '90%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 16, width: '75%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 12, width: '40%' }} />
      </div>

      <div className="loading-nudge">
        <p className="loading-nudge-label">While you wait</p>
        <p className="loading-nudge-fact">{fact}</p>
      </div>
    </div>
  );
}
