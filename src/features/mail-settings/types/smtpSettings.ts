import { z } from 'zod';

export interface SmtpSettingsDto {
  host: string;
  port: number;
  enableSsl: boolean;
  username: string;
  fromEmail: string;
  fromName: string;
  timeout: number;
  updatedAt?: string;
}

export interface UpdateSmtpSettingsDto {
  host: string;
  port: number;
  enableSsl: boolean;
  username: string;
  password?: string;
  fromEmail: string;
  fromName: string;
  timeout: number;
}

export const smtpSettingsFormSchema = z.object({
  host: z.string().min(1, 'common.required'),
  port: z.coerce.number().int().min(1, 'common.required').max(65535),
  enableSsl: z.boolean(),
  username: z.string().min(1, 'common.required'),
  password: z.string().optional(),
  fromEmail: z.string().min(1, 'common.required').email('mailSettings.Fields.FromEmail'),
  fromName: z.string().min(1, 'common.required'),
  timeout: z.coerce.number().int().min(1, 'common.required').max(300),
});

export type SmtpSettingsFormSchema = z.infer<typeof smtpSettingsFormSchema>;
