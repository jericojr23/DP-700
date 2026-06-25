import { fileURLToPath } from 'node:url';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { loadQuestionBank } from './scripts/question-bank.mjs';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const virtualId = 'virtual:question-bank';
const resolvedVirtualId = `\0${virtualId}`;

function questionBankPlugin(): Plugin {
  return {
    name: 'dp700-question-bank',
    resolveId(id) {
      return id === virtualId ? resolvedVirtualId : undefined;
    },
    load(id) {
      if (id !== resolvedVirtualId) return undefined;

      const bank = loadQuestionBank(repoRoot);
      for (const file of bank.files) this.addWatchFile(file);

      return `export default ${JSON.stringify({
        questions: bank.questions.map(
          ({ correctAnswer, correctAnswerText, explanation, reasons, ...question }) => question,
        ),
        coverage: bank.coverage,
      })};`;
    },
    configureServer(server) {
      const questionsPath = path.join(repoRoot, 'questions');
      server.watcher.add(questionsPath);
      server.watcher.on('change', (changedPath) => {
        if (changedPath.startsWith(questionsPath)) {
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), questionBankPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
