import { type ReactElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useUIStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function DashboardPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();

  useEffect(() => {
    setPageTitle(t('dashboard.title'));
    return () => {
      setPageTitle(null);
    };
  }, [t, setPageTitle]);

  return (
    <div className="space-y-6 crm-page">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.20),_transparent_32%),linear-gradient(135deg,_#f8fafc,_#ecfeff)] p-6 shadow-sm dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(135deg,_#020617,_#111827)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Badge className="w-fit bg-emerald-700 text-white hover:bg-emerald-700">B2B Portal</Badge>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Müşteri portalı ve admin paneli tek akışta</h1>
              <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600 dark:text-slate-300">
                Müşterinin gördüğü katalog, fiyat, stok ve sepet akışını portalda test edin; operasyon yönetimini admin panelinden sürdürün.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-emerald-700 hover:bg-emerald-600">
              <Link to="/b2b-portal">Portala Git</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/b2b/insights">B2B Admin Paneli</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalStock')}</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12.5% {t('dashboard.totalStockChange')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.goodsReceipt')}</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.goodsReceiptPending')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.shipment')}</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M5 18H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.19M5 18l6-6M5 18v-5a2 2 0 0 1 2-2h5" />
              <path d="m13 6 4 4-4 4" />
              <path d="M17 10h5" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.shipmentPrepared')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.criticalStock')}</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.criticalStockItems')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>{t('dashboard.recentTransactions')}</CardTitle>
            <CardDescription>{t('dashboard.recentTransactionsSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t('dashboard.goodsReceiptNumber', { number: 1234 })}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.hoursAgo', { hours: 2 })}
                  </p>
                </div>
                <Badge variant="secondary">{t('dashboard.completed')}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t('dashboard.shipmentNumber', { number: 5678 })}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.hoursAgo', { hours: 4 })}
                  </p>
                </div>
                <Badge variant="default">{t('dashboard.preparing')}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t('dashboard.inventoryUpdate')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.hoursAgo', { hours: 6 })}
                  </p>
                </div>
                <Badge variant="secondary">{t('dashboard.completed')}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{t('dashboard.quickAccess')}</CardTitle>
            <CardDescription>{t('dashboard.quickAccessSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link
                to="/b2b-portal"
                className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-950 transition-colors hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:bg-emerald-500/20"
              >
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 11 12 3l9 8" />
                    <path d="M5 10v10h14V10" />
                    <path d="M9 20v-6h6v6" />
                  </svg>
                  <span className="text-sm font-semibold">Müşteri Portalını Aç</span>
                </div>
              </Link>
              <Link
                to="/b2b/quotes"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span className="text-sm">{t('dashboard.newGoodsReceipt')}</span>
                </div>
              </Link>
              <Link
                to="/b2b/orders"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 18H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.19M5 18l6-6M5 18v-5a2 2 0 0 1 2-2h5" />
                    <path d="m13 6 4 4-4 4" />
                    <path d="M17 10h5" />
                  </svg>
                  <span className="text-sm">{t('dashboard.newShipment')}</span>
                </div>
              </Link>
              <Link
                to="/b2b/inventory"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <span className="text-sm">{t('dashboard.stockQuery')}</span>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
