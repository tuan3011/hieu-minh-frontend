import React, { useState } from 'react';
import { BrainIcon, NeuronSparkleIcon, LeafBranchIcon } from '../components/BrainIcon';
import { surveyApi } from '../services/api/surveyApi';
import type { QuestionDto, SurveyResultResponseDto } from '../types/survey';

export interface QuestionPageProps {
  token: string;
  attemptId: string;
  questions: QuestionDto[];
  initialAnswers?: Record<string, boolean>;
  isCompleted?: boolean;
  onComplete: (result: SurveyResultResponseDto, finalAnswers?: Record<string, boolean>) => void;
  onQuit?: () => void;
}

interface QuestionSaveState {
  status: 'idle' | 'saving' | 'saved' | 'error';
  answerYes?: boolean;
  errorMessage?: string;
}

export const QuestionPage: React.FC<QuestionPageProps> = ({
  token,
  attemptId,
  questions,
  initialAnswers = {},
  isCompleted = false,
  onComplete,
  onQuit,
}) => {
  // Tìm câu chưa trả lời đầu tiên để người dùng tiếp tục làm bài thuận tiện nhất
  const findFirstUnansweredIndex = (): number => {
    if (!questions.length) return 0;
    const idx = questions.findIndex((q) => initialAnswers[q.id] === undefined);
    return idx === -1 ? 0 : idx;
  };

  const [currentIndex, setCurrentIndex] = useState<number>(findFirstUnansweredIndex);
  const [answers, setAnswers] = useState<Record<string, boolean>>(initialAnswers);
  const [saveStates, setSaveStates] = useState<Record<string, QuestionSaveState>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isNavigatorCollapsed, setIsNavigatorCollapsed] = useState<boolean>(false);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const isAllAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  const currentSaveState: QuestionSaveState = currentQuestion
    ? saveStates[currentQuestion.id] || { status: 'idle' }
    : { status: 'idle' };

  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isSavingThis = currentSaveState.status === 'saving';

  // Xử lý khi chọn "Có" hoặc "Không"
  const handleSelectAnswer = async (answerYes: boolean) => {
    if (isCompleted || !currentQuestion) return;

    const questionId = currentQuestion.id;
    const state = saveStates[questionId];

    // Chống bấm liên tục khi request đang bay (in-flight)
    if (state?.status === 'saving') return;

    // Nếu đã chọn đáp án này rồi và không có lỗi, không cần gửi lại request
    if (answers[questionId] === answerYes && state?.status !== 'error') return;

    // Đặt trạng thái đang lưu cho câu hỏi này
    setSaveStates((prev) => ({
      ...prev,
      [questionId]: { status: 'saving', answerYes },
    }));

    try {
      await surveyApi.saveAnswer(token, { questionId, answerYes });

      // Cập nhật đáp án đã lưu thành công
      setAnswers((prev) => ({
        ...prev,
        [questionId]: answerYes,
      }));

      setSaveStates((prev) => ({
        ...prev,
        [questionId]: { status: 'saved', answerYes },
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Có vẻ kết nối chưa ổn định. Hãy thử lưu lại nhé.';
      setSaveStates((prev) => ({
        ...prev,
        [questionId]: { status: 'error', answerYes, errorMessage: message },
      }));
    }
  };

  // Thử lại khi lưu thất bại
  const handleRetrySave = () => {
    if (!currentQuestion) return;
    const questionId = currentQuestion.id;
    const state = saveStates[questionId];
    if (state?.status === 'error' && state.answerYes !== undefined) {
      handleSelectAnswer(state.answerYes);
    }
  };

  // Điều hướng câu trước
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Điều hướng câu sau
  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Nhảy tới câu hỏi cụ thể qua bảng số
  const handleJumpTo = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentIndex(index);
    }
  };

  // Mở modal xác nhận nộp bài
  const handleOpenSubmitModal = () => {
    if (!isAllAnswered || isSubmitting || isCompleted) return;
    setSubmitError(null);
    setShowConfirmModal(true);
  };

  // Đóng modal xác nhận
  const handleCloseSubmitModal = () => {
    if (isSubmitting) return;
    setShowConfirmModal(false);
  };

  // Thực hiện nộp bài và nhận kết quả
  const handleConfirmSubmit = async () => {
    if (isSubmitting || !isAllAnswered || isCompleted) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await surveyApi.completeSurvey(token);
      setShowConfirmModal(false);
      onComplete(result, answers);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Nộp bài khảo sát thất bại';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="empty-survey-container">
        <h2>Không tìm thấy dữ liệu câu hỏi</h2>
        <p>Vui lòng thử tải lại hoặc bắt đầu một phiên khảo sát mới.</p>
        {onQuit && (
          <button type="button" className="btn-secondary" onClick={onQuit}>
            Quay lại trang chủ
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="survey-page-container">
      {/* Header & Thông tin tiến độ hành trình */}
      <header className="survey-header">
        <div className="survey-header-top">
          <div className="survey-meta">
            <span className="survey-badge">
              {isCompleted ? 'Khảo sát đã hoàn thành' : 'Đang làm bài'}
            </span>
            <span className="survey-attempt-id" title={attemptId}>
              Mã bài: {attemptId.substring(0, 8)}...
            </span>
          </div>

          {onQuit && (
            <button
              type="button"
              className="btn-quit"
              onClick={onQuit}
              title="Rời khỏi trang làm bài (Tiến độ vẫn được lưu tự động)"
            >
              Về trang chủ
            </button>
          )}
        </div>

        {/* Khối tiến độ hành trình (Calm Progress) */}
        <div className="progress-section">
          <div className="progress-labels">
            <span className="progress-journey-title">
              Tiến độ: <strong>{answeredCount}</strong> / {totalQuestions} câu
            </span>
            <span className="progress-percent">{progressPercent}%</span>
          </div>

          <div
            className="progress-bar-bg"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Tiến độ làm bài khảo sát"
          >
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>

          <p className="calm-quote">
            <NeuronSparkleIcon size={15} color="#526B48" />
            Cứ trả lời theo cảm nhận tự nhiên nhất của bạn. Không có câu trả lời đúng hay sai.
          </p>
        </div>
      </header>

      {/* Thông báo lỗi nếu nộp bài thất bại (khi modal đóng) */}
      {submitError && !showConfirmModal && (
        <div className="survey-alert survey-alert-error" role="alert">
          <strong>Lỗi nộp bài:</strong> {submitError}
        </div>
      )}

      {/* Cảnh báo chế độ chỉ đọc nếu bài đã hoàn thành */}
      {isCompleted && (
        <div className="survey-alert survey-alert-info" role="status">
          ℹ️ Bài khảo sát này đã được hoàn thành. Các câu trả lời ở chế độ chỉ đọc và không thể chỉnh sửa.
        </div>
      )}

      {/* Thẻ hiển thị câu hỏi chính (Main Question Card) */}
      <main className="question-card" aria-live="polite">
        <div className="question-card-header">
          <div className="question-pill-container">
            <span className="question-number-badge">
              Câu {currentIndex + 1} / {totalQuestions}
            </span>
          </div>

          {/* Trạng thái lưu câu trả lời */}
          <div className="save-status-indicator" aria-live="assertive">
            {isSavingThis && (
              <span className="status-saving">
                <span className="inline-spinner" /> Đang lưu...
              </span>
            )}
            {!isSavingThis && currentSaveState.status === 'saved' && (
              <span className="status-saved">✓ Đã lưu</span>
            )}
            {!isSavingThis && currentSaveState.status === 'error' && (
              <span className="status-error">⚠️ Lưu thất bại</span>
            )}
          </div>
        </div>

        {/* Thông báo lỗi lưu câu trả lời kèm nút Thử lại */}
        {currentSaveState.status === 'error' && (
          <div className="save-error-box" role="alert">
            <p className="save-error-text">
              {currentSaveState.errorMessage || 'Có vẻ kết nối chưa ổn định. Hãy thử lưu lại nhé.'}
            </p>
            <button
              type="button"
              className="btn-retry-save"
              onClick={handleRetrySave}
              disabled={isSavingThis}
            >
              Thử lại
            </button>
          </div>
        )}

        <div className="question-content">
          <p className="question-text">{currentQuestion.content}</p>
        </div>

        {/* Hai lựa chọn Có và Không (Độ nổi bật tương đương, Calm & Cozy) */}
        <div className="options-container">
          <button
            type="button"
            className={`option-btn option-yes ${
              currentAnswer === true ||
              (isSavingThis && currentSaveState.answerYes === true)
                ? 'active'
                : ''
            }`}
            onClick={() => handleSelectAnswer(true)}
            disabled={isCompleted || isSavingThis}
            aria-pressed={currentAnswer === true}
          >
            <div className="option-icon-wrapper">
              <span className="option-icon">🌿</span>
            </div>
            <span className="option-label">Có</span>
            {currentAnswer === true && <span className="option-check-badge">✓ Đã chọn</span>}
          </button>

          <button
            type="button"
            className={`option-btn option-no ${
              currentAnswer === false ||
              (isSavingThis && currentSaveState.answerYes === false)
                ? 'active'
                : ''
            }`}
            onClick={() => handleSelectAnswer(false)}
            disabled={isCompleted || isSavingThis}
            aria-pressed={currentAnswer === false}
          >
            <div className="option-icon-wrapper">
              <span className="option-icon">🍂</span>
            </div>
            <span className="option-label">Không</span>
            {currentAnswer === false && <span className="option-check-badge">✓ Đã chọn</span>}
          </button>
        </div>
      </main>

      {/* Thanh điều hướng câu trước / câu sau / nộp bài */}
      <div className="navigation-actions">
        <button
          type="button"
          className="btn-secondary nav-btn"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          ← Câu trước
        </button>

        {!isCompleted && (
          <button
            type="button"
            className={`btn-primary submit-survey-btn ${
              isAllAnswered ? 'ready-to-submit' : 'btn-disabled-hint'
            }`}
            onClick={handleOpenSubmitModal}
            disabled={!isAllAnswered || isSubmitting}
            title={
              !isAllAnswered
                ? `Còn ${totalQuestions - answeredCount} câu chưa hoàn thành`
                : 'Sẵn sàng nộp bài và xem kết quả phân tích tâm lý'
            }
          >
            {isAllAnswered ? (
              <span className="submit-btn-inner">
                <span className="submit-btn-text">Nộp bài và xem kết quả</span>
                <span className="submit-btn-leaf" aria-hidden="true">
                  <LeafBranchIcon size={17} color="#FFFFFF" />
                </span>
              </span>
            ) : (
              `Còn ${totalQuestions - answeredCount} câu chưa xong`
            )}
          </button>
        )}

        <button
          type="button"
          className="btn-primary nav-btn"
          onClick={handleNext}
          disabled={currentIndex === totalQuestions - 1}
        >
          Câu sau →
        </button>
      </div>

      {/* Bảng số 1-57 câu hỏi (Question Navigator) */}
      <section className="navigator-section" aria-label="Bảng chuyển câu hỏi nhanh">
        <div className="navigator-header">
          <div className="navigator-title-row">
            <h3 className="navigator-title">Danh sách 57 câu hỏi</h3>
            <button
              type="button"
              className="btn-toggle-navigator"
              onClick={() => setIsNavigatorCollapsed((prev) => !prev)}
              aria-expanded={!isNavigatorCollapsed}
              title="Đóng / mở danh sách câu hỏi"
            >
              {isNavigatorCollapsed ? 'Mở rộng ▾' : 'Thu gọn ▴'}
            </button>
          </div>

          <div className="navigator-legend">
            <span className="legend-item">
              <span className="legend-dot dot-current" /> Đang xem
            </span>
            <span className="legend-item">
              <span className="legend-dot dot-answered" /> Đã trả lời
            </span>
            <span className="legend-item">
              <span className="legend-dot dot-unanswered" /> Chưa trả lời
            </span>
          </div>
        </div>

        {!isNavigatorCollapsed && (
          <div className="navigator-grid">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered = answers[q.id] !== undefined;

              let itemClass = 'nav-grid-item';
              if (isCurrent) itemClass += ' current';
              if (isAnswered) itemClass += ' answered';
              if (!isAnswered && !isCurrent) itemClass += ' unanswered';

              return (
                <button
                  key={q.id}
                  type="button"
                  className={itemClass}
                  onClick={() => handleJumpTo(idx)}
                  aria-label={`Câu hỏi ${idx + 1}: ${isAnswered ? 'Đã trả lời' : 'Chưa trả lời'}${
                    isCurrent ? ' (Đang xem)' : ''
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal xác nhận nộp bài (Calm & Friendly Confirmation Dialog) */}
      {showConfirmModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-card">
            <div className="modal-icon-badge">
              <BrainIcon size={28} color="#526B48" />
            </div>

            <h3 id="modal-title" className="modal-title">
              Xác nhận nộp bài khảo sát?
            </h3>

            <p className="modal-body">
              Bạn đã hoàn thành đầy đủ <strong>{totalQuestions}/{totalQuestions} câu hỏi</strong>.
              Sẵn sàng xem kết quả của mình chưa? Cứ thong thả nhé. Sau khi nộp, bạn sẽ <strong>không thể chỉnh sửa</strong> lại các câu trả lời.
            </p>

            {submitError && (
              <div className="survey-alert survey-alert-error" role="alert">
                {submitError}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCloseSubmitModal}
                disabled={isSubmitting}
              >
                Xem lại bài làm
              </button>
              <button
                type="button"
                className="btn-primary btn-confirm-submit"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang phân tích...' : 'Xác nhận nộp bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
