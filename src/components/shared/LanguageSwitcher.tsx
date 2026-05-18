import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeLanguage, setAppLanguage } from '@/lib/i18n';

const languages = [
  { code: 'tr', flag: '🇹🇷' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'de', flag: '🇩🇪' },
  { code: 'fr', flag: '🇫🇷' },
] as const;

interface LanguageSwitcherProps {
  variant?: 'default' | 'pill';
}

export function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps): ReactElement {
  const { i18n, t } = useTranslation('common');

  const normalizedLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
  const currentLanguage = languages.find((lang) => lang.code === normalizedLanguage) || languages[0];
  const currentName = t(`languageNames.${normalizedLanguage}` as never);

  const handleLanguageChange = (value: string): void => {
    void setAppLanguage(value);
  };

  return (
    <Select value={normalizedLanguage} onValueChange={handleLanguageChange}>
      <SelectTrigger
        className={cn(
          'h-10 w-[140px] border bg-background shadow-lg hover:bg-accent',
          variant === 'pill' &&
            'h-11 w-[176px] rounded-full border-white/20 bg-slate-900/80 px-4 text-slate-100 shadow-[0_10px_30px_rgba(2,6,23,0.45)] backdrop-blur-xl hover:border-cyan-400/40 hover:bg-slate-900'
        )}
      >
        <div className="flex items-center gap-2 flex-1">
          <Languages className={cn('h-4 w-4 shrink-0', variant === 'pill' && 'text-cyan-300')} />
          <SelectValue>
            <span className="flex items-center gap-1.5">
              <span className="text-base">{currentLanguage.flag}</span>
              <span className={cn('hidden text-sm sm:inline', variant === 'pill' && 'font-medium text-slate-100')}>
                {currentName}
              </span>
            </span>
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className={cn(variant === 'pill' && 'border-white/10 bg-[#0b1228] text-white')}>
        {languages.map((language) => (
          <SelectItem
            key={language.code}
            value={language.code}
            className={cn(variant === 'pill' && 'focus:bg-cyan-500/20 focus:text-white')}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{language.flag}</span>
              <span>{t(`languageNames.${language.code}` as never)}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
