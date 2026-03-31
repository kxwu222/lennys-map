import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ChatBubble from '../components/ChatBubble';
import LoadingState from '../components/LoadingState';
import SourceSheet from '../components/SourceSheet';
import { queryKnowledgeBase, isApiConfigured } from '../utils/api';
import { fl_get, fl_set } from '../utils/storage';
import { addExplorationNode } from '../utils/mapData';
import { SERENDIPITY_PROMPTS } from '../utils/metadata';

export default function Ask() {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sourceSheet, setSourceSheet] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const handledQuestionRef = useRef(null);

  useEffect(() => {
    const q = location.state?.question;
    // Guard: skip if no question, or already handled this exact question (StrictMode double-mount)
    if (!q || q === handledQuestionRef.current) return;
    handledQuestionRef.current = q;
    submitQuestion(q);
    window.history.replaceState({}, '');
  }, [location.state?.question]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function submitQuestion(question) {
    const userMsg = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    // Save to last threads
    const threads = fl_get('last_threads') || [];
    const updated = [question, ...threads.filter(t => t !== question)].slice(0, 5);
    fl_set('last_threads', updated);

    try {
      const data = await queryKnowledgeBase(question);

      // Add exploration nodes
      if (data.sources?.length) {
        data.sources.forEach(src => {
          addExplorationNode({
            id: src.id,
            label: src.name,
            category: src.label || 'General',
            relatedIds: data.sources.filter(s => s.id !== src.id).map(s => s.id),
          });
        });
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        data,
        onFollowUp: q => submitQuestion(q),
        onSourceTap: src => setSourceSheet({ sourceId: src.id, citedText: data.highlight }),
      }]);
    } catch (err) {
      if (err.message === 'NOT_CONFIGURED') {
        setMessages(prev => [...prev, {
          role: 'not-configured',
          content: question,
        }]);
      } else {
        setError(question);
        setMessages(prev => [...prev, {
          role: 'error',
          content: question,
        }]);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    submitQuestion(input.trim());
  }

  function handleSurprise() {
    const random = SERENDIPITY_PROMPTS[Math.floor(Math.random() * SERENDIPITY_PROMPTS.length)];
    submitQuestion(random.question);
  }

  const lastThreads = fl_get('last_threads') || [];
  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className="ask">
      <div className="ask-messages">
        {isEmpty && (
          <div className="ask-empty">
            <h2 className="ask-empty-headline">What's on your mind?</h2>
            <p className="ask-empty-sub">
              Ask anything from Lenny's podcasts and newsletters — or pick a thread below.
            </p>

            {lastThreads.length > 0 && (
              <div className="ask-empty-threads">
                {lastThreads.slice(0, 3).map((t, i) => (
                  <button
                    key={i}
                    className="ask-thread-chip"
                    onClick={() => submitQuestion(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            <button className="ask-surprise" onClick={handleSurprise}>
              <span className="ask-surprise-icon">&#10022;</span>
              Surprise me
            </button>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.role === 'not-configured') {
            return (
              <div key={i} className="ask-error">
                <h3>Knowledge base not connected</h3>
                <p>The knowledge base isn't set up yet. Please check back soon — we're getting things ready.</p>
              </div>
            );
          }
          if (msg.role === 'error') {
            return (
              <div key={i} className="ask-error">
                <h3>Couldn't reach the knowledge base</h3>
                <p>Something went wrong on our end — your question is saved. Try again in a moment.</p>
                <button
                  className="ask-retry"
                  onClick={() => {
                    setMessages(prev => prev.filter((_, idx) => idx !== i));
                    submitQuestion(msg.content);
                  }}
                >
                  Retry
                </button>
              </div>
            );
          }
          return <ChatBubble key={i} message={msg} />;
        })}

        {loading && <LoadingState />}
        <div ref={messagesEndRef} />
      </div>

      <form className="ask-input-bar" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask something..."
          className="ask-input"
        />
        <button type="submit" className="ask-send" disabled={!input.trim()}>
          &uarr;
        </button>
      </form>

      {sourceSheet && (
        <SourceSheet
          sourceId={sourceSheet.sourceId}
          citedText={sourceSheet.citedText}
          onClose={() => setSourceSheet(null)}
          onAskQuestion={q => submitQuestion(q)}
        />
      )}
    </div>
  );
}
