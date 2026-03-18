import { Question } from '../types/game.types';
import questionsData from '../data/questions.json';

const questions: Question[] = questionsData;

export const loadQuestions = (): Question[] => {
  return [...questions];
};

export const getRandomQuestion = (): Question => {
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
};

export const getQuestionById = (id: string): Question | undefined => {
  return questions.find(q => q.id === id);
};
