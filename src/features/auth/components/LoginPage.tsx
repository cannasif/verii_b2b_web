import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
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
import logo from '@/assets/v3logo.png';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Eye,
  EyeOff,
  FileText,
  Layers3,
  Lock,
  Mail,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';

const portalHighlights = [
  { icon: PackageSearch, label: 'Kişiye özel katalog', text: 'Cari, grup ve görünürlük kurallarıyla doğru ürün vitrini.' },
  { icon: BadgeCheck, label: 'Net fiyat ve stok', text: 'Sepete düşmeden önce müşteri fiyatı ve satılabilir stok kontrolü.' },
  { icon: FileText, label: 'Tekliften siparişe', text: 'Pazarlık, onay ve tekrar sipariş akışları tek müşteri portalında.' },
];

export function LoginPage(): React.JSX.Element {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: branches, isLoading: branchesLoading, error: branchesError, refetch: refetchBranches } = useBranches();
  const { mutate: loginMutate, isPending } = useLogin(branches);
  const { token, isAuthenticated, logout } = useAuthStore();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);

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
      navigate('/dashboard', { replace: true });
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
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px hsl(var(--background)) inset !important;
          -webkit-text-fill-color: hsl(var(--foreground)) !important;
          caret-color: hsl(var(--foreground));
        }

        @keyframes b2b-fade-up {
          from { opacity: 0; transform: translate3d(0, 18px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }

        @keyframes b2b-float {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(0, -14px, 0) rotate(1.2deg); }
        }

        @keyframes b2b-orbit {
          from { transform: rotate(0deg) translateX(16px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(16px) rotate(-360deg); }
        }

        @keyframes b2b-scan {
          0% { transform: translateX(-110%); opacity: 0; }
          18% { opacity: 0.65; }
          82% { opacity: 0.65; }
          100% { transform: translateX(110%); opacity: 0; }
        }

        @keyframes b2b-step-pulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }

        .b2b-appear { animation: b2b-fade-up 720ms cubic-bezier(.2,.8,.2,1) both; }
        .b2b-delay-1 { animation-delay: 90ms; }
        .b2b-delay-2 { animation-delay: 180ms; }
        .b2b-delay-3 { animation-delay: 270ms; }
        .b2b-float { animation: b2b-float 7s ease-in-out infinite; }
        .b2b-orbit { animation: b2b-orbit 18s linear infinite; }
        .b2b-scan { animation: b2b-scan 4.8s ease-in-out infinite; }
        .b2b-step-pulse { animation: b2b-step-pulse 2.4s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .b2b-appear,
          .b2b-float,
          .b2b-orbit,
          .b2b-scan,
          .b2b-step-pulse {
            animation: none !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(20,83,45,0.18),transparent_30%),radial-gradient(circle_at_86%_12%,rgba(245,158,11,0.18),transparent_28%),linear-gradient(135deg,#f9f2df_0%,#e9f2e6_48%,#d9eadc_100%)] dark:bg-[radial-gradient(circle_at_14%_18%,rgba(20,184,166,0.16),transparent_30%),radial-gradient(circle_at_86%_12%,rgba(236,72,153,0.14),transparent_28%),linear-gradient(135deg,#080312_0%,#130822_52%,#071a20_100%)]" />
        <div className="b2b-orbit absolute left-[-8rem] top-20 h-80 w-80 rounded-full border border-emerald-800/10 dark:border-cyan-300/10" />
        <div className="b2b-float absolute right-[-10rem] top-[-7rem] h-[32rem] w-[32rem] rounded-full bg-white/35 blur-3xl dark:bg-cyan-500/10" />
        <div className="absolute bottom-0 left-0 right-0 h-44 bg-linear-to-t from-[#203522]/15 to-transparent dark:from-black/40" />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden flex-col justify-between p-10 lg:flex xl:p-14">
          <div className="b2b-appear flex items-center gap-3">
            <img src={logo} alt="V3RII B2B" className="h-16 w-auto" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-900/55 dark:text-cyan-300/70">V3RII B2B</p>
              <p className="text-sm font-semibold text-emerald-950 dark:text-slate-100">ERP uyumlu müşteri portalı</p>
            </div>
          </div>

          <div className="max-w-3xl space-y-8">
            <div className="b2b-appear b2b-delay-1 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-900/10 bg-white/55 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-cyan-100">
              <Sparkles size={16} />
              Müşteri fiyatı, stok ve teklif akışı tek kapıda
            </div>
            <div className="b2b-appear b2b-delay-2 space-y-5">
              <h1 className="text-5xl font-black leading-[0.96] tracking-[-0.055em] text-[#152016] dark:text-white xl:text-7xl">
                Kurumsal alıcılar için sakin, hızlı, net B2B sipariş deneyimi.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-emerald-950/70 dark:text-slate-300">
                Self-servis sipariş, kişiselleştirilmiş katalog, fiyat/stok görünürlüğü ve hesap erişimini girişten
                itibaren hissettiren bir portal dili kullanıyoruz.
              </p>
            </div>

            <div className="grid max-w-4xl gap-4 xl:grid-cols-3">
              {portalHighlights.map((item, index) => (
                <div key={item.label} className={`b2b-appear rounded-[2rem] border border-emerald-900/10 bg-white/55 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/8 ${index === 0 ? 'b2b-delay-1' : index === 1 ? 'b2b-delay-2' : 'b2b-delay-3'}`}>
                  <item.icon className="mb-4 text-emerald-800 dark:text-cyan-300" size={26} />
                  <p className="font-black text-emerald-950 dark:text-white">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-950/65 dark:text-slate-300">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="b2b-appear b2b-delay-3 max-w-2xl rounded-[2rem] border border-emerald-900/10 bg-white/45 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/8">
              <div className="relative mb-5 h-1 overflow-hidden rounded-full bg-emerald-950/10 dark:bg-white/10">
                <div className="b2b-scan absolute inset-y-0 w-1/2 rounded-full bg-linear-to-r from-transparent via-emerald-700 to-transparent dark:via-cyan-300" />
              </div>
              <div className="grid grid-cols-4 gap-3 text-center text-[11px] font-black uppercase tracking-[0.12em] text-emerald-950/60 dark:text-slate-300">
                {['Cari', 'Katalog', 'Fiyat/Stok', 'Sipariş'].map((step, index) => (
                  <div key={step} className="space-y-2">
                    <span className={`b2b-step-pulse mx-auto block h-2.5 w-2.5 rounded-full bg-emerald-800 dark:bg-cyan-300 ${index === 1 ? 'b2b-delay-1' : index === 2 ? 'b2b-delay-2' : index === 3 ? 'b2b-delay-3' : ''}`} />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="b2b-appear b2b-delay-3 flex items-center gap-3 text-sm font-semibold text-emerald-950/60 dark:text-slate-300">
            <ShieldCheck size={18} />
            Cari hesaplar, buyer rolleri ve ticari politika katmanı için tasarlandı.
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8">
          <div className="b2b-appear b2b-delay-2 w-full max-w-[520px] overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_30px_90px_rgba(27,50,32,0.22)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#130822]/88 dark:shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
            <div className="border-b border-emerald-900/10 bg-[#fffaf0]/80 px-6 py-5 dark:border-white/10 dark:bg-white/5 sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 lg:hidden">
                  <img src={logo} alt="V3RII B2B" className="h-12 w-auto" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-900/55 dark:text-cyan-300/70">V3RII</p>
                    <p className="text-sm font-semibold text-emerald-950 dark:text-white">B2B Portal</p>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-900/50 dark:text-cyan-300/70">Buyer access</p>
                  <p className="text-sm font-semibold text-emerald-950 dark:text-white">Güvenli müşteri girişi</p>
                </div>
                <LanguageSwitcher variant="pill" />
              </div>
            </div>

            <div className="px-6 py-8 sm:px-8">
              <div className="mb-7 space-y-2">
                <h2 className="text-3xl font-black tracking-[-0.04em] text-emerald-950 dark:text-white">B2B hesabına giriş yap</h2>
                <p className="text-sm leading-6 text-emerald-950/65 dark:text-slate-300">
                  Şubeni seç, cari hesabına bağlı katalog, fiyat, stok ve sipariş ekranlarına devam et.
                </p>
              </div>

              {branchesError ? (
                <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                  Şubeler alınamadı. API localde HTTP çalışıyor olmalı: <strong>http://localhost:5000</strong>
                  <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void refetchBranches()}>
                    Şubeleri Yenile
                  </Button>
                </div>
              ) : null}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <FormField
                    control={form.control}
                    name="branchId"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <div className="group relative">
                          <Building2 className={`absolute left-4 top-1/2 z-10 -translate-y-1/2 ${fieldState.invalid ? 'text-red-600 dark:text-red-400' : 'text-emerald-800 group-focus-within:text-emerald-700 dark:text-cyan-300 dark:group-focus-within:text-cyan-200'}`} size={18} />
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className={`!h-14 w-full rounded-2xl px-12 pr-4 text-base font-semibold text-emerald-950 shadow-sm transition-all focus:ring-0 dark:text-white [&>span]:text-emerald-950 [&>span]:opacity-100 dark:[&>span]:text-white ${fieldState.invalid ? 'border-2 border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-950/30' : 'border border-emerald-900/20 bg-white focus:border-emerald-700 dark:border-white/10 dark:bg-white/5 dark:focus:border-cyan-400/60'}`}>
                                <SelectValue placeholder={branchesLoading ? 'Şubeler yükleniyor...' : t('auth.login.selectBranch')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="border-emerald-900/10 bg-[#fffaf0] text-emerald-950 dark:border-white/10 dark:bg-[#130822] dark:text-white">
                              {branches?.length ? (
                                branches.map((branch) => (
                                  <SelectItem key={branch.id} value={branch.id} className="h-12 cursor-pointer focus:bg-emerald-100 dark:focus:bg-white/10">
                                    {branch.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-branch" disabled className="h-12">
                                  {t('auth.login.branchNotFound')}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage className="text-xs text-red-500" />
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
                            <Mail className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 ${invalid ? 'text-red-600 dark:text-red-400' : 'text-emerald-800 group-focus-within:text-emerald-700 dark:text-cyan-300 dark:group-focus-within:text-cyan-200'}`} size={18} />
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                placeholder={t('auth.login.emailPlaceholder')}
                                className={`h-14 rounded-2xl px-12 pr-4 text-base font-semibold text-emerald-950 shadow-sm placeholder:text-emerald-950/55 dark:text-white dark:placeholder:text-slate-400 ${invalid ? 'border-2 border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-950/30' : 'border border-emerald-900/20 bg-white focus-visible:!border-emerald-700 focus-visible:!ring-emerald-700/20 dark:border-white/10 dark:bg-white/5 dark:focus-visible:!border-cyan-400/60 dark:focus-visible:!ring-cyan-400/20'}`}
                                onChange={(event) => {
                                  form.clearErrors('root');
                                  field.onChange(event);
                                }}
                              />
                            </FormControl>
                          </div>
                          <FormMessage className="text-xs text-red-500" />
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
                            <Lock className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 ${invalid ? 'text-red-600 dark:text-red-400' : 'text-emerald-800 group-focus-within:text-emerald-700 dark:text-cyan-300 dark:group-focus-within:text-cyan-200'}`} size={18} />
                            <FormControl>
                              <Input
                                {...field}
                                type={isPasswordVisible ? 'text' : 'password'}
                                placeholder={t('auth.login.passwordPlaceholder')}
                                className={`h-14 rounded-2xl px-12 pr-11 text-base font-semibold text-emerald-950 shadow-sm placeholder:text-emerald-950/55 dark:text-white dark:placeholder:text-slate-400 ${invalid ? 'border-2 border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-950/30' : 'border border-emerald-900/20 bg-white focus-visible:!border-emerald-700 focus-visible:!ring-emerald-700/20 dark:border-white/10 dark:bg-white/5 dark:focus-visible:!border-cyan-400/60 dark:focus-visible:!ring-cyan-400/20'}`}
                                onChange={(event) => {
                                  form.clearErrors('root');
                                  field.onChange(event);
                                }}
                                onKeyDown={(event) => setCapsLockActive(event.getModifierState('CapsLock'))}
                                onKeyUp={(event) => setCapsLockActive(event.getModifierState('CapsLock'))}
                              />
                            </FormControl>
                            <button
                              type="button"
                              onClick={() => setIsPasswordVisible((prev) => !prev)}
                              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-emerald-900 transition-colors hover:text-emerald-700 dark:text-cyan-300 dark:hover:text-cyan-100"
                            >
                              {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          <div className="min-h-[18px]">
                            {form.formState.errors.root ? (
                              <p className="text-xs text-red-500" role="alert">{form.formState.errors.root.message}</p>
                            ) : fieldState.error ? (
                              <FormMessage className="text-xs text-red-500" />
                            ) : capsLockActive ? (
                              <div className="mt-1 flex w-fit items-center gap-1 rounded-md border border-amber-400/50 bg-amber-100 px-2 py-1 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
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
                    <button type="button" className="text-sm font-semibold text-emerald-800 transition hover:text-emerald-950 hover:underline dark:text-cyan-300 dark:hover:text-cyan-100" onClick={() => navigate('/auth/forgot-password')}>
                      {t('auth.login.forgotPassword')}
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="group mt-2 h-13 w-full rounded-2xl border-0 bg-[#203522] text-sm font-black uppercase tracking-wide text-white shadow-xl shadow-emerald-950/20 hover:bg-[#2b4930] dark:bg-cyan-400 dark:text-slate-950 dark:shadow-cyan-950/30 dark:hover:bg-cyan-300"
                    disabled={isPending}
                  >
                    {isPending ? t('auth.login.loggingIn') : t('auth.login.loginButton')}
                    <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" size={18} />
                  </Button>
                </form>
              </Form>

              <div className="mt-7 grid grid-cols-3 gap-2 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-950/45 dark:text-slate-300">
                <span className="rounded-full bg-emerald-900/5 px-2 py-2 dark:bg-white/5">Katalog</span>
                <span className="rounded-full bg-emerald-900/5 px-2 py-2 dark:bg-white/5">Fiyat</span>
                <span className="rounded-full bg-emerald-900/5 px-2 py-2 dark:bg-white/5">Sipariş</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-900/10 bg-white/45 px-4 py-2 text-xs font-semibold text-emerald-950/60 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-slate-300 md:flex">
        <Layers3 size={14} />
        ERP tabanlı B2B hesap, teklif ve tekrar sipariş deneyimi
      </div>
    </div>
  );
}
