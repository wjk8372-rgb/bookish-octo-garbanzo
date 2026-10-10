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
  {
    id: 'my-love',
    name: 'My Love',
    mood: 'Westlife',
    src: './audio/my-love.mp3',
    volume: 0.7,
  },
  {
    id: 'gentle-heart',
    name: 'Gentle Heart',
    mood: 'Joshua Hyslop',
    src: './audio/gentle-heart.mp3',
    volume: 0.7,
  },
  {
    id: 'ephemeral-memories',
    name: '转瞬即逝的记忆',
    mood: 'Ephemeral Memories · MoreanP',
    src: './audio/ephemeral-memories.mp3',
    volume: 0.7,
  },
  {
    id: 'you-raise-me-up',
    name: 'You Raise Me Up',
    mood: 'Westlife',
    src: './audio/you-raise-me-up.mp3',
    volume: 0.7,
  },
  {
    id: 'not-in-nanjing',
    name: '你不在南京',
    mood: '南游记乐队',
    src: './audio/not-in-nanjing.mp3',
    volume: 0.7,
  },
]
