import { collection, getDocs, query, orderBy, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { QUIZ_QUESTIONS } from '../data/questions';
import { QuizQuestion } from '../types';

export interface LoadQuizResult {
  questions: QuizQuestion[];
  source: 'firestore' | 'fallback';
}

/**
 * Loads quiz questions from Cloud Firestore collection `questions`.
 * If the collection is empty, automatically seeds it with the standard curriculum questions.
 * If Firestore is temporarily unreachable, falls back to local data gracefully.
 */
export async function loadQuizQuestions(): Promise<LoadQuizResult> {
  try {
    const questionsCollection = collection(db, 'questions');
    const q = query(questionsCollection, orderBy('questionNumber', 'asc'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const fetchedQuestions: QuizQuestion[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          questionNumber: Number(data.questionNumber) || 1,
          question: String(data.question || ''),
          choices: Array.isArray(data.choices) ? data.choices : [],
          correctIndex: Number(data.correctIndex) ?? 0,
          explanation: String(data.explanation || ''),
        };
      });
      return { questions: fetchedQuestions, source: 'firestore' };
    }

    // If Firestore collection has no documents yet, seed initial questions into Firestore
    console.info('Firestore questions collection is empty. Seeding initial questions...');
    for (const item of QUIZ_QUESTIONS) {
      const docRef = doc(db, 'questions', `q${item.questionNumber}`);
      await setDoc(docRef, {
        questionNumber: item.questionNumber,
        question: item.question,
        choices: item.choices,
        correctIndex: item.correctIndex,
        explanation: item.explanation,
      });
    }

    return { questions: QUIZ_QUESTIONS, source: 'firestore' };
  } catch (error) {
    console.warn('Failed to load questions from Firestore, using local curriculum fallback:', error);
    return { questions: QUIZ_QUESTIONS, source: 'fallback' };
  }
}
