import React, { useState } from 'react';
import { QuizQuestion, UserAnswerRecord } from '../types';
import { RotateCcw, Trophy, CheckCircle2, XCircle, Sparkles, ClipboardList, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DescriptiveFeedbackSection } from './DescriptiveFeedbackSection';

interface ResultScreenProps {
  questions: QuizQuestion[];
  userAnswers: UserAnswerRecord[];
  onRestart: () => void;
  onViewRecords?: () => void;
}

const CHOICE_NUMBER_SYMBOLS = ['①', '②', '③'];

export const ResultScreen: React.FC<ResultScreenProps> = ({
  questions,
  userAnswers,
  onRestart,
  onViewRecords,
}) => {
  const [showHistoryTable, setShowHistoryTable] = useState<boolean>(false);
  const totalCount = questions.length;
  const correctCount = userAnswers.filter((a) => a.isCorrect).length;

  // Custom encouraging messages for elementary students
  const getFeedbackMessage = () => {
    if (correctCount === totalCount) {
      return {
        badge: '완벽해요! 만점 달성 💯',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        title: '최고예요! 수업 내용을 완벽히 이해했어요!',
        sub: '인공지능을 안전하고 바르게 사용하는 멋진 어린이에요. 🎉',
      };
    }
    if (correctCount >= 2) {
      return {
        badge: '참 잘했어요! 🌟',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        title: '대단해요! 아주 훌륭하게 풀었어요!',
        sub: '틀린 문제의 해설을 다시 읽어보면 다음엔 100점을 받을 수 있어요! 👍',
      };
    }
    return {
      badge: '수고했어요! 🌱',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
      title: '열심히 도전한 친구 멋져요!',
      sub: '‘다시 풀기’를 눌러서 한 번 더 복습해 볼까요? 화이팅! 💪',
    };
  };

  const feedback = getFeedbackMessage();

  return (
    <motion.div
      id="result-screen"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-xl mx-auto space-y-6"
    >
      {/* Score Summary Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-6 sm:p-8 text-center">
        {/* Badge */}
        <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-sm font-bold mb-4 ${feedback.badgeColor}`}>
          <Sparkles className="w-4 h-4" />
          <span>{feedback.badge}</span>
        </div>

        {/* Mascot / Trophy Icon */}
        <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-4 flex items-center justify-center rounded-3xl bg-amber-50 text-amber-500 border border-amber-200">
          <Trophy className="w-12 h-12 sm:w-14 sm:h-14 text-amber-500" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-2">
          퀴즈 결과
        </h1>

        {/* Big Score Display */}
        <div className="my-5 p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
          <p className="text-sm font-bold text-slate-600 mb-1">최종 결과</p>
          <div className="flex items-baseline justify-center gap-1.5 mb-2">
            <span className="text-4xl sm:text-5xl font-extrabold text-amber-600">
              {correctCount}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-slate-600 mr-1">
              점
            </span>
            <span className="text-sm font-semibold text-slate-400">
              (총 {totalCount}점 만점)
            </span>
          </div>
          <div className="inline-block px-4 py-2 rounded-xl bg-white border border-amber-200 shadow-xs">
            <p className="text-base sm:text-lg font-extrabold text-slate-800">
              {totalCount}문항 중 {correctCount}문항 정답, {correctCount}점
            </p>
          </div>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">
          {feedback.title}
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
          {feedback.sub}
        </p>

        {/* Action Buttons: '응답 내역 확인' & '다시 풀기' */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            id="btn-view-history"
            type="button"
            onClick={() => setShowHistoryTable((prev) => !prev)}
            className="flex-1 py-3.5 px-5 rounded-2xl border-2 border-amber-300 hover:bg-amber-50 active:scale-[0.98] text-amber-900 font-bold text-base sm:text-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer bg-white"
          >
            <ClipboardList className="w-5 h-5 text-amber-600" />
            <span>응답 내역 확인</span>
            {showHistoryTable ? (
              <ChevronUp className="w-4 h-4 text-amber-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-amber-600" />
            )}
          </button>

          <button
            id="btn-restart-quiz"
            type="button"
            onClick={onRestart}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-base sm:text-lg shadow-md shadow-amber-500/20 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>다시 풀기</span>
          </button>
        </div>

        {onViewRecords && (
          <div className="mt-3">
            <button
              id="btn-result-view-records"
              type="button"
              onClick={onViewRecords}
              className="w-full py-3 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>내 저장된 학습 기록 모아보기</span>
            </button>
          </div>
        )}
      </div>

      {/* Response History Table Section (표) */}
      <AnimatePresence>
        {showHistoryTable && (
          <motion.div
            id="response-history-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-3xl shadow-sm border border-amber-200 p-5 sm:p-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    현재 실행의 응답 내역
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  ※ 새로고침하면 응답이 초기화됩니다.
                </span>
              </div>

              {/* Responsive Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-amber-50/80 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-3 px-3 sm:px-4 whitespace-nowrap text-center w-16">
                        문항 번호
                      </th>
                      <th className="py-3 px-3 sm:px-4 min-w-[140px]">
                        문항 내용
                      </th>
                      <th className="py-3 px-3 sm:px-4 min-w-[130px]">
                        실제 선택한 답
                      </th>
                      <th className="py-3 px-3 sm:px-4 min-w-[130px]">
                        정답
                      </th>
                      <th className="py-3 px-3 sm:px-4 whitespace-nowrap text-center w-20">
                        정답 여부
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {questions.map((q) => {
                      const record = userAnswers.find((a) => a.questionId === q.id);
                      const isQCorrect = record?.isCorrect;
                      const selectedIdx = record?.selectedIndex;

                      const selectedAnswerText =
                        selectedIdx !== undefined && selectedIdx !== null
                          ? `${CHOICE_NUMBER_SYMBOLS[selectedIdx]} ${q.choices[selectedIdx]}`
                          : '-';

                      const correctAnswerText = `${CHOICE_NUMBER_SYMBOLS[q.correctIndex]} ${q.choices[q.correctIndex]}`;

                      return (
                        <tr
                          key={q.id}
                          className={isQCorrect ? 'bg-white' : 'bg-rose-50/30'}
                        >
                          {/* 문항 번호 */}
                          <td className="py-3 px-3 sm:px-4 text-center font-bold text-slate-800 whitespace-nowrap">
                            {q.questionNumber}번
                          </td>

                          {/* 문항 내용 */}
                          <td className="py-3 px-3 sm:px-4 text-slate-800 font-semibold leading-snug">
                            {q.question}
                          </td>

                          {/* 실제 선택한 답 */}
                          <td className="py-3 px-3 sm:px-4 leading-snug">
                            <span
                              className={
                                isQCorrect
                                  ? 'text-emerald-800 font-bold'
                                  : 'text-rose-700 font-medium'
                              }
                            >
                              {selectedAnswerText}
                            </span>
                          </td>

                          {/* 정답 */}
                          <td className="py-3 px-3 sm:px-4 text-slate-900 font-bold leading-snug">
                            {correctAnswerText}
                          </td>

                          {/* 정답 여부 */}
                          <td className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">
                            {isQCorrect ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>정답</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <XCircle className="w-3 h-3" />
                                <span>오답</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Review Section (문항별 정답 여부와 해설) */}
      <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-6 sm:p-7">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span>문항별 확인하기</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            총 {totalCount}문제
          </span>
        </h2>

        <div className="space-y-4">
          {questions.map((q) => {
            const answerRecord = userAnswers.find((a) => a.questionId === q.id);
            const isQCorrect = answerRecord?.isCorrect;
            const chosenIdx = answerRecord?.selectedIndex;

            return (
              <div
                key={q.id}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/60"
              >
                {/* Header with question number and result status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
                    {q.questionNumber}번 문제
                  </span>
                  {isQCorrect ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>정답</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>오답</span>
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <h3 className="text-base font-bold text-slate-900 mb-3 leading-snug">
                  {q.question}
                </h3>

                {/* Choices summary */}
                <div className="space-y-1.5 text-sm mb-3">
                  {q.choices.map((choiceText, cIdx) => {
                    const isCorrectAnswer = cIdx === q.correctIndex;
                    const isMyChoice = cIdx === chosenIdx;

                    let rowStyle = 'text-slate-600 bg-white border-slate-200';
                    if (isCorrectAnswer) {
                      rowStyle = 'text-emerald-900 bg-emerald-50 border-emerald-300 font-bold';
                    } else if (isMyChoice && !isCorrectAnswer) {
                      rowStyle = 'text-rose-900 bg-rose-50 border-rose-300 line-through opacity-80';
                    }

                    return (
                      <div
                        key={cIdx}
                        className={`px-3 py-2 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${rowStyle}`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{CHOICE_NUMBER_SYMBOLS[cIdx]}</span>
                          <span>{choiceText}</span>
                        </div>
                        {isCorrectAnswer && (
                          <span className="text-xs font-bold text-emerald-700">
                            (정답)
                          </span>
                        )}
                        {!isCorrectAnswer && isMyChoice && (
                          <span className="text-xs font-bold text-rose-700">
                            (내가 고른 답)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="text-xs sm:text-sm text-slate-700 bg-amber-50 p-3 rounded-xl border border-amber-100 leading-relaxed">
                  <span className="font-bold text-amber-900">💡 해설: </span>
                  <span>{q.explanation}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Descriptive Answer and AI Feedback Section */}
      <DescriptiveFeedbackSection />
    </motion.div>
  );
};

