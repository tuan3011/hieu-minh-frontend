import React, { useState } from 'react';
import { BrainIcon } from './components/BrainIcon';
import { IntroPage } from './pages/IntroPage';
import { QuestionPage } from './pages/QuestionPage';
import { ResultPage } from './pages/ResultPage';
import { surveyApi } from './services/api/surveyApi';
import type {
  QuestionDto,
  StartSurveyResponseDto,
  SurveyResumeResponseDto,
  SurveyResultResponseDto,
} from './types/survey';
import { storage } from './utils/storage';

type ActiveView = 'INTRO' | 'QUESTION' | 'RESULT';

const CURRENT_YEAR = new Date().getFullYear();

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ActiveView>('INTRO');
  const [token, setToken] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [initialAnswers, setInitialAnswers] = useState<Record<string, boolean>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [surveyResult, setSurveyResult] = useState<SurveyResultResponseDto | null>(null);
  const [loadingResult, setLoadingResult] = useState<boolean>(false);

  // Xử lý khi bắt đầu bài khảo sát mới thành công từ IntroPage
  const handleStartSuccess = (data: StartSurveyResponseDto) => {
    setToken(data.token);
    setAttemptId(data.attemptId);
    setQuestions(data.questions);
    setInitialAnswers({});
    setIsCompleted(false);
    setSurveyResult(null);
    setCurrentView('QUESTION');
  };

  // Xử lý khi khôi phục bài làm thành công từ IntroPage
  const handleResumeSuccess = async (data: SurveyResumeResponseDto, resumeToken: string) => {
    setToken(resumeToken);
    setAttemptId(data.attemptId);
    setQuestions(data.questions);
    setInitialAnswers(data.answers || {});

    if (data.status === 'COMPLETED') {
      setIsCompleted(true);
      // Nếu bài đã hoàn thành, tải kết quả phân tích
      setLoadingResult(true);
      try {
        const result = await surveyApi.getResult(resumeToken);
        setSurveyResult(result);
        setCurrentView('RESULT');
      } catch {
        // Fallback: nếu lỗi tải kết quả, vẫn cho vào xem lại câu hỏi đã trả lời
        setCurrentView('QUESTION');
      } finally {
        setLoadingResult(false);
      }
    } else {
      setIsCompleted(false);
      setCurrentView('QUESTION');
    }
  };

  // Xử lý khi nộp bài khảo sát thành công từ QuestionPage
  const handleSurveyComplete = (
    result: SurveyResultResponseDto,
    finalAnswers?: Record<string, boolean>
  ) => {
    setSurveyResult(result);
    if (finalAnswers) {
      setInitialAnswers(finalAnswers);
    }
    setIsCompleted(true);
    setCurrentView('RESULT');
  };

  // Xử lý khi xem kết quả bài khảo sát trước từ IntroPage
  const handleViewResultSuccess = (result: SurveyResultResponseDto, viewToken: string) => {
    setToken(viewToken);
    setSurveyResult(result);
    setIsCompleted(true);
    setCurrentView('RESULT');
  };

  // Quay về trang chủ / tạo bài khảo sát mới
  const handleResetSurvey = () => {
    storage.clearToken();
    setToken(null);
    setAttemptId(null);
    setQuestions([]);
    setInitialAnswers({});
    setIsCompleted(false);
    setSurveyResult(null);
    setCurrentView('INTRO');
  };

  return (
    <div className="app-layout">
      <nav className="navbar">
        <div className="nav-container">
          <button
            type="button"
            className="nav-logo-group"
            onClick={() => setCurrentView('INTRO')}
            title="Về trang chủ Hiểu Mình"
          >
            <div className="nav-logo-icon">
              <BrainIcon size={24} color="#526B48" />
            </div>
            <div className="nav-logo-content">
              <div className="nav-logo-text">Hiểu Mình</div>
              <div className="nav-tagline">Một chút thời gian để lắng nghe bản thân</div>
            </div>
          </button>
        </div>
      </nav>

      <main className="main-content">
        {currentView === 'INTRO' && (
          <IntroPage
            onStartSuccess={handleStartSuccess}
            onResumeSuccess={handleResumeSuccess}
            onViewResult={handleViewResultSuccess}
          />
        )}

        {currentView === 'QUESTION' && token && attemptId && (
          <QuestionPage
            token={token}
            attemptId={attemptId}
            questions={questions}
            initialAnswers={initialAnswers}
            isCompleted={isCompleted}
            onComplete={handleSurveyComplete}
            onQuit={() => setCurrentView('INTRO')}
          />
        )}

        {currentView === 'RESULT' && surveyResult && (
          <ResultPage
            token={token || ''}
            surveyResult={surveyResult}
            initialQuestions={questions}
            initialAnswers={initialAnswers}
            onNewSurvey={handleResetSurvey}
            onBackToHome={() => setCurrentView('INTRO')}
          />
        )}

        {loadingResult && (
          <div className="spinner-container">
            <div className="spinner-circle" />
            <p className="spinner-text">Đang tải kết quả bài làm...</p>
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="footer-container">
          <p>© {CURRENT_YEAR} Hiểu Mình — Trắc nghiệm tính cách Eysenck. Không gian lắng nghe bản thân an toàn và hoàn toàn ẩn danh.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
