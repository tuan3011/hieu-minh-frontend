import React, { useState } from 'react';
import { ErrorAlert } from '../components/ErrorAlert';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { surveyApi } from '../services/api/surveyApi';
import type { QuestionDto, SurveyResultResponseDto, Temperament } from '../types/survey';
import phlegmaticImg from '../assets/temperaments/phlegmatic.jpg';
import melancholicImg from '../assets/temperaments/melancholic.jpg';
import cholericImg from '../assets/temperaments/choleric.jpg';
import sanguineImg from '../assets/temperaments/sanguine.jpg';

const TEMPERAMENT_INFOGRAPHICS: Record<Temperament, { src: string; alt: string }> = {
  PHLEGMATIC: {
    src: phlegmaticImg,
    alt: 'Infographic chi tiết Khí chất Bình thản (Phlegmatic)',
  },
  MELANCHOLIC: {
    src: melancholicImg,
    alt: 'Infographic chi tiết Khí chất Ưu tư (Melancholic)',
  },
  CHOLERIC: {
    src: cholericImg,
    alt: 'Infographic chi tiết Khí chất Nóng nảy (Choleric)',
  },
  SANGUINE: {
    src: sanguineImg,
    alt: 'Infographic chi tiết Khí chất Hoạt bát (Sanguine)',
  },
};

