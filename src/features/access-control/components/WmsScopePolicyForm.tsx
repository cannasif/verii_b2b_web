import { type ReactElement, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FieldHelpTooltip } from './FieldHelpTooltip';
import {
  createWmsScopePolicySchema,
  type CreateWmsScopePolicySchema,
  WMS_SCOPE_POLICY_ENTITY_TYPES,
  WMS_SCOPE_POLICY_SCOPE_TYPES,
} from '../schemas/wms-scope-policy-schema';
import type { WmsScopePolicyDto } from '../types/access-control.types';

interface WmsScopePolicyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateWmsScopePolicySchema) => void | Promise<void>;
  item?: WmsScopePolicyDto | null;
  isLoading?: boolean;
  usedCodes?: string[];
}

const scopeTypeLabels: Record<string, string> = {
  unrestricted: 'Tam Erişim',
  branch: 'Şube Bazlı',
  warehouse: 'Depo Bazlı',
  'assigned-only': 'Sadece Atanan Kayıtlar',
};

export function WmsScopePolicyForm({
  open,
  onOpenChange,
  onSubmit,
  item,
  isLoading = false,
  usedCodes = [],
}: WmsScopePolicyFormProps): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);

  const form = useForm<CreateWmsScopePolicySchema>({
    resolver: zodResolver(createWmsScopePolicySchema),
    mode: 'onChange',
    defaultValues: {
      code: '',
      name: '',
      entityType: 'GoodsReceipt',
      description: '',
      scopeType: 'assigned-only',
      includeSelf: true,
      isActive: true,
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        code: item.code,
        name: item.name,
        entityType: item.entityType,
        description: item.description ?? '',
        scopeType: item.scopeType,
        includeSelf: item.includeSelf,
        isActive: item.isActive,
      });
      return;
    }

    form.reset({
      code: '',
      name: '',
      entityType: 'GoodsReceipt',
      description: '',
      scopeType: 'assigned-only',
      includeSelf: true,
      isActive: true,
    });
  }, [form, item, open]);

  const entityTypeOptions = useMemo<ComboboxOption[]>(
    () => WMS_SCOPE_POLICY_ENTITY_TYPES.map((value) => ({ value, label: value })),
    [],
  );

  const scopeTypeOptions = useMemo<ComboboxOption[]>(
    () => WMS_SCOPE_POLICY_SCOPE_TYPES.map((value) => ({ value, label: scopeTypeLabels[value] ?? value })),
    [],
  );

  const codeOptions = useMemo<ComboboxOption[]>(() => {
    const current = item?.code?.toLowerCase();
    const used = new Set(usedCodes.map((code) => code.toLowerCase()));
    return WMS_SCOPE_POLICY_ENTITY_TYPES.flatMap((entityType) => WMS_SCOPE_POLICY_SCOPE_TYPES.map((scopeType) => {
      const normalized = scopeType.replace(/[^a-z0-9]+/gi, '-');
      const value = `scope.${entityType.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}.${normalized}`;
      return value;
    }))
      .filter((code) => current === code.toLowerCase() || !used.has(code.toLowerCase()))
      .map((value) => ({ value, label: value }));
  }, [item?.code, usedCodes]);

  const handleSubmit = async (data: CreateWmsScopePolicySchema): Promise<void> => {
    await onSubmit(data);
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden border border-slate-200 bg-white p-0 shadow-2xl dark:border-white/10 dark:bg-[#130822]">
        <DialogHeader className="border-b border-slate-100 bg-linear-to-r from-slate-50 via-white to-cyan-50/50 px-6 py-5 dark:border-white/5 dark:from-[#1a1025] dark:via-[#130822] dark:to-cyan-950/30">
          <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-cyan-200 bg-white/80 px-3 py-1.5 text-xs font-black text-cyan-700 shadow-sm dark:border-cyan-800/40 dark:bg-blue-950/60 dark:text-cyan-300">
            <Sparkles className="size-4" />
            {item ? t('wmsScopePolicies.form.editTitle') : t('wmsScopePolicies.form.addTitle')}
          </div>
          <DialogTitle className="pt-3 text-xl font-black text-slate-900 dark:text-white">
            {item ? t('wmsScopePolicies.form.editTitle') : t('wmsScopePolicies.form.addTitle')}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
            {item ? t('wmsScopePolicies.form.editDescription') : t('wmsScopePolicies.form.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[80vh] overflow-y-auto px-6 py-6">
          <Form {...form}>
            <form id="wms-scope-policy-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="inline-flex items-center gap-1">
                        {t('wmsScopePolicies.form.code')}
                        <FieldHelpTooltip text={t('help.wmsScopePolicy.code')} />
                      </FormLabel>
                      <FormControl>
                        <Combobox
                          options={codeOptions}
                          value={field.value}
                          modal
                          onValueChange={field.onChange}
                          placeholder={t('wmsScopePolicies.form.codePlaceholder')}
                          searchPlaceholder={t('common.search')}
                          emptyText={t('wmsScopePolicies.form.codeEmpty')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="inline-flex items-center gap-1">
                        {t('wmsScopePolicies.form.name')}
                        <FieldHelpTooltip text={t('help.wmsScopePolicy.name')} />
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('wmsScopePolicies.form.namePlaceholder')} maxLength={150} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="entityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="inline-flex items-center gap-1">
                        {t('wmsScopePolicies.form.entityType')}
                        <FieldHelpTooltip text={t('help.wmsScopePolicy.entityType')} />
                      </FormLabel>
                      <FormControl>
                        <Combobox
                          options={entityTypeOptions}
                          value={field.value}
                          modal
                          onValueChange={field.onChange}
                          placeholder={t('wmsScopePolicies.form.entityTypePlaceholder')}
                          searchPlaceholder={t('common.search')}
                          emptyText={t('common.noData')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scopeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="inline-flex items-center gap-1">
                        {t('wmsScopePolicies.form.scopeType')}
                        <FieldHelpTooltip text={t('help.wmsScopePolicy.scopeType')} />
                      </FormLabel>
                      <FormControl>
                        <Combobox
                          options={scopeTypeOptions}
                          value={field.value}
                          modal
                          onValueChange={field.onChange}
                          placeholder={t('wmsScopePolicies.form.scopeTypePlaceholder')}
                          searchPlaceholder={t('common.search')}
                          emptyText={t('common.noData')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="inline-flex items-center gap-1">
                      {t('wmsScopePolicies.form.description')}
                      <FieldHelpTooltip text={t('help.wmsScopePolicy.description')} />
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        placeholder={t('wmsScopePolicies.form.descriptionPlaceholder')}
                        rows={3}
                        maxLength={500}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="includeSelf"
                  render={({ field }) => (
                    <FormItem className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <FormLabel>{t('wmsScopePolicies.form.includeSelf')}</FormLabel>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('wmsScopePolicies.form.includeSelfHint')}</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <FormLabel>{t('wmsScopePolicies.form.isActive')}</FormLabel>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('wmsScopePolicies.form.isActiveHint')}</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        <DialogFooter className="border-t border-slate-100 px-6 py-4 dark:border-white/5">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="wms-scope-policy-form" disabled={isLoading} className="bg-linear-to-r from-pink-600 to-orange-600 text-white hover:text-white">
            {isLoading ? t('common.saving') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
