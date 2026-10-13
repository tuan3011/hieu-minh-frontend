import type { ErrorResponseDto } from '../../types/survey';

export class ApiError extends Error {
  status: number;
  errorResponse?: ErrorResponseDto;

  constructor(status: number, message: string, errorResponse?: ErrorResponseDto) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorResponse = errorResponse;
  }
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

interface RequestOptions extends RequestInit {
  token?: string | null;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers = {}, ...customConfig } = options;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['X-Survey-Token'] = token;
  }

  const url = `${BASE_URL}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        ...defaultHeaders,
        ...(headers as Record<string, string>),
      },
      ...customConfig,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    throw new ApiError(0, `Không thể kết nối tới máy chủ backend (${BASE_URL || 'local proxy'}): ${message}`);
  }

  if (!response.ok) {
    let errorDto: ErrorResponseDto | undefined;
    let errorMessage = `Yêu cầu thất bại với mã lỗi HTTP ${response.status}`;

    try {
      const text = await response.text();
      if (text) {
        errorDto = JSON.parse(text) as ErrorResponseDto;
        if (errorDto.message) {
          errorMessage = errorDto.message;
        }
      }
    } catch {
      // Phản hồi không phải định dạng JSON
    }

    throw new ApiError(response.status, errorMessage, errorDto);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}
