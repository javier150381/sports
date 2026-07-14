export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTH_FAILED'
  | 'REGISTER_FAILED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'

export type ApiResponse<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: { code: ApiErrorCode; message: string } }

export type ActionResult<T> = ApiResponse<T>

export function apiSuccess<T>(data: T): ApiResponse<T> {
  return { success: true, data, error: null }
}

export function apiError(code: ApiErrorCode, message: string): ApiResponse<null> {
  return { success: false, data: null, error: { code, message } }
}
