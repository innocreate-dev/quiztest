import React, { useState, useEffect } from 'react';
import {
  PenLine,
  Sparkles,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  Loader2,
  HelpCircle,
  Lightbulb,
  BookmarkCheck,
  LogIn,
  UserCheck,
  Database,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import {
  saveLearningRecord,
  generateRecordIdForAnswer,
  SaveRecordResponse,
} from '../services/recordService';

interface FeedbackContent {
  wellUnderstood: string;
  pointsToThink: string;
  followUpQuestion: string;
}

const QUESTION_TEXT =
  '인공지능이 알려준 내용을 바로 믿고 사용하면 안 되는 이유와, 사용하기 전에 확인할 방법을 써 보세요.';
const MAX_LENGTH = 500;

export const DescriptiveFeedbackSection: React.FC = () => {
  const { user, loading: authLoading, signIn } = useAuth();

  const [studentAnswer, setStudentAnswer] = useState<string>('');
  const [isLoadingFeedback, setIsLoadingFeedback] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackContent | null>(null);
  const [usedModel, setUsedModel] = useState<string | null>(null);

  // Firestore save states
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedInfo, setSavedInfo] = useState<SaveRecordResponse | null>(null);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [loginPromptError, setLoginPromptError] = useState<string | null>(null);

  // 답변이 바뀌면 이전 피드백, 저장 상태, 레코드 ID 초기화
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setStudentAnswer(value);
      if (feedbackData) {
        setFeedbackData(null);
      }
      if (errorMessage) {
        setErrorMessage(null);
      }
      // Reset save states on answer edit
      setSaveStatus('idle');
      setSaveError(null);
      setSavedInfo(null);
      setActiveRecordId(null);
    }
  };

  // 피드백 생성 완료 시 동일 답변 묶음에 대한 recordId 미리 동기화
  useEffect(() => {
    if (feedbackData && user && !activeRecordId) {
      const generatedId = generateRecordIdForAnswer(user.uid, studentAnswer);
      setActiveRecordId(generatedId);
    }
  }, [feedbackData, user, studentAnswer, activeRecordId]);

  const handleGenerateFeedback = async () => {
    const trimmed = studentAnswer.trim();

    // 클라이언트 측 빈 답변 검사
    if (trimmed.length === 0) {
      setErrorMessage(
        '답변을 먼저 작성해 주세요. 인공지능이 알려준 내용을 바로 믿으면 안 되는 이유와 확인할 방법을 함께 써 보세요.'
      );
      setFeedbackData(null);
      return;
    }

    setIsLoadingFeedback(true);
    setErrorMessage(null);
    setFeedbackData(null);
    setSaveStatus('idle');
    setSaveError(null);
    setSavedInfo(null);
    setActiveRecordId(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentAnswer: trimmed }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '피드백 초안을 생성하지 못했습니다.');
      }

      setFeedbackData(result.feedback);
      setUsedModel(result.model || 'gemini-3.6-flash');

      // 로그인 상태라면 바로 동일 묶음 식별용 recordId 산출
      if (user) {
        const genId = generateRecordIdForAnswer(user.uid, trimmed);
        setActiveRecordId(genId);
      }
    } catch (err: any) {
      console.error('Feedback request failed:', err);
      setErrorMessage(
        err?.message || '네트워크 연결 또는 서버 오류로 피드백을 가져오지 못했습니다.'
      );
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  // Google 로그인 처리
  const handleGoogleLogin = async () => {
    setLoginPromptError(null);
    try {
      const loggedInUser = await signIn();
      if (loggedInUser && feedbackData) {
        const genId = generateRecordIdForAnswer(loggedInUser.uid, studentAnswer);
        setActiveRecordId(genId);
      }
    } catch (err: any) {
      setLoginPromptError(err.message || '로그인 중 오류가 발생했습니다.');
    }
  };

  // 학습 기록 Firestore 저장
  const handleSaveLearningRecord = async () => {
    if (!user) {
      setLoginPromptError('학습 기록을 저장하려면 먼저 로그인해 주세요.');
      return;
    }

    if (!feedbackData) {
      return;
    }

    // 같은 답변·피드백 묶음의 재시도는 같은 기록 ID를 사용
    const targetRecordId =
      activeRecordId || generateRecordIdForAnswer(user.uid, studentAnswer);
    setActiveRecordId(targetRecordId);

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await saveLearningRecord({
        question: QUESTION_TEXT,
        studentAnswer,
        feedback: feedbackData,
        recordId: targetRecordId,
      });

      setSaveStatus('saved');
      setSavedInfo(result);
    } catch (err: any) {
      console.error('Firestore save failed:', err);
      setSaveStatus('error');
      // 실패해도 학생의 입력(studentAnswer)과 feedbackData는 그대로 유지됨
      setSaveError(
        err?.message || 'Firestore에 기록을 저장하지 못했습니다. 다시 시도해 주세요.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="descriptive-feedback-section"
      className="bg-white rounded-3xl shadow-sm border border-amber-200/90 p-6 sm:p-7 space-y-5"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-amber-100 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <PenLine className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              서술형 답변과 AI 피드백
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              배운 내용을 바탕으로 나의 생각을 직접 글로 정리해 봐요.
            </p>
          </div>
        </div>

        {usedModel && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            사용 모델: {usedModel}
          </span>
        )}
      </div>

      {/* Question Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/70">
        <span className="inline-block text-xs font-bold text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full mb-1.5">
          생각해 볼 질문
        </span>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
          {QUESTION_TEXT}
        </h3>
      </div>

      {/* Privacy Warning Notice */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs sm:text-sm text-slate-600">
        <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-700">개인정보 보호 안내: </span>
          <span>이름, 학교, 전화번호, 집 주소 등 본인이나 친구의 개인정보는 절대 입력하지 마세요.</span>
        </div>
      </div>

      {/* Multiline Answer Textarea with Character Counter */}
      <div className="space-y-1.5">
        <label
          htmlFor="student-descriptive-answer"
          className="block text-sm font-bold text-slate-800"
        >
          나의 답변 작성하기
        </label>
        <div className="relative">
          <textarea
            id="student-descriptive-answer"
            rows={5}
            disabled={isLoadingFeedback || isSaving}
            value={studentAnswer}
            onChange={handleChange}
            maxLength={MAX_LENGTH}
            placeholder="인공지능이 왜 틀릴 수 있는지, 그리고 교과서나 믿을 만한 자료로 어떻게 확인해야 하는지 자유롭게 적어보세요. (최대 500자)"
            className="w-full p-4 text-sm sm:text-base rounded-2xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-slate-800 placeholder:text-slate-400 leading-relaxed transition-all resize-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-slate-500">답변은 500자 이내로 작성할 수 있어요.</span>
          <span
            className={`font-semibold ${
              studentAnswer.length >= MAX_LENGTH
                ? 'text-rose-600 font-bold'
                : 'text-slate-500'
            }`}
          >
            {studentAnswer.length} / {MAX_LENGTH}자
          </span>
        </div>
      </div>

      {/* Error Message & Retry Button for Feedback */}
      {errorMessage && (
        <div
          id="descriptive-error-message"
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-sm space-y-2.5"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-semibold leading-snug">
              <span>{errorMessage}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerateFeedback}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>다시 시도하기</span>
          </button>
        </div>
      )}

      {/* Action Button: 피드백 초안 생성 */}
      <div>
        <button
          id="btn-generate-feedback"
          type="button"
          disabled={isLoadingFeedback || isSaving}
          onClick={handleGenerateFeedback}
          className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-base sm:text-lg shadow-md shadow-amber-500/20 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none"
        >
          {isLoadingFeedback ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>AI 피드백 초안을 생성하고 있어요...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-100" />
              <span>피드백 초안 생성</span>
            </>
          )}
        </button>
      </div>

      {/* Feedback Result Area */}
      <div
        id="feedback-result-area"
        className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 text-slate-800 space-y-5"
      >
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
              피드백 결과 영역
            </h4>
          </div>
          {/* Teacher Review Disclaimer Badge */}
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
            교사의 검토가 필요한 AI 피드백 초안
          </span>
        </div>

        {feedbackData ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-1"
          >
            {/* 1. 잘 이해한 점 */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>1. 잘 이해한 점</span>
              </div>
              <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium pl-6">
                {feedbackData.wellUnderstood}
              </p>
            </div>

            {/* 2. 더 생각할 점 */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-amber-900">
                <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>2. 더 생각할 점</span>
              </div>
              <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium pl-6">
                {feedbackData.pointsToThink}
              </p>
            </div>

            {/* 3. 이어 생각할 질문 */}
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-1">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-sky-900">
                <HelpCircle className="w-4 h-4 text-sky-600 flex-shrink-0" />
                <span>3. 이어 생각할 질문</span>
              </div>
              <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium pl-6">
                {feedbackData.followUpQuestion}
              </p>
            </div>

            {/* ──────── 학습 기록 저장 영역 ──────── */}
            <div
              id="learning-record-save-section"
              className="mt-5 pt-4 border-t border-slate-200/90 space-y-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Cloud Firestore 학습 기록 보관</span>
                </div>
                {user ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold truncate max-w-[160px]">
                      {user.displayName || user.email || '학생'}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    로그인 필요
                  </span>
                )}
              </div>

              {/* Login error message if any */}
              {loginPromptError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{loginPromptError}</span>
                </div>
              )}

              {/* Case A: Not logged in */}
              {!user ? (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                  <p className="text-xs sm:text-sm text-slate-700 font-medium">
                    내 서술형 답변과 AI 피드백 초안을 안전하게 저장하려면 Google 계정으로 로그인해 주세요.
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      id="btn-login-to-save"
                      type="button"
                      disabled={authLoading}
                      onClick={handleGoogleLogin}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border-2 border-slate-300 active:scale-[0.98] text-slate-800 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60"
                    >
                      <LogIn className="w-4 h-4 text-amber-600" />
                      <span>Google 계정으로 로그인</span>
                    </button>
                    <button
                      type="button"
                      disabled
                      className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-400 text-xs sm:text-sm font-bold cursor-not-allowed"
                      title="로그인 후 저장할 수 있습니다"
                    >
                      학습 기록 저장 (로그인 필요)
                    </button>
                  </div>
                </div>
              ) : (
                /* Case B: Logged in */
                <div className="space-y-3">
                  {/* Save Status: Success */}
                  {saveStatus === 'saved' && savedInfo && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      id="record-save-success-banner"
                      className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 space-y-2"
                    >
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <p className="font-extrabold text-sm sm:text-base text-emerald-900">
                            학습 기록이 성공적으로 저장되었습니다!
                          </p>
                          <p className="text-xs text-emerald-800">
                            나의 답변과 AI 피드백 초안이 Firestore에 안전하게 보관되었습니다.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px] text-emerald-700 font-medium">
                        <span className="bg-emerald-100/90 px-2 py-0.5 rounded-md">
                          기록 ID: {savedInfo.recordId}
                        </span>
                        <span className="bg-emerald-100/90 px-2 py-0.5 rounded-md">
                          활동: ai-literacy-01 (v1)
                        </span>
                        <span>
                          저장 시각: {savedInfo.savedAt.toLocaleTimeString()}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Save Status: Error */}
                  {saveStatus === 'error' && saveError && (
                    <div
                      id="record-save-error-banner"
                      role="alert"
                      className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs sm:text-sm space-y-2"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 font-semibold leading-snug">
                          <span>{saveError}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 pl-6">
                        작성하신 답변과 AI 피드백은 안전하게 유지되어 있으니 아래 버튼으로 다시 시도할 수 있어요.
                      </p>
                    </div>
                  )}

                  {/* Main Save / Retry Button */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      id="btn-save-learning-record"
                      type="button"
                      disabled={isSaving || saveStatus === 'saved'}
                      onClick={handleSaveLearningRecord}
                      className={`py-3 px-5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer shadow-sm ${
                        saveStatus === 'saved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-emerald-600/20'
                      } disabled:opacity-70`}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>학습 기록을 저장하고 있어요...</span>
                        </>
                      ) : saveStatus === 'saved' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>학습 기록 저장 완료</span>
                        </>
                      ) : saveStatus === 'error' ? (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>학습 기록 다시 저장하기</span>
                        </>
                      ) : (
                        <>
                          <BookmarkCheck className="w-4 h-4" />
                          <span>학습 기록 저장</span>
                        </>
                      )}
                    </button>

                    {saveStatus === 'saved' && (
                      <span className="text-xs text-slate-500 font-medium">
                        동일 답변에 대해 이미 저장이 완료되었습니다.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : isLoadingFeedback ? (
          <div className="py-8 text-center text-slate-500 space-y-2">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-amber-500" />
            <p className="text-sm font-medium text-slate-700">
              학생의 답변을 꼼꼼하게 읽고 AI 피드백 초안을 준비하고 있습니다.
            </p>
            <p className="text-xs text-slate-400">잠시만 기다려 주세요...</p>
          </div>
        ) : (
          <div className="text-xs sm:text-sm text-slate-500 font-medium py-4 text-center">
            답변을 작성한 뒤 <span className="text-amber-700 font-bold">[피드백 초안 생성]</span> 버튼을 누르면 인공지능이 분석한 피드백 초안이 이곳에 표시되며, 이후 학습 기록 저장이 가능합니다.
          </div>
        )}
      </div>
    </div>
  );
};
