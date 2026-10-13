const SURVEY_TOKEN_KEY = 'eysenck_survey_token';

export const storage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(SURVEY_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken(token: string): void {
    try {
      localStorage.setItem(SURVEY_TOKEN_KEY, token);
    } catch {
      // Bỏ qua lỗi trong môi trường ẩn danh/private mode nếu localStorage bị chặn
    }
  },

  clearToken(): void {
    try {
      localStorage.removeItem(SURVEY_TOKEN_KEY);
    } catch {
      // Bỏ qua
    }
  },
};
