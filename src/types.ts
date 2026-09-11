export interface QuizQuestion {
  id: number | string;
  questionNumber: number;
  question: string;
  choices: string[];
  correctIndex: number; // 0-based index: 0 for ①, 1 for ②, 2 for ③
  explanation: string;
}

export type ScreenState = 'start' | 'quiz' | 'result' | 'records';

export interface UserAnswerRecord {
  questionId: number | string;
  selectedIndex: number;
  isCorrect: boolean;
}

export interface AIFeedback {
  wellUnderstood: string;
  pointsToThink: string;
  followUpQuestion: string;
}

export interface LearningRecord {
  id: string;
  ownerId: string;
  activityId: string; // 'ai-literacy-01'
  question: string;
  studentAnswer: string;
  feedbackDraft: AIFeedback;
  guidelineVersion: string; // 'v1'
  createdAt: any;
}
