import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ChatBubble from '../components/ChatBubble';
import LoadingState from '../components/LoadingState';
import SourceSheet from '../components/SourceSheet';
import { queryKnowledgeBase, isApiConfigured } from '../utils/api';
import { saveThread, getDailyThreads, formatThreadAge, saveConversation, getConversation } from '../utils/storage';
import { addExplorationNode } from '../utils/mapData';
import { SERENDIPITY_PROMPTS } from '../utils/metadata';

export default function Ask() {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sourceSheet, setSourceSheet] = useState(null);
  const [isResuming, setIsResuming] = useState(false);
  const messagesContainerRef = useRef(null);
  const lastMessageRef = useRef(null);
  const lastUserBubbleRef = useRef(null);
  const inputRef = useRef(null);
  const handledQuestionRef = useRef(null);
  const prevLoadingRef = useRef(false);

  useEffect(() => {
    const q = location.state?.question;
    if (!q || q === handledQuestionRef.current) return;
    handledQuestionRef.current = q;
    submitQuestion(q);
    window.history.replaceState({}, '');
  }, [location.state?.question]);

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = loading;

    if (loading && !wasLoading) {
      // user just submitted — scroll loading indicator into view
      container.scrollTop = container.scrollHeight;
    } else if (!loading && wasLoading) {
      // response arrived — scroll to the user's question bubble
      const userBubble = lastUserBubbleRef.current;
      if (userBubble) {
        const offset = userBubble.offsetTop - container.offsetTop - 24;
        container.scrollTo({ top: offset, behavior: 'smooth' });
      }
    }
  }, [messages, loading]);

  async function submitQuestion(question) {
    const userMsg = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    saveThread(question);

    try {
      const data = await queryKnowledgeBase(question);

      // Add exploration nodes
      if (data.sources?.length) {
        data.sources.forEach(src => {
          addExplorationNode({
            id: src.id,
            label: src.name,
            category: src.label || 'General',
            related: data.sources
              .filter(s => s.id !== src.id)
              .map(s => ({ id: s.id, question })),
          });
        });
      }

      setMessages(prev => {
        const next = [...prev, {
          role: 'assistant',
          data,
          onFollowUp: q => submitQuestion(q),
          onSourceTap: src => setSourceSheet({ sourceId: src.id, citedText: data.highlight }),
        }];
        saveConversation(question, next);
        return next;
      });
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

  function handleThreadResume(thread) {
    const saved = getConversation(thread.text);
    if (saved) {
      // re-attach callbacks to assistant messages
      const restored = saved.messages.map(m => {
        if (m.role !== 'assistant' || !m.data) return m;
        return {
          ...m,
          onFollowUp: q => submitQuestion(q),
          onSourceTap: src => setSourceSheet({ sourceId: src.id, citedText: m.data.highlight }),
        };
      });
      setIsResuming(true);
      setMessages(restored);
      setTimeout(() => setIsResuming(false), 2000);
    } else {
      submitQuestion(thread.text);
    }
  }

  const dailyThreads = getDailyThreads(SERENDIPITY_PROMPTS);
  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className={`ask${sourceSheet ? ' ask--with-source' : ''}`}>
      <div className="ask-chat">
      <div className="ask-messages" ref={messagesContainerRef}>
        {isResuming && (
          <div className="ask-resumed-notice">
            <span>↩ Restored from your last session</span>
          </div>
        )}

        {isEmpty && (
          <div className="ask-empty">
            <h2 className="ask-empty-headline">What's on your mind?</h2>
            <p className="ask-empty-sub">
              Ask anything from Lenny's podcasts and newsletters — or pick a thread below.
            </p>

            {dailyThreads.length > 0 && (
              <div className="ask-empty-threads">
                {dailyThreads.map((t, i) => {
                  const isHistory = t.fresh === false;
                  const explored = isHistory && !!getConversation(t.text);
                  return (
                    <button
                      key={i}
                      className={`ask-thread-chip${explored ? ' ask-thread-chip--explored' : ' ask-thread-chip--new'}`}
                      onClick={() => handleThreadResume(t)}
                    >
                      <span className="ask-thread-chip-text">{t.text}</span>
                      {explored
                        ? <span className="ask-thread-chip-badge ask-thread-chip-badge--explored">↩ continue</span>
                        : isHistory
                          ? <span className="ask-thread-chip-badge ask-thread-chip-badge--new">new</span>
                          : <span className="ask-thread-chip-badge ask-thread-chip-badge--fresh">today</span>
                      }
                    </button>
                  );
                })}
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
          const isLast = i === messages.length - 1;
          const priorAssistantCount = messages.slice(0, i).filter(m => m.role === 'assistant').length;
          const isLastUser = msg.role === 'user' && !messages.slice(i + 1).some(m => m.role === 'user');
          return <ChatBubble key={i} message={msg} isFollowUp={priorAssistantCount > 0} ref={isLastUser ? lastUserBubbleRef : isLast ? lastMessageRef : null} />;
        })}

        {loading && <LoadingState isResuming={isResuming} />}
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
      </div>

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
