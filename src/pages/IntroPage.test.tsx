import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntroPage } from './IntroPage';
import { surveyApi } from '../services/api/surveyApi';
import { storage } from '../utils/storage';
import type {
  StartSurveyResponseDto,
  SurveyResumeResponseDto,
  SurveyResultResponseDto,
} from '../types/survey';

// Mock surveyApi
vi.mock('../services/api/surveyApi', () => ({
  surveyApi: {
    startSurvey: vi.fn(),
    resumeSurvey: vi.fn(),
    getResult: vi.fn(),
  },
}));

// Mock storage
vi.mock('../utils/storage', () => {
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
      // Helper cho test
      __setMockToken: (token: string | null) => {
        storedToken = token;
      },
    },
  };
});

const mockStartResponse: StartSurveyResponseDto = {
  attemptId: 'attempt-111',
  token: 'new-token-111',
  versionCode: 'v1',
  expiresAt: '2026-11-13T10:00:00Z',
  questions: [
    { id: 'q-1', questionNo: 1, content: 'Câu hỏi 1?', sectionCode: 'A' },
  ],
};

const mockResumeInProgressResponse: SurveyResumeResponseDto = {
  attemptId: 'attempt-222',
  status: 'IN_PROGRESS',
  expiresAt: '2026-11-13T10:00:00Z',
  completedAt: null,
  answeredCount: 15,
  answers: { 'q-1': true },
  questions: [
    { id: 'q-1', questionNo: 1, content: 'Câu hỏi 1?', sectionCode: 'A' },
  ],
};

const mockResumeCompletedResponse: SurveyResumeResponseDto = {
  attemptId: 'attempt-333',
  status: 'COMPLETED',
  expiresAt: '2026-11-13T10:00:00Z',
  completedAt: '2026-10-13T12:00:00Z',
  answeredCount: 57,
  answers: {},
  questions: [
    { id: 'q-1', questionNo: 1, content: 'Câu hỏi 1?', sectionCode: 'A' },
  ],
};

const mockResultResponse: SurveyResultResponseDto = {
  attemptId: 'attempt-333',
  versionCode: 'v1',
  scoreA: 18,
  scoreB: 12,
  scoreC: 3,
  temperament: 'SANGUINE',
  temperamentNameVi: 'Khí chất Hoạt bát (Sanguine)',
  temperamentDescription: 'Lạc quan, hướng ngoại, thích giao tiếp và thích ứng nhanh.',
  reliabilityStatus: 'HIGH',
  isReliable: true,
  completedAt: '2026-10-13T12:00:00Z',
};

