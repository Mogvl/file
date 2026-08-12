import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type SettingsTab =
  | 'profile'
  | 'appearance'
  | 'transfer'
  | 'workspace'
  | 'members'
  | 'roles'
  | 'logs'
  | 'user-config'

type SettingsModalValue = {
  open: boolean
  setOpen: (open: boolean) => void
  tab: SettingsTab
  setTab: (tab: SettingsTab) => void
  openSettings: (tab?: SettingsTab) => void
}

const SettingsModalContext = createContext<SettingsModalValue | null>(null)

export function SettingsModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<SettingsTab>('profile')

  const openSettings = useCallback((next?: SettingsTab) => {
    if (next) setTab(next)
    setOpen(true)
  }, [])

  const value = useMemo(
    () => ({
      open,
      setOpen,
      tab,
      setTab,
      openSettings,
    }),
    [open, tab, openSettings]
  )

  return (
    <SettingsModalContext.Provider value={value}>
      {children}
    </SettingsModalContext.Provider>
  )
}

export function useSettingsModal() {
  const ctx = useContext(SettingsModalContext)
  if (!ctx) {
    throw new Error('useSettingsModal must be used within SettingsModalProvider')
  }
  return ctx
}
