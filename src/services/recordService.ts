import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { AIFeedback, LearningRecord } from '../types';

export interface SaveRecordParams {
  question: string;
  studentAnswer: string;
  feedback: AIFeedback;
  recordId: string;
}

export interface SaveRecordResponse {
  recordId: string;
  savedAt: Date;
}

/**
 * Generates a deterministic record ID for the same user and student answer bundle,
 * ensuring that retry attempts for the same answer-feedback pair reuse the same document ID.
 */
export function generateRecordIdForAnswer(uid: string, answer: string): string {
  let hash = 0;
  const str = `${uid}_ai-literacy-01_${answer.trim()}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const cleanUid = uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
  const cleanHash = Math.abs(hash).toString(36);
  return `rec_${cleanUid}_${cleanHash}`;
}

/**
 * Saves student learning record to Cloud Firestore.
 * Requires an authenticated user session. The ownerId is strictly derived from auth.currentUser.uid.
 */
export async function saveLearningRecord({
  question,
  studentAnswer,
  feedback,
  recordId,
}: SaveRecordParams): Promise<SaveRecordResponse> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('로그인한 상태에서만 학습 기록을 저장할 수 있습니다.');
  }

  // Strictly enforce ownerId from authenticated user session
  const ownerId = currentUser.uid;
  const path = `learningRecords/${recordId}`;

  const payload = {
    ownerId,
    activityId: 'ai-literacy-01',
    question: question.trim(),
    studentAnswer: studentAnswer.trim(),
    feedbackDraft: {
      wellUnderstood: feedback.wellUnderstood.trim(),
      pointsToThink: feedback.pointsToThink.trim(),
      followUpQuestion: feedback.followUpQuestion.trim(),
    },
    guidelineVersion: 'v1',
    createdAt: serverTimestamp(),
  };

  try {
    const docRef = doc(db, 'learningRecords', recordId);
    await setDoc(docRef, payload);
    return {
      recordId,
      savedAt: new Date(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches all learning records belonging to the logged-in user from Firestore.
 * Does NOT call Gemini API.
 * Sorts in descending order of createdAt.
 */
export async function fetchUserLearningRecords(ownerUid: string): Promise<LearningRecord[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('로그인이 필요한 기능입니다.');
  }
  if (currentUser.uid !== ownerUid) {
    throw new Error('자신의 학습 기록만 조회할 수 있습니다.');
  }

  const path = 'learningRecords';
  try {
    const recordsRef = collection(db, 'learningRecords');
    const q = query(recordsRef, where('ownerId', '==', ownerUid));
    const snapshot = await getDocs(q);

    const records: LearningRecord[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ownerId: data.ownerId,
        activityId: data.activityId || 'ai-literacy-01',
        question: data.question || '',
        studentAnswer: data.studentAnswer || '',
        feedbackDraft: data.feedbackDraft || {
          wellUnderstood: '',
          pointsToThink: '',
          followUpQuestion: '',
        },
        guidelineVersion: data.guidelineVersion || 'v1',
        createdAt: data.createdAt,
      };
    });

    // 최신순 정렬 (내림차순)
    records.sort((a, b) => {
      const timeA = a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : a.createdAt?.seconds
        ? a.createdAt.seconds * 1000
        : 0;
      const timeB = b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : b.createdAt?.seconds
        ? b.createdAt.seconds * 1000
        : 0;
      return timeB - timeA;
    });

    return records;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Reads detailed single learning record directly from Firestore database.
 * Strictly verifies ownership against the current authenticated user.
 * Does NOT call Gemini API.
 */
export async function fetchLearningRecordDetail(
  recordId: string,
  expectedOwnerId: string
): Promise<LearningRecord> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('로그인이 필요한 기능입니다.');
  }
  if (currentUser.uid !== expectedOwnerId) {
    throw new Error('자신의 학습 기록만 상세 조회할 수 있습니다.');
  }

  const path = `learningRecords/${recordId}`;
  try {
    const docRef = doc(db, 'learningRecords', recordId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('해당 학습 기록을 찾을 수 없습니다.');
    }

    const data = docSnap.data();

    // 엄격한 소유권 검증 (데이터베이스 필드 vs 로그인 세션)
    if (data.ownerId !== expectedOwnerId || data.ownerId !== currentUser.uid) {
      throw new Error('해당 학습 기록을 조회할 권한이 없습니다.');
    }

    return {
      id: docSnap.id,
      ownerId: data.ownerId,
      activityId: data.activityId || 'ai-literacy-01',
      question: data.question || '',
      studentAnswer: data.studentAnswer || '',
      feedbackDraft: data.feedbackDraft || {
        wellUnderstood: '',
        pointsToThink: '',
        followUpQuestion: '',
      },
      guidelineVersion: data.guidelineVersion || 'v1',
      createdAt: data.createdAt,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Deletes a learning record from Cloud Firestore.
 * Strictly verifies that the authenticated user is the owner of the record in access phase.
 */
export async function deleteLearningRecord(
  recordId: string,
  expectedOwnerId: string
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('로그인이 필요한 기능입니다.');
  }
  if (currentUser.uid !== expectedOwnerId) {
    throw new Error('자신의 학습 기록만 삭제할 수 있습니다.');
  }

  const path = `learningRecords/${recordId}`;
  try {
    const docRef = doc(db, 'learningRecords', recordId);

    // 접근 단계에서 소유권 확인: 문서를 먼저 조회하여 소유자 일치 여부 검증
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('삭제할 학습 기록을 찾을 수 없습니다.');
    }
    const data = docSnap.data();
    if (data.ownerId !== expectedOwnerId || data.ownerId !== currentUser.uid) {
      throw new Error('해당 기록을 삭제할 권한이 없습니다.');
    }

    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
