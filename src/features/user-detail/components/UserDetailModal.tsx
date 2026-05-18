import { type ReactElement, useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { getApiBaseUrl } from '@/lib/axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useUserDetail } from '../hooks/useUserDetail';
import { useCreateUserDetail } from '../hooks/useCreateUserDetail';
import { useUpdateUserDetail } from '../hooks/useUpdateUserDetail';
import { useUploadProfilePicture } from '../hooks/useUploadProfilePicture';
import { useDeleteProfilePicture } from '../hooks/useDeleteProfilePicture';
import { createUserDetailFormSchema, type UserDetailFormData, Gender } from '../types/user-detail';
import { useChangePassword } from '@/features/auth/hooks/useChangePassword';
import type { ChangePasswordRequest } from '@/features/auth/types/auth';
import { Loader2, Upload, Trash2, Shield, Lock, Eye, EyeOff } from 'lucide-react';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

export function UserDetailModal({ isOpen, onClose }: UserDetailModalProps): ReactElement {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deletePictureDialogOpen, setDeletePictureDialogOpen] = useState(false);
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);

  const { data: userDetail, isLoading: isLoadingUserDetail, refetch } = useUserDetail();
  const createMutation = useCreateUserDetail();
  const updateMutation = useUpdateUserDetail();
  const uploadMutation = useUploadProfilePicture();
  const deleteMutation = useDeleteProfilePicture();
  const changePasswordMutation = useChangePassword();

  const schema = useMemo(() => createUserDetailFormSchema(t), [t]);

  const form = useForm<UserDetailFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      profilePictureUrl: '',
      height: null,
      weight: null,
      description: '',
      gender: null,
    },
  });

  const changePasswordSchema = useMemo(() => z.object({
    currentPassword: z.string().min(1, t('userDetail.currentPasswordRequired')),
    newPassword: z
      .string()
      .min(6, t('userDetail.newPasswordMinLength'))
      .max(100, t('userDetail.newPasswordMaxLength')),
  }).refine((data) => data.currentPassword !== data.newPassword, {
    message: t('userDetail.newPasswordSameAsCurrent'),
    path: ['newPassword'],
  }), [t]);

  const changePasswordForm = useForm<ChangePasswordRequest>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  const getFullImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const apiBaseUrl = getApiBaseUrl();
    return `${apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    if (userDetail) {
      setIsEditMode(true);
      form.reset({
        profilePictureUrl: userDetail.profilePictureUrl || '',
        height: userDetail.height ?? null,
        weight: userDetail.weight ?? null,
        description: userDetail.description || '',
        gender: userDetail.gender ?? null,
      });
      if (userDetail.profilePictureUrl) {
        const fullUrl = getFullImageUrl(userDetail.profilePictureUrl);
        setPreviewImage(fullUrl);
      } else {
        setPreviewImage(null);
      }
    } else if (!isLoadingUserDetail && isOpen) {
      setIsEditMode(false);
      form.reset({
        profilePictureUrl: '',
        height: null,
        weight: null,
        description: '',
        gender: null,
      });
      setPreviewImage(null);
    }
  }, [userDetail, isLoadingUserDetail, isOpen, form]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      form.setError('profilePictureUrl', {
        type: 'manual',
        message: t('userDetail.invalidFileFormat'),
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      form.setError('profilePictureUrl', {
        type: 'manual',
        message: t('userDetail.fileSizeExceeded'),
      });
      return;
    }

    form.clearErrors('profilePictureUrl');
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreviewImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPicture = (): void => {
    if (!selectedFile) return;

    uploadMutation.mutate(selectedFile, {
      onSuccess: (response) => {
        if (response.success && response.data) {
          toast.success(t('userDetail.profilePictureUploadedSuccessfully'));
          form.setValue('profilePictureUrl', response.data);
          const fullUrl = getFullImageUrl(response.data);
          setPreviewImage(fullUrl);
          setSelectedFile(null);
          refetch();
        } else {
          toast.error(response.message || t('userDetail.profilePictureUploadError'));
        }
      },
      onError: (error: Error) => {
        toast.error(error.message || t('userDetail.profilePictureUploadError'));
      },
    });
  };

  const handleDeletePictureClick = (): void => {
    if (!userDetail?.profilePictureUrl) return;
    setDeletePictureDialogOpen(true);
  };

  const handleDeletePictureConfirm = (): void => {
    deleteMutation.mutate(undefined as never, {
      onSuccess: (response) => {
        if (response.success) {
          toast.success(t('userDetail.profilePictureDeletedSuccessfully'));
          setDeletePictureDialogOpen(false);
          form.setValue('profilePictureUrl', '');
          setPreviewImage(null);
          setSelectedFile(null);
          refetch();
        } else {
          toast.error(response.message || t('userDetail.profilePictureDeleteError'));
        }
      },
      onError: (error: Error) => {
        toast.error(error.message || t('userDetail.profilePictureDeleteError'));
        setDeletePictureDialogOpen(false);
      },
    });
  };

  const handleSubmit = (data: UserDetailFormData): void => {
    if (isEditMode) {
      updateMutation.mutate(
        {
          profilePictureUrl: data.profilePictureUrl || undefined,
          height: data.height ?? undefined,
          weight: data.weight ?? undefined,
          description: data.description || undefined,
          gender: (data.gender ?? undefined) as Gender | undefined,
        },
        {
          onSuccess: () => {
            toast.success(t('userDetail.updatedSuccessfully'));
            onClose();
          },
          onError: (error: Error) => {
            toast.error(error.message || t('userDetail.updateError'));
          },
        }
      );
    } else {
      if (!user?.id) {
        toast.error(t('userDetail.userNotFound'));
        return;
      }
      createMutation.mutate(
        {
          userId: user.id,
          profilePictureUrl: data.profilePictureUrl || undefined,
          height: data.height ?? undefined,
          weight: data.weight ?? undefined,
          description: data.description || undefined,
          gender: (data.gender ?? undefined) as Gender | undefined,
        },
        {
          onSuccess: () => {
            toast.success(t('userDetail.createdSuccessfully'));
            onClose();
          },
          onError: (error: Error) => {
            toast.error(error.message || t('userDetail.createError'));
          },
        }
      );
    }
  };

  const handleChangePasswordSubmit = async (data: ChangePasswordRequest): Promise<void> => {
    await changePasswordMutation.mutateAsync(data);
    changePasswordForm.reset();
  };

  const descriptionLength = form.watch('description')?.length || 0;
  const isLoading = isLoadingUserDetail || createMutation.isPending || updateMutation.isPending;
  const isUploading = uploadMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isChangingPassword = changePasswordMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('userDetail.title')}</DialogTitle>
          <DialogDescription>
            {t('userDetail.subtitle')}
          </DialogDescription>
        </DialogHeader>

        {isLoadingUserDetail ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt={t('userDetail.profilePicture')}
                        className="size-32 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="size-32 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">
                          {t('userDetail.noImage')}
                        </span>
                      </div>
                    )}
                    {userDetail?.profilePictureUrl && !selectedFile && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -bottom-2 -right-2 size-8 rounded-full"
                        onClick={handleDeletePictureClick}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 w-full max-w-md">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full"
                    >
                      <Upload className="size-4 mr-2" />
                      {t('userDetail.selectFile')}
                    </Button>
                    {selectedFile && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                        <Button
                          type="button"
                          onClick={handleUploadPicture}
                          disabled={isUploading}
                          className="w-full"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="size-4 mr-2 animate-spin" />
                              {t('userDetail.uploading')}
                            </>
                          ) : (
                            <>
                              <Upload className="size-4 mr-2" />
                              {t('userDetail.upload')}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    <FormField
                      control={form.control}
                      name="profilePictureUrl"
                      render={() => (
                        <FormItem>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('userDetail.height')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="300"
                            placeholder="175.5"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === '' ? null : parseFloat(value));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('userDetail.weight')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="500"
                            placeholder="75.5"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === '' ? null : parseFloat(value));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('userDetail.gender')}</FormLabel>
                      <Select
                        value={field.value?.toString() ?? Gender.NotSpecified.toString()}
                        onValueChange={(value) => {
                          const numValue = parseInt(value, 10);
                          field.onChange(numValue === Gender.NotSpecified ? null : (numValue as Gender));
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('userDetail.selectGender')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={Gender.NotSpecified.toString()}>
                            {t('userDetail.gender.notSpecified')}
                          </SelectItem>
                          <SelectItem value={Gender.Male.toString()}>
                            {t('userDetail.gender.male')}
                          </SelectItem>
                          <SelectItem value={Gender.Female.toString()}>
                            {t('userDetail.gender.female')}
                          </SelectItem>
                          <SelectItem value={Gender.Other.toString()}>
                            {t('userDetail.gender.other')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('userDetail.description')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('userDetail.descriptionPlaceholder')}
                          maxLength={2000}
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex justify-between items-center">
                        <FormMessage />
                        <span className="text-xs text-muted-foreground">
                          {descriptionLength}/2000
                        </span>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={isLoading || isUploading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        {t('common.saving')}
                      </>
                    ) : isEditMode ? (
                      t('common.update')
                    ) : (
                      t('common.save')
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>

            <div className="mt-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="change-password">
                  <AccordionTrigger>{t('userDetail.changePassword')}</AccordionTrigger>
                  <AccordionContent>
                    <Form {...changePasswordForm}>
                      <form onSubmit={changePasswordForm.handleSubmit(handleChangePasswordSubmit)} className="space-y-4 pt-2">
                      <FormField
                        control={changePasswordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('userDetail.currentPassword')}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  type={isCurrentPasswordVisible ? 'text' : 'password'}
                                  placeholder="••••••••"
                                  className="pl-10 pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setIsCurrentPasswordVisible((v) => !v)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  {isCurrentPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={changePasswordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('userDetail.newPassword')}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  type={isNewPasswordVisible ? 'text' : 'password'}
                                  placeholder={t('userDetail.newPasswordPlaceholder')}
                                  className="pl-10 pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setIsNewPasswordVisible((v) => !v)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  {isNewPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                        <div className="flex justify-end">
                          <Button type="submit" variant="outline" disabled={isChangingPassword}>
                            {isChangingPassword ? (
                              <>
                                <Loader2 className="size-4 mr-2 animate-spin" />
                                {t('userDetail.changingPassword')}
                              </>
                            ) : (
                              <>
                                <Shield className="size-4 mr-2" />
                                {t('userDetail.changePasswordButton')}
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </>
        )}
      </DialogContent>

      <Dialog open={deletePictureDialogOpen} onOpenChange={setDeletePictureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('userDetail.deletePictureTitle')}</DialogTitle>
            <DialogDescription>
              {t('userDetail.deletePictureMessage')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePictureDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePictureConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('common.delete')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
