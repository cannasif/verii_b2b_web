import { type ReactElement, useEffect } from 'react';
import { type Resolver, type SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { isZodFieldRequired } from '@/lib/zod-required';
import { useSendTestMailMutation } from '../hooks/useSendTestMailMutation';
import {
  smtpSettingsFormSchema,
  type SmtpSettingsDto,
  type SmtpSettingsFormSchema,
} from '../types/smtpSettings';

interface MailSettingsFormProps {
  data: SmtpSettingsDto | undefined;
  isLoading: boolean;
  onSubmit: (data: SmtpSettingsFormSchema) => void | Promise<void>;
  isSubmitting: boolean;
}

export function MailSettingsForm({
  data,
  isLoading,
  onSubmit,
  isSubmitting,
}: MailSettingsFormProps): ReactElement {
  const { t } = useTranslation();
  const testMailMutation = useSendTestMailMutation();

  const form = useForm<SmtpSettingsFormSchema>({
    resolver: zodResolver(smtpSettingsFormSchema) as Resolver<SmtpSettingsFormSchema>,
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      host: '',
      port: 587,
      enableSsl: true,
      username: '',
      password: '',
      fromEmail: '',
      fromName: '',
      timeout: 30,
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        host: data.host,
        port: data.port,
        enableSsl: data.enableSsl,
        username: data.username,
        password: '',
        fromEmail: data.fromEmail,
        fromName: data.fromName,
        timeout: data.timeout,
      });
    }
  }, [data, form]);

  const handleSubmit: SubmitHandler<SmtpSettingsFormSchema> = (values) => {
    onSubmit(values);
  };

  if (isLoading) {
    return (
      <Card className="rounded-2xl border border-slate-300/80 bg-white/70 shadow-sm backdrop-blur-xl dark:border-white/15 dark:bg-[#190b20]/60">
        <CardContent className="pt-6">
          <p className="text-sm font-medium text-muted-foreground">{t('common.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card className="rounded-2xl border border-slate-300/80 bg-white/70 shadow-sm backdrop-blur-xl dark:border-white/15 dark:bg-[#180F22]/60">
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-muted-foreground">
                      {t('mailSettings.Fields.Host')}
                      {isZodFieldRequired(smtpSettingsFormSchema, 'host') && <span className="ml-1 text-red-500">*</span>}
                    </FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="smtp.gmail.com" {...field} className="rounded-xl border-slate-200 bg-white text-foreground dark:border-[#3b3142] dark:bg-[#0C0516]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-muted-foreground">
                      {t('mailSettings.Fields.Port')}
                      {isZodFieldRequired(smtpSettingsFormSchema, 'port') && <span className="ml-1 text-red-500">*</span>}
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={65535} {...field} onChange={(event) => field.onChange(event.target.value === '' ? 0 : Number(event.target.value))} className="rounded-xl border-slate-200 bg-white text-foreground dark:border-[#3b3142] dark:bg-[#0C0516]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="enableSsl"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-300/50 p-4 px-3 dark:border-white/10 dark:bg-[#180F22]">
                  <FormLabel className="text-sm font-medium">{t('mailSettings.Fields.EnableSsl')}</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-muted-foreground">
                      {t('mailSettings.Fields.Username')}
                      {isZodFieldRequired(smtpSettingsFormSchema, 'username') && <span className="ml-1 text-red-500">*</span>}
                    </FormLabel>
                    <FormControl>
                      <Input type="text" {...field} className="rounded-xl border-slate-200 bg-white text-foreground dark:border-[#3b3142] dark:bg-[#0C0516]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-muted-foreground">{t('mailSettings.Fields.Password')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t('mailSettings.Fields.PasswordPlaceholder')} {...field} className="rounded-xl border-slate-200 bg-white text-foreground dark:border-[#3b3142] dark:bg-[#0C0516]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fromName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-muted-foreground">
                      {t('mailSettings.Fields.FromName')}
                      {isZodFieldRequired(smtpSettingsFormSchema, 'fromName') && <span className="ml-1 text-red-500">*</span>}
                    </FormLabel>
                    <FormControl>
                      <Input type="text" {...field} className="rounded-xl border-slate-200 bg-white text-foreground dark:border-[#3b3142] dark:bg-[#0C0516]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fromEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-muted-foreground">
                      {t('mailSettings.Fields.FromEmail')}
                      {isZodFieldRequired(smtpSettingsFormSchema, 'fromEmail') && <span className="ml-1 text-red-500">*</span>}
                    </FormLabel>
                    <FormControl>
                      <Input type="email" {...field} className="rounded-xl border-slate-200 bg-white text-foreground dark:border-[#3b3142] dark:bg-[#0C0516]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timeout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-muted-foreground">
                      {t('mailSettings.Fields.Timeout')}
                      {isZodFieldRequired(smtpSettingsFormSchema, 'timeout') && <span className="ml-1 text-red-500">*</span>}
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={300} {...field} onChange={(event) => field.onChange(event.target.value === '' ? 0 : Number(event.target.value))} className="rounded-xl border-slate-200 bg-white text-foreground dark:border-[#3b3142] dark:bg-[#0C0516]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => testMailMutation.mutate({})}
            disabled={isSubmitting || testMailMutation.isPending}
            className="h-11 rounded-xl px-6 font-black"
          >
            {testMailMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {testMailMutation.isPending ? t('mailSettings.TestMail.Sending') : t('mailSettings.TestMail.Send')}
          </Button>
          <Button type="submit" disabled={isSubmitting || !form.formState.isValid} className="h-11 rounded-xl px-8 font-black">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
