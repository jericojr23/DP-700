import fs from 'node:fs';
import path from 'node:path';

const DOMAINS = [
  'Implement and manage an analytics solution',
  'Ingest and transform data',
  'Monitor and optimize an analytics solution',
];
const DIFFICULTIES = ['Foundation', 'Intermediate', 'Advanced'];

function fail(message) {
  throw new Error(`Question bank validation failed: ${message}`);
}

function normalize(content) {
  return content.replace(/\r\n/g, '\n');
}

function field(content, name, fileName) {
  const prefix = `| ${name} |`;
  const line = content.split('\n').find((candidate) => candidate.startsWith(prefix));
  if (!line) fail(`${fileName} is missing the ${name} field`);

  const cells = line.split('|').map((cell) => cell.trim());
  const value = cells[2];
  if (!value) fail(`${fileName} has an empty ${name} field`);
  return value;
}

function section(content, startHeading, endHeading, fileName) {
  const start = content.indexOf(startHeading);
  if (start < 0) fail(`${fileName} is missing ${startHeading}`);

  const bodyStart = start + startHeading.length;
  const end = content.indexOf(endHeading, bodyStart);
  if (end < 0) fail(`${fileName} is missing ${endHeading}`);

  const value = content.slice(bodyStart, end).trim();
  if (!value) fail(`${fileName} has an empty ${startHeading} section`);
  return value;
}

function parseSource(value, fileName) {
  const match = value.match(/^\[([^\]]+)]\((https:\/\/[^)]+)\)$/);
  if (!match) fail(`${fileName} must use an HTTPS Markdown link in Source`);
  return { title: match[1], url: match[2] };
}

