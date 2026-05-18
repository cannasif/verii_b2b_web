import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Moon, Sun, LogOut, ChevronRight, Languages } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/components/theme-provider';
import { useAuthStore } from '@/stores/auth-store';
import { useUserDetail } from '../hooks/useUserDetail';
import { getFullProfileImageUrl } from '../utils/profile-image';
import { cn } from '@/lib/utils';
import { normalizeLanguage, setAppLanguage } from '@/lib/i18n';

const SUPPORTED_LANGUAGES = [
  { code: 'tr', name: 'Türkçe', flag: 'TR' },
  { code: 'en', name: 'English', flag: 'EN' },
  { code: 'de', name: 'Deutsch', flag: 'DE' },
  { code: 'fr', name: 'Français', flag: 'FR' },
] as const;

export interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenProfileDetails: () => void;
}

export function UserProfileModal({
  open,
  onOpenChange,
  onOpenProfileDetails,
}: UserProfileModalProps): ReactElement {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, logout, branch } = useAuthStore();
  const { data: userDetail } = useUserDetail();

  const displayName = user?.name || user?.email || t('dashboard.user');
  const displayInitial = displayName.charAt(0).toUpperCase();
  const imageUrl = getFullProfileImageUrl(userDetail?.profilePictureUrl);
  const isDark = theme === 'dark';
  const currentLanguage =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === normalizeLanguage(i18n.resolvedLanguage ?? i18n.language))
    ?? SUPPORTED_LANGUAGES[0];

  const handleLanguageChange = (value: string): void => {
    void setAppLanguage(value);
  };

  const handleLogout = (): void => {
    logout();
    onOpenChange(false);
    navigate('/auth/login');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          'w-[calc(100vw-2rem)] max-w-2xl overflow-hidden p-0 sm:w-full',
          'grid grid-cols-1 gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]'
        )}
        aria-describedby="user-profile-description"
      >
        <DialogTitle className="sr-only">{t('sidebar.settings')}</DialogTitle>

        <section
          id="user-profile-description"
          aria-label={t('profile.title')}
          className={cn(
            'flex flex-col items-center justify-center gap-4 border-b p-6 md:border-b-0 md:border-r md:p-8',
            isDark ? 'border-border bg-muted/30' : 'border-border bg-muted/20'
          )}
        >
          <div className="relative flex shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="h-24 w-24 rounded-2xl border-2 border-border object-cover shadow-sm"
              />
            ) : (
              <div
                className={cn(
                  'flex h-24 w-24 items-center justify-center rounded-2xl text-2xl font-semibold',
                  isDark ? 'bg-primary/20 text-primary' : 'bg-primary/15 text-primary'
                )}
              >
                {displayInitial}
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-col items-center gap-0.5 text-center">
            <p className="max-w-full truncate text-lg font-semibold tracking-tight">
              {displayName}
            </p>
            <p className="text-sm text-muted-foreground">
              {branch?.name ?? t('roles.admin')}
            </p>
          </div>
          <div
            className={cn(
              'flex w-full max-w-[260px] items-center gap-3 rounded-xl border px-4 py-3',
              isDark ? 'border-border bg-background/50' : 'border-border bg-background'
            )}
          >
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 truncate text-sm text-foreground">{user?.email}</span>
          </div>
        </section>

        <div className="flex min-h-0 flex-col">
          <div className="shrink-0 border-b px-6 py-4 md:px-8">
            <h2 className="text-base font-semibold">
              {t('sidebar.settings')}
            </h2>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1 p-4 md:p-6">
            <button
              type="button"
              onClick={onOpenProfileDetails}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
                'hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring',
                isDark ? 'border-border bg-muted/20' : 'border-border bg-muted/10'
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    isDark ? 'bg-primary/20 text-primary' : 'bg-primary/15 text-primary'
                  )}
                >
                  <User className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{t('profile.title')}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t('userDetail.subtitle')}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            </button>

            <div
              className={cn(
                'flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3',
                isDark ? 'border-border bg-muted/20' : 'border-border bg-muted/10'
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    isDark ? 'bg-primary/20 text-primary' : 'bg-primary/15 text-primary'
                  )}
                >
                  <Languages className="h-5 w-5" aria-hidden />
                </div>
                <span className="font-medium">{t('language_choice')}</span>
              </div>
              <Select value={currentLanguage.code} onValueChange={handleLanguageChange}>
                <SelectTrigger className="h-9 w-36 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              className={cn(
                'flex items-center justify-between gap-3 rounded-lg border px-4 py-3',
                isDark ? 'border-border bg-muted/20' : 'border-border bg-muted/10'
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    isDark ? 'bg-primary/20 text-primary' : 'bg-primary/15 text-primary'
                  )}
                >
                  {isDark ? (
                    <Moon className="h-5 w-5" aria-hidden />
                  ) : (
                    <Sun className="h-5 w-5" aria-hidden />
                  )}
                </div>
                <span className="font-medium">{t('appearance')}</span>
              </div>
              <Switch
                checked={isDark}
                onCheckedChange={() => setTheme(isDark ? 'light' : 'dark')}
              />
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t p-4 md:p-6">
            <Button
              variant="destructive"
              className="w-full gap-2 sm:w-auto sm:min-w-[140px]"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              {t('auth.logout')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
