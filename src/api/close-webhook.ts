import { QuizAnswers, ScoreResult } from '../types/quiz';

export const sendToClose = async (
  answers: QuizAnswers, 
  result: ScoreResult,
  email: string
): Promise<void> => {

  // Send to our backend API endpoint
  const response = await fetch('/api/close-webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      answers,
      result,
      email
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send data to Close.com');
  }
};