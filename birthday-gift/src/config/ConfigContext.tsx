import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { tracks as defaultTracks, type Track } from '../data/tracks'
import { moments as defaultMoments, type Moment } from '../data/moments'
import { db } from './firebase'
import { ref, onValue, set as dbSet } from 'firebase/database'

export type TrackConfig = Track & { hidden?: boolean }
export type MomentConfig = Moment & { hidden?: boolean }

export type SiteText = {
  hero: {
    dateRange: string
    mainTitle: string
    subTitle: string
    line1: string
    line2: string
    buttonText: string
    scrollHint: string
  }
  prologue: {
    title: string
    subtitle: string
    quote: string
    contactName: string
    messages: { from: 'me' | 'her'; text: string; time: string }[]
  }
  stats: {
    title: string
    subtitle: string
    items: { label: string; value: string; sub: string }[]
  }
  optionalLetter: {
    intro: string
    buttonText: string
    buttonSubtext: string
    letterContent: string
    signature: string
  }
  footer: {
    title: string
    line1: string
    line2: string
    restartButton: string
    replayButton: string
    copyright: string
  }
}

const defaultSiteText: SiteText = {
  hero: {
    dateRange: '2025.11.21 — 2026.10.13',
    mainTitle: '10.13',
    subTitle: '生日快乐',
    line1: '从 2025.11.21 你私信我那天，到现在。',
    line2: '第 {days} 天，距离我们认识一年，还差 {toAnniv} 天。',
    buttonText: '打开我们的第一年',
    scrollHint: '向下滚动',
  },
  prologue: {
    title: '序章',
    subtitle: '我们的第一次交流 · 2025.11.21',
    quote: '两条永不相交的平行线，却在命运的纸页上，被同一滴墨，轻轻晕上了一个交点。',
    contactName: '陈若怡',
    messages: [
      { from: 'her', text: '思想很深刻', time: '15:37' },
      { from: 'her', text: '我对你表示欣赏', time: '15:37' },
      { from: 'me', text: '谢谢 你能理解到深刻，或许你也是一个求真的人', time: '15:54' },
      { from: 'me', text: '这也是一种交流了~', time: '15:54' },
    ],
  },
  stats: {
    title: '关于我们的一些数字',
    subtitle: '时间被拆成了这些具体的瞬间',
    items: [
      { label: '认识天数', value: '第 {days} 天', sub: '从 {startDate} 算起' },
      { label: '距离一周年', value: '{toAnniv} 天', sub: '到 {annivDate}' },
      { label: '第一条私信', value: '{startDate}', sub: '15:37' },
    ],
  },
  optionalLetter: {
    intro: '最后，有一封信',
    buttonText: '如果你愿意，可以点开。',
    buttonSubtext: '不点也没关系。',
    letterContent: `10.13 生日快乐。

从 2025.11.21 你私信我那天算起，到今天是第 327 天。
距离我们认识一年，还差 39 天。

我本来想等 11.21 再写这些，但生日更重要。

认识你之后，一年变成了很多具体的瞬间。
那些你说过的话、写过的字，都被我好好收着。

我有时候会想，如果我们不只是朋友，会怎样。
但我更怕让你为难。

所以今天，你只需要开心。
生日快乐。

11.21 那天，如果我们还记得，就再庆祝一次。
不用回复，不用有压力。`,
    signature: '—— 写于 2026.10.13',
  },
  footer: {
    title: '10.13 快乐。',
    line1: '认识你，是我这一年很幸运的事。',
    line2: '11.21 那天，如果我们还记得，就再庆祝一次。',
    restartButton: '回到开头',
    replayButton: '再听一遍',
    copyright: '从一条抖音私信开始 · 写给 10.13 的你',
  },
}

type ConfigData = {
  version: number
  tracks: TrackConfig[]
  moments: MomentConfig[]
  siteText: SiteText
}

type ConfigContextValue = {
  tracks: TrackConfig[]
  moments: MomentConfig[]
  siteText: SiteText
  visibleTracks: Track[]
  visibleMoments: Moment[]
  setTracks: (t: TrackConfig[]) => void
  setMoments: (m: MomentConfig[]) => void
  setSiteText: (s: SiteText) => void
  reset: () => void
  exportJSON: () => void
  importJSON: (json: string) => boolean
  cloudReady: boolean
}

const STORAGE_KEY = 'bg-config-v1'
const DATA_VERSION = 7

const ConfigContext = createContext<ConfigContextValue | null>(null)

function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o))
}

function mergeSiteText(stored: Partial<SiteText> | undefined): SiteText {
  if (!stored) return clone(defaultSiteText)
  return {
    hero: { ...defaultSiteText.hero, ...stored.hero },
    prologue: { ...defaultSiteText.prologue, ...stored.prologue },
    stats: { ...defaultSiteText.stats, ...stored.stats },
    optionalLetter: { ...defaultSiteText.optionalLetter, ...stored.optionalLetter },
    footer: { ...defaultSiteText.footer, ...stored.footer },
  }
}

