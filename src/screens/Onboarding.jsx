import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateSettings, setOnboarded } from '../utils/storage';

const roleChips = [
  'Product manager',
  'UX designer',
  'Software engineer',
  'Startup founder',
  'Data analyst',
  'Marketing lead',
  'Design lead',
  'AI researcher',
];

const stepDotColors = ['#F0B87A', '#E8914A', '#D4874D', '#C8622A'];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [roleText, setRoleText] = useState('');
  const [stepsVisible, setStepsVisible] = useState([false, false, false, false]);
  const navigate = useNavigate();
  const textareaRef = useRef(null);

  // Animate steps on mount
  useEffect(() => {
    const timers = [0, 1, 2, 3].map((i) =>
      setTimeout(() => {
        setStepsVisible(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 300 + i * 150)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  function toggleChip(chip) {
    setSelectedRoles(prev => {
      const next = prev.includes(chip)
        ? prev.filter(r => r !== chip)
        : [...prev, chip];
      setRoleText(next.join(', '));
      return next;
    });
  }

  function handleRoleTextChange(e) {
    setRoleText(e.target.value);
    // Clear chip selections when user types freely
    setSelectedRoles([]);
  }

  function handleFinish() {
    const finalRole = roleText.trim();
    if (finalRole) {
      updateSettings({ role: finalRole });
    }
    setOnboarded();
    navigate('/');
  }

  function handleSkip() {
    setOnboarded();
    navigate('/');
  }

  if (step === 1) {
    return (
      <div className="onboarding">
        <div className="onboarding-top">
          <span className="onboarding-logo">&#9670; Lenny's Map</span>
          <div className="onboarding-progress">
            <span className="onboarding-progress-seg active" />
            <span className="onboarding-progress-seg" />
          </div>
        </div>

        <div className="onboarding-hero">
          <h1 className="onboarding-headline">
            Not a search engine. Not a course. Something different.
          </h1>
          <p className="onboarding-sub">
            Explore ideas, follow curiosity, ask questions — in any order.
          </p>
        </div>

        <div className="onboarding-steps">
          <div className="onboarding-steps-line" />

          {[
            { label: 'Start with today\'s idea — a fresh concept every day' },
            { label: 'Explore connections across topics and episodes' },
            { label: 'Ask when something sparks curiosity' },
            { label: 'Go deeper — every answer links back to the source' },
          ].map((s, i) => (
            <div
              key={i}
              className={`onboarding-step ${stepsVisible[i] ? 'visible' : ''}`}
            >
              <span
                className="onboarding-step-dot"
                style={{ backgroundColor: stepDotColors[i] }}
              />
              <span className="onboarding-step-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="onboarding-sources">
          <span>Lenny's Podcast</span>
          <span>Lenny's Newsletter</span>
        </div>
        <p className="onboarding-attribution">
          Curated from Lenny Rachitsky's open data
        </p>

        <div className="onboarding-footer">
          <button className="onboarding-cta" onClick={() => setStep(2)}>
            Got it — one quick question &rarr;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding">
      <div className="onboarding-top">
        <span className="onboarding-logo">&#9670; Lenny's Map</span>
        <div className="onboarding-progress">
          <span className="onboarding-progress-seg done" />
          <span className="onboarding-progress-seg active" />
        </div>
      </div>

      <div className="onboarding-question">
        <h1 className="onboarding-headline-serif">
          What kind of work do you do?
        </h1>
        <p className="onboarding-sub">
          One sentence is enough. This shapes what we surface first — not what you can access.
        </p>

        <div className="onboarding-changes">
          <p className="onboarding-changes-label">What this changes</p>
          <p className="onboarding-changes-text">
            The ideas we surface first, the follow-up questions we suggest, and how we connect concepts to your context.
          </p>
        </div>

        <input
          ref={textareaRef}
          className="onboarding-input"
          value={roleText}
          onChange={handleRoleTextChange}
          placeholder="e.g. Product manager at a fintech startup"
          type="text"
        />

        <div className="onboarding-chips">
          {roleChips.map(chip => (
            <button
              key={chip}
              className={`onboarding-chip ${selectedRoles.includes(chip) ? 'selected' : ''}`}
              onClick={() => toggleChip(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div className="onboarding-footer">
        <button className="onboarding-skip" onClick={handleSkip}>
          I'd rather you figure it out as we go
        </button>
        <button className="onboarding-cta" onClick={handleFinish}>
          Take me in &rarr;
        </button>
      </div>
    </div>
  );
}
