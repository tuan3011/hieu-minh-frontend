import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestionPage } from './QuestionPage';
import { surveyApi } from '../services/api/surveyApi';
import type { QuestionDto, SurveyResultResponseDto } from '../types/survey';

// Mock API service
vi.mock('../services/api/surveyApi', () => ({
  surveyApi: {
    saveAnswer: vi.fn(),
    completeSurvey: vi.fn(),
  },
}));

// Helper tạo 57 câu hỏi giả lập chuẩn schema backend
const createMockQuestions = (count = 57): QuestionDto[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `q-${i + 1}`,
    questionNo: i + 1,
    content: `Nội dung câu hỏi số ${i + 1}?`,
    sectionCode: (i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C') as 'A' | 'B' | 'C',
  }));
};

const mockResult: SurveyResultResponseDto = {
  attemptId: 'test-attempt-123',
  scoreA: 18,
  scoreB: 12,
  scoreC: 3,
  temperament: 'SANGUINE',
  temperamentNameVi: 'Hoạt bát',
  temperamentDescription: 'Người hoạt bát có tính cách hướng ngoại, vui vẻ và cởi mở.',
  reliabilityStatus: 'Đáng tin cậy',
  calculatedAt: '2026-10-13T10:00:00Z',
};

describe('QuestionPage Component', () => {
  const token = 'test-token-xyz';
  const attemptId = 'test-attempt-12345678';
  let mockQuestions: QuestionDto[];
  let onCompleteMock = vi.fn<(result: SurveyResultResponseDto) => void>();
  let onQuitMock = vi.fn<() => void>();

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuestions = createMockQuestions(57);
    onCompleteMock = vi.fn<(result: SurveyResultResponseDto) => void>();
    onQuitMock = vi.fn<() => void>();
  });

  // 1. Render câu hỏi và tiến độ ban đầu
  it('1. Render chính xác câu hỏi đầu tiên, thanh tiến độ và thông tin ban đầu', () => {
    render(
      <QuestionPage
        token={token}
        attemptId={attemptId}
        questions={mockQuestions}
        onComplete={onCompleteMock}
        onQuit={onQuitMock}
      />
    );

    expect(screen.getByText('Câu 1 / 57')).toBeInTheDocument();
    expect(screen.getByText('Nội dung câu hỏi số 1?')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText(/Tiến độ:/i)).toHaveTextContent('0');
    expect(screen.getByRole('button', { name: /Có/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Không/i })).toBeInTheDocument();

    // Kiểm tra nút Về trang chủ
    const quitBtn = screen.getByRole('button', { name: /Về trang chủ/i });
    fireEvent.click(quitBtn);
    expect(onQuitMock).toHaveBeenCalledTimes(1);
  });

  // 2. Chọn Có/Không và lưu thành công
  it('2. Chọn Có/Không sẽ gọi saveAnswer, cập nhật tiến độ và hiển thị trạng thái đã lưu', async () => {
    vi.mocked(surveyApi.saveAnswer).mockResolvedValueOnce();

    render(
      <QuestionPage
        token={token}
        attemptId={attemptId}
        questions={mockQuestions}
        onComplete={onCompleteMock}
      />
    );

    const yesBtn = screen.getByRole('button', { name: /Có/i });
    fireEvent.click(yesBtn);

    expect(surveyApi.saveAnswer).toHaveBeenCalledTimes(1);
    expect(surveyApi.saveAnswer).toHaveBeenCalledWith(token, {
      questionId: 'q-1',
      answerYes: true,
    });

    await waitFor(() => {
      expect(screen.getByText('✓ Đã lưu')).toBeInTheDocument();
    });

    // Nút "Có" được active
    expect(yesBtn).toHaveClass('active');
    // Tiến độ tăng lên 1 / 57
    expect(screen.getByText(/Tiến độ:/i)).toHaveTextContent('1');
  });

  // 3. Lưu thất bại và retry
  it('3. Khi lưu thất bại, hiển thị thông báo lỗi và cho phép thử lại (retry)', async () => {
    vi.mocked(surveyApi.saveAnswer)
      .mockRejectedValueOnce(new Error('Lỗi mất kết nối mạng'))
      .mockResolvedValueOnce();

    render(
      <QuestionPage
        token={token}
        attemptId={attemptId}
        questions={mockQuestions}
        onComplete={onCompleteMock}
      />
    );

    const noBtn = screen.getByRole('button', { name: /Không/i });
    fireEvent.click(noBtn);

    await waitFor(() => {
      expect(screen.getByText('⚠️ Lưu thất bại')).toBeInTheDocument();
      expect(screen.getByText('Lỗi mất kết nối mạng')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /Thử lại/i });
    expect(retryBtn).toBeInTheDocument();

    // Bấm retry
    fireEvent.click(retryBtn);

    expect(surveyApi.saveAnswer).toHaveBeenCalledTimes(2);
    expect(surveyApi.saveAnswer).toHaveBeenLastCalledWith(token, {
      questionId: 'q-1',
      answerYes: false,
    });

    await waitFor(() => {
      expect(screen.getByText('✓ Đã lưu')).toBeInTheDocument();
    });
  });

  // 4. Chuyển câu và giữ đáp án
  it('4. Chuyển câu tới/lui không làm mất đáp án đã chọn và không gửi request lưu thừa', async () => {
    vi.mocked(surveyApi.saveAnswer).mockResolvedValueOnce();

    render(
      <QuestionPage
        token={token}
        attemptId={attemptId}
        questions={mockQuestions}
        onComplete={onCompleteMock}
      />
    );

    // Trả lời câu 1: Có
    const yesBtn = screen.getByRole('button', { name: /Có/i });
    fireEvent.click(yesBtn);
    await waitFor(() => expect(screen.getByText('✓ Đã lưu')).toBeInTheDocument());

    // Chuyển sang Câu 2
    const nextBtn = screen.getByRole('button', { name: /Câu sau →/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText('Câu 2 / 57')).toBeInTheDocument();
    expect(screen.getByText('Nội dung câu hỏi số 2?')).toBeInTheDocument();
    // Chưa chọn gì ở câu 2, không gọi saveAnswer thêm
    expect(surveyApi.saveAnswer).toHaveBeenCalledTimes(1);

    // Quay lại Câu 1
    const prevBtn = screen.getByRole('button', { name: /← Câu trước/i });
    fireEvent.click(prevBtn);

    expect(screen.getByText('Câu 1 / 57')).toBeInTheDocument();
    const yesBtnAgain = screen.getByRole('button', { name: /Có/i });
    expect(yesBtnAgain).toHaveClass('active');
  });

  // 5. Chuyển nhanh bằng danh sách câu (Navigator 1-57)
  it('5. Chuyển nhanh bằng danh sách 57 câu hỏi tới câu bất kỳ', () => {
    render(
      <QuestionPage
        token={token}
        attemptId={attemptId}
        questions={mockQuestions}
        onComplete={onCompleteMock}
      />
    );

    // Bấm nút số 15 trong bảng câu hỏi
    const q15Btn = screen.getByRole('button', { name: /Câu hỏi 15/i });
    fireEvent.click(q15Btn);

    expect(screen.getByText('Câu 15 / 57')).toBeInTheDocument();
    expect(screen.getByText('Nội dung câu hỏi số 15?')).toBeInTheDocument();
  });

  // 6. Khôi phục đáp án đã lưu từ resume
  it('6. Khôi phục các đáp án đã lưu từ initialAnswers và chuyển đến câu chưa trả lời đầu tiên', () => {
    const initialAnswers: Record<string, boolean> = {
      'q-1': true,
      'q-2': false,
      'q-3': true,
    };

    render(
      <QuestionPage
        token={token}
        attemptId={attemptId}
        questions={mockQuestions}
        initialAnswers={initialAnswers}
        onComplete={onCompleteMock}
      />
    );

    // Tự động nhảy đến câu chưa trả lời đầu tiên (Câu 4)
    expect(screen.getByText('Câu 4 / 57')).toBeInTheDocument();
    // Tiến độ ban đầu là 3 / 57
    expect(screen.getByText(/Tiến độ:/i)).toHaveTextContent('3');

    // Kiểm tra ô số 1, 2, 3 có class answered
    const q1Btn = screen.getByRole('button', { name: /Câu hỏi 1:/i });
    expect(q1Btn).toHaveClass('answered');
  });

  // 7. Không cho nộp khi chưa đủ 57 câu
  it('7. Nút nộp bài bị vô hiệu hóa khi chưa trả lời đủ 57 câu', () => {
    const partialAnswers: Record<string, boolean> = {};
    for (let i = 1; i <= 56; i++) {
      partialAnswers[`q-${i}`] = true;
    }

    render(
      <QuestionPage
        token={token}
        attemptId={attemptId}
        questions={mockQuestions}
        initialAnswers={partialAnswers}
        onComplete={onCompleteMock}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Còn 1 câu chưa xong/i });
    expect(submitBtn).toBeDisabled();

    // Click submit không mở modal
    fireEvent.click(submitBtn);
    expect(screen.queryByText(/Xác nhận nộp bài khảo sát\?/i)).not.toBeInTheDocument();
  });

  // 8. Chống bấm liên tục / Double submit khi nộp bài
  it('8. Nộp bài chỉ gửi một request duy nhất khi người dùng click liên tục', async () => {
    // Chuẩn bị đủ 57 câu trả lời
    const allAnswers: Record<string, boolean> = {};
    for (let i = 1; i <= 57; i++) {
      allAnswers[`q-${i}`] = true;
    }

    // Giả lập completeSurvey mất một chút thời gian để test concurrency
    let resolveComplete!: (val: SurveyResultResponseDto) => void;
    vi.mocked(surveyApi.completeSurvey).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveComplete = resolve;
        })
    );

    render(
      <QuestionPage
        token={token}
        attemptId={attemptId}
        questions={mockQuestions}
        initialAnswers={allAnswers}
        onComplete={onCompleteMock}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Nộp bài và xem kết quả/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    // Mở modal xác nhận
    expect(screen.getByText(/Xác nhận nộp bài khảo sát\?/i)).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận nộp bài/i });

    // Click liên tục 3 lần
    fireEvent.click(confirmBtn);
    fireEvent.click(confirmBtn);
    fireEvent.click(confirmBtn);

    expect(surveyApi.completeSurvey).toHaveBeenCalledTimes(1);

    // Kết thúc request
    resolveComplete(mockResult);
    await waitFor(() => {
      expect(onCompleteMock).toHaveBeenCalledWith(mockResult, expect.any(Object));
    });
  });

  // 9. Complete thành công và complete thất bại
  it('9. Complete thất bại giữ người dùng ở QuestionPage và hiển thị thông báo lỗi', async () => {
    const allAnswers: Record<string, boolean> = {};
    for (let i = 1; i <= 57; i++) {
      allAnswers[`q-${i}`] = true;
    }

    vi.mocked(surveyApi.completeSurvey).mockRejectedValueOnce(
      new Error('Lỗi máy chủ nội bộ khi tính điểm')
    );

    render(
      <QuestionPage
        token={token}
        attemptId={attemptId}
        questions={mockQuestions}
        initialAnswers={allAnswers}
        onComplete={onCompleteMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Nộp bài và xem kết quả/i }));
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận nộp bài/i }));

    await waitFor(() => {
      expect(screen.getByText('Lỗi máy chủ nội bộ khi tính điểm')).toBeInTheDocument();
    });

    // Không gọi onComplete
    expect(onCompleteMock).not.toHaveBeenCalled();
    // Vẫn ở trong QuestionPage
    expect(screen.getByText('Nội dung câu hỏi số 1?')).toBeInTheDocument();
  });

  // 10. Attempt COMPLETED không thể sửa đáp án
  it('10. Khi attempt đã COMPLETED, không cho phép sửa câu trả lời hay nộp lại', () => {
    const allAnswers: Record<string, boolean> = { 'q-1': true };

    render(
      <QuestionPage
        token={token}
        attemptId={attemptId}
        questions={mockQuestions}
        initialAnswers={allAnswers}
        isCompleted={true}
        onComplete={onCompleteMock}
      />
    );

    expect(screen.getByText(/Khảo sát đã hoàn thành/i)).toBeInTheDocument();
    expect(screen.getByText(/Bài khảo sát này đã được hoàn thành/i)).toBeInTheDocument();

    const yesBtn = screen.getByRole('button', { name: /Có/i });
    const noBtn = screen.getByRole('button', { name: /Không/i });

    expect(yesBtn).toBeDisabled();
    expect(noBtn).toBeDisabled();

    // Click không kích hoạt saveAnswer
    fireEvent.click(noBtn);
    expect(surveyApi.saveAnswer).not.toHaveBeenCalled();

    // Nút nộp bài hoàn toàn không hiển thị khi isCompleted = true
    expect(screen.queryByRole('button', { name: /Nộp bài và xem kết quả/i })).not.toBeInTheDocument();
  });
});