function mergeMoments(
  stored: MomentConfig[] | undefined,
  storedVersion: number,
): MomentConfig[] {
  if (!stored || stored.length === 0) {
    return defaultMoments.map((m) => ({ ...m }))
  }
  const refreshContent = storedVersion < DATA_VERSION
  const storedById = new Map(stored.map((m) => [m.id, m]))
  const result: MomentConfig[] = []
  for (const def of defaultMoments) {
    const existing = storedById.get(def.id)
    if (!existing) {
      result.push({ ...def })
    } else if (refreshContent) {
      result.push({
        ...def,
        hidden: existing.hidden,
        title: existing.title,
        summary: existing.summary,
        note: existing.note,
        tags: existing.tags,
      })
    } else {
      result.push(existing)
    }
  }
  const defaultIds = new Set(defaultMoments.map((m) => m.id))
  for (const s of stored) {
    if (!defaultIds.has(s.id)) result.push(s)
  }
  return result
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  // 初始从 localStorage 快速加载（避免白屏）
  const [data, setData] = useState<ConfigData>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        const storedVersion: number = parsed.version ?? 0
        return {
          version: DATA_VERSION,
          tracks: parsed.tracks ?? defaultTracks.map((t) => ({ ...t })),
          moments: mergeMoments(parsed.moments, storedVersion),
          siteText: mergeSiteText(parsed.siteText),
        }
      }
    } catch {
      /* noop */
    }
    return {
      version: DATA_VERSION,
      tracks: defaultTracks.map((t) => ({ ...t })),
      moments: defaultMoments.map((m) => ({ ...m })),
      siteText: clone(defaultSiteText),
    }
  })

  // Firebase 云同步
  const cloudReady = !!db
  const isLocalUpdate = useRef(false) // 区分：是本机改动 vs 云端推送
  const hasLoadedCloud = useRef(false)

  useEffect(() => {
    if (!db) return

    const configRef = ref(db, 'config')

    // 监听云端变化
    const unsub = onValue(configRef, (snap) => {
      const cloudData = snap.val()
      if (!cloudData) {
        // 云端还没有数据，把本地数据上传
        if (!hasLoadedCloud.current) {
          hasLoadedCloud.current = true
          dbSet(configRef, data).catch(() => {})
        }
        return
      }

      hasLoadedCloud.current = true

      // 云端数据到达 → 更新本地（标记为非本地更新，跳过回写）
      isLocalUpdate.current = false
      const storedVersion: number = cloudData.version ?? 0
      const cloudConfig: ConfigData = {
        version: DATA_VERSION,
        tracks: cloudData.tracks ?? defaultTracks.map((t) => ({ ...t })),
        moments: mergeMoments(cloudData.moments, storedVersion),
        siteText: mergeSiteText(cloudData.siteText),
      }
      setData(cloudConfig)

      // 同步到 localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudConfig))
      } catch {
        /* noop */
      }
    })

    return () => unsub()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 本地数据变化时写入 localStorage + Firebase
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* noop */
    }

    // 只在本地用户主动修改时上传到云端
    if (cloudReady && db && isLocalUpdate.current) {
      const configRef = ref(db, 'config')
      dbSet(configRef, data).catch(() => {})
    }
    // 重置标记
    isLocalUpdate.current = true
  }, [data, cloudReady])

  const value: ConfigContextValue = {
    tracks: data.tracks,
    moments: data.moments,
    siteText: data.siteText,
    visibleTracks: data.tracks.filter((t) => !t.hidden),
    visibleMoments: data.moments.filter((m) => !m.hidden),
    setTracks: (tracks) => {
      isLocalUpdate.current = true
      setData((d) => ({ ...d, tracks }))
    },
    setMoments: (moments) => {
      isLocalUpdate.current = true
      setData((d) => ({ ...d, moments }))
    },
    setSiteText: (siteText) => {
      isLocalUpdate.current = true
      setData((d) => ({ ...d, siteText }))
    },
    reset: () => {
      isLocalUpdate.current = true
      setData({
        version: DATA_VERSION,
        tracks: defaultTracks.map((t) => ({ ...t })),
        moments: defaultMoments.map((m) => ({ ...m })),
        siteText: clone(defaultSiteText),
      })
    },
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
          const importedVersion: number = parsed.version ?? 0
          isLocalUpdate.current = true
          setData({
            version: DATA_VERSION,
            tracks: parsed.tracks,
            moments: mergeMoments(parsed.moments, importedVersion),
            siteText: mergeSiteText(parsed.siteText),
          })
          return true
        }
      } catch {
        /* noop */
      }
      return false
    },
    cloudReady,
  }

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider')
  return ctx
}
