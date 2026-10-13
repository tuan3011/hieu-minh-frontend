import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { App } from './App';
import { surveyApi } from './services/api/surveyApi';
import { storage } from './utils/storage';
import type {
  StartSurveyResponseDto,
  SurveyResumeResponseDto,
  SurveyResultResponseDto,
} from './types/survey';

// Mock surveyApi
vi.mock('./services/api/surveyApi', () => ({
  surveyApi: {
    startSurvey: vi.fn(),
    resumeSurvey: vi.fn(),
    saveAnswer: vi.fn(),
    completeSurvey: vi.fn(),
    getResult: vi.fn(),
  },
}));

// Mock storage
vi.mock('./utils/storage', () => {
  let storedToken: string | null = null;
  return {
    storage: {
      getToken: vi.fn(() => storedToken),
      setToken: vi.fn((token: string) => {
        storedToken = token;
      }),
      clearToken: vi.fn(() => {
        storedToken = null;
      }),
      __setMockToken: (token: string | null) => {
        storedToken = token;
      },
    },
  };
});

const mockStartResponse: StartSurveyResponseDto = {
  attemptId: 'attempt-app-111',
  token: 'token-app-111',
  versionCode: 'v1',
  expiresAt: '2026-11-13T10:00:00Z',
  questions: [
    { id: 'q-1', questionNo: 1, content: 'Bạn có thích những nơi đông người?', sectionCode: 'A' },
  ],
};

const mockResumeInProgressResponse: SurveyResumeResponseDto = {
  attemptId: 'attempt-app-222',
  status: 'IN_PROGRESS',
  expiresAt: '2026-11-13T10:00:00Z',
  completedAt: null,
  answeredCount: 1,
  answers: { 'q-1': true },
  questions: [
    { id: 'q-1', questionNo: 1, content: 'Bạn có thích những nơi đông người?', sectionCode: 'A' },
  ],
};

const mockResumeCompletedResponse: SurveyResumeResponseDto = {
  attemptId: 'attempt-app-333',
  status: 'COMPLETED',
  expiresAt: '2026-11-13T10:00:00Z',
  completedAt: '2026-10-13T12:00:00Z',
  answeredCount: 57,
  answers: {},
  questions: [
    { id: 'q-1', questionNo: 1, content: 'Bạn có thích những nơi đông người?', sectionCode: 'A' },
  ],
};

const mockResultResponse: SurveyResultResponseDto = {
  attemptId: 'attempt-app-333',
  versionCode: 'v1',
  scoreA: 20,
  scoreB: 8,
  scoreC: 2,
  temperament: 'SANGUINE',
  temperamentNameVi: 'Khí chất Hoạt bát (Sanguine)',
  temperamentDescription: 'Linh hoạt, thân thiện, tràn đầy năng lượng tích cực.',
  reliabilityStatus: 'HIGH',
  isReliable: true,
  completedAt: '2026-10-13T12:00:00Z',
};

