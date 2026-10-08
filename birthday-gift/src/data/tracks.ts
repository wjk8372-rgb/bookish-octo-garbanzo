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
    mood: 'Richard Clayderman',
    src: './audio/dream-wedding.mp3',
    volume: 0.7,
  },
]
