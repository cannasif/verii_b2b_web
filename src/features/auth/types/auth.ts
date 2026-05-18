import { z } from 'zod';
import type { ApiResponse } from '@/types/api';

export const loginRequestSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(1, 'Şifre zorunludur'),
  branchId: z.string().min(1, 'Şube seçimi zorunludur'),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const registerRequestSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export type LoginResponse = ApiResponse<string>;

export interface Branch {
  id: string;
  name: string;
  code?: string;
}

export interface UserDto {
  id: number;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  role: string;
  isEmailConfirmed: boolean;
  isActive: boolean;
  lastLoginDate: string | null;
  fullName: string;
  creationTime: string | null;
  lastModificationTime: string | null;
}

export type ActiveUsersResponse = ApiResponse<UserDto[]>;

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const forgotPasswordSchema = z.object({
  email: z.string().email('auth.validation.emailInvalid'),
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'auth.validation.tokenRequired'),
  newPassword: z.string().min(6, 'auth.validation.newPasswordMinLength'),
  confirmPassword: z.string().min(6, 'auth.validation.confirmPasswordRequired'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'auth.validation.passwordsMismatch',
  path: ['confirmPassword'],
});

export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
