import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Lightbulb,
  HelpCircle,
  AlertCircle,
  RotateCcw,
  Loader2,
  LogIn,
  ShieldCheck,
  FileText,
  X,
  Database,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import {
  fetchUserLearningRecords,
  fetchLearningRecordDetail,
  deleteLearningRecord,
} from '../services/recordService';
import { LearningRecord } from '../types';

interface MyRecordsScreenProps {
  onBack: () => void;
  onGoToQuiz: () => void;
}

export const MyRecordsScreen: React.FC<MyRecordsScreenProps> = ({
  onBack,
  onGoToQuiz,
}) => {
  const { user, loading: authLoading, signIn } = useAuth();

  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Detail view state
  const [selectedRecord, setSelectedRecord] = useState<LearningRecord | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Delete state
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 로그아웃 시 화면에 남아 있는 모든 기록 메모리 및 UI 즉시 초기화
  useEffect(() => {
    if (!user) {
      setRecords([]);
      setSelectedRecord(null);
      setFetchError(null);
      setDetailError(null);
      setIsConfirmingDelete(false);
      setDeleteError(null);
      setNoticeMessage(null);
      return;
    }

    loadRecords(user.uid);
  }, [user]);

  const loadRecords = async (uid: string) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      // Gemini API 호출 없이 순수 Firestore에서만 조회
      const data = await fetchUserLearningRecords(uid);
      setRecords(data);
    } catch (err: any) {
      console.error('Failed to fetch user learning records:', err);
      setFetchError(
        err?.message || '학습 기록을 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 상세 보기 클릭 시: Firestore에서 상세 내용을 직접 다시 읽고 소유권 확인
  const handleOpenDetail = async (recordSummary: LearningRecord) => {
    if (!user) return;

    setIsLoadingDetail(true);
    setDetailError(null);
    setIsConfirmingDelete(false);
    setDeleteError(null);
    setSelectedRecord(recordSummary); // Fallback to current item while fetching

    try {
      // 데이터베이스에서 다시 읽으며 소유권 엄격 재검증 (Gemini API 미호출)
      const freshDetail = await fetchLearningRecordDetail(recordSummary.id, user.uid);
      setSelectedRecord(freshDetail);
    } catch (err: any) {
      console.error('Failed to fetch record detail:', err);
      setDetailError(err?.message || '상세 학습 기록을 조회하지 못했습니다.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedRecord(null);
    setDetailError(null);
    setIsConfirmingDelete(false);
    setDeleteError(null);
  };

  // 삭제 요청: 접근 단계에서 소유권 확인 후 확인 창 표시
  const handleRequestDelete = () => {
    if (!user) {
      setDeleteError('로그인이 필요한 기능입니다.');
      return;
    }
    if (!selectedRecord) return;

    // 소유권 확인
    if (selectedRecord.ownerId !== user.uid) {
      setDeleteError('자신의 학습 기록만 삭제할 수 있습니다.');
      return;
    }

    setDeleteError(null);
    setIsConfirmingDelete(true);
  };

  // 삭제 취소: 기록 유지
  const handleCancelDelete = () => {
    setIsConfirmingDelete(false);
    setDeleteError(null);
  };

  // 실제 데이터베이스 삭제 실행
  const handleDeleteRecord = async () => {
    if (!user || !selectedRecord) return;

    // 접근 단계에서 소유권 재확인
    if (selectedRecord.ownerId !== user.uid) {
      setDeleteError('자신의 학습 기록만 삭제할 수 있습니다.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      // Cloud Firestore에서 실제 삭제 수행
      await deleteLearningRecord(selectedRecord.id, user.uid);

      // 데이터베이스 삭제 성공 후 화면에서 제거
      setRecords((prev) => prev.filter((r) => r.id !== selectedRecord.id));
      setSelectedRecord(null);
      setIsConfirmingDelete(false);
      setNoticeMessage('학습 기록이 정상적으로 삭제되었습니다.');
      setTimeout(() => {
        setNoticeMessage(null);
      }, 4000);
    } catch (err: any) {
      console.error('Failed to delete learning record:', err);
      // 실패하면 오류를 안내하고 기록은 화면에 그대로 남겨둠
      setDeleteError(
        err?.message || '기록을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to format Firestore timestamp
  const formatTimestamp = (createdAt: any) => {
    if (!createdAt) return '저장 시각 정보 없음';
    let date: Date;
    if (createdAt.toDate && typeof createdAt.toDate === 'function') {
      date = createdAt.toDate();
    } else if (createdAt.seconds) {
      date = new Date(createdAt.seconds * 1000);
    } else if (createdAt instanceof Date) {
      date = createdAt;
    } else {
      date = new Date(createdAt);
    }

    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 1. 로그인되어 있지 않은 경우
  if (!user && !authLoading) {
    return (
      <div className="w-full max-w-xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl shadow-sm border border-amber-200/90 p-7 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
            <LogIn className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900">
              로그인이 필요합니다
            </h2>
            <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
              자신이 저장한 학습 기록을 조회하려면 Google 계정으로 먼저 로그인해 주세요.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => signIn()}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Google 계정으로 로그인</span>
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>돌아가기</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="my-learning-records-screen" className="w-full max-w-xl mx-auto space-y-5">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between gap-3 pb-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>퀴즈로 돌아가기</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => user && loadRecords(user.uid)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="기록 새로고침"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>
        </div>
      </div>

      {/* Notice Message if record was deleted */}
      {noticeMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{noticeMessage}</span>
        </motion.div>
      )}

      {/* Main Records Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-amber-200/90 p-6 sm:p-7 space-y-5">
        {/* Title Banner */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                내 학습 기록
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                내가 저장한 서술형 답변과 AI 피드백을 모아볼 수 있어요.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold">{user?.displayName || user?.email || '나의 기록'}</span>
          </div>
        </div>

        {/* State A: 로딩 중 */}
        {isLoading && (
          <div className="py-14 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              학습 기록을 데이터베이스에서 불러오고 있습니다...
            </p>
            <p className="text-xs text-slate-400">잠시만 기다려 주세요.</p>
          </div>
        )}

        {/* State B: 조회 실패 (Error) */}
        {!isLoading && fetchError && (
          <div
            id="records-fetch-error-box"
            role="alert"
            className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 space-y-3"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-rose-900">
                  학습 기록 조회 실패
                </h3>
                <p className="text-xs sm:text-sm text-rose-800 leading-relaxed font-medium">
                  {fetchError}
                </p>
              </div>
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => user && loadRecords(user.uid)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>다시 시도하기</span>
              </button>
            </div>
          </div>
        )}

        {/* State C: 기록이 없는 경우 (Empty State) */}
        {!isLoading && !fetchError && records.length === 0 && (
          <div
            id="records-empty-state-box"
            className="py-12 px-4 rounded-2xl bg-amber-50/60 border border-dashed border-amber-200 text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-base font-extrabold text-slate-900">
                아직 저장된 학습 기록이 없어요
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                퀴즈를 풀고 서술형 답변에 대한 AI 피드백을 받은 뒤{' '}
                <span className="font-bold text-amber-800 bg-amber-100 px-1 rounded">
                  [학습 기록 저장]
                </span>
                을 누르면 이곳에 안전하게 보관됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={onGoToQuiz}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>퀴즈 풀고 기록 남기러 가기</span>
            </button>
          </div>
        )}

        {/* State D: 정상 목록 표시 (최신순) */}
        {!isLoading && !fetchError && records.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>총 {records.length}개의 기록 (최신순)</span>
              <span>카드를 누르면 상세 내용을 확인해요</span>
            </div>

            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  onClick={() => handleOpenDetail(record)}
                  className="group p-4 sm:p-4.5 rounded-2xl bg-slate-50 hover:bg-amber-50/70 border border-slate-200/90 hover:border-amber-300 transition-all cursor-pointer space-y-2.5 active:scale-[0.99] shadow-2xs"
                >
                  {/* Timestamp & Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{formatTimestamp(record.createdAt)}</span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md">
                      활동: {record.activityId}
                    </span>
                  </div>

                  {/* Question snippet */}
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">
                    질문: {record.question}
                  </p>

                  {/* Student Answer Snippet */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200/70 text-xs sm:text-sm text-slate-700 leading-relaxed group-hover:border-amber-200 transition-colors">
                    <span className="font-bold text-slate-900 block mb-0.5 text-xs">
                      작성한 응답 일부:
                    </span>
                    <p className="line-clamp-2 text-slate-600 font-medium">
                      {record.studentAnswer}
                    </p>
                  </div>

                  {/* Card bottom hint */}
                  <div className="flex items-center justify-between text-xs text-amber-700 font-bold pt-0.5">
                    <span className="text-[11px] text-slate-400 font-normal">
                      기록 ID: {record.id.slice(0, 14)}...
                    </span>
                    <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      상세 보기 <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ──────── Record Detail Modal (상세 보기) ──────── */}
      <AnimatePresence>
        {selectedRecord && (
          <div
            id="record-detail-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-xl border border-amber-200 p-6 sm:p-7 space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      학습 기록 상세
                    </h3>
                    <p className="text-xs text-slate-500">
                      Firestore 데이터베이스에서 불러온 기록입니다.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-modal-close-icon"
                  onClick={handleCloseDetail}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Ownership & Timestamp Info */}
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>소유권 확인: 내 학습 기록 ({user?.displayName || user?.email})</span>
                  </div>
                  <span className="font-semibold text-slate-500">
                    버전: {selectedRecord.guidelineVersion}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 pt-0.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>저장 시각: {formatTimestamp(selectedRecord.createdAt)}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  문서 ID: {selectedRecord.id}
                </div>
              </div>

              {/* Detail Error if any */}
              {detailError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{detailError}</span>
                </div>
              )}

              {isLoadingDetail ? (
                <div className="py-8 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold">
                    데이터베이스에서 최신 상세 내용을 확인하는 중...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 1. 질문 */}
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md">
                      질문
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug pt-1">
                      {selectedRecord.question}
                    </h4>
                  </div>

                  {/* 2. 서술형 응답 */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-700">
                      나의 서술형 응답
                    </span>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                      {selectedRecord.studentAnswer}
                    </div>
                  </div>

                  {/* 3. AI 피드백 3단 구성 */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                        저장된 AI 피드백 초안
                      </span>
                    </div>

                    {/* 잘 이해한 점 */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-900">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>1. 잘 이해한 점</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed pl-5 font-medium">
                        {selectedRecord.feedbackDraft?.wellUnderstood || '내용 없음'}
                      </p>
                    </div>

                    {/* 더 생각할 점 */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span>2. 더 생각할 점</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed pl-5 font-medium">
                        {selectedRecord.feedbackDraft?.pointsToThink || '내용 없음'}
                      </p>
                    </div>

                    {/* 이어 생각할 질문 */}
                    <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-sky-900">
                        <HelpCircle className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span>3. 이어 생각할 질문</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed pl-5 font-medium">
                        {selectedRecord.feedbackDraft?.followUpQuestion || '내용 없음'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ──────── Delete Confirmation Section ──────── */}
              {isConfirmingDelete && (
                <div
                  id="delete-confirmation-box"
                  role="alertdialog"
                  aria-labelledby="delete-confirm-title"
                  aria-describedby="delete-confirm-desc"
                  className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 space-y-3"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 id="delete-confirm-title" className="text-sm font-extrabold text-rose-900">
                        정말 이 학습 기록을 삭제할까요?
                      </h4>
                      <p id="delete-confirm-desc" className="text-xs text-rose-700 font-medium leading-relaxed">
                        삭제된 서술형 응답과 AI 피드백은 복구할 수 없습니다. 계속 진행하시겠습니까?
                      </p>
                    </div>
                  </div>

                  {deleteError && (
                    <div className="p-2.5 rounded-xl bg-white border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{deleteError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      id="btn-cancel-delete"
                      onClick={handleCancelDelete}
                      disabled={isDeleting}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      취소
                    </button>

                    <button
                      type="button"
                      id="btn-confirm-delete"
                      onClick={handleDeleteRecord}
                      disabled={isDeleting}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>삭제 중...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>삭제하기</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ──────── Modal Footer ──────── */}
              {!isConfirmingDelete && (
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
                  {/* Delete Button (Access check: only clickable/active for the record owner) */}
                  <button
                    type="button"
                    id="btn-request-delete"
                    onClick={handleRequestDelete}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>기록 삭제</span>
                  </button>

                  <button
                    type="button"
                    id="btn-close-detail"
                    onClick={handleCloseDetail}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                  >
                    닫기
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
