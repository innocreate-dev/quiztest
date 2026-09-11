import React, { useState, useEffect } from 'react';
import { ScreenState, UserAnswerRecord, QuizQuestion } from './types';
import { QUIZ_QUESTIONS } from './data/questions';
import { loadQuizQuestions } from './services/quizService';
import { StartScreen } from './components/StartScreen';
import { QuizScreen } from './components/QuizScreen';
import { ResultScreen } from './components/ResultScreen';
import { MyRecordsScreen } from './components/MyRecordsScreen';
import {
  Sparkles,
  GraduationCap,
  Database,
  Loader2,
  LogIn,
  LogOut,
  UserCheck,
  BookOpen,
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const { user, signIn, signOut } = useAuth();
  const [screen, setScreen] = useState<ScreenState>('start');
  const [previousScreen, setPreviousScreen] = useState<ScreenState>('start');
  const [questions, setQuestions] = useState<QuizQuestion[]>(QUIZ_QUESTIONS);
  const [dataSource, setDataSource] = useState<'firestore' | 'fallback' | 'loading'>('loading');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswerRecord[]>([]);
  const [quizAttemptId, setQuizAttemptId] = useState<number>(1);

  useEffect(() => {
    let isMounted = true;
    async function fetchQuestions() {
      const result = await loadQuizQuestions();
      if (isMounted) {
        if (result.questions && result.questions.length > 0) {
          setQuestions(result.questions);
        }
        setDataSource(result.source);
      }
    }
    fetchQuestions();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartQuiz = () => {
    setQuizAttemptId((prev) => prev + 1);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setScreen('quiz');
  };

  const handleNextQuestion = (selectedIndex: number, isCorrect: boolean) => {
    const currentQ = questions[currentQuestionIndex] || questions[0];
    const newRecord: UserAnswerRecord = {
      questionId: currentQ.id,
      selectedIndex,
      isCorrect,
    };

    setUserAnswers((prev) => [...prev, newRecord]);

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setScreen('result');
    }
  };

  const handleRestart = () => {
    setQuizAttemptId((prev) => prev + 1);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setScreen('quiz');
  };

  const handleNavigateToRecords = () => {
    if (screen !== 'records') {
      setPreviousScreen(screen);
    }
    setScreen('records');
  };

  const handleBackFromRecords = () => {
    setScreen(previousScreen === 'records' ? 'start' : previousScreen);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-6 px-4 sm:px-6">
      {/* Top Navigation / Classroom Bar */}
      <header className="w-full max-w-xl mx-auto mb-6 space-y-2.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                초등학교 5~6학년
              </span>
              <p className="text-sm font-bold text-slate-800 tracking-tight">
                인공지능, 얼마나 알고 있나요?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* '내 학습 기록' Button in Header */}
            <button
              id="header-btn-records"
              type="button"
              onClick={screen === 'records' ? handleBackFromRecords : handleNavigateToRecords}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer shadow-2xs ${
                screen === 'records'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20'
                  : 'bg-white hover:bg-amber-50/80 text-amber-900 border-amber-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{screen === 'records' ? '퀴즈 화면' : '내 학습 기록'}</span>
            </button>

            {/* User Auth state chip in Header */}
            {user ? (
              <div className="flex items-center gap-1.5 text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold text-slate-700 truncate max-w-[100px]">
                  {user.displayName || user.email?.split('@')[0] || '학생'}
                </span>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="text-slate-400 hover:text-slate-700 ml-1 cursor-pointer transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => signIn()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs cursor-pointer transition-all active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-600" />
                <span>로그인</span>
              </button>
            )}

            {/* Cloud Firestore connection status badge */}
            <div
              id="firestore-status-badge"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors bg-amber-50 text-amber-800 border-amber-200"
              title={dataSource === 'firestore' ? 'Cloud Firestore에서 문항을 불러왔습니다' : '문항 데이터 준비 중'}
            >
              {dataSource === 'loading' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>문항 로딩 중</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-amber-600" />
                  <span>Firestore 연동</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200/60">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{questions.length}문항</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area with Transitions */}
      <main className="flex-1 flex items-center justify-center w-full">
        <AnimatePresence mode="wait">
          {screen === 'start' && (
            <StartScreen
              key="start"
              onStart={handleStartQuiz}
              totalQuestions={questions.length}
              onViewRecords={handleNavigateToRecords}
            />
          )}

          {screen === 'quiz' && questions.length > 0 && (
            <QuizScreen
              key={`quiz-attempt-${quizAttemptId}-q-${currentQuestionIndex}`}
              question={questions[currentQuestionIndex] || questions[0]}
              currentIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              onNextQuestion={handleNextQuestion}
            />
          )}

          {screen === 'result' && (
            <ResultScreen
              key="result"
              questions={questions}
              userAnswers={userAnswers}
              onRestart={handleRestart}
              onViewRecords={handleNavigateToRecords}
            />
          )}

          {screen === 'records' && (
            <MyRecordsScreen
              key="records"
              onBack={handleBackFromRecords}
              onGoToQuiz={handleStartQuiz}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-xl mx-auto mt-8 text-center text-xs text-slate-500 font-medium space-y-1">
        <p>초등학생을 위한 올바른 인공지능 활용 수업 퀴즈</p>
        <p className="text-[11px] text-slate-400">
          Cloud Firestore 데이터베이스 및 AI 피드백 학습 기록 보관 연동
        </p>
      </footer>
    </div>
  );
}