describe('App Integration Flow — Dynamic Attempt State Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error test helper
    storage.__setMockToken(null);
  });

  it('1. Khởi động chưa có bài -> hiển thị Bắt đầu khảo sát -> click vào tạo attempt và chuyển sang QUESTION', async () => {
    vi.mocked(surveyApi.startSurvey).mockResolvedValueOnce(mockStartResponse);

    render(<App />);

    const startBtn = screen.getByRole('button', { name: 'Bắt đầu khảo sát' });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(surveyApi.startSurvey).toHaveBeenCalledTimes(1);
      // Chuyển sang QuestionPage
      expect(screen.getByText('Bạn có thích những nơi đông người?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Về trang chủ' })).toBeInTheDocument();
    });
  });

  it('2. Khởi động có bài IN_PROGRESS -> hiển thị Tiếp tục bài khảo sát -> click vào chuyển thẳng QUESTION với đáp án đã lưu', async () => {
    // @ts-expect-error test helper
    storage.__setMockToken('in-progress-token');
    vi.mocked(surveyApi.resumeSurvey).mockResolvedValueOnce(mockResumeInProgressResponse);

    render(<App />);

    const continueBtn = await screen.findByRole('button', { name: 'Tiếp tục bài khảo sát' });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      // Chuyển sang QuestionPage
      expect(screen.getByText('Bạn có thích những nơi đông người?')).toBeInTheDocument();
      // Đáp án câu 1 đã được chọn CÓ
      const yesBtn = screen.getByRole('button', { name: /Có/i });
      expect(yesBtn).toHaveClass('active');
    });
  });

  it('3. Khởi động có bài COMPLETED -> hiển thị Xem kết quả bài trước -> click vào chuyển thẳng RESULT', async () => {
    // @ts-expect-error test helper
    storage.__setMockToken('completed-token');
    vi.mocked(surveyApi.resumeSurvey).mockResolvedValueOnce(mockResumeCompletedResponse);
    vi.mocked(surveyApi.getResult).mockResolvedValueOnce(mockResultResponse);

    render(<App />);

    const viewResultBtn = await screen.findByRole('button', { name: 'Xem kết quả bài trước' });
    fireEvent.click(viewResultBtn);

    await waitFor(() => {
      expect(surveyApi.getResult).toHaveBeenCalledWith('completed-token');
      // Chuyển sang Result View
      expect(screen.getByText('Kết Quả Phân Tích Tâm Lý')).toBeInTheDocument();
      // Không còn hiển thị số điểm, thay vào đó hiển thị nhãn phân loại nổi bật
      expect(screen.queryByText(/20\s*\/\s*24/)).not.toBeInTheDocument();
      expect(screen.getByText('Hướng ngoại')).toBeInTheDocument();
      // Không gọi startSurvey
      expect(surveyApi.startSurvey).not.toHaveBeenCalled();
    });
  });

  it('4. Từ Result View quay lại trang chủ -> nút chính vẫn là Xem kết quả bài trước', async () => {
    // @ts-expect-error test helper
    storage.__setMockToken('completed-token');
    vi.mocked(surveyApi.resumeSurvey).mockResolvedValue(mockResumeCompletedResponse);
    vi.mocked(surveyApi.getResult).mockResolvedValueOnce(mockResultResponse);

    render(<App />);

    // Xem kết quả
    const viewResultBtn = await screen.findByRole('button', { name: 'Xem kết quả bài trước' });
    fireEvent.click(viewResultBtn);

    await waitFor(() => {
      expect(screen.getByText('Kết Quả Phân Tích Tâm Lý')).toBeInTheDocument();
    });

    // Bấm logo trên navbar quay lại trang chủ
    const homeBtn = screen.getByTitle('Về trang chủ Hiểu Mình');
    fireEvent.click(homeBtn);

    // IntroPage xuất hiện lại và nút chính tự động là "Xem kết quả bài trước"
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Xem kết quả bài trước' })).toBeInTheDocument();
    });
  });

  it('5. Từ Result View bấm Làm bài khảo sát mới -> dọn token và quay về trang chủ với nút Bắt đầu khảo sát', async () => {
    // @ts-expect-error test helper
    storage.__setMockToken('completed-token');
    vi.mocked(surveyApi.resumeSurvey).mockResolvedValue(mockResumeCompletedResponse);
    vi.mocked(surveyApi.getResult).mockResolvedValueOnce(mockResultResponse);

    render(<App />);

    const viewResultBtn = await screen.findByRole('button', { name: 'Xem kết quả bài trước' });
    fireEvent.click(viewResultBtn);

    await waitFor(() => {
      expect(screen.getByText('Kết Quả Phân Tích Tâm Lý')).toBeInTheDocument();
    });

    // Bấm nút "Làm bài khảo sát mới"
    const newSurveyBtn = screen.getByRole('button', { name: 'Làm bài khảo sát mới' });
    fireEvent.click(newSurveyBtn);

    await waitFor(() => {
      expect(storage.clearToken).toHaveBeenCalledTimes(1);
      // Nút chính quay về Bắt đầu khảo sát
      expect(screen.getByRole('button', { name: 'Bắt đầu khảo sát' })).toBeInTheDocument();
    });
  });

  it('6. Từ Result View mở Các câu hỏi đã trả lời hiển thị danh sách câu hỏi và câu trả lời thực tế', async () => {
    // @ts-expect-error test helper
    storage.__setMockToken('completed-token');
    vi.mocked(surveyApi.resumeSurvey).mockResolvedValue(mockResumeCompletedResponse);
    vi.mocked(surveyApi.getResult).mockResolvedValueOnce(mockResultResponse);

    render(<App />);

    const viewResultBtn = await screen.findByRole('button', { name: 'Xem kết quả bài trước' });
    fireEvent.click(viewResultBtn);

    await waitFor(() => {
      expect(screen.getByText('Kết Quả Phân Tích Tâm Lý')).toBeInTheDocument();
    });

    // Mở phần câu hỏi đã trả lời
    const reviewBtn = screen.getByRole('button', { name: 'Xem chi tiết ▼' });
    fireEvent.click(reviewBtn);

    await waitFor(() => {
      expect(screen.getByText('Các câu hỏi đã trả lời')).toBeInTheDocument();
      expect(screen.getByText('Bạn có thích những nơi đông người?')).toBeInTheDocument();
      expect(screen.getByText('Câu 1')).toBeInTheDocument();
    });
  });
});
