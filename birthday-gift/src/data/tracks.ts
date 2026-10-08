export type Track = {
  id: string
  name: string
  mood: string
  src: string
  volume: number
}

export const tracks: Track[] = [
  {
    id: 'dream-wedding',
    name: '梦中的婚礼',
    mood: 'Mariage d\'Amour',
    src: './audio/dream-wedding.mp3',
    volume: 0.7,
  },
  {
    id: 'souvenirs',
    name: '爱的纪念',
    mood: 'Souvenirs d\'enfance',
    src: './audio/souvenirs.mp3',
    volume: 0.7,
  },
  {
    id: 'adeline',
    name: '水边的阿狄丽娜',
    mood: 'Ballade Pour Adeline',
    src: './audio/adeline.mp3',
    volume: 0.7,
  },
  {
    id: 'autumn',
    name: '秋日私语',
    mood: 'A Comme Amour',
    src: './audio/autumn.mp3',
    volume: 0.7,
  },
]