function parseQuestion(filePath) {
  const fileName = path.basename(filePath);
  const content = normalize(fs.readFileSync(filePath, 'utf8'));
  const heading = content.match(/^### (DP700-\d{3}): (.+)$/m);
  if (!heading) fail(`${fileName} has an invalid question heading`);

  const choicesText = section(content, '#### Choices', '<details>', fileName);
  const choices = [...choicesText.matchAll(/^- ([A-Z])\. (.+)$/gm)].map((match) => ({
    label: match[1],
    text: match[2].trim(),
  }));
  if (choices.length < 2) fail(`${fileName} must contain at least two choices`);

  const answerText = section(content, '#### Correct answer', '#### Explanation', fileName);
  const answer = answerText.match(/^\*\*([A-Z])\.\s*(.+)\*\*$/m);
  if (!answer) fail(`${fileName} has an invalid Correct answer section`);

  const reasonsText = section(
    content,
    '#### Why the other choices are incorrect',
    '</details>',
    fileName,
  );
  const reasons = Object.fromEntries(
    [...reasonsText.matchAll(/^- \*\*([A-Z]):\*\*\s*(.+)$/gm)].map((match) => [
      match[1],
      match[2].trim(),
    ]),
  );

  const question = {
    id: heading[1],
    title: heading[2].trim(),
    domain: field(content, 'Domain', fileName),
    topic: field(content, 'Topic', fileName),
    difficulty: field(content, 'Difficulty', fileName),
    questionType: field(content, 'Question type', fileName),
    source: parseSource(field(content, 'Source', fileName), fileName),
    lastVerified: field(content, 'Last verified', fileName),
    status: field(content, 'Status', fileName),
    prompt: section(content, '#### Question', '#### Choices', fileName),
    choices,
    correctAnswer: answer[1],
    correctAnswerText: answer[2].trim(),
    explanation: section(content, '#### Explanation', '#### Why the other choices are incorrect', fileName),
    reasons,
  };

  validateQuestion(question, fileName);
  return question;
}

function validateQuestion(question, fileName) {
  if (`${question.id}.md` !== fileName) {
    fail(`${fileName} heading ID does not match its filename`);
  }
  if (!DOMAINS.includes(question.domain)) {
    fail(`${fileName} has unsupported domain: ${question.domain}`);
  }
  if (!DIFFICULTIES.includes(question.difficulty)) {
    fail(`${fileName} has unsupported difficulty: ${question.difficulty}`);
  }
  if (!['Draft', 'Verified'].includes(question.status)) {
    fail(`${fileName} has unsupported status: ${question.status}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(question.lastVerified)) {
    fail(`${fileName} has an invalid Last verified date`);
  }

  const labels = question.choices.map((choice) => choice.label);
  if (new Set(labels).size !== labels.length) fail(`${fileName} has duplicate choice labels`);
  if (!labels.includes(question.correctAnswer)) {
    fail(`${fileName} correct answer does not match a choice`);
  }
  for (const label of labels) {
    if (!question.reasons[label]) fail(`${fileName} is missing reasoning for choice ${label}`);
  }
}

function parseTracker(trackerPath) {
  const content = normalize(fs.readFileSync(trackerPath, 'utf8'));
  if (/(<details>|#### Correct answer|#### Question\s*$)/m.test(content)) {
    fail('the tracker contains question or answer content');
  }

  const rows = [];
  const rowPattern = /^\| \[(DP700-\d{3})]\(([^)]+)\) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| (Foundation|Intermediate|Advanced) \| (Draft|Verified) \| (\d{4}-\d{2}-\d{2}) \|$/gm;
  for (const match of content.matchAll(rowPattern)) {
    rows.push({
      id: match[1],
      link: match[2],
      title: match[3].trim(),
      domain: match[4].trim(),
      topic: match[5].trim(),
      difficulty: match[6],
      status: match[7],
      lastVerified: match[8],
    });
  }

  const coverage = new Map();
  const coverageStart = content.indexOf('## Coverage Tracker');
  const coverageEnd = content.indexOf('## Question Index');
  const coverageBlock = content.slice(coverageStart, coverageEnd);
  for (const line of coverageBlock.split('\n')) {
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim().replace(/^\*\*|\*\*$/g, ''));
    if (cells.length !== 5 || !/^\d+$/.test(cells[1] ?? '')) continue;
    coverage.set(cells[0], {
      Foundation: Number(cells[1]),
      Intermediate: Number(cells[2]),
      Advanced: Number(cells[3]),
      total: Number(cells[4]),
    });
  }

  return { content, rows, coverage };
}

function computeCoverage(questions) {
  const domains = DOMAINS.map((domain) => {
    const counts = { Foundation: 0, Intermediate: 0, Advanced: 0 };
    for (const question of questions.filter((item) => item.domain === domain)) {
      counts[question.difficulty] += 1;
    }
    return {
      domain,
      ...counts,
      total: counts.Foundation + counts.Intermediate + counts.Advanced,
    };
  });

  return {
    domains,
    total: domains.reduce((sum, domain) => sum + domain.total, 0),
  };
}

function validateTracker(questions, tracker, trackerPath) {
  if (tracker.rows.length !== questions.length) {
    fail(`tracker has ${tracker.rows.length} rows for ${questions.length} question files`);
  }

  const questionIds = new Set(questions.map((question) => question.id));
  if (questionIds.size !== questions.length) fail('standalone question IDs are not unique');
  const trackerIds = new Set(tracker.rows.map((row) => row.id));
  if (trackerIds.size !== tracker.rows.length) fail('tracker question IDs are not unique');

  for (const question of questions) {
    const row = tracker.rows.find((candidate) => candidate.id === question.id);
    if (!row) fail(`${question.id} is missing from the tracker`);

    const expected = {
      title: question.title,
      domain: question.domain,
      topic: question.topic,
      difficulty: question.difficulty,
      status: question.status,
      lastVerified: question.lastVerified,
    };
    for (const [key, value] of Object.entries(expected)) {
      if (row[key] !== value) fail(`${question.id} tracker ${key} does not match its file`);
    }

    const linkedFile = path.resolve(path.dirname(trackerPath), row.link);
    if (!fs.existsSync(linkedFile)) fail(`${question.id} tracker link does not resolve`);
    if (path.basename(linkedFile) !== `${question.id}.md`) {
      fail(`${question.id} tracker link points to the wrong file`);
    }
  }

  const computed = computeCoverage(questions);
  for (const domain of computed.domains) {
    const tracked = tracker.coverage.get(domain.domain);
    if (!tracked) fail(`coverage row is missing for ${domain.domain}`);
    for (const key of [...DIFFICULTIES, 'total']) {
      if (tracked[key] !== domain[key]) {
        fail(`coverage mismatch for ${domain.domain} / ${key}`);
      }
    }
  }

  const trackedTotal = tracker.coverage.get('Total');
  if (!trackedTotal || trackedTotal.total !== computed.total) {
    fail('coverage grand total does not match the standalone questions');
  }

  return computed;
}

export function loadQuestionBank(repoRoot) {
  const questionsDir = path.join(repoRoot, 'questions');
  const trackerPath = path.join(questionsDir, 'tracker', 'question_bank.md');
  const forbiddenPaths = [
    path.join(questionsDir, 'question_bank.md'),
    path.join(repoRoot, 'docs', 'question_bank.md'),
  ];

  for (const forbiddenPath of forbiddenPaths) {
    if (fs.existsSync(forbiddenPath)) fail(`obsolete path exists: ${forbiddenPath}`);
  }
  if (!fs.existsSync(trackerPath)) fail(`tracker does not exist: ${trackerPath}`);

  const questionFiles = fs
    .readdirSync(questionsDir)
    .filter((name) => /^DP700-\d{3}\.md$/.test(name))
    .sort()
    .map((name) => path.join(questionsDir, name));
  if (questionFiles.length === 0) fail('no standalone question files were found');

  const questions = questionFiles.map(parseQuestion);
  const tracker = parseTracker(trackerPath);
  const coverage = validateTracker(questions, tracker, trackerPath);

  return {
    questions,
    coverage,
    files: [...questionFiles, trackerPath],
  };
}
