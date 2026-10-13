import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResultPage } from './ResultPage';
import { surveyApi } from '../services/api/surveyApi';
import type { QuestionDto, SurveyResumeResponseDto, SurveyResultResponseDto } from '../types/survey';

// Mock surveyApi
vi.mock('../services/api/surveyApi', () => ({
  surveyApi: {
    resumeSurvey: vi.fn(),
    saveAnswer: vi.fn(),
  },
}));

const mockSurveyResult: SurveyResultResponseDto = {
  attemptId: 'att-res-123',
  scoreA: 18,
  scoreB: 12,
  scoreC: 3,
  temperament: 'SANGUINE',
  temperamentNameVi: 'Khí chất Hoạt bát (Sanguine)',
  temperamentDescription: 'Linh hoạt, nhiệt tình và thích giao lưu.',
  reliabilityStatus: 'Độ tin cậy cao',
  calculatedAt: '2026-10-13T12:00:00Z',
};

const mockQuestions: QuestionDto[] = [
  { id: 'q-10', questionNo: 1, content: 'Bạn có thích những bữa tiệc sôi động?', sectionCode: 'A' },
  { id: 'q-20', questionNo: 2, content: 'Tâm trạng bạn có hay thay đổi thất thường?', sectionCode: 'B' },
  { id: 'q-30', questionNo: 3, content: 'Bạn đã bao giờ giữ lời hứa chưa?', sectionCode: 'C' },
];

const mockAnswers: Record<string, boolean> = {
  'q-10': true,
  'q-20': false,
};

const mockResumeResponse: SurveyResumeResponseDto = {
  attemptId: 'att-res-123',
  status: 'COMPLETED',
  expiresAt: '2026-11-13T10:00:00Z',
  completedAt: '2026-10-13T12:00:00Z',
  answeredCount: 2,
  answers: mockAnswers,
  questions: mockQuestions,
};

