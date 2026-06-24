/// <reference types="vite/client" />

declare module 'virtual:question-bank' {
  import type { QuestionBank } from './types';

  const bank: QuestionBank;
  export default bank;
}
