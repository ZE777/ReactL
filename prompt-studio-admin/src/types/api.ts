export type ApiError = {
  type?: string
  title: string
  detail: string
  status: number
}

export type ApiResponse<T> = {
  success: boolean
  data: T | null
  message?: string | null
}
