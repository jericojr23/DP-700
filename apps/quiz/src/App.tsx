import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import fallbackQuestionBank from 'virtual:question-bank';
import type {
  AnswerReview,
  Difficulty,
  ProgressEntry,
  ProgressResponse,
  ProgressSummary,
  Question,
  QuestionBank,
  SessionResult,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
const ALL_DOMAINS = 'All domains';
const ALL_DIFFICULTIES = 'All levels';
const timerOptions = [0, 30, 60, 90];
const emptySummary: ProgressSummary = {
  totalAttempts: 0,
  totalCorrect: 0,
  accuracy: 0,
  attemptedQuestions: 0,
  dueNow: 0,
  scheduled: 0,
  mature: 0,
};

type View = 'home' | 'quiz' | 'summary';
type ApiStatus = 'loading' | 'ready' | 'offline';

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API request failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatDue(value?: string | null): string {
  if (!value) return 'Not scheduled';
  const dueDate = new Date(value);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  if (diffMs <= 0) return 'Due now';
  const diffHours = Math.ceil(diffMs / 3_600_000);
  if (diffHours < 24) return `Due in ${diffHours}h`;
  return `Due in ${Math.ceil(diffHours / 24)}d`;
}

function RichText({ children }: { children: string }) {
  const paragraphs = children.split(/\n\s*\n/);
  return (
    <>
      {paragraphs.map((paragraph, paragraphIndex) => (
        <p key={`${paragraph.slice(0, 24)}-${paragraphIndex}`}>
          {paragraph.split(/(`[^`]+`)/g).map((part, partIndex) =>
            part.startsWith('`') && part.endsWith('`') ? (
              <code key={`${part}-${partIndex}`}>{part.slice(1, -1)}</code>
            ) : (
              part
            ),
          )}
        </p>
      ))}
    </>
  );
}

function MarkIcon({ children }: { children: ReactNode }) {
  return <span className="mark-icon" aria-hidden="true">{children}</span>;
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m4 10 4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4.5h9a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3V4.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 4.5V17a3 3 0 0 0 3 3M9.5 9h4M9.5 12h4" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 6v4l2.7 1.7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function App() {
  const [view, setView] = useState<View>('home');
  const [domain, setDomain] = useState(ALL_DOMAINS);
  const [difficulty, setDifficulty] = useState<string>(ALL_DIFFICULTIES);
  const [dueOnly, setDueOnly] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [questionBank, setQuestionBank] = useState<QuestionBank>(fallbackQuestionBank);
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({});
  const [progressSummary, setProgressSummary] = useState<ProgressSummary>(emptySummary);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('loading');
  const [apiError, setApiError] = useState('');
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [answerReview, setAnswerReview] = useState<AnswerReview | null>(null);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerDeadline, setTimerDeadline] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const completionLocked = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialState() {
      try {
        const [bank, progressResponse] = await Promise.all([
          apiRequest<QuestionBank>('/api/question-bank'),
          apiRequest<ProgressResponse>('/api/progress'),
        ]);
        if (cancelled) return;
        setQuestionBank(bank);
        setProgress(progressResponse.entries);
        setProgressSummary(progressResponse.summary);
        setApiStatus('ready');
        setApiError('');
      } catch (error) {
        if (cancelled) return;
        setApiStatus('offline');
        setApiError(error instanceof Error ? error.message : 'Unable to reach the quiz API.');
      }
    }

    void loadInitialState();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredQuestions = useMemo(
    () =>
      questionBank.questions.filter((question) => {
        const entry = progress[question.id];
        const isDue = !entry || entry.isDue;
        return (
          (domain === ALL_DOMAINS || question.domain === domain) &&
          (difficulty === ALL_DIFFICULTIES || question.difficulty === difficulty) &&
          (!dueOnly || isDue)
        );
      }),
    [difficulty, domain, dueOnly, progress, questionBank.questions],
  );

  const largestDomain = Math.max(...questionBank.coverage.domains.map((item) => item.total));
  const currentQuestion = sessionQuestions[currentIndex];
  const currentProgress = currentQuestion ? progress[currentQuestion.id] : undefined;
  const currentIsCorrect = Boolean(answerReview?.correct);

  const startSession = async (pool?: Question[]) => {
    if (apiStatus !== 'ready') return;
    const count = Math.min(questionCount, pool?.length ?? filteredQuestions.length);
    if (count === 0) return;

    try {
      const response = pool
        ? { questions: pool.slice(0, count) }
        : await apiRequest<{ questions: Question[] }>('/api/sessions', {
            method: 'POST',
            body: JSON.stringify({
              count,
              domain: domain === ALL_DOMAINS ? null : domain,
              difficulty: difficulty === ALL_DIFFICULTIES ? null : difficulty,
              dueOnly,
            }),
          });

      setSessionQuestions(response.questions);
      setCurrentIndex(0);
      setSelectedAnswer('');
      setSubmitted(false);
      setAnswerReview(null);
      setSessionResults([]);
      setTimeRemaining(timerSeconds);
      setTimerDeadline(timerSeconds > 0 ? Date.now() + timerSeconds * 1000 : null);
      setTimedOut(false);
      completionLocked.current = false;
      setView('quiz');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setApiStatus('offline');
      setApiError(error instanceof Error ? error.message : 'Unable to start a quiz session.');
    }
  };

  const completeAnswer = useCallback(async (answer: string, didTimeOut = false) => {
    if (!currentQuestion || completionLocked.current || (!answer && !didTimeOut)) return;
    completionLocked.current = true;

    try {
      const review = await apiRequest<AnswerReview>('/api/answers', {
        method: 'POST',
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answer,
          timedOut: didTimeOut,
        }),
      });

      setProgress((current) => ({
        ...current,
        [review.questionId]: review.progress,
      }));
      setProgressSummary(review.summary);
      setAnswerReview(review);
      setSessionResults((current) => [
        ...current,
        {
          questionId: currentQuestion.id,
          selectedAnswer: answer,
          correct: review.correct,
          timedOut: didTimeOut,
          dueAt: review.progress.dueAt,
        },
      ]);
      setTimerDeadline(null);
      setTimedOut(didTimeOut);
      setSubmitted(true);
    } catch (error) {
      completionLocked.current = false;
      setApiStatus('offline');
      setApiError(error instanceof Error ? error.message : 'Unable to submit the answer.');
    }
  }, [currentQuestion]);

  useEffect(() => {
    if (view !== 'quiz' || submitted || timerDeadline === null) return;

    const updateTimer = () => {
      setTimeRemaining(Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000)));
    };
    updateTimer();
    const intervalId = window.setInterval(updateTimer, 250);
    return () => window.clearInterval(intervalId);
  }, [submitted, timerDeadline, view]);

  useEffect(() => {
    if (
      view === 'quiz' &&
      currentQuestion &&
      !submitted &&
      timerDeadline !== null &&
      timeRemaining === 0
    ) {
      void completeAnswer('', true);
    }
  }, [completeAnswer, currentQuestion, submitted, timeRemaining, timerDeadline, view]);

  const submitAnswer = () => void completeAnswer(selectedAnswer);

  const moveNext = () => {
    if (currentIndex === sessionQuestions.length - 1) {
      setView('summary');
    } else {
      setCurrentIndex((current) => current + 1);
      setSelectedAnswer('');
      setSubmitted(false);
      setAnswerReview(null);
      setTimeRemaining(timerSeconds);
      setTimerDeadline(timerSeconds > 0 ? Date.now() + timerSeconds * 1000 : null);
      setTimedOut(false);
      completionLocked.current = false;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const returnHome = () => {
    setView('home');
    setSessionQuestions([]);
    setTimerDeadline(null);
    setTimeRemaining(0);
    setTimedOut(false);
    completionLocked.current = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearProgress = async () => {
    if (!window.confirm('Clear all API-backed attempts and spaced repetition scheduling?')) return;
    try {
      const response = await apiRequest<ProgressResponse>('/api/progress', { method: 'DELETE' });
      setProgress(response.entries);
      setProgressSummary(response.summary);
    } catch (error) {
      setApiStatus('offline');
      setApiError(error instanceof Error ? error.message : 'Unable to clear progress.');
    }
  };

  const missedQuestions = sessionResults
    .filter((result) => !result.correct)
    .map((result) => questionBank.questions.find((question) => question.id === result.questionId))
    .filter((question): question is Question => Boolean(question));
  const sessionScore = sessionResults.filter((result) => result.correct).length;
  const timedOutCount = sessionResults.filter((result) => result.timedOut).length;

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" type="button" onClick={returnHome} aria-label="Go to practice home">
          <span className="brand-symbol"><BookIcon /></span>
          <span>
            <strong>DP-700</strong>
            <small>Practice Studio</small>
          </span>
        </button>
        <div className="header-meta">
          <span className={`live-dot ${apiStatus === 'ready' ? '' : 'offline'}`} />
          {apiStatus === 'ready' ? `${questionBank.coverage.total} verified questions` : 'API offline'}
        </div>
      </header>

      <main>
        {view === 'home' && (
          <div className="home-view">
            <section className="hero">
              <div className="hero-copy">
                <span className="eyebrow">Microsoft Fabric Data Engineer</span>
                <h1>Study on schedule,<br /><span>not on hunches.</span></h1>
                <p>
                  Scenario-based DP-700 practice with source-verified explanations, API-backed
                  attempt history, and spaced repetition that brings questions back when they are due.
                </p>
              </div>
              <div className="hero-orbit" aria-hidden="true">
                <div className="orbit-ring orbit-ring-one" />
                <div className="orbit-ring orbit-ring-two" />
                <div className="orbit-core">
                  <strong>{progressSummary.accuracy}%</strong>
                  <span>lifetime accuracy</span>
                </div>
                <span className="orbit-chip orbit-chip-one">SQL</span>
                <span className="orbit-chip orbit-chip-two">PySpark</span>
                <span className="orbit-chip orbit-chip-three">KQL</span>
              </div>
            </section>

            {apiStatus !== 'ready' && (
              <section className="api-banner" aria-live="polite">
                <strong>Start the quiz API to save attempts and use spaced repetition.</strong>
                <span>{apiError || 'Waiting for FastAPI at http://127.0.0.1:8000.'}</span>
              </section>
            )}

            <section className="stat-grid" aria-label="Learning progress">
              <article className="stat-card">
                <span>Questions attempted</span>
                <strong>{progressSummary.attemptedQuestions}<small> / {questionBank.coverage.total}</small></strong>
              </article>
              <article className="stat-card">
                <span>Total answers</span>
                <strong>{progressSummary.totalAttempts}</strong>
              </article>
              <article className="stat-card accent-card">
                <span>Due now</span>
                <strong>{progressSummary.dueNow}</strong>
              </article>
            </section>

            <section className="practice-panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Build a session</span>
                  <h2>Choose your practice mix</h2>
                </div>
                {progressSummary.totalAttempts > 0 && (
                  <button className="text-button danger-text" type="button" onClick={() => void clearProgress()}>
                    Clear history
                  </button>
                )}
              </div>

              <div className="filter-grid">
                <label>
                  <span>Exam domain</span>
                  <select value={domain} onChange={(event) => setDomain(event.target.value)}>
                    <option>{ALL_DOMAINS}</option>
                    {questionBank.coverage.domains.map((item) => (
                      <option key={item.domain}>{item.domain}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Difficulty</span>
                  <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                    <option>{ALL_DIFFICULTIES}</option>
                    {(['Foundation', 'Intermediate', 'Advanced'] as Difficulty[]).map((level) => (
                      <option key={level}>{level}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Session length</span>
                  <select
                    value={questionCount}
                    onChange={(event) => setQuestionCount(Number(event.target.value))}
                  >
                    <option value={5}>5 questions</option>
                    <option value={10}>10 questions</option>
                    <option value={questionBank.coverage.total}>All available</option>
                  </select>
                </label>
                <label>
                  <span>Question timer</span>
                  <select
                    value={timerSeconds}
                    onChange={(event) => setTimerSeconds(Number(event.target.value))}
                  >
                    {timerOptions.map((seconds) => (
                      <option key={seconds} value={seconds}>
                        {seconds === 0 ? 'Untimed' : `${seconds} seconds`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className={`review-toggle ${dueOnly ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={dueOnly}
                  onChange={(event) => setDueOnly(event.target.checked)}
                />
                <span className="toggle-control" aria-hidden="true"><span /></span>
                <span>
                  <strong>Due cards only</strong>
                  <small>New cards and cards scheduled for review now</small>
                </span>
                <b>{progressSummary.dueNow}</b>
              </label>

              <div className="schedule-strip" aria-label="Spaced repetition schedule">
                <span><b>{progressSummary.scheduled}</b> scheduled</span>
                <span><b>{progressSummary.mature}</b> mature</span>
                <span><b>{progressSummary.totalCorrect}</b> correct</span>
              </div>

              <div className="start-row">
                <span>
                  <strong>{filteredQuestions.length}</strong> questions match this session
                </span>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => void startSession()}
                  disabled={filteredQuestions.length === 0 || apiStatus !== 'ready'}
                >
                  Start practice <ArrowIcon />
                </button>
              </div>
              {filteredQuestions.length === 0 && (
                <p className="empty-note">No questions match these filters yet. Try widening the selection.</p>
              )}
            </section>

            <section className="coverage-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Question bank</span>
                  <h2>Coverage at a glance</h2>
                </div>
                <span className="verified-pill"><CheckIcon /> Source verified</span>
              </div>
              <div className="coverage-grid">
                {questionBank.coverage.domains.map((item, index) => (
                  <article className="coverage-card" key={item.domain}>
                    <span className="domain-number">0{index + 1}</span>
                    <h3>{item.domain}</h3>
                    <div className="coverage-bar" aria-label={`${item.total} questions`}>
                      <span style={{ width: `${(item.total / largestDomain) * 100}%` }} />
                    </div>
                    <ul>
                      <li><span>Foundation</span><strong>{item.Foundation}</strong></li>
                      <li><span>Intermediate</span><strong>{item.Intermediate}</strong></li>
                      <li><span>Advanced</span><strong>{item.Advanced}</strong></li>
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {view === 'quiz' && currentQuestion && (
          <div className="quiz-view">
            <div className="quiz-topbar">
              <button className="text-button" type="button" onClick={returnHome}>← Exit session</button>
              <div className="quiz-status">
                <span>Question {currentIndex + 1} of {sessionQuestions.length}</span>
                <span className="due-pill">{formatDue(currentProgress?.dueAt)}</span>
                {timerSeconds > 0 && (
                  <span
                    className={`question-timer ${!submitted && timeRemaining <= 10 ? 'urgent' : ''}`}
                    role="timer"
                    aria-label={`${timeRemaining} seconds remaining`}
                  >
                    <ClockIcon /> {formatTime(timeRemaining)}
                  </span>
                )}
              </div>
            </div>
            <div className="session-progress" aria-hidden="true">
              <span style={{ width: `${((currentIndex + (submitted ? 1 : 0)) / sessionQuestions.length) * 100}%` }} />
            </div>

            <article className="question-card">
              <div className="question-meta">
                <span>{currentQuestion.id}</span>
                <span>{currentQuestion.difficulty}</span>
                <span>{currentQuestion.topic}</span>
              </div>
              <h1>{currentQuestion.title}</h1>
              <div className="question-prompt"><RichText>{currentQuestion.prompt}</RichText></div>

              <fieldset className="choices" disabled={submitted}>
                <legend className="sr-only">Choose one answer</legend>
                {currentQuestion.choices.map((choice) => {
                  const isSelected = selectedAnswer === choice.label;
                  const isCorrect = choice.label === answerReview?.correctAnswer;
                  const stateClass = submitted
                    ? isCorrect
                      ? 'correct'
                      : isSelected
                        ? 'incorrect'
                        : ''
                    : isSelected
                      ? 'selected'
                      : '';
                  return (
                    <label className={`choice ${stateClass}`} key={choice.label}>
                      <input
                        type="radio"
                        name="answer"
                        value={choice.label}
                        checked={isSelected}
                        onChange={() => setSelectedAnswer(choice.label)}
                      />
                      <span className="choice-label">{choice.label}</span>
                      <div className="choice-text"><RichText>{choice.text}</RichText></div>
                      {submitted && isCorrect && <MarkIcon><CheckIcon /></MarkIcon>}
                      {submitted && isSelected && !isCorrect && <MarkIcon>×</MarkIcon>}
                    </label>
                  );
                })}
              </fieldset>

              {!submitted && (
                <div className="answer-controls">
                  <div className="schedule-note">
                    <span>Spaced repetition</span>
                    <p>Correct answers are scheduled forward. Missed or timed-out questions stay due.</p>
                  </div>
                  <button
                    className="primary-button"
                    type="button"
                    disabled={!selectedAnswer}
                    onClick={submitAnswer}
                  >
                    Check answer <ArrowIcon />
                  </button>
                </div>
              )}

              {submitted && answerReview && (
                <section className={`feedback ${currentIsCorrect ? 'feedback-correct' : 'feedback-incorrect'}`} aria-live="polite">
                  <div className="feedback-heading">
                    <MarkIcon>{currentIsCorrect ? <CheckIcon /> : '×'}</MarkIcon>
                    <div>
                      <span>{currentIsCorrect ? 'Correct' : 'Not quite'}</span>
                      {timedOut && <span className="timeout-label">Time expired</span>}
                      <h2>{answerReview.correctAnswer}. {answerReview.correctAnswerText}</h2>
                    </div>
                  </div>
                  <div className="next-review">
                    <span>Next review</span>
                    <strong>{formatDue(answerReview.progress.dueAt)}</strong>
                    <small>{answerReview.progress.intervalDays === 0 ? 'Still due' : `${answerReview.progress.intervalDays} day interval`}</small>
                  </div>
                  <div className="explanation">
                    <h3>Why this is the best answer</h3>
                    <RichText>{answerReview.explanation}</RichText>
                  </div>
                  <details className="choice-review">
                    <summary>Review every choice</summary>
                    <div>
                      {currentQuestion.choices.map((choice) => (
                        <article key={choice.label}>
                          <strong>{choice.label}</strong>
                          <RichText>{answerReview.reasons[choice.label]}</RichText>
                        </article>
                      ))}
                    </div>
                  </details>
                  <div className="source-row">
                    <span>Verified {currentQuestion.lastVerified}</span>
                    <a href={currentQuestion.source.url} target="_blank" rel="noreferrer">
                      Read the Microsoft source ↗
                    </a>
                  </div>
                  <button className="primary-button next-button" type="button" onClick={moveNext}>
                    {currentIndex === sessionQuestions.length - 1 ? 'See session results' : 'Next question'}
                    <ArrowIcon />
                  </button>
                </section>
              )}
            </article>
          </div>
        )}

        {view === 'summary' && (
          <div className="summary-view">
            <section className="summary-card">
              <span className="eyebrow">Session complete</span>
              <div className="score-ring" style={{ '--score': `${(sessionScore / sessionResults.length) * 360}deg` } as CSSProperties}>
                <div><strong>{sessionScore}</strong><span>of {sessionResults.length}</span></div>
              </div>
              <h1>{sessionScore === sessionResults.length ? 'Clean sweep.' : sessionScore / sessionResults.length >= 0.7 ? 'Solid work.' : 'Good data. Now refine.'}</h1>
              <p>
                {missedQuestions.length === 0
                  ? 'Every answer was scheduled forward for later retention.'
                  : `${missedQuestions.length} question${missedQuestions.length === 1 ? '' : 's'} stayed due for another pass.`}
              </p>

              {timedOutCount > 0 && (
                <p className="timeout-summary">
                  <ClockIcon /> {timedOutCount} timed out
                </p>
              )}

              {missedQuestions.length > 0 && (
                <div className="missed-list">
                  <span>Still due</span>
                  {missedQuestions.map((question) => (
                    <div key={question.id}>
                      <strong>{question.id}</strong>
                      <span>{question.title}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="summary-actions">
                {missedQuestions.length > 0 && (
                  <button className="secondary-button" type="button" onClick={() => void startSession(missedQuestions)}>
                    Retry missed
                  </button>
                )}
                <button className="primary-button" type="button" onClick={returnHome}>
                  Back to dashboard <ArrowIcon />
                </button>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer>
        <span>Independent DP-700 study resource</span>
        <span>Questions remain Markdown-first and source verified</span>
      </footer>
    </div>
  );
}

export default App;
