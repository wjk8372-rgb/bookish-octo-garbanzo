import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { tracks as defaultTracks, type Track } from '../data/tracks'
import { moments as defaultMoments, type Moment } from '../data/moments'

export type TrackConfig = Track & { hidden?: boolean }
export type MomentConfig = Moment & { hidden?: boolean }

type ConfigData = {
  tracks: TrackConfig[]
  moments: MomentConfig[]
}

type ConfigContextValue = {
  tracks: TrackConfig[]
  moments: MomentConfig[]
  visibleTracks: Track[]
  visibleMoments: Moment[]
  setTracks: (t: TrackConfig[]) => void
  setMoments: (m: MomentConfig[]) => void
  reset: () => void
  exportJSON: () => void
  importJSON: (json: string) => boolean
}

const STORAGE_KEY = 'bg-config-v1'

const ConfigContext = createContext<ConfigContextValue | null>(null)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ConfigData>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        return {
          tracks: parsed.tracks ?? defaultTracks.map((t) => ({ ...t })),
          moments: parsed.moments ?? defaultMoments.map((m) => ({ ...m })),
        }
      }
    } catch {
      /* noop */
    }
    return {
      tracks: defaultTracks.map((t) => ({ ...t })),
      moments: defaultMoments.map((m) => ({ ...m })),
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* noop */
    }
  }, [data])

  const value: ConfigContextValue = {
    tracks: data.tracks,
    moments: data.moments,
    visibleTracks: data.tracks.filter((t) => !t.hidden),
    visibleMoments: data.moments.filter((m) => !m.hidden),
    setTracks: (tracks) => setData((d) => ({ ...d, tracks })),
    setMoments: (moments) => setData((d) => ({ ...d, moments })),
    reset: () =>
      setData({
        tracks: defaultTracks.map((t) => ({ ...t })),
        moments: defaultMoments.map((m) => ({ ...m })),
      }),
    exportJSON: () => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'birthday-gift-config.json'
      a.click()
      URL.revokeObjectURL(url)
    },
    importJSON: (json: string) => {
      try {
        const parsed = JSON.parse(json)
        if (parsed.tracks && parsed.moments) {
          setData({ tracks: parsed.tracks, moments: parsed.moments })
          return true
        }
      } catch {
        /* noop */
      }
      return false
    },
  }

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider')
  return ctx
}