describe('IntroPage Component — Dynamic Main Action Button & Survey States', () => {
  let onStartSuccessMock = vi.fn<(data: StartSurveyResponseDto) => void>();
  let onResumeSuccessMock = vi.fn<(data: SurveyResumeResponseDto, token: string) => void>();
  let onViewResultMock = vi.fn<(result: SurveyResultResponseDto, token: string) => void>();

  beforeEach(() => {
    vi.clearAllMocks();
    onStartSuccessMock = vi.fn<(data: StartSurveyResponseDto) => void>();
    onResumeSuccessMock = vi.fn<(data: SurveyResumeResponseDto, token: string) => void>();
    onViewResultMock = vi.fn<(result: SurveyResultResponseDto, token: string) => void>();
    // @ts-expect-error test helper
    storage.__setMockToken(null);
  });

  // 1. Khi không có token, nút chính hiển thị “Bắt đầu khảo sát”
  it('1. Khi không có token, nút chính hiển thị “Bắt đầu khảo sát” và không có 3 khối thông tin', async () => {
    render(
      <IntroPage
        onStartSuccess={onStartSuccessMock}
        onResumeSuccess={onResumeSuccessMock}
        onViewResult={onViewResultMock}
      />
    );

    expect(screen.getByText('Trắc Nghiệm Tính Cách Eysenck')).toBeInTheDocument();
    const mainBtn = screen.getByRole('button', { name: 'Bắt đầu khảo sát' });
    expect(mainBtn).toBeInTheDocument();

    // Không có các khối thông tin cũ
    expect(screen.queryByText(/Ẩn danh 100%/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/5 - 10 phút/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tự động lưu/i)).not.toBeInTheDocument();

    // Không gọi resumeSurvey khi không có token
    expect(surveyApi.resumeSurvey).not.toHaveBeenCalled();

    // Bấm Bắt đầu khảo sát -> gọi startSurvey
    vi.mocked(surveyApi.startSurvey).mockResolvedValueOnce(mockStartResponse);
    fireEvent.click(mainBtn);

    await waitFor(() => {
      expect(surveyApi.startSurvey).toHaveBeenCalledTimes(1);
      expect(storage.setToken).toHaveBeenCalledWith('new-token-111');
      expect(onStartSuccessMock).toHaveBeenCalledWith(mockStartResponse);
    });
  });

  // 2. Khi có bài IN_PROGRESS, nút chính hiển thị “Tiếp tục bài khảo sát”
  it('2. Khi có bài IN_PROGRESS, nút chính hiển thị “Tiếp tục bài khảo sát” và có nút phụ Bắt đầu bài mới', async () => {
    // @ts-expect-error test helper
    storage.__setMockToken('in-progress-token-123');
    vi.mocked(surveyApi.resumeSurvey).mockResolvedValueOnce(mockResumeInProgressResponse);

    render(
      <IntroPage
        onStartSuccess={onStartSuccessMock}
        onResumeSuccess={onResumeSuccessMock}
        onViewResult={onViewResultMock}
      />
    );

    // Xác minh qua API resumeSurvey
    expect(surveyApi.resumeSurvey).toHaveBeenCalledWith('in-progress-token-123');

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Tiếp tục bài khảo sát' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Bắt đầu bài mới' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Xóa phiên bản khảo sát cũ' })
      ).toBeInTheDocument();
    });
  });

  // 3. Khi nhấn “Tiếp tục bài khảo sát”, khôi phục đúng danh sách câu hỏi và đáp án đã chọn
  it('3. Khi nhấn “Tiếp tục bài khảo sát”, khôi phục đúng danh sách câu hỏi và đáp án đã chọn', async () => {
    // @ts-expect-error test helper
    storage.__setMockToken('in-progress-token-123');
    vi.mocked(surveyApi.resumeSurvey).mockResolvedValueOnce(mockResumeInProgressResponse);

    render(
      <IntroPage
        onStartSuccess={onStartSuccessMock}
        onResumeSuccess={onResumeSuccessMock}
        onViewResult={onViewResultMock}
      />
    );

    const continueBtn = await screen.findByRole('button', {
      name: 'Tiếp tục bài khảo sát',
    });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(onResumeSuccessMock).toHaveBeenCalledTimes(1);
      expect(onResumeSuccessMock).toHaveBeenCalledWith(
        mockResumeInProgressResponse,
        'in-progress-token-123'
      );
      // Không tạo attempt mới
      expect(surveyApi.startSurvey).not.toHaveBeenCalled();
    });
  });

  // 4. Khi bài gần nhất COMPLETED, nút chính hiển thị “Xem kết quả bài trước”
  it('4. Khi bài gần nhất COMPLETED, nút chính hiển thị “Xem kết quả bài trước”', async () => {
    // @ts-expect-error test helper
    storage.__setMockToken('completed-token-456');
    vi.mocked(surveyApi.resumeSurvey).mockResolvedValueOnce(mockResumeCompletedResponse);

    render(
      <IntroPage
        onStartSuccess={onStartSuccessMock}
        onResumeSuccess={onResumeSuccessMock}
        onViewResult={onViewResultMock}
      />
    );

    expect(surveyApi.resumeSurvey).toHaveBeenCalledWith('completed-token-456');

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Xem kết quả bài trước' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Bắt đầu bài mới' })
      ).toBeInTheDocument();
    });
  });

  // 5. Khi nhấn “Xem kết quả bài trước”, hiển thị kết quả phân tích tương ứng và không gọi API bắt đầu bài mới
  it('5. Khi nhấn “Xem kết quả bài trước”, gọi getResult và onViewResult, không gọi startSurvey', async () => {
    // @ts-expect-error test helper
    storage.__setMockToken('completed-token-456');
    vi.mocked(surveyApi.resumeSurvey).mockResolvedValueOnce(mockResumeCompletedResponse);
    vi.mocked(surveyApi.getResult).mockResolvedValueOnce(mockResultResponse);

    render(
      <IntroPage
        onStartSuccess={onStartSuccessMock}
        onResumeSuccess={onResumeSuccessMock}
        onViewResult={onViewResultMock}
      />
    );

    const viewResultBtn = await screen.findByRole('button', {
      name: 'Xem kết quả bài trước',
    });
    fireEvent.click(viewResultBtn);

    await waitFor(() => {
      expect(surveyApi.getResult).toHaveBeenCalledWith('completed-token-456');
      expect(onViewResultMock).toHaveBeenCalledWith(
        mockResultResponse,
        'completed-token-456'
      );
      expect(surveyApi.startSurvey).not.toHaveBeenCalled();
    });
  });

  // 6. Khi token hết hạn hoặc không hợp lệ, token bị xóa và nút chính chuyển về “Bắt đầu khảo sát”
  it('6. Khi token hết hạn hoặc không hợp lệ, token bị xóa và nút chính chuyển về “Bắt đầu khảo sát”', async () => {
    // @ts-expect-error test helper
    storage.__setMockToken('expired-token-789');
    vi.mocked(surveyApi.resumeSurvey).mockRejectedValueOnce(
      new Error('410 Gone: Phiên khảo sát đã hết hạn')
    );

    render(
      <IntroPage
        onStartSuccess={onStartSuccessMock}
        onResumeSuccess={onResumeSuccessMock}
        onViewResult={onViewResultMock}
      />
    );

    await waitFor(() => {
      // Đã dọn token hỏng
      expect(storage.clearToken).toHaveBeenCalledTimes(1);
      // Nút chính chuyển về Bắt đầu khảo sát
      expect(
        screen.getByRole('button', { name: 'Bắt đầu khảo sát' })
      ).toBeInTheDocument();
      // Hiển thị thông báo nhẹ nhàng
      expect(
        screen.getByText(/Phiên làm bài trước đã hết hạn hoặc không tồn tại/i)
      ).toBeInTheDocument();
    });
  });

  // 7. Sau khi hoàn thành bài khảo sát và quay lại trang chủ, nút chính tự động đổi thành “Xem kết quả bài trước”
  it('7. Sau khi hoàn thành bài khảo sát và quay lại trang chủ, phát hiện trạng thái COMPLETED và hiển thị “Xem kết quả bài trước”', async () => {
    // Giả lập trạng thái sau khi hoàn thành bài: token bài vừa hoàn thành được lưu
    // @ts-expect-error test helper
    storage.__setMockToken('just-completed-token');
    vi.mocked(surveyApi.resumeSurvey).mockResolvedValueOnce(mockResumeCompletedResponse);

    render(
      <IntroPage
        onStartSuccess={onStartSuccessMock}
        onResumeSuccess={onResumeSuccessMock}
        onViewResult={onViewResultMock}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Xem kết quả bài trước' })
      ).toBeInTheDocument();
    });
  });

  // 8. Có lựa chọn bắt đầu bài mới khi đang ở trạng thái có bài cũ (cho cả bài IN_PROGRESS và COMPLETED)
  describe('8. Lựa chọn bắt đầu bài mới khi đang có bài cũ', () => {
    it('8a. Khi đang có bài IN_PROGRESS, bấm “Bắt đầu bài mới” hiển thị popup xác nhận, chọn Bắt đầu bài mới thì tạo attempt mới', async () => {
      // @ts-expect-error test helper
      storage.__setMockToken('in-progress-token-123');
      vi.mocked(surveyApi.resumeSurvey).mockResolvedValueOnce(mockResumeInProgressResponse);
      vi.mocked(surveyApi.startSurvey).mockResolvedValueOnce(mockStartResponse);

      render(
        <IntroPage
          onStartSuccess={onStartSuccessMock}
          onResumeSuccess={onResumeSuccessMock}
          onViewResult={onViewResultMock}
        />
      );

      const startNewSecondaryBtn = await screen.findByRole('button', {
        name: 'Bắt đầu bài mới',
      });
      fireEvent.click(startNewSecondaryBtn);

      // Mở modal xác nhận bài dở
      expect(
        screen.getByText('Bạn đang có một bài khảo sát chưa hoàn thành')
      ).toBeInTheDocument();

      // Trong modal có 2 nút: "Tiếp tục bài hiện tại" và "Bắt đầu bài mới"
      const modal = screen.getByRole('dialog');
      expect(
        within(modal).getByRole('button', { name: 'Tiếp tục bài hiện tại' })
      ).toBeInTheDocument();

      // Bấm "Bắt đầu bài mới" bên trong modal
      const modalStartNewBtn = within(modal).getByRole('button', {
        name: 'Bắt đầu bài mới',
      });
      fireEvent.click(modalStartNewBtn);

      await waitFor(() => {
        expect(surveyApi.startSurvey).toHaveBeenCalledTimes(1);
        expect(storage.setToken).toHaveBeenCalledWith('new-token-111');
        expect(onStartSuccessMock).toHaveBeenCalledWith(mockStartResponse);
        expect(
          screen.queryByText('Bạn đang có một bài khảo sát chưa hoàn thành')
        ).not.toBeInTheDocument();
      });
    });

    it('8b. Khi bài gần nhất COMPLETED, bấm “Bắt đầu bài mới” gọi startSurvey trực tiếp mà không bị chặn', async () => {
      // @ts-expect-error test helper
      storage.__setMockToken('completed-token-456');
      vi.mocked(surveyApi.resumeSurvey).mockResolvedValueOnce(mockResumeCompletedResponse);
      vi.mocked(surveyApi.startSurvey).mockResolvedValueOnce(mockStartResponse);

      render(
        <IntroPage
          onStartSuccess={onStartSuccessMock}
          onResumeSuccess={onResumeSuccessMock}
          onViewResult={onViewResultMock}
        />
      );

      const startNewBtn = await screen.findByRole('button', {
        name: 'Bắt đầu bài mới',
      });
      fireEvent.click(startNewBtn);

      await waitFor(() => {
        // Không mở popup cảnh báo bài dở vì bài cũ đã hoàn thành
        expect(
          screen.queryByText('Bạn đang có một bài khảo sát chưa hoàn thành')
        ).not.toBeInTheDocument();
        // Gọi startSurvey tạo attempt mới
        expect(surveyApi.startSurvey).toHaveBeenCalledTimes(1);
        expect(storage.setToken).toHaveBeenCalledWith('new-token-111');
        expect(onStartSuccessMock).toHaveBeenCalledWith(mockStartResponse);
      });
    });
  });

  // 9. Kiểm tra quy trình xóa phiên bản cũ qua modal an toàn
  it('9. Xóa phiên bản khảo sát cũ qua modal an toàn dọn token và chuyển nút chính về “Bắt đầu khảo sát”', async () => {
    // @ts-expect-error test helper
    storage.__setMockToken('saved-token-abc');
    vi.mocked(surveyApi.resumeSurvey).mockResolvedValueOnce(mockResumeInProgressResponse);

    render(
      <IntroPage
        onStartSuccess={onStartSuccessMock}
        onResumeSuccess={onResumeSuccessMock}
        onViewResult={onViewResultMock}
      />
    );

    const deleteBtn = await screen.findByRole('button', {
      name: 'Xóa phiên bản khảo sát cũ',
    });
    fireEvent.click(deleteBtn);

    // Modal xóa phiên cũ mở
    expect(
      screen.getByText('Xác nhận xóa phiên bản khảo sát cũ?')
    ).toBeInTheDocument();

    // Bấm Xác nhận xóa
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận xóa' }));

    await waitFor(() => {
      expect(storage.clearToken).toHaveBeenCalledTimes(1);
      // Nút chính chuyển về Bắt đầu khảo sát
      expect(
        screen.getByRole('button', { name: 'Bắt đầu khảo sát' })
      ).toBeInTheDocument();
      // Nút xóa cũ biến mất
      expect(
        screen.queryByRole('button', { name: 'Xóa phiên bản khảo sát cũ' })
      ).not.toBeInTheDocument();
      // Thông báo thành công
      expect(
        screen.getByText(/Đã xóa phiên bản khảo sát cũ trên trình duyệt thành công/i)
      ).toBeInTheDocument();
    });
  });

  // 10. Đóng modal bài dở bằng nút × hoặc Escape không làm mất bài cũ
  it('10. Đóng modal bài dở bằng nút × giữ nguyên bài cũ, không gọi startSurvey', async () => {
    // @ts-expect-error test helper
    storage.__setMockToken('in-progress-token-123');
    vi.mocked(surveyApi.resumeSurvey).mockResolvedValueOnce(mockResumeInProgressResponse);

    render(
      <IntroPage
        onStartSuccess={onStartSuccessMock}
        onResumeSuccess={onResumeSuccessMock}
        onViewResult={onViewResultMock}
      />
    );

    const startNewBtn = await screen.findByRole('button', {
      name: 'Bắt đầu bài mới',
    });
    fireEvent.click(startNewBtn);

    expect(
      screen.getByText('Bạn đang có một bài khảo sát chưa hoàn thành')
    ).toBeInTheDocument();

    // Bấm nút đóng ×
    fireEvent.click(screen.getByRole('button', { name: 'Đóng hộp thoại' }));

    expect(
      screen.queryByText('Bạn đang có một bài khảo sát chưa hoàn thành')
    ).not.toBeInTheDocument();
    expect(surveyApi.startSurvey).not.toHaveBeenCalled();
    expect(storage.clearToken).not.toHaveBeenCalled();
  });
});