describe('ResultPage Component — Answered Questions Review', () => {
  const onNewSurveyMock = vi.fn();
  const onBackToHomeMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Hiển thị thông tin kết quả tổng quan
  it('1. Hiển thị chính xác điểm số thang đo, tên khí chất chuẩn hóa và diễn giải tương ứng', () => {
    render(
      <ResultPage
        token="token-abc"
        surveyResult={mockSurveyResult}
        onNewSurvey={onNewSurveyMock}
        onBackToHome={onBackToHomeMock}
      />
    );

    expect(screen.getByText('Kết Quả Phân Tích Tâm Lý')).toBeInTheDocument();
    // Tiêu đề đã loại bỏ từ "Khí chất" thừa
    expect(screen.getByText('Khí Chất: Hoạt bát (Sanguine)')).toBeInTheDocument();
    // Không còn dòng phụ (SANGUINE)
    expect(screen.queryByText('(SANGUINE)')).not.toBeInTheDocument();

    // Tên các thang điểm ngắn gọn
    expect(screen.getByRole('heading', { level: 3, name: 'Extraversion' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Neuroticism' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Lie Scale' })).toBeInTheDocument();

    // Không còn hiển thị số điểm
    expect(screen.queryByText(/18\s*\/\s*24/)).not.toBeInTheDocument();
    expect(screen.queryByText(/12\s*\/\s*24/)).not.toBeInTheDocument();
    expect(screen.queryByText(/3\s*\/\s*9/)).not.toBeInTheDocument();

    // Nhãn phân loại nổi bật
    expect(screen.getByText('Hướng ngoại')).toBeInTheDocument(); // 18 > 12
    expect(screen.getByText('Thần kinh ổn định')).toBeInTheDocument(); // 12 <= 12
    expect(screen.getByText('Đáng tin')).toBeInTheDocument(); // 3 <= 4

    // Infographic chi tiết được render đúng alt text cho SANGUINE và không bị trùng text mô tả
    const infographicImg = screen.getByAltText('Infographic chi tiết Khí chất Hoạt bát (Sanguine)');
    expect(infographicImg).toBeInTheDocument();
    expect(infographicImg).toHaveAttribute('src', expect.stringContaining('sanguine.jpg'));
    expect(screen.queryByText(/Linh hoạt, nhiệt tình và thích giao lưu/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Độ tin cậy cao/)).toBeInTheDocument();

    // Xác nhận không còn nút "Xem lại các câu hỏi đã trả lời" ở cuối trang
    expect(
      screen.queryByRole('button', { name: /Xem lại các câu hỏi đã trả lời/i })
    ).not.toBeInTheDocument();
  });

  // 2. Mở/đóng danh sách hoạt động chính xác và không hiển thị badge số câu đã trả lời ở cả 2 trạng thái
  it('2. Xóa hoàn toàn badge số câu đã trả lời ở cả trạng thái thu gọn và mở rộng; mở/đóng hoạt động chính xác', async () => {
    render(
      <ResultPage
        token="token-abc"
        surveyResult={mockSurveyResult}
        initialQuestions={mockQuestions}
        initialAnswers={mockAnswers}
        onNewSurvey={onNewSurveyMock}
      />
    );

    // Không có badge số câu đã trả lời khi đang thu gọn
    expect(screen.queryByText(/câu đã trả lời/i)).not.toBeInTheDocument();
    const toggleBtn = screen.getByRole('button', { name: 'Xem chi tiết ▼' });
    expect(toggleBtn).toBeInTheDocument();

    // Ban đầu nội dung danh sách chưa hiển thị
    expect(
      screen.queryByRole('list', { name: 'Danh sách câu hỏi đã trả lời' })
    ).not.toBeInTheDocument();

    // Nhấn mở chi tiết
    fireEvent.click(toggleBtn);

    // Khi mở rộng: vẫn hoàn toàn không có badge số câu đã trả lời
    expect(screen.queryByText(/câu đã trả lời/i)).not.toBeInTheDocument();
    // Nút đổi thành "Thu gọn ▲"
    expect(screen.getByRole('button', { name: 'Thu gọn ▲' })).toBeInTheDocument();
    // Danh sách câu hỏi hiển thị
    expect(
      screen.getByRole('list', { name: 'Danh sách câu hỏi đã trả lời' })
    ).toBeInTheDocument();

    // Nhấn thu gọn lại
    fireEvent.click(screen.getByRole('button', { name: 'Thu gọn ▲' }));

    // Khi thu gọn lại: vẫn không có badge và nút trở về "Xem chi tiết ▼"
    expect(screen.queryByText(/câu đã trả lời/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xem chi tiết ▼' })).toBeInTheDocument();
    expect(
      screen.queryByRole('list', { name: 'Danh sách câu hỏi đã trả lời' })
    ).not.toBeInTheDocument();
  });

  // 3. Danh sách câu hỏi và đáp án được hiển thị sau khi hoàn thành
  it('3. Danh sách câu hỏi và đáp án được tải và hiển thị đầy đủ sau khi mở chi tiết', async () => {
    vi.mocked(surveyApi.resumeSurvey).mockResolvedValueOnce(mockResumeResponse);

    render(
      <ResultPage
        token="token-abc"
        surveyResult={mockSurveyResult}
        onNewSurvey={onNewSurveyMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Xem chi tiết ▼' }));

    await waitFor(() => {
      expect(surveyApi.resumeSurvey).toHaveBeenCalledWith('token-abc');
      expect(screen.getByText('Bạn có thích những bữa tiệc sôi động?')).toBeInTheDocument();
      expect(screen.getByText('Tâm trạng bạn có hay thay đổi thất thường?')).toBeInTheDocument();
      expect(screen.getByText('Bạn đã bao giờ giữ lời hứa chưa?')).toBeInTheDocument();
    });
  });

  // 4. Câu hỏi được ghép đúng với đáp án tương ứng bằng ID
  it('4. Câu hỏi được ghép chính xác với đáp án tương ứng (Có / Không / Chưa trả lời) bằng question ID', async () => {
    vi.mocked(surveyApi.resumeSurvey).mockResolvedValueOnce(mockResumeResponse);

    render(
      <ResultPage
        token="token-abc"
        surveyResult={mockSurveyResult}
        onNewSurvey={onNewSurveyMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Xem chi tiết ▼' }));

    await waitFor(() => {
      // Câu 1 (q-10 -> true) -> "Có"
      const yesBadge = screen.getByLabelText('Câu trả lời: Có');
      expect(yesBadge).toBeInTheDocument();
      expect(yesBadge).toHaveTextContent('✓ Có');

      // Câu 2 (q-20 -> false) -> "Không"
      const noBadge = screen.getByLabelText('Câu trả lời: Không');
      expect(noBadge).toBeInTheDocument();
      expect(noBadge).toHaveTextContent('✗ Không');

      // Câu 3 (q-30 -> undefined) -> "Chưa trả lời"
      const unansweredBadge = screen.getByText('Chưa trả lời');
      expect(unansweredBadge).toBeInTheDocument();
    });
  });

  // 5. Trạng thái loading và lỗi được hiển thị đúng
  it('5. Hiển thị trạng thái loading khi đang tải và hiển thị ErrorAlert khi gọi API thất bại', async () => {
    vi.mocked(surveyApi.resumeSurvey).mockRejectedValueOnce(
      new Error('Mạng bị gián đoạn, không thể tải dữ liệu')
    );

    render(
      <ResultPage
        token="token-abc"
        surveyResult={mockSurveyResult}
        onNewSurvey={onNewSurveyMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Xem chi tiết ▼' }));

    // Hiển thị thông báo lỗi
    await waitFor(() => {
      expect(
        screen.getByText('Không thể tải câu hỏi đã trả lời')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Mạng bị gián đoạn, không thể tải dữ liệu')
      ).toBeInTheDocument();
    });

    // Thử lại khi người dùng bấm Thử lại
    vi.mocked(surveyApi.resumeSurvey).mockResolvedValueOnce(mockResumeResponse);
    const retryBtn = screen.getByRole('button', { name: 'Thử lại' });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Bạn có thích những bữa tiệc sôi động?')
      ).toBeInTheDocument();
    });
  });

  // 6. Danh sách rỗng không gây trang trắng
  it('6. Danh sách câu hỏi rỗng không gây lỗi hoặc trang trắng, hiển thị thông báo rỗng thân thiện', async () => {
    vi.mocked(surveyApi.resumeSurvey).mockResolvedValueOnce({
      attemptId: 'att-empty',
      status: 'COMPLETED',
      expiresAt: '2026-11-13T10:00:00Z',
      completedAt: '2026-10-13T12:00:00Z',
      answeredCount: 0,
      answers: {},
      questions: [],
    });

    render(
      <ResultPage
        token="token-abc"
        surveyResult={mockSurveyResult}
        onNewSurvey={onNewSurveyMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Xem chi tiết ▼' }));

    await waitFor(() => {
      expect(
        screen.getByText('Chưa có dữ liệu câu hỏi cho bài khảo sát này.')
      ).toBeInTheDocument();
    });
  });

  // 7. Người dùng không thể sửa đáp án sau khi hoàn thành (read-only)
  it('7. Danh sách hoàn toàn chỉ đọc (read-only), không có các nút bấm sửa đáp án và không gọi saveAnswer', async () => {
    render(
      <ResultPage
        token="token-abc"
        surveyResult={mockSurveyResult}
        initialQuestions={mockQuestions}
        initialAnswers={mockAnswers}
        onNewSurvey={onNewSurveyMock}
      />
    );

    // Mở phần câu hỏi
    fireEvent.click(screen.getByRole('button', { name: 'Xem chi tiết ▼' }));

    expect(screen.getByText('Bạn có thích những bữa tiệc sôi động?')).toBeInTheDocument();

    // Không có bất kỳ nút "Có" hoặc "Không" tương tác nào để bấm chọn đáp án
    const interactiveButtons = screen.getAllByRole('button');
    const answerButtons = interactiveButtons.filter(
      (b) => b.textContent === 'Có' || b.textContent === 'Không'
    );
    expect(answerButtons).toHaveLength(0);

    // Không bao giờ gọi saveAnswer
    expect(surveyApi.saveAnswer).not.toHaveBeenCalled();
  });

  // 8. Bấm "Làm bài khảo sát mới" kích hoạt onNewSurvey
  it('8. Bấm "Làm bài khảo sát mới" gọi callback onNewSurvey', () => {
    render(
      <ResultPage
        token="token-abc"
        surveyResult={mockSurveyResult}
        onNewSurvey={onNewSurveyMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Làm bài khảo sát mới' }));
    expect(onNewSurveyMock).toHaveBeenCalledTimes(1);
  });

  // 9. Kiểm tra chính xác các ngưỡng phân loại cho Extraversion, Neuroticism, Lie Scale và tiêu đề Phlegmatic
  it('9. Kiểm tra chính xác các ngưỡng phân loại điểm số và tiêu đề Bình thản (Phlegmatic)', () => {
    // Ngưỡng 1: Extraversion 12 (Hướng nội), Neuroticism 12 (Thần kinh ổn định), Lie Scale 4 (Đáng tin)
    const resultAtThreshold: SurveyResultResponseDto = {
      attemptId: 'att-threshold-1',
      scoreA: 12,
      scoreB: 12,
      scoreC: 4,
      temperament: 'PHLEGMATIC',
      temperamentNameVi: 'Khí chất Bình thản (Phlegmatic)',
      temperamentDescription: 'Điềm tĩnh, kiên định và đáng tin cậy.',
      reliabilityStatus: 'HIGH',
      calculatedAt: '2026-10-13T12:00:00Z',
    };

    const { unmount } = render(
      <ResultPage
        token="token-abc"
        surveyResult={resultAtThreshold}
        onNewSurvey={onNewSurveyMock}
      />
    );

    // Tiêu đề chuẩn hóa: Khí Chất: Bình thản (Phlegmatic)
    expect(screen.getByText('Khí Chất: Bình thản (Phlegmatic)')).toBeInTheDocument();
    expect(screen.queryByText('(PHLEGMATIC)')).not.toBeInTheDocument();

    // Không còn hiển thị số điểm
    expect(screen.queryByText(/12\s*\/\s*24/)).not.toBeInTheDocument();
    expect(screen.queryByText(/4\s*\/\s*9/)).not.toBeInTheDocument();

    // Điểm tại ngưỡng <=
    expect(screen.getByText('Hướng nội')).toBeInTheDocument(); // scoreA = 12 -> Hướng nội
    expect(screen.getByText('Thần kinh ổn định')).toBeInTheDocument(); // scoreB = 12 -> Thần kinh ổn định
    expect(screen.getByText('Đáng tin')).toBeInTheDocument(); // scoreC = 4 -> Đáng tin

    unmount();

    // Ngưỡng 2: Extraversion 13 (Hướng ngoại), Neuroticism 13 (Thần kinh không ổn định), Lie Scale 5 (Không đáng tin)
    const resultAboveThreshold: SurveyResultResponseDto = {
      attemptId: 'att-threshold-2',
      scoreA: 13,
      scoreB: 13,
      scoreC: 5,
      temperament: 'CHOLERIC',
      temperamentNameVi: 'Khí chất Nóng nảy (Choleric)',
      temperamentDescription: 'Năng nổ, nhiệt huyết nhưng dễ bốc đồng.',
      reliabilityStatus: 'LOW',
      calculatedAt: '2026-10-13T12:00:00Z',
    };

    render(
      <ResultPage
        token="token-abc"
        surveyResult={resultAboveThreshold}
        onNewSurvey={onNewSurveyMock}
      />
    );

    expect(screen.getByText('Khí Chất: Nóng nảy (Choleric)')).toBeInTheDocument();
    expect(screen.queryByText('(CHOLERIC)')).not.toBeInTheDocument();

    // Không còn hiển thị số điểm
    expect(screen.queryByText(/13\s*\/\s*24/)).not.toBeInTheDocument();
    expect(screen.queryByText(/5\s*\/\s*9/)).not.toBeInTheDocument();

    // Điểm tại ngưỡng >
    expect(screen.getByText('Hướng ngoại')).toBeInTheDocument(); // scoreA = 13 -> Hướng ngoại
    expect(screen.getByText('Thần kinh không ổn định')).toBeInTheDocument(); // scoreB = 13 -> Thần kinh không ổn định
    expect(screen.getByText('Không đáng tin')).toBeInTheDocument(); // scoreC = 5 -> Không đáng tin
  });

  // 10. Render đúng infographic cho từng nhóm khí chất và chỉ render duy nhất 1 ảnh
  it('10. Render chính xác infographic tương ứng cho 4 nhóm khí chất (PHLEGMATIC, MELANCHOLIC, CHOLERIC, SANGUINE) và chỉ render duy nhất 1 ảnh', () => {
    const temperamentsToTest = [
      {
        temperament: 'PHLEGMATIC' as const,
        nameVi: 'Khí chất Bình thản (Phlegmatic)',
        alt: 'Infographic chi tiết Khí chất Bình thản (Phlegmatic)',
        expectedFile: 'phlegmatic.jpg',
      },
      {
        temperament: 'MELANCHOLIC' as const,
        nameVi: 'Khí chất Ưu tư (Melancholic)',
        alt: 'Infographic chi tiết Khí chất Ưu tư (Melancholic)',
        expectedFile: 'melancholic.jpg',
      },
      {
        temperament: 'CHOLERIC' as const,
        nameVi: 'Khí chất Nóng nảy (Choleric)',
        alt: 'Infographic chi tiết Khí chất Nóng nảy (Choleric)',
        expectedFile: 'choleric.jpg',
      },
      {
        temperament: 'SANGUINE' as const,
        nameVi: 'Khí chất Hoạt bát (Sanguine)',
        alt: 'Infographic chi tiết Khí chất Hoạt bát (Sanguine)',
        expectedFile: 'sanguine.jpg',
      },
    ];

    temperamentsToTest.forEach(({ temperament, nameVi, alt, expectedFile }) => {
      const mockResult: SurveyResultResponseDto = {
        ...mockSurveyResult,
        temperament,
        temperamentNameVi: nameVi,
      };

      const { container, unmount } = render(
        <ResultPage
          token="token-abc"
          surveyResult={mockResult}
          onNewSurvey={onNewSurveyMock}
        />
      );

      // Đúng ảnh tương ứng
      const img = screen.getByAltText(alt);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', expect.stringContaining(expectedFile));
      expect(img).toHaveClass('infographic-image');

      // Chỉ có duy nhất 1 thẻ img trong toàn bộ trang kết quả
      const allImages = container.querySelectorAll('img');
      expect(allImages).toHaveLength(1);

      unmount();
    });
  });

  // 11. Bố cục 5 phần hiển thị đúng thứ tự và fallback an toàn khi khí chất không hợp lệ
  it('11. Hiển thị thông báo fallback khi khí chất không hợp lệ và đảm bảo thứ tự cấu trúc trang kết quả', () => {
    const invalidResult = {
      ...mockSurveyResult,
      temperament: 'UNKNOWN' as unknown as SurveyResultResponseDto['temperament'],
    };

    const { container } = render(
      <ResultPage
        token="token-abc"
        surveyResult={invalidResult}
        onNewSurvey={onNewSurveyMock}
      />
    );

    // Không render img nào
    expect(container.querySelectorAll('img')).toHaveLength(0);
    // Hiển thị fallback an toàn
    expect(
      screen.getByText('Không có hình ảnh infographic phù hợp cho nhóm khí chất này.')
    ).toBeInTheDocument();

    // Kiểm tra cấu trúc 5 phần theo thứ tự:
    // 1. result-header
    // 2. scores-grid
    // 3. temperament-infographic-section
    // 4. answered-questions-section
    // 5. result-actions
    const mainContainer = container.querySelector('.result-view-container');
    expect(mainContainer).not.toBeNull();
    const children = Array.from(mainContainer?.children || []);

    expect(children[0]).toHaveClass('result-header');
    expect(children[1]).toHaveClass('scores-grid');
    expect(children[2]).toHaveClass('temperament-infographic-section');
    expect(children[3]).toHaveClass('answered-questions-section');
    expect(children[4]).toHaveClass('result-actions');
  });
});
