import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import questionBank from 'virtual:question-bank';
import type {
  Confidence,
  Difficulty,
  ProgressEntry,
  Question,
  SessionResult,
} from './types';

const STORAGE_KEY = 'dp700-practice-progress-v1';
const ALL_DOMAINS = 'All domains';
const ALL_DIFFICULTIES = 'All levels';
const confidenceLevels: Exclude<Confidence, 'Not recorded'>[] = ['Low', 'Medium', 'High'];
const timerOptions = [0, 30, 60, 90];

type View = 'home' | 'quiz' | 'summary';

function readProgress(): Record<string, ProgressEntry> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Record<string, ProgressEntry>) : {};
  } catch {
    return {};
  }
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function needsReview(entry?: ProgressEntry): boolean {
  return entry?.lastResult === 'incorrect';
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
  const [reviewOnly, setReviewOnly] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>(readProgress);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [confidence, setConfidence] = useState<Exclude<Confidence, 'Not recorded'> | ''>('');
  const [submitted, setSubmitted] = useState(false);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerDeadline, setTimerDeadline] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const completionLocked = useRef(false);
  const previousSessionOrder = useRef<string[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const reviewIds = useMemo(
    () => new Set(Object.entries(progress).filter(([, entry]) => needsReview(entry)).map(([id]) => id)),
    [progress],
  );

  const filteredQuestions = useMemo(
    () =>
      questionBank.questions.filter(
        (question) =>
          (domain === ALL_DOMAINS || question.domain === domain) &&
          (difficulty === ALL_DIFFICULTIES || question.difficulty === difficulty) &&
          (!reviewOnly || reviewIds.has(question.id)),
      ),
    [difficulty, domain, reviewIds, reviewOnly],
  );

  const totalAttempts = Object.values(progress).reduce((sum, item) => sum + item.attempts, 0);
  const totalCorrect = Object.values(progress).reduce((sum, item) => sum + item.correct, 0);
  const accuracy = totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const attemptedQuestions = Object.keys(progress).length;
  const largestDomain = Math.max(...questionBank.coverage.domains.map((item) => item.total));
  const currentQuestion = sessionQuestions[currentIndex];

  const startSession = (pool: Question[] = filteredQuestions) => {
    if (pool.length === 0) return;
    const count = Math.min(questionCount, pool.length);
    let nextQuestions = shuffled(pool).slice(0, count);
    const repeatsPreviousOrder =
      nextQuestions.length > 1 &&
      nextQuestions.length === previousSessionOrder.current.length &&
      nextQuestions.every(
        (question, index) => question.id === previousSessionOrder.current[index],
      );

    if (repeatsPreviousOrder) {
      nextQuestions = [...nextQuestions.slice(1), nextQuestions[0]];
    }

    previousSessionOrder.current = nextQuestions.map((question) => question.id);
    setSessionQuestions(nextQuestions);
    setCurrentIndex(0);
    setSelectedAnswer('');
    setConfidence('');
    setSubmitted(false);
    setSessionResults([]);
    setTimeRemaining(timerSeconds);
    setTimerDeadline(timerSeconds > 0 ? Date.now() + timerSeconds * 1000 : null);
    setTimedOut(false);
    completionLocked.current = false;
    setView('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentIsCorrect = Boolean(
    currentQuestion && selectedAnswer === currentQuestion.correctAnswer,
  );

  const completeAnswer = useCallback((answer: string, didTimeOut = false) => {
    if (!currentQuestion || completionLocked.current || (!answer && !didTimeOut)) return;
    completionLocked.current = true;
    const recordedConfidence: Confidence = didTimeOut ? 'Not recorded' : confidence || 'Not recorded';
    const correct = answer === currentQuestion.correctAnswer;

    setProgress((current) => {
      const previous = current[currentQuestion.id];
      return {
        ...current,
        [currentQuestion.id]: {
          attempts: (previous?.attempts ?? 0) + 1,
          correct: (previous?.correct ?? 0) + (correct ? 1 : 0),
          lastResult: correct ? 'correct' : 'incorrect',
          lastConfidence: recordedConfidence,
          lastAttemptedAt: new Date().toISOString(),
        },
      };
    });
    setSessionResults((current) => [
      ...current,
      {
        questionId: currentQuestion.id,
        selectedAnswer: answer,
        correct,
        confidence: recordedConfidence,
        timedOut: didTimeOut,
      },
    ]);
    setTimerDeadline(null);
    setTimedOut(didTimeOut);
    setSubmitted(true);
  }, [confidence, currentQuestion]);

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
      completeAnswer('', true);
    }
  }, [completeAnswer, currentQuestion, submitted, timeRemaining, timerDeadline, view]);

  const submitAnswer = () => completeAnswer(selectedAnswer);

  const moveNext = () => {
    if (currentIndex === sessionQuestions.length - 1) {
      setView('summary');
    } else {
      setCurrentIndex((current) => current + 1);
      setSelectedAnswer('');
      setConfidence('');
      setSubmitted(false);
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

  const clearProgress = () => {
    if (window.confirm('Clear all locally stored quiz attempts and confidence ratings?')) {
      setProgress({});
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
          <span className="live-dot" />
          {questionBank.coverage.total} verified questions
        </div>
      </header>

      <main>
        {view === 'home' && (
          <div className="home-view">
            <section className="hero">
              <div className="hero-copy">
                <span className="eyebrow">Microsoft Fabric Data Engineer</span>
                <h1>Study with signal,<br /><span>not guesswork.</span></h1>
                <p>
                  Scenario-based DP-700 practice with source-verified explanations, confidence
                  tracking, and a review queue that remembers where to focus next.
                </p>
              </div>
              <div className="hero-orbit" aria-hidden="true">
                <div className="orbit-ring orbit-ring-one" />
                <div className="orbit-ring orbit-ring-two" />
                <div className="orbit-core">
                  <strong>{accuracy}%</strong>
                  <span>lifetime accuracy</span>
                </div>
                <span className="orbit-chip orbit-chip-one">SQL</span>
                <span className="orbit-chip orbit-chip-two">PySpark</span>
                <span className="orbit-chip orbit-chip-three">KQL</span>
              </div>
            </section>

            <section className="stat-grid" aria-label="Learning progress">
              <article className="stat-card">
                <span>Questions attempted</span>
                <strong>{attemptedQuestions}<small> / {questionBank.coverage.total}</small></strong>
              </article>
              <article className="stat-card">
                <span>Total answers</span>
                <strong>{totalAttempts}</strong>
              </article>
              <article className="stat-card accent-card">
                <span>Ready for review</span>
                <strong>{reviewIds.size}</strong>
              </article>
            </section>

            <section className="practice-panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Build a session</span>
                  <h2>Choose your practice mix</h2>
                </div>
                {totalAttempts > 0 && (
                  <button className="text-button danger-text" type="button" onClick={clearProgress}>
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

              <label className={`review-toggle ${reviewOnly ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={reviewOnly}
                  onChange={(event) => setReviewOnly(event.target.checked)}
                />
                <span className="toggle-control" aria-hidden="true"><span /></span>
                <span>
                  <strong>Review mode</strong>
                  <small>Only questions whose latest answer was incorrect</small>
                </span>
                <b>{reviewIds.size}</b>
              </label>

              <div className="start-row">
                <span>
                  <strong>{filteredQuestions.length}</strong> questions match this session
                </span>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => startSession()}
                  disabled={filteredQuestions.length === 0}
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
                  const isCorrect = choice.label === currentQuestion.correctAnswer;
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
                  <div className="confidence-control">
                    <span>How confident are you?</span>
                    <div>
                      {confidenceLevels.map((level) => (
                        <button
                          className={confidence === level ? 'active' : ''}
                          type="button"
                          key={level}
                          onClick={() => setConfidence(level)}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
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

              {submitted && (
                <section className={`feedback ${currentIsCorrect ? 'feedback-correct' : 'feedback-incorrect'}`} aria-live="polite">
                  <div className="feedback-heading">
                    <MarkIcon>{currentIsCorrect ? <CheckIcon /> : '×'}</MarkIcon>
                    <div>
                      <span>{currentIsCorrect ? 'Correct' : 'Not quite'}</span>
                      {timedOut && <span className="timeout-label">Time expired</span>}
                      <h2>{currentQuestion.correctAnswer}. {currentQuestion.correctAnswerText}</h2>
                    </div>
                  </div>
                  <div className="explanation">
                    <h3>Why this is the best answer</h3>
                    <RichText>{currentQuestion.explanation}</RichText>
                  </div>
                  <details className="choice-review">
                    <summary>Review every choice</summary>
                    <div>
                      {currentQuestion.choices.map((choice) => (
                        <article key={choice.label}>
                          <strong>{choice.label}</strong>
                          <RichText>{currentQuestion.reasons[choice.label]}</RichText>
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
                  ? 'Every answer landed. Keep these questions in rotation for retention.'
                  : `${missedQuestions.length} question${missedQuestions.length === 1 ? '' : 's'} moved into your review queue.`}
              </p>

              {timedOutCount > 0 && (
                <p className="timeout-summary">
                  <ClockIcon /> {timedOutCount} timed out
                </p>
              )}

              {missedQuestions.length > 0 && (
                <div className="missed-list">
                  <span>Review next</span>
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
                  <button className="secondary-button" type="button" onClick={() => startSession(missedQuestions)}>
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
