import { useCallback, useEffect, useRef, useState } from 'react'
import { Howl } from 'howler'
import { tracks, type Track } from '../data/tracks'

const FADE_MS = 1200
const DUCK_VOLUME = 0.05

export type BgmState = {
  tracks: Track[]
  currentTrack: Track | null
  isPlaying: boolean
  volume: number
  isMuted: boolean
  selectTrack: (id: string) => void
  play: () => void
  pause: () => void
  toggle: () => void
  setVolume: (v: number) => void
  toggleMute: () => void
  duck: () => void
  unduck: () => void
}

export function useBgm(): BgmState {
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(0.25)
  const [isMuted, setIsMuted] = useState(false)

  const howlRef = useRef<Howl | null>(null)
  const currentTrackRef = useRef<Track | null>(null)
  const targetVolumeRef = useRef(0.25)
  const isDuckedRef = useRef(false)
  const fadeTimerRef = useRef<number | null>(null)

  const currentTrack = tracks.find((t) => t.id === currentId) ?? null

  const stopCurrent = useCallback(() => {
    const h = howlRef.current
    if (h) {
      try {
        h.stop()
        h.unload()
      } catch {
        /* noop */
      }
      howlRef.current = null
    }
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
  }, [])

  const playTrack = useCallback(
    (track: Track, vol: number) => {
      stopCurrent()
      const howl = new Howl({
        src: [track.src],
        html5: true,
        loop: true,
        volume: 0,
        preload: true,
      })
      howlRef.current = howl
      howl.once('play', () => {
        howl.fade(0, vol, FADE_MS)
      })
      howl.on('playerror', () => {
        setIsPlaying(false)
      })
      howl.play()
      setIsPlaying(true)
    },
    [stopCurrent],
  )

  const selectTrack = useCallback(
    (id: string) => {
      const track = tracks.find((t) => t.id === id)
      if (!track) return
      currentTrackRef.current = track
      setCurrentId(id)
      const vol = isMuted ? 0 : targetVolumeRef.current * track.volume
      if (howlRef.current) {
        // fade out old then switch
        const old = howlRef.current
        try {
          old.fade(old.volume(), 0, FADE_MS)
        } catch {
          /* noop */
        }
        fadeTimerRef.current = window.setTimeout(() => {
          stopCurrent()
          playTrack(track, vol)
        }, FADE_MS)
      } else {
        playTrack(track, vol)
      }
    },
    [isMuted, playTrack, stopCurrent],
  )

  const play = useCallback(() => {
    const track = currentTrackRef.current ?? tracks[0]
    if (!track) return
    if (!howlRef.current || currentTrackRef.current?.id !== track.id) {
      selectTrack(track.id)
    } else {
      try {
        howlRef.current.play()
        setIsPlaying(true)
      } catch {
        /* noop */
      }
    }
  }, [selectTrack])

  const pause = useCallback(() => {
    const h = howlRef.current
    if (h) {
      try {
        h.pause()
      } catch {
        /* noop */
      }
    }
    setIsPlaying(false)
  }, [])

  const toggle = useCallback(() => {
    if (isPlaying) pause()
    else play()
  }, [isPlaying, pause, play])

  const setVolume = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v))
      targetVolumeRef.current = clamped
      setVolumeState(clamped)
      if (isMuted) return
      const h = howlRef.current
      const track = currentTrackRef.current
      if (h && track) {
        const target = isDuckedRef.current ? DUCK_VOLUME : clamped * track.volume
        try {
          h.fade(h.volume(), target, 400)
        } catch {
          /* noop */
        }
      }
    },
    [isMuted],
  )

  const toggleMute = useCallback(() => {
    setIsMuted((m) => {
      const next = !m
      const h = howlRef.current
      const track = currentTrackRef.current
      if (h && track) {
        const target = next ? 0 : targetVolumeRef.current * track.volume
        try {
          h.fade(h.volume(), target, 400)
        } catch {
          /* noop */
        }
      }
      return next
    })
  }, [])

  const duck = useCallback(() => {
    isDuckedRef.current = true
    const h = howlRef.current
    if (h) {
      try {
        h.fade(h.volume(), DUCK_VOLUME, 800)
      } catch {
        /* noop */
      }
    }
  }, [])

  const unduck = useCallback(() => {
    isDuckedRef.current = false
    const h = howlRef.current
    const track = currentTrackRef.current
    if (h && track && !isMuted) {
      const target = targetVolumeRef.current * track.volume
      try {
        h.fade(h.volume(), target, 800)
      } catch {
        /* noop */
      }
    }
  }, [isMuted])

  useEffect(() => {
    return () => {
      stopCurrent()
    }
  }, [stopCurrent])

  return {
    tracks,
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    selectTrack,
    play,
    pause,
    toggle,
    setVolume,
    toggleMute,
    duck,
    unduck,
  }
}
