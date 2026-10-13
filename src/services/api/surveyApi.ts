import type {
  SaveAnswerRequestDto,
  StartSurveyResponseDto,
  SurveyResumeResponseDto,
  SurveyResultResponseDto,
} from '../../types/survey';
import { request } from './client';

export const surveyApi = {
  /**
   * Bắt đầu một lượt khảo sát ẩn danh mới.
   * POST /api/surveys/start
   */
  startSurvey(): Promise<StartSurveyResponseDto> {
    return request<StartSurveyResponseDto>('/api/surveys/start', {
      method: 'POST',
    });
  },

  /**
   * Khôi phục phiên làm bài bằng token lưu ở client.
   * GET /api/surveys/resume
   */
  resumeSurvey(token: string): Promise<SurveyResumeResponseDto> {
    return request<SurveyResumeResponseDto>('/api/surveys/resume', {
      method: 'GET',
      token,
    });
  },

  /**
   * Lưu câu trả lời cho một câu hỏi.
   * POST /api/surveys/answers
   */
  saveAnswer(token: string, data: SaveAnswerRequestDto): Promise<void> {
    return request<void>('/api/surveys/answers', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  },

  /**
   * Hoàn thành bài làm và nhận kết quả tính điểm.
   * POST /api/surveys/complete
   */
  completeSurvey(token: string): Promise<SurveyResultResponseDto> {
    return request<SurveyResultResponseDto>('/api/surveys/complete', {
      method: 'POST',
      token,
    });
  },

  /**
   * Xem lại kết quả của attempt đã hoàn thành.
   * GET /api/surveys/result
   */
  getResult(token: string): Promise<SurveyResultResponseDto> {
    return request<SurveyResultResponseDto>('/api/surveys/result', {
      method: 'GET',
      token,
    });
  },
};
