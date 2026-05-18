import * as React from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps): React.ReactElement {
  const { t } = useTranslation()
  return (
    <nav className={cn("flex items-center space-x-2", className)} aria-label={t('common.breadcrumb')}>
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
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
                className="mx-2 text-muted-foreground"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                item.isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
