import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/components/theme-provider"
import { Switch } from "@/components/ui/switch"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const updateIsDark = () => {
      if (theme === "dark") {
        setIsDark(true)
      } else if (theme === "light") {
        setIsDark(false)
      } else {
        setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches)
      }
    }

    updateIsDark()

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = () => updateIsDark()
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme])

  const handleToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light")
  }

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4 text-muted-foreground" />
      <Switch
        checked={isDark}
        onCheckedChange={handleToggle}
        aria-label={t('theme.toggle')}
      />
      <Moon className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}

