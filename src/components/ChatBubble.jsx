export default function ChatBubble({ message }) {
  if (message.role === 'user') {
    return (
      <div className="chat-bubble chat-bubble-user">
        <p>{message.content}</p>
      </div>
    );
  }

  const data = message.data;
  if (!data) return null;

  if (data.outOfScope) {
    return (
      <div className="chat-bubble chat-bubble-assistant">
        <h3 className="chat-oos-heading">Outside my knowledge base</h3>
        <p className="chat-oos-body">
          I only draw from Lenny Rachitsky's podcasts and newsletters about product, UX, and AI.
          Here are some questions I can help with:
        </p>
        <div className="chat-followups">
          {(data.alternativeQuestions || []).map((q, i) => (
            <button
              key={i}
              className="chat-chip"
              onClick={() => message.onFollowUp?.(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-bubble chat-bubble-assistant">

      {/* Hook — one-sentence opener */}
      {data.hook && (
        <p className="chat-hook">{data.hook}</p>
      )}

      {/* Body — 2–3 prose paragraphs */}
      {data.body && (
        <div className="chat-body">
          {data.body.split('\n\n').map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      {/* Highlight — the one idea worth remembering */}
      {data.highlight && (
        <div className="chat-highlight">
          <span className="chat-section-label">Key insight</span>
          <p>{data.highlight}</p>
        </div>
      )}

      {/* Sources */}
      {data.sources?.length > 0 && (
        <div className="chat-sources">
          <span className="chat-section-label">Sources</span>
          <div className="chat-source-chips">
            {data.sources.map((src, i) => (
              <button
                key={i}
                className="chat-source-chip"
                onClick={() => message.onSourceTap?.(src)}
              >
                <span className="chat-source-dot">&#9679;</span>
                <span className="chat-source-name">{src.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Coach nudge (only if user has a role set) */}
      {data.coachNudge && (
        <div className="chat-coach-nudge">
          <p>{data.coachNudge}</p>
        </div>
      )}

      {/* Follow-up questions */}
      {data.followUps?.length > 0 && (
        <div className="chat-followups">
          <span className="chat-section-label">Keep exploring</span>
          {data.followUps.map((q, i) => (
            <button
              key={i}
              className="chat-chip"
              onClick={() => message.onFollowUp?.(q)}
            >
              {q}
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
