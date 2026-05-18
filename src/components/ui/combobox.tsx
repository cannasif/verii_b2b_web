import * as React from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { VoiceSearchButton } from "@/components/ui/voice-search-button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  modal?: boolean
  disabled?: boolean
  listClassName?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  className,
  modal = false,
  disabled = false,
  listClassName
}: ComboboxProps) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [portalContainer, setPortalContainer] = React.useState<HTMLElement | null>(null)
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)
  const resolvedPlaceholder = placeholder ?? t('common.select')
  const resolvedSearchPlaceholder = searchPlaceholder ?? t('common.search')
  const resolvedEmptyText = emptyText ?? t('common.noResults')

  const selectedOption = options.find((option) => option.value === value)

  React.useEffect(() => {
    if (!open) {
      setSearchQuery("")
    }
  }, [open])

  React.useLayoutEffect(() => {
    const dialogContent = triggerRef.current?.closest('[data-slot="dialog-content"]') as HTMLElement | null
    setPortalContainer(dialogContent ?? null)
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modal}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : resolvedPlaceholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        container={portalContainer}
      >
        <Command>
          <div className="relative **:data-[slot=command-input-wrapper]:pr-10">
            <CommandInput
              placeholder={resolvedSearchPlaceholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2">
              <VoiceSearchButton
                onResult={(text) => setSearchQuery(text)}
                size="sm"
                variant="ghost"
                className="h-5 w-5"
              />
            </div>
          </div>
          <CommandList className={listClassName ?? "max-h-[220px]"}>
            <CommandEmpty>{resolvedEmptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
