import React, { useState, useEffect } from 'react';
import { BrainIcon } from '../components/BrainIcon';
import { ErrorAlert } from '../components/ErrorAlert';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { surveyApi } from '../services/api/surveyApi';
import type {
  StartSurveyResponseDto,
  SurveyResumeResponseDto,
  SurveyResultResponseDto,
} from '../types/survey';
import { storage } from '../utils/storage';

export type SessionStatus = 'CHECKING' | 'NO_SURVEY' | 'IN_PROGRESS' | 'COMPLETED';

export interface IntroPageProps {
  onStartSuccess?: (data: StartSurveyResponseDto) => void;
  onResumeSuccess?: (data: SurveyResumeResponseDto, token: string) => void;
  onViewResult?: (result: SurveyResultResponseDto, token: string) => void;
}

export const IntroPage: React.FC<IntroPageProps> = ({
  onStartSuccess,
  onResumeSuccess,
  onViewResult,
}) => {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(() => {
    return storage.getToken() ? 'CHECKING' : 'NO_SURVEY';
  });
  const [existingToken, setExistingToken] = useState<string | null>(() => storage.getToken());
  const [resumeData, setResumeData] = useState<SurveyResumeResponseDto | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Modal xác nhận xóa phiên cũ
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Modal xác nhận khi còn bài làm dở IN_PROGRESS mà người dùng muốn bắt đầu bài mới
  const [showInProgressModal, setShowInProgressModal] = useState<boolean>(false);
  const [isStartingNew, setIsStartingNew] = useState<boolean>(false);
  const [inProgressModalError, setInProgressModalError] = useState<string | null>(null);

  // Xác minh trạng thái thực tế của phiên làm bài qua API resume khi mount
  useEffect(() => {
    let isMounted = true;

    const verifyExistingSession = async () => {
      const token = storage.getToken();
      if (!token) {
        if (isMounted) {
          setSessionStatus('NO_SURVEY');
          setExistingToken(null);
          setResumeData(null);
        }
        return;
      }

      setSessionStatus('CHECKING');
      try {
        const data = await surveyApi.resumeSurvey(token);
        if (!isMounted) return;

        setExistingToken(token);
        setResumeData(data);
        if (data.status === 'COMPLETED') {
          setSessionStatus('COMPLETED');
        } else {
          setSessionStatus('IN_PROGRESS');
        }
      } catch {
        if (!isMounted) return;
        // Token không hợp lệ, không tồn tại hoặc đã hết hạn: xóa token và reset về NO_SURVEY
        storage.clearToken();
        setExistingToken(null);
        setResumeData(null);
        setSessionStatus('NO_SURVEY');
        setNotice('Phiên làm bài trước đã hết hạn hoặc không tồn tại. Bạn hãy bắt đầu bài mới nhé.');
      }
    };

    verifyExistingSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Hỗ trợ đóng popup bằng phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showInProgressModal && !isStartingNew) {
          setShowInProgressModal(false);
          setInProgressModalError(null);
        } else if (showDeleteModal && !isDeleting) {
          setShowDeleteModal(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showInProgressModal, isStartingNew, showDeleteModal, isDeleting]);

  // Tạo một bài khảo sát hoàn toàn mới qua API startSurvey
  const createNewSurvey = async () => {
    setLoading(true);
    setIsStartingNew(true);
    setError(null);
    setInProgressModalError(null);
    setNotice(null);

    try {
      const data = await surveyApi.startSurvey();
      // Cập nhật token mới và trạng thái mới
      storage.setToken(data.token);
      setExistingToken(data.token);
      setSessionStatus('IN_PROGRESS');
      setResumeData(null);
      setShowInProgressModal(false);

      if (onStartSuccess) {
        onStartSuccess(data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể khởi tạo bài khảo sát mới';
      setError(msg);
      setInProgressModalError(msg);
      // Giữ nguyên dữ liệu cũ nếu lỗi
    } finally {
      setLoading(false);
      setIsStartingNew(false);
    }
  };

  // Khôi phục bài làm dở dang (IN_PROGRESS)
  const continueExistingSurvey = async () => {
    if (!existingToken) return;

    setLoading(true);
    setError(null);
    setNotice(null);

    // Nếu đã có sẵn resumeData từ lúc verify ban đầu, dùng ngay
    if (resumeData && resumeData.status === 'IN_PROGRESS') {
      setShowInProgressModal(false);
      setLoading(false);
      if (onResumeSuccess) {
        onResumeSuccess(resumeData, existingToken);
      }
      return;
    }

    try {
      const data = await surveyApi.resumeSurvey(existingToken);
      setResumeData(data);
      setShowInProgressModal(false);
      if (onResumeSuccess) {
        onResumeSuccess(data, existingToken);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể khôi phục bài làm';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Xem kết quả của bài đã hoàn thành (COMPLETED)
  const viewCompletedResult = async () => {
    if (!existingToken) return;

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const result = await surveyApi.getResult(existingToken);
      if (onViewResult) {
        onViewResult(result, existingToken);
      } else if (onResumeSuccess && resumeData) {
        // Fallback: nếu không có onViewResult, gọi onResumeSuccess (App.tsx sẽ tự xử lý COMPLETED)
        onResumeSuccess(resumeData, existingToken);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải kết quả bài làm trước';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi nhấn nút hành động chính
  const handleMainActionClick = async () => {
    setError(null);
    setNotice(null);

    if (sessionStatus === 'NO_SURVEY') {
      await createNewSurvey();
    } else if (sessionStatus === 'IN_PROGRESS') {
      await continueExistingSurvey();
    } else if (sessionStatus === 'COMPLETED') {
      await viewCompletedResult();
    }
  };

  // Xử lý khi nhấn nút phụ "Bắt đầu bài mới"
  const handleStartNewClick = async () => {
    setError(null);
    setNotice(null);

    if (sessionStatus === 'IN_PROGRESS') {
      // Có bài làm dở: hiển thị popup xác nhận
      setShowInProgressModal(true);
    } else {
      // Bài cũ đã COMPLETED: bắt đầu bài mới trực tiếp
      await createNewSurvey();
    }
  };

  // Đóng modal xác nhận bài làm dở
  const handleCloseInProgressModal = () => {
    if (isStartingNew) return;
    setShowInProgressModal(false);
    setInProgressModalError(null);
  };

  // Xác nhận và thực hiện xóa token phiên cũ khỏi trình duyệt
  const handleConfirmClearSession = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      storage.clearToken();
      setExistingToken(null);
      setResumeData(null);
      setSessionStatus('NO_SURVEY');
      setShowDeleteModal(false);
      setShowInProgressModal(false);
      setError(null);
      setNotice('Đã xóa phiên bản khảo sát cũ trên trình duyệt thành công.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi xóa dữ liệu cục bộ';
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Text hiển thị trên nút chính
  const getMainButtonText = () => {
    if (loading && !showInProgressModal) {
      return 'Đang tải...';
    }
    if (sessionStatus === 'CHECKING') {
      return 'Đang kiểm tra...';
    }
    if (sessionStatus === 'IN_PROGRESS') {
      return 'Tiếp tục bài khảo sát';
    }
    if (sessionStatus === 'COMPLETED') {
      return 'Xem kết quả bài trước';
    }
    return 'Bắt đầu khảo sát';
  };

  return (
    <div className="intro-container">
      {/* Header giới thiệu */}
      <header className="intro-header">
        <span className="badge">EPI Personality Test</span>
        <h1 className="title">Trắc Nghiệm Tính Cách Eysenck</h1>
        <p className="subtitle">
          Khám phá 4 nhóm khí chất cơ bản: <strong>Bình thản</strong>, <strong>Ưu tư</strong>,{' '}
          <strong>Hoạt bát</strong> và <strong>Nóng nảy</strong> thông qua 57 câu hỏi trắc nghiệm tâm lý học.
        </p>
      </header>

      {/* Thông báo thông tin (như khi xóa thành công hoặc phiên hết hạn) */}
      {notice && (
        <div className="survey-alert survey-alert-info" role="status">
          ✓ {notice}
        </div>
      )}

      {/* Thông báo lỗi nếu có */}
      {error && !showInProgressModal && (
        <ErrorAlert
          title="Thông báo hệ thống"
          message={error}
          onRetry={handleMainActionClick}
        />
      )}

      {loading && !showInProgressModal && (
        <LoadingSpinner message="Đang kết nối tới máy chủ..." />
      )}

      {/* Khu vực hành động chính */}
      <div className="action-group">
        <button
          type="button"
          className="btn-primary btn-start-survey"
          onClick={handleMainActionClick}
          disabled={loading || sessionStatus === 'CHECKING' || isDeleting || isStartingNew}
        >
          {getMainButtonText()}
        </button>

        {/* Nút phụ: Bắt đầu bài mới khi đã có bài cũ (cho cả IN_PROGRESS và COMPLETED) */}
        {(sessionStatus === 'IN_PROGRESS' || sessionStatus === 'COMPLETED') && !loading && (
          <button
            type="button"
            className="btn-secondary"
            onClick={handleStartNewClick}
            disabled={isDeleting || isStartingNew}
          >
            Bắt đầu bài mới
          </button>
        )}
      </div>

      {/* Khu vực quản lý phiên cũ (xóa token khỏi trình duyệt) */}
      {existingToken && sessionStatus !== 'CHECKING' && !loading && (
        <section className="saved-session-section" aria-label="Quản lý phiên lưu trữ">
          <p className="saved-session-hint">
            {sessionStatus === 'COMPLETED'
              ? 'Trình duyệt đang lưu kết quả bài khảo sát đã hoàn thành. Bạn có thể xóa phiên cũ để làm mới hoàn toàn.'
              : 'Trình duyệt đang lưu một bài làm dở dang. Bạn có thể xóa phiên cũ để bắt đầu lại từ đầu.'}
          </p>
          <button
            type="button"
            className="btn-delete-session"
            onClick={() => setShowDeleteModal(true)}
            disabled={isDeleting || loading || isStartingNew}
            title="Xóa mã phiên khảo sát đã lưu trên trình duyệt"
          >
            Xóa phiên bản khảo sát cũ
          </button>
        </section>
      )}

      {/* Modal xác nhận khi còn bài làm dở IN_PROGRESS */}
      {showInProgressModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="in-progress-modal-title"
          onClick={handleCloseInProgressModal}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close-btn"
              onClick={handleCloseInProgressModal}
              disabled={isStartingNew}
              aria-label="Đóng hộp thoại"
              title="Đóng (giữ nguyên bài cũ)"
            >
              ×
            </button>

            <div className="modal-icon-badge">
              <BrainIcon size={28} color="#526B48" />
            </div>

            <h3 id="in-progress-modal-title" className="modal-title">
              Bạn đang có một bài khảo sát chưa hoàn thành
            </h3>

            <div className="modal-body">
              <p>
                Bạn vẫn còn một bài khảo sát đang làm dở. Bạn muốn tiếp tục bài hiện tại hay bắt đầu một bài mới?
              </p>
              {resumeData && (
                <p style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Tiến độ bài hiện tại: <strong>{resumeData.answeredCount}/57 câu</strong> đã trả lời.
                </p>
              )}
            </div>

            {inProgressModalError && (
              <div className="survey-alert survey-alert-error" role="alert">
                <strong>Lỗi:</strong> {inProgressModalError}
              </div>
            )}

            <div className="modal-actions-stacked">
              <button
                type="button"
                className="btn-primary"
                onClick={continueExistingSurvey}
                disabled={isStartingNew}
              >
                Tiếp tục bài hiện tại
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={createNewSurvey}
                disabled={isStartingNew}
              >
                {isStartingNew ? 'Đang tạo bài mới...' : 'Bắt đầu bài mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận an toàn khi xóa phiên bản cũ */}
      {showDeleteModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
              aria-label="Đóng hộp thoại"
            >
              ×
            </button>

            <div className="modal-icon-badge modal-icon-warning">
              🗑️
            </div>

            <h3 id="delete-modal-title" className="modal-title">
              Xác nhận xóa phiên bản khảo sát cũ?
            </h3>

            <div className="modal-body">
              <p>
                Hệ thống sẽ <strong>xóa mã phiên khảo sát (token)</strong> đang được lưu trữ trên trình duyệt của bạn.
              </p>
              <p style={{ marginTop: '8px' }}>
                Sau khi xóa, bạn sẽ <strong>không thể tiếp tục bài làm dở dang</strong> hoặc xem lại kết quả bài cũ từ phiên này.
              </p>
              <p className="modal-note" style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <em>* Lưu ý: Thao tác này chỉ xóa dữ liệu lưu cục bộ trên trình duyệt hiện tại và không thể hoàn tác.</em>
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn-danger-confirm"
                onClick={handleConfirmClearSession}
                disabled={isDeleting}
              >
                {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntroPage;
