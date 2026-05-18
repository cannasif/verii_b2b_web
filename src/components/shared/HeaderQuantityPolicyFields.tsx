import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { usePermissionAccess } from '@/features/access-control/hooks/usePermissionAccess';

interface HeaderQuantityPolicyFieldsProps {
  permissionCode: string;
}

export function HeaderQuantityPolicyFields({ permissionCode }: HeaderQuantityPolicyFieldsProps): ReactElement {
  const { t } = useTranslation();
  const form = useFormContext();
  const permissionAccess = usePermissionAccess();
  const canOverride = permissionAccess.can(permissionCode);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField
        control={form.control}
        name="allowLessQuantityBasedOnOrder"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <input
                type="checkbox"
                checked={Boolean(field.value)}
                onChange={(event) => field.onChange(event.target.checked)}
                disabled={!canOverride}
                className="mt-1 h-4 w-4 rounded border-gray-300"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>{t('parameters.form.allowLessQuantity')}</FormLabel>
              <p className="text-sm text-muted-foreground">
                {t('parameters.form.allowLessQuantityDescription')}
              </p>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="allowMoreQuantityBasedOnOrder"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <input
                type="checkbox"
                checked={Boolean(field.value)}
                onChange={(event) => field.onChange(event.target.checked)}
                disabled={!canOverride}
                className="mt-1 h-4 w-4 rounded border-gray-300"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>{t('parameters.form.allowMoreQuantity')}</FormLabel>
              <p className="text-sm text-muted-foreground">
                {t('parameters.form.allowMoreQuantityDescription')}
              </p>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}
