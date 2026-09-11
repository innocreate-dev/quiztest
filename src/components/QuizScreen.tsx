import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '../types';
import { CheckCircle2, XCircle, Lightbulb, ArrowRight, Check, HelpCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuizScreenProps {
  question: QuizQuestion;
  currentIndex: number;
  totalQuestions: number;
  onNextQuestion: (selectedIndex: number, isCorrect: boolean) => void;
}

const CHOICE_NUMBER_SYMBOLS = ['①', '②', '③'];

export const QuizScreen: React.FC<QuizScreenProps> = ({
  question,
  currentIndex,
  totalQuestions,
  onNextQuestion,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [showNoSelectionWarning, setShowNoSelectionWarning] = useState<boolean>(false);

  // 문항 번호나 ID가 바뀔 때(또는 다시 풀기로 새 문항이 로드될 때) 선택값, 채점 여부, 경고 상태를 강제 초기화
  useEffect(() => {
    setSelectedIndex(null);
    setIsChecked(false);
    setShowNoSelectionWarning(false);
  }, [question.id, currentIndex]);

  const isCorrect = selectedIndex !== null && selectedIndex === question.correctIndex;
  const isLastQuestion = currentIndex + 1 === totalQuestions;

  const handleSelectChoice = (index: number) => {
    if (isChecked) return; // Prevent changing after checking
    setSelectedIndex(index);
    if (showNoSelectionWarning) {
      setShowNoSelectionWarning(false);
    }
  };

  const handleCheckAnswer = () => {
    if (isChecked) return; // 한 문항은 한 번만 채점
    if (selectedIndex === null) {
      setShowNoSelectionWarning(true);
      return;
    }
    setShowNoSelectionWarning(false);
    setIsChecked(true);
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    onNextQuestion(selectedIndex, isCorrect);
    // Reset local state for next question
    setSelectedIndex(null);
    setIsChecked(false);
    setShowNoSelectionWarning(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Progress & Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="bg-amber-100 text-amber-900 font-extrabold px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {totalQuestions}
          </span>
        </div>
        <div className="text-sm font-semibold text-slate-500">
          진행률 {Math.round(((currentIndex + 1) / totalQuestions) * 100)}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200/80 rounded-full h-2.5 mb-5 overflow-hidden">
        <div
          className="bg-amber-500 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Main Question Card */}
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-3xl shadow-sm border border-amber-100 p-6 sm:p-8"
      >
        {/* Question Title */}
        <div className="flex items-start gap-3 mb-6">
          <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-amber-500 text-white font-extrabold flex items-center justify-center text-base shadow-sm">
            {question.questionNumber}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug tracking-tight pt-0.5">
            {question.question}
          </h2>
        </div>

        {/* 3 Choices */}
        <div className="space-y-3 mb-4" role="radiogroup" aria-label="선택지">
          {question.choices.map((choiceText, index) => {
            const isSelected = selectedIndex === index;
            const isAnswer = isChecked && index === question.correctIndex;
            const isWrongSelected = isChecked && isSelected && !isCorrect;

            let cardStyle = "border-2 border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 bg-white text-slate-800";
            let badgeStyle = "bg-slate-100 text-slate-700";

            if (!isChecked && isSelected) {
              // 굵은 테두리와 강조 스타일
              cardStyle = "border-[3px] border-amber-500 bg-amber-50/80 text-amber-950 ring-2 ring-amber-300/50 shadow-md";
              badgeStyle = "bg-amber-500 text-white font-extrabold";
            } else if (isChecked) {
              if (isAnswer) {
                cardStyle = "border-[3px] border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400/50 shadow-sm";
                badgeStyle = "bg-emerald-600 text-white font-extrabold";
              } else if (isWrongSelected) {
                cardStyle = "border-[3px] border-rose-400 bg-rose-50 text-rose-950 ring-2 ring-rose-300/50 shadow-sm";
                badgeStyle = "bg-rose-500 text-white font-extrabold";
              } else {
                cardStyle = "border-2 border-slate-200 bg-slate-50/60 text-slate-400 opacity-60";
                badgeStyle = "bg-slate-200 text-slate-500";
              }
            }

            return (
              <button
                key={index}
                id={`choice-${question.id}-${index + 1}`}
                type="button"
                aria-checked={isSelected}
                disabled={isChecked}
                onClick={() => handleSelectChoice(index)}
                className={`w-full text-left p-4 sm:p-4.5 rounded-2xl transition-all duration-150 flex items-center gap-3.5 cursor-pointer disabled:cursor-default ${cardStyle}`}
              >
                {/* Number Badge */}
                <span className={`flex-shrink-0 w-8 h-8 rounded-xl font-bold flex items-center justify-center text-sm sm:text-base transition-colors ${badgeStyle}`}>
                  {CHOICE_NUMBER_SYMBOLS[index]}
                </span>

                {/* Choice Text */}
                <span className={`flex-1 text-base sm:text-lg leading-normal ${!isChecked && isSelected ? 'font-bold' : 'font-medium'}`}>
                  {choiceText}
                </span>

                {/* '선택됨' 문구 (정답 확인 전 선택된 경우) */}
                {!isChecked && isSelected && (
                  <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs sm:text-sm font-bold bg-amber-500 text-white px-2.5 py-1 rounded-full shadow-xs animate-in fade-in zoom-in-95">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>선택됨</span>
                  </span>
                )}

                {/* Status Indicator when checked */}
                {isChecked && isAnswer && (
                  <span className="flex-shrink-0 flex items-center gap-1 text-xs sm:text-sm font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{isSelected ? '내가 고른 정답' : '정답'}</span>
                  </span>
                )}
                {isChecked && isWrongSelected && (
                  <span className="flex-shrink-0 flex items-center gap-1 text-xs sm:text-sm font-bold bg-rose-600 text-white px-2.5 py-1 rounded-full shadow-xs">
                    <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>내가 고른 답</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Reassuring helper text before check */}
        {!isChecked && selectedIndex !== null && (
          <p className="text-xs text-slate-500 font-medium text-center mb-6">
            다른 보기를 누르면 언제든지 답을 바꿀 수 있어요.
          </p>
        )}
        {!isChecked && selectedIndex === null && (
          <p className="text-xs text-amber-800/80 font-medium text-center mb-6">
            가장 알맞은 답 하나를 골라보세요.
          </p>
        )}

        {/* Warning when trying to check without choosing an answer */}
        <AnimatePresence>
          {showNoSelectionWarning && !isChecked && (
            <motion.div
              id="warning-no-selection"
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-center font-bold text-sm sm:text-base mb-4 flex items-center justify-center gap-2 shadow-xs"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>답을 먼저 선택해 주세요.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation & Explanation Section */}
        <AnimatePresence>
          {isChecked && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.98 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-6"
            >
              {/* Correctness Banner */}
              <div
                id="feedback-banner"
                className={`p-4 rounded-2xl mb-3 flex items-center gap-3 ${
                  isCorrect
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-100 text-rose-900 border border-rose-200'
                }`}
              >
                {isCorrect ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0" />
                ) : (
                  <HelpCircle className="w-7 h-7 text-rose-600 flex-shrink-0" />
                )}
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg">
                    {isCorrect ? '정답이에요!' : '다시 생각해 볼까요?'}
                  </h3>
                  <p className="text-xs sm:text-sm font-medium mt-0.5 opacity-90">
                    {isCorrect
                      ? '수업 내용을 아주 바르게 잘 이해하고 있군요!'
                      : '정답과 해설을 읽어보고 다시 기억해 봐요.'}
                  </p>
                </div>
              </div>

              {/* Correct Answer & Explanation Box */}
              <div id="explanation-box" className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-slate-800">
                <div className="mb-2.5 pb-2.5 border-b border-amber-200/70 flex items-start gap-2">
                  <span className="flex-shrink-0 text-xs font-extrabold px-2 py-0.5 rounded bg-emerald-600 text-white">
                    정답
                  </span>
                  <span className="text-sm sm:text-base font-bold text-emerald-950">
                    {CHOICE_NUMBER_SYMBOLS[question.correctIndex]} {question.choices[question.correctIndex]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-sm text-amber-900 mb-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>해설</span>
                </div>
                <p className="text-sm sm:text-base font-medium leading-relaxed text-slate-700">
                  {question.explanation}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Button: '정답 확인' before check, '다음 문제' or '결과 보기' after check */}
        {!isChecked ? (
          <button
            id="btn-check-answer"
            type="button"
            disabled={selectedIndex === null}
            onClick={handleCheckAnswer}
            className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-lg sm:text-xl shadow-md shadow-amber-500/20 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <span>정답 확인</span>
          </button>
        ) : (
          <button
            id="btn-next-question"
            type="button"
            onClick={handleNext}
            className="w-full py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white font-bold text-lg sm:text-xl shadow-md shadow-slate-800/20 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isLastQuestion ? '결과 보기' : '다음 문제'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </motion.div>
    </div>
  );
};