export interface ResultPageProps {
  token: string;
  surveyResult: SurveyResultResponseDto;
  initialQuestions?: QuestionDto[];
  initialAnswers?: Record<string, boolean>;
  onNewSurvey: () => void;
  onBackToHome?: () => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({
  token,
  surveyResult,
  initialQuestions = [],
  initialAnswers = {},
  onNewSurvey,
}) => {
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [fetchedData, setFetchedData] = useState<{
    questions: QuestionDto[];
    answers: Record<string, boolean>;
  } | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  // Ưu tiên dữ liệu đã fetch từ backend; nếu chưa fetch thì dùng initial từ props
  const questions = fetchedData ? fetchedData.questions : initialQuestions;
  const answers = fetchedData ? fetchedData.answers : initialAnswers;
  const hasCompleteData =
    fetchedData !== null || (initialQuestions.length > 0 && Object.keys(initialAnswers).length > 0);

  // Tải danh sách câu hỏi và các đáp án thực tế đã lưu qua API resume
  const fetchQuestionsAndAnswers = async () => {
    if (!token || loadingQuestions) return;

    setLoadingQuestions(true);
    setQuestionsError(null);

    try {
      const resumeData = await surveyApi.resumeSurvey(token);
      setFetchedData({
        questions: resumeData.questions || [],
        answers: resumeData.answers || {},
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách câu hỏi đã trả lời';
      setQuestionsError(msg);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const toggleReviewSection = () => {
    const nextOpen = !isReviewOpen;
    setIsReviewOpen(nextOpen);

    // Khi người dùng mở phần câu hỏi và chưa có dữ liệu đầy đủ -> tự động kích hoạt tải
    if (nextOpen && !hasCompleteData) {
      fetchQuestionsAndAnswers();
    }
  };

  // Đảm bảo sắp xếp câu hỏi theo thứ tự số câu tăng dần (1 -> 57)
  const sortedQuestions = [...questions].sort((a, b) => a.questionNo - b.questionNo);

  // Chuẩn hóa tiêu đề khí chất, loại bỏ từ "Khí chất " thừa nếu backend trả về
  const cleanedTemperamentName = surveyResult.temperamentNameVi.replace(/^khí chất\s+/i, '');

  // Diễn giải điểm số theo ngưỡng Eysenck đã quy định
  const extraversionLabel = surveyResult.scoreA <= 12 ? 'Hướng nội' : 'Hướng ngoại';
  const neuroticismLabel = surveyResult.scoreB <= 12 ? 'Thần kinh ổn định' : 'Thần kinh không ổn định';
  const lieScaleLabel = surveyResult.scoreC <= 4 ? 'Đáng tin' : 'Không đáng tin';

  // Lấy ảnh infographic theo kết quả khí chất từ backend
  const currentInfographic = surveyResult.temperament
    ? TEMPERAMENT_INFOGRAPHICS[surveyResult.temperament]
    : undefined;

  return (
    <div className="result-view-container">
      {/* 1. Tiêu đề kết quả khí chất */}
      <header className="result-header">
        <span className="badge">Kết Quả Phân Tích Tâm Lý</span>
        <h1 className="title">
          Khí Chất: {cleanedTemperamentName}
        </h1>
      </header>

      {/* 2. Ba thẻ kết quả Extraversion, Neuroticism và Lie Scale */}
      <div className="scores-grid">
        <div className="score-card">
          <h3>Extraversion</h3>
          <p className="score-classification">{extraversionLabel}</p>
        </div>

        <div className="score-card">
          <h3>Neuroticism</h3>
          <p className="score-classification">{neuroticismLabel}</p>
        </div>

        <div className="score-card">
          <h3>Lie Scale</h3>
          <p className="score-classification">{lieScaleLabel}</p>
        </div>
      </div>

      {/* 3. Infographic chi tiết của nhóm khí chất tương ứng */}
      <section
        className="temperament-infographic-section"
        aria-label="Infographic chi tiết khí chất"
      >
        {currentInfographic ? (
          <div className="infographic-card">
            <img
              src={currentInfographic.src}
              alt={currentInfographic.alt}
              className="infographic-image"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="infographic-fallback" role="status">
            <p>Không có hình ảnh infographic phù hợp cho nhóm khí chất này.</p>
          </div>
        )}

        {surveyResult.reliabilityStatus && (
          <p className="reliability-note">
            <strong>Độ tin cậy bài làm:</strong> {surveyResult.reliabilityStatus}
          </p>
        )}
      </section>

      {/* Phần: Các câu hỏi đã trả lời (Collapsible / Expandable) */}
      <section
        className="answered-questions-section"
        aria-label="Các câu hỏi đã trả lời"
      >
        <div className="answered-section-header">
          <div className="answered-section-title-group">
            <h3 className="answered-section-title">Các câu hỏi đã trả lời</h3>
          </div>
          <button
            type="button"
            className="btn-toggle-answered"
            onClick={toggleReviewSection}
            aria-expanded={isReviewOpen}
            aria-controls="answered-questions-content"
          >
            {isReviewOpen ? 'Thu gọn ▲' : 'Xem chi tiết ▼'}
          </button>
        </div>

        {isReviewOpen && (
          <div id="answered-questions-content" className="answered-questions-content">
            {loadingQuestions && (
              <div className="answered-loading-wrapper">
                <LoadingSpinner message="Đang tải danh sách câu hỏi đã trả lời..." />
              </div>
            )}

            {questionsError && !loadingQuestions && (
              <div className="answered-error-wrapper">
                <ErrorAlert
                  title="Không thể tải câu hỏi đã trả lời"
                  message={questionsError}
                  onRetry={fetchQuestionsAndAnswers}
                />
              </div>
            )}

            {!loadingQuestions && !questionsError && sortedQuestions.length === 0 && (
              <div className="answered-empty-state" role="status">
                <p>Chưa có dữ liệu câu hỏi cho bài khảo sát này.</p>
              </div>
            )}

            {!loadingQuestions && !questionsError && sortedQuestions.length > 0 && (
              <ul className="answered-questions-list" aria-label="Danh sách câu hỏi đã trả lời">
                {sortedQuestions.map((q) => {
                  const answerVal = answers[q.id];
                  const hasAnswer = answerVal !== undefined;

                  return (
                    <li
                      key={q.id}
                      className={`answered-question-item ${hasAnswer ? 'has-answer' : 'unanswered'}`}
                    >
                      <div className="question-info">
                        <span className="question-number-tag">
                          Câu {q.questionNo}
                        </span>
                        <p className="question-content-text">{q.content}</p>
                      </div>

                      {/* Lựa chọn câu trả lời chỉ đọc (read-only) */}
                      <div className="answer-badge-container">
                        {hasAnswer ? (
                          <span
                            className={`answer-choice-badge ${answerVal ? 'badge-yes' : 'badge-no'}`}
                            aria-label={`Câu trả lời: ${answerVal ? 'Có' : 'Không'}`}
                          >
                            {answerVal ? '✓ Có' : '✗ Không'}
                          </span>
                        ) : (
                          <span className="answer-choice-badge badge-unanswered">
                            Chưa trả lời
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Các nút hành động phía dưới */}
      <div className="result-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={onNewSurvey}
        >
          Làm bài khảo sát mới
        </button>
      </div>
    </div>
  );
};

export default ResultPage;
