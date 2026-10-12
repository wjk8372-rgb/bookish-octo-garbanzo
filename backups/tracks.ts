export type Track = {
  id: string
  name: string
  mood: string
  src: string
  volume: number
}

export const tracks: Track[] = [
  {
    id: 'opening',
    name: '初见',
    mood: '开场 · 轻柔',
    src: '/audio/opening.mp3',
    volume: 0.8,
  },
  {
    id: 'timeline',
    name: '时光',
    mood: '回忆 · 温暖',
    src: '/audio/timeline.mp3',
    volume: 0.7,
  },
  {
    id: 'letter',
    name: '信纸',
    mood: '信件 · 静谧',
    src: '/audio/letter.mp3',
    volume: 0.75,
  },
  {
    id: 'ending',
    name: '尾声',
    mood: '结尾 · 绵长',
    src: '/audio/ending.mp3',
    volume: 0.8,
  },
]
