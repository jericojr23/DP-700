import { fileURLToPath } from 'node:url';
import { loadQuestionBank } from './question-bank.mjs';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));

try {
  const bank = loadQuestionBank(repoRoot);
  console.log(
    `Question bank valid: ${bank.questions.length} questions across ${bank.coverage.domains.length} domains.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
