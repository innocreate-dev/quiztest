import React from 'react';
import { Sparkles, BookOpen, BrainCircuit, ArrowRight, Award } from 'lucide-react';
import { motion } from 'motion/react';

interface StartScreenProps {
  onStart: () => void;
  totalQuestions: number;
  onViewRecords?: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  totalQuestions,
  onViewRecords,
}) => {
  return (
    <motion.div
      id="start-screen"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-xl mx-auto bg-white rounded-3xl shadow-sm border border-amber-100 p-6 sm:p-8 text-center"
    >
      {/* Decorative Badge: Target Grade */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-bold mb-5">
        <Sparkles className="w-4 h-4 text-amber-600" />
        <span>초등학교 5~6학년</span>
      </div>

      {/* Main Mascot Icon */}
      <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 mb-6 flex items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-md shadow-amber-200/50">
        <BrainCircuit className="w-14 h-14 sm:w-16 sm:h-16 text-amber-950" />
        <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow">
          <BookOpen className="w-4 h-4" />
        </span>
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mb-4">
        인공지능, 얼마나 알고 있나요?
      </h1>

      {/* Usage Guide Box as defined in TRD */}
      <div className="bg-amber-50/70 rounded-2xl p-5 sm:p-6 mb-8 text-left border border-amber-200/80 space-y-3">
        <h2 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-600" />
          <span>사용 안내</span>
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
          문제는 모두 {totalQuestions}개예요. 답을 하나 고르고 정답 확인 버튼을 누르세요. 해설을 읽은 뒤 다음 문제로 이동하세요. 한 문제당 1점이에요.
        </p>
      </div>

      {/* Start Button */}
      <div className="space-y-3">
        <button
          id="btn-quiz-start"
          onClick={onStart}
          className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-lg sm:text-xl shadow-md shadow-amber-500/20 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>시작하기</span>
          <ArrowRight className="w-6 h-6" />
        </button>

        {onViewRecords && (
          <button
            id="btn-start-view-records"
            type="button"
            onClick={onViewRecords}
            className="w-full py-3 px-4 rounded-2xl bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 text-amber-900 font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>내 학습 기록 확인하기</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};
