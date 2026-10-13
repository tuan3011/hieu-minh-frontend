export type SectionCode = 'A' | 'B' | 'C';

export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED';

export type Temperament = 'PHLEGMATIC' | 'MELANCHOLIC' | 'SANGUINE' | 'CHOLERIC';

export interface QuestionDto {
  id: string;
  questionNo: number;
  content: string;
  sectionCode: SectionCode;
}

export interface StartSurveyResponseDto {
  attemptId: string;
  token: string;
  versionCode: string;
  expiresAt: string;
  questions: QuestionDto[];
}

export interface SaveAnswerRequestDto {
  questionId: string;
  answerYes: boolean;
}

export interface SurveyResumeResponseDto {
  attemptId: string;
  status: AttemptStatus;
  expiresAt: string;
  completedAt: string | null;
  answeredCount: number;
  answers: Record<string, boolean>;
  questions: QuestionDto[];
}

export interface SurveyResultResponseDto {
  attemptId: string;
  scoreA: number;
  scoreB: number;
  scoreC: number;
  temperament: Temperament;
  temperamentNameVi: string;
  temperamentDescription: string;
  reliabilityStatus: string | null;
  calculatedAt: string;
}

export interface ErrorResponseDto {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  validationErrors?: Record<string, string> | null;
}
