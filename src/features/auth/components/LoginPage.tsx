import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation, Trans } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { loginRequestSchema, type LoginRequest } from '../types/auth';
import { useLogin } from '../hooks/useLogin';
import { useBranches } from '../hooks/useBranches';
import { useAuthStore } from '@/stores/auth-store';
import { isTokenValid } from '@/utils/jwt';
import type React from 'react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { AuthBackground } from './AuthBackground';
import logo from '@/assets/v3logo.png';
import {
  Building2,
  Eye,
  EyeOff,
  Globe2,
  Hash,
  Instagram,
  Lock,
  Mail,
  MessageCircle,
  Pause,
  Phone,
  Play,
  Send,
  TriangleAlert,
} from 'lucide-react';
import { WmsBackgroundAnimation } from './WmsBackgroundAnimation';

export function LoginPage(): React.JSX.Element {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: branches } = useBranches();
  const { mutate: loginMutate, isPending } = useLogin(branches);
  const { token, isAuthenticated, logout } = useAuthStore();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [isBgAnimationPaused, setIsBgAnimationPaused] = useState(true);

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: {
      email: '',
      password: '',
      branchId: '',
    },
  });

  useEffect(() => {
    if (searchParams.get('sessionExpired') === 'true') {
      if (!token || !isTokenValid(token)) {
        logout();
        toast.warning(t('auth.login.sessionExpired'));
      }
      setSearchParams({}, { replace: true });
    }

    if (token && isTokenValid(token) && isAuthenticated()) {
      navigate('/', { replace: true });
    }
  }, [searchParams, setSearchParams, t, token, isAuthenticated, navigate, logout]);

  const onSubmit = (data: LoginRequest): void => {
    form.clearErrors('root');
    loginMutate(data, {
      onError: (error: Error) => {
        const status = isAxiosError(error) ? error.response?.status : undefined;
        const raw = (error.message ?? '').trim();
        const message =
          status === 401 ? (raw || t('auth.login.wrongPassword')) : (raw || t('auth.login.loginError'));
        form.setError('root', { type: 'server', message });
      },
    });
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#070d1f] text-white">
      <style>{`
        input { color-scheme: dark; }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #0b1228 inset !important;
            -webkit-text-fill-color: white !important;
            transition: background-color 5000s ease-in-out 0s;
            caret-color: white;
        }
      `}</style>

      <div className="absolute inset-0 z-0 transition-opacity duration-1000 opacity-100">
        <div className="absolute left-[-12%] top-[-12%] h-[58vw] w-[58vw] rounded-full bg-cyan-900/20 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[58vw] w-[58vw] rounded-full bg-blue-900/20 blur-[120px] mix-blend-screen" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-[#070d1f]/60 to-[#070d1f]" />
      </div>

      <AuthBackground isActive isPaused={isBgAnimationPaused} />

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <button
          type="button"
          onClick={() => setIsBgAnimationPaused((p) => !p)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#0b1228]/80 text-slate-300 transition hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-300"
          title={isBgAnimationPaused ? t('auth.login.startAnimation') : t('auth.login.stopAnimation')}
          aria-label={isBgAnimationPaused ? t('auth.login.startAnimation') : t('auth.login.stopAnimation')}
        >
          {isBgAnimationPaused ? <Play size={18} /> : <Pause size={18} />}
        </button>
        <LanguageSwitcher variant="pill" />
      </div>

      <div className="relative z-10 flex h-full w-full items-center justify-center px-4 py-8">
        <div className="w-full max-w-[480px] -translate-y-16 overflow-hidden rounded-3xl border border-white/10 bg-[#0b1228]/70 shadow-[0_0_10px_2px_rgba(255,255,255,0.04),inset_0_0_10px_2px_rgba(255,255,255,0.04),0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="relative overflow-hidden px-6 pt-12 pb-22 sm:px-10">
            <WmsBackgroundAnimation isPaused={isBgAnimationPaused} />
            <div className="relative z-10 mb-6 text-center">
              <div className="mx-auto mb-4 flex justify-center">
                <img src={logo} alt="V3RII B2B" className="h-42 w-auto object-contain" />
              </div>
              <h1 className="text-sm tracking-tight text-white/70">{t('auth.login.title')}</h1>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <div className="group relative">
                        <Building2
                          className={`absolute left-4 top-1/2 z-10 -translate-y-1/2 ${fieldState.invalid ? 'text-red-400' : 'text-slate-400 group-focus-within:text-cyan-300'}`}
                          size={18}
                        />
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger
                              className={`!h-14 w-full rounded-xl px-12 pr-4 text-sm text-white transition-all focus:ring-0 ${fieldState.invalid
                                ? 'border-2 border-red-500 bg-red-950/25 ring-2 ring-red-500/40 focus-visible:!border-red-500 focus-visible:!ring-2 focus-visible:!ring-red-500/40'
                                : 'border border-white/15 bg-black/25 focus:border-cyan-500 focus-visible:!border-cyan-500'
                                }`}
                            >
                              <SelectValue placeholder={t('auth.login.selectBranch')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="border-white/10 bg-[#0b1228] text-white">
                            {branches?.length ? (
                              branches.map((branch) => (
                                <SelectItem key={branch.id} value={branch.id} className="h-14 cursor-pointer focus:bg-cyan-500/20 focus:text-white">
                                  {branch.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-branch" disabled className="h-14 focus:text-white">
                                {t('auth.login.branchNotFound')}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage className="text-xs text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => {
                    const authFailed = !!form.formState.errors.root;
                    const invalid = Boolean(fieldState.error) || authFailed;
                    return (
                      <FormItem>
                        <div className="group relative">
                          <Mail
                            className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 ${invalid ? 'text-red-400' : 'text-slate-400 group-focus-within:text-cyan-300'}`}
                            size={18}
                          />
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder={t('auth.login.emailPlaceholder')}
                              className={`h-14 rounded-xl px-12 pr-4 text-sm text-white placeholder:text-slate-500 ${invalid
                                ? 'border-2 border-red-500 bg-red-950/25 ring-2 ring-red-500/40 focus-visible:!border-red-500 focus-visible:!ring-2 focus-visible:!ring-red-500/40'
                                : 'border border-white/15 bg-black/25 focus-visible:!border-cyan-500 focus-visible:!ring-cyan-500/35'
                                }`}
                              onChange={(e) => {
                                form.clearErrors('root');
                                field.onChange(e);
                              }}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-xs text-red-400" />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => {
                    const authFailed = !!form.formState.errors.root;
                    const invalid = Boolean(fieldState.error) || authFailed;
                    return (
                      <FormItem>
                        <div className="group relative">
                          <Lock
                            className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 ${invalid ? 'text-red-400' : 'text-slate-400 group-focus-within:text-cyan-300'}`}
                            size={18}
                          />
                          <FormControl>
                            <Input
                              {...field}
                              type={isPasswordVisible ? 'text' : 'password'}
                              placeholder={t('auth.login.passwordPlaceholder')}
                              className={`h-14 rounded-xl px-12 pr-11 text-sm text-white placeholder:text-slate-500 ${invalid
                                ? 'border-2 border-red-500 bg-red-950/25 ring-2 ring-red-500/40 focus-visible:!border-red-500 focus-visible:!ring-2 focus-visible:!ring-red-500/40'
                                : 'border border-white/15 bg-black/25 focus-visible:!border-cyan-500 focus-visible:!ring-cyan-500/35'
                                }`}
                              onChange={(e) => {
                                form.clearErrors('root');
                                field.onChange(e);
                              }}
                              onKeyDown={(e) => setCapsLockActive(e.getModifierState('CapsLock'))}
                              onKeyUp={(e) => setCapsLockActive(e.getModifierState('CapsLock'))}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setIsPasswordVisible((prev) => !prev)}
                            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-slate-400 transition-colors hover:text-cyan-300"
                          >
                            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        <div className="min-h-[18px]">
                          {form.formState.errors.root ? (
                            <p className="text-xs text-red-400" role="alert">
                              {form.formState.errors.root.message}
                            </p>
                          ) : fieldState.error ? (
                            <FormMessage className="text-xs text-red-400" />
                          ) : capsLockActive ? (
                            <div className="mt-1 flex w-fit items-center gap-1 rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-xs text-amber-300">
                              <TriangleAlert size={12} />
                              {t('auth.login.capsLockOn')}
                            </div>
                          ) : null}
                        </div>
                      </FormItem>
                    );
                  }}
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-cyan-300 transition hover:text-cyan-200 hover:underline"
                    onClick={() => navigate('/auth/forgot-password')}
                  >
                    {t('auth.login.forgotPassword')}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="mt-2 h-12 w-full rounded-xl bg-linear-to-r from-cyan-600 via-blue-600 to-orange-400 text-sm font-semibold uppercase tracking-wide text-white hover:opacity-95"
                  disabled={isPending}
                >
                  {isPending ? t('auth.login.loggingIn') : t('auth.login.loginButton')}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
      <div className="absolute bottom-35 left-0 right-0 z-10 text-center">
        <p className="px-4 text-sm font-light tracking-[0.2em] text-white/50 uppercase sm:text-base">
          <Trans
            i18nKey="auth.login.slogan"
            components={{
              brand: (
                <span className="bg-linear-to-r from-pink-400 to-yellow-400 bg-clip-text font-bold text-transparent border-b border-pink-500/20 pb-0.5">
                  v3rii
                </span>
              ),
            }}
          />
        </p>

      </div>
      <div className="absolute bottom-15 left-0 right-0 z-10  flex flex-wrap items-center justify-center gap-4 px-4">
        <a href="tel:+905070123018" className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900/60 border border-white/10 text-slate-200 hover:text-lime-400 hover:bg-zinc-800 hover:border-lime-500/30 hover:shadow-[0_0_15px_rgba(132,204,22,0.3)] hover:scale-110 transition-all duration-300 group shadow-lg">
          <Phone size={20} />
        </a>

        <a href="https://v3rii.com" target="_blank" rel="noreferrer" className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900/60 border border-white/10 text-slate-200 hover:text-pink-400 hover:bg-zinc-800 hover:border-pink-500/30 hover:shadow-[0_0_15px_rgba(244,114,182,0.3)] hover:scale-110 transition-all duration-300 group shadow-lg">
          <Globe2 size={20} />
        </a>

        <a href="mailto:info@v3rii.com" className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900/60 border border-white/10 text-slate-200 hover:text-orange-400 hover:bg-zinc-800 hover:border-orange-500/30 hover:shadow-[0_0_15px_rgba(251,146,60,0.3)] hover:scale-110 transition-all duration-300 group shadow-lg">
          <Mail size={20} />
        </a>

        <a href="https://wa.me/905070123018" target="_blank" rel="noreferrer" className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900/60 border border-white/10 text-slate-200 hover:text-emerald-400 hover:bg-zinc-800 hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:scale-110 transition-all duration-300 group shadow-lg">
          <MessageCircle size={20} />
        </a>

        <button
          type="button"
          onClick={() => toast.info(t('auth.login.comingSoon', 'Çok yakında!'))}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900/60 border border-white/10 text-slate-200 hover:text-sky-400 hover:bg-zinc-800 hover:border-sky-500/30 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:scale-110 transition-all duration-300 group shadow-lg"
        >
          <Send size={20} />
        </button>

        <button
          type="button"
          onClick={() => toast.info(t('auth.login.comingSoon', 'Çok yakında!'))}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900/60 border border-white/10 text-slate-200 hover:text-fuchsia-400 hover:bg-zinc-800 hover:border-fuchsia-500/30 hover:shadow-[0_0_15px_rgba(232,121,249,0.3)] hover:scale-110 transition-all duration-300 group shadow-lg"
        >
          <Instagram size={20} />
        </button>

        <button
          type="button"
          onClick={() => toast.info(t('auth.login.comingSoon', 'Çok yakında!'))}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900/60 border border-white/10 text-slate-200 hover:text-white hover:bg-zinc-800 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-110 transition-all duration-300 group shadow-lg"
        >
          <Hash size={20} />
        </button>
      </div>
    </div>
  );
}
