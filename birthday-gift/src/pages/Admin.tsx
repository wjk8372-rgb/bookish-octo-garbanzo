import { useState, type ChangeEvent } from 'react'
import { useConfig, type TrackConfig, type MomentConfig, type SiteText } from '../config/ConfigContext'

type Tab = 'songs' | 'timeline' | 'letters' | 'siteText'

function moveItem<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir
  if (j < 0 || j >= arr.length) return arr
  const copy = [...arr]
  ;[copy[i], copy[j]] = [copy[j], copy[i]]
  return copy
}

const btnBase =
  'px-3 py-1.5 rounded-lg text-sm transition-colors border'
const btnDark = `${btnBase} bg-night-700 border-night-500 text-text-dim hover:text-amber-soft hover:border-amber-warm/40`
const btnAmber = `${btnBase} bg-amber-warm/15 border-amber-warm/30 text-amber-soft hover:bg-amber-warm/25`
const btnRed = `${btnBase} bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20`

const inputCls =
  'w-full bg-night-800 border border-night-500 rounded-lg px-3 py-2 text-sm text-text focus:border-amber-warm/50 outline-none'
const labelCls = 'text-xs text-text-faint mb-1 block'

export default function Admin() {
  const { tracks, moments, siteText, setTracks, setMoments, setSiteText, reset, exportJSON, importJSON } =
    useConfig()
  const [tab, setTab] = useState<Tab>('songs')

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      importJSON(reader.result as string)
    }
    reader.readAsText(file)
  }

  const chatMoments = moments.filter((m) => m.type === 'chat')
  const letterMoments = moments.filter((m) => m.type === 'letter')

  return (
    <div className="min-h-screen bg-night-900 text-text p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-serif text-amber-soft">管理后台</h1>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportJSON} className={btnDark}>
              导出配置
            </button>
            <label className={`${btnDark} cursor-pointer`}>
              导入配置
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </label>
            <button
              onClick={() => {
                if (confirm('确定恢复默认配置？所有修改将丢失。')) reset()
              }}
              className={btnRed}
            >
              恢复默认
            </button>
            <a
              href="#"
              className={`${btnAmber} no-underline`}
            >
              返回网站
            </a>
          </div>
        </div>

        {/* Config notice */}
        <div className="mb-6 p-3 rounded-lg bg-amber-warm/5 border border-amber-warm/15 text-xs text-text-faint">
          修改自动保存到浏览器本地。换设备需用"导出配置"迁移。
          访问 <code className="text-amber-soft">网址#admin</code> 可再次打开此页面。
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('songs')}
            className={`${tab === 'songs' ? btnAmber : btnDark}`}
          >
            歌曲 ({tracks.length})
          </button>
          <button
            onClick={() => setTab('timeline')}
            className={`${tab === 'timeline' ? btnAmber : btnDark}`}
          >
            时间线 ({chatMoments.length})
          </button>
          <button
            onClick={() => setTab('letters')}
            className={`${tab === 'letters' ? btnAmber : btnDark}`}
          >
            信件 ({letterMoments.length})
          </button>
          <button
            onClick={() => setTab('siteText')}
            className={`${tab === 'siteText' ? btnAmber : btnDark}`}
          >
            网站文字
          </button>
        </div>

        {/* Songs Tab */}
        {tab === 'songs' && (
          <div className="space-y-3">
            {tracks.map((t, i) => (
              <SongItem
                key={t.id}
                track={t}
                index={i}
                total={tracks.length}
                onMove={(dir) => setTracks(moveItem(tracks, i, dir))}
                onToggle={() =>
                  setTracks(
                    tracks.map((x) =>
                      x.id === t.id ? { ...x, hidden: !x.hidden } : x,
                    ),
                  )
                }
                onUpdate={(patch) =>
                  setTracks(
                    tracks.map((x) =>
                      x.id === t.id ? { ...x, ...patch } : x,
                    ),
                  )
                }
              />
            ))}
          </div>
        )}

        {/* Timeline Tab */}
        {tab === 'timeline' && (
          <div className="space-y-4">
            {chatMoments.map((m, i) => (
              <MomentItem
                key={m.id}
                moment={m}
                index={i}
                total={chatMoments.length}
                onMove={(dir) => {
                  const realIdx = moments.findIndex((x) => x.id === m.id)
                  setMoments(moveItem(moments, realIdx, dir))
                }}
                onToggle={() =>
                  setMoments(
                    moments.map((x) =>
                      x.id === m.id ? { ...x, hidden: !x.hidden } : x,
                    ),
                  )
                }
                onUpdate={(patch) =>
                  setMoments(
                    moments.map((x) =>
                      x.id === m.id ? { ...x, ...patch } : x,
                    ),
                  )
                }
              />
            ))}
          </div>
        )}

        {/* Letters Tab */}
        {tab === 'letters' && (
          <div className="space-y-4">
            {letterMoments.map((m, i) => (
              <LetterItem
                key={m.id}
                moment={m}
                index={i}
                total={letterMoments.length}
                onMove={(dir) => {
                  const realIdx = moments.findIndex((x) => x.id === m.id)
                  setMoments(moveItem(moments, realIdx, dir))
                }}
                onToggle={() =>
                  setMoments(
                    moments.map((x) =>
                      x.id === m.id ? { ...x, hidden: !x.hidden } : x,
                    ),
                  )
                }
                onUpdate={(patch) =>
                  setMoments(
                    moments.map((x) =>
                      x.id === m.id ? { ...x, ...patch } : x,
                    ),
                  )
                }
              />
            ))}
          </div>
        )}

        {/* Site Text Tab */}
        {tab === 'siteText' && (
          <SiteTextEditor
            siteText={siteText}
            onChange={setSiteText}
          />
        )}
      </div>
    </div>
  )
}

// ── Song Item ──
function SongItem({
  track,
  index,
  total,
  onMove,
  onToggle,
  onUpdate,
}: {
  track: TrackConfig
  index: number
  total: number
  onMove: (dir: -1 | 1) => void
  onToggle: () => void
  onUpdate: (patch: Partial<TrackConfig>) => void
}) {
  return (
    <div
      className={`p-4 rounded-xl border ${
        track.hidden
          ? 'bg-night-800/50 border-night-500 opacity-60'
          : 'bg-night-700/50 border-amber-warm/15'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <button
          disabled={index === 0}
          onClick={() => onMove(-1)}
          className="w-7 h-7 rounded bg-night-600 text-text-dim disabled:opacity-30"
        >
          ↑
        </button>
        <button
          disabled={index === total - 1}
          onClick={() => onMove(1)}
          className="w-7 h-7 rounded bg-night-600 text-text-dim disabled:opacity-30"
        >
          ↓
        </button>
        <button
          onClick={onToggle}
          className={`w-7 h-7 rounded ${track.hidden ? 'bg-night-600 text-text-faint' : 'bg-amber-warm/20 text-amber-soft'}`}
          title={track.hidden ? '点击显示' : '点击隐藏'}
        >
          {track.hidden ? '○' : '●'}
        </button>
        <span className="text-xs text-text-faint ml-1">#{index + 1}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>歌曲名</label>
          <input
            className={inputCls}
            value={track.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>歌手 / 备注</label>
          <input
            className={inputCls}
            value={track.mood}
            onChange={(e) => onUpdate({ mood: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}

// ── Moment Item (Timeline) ──
function MomentItem({
  moment,
  index,
  total,
  onMove,
  onToggle,
  onUpdate,
}: {
  moment: MomentConfig
  index: number
  total: number
  onMove: (dir: -1 | 1) => void
  onToggle: () => void
  onUpdate: (patch: Partial<MomentConfig>) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`p-4 rounded-xl border ${
        moment.hidden
          ? 'bg-night-800/50 border-night-500 opacity-60'
          : 'bg-night-700/50 border-amber-warm/15'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <button
          disabled={index === 0}
          onClick={() => onMove(-1)}
          className="w-7 h-7 rounded bg-night-600 text-text-dim disabled:opacity-30"
        >
          ↑
        </button>
        <button
          disabled={index === total - 1}
          onClick={() => onMove(1)}
          className="w-7 h-7 rounded bg-night-600 text-text-dim disabled:opacity-30"
        >
          ↓
        </button>
        <button
          onClick={onToggle}
          className={`w-7 h-7 rounded ${moment.hidden ? 'bg-night-600 text-text-faint' : 'bg-amber-warm/20 text-amber-soft'}`}
          title={moment.hidden ? '点击显示' : '点击隐藏'}
        >
          {moment.hidden ? '○' : '●'}
        </button>
        <span className="text-xs text-text-faint ml-1">
          #{index + 1} · {moment.date}
        </span>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="ml-auto text-xs text-amber-soft hover:underline"
        >
          {expanded ? '收起' : '展开详情'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>标题</label>
          <input
            className={inputCls}
            value={moment.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>日期</label>
          <input
            className={inputCls}
            value={moment.date}
            onChange={(e) => onUpdate({ date: e.target.value })}
          />
        </div>
      </div>

      <div className="mb-3">
        <label className={labelCls}>摘要（卡片正面副标题）</label>
        <input
          className={inputCls}
          value={moment.summary}
          onChange={(e) => onUpdate({ summary: e.target.value })}
        />
      </div>

      <div className="mb-3">
        <label className={labelCls}>
          旁白 / 翻转背面（"你可能不知道的是…"）
        </label>
        <textarea
          className={`${inputCls} min-h-[80px] resize-y`}
          value={moment.note}
          onChange={(e) => onUpdate({ note: e.target.value })}
        />
      </div>

      <div className="mb-3">
        <label className={labelCls}>标签（逗号分隔）</label>
        <input
          className={inputCls}
          value={moment.tags.join('，')}
          onChange={(e) =>
            onUpdate({
              tags: e.target.value
                .split(/[,，]/)
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </div>

      {expanded && moment.chat && (
        <div className="mt-3 pt-3 border-t border-night-500/50 space-y-2">
          <p className="text-xs text-text-faint mb-2">聊天消息内容：</p>
          {moment.chat.map((msg, j) => (
            <div
              key={j}
              className="flex items-start gap-2 p-2 rounded bg-night-800/50"
            >
              <span className="text-xs text-text-faint mt-1.5 shrink-0">
                {msg.from === 'her' ? '她' : '我'}
              </span>
              <div className="flex-1 space-y-1">
                <input
                  className={`${inputCls} text-xs`}
                  placeholder="消息文字"
                  value={msg.text}
                  onChange={(e) =>
                    onUpdate({
                      chat: moment.chat!.map((m2, k) =>
                        k === j ? { ...m2, text: e.target.value } : m2,
                      ),
                    })
                  }
                />
                <div className="flex gap-2">
                  <input
                    className={`${inputCls} text-xs flex-1`}
                    placeholder="时间（可选）"
                    value={msg.time ?? ''}
                    onChange={(e) =>
                      onUpdate({
                        chat: moment.chat!.map((m2, k) =>
                          k === j ? { ...m2, time: e.target.value } : m2,
                        ),
                      })
                    }
                  />
                  <input
                    className={`${inputCls} text-xs flex-1`}
                    placeholder="图片路径（可选）"
                    value={msg.image ?? ''}
                    onChange={(e) =>
                      onUpdate({
                        chat: moment.chat!.map((m2, k) =>
                          k === j ? { ...m2, image: e.target.value } : m2,
                        ),
                      })
                    }
                  />
                </div>
                <input
                  className={`${inputCls} text-xs`}
                  placeholder="引用消息（可选）"
                  value={msg.quote ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      chat: moment.chat!.map((m2, k) =>
                        k === j ? { ...m2, quote: e.target.value } : m2,
                      ),
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Letter Item ──
function LetterItem({
  moment,
  index,
  total,
  onMove,
  onToggle,
  onUpdate,
}: {
  moment: MomentConfig
  index: number
  total: number
  onMove: (dir: -1 | 1) => void
  onToggle: () => void
  onUpdate: (patch: Partial<MomentConfig>) => void
}) {
  return (
    <div
      className={`p-4 rounded-xl border ${
        moment.hidden
          ? 'bg-night-800/50 border-night-500 opacity-60'
          : 'bg-night-700/50 border-amber-warm/15'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <button
          disabled={index === 0}
          onClick={() => onMove(-1)}
          className="w-7 h-7 rounded bg-night-600 text-text-dim disabled:opacity-30"
        >
          ↑
        </button>
        <button
          disabled={index === total - 1}
          onClick={() => onMove(1)}
          className="w-7 h-7 rounded bg-night-600 text-text-dim disabled:opacity-30"
        >
          ↓
        </button>
        <button
          onClick={onToggle}
          className={`w-7 h-7 rounded ${moment.hidden ? 'bg-night-600 text-text-faint' : 'bg-amber-warm/20 text-amber-soft'}`}
          title={moment.hidden ? '点击显示' : '点击隐藏'}
        >
          {moment.hidden ? '○' : '●'}
        </button>
        <span className="text-xs text-text-faint ml-1">
          #{index + 1} · {moment.date}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>信封名称</label>
          <input
            className={inputCls}
            value={moment.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>日期</label>
          <input
            className={inputCls}
            value={moment.date}
            onChange={(e) => onUpdate({ date: e.target.value })}
          />
        </div>
      </div>

      <div className="mb-3">
        <label className={labelCls}>摘要</label>
        <input
          className={inputCls}
          value={moment.summary}
          onChange={(e) => onUpdate({ summary: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>信件内部标题</label>
          <input
            className={inputCls}
            value={moment.letter?.title ?? ''}
            onChange={(e) =>
              onUpdate({
                letter: { ...moment.letter!, title: e.target.value },
              })
            }
          />
        </div>
        <div>
          <label className={labelCls}>写信人</label>
          <select
            className={inputCls}
            value={moment.letter?.from ?? 'me'}
            onChange={(e) =>
              onUpdate({
                letter: {
                  ...moment.letter!,
                  from: e.target.value as 'me' | 'her',
                },
              })
            }
          >
            <option value="me">我写的</option>
            <option value="her">她写的</option>
          </select>
        </div>
      </div>

      <div className="mb-3">
        <label className={labelCls}>信件正文</label>
        <textarea
          className={`${inputCls} min-h-[120px] resize-y`}
          value={moment.letter?.content ?? ''}
          onChange={(e) =>
            onUpdate({
              letter: { ...moment.letter!, content: e.target.value },
            })
          }
        />
      </div>

      <div className="mb-3">
        <label className={labelCls}>旁白 / 翻转背面</label>
        <textarea
          className={`${inputCls} min-h-[60px] resize-y`}
          value={moment.note}
          onChange={(e) => onUpdate({ note: e.target.value })}
        />
      </div>

      <div>
        <label className={labelCls}>标签（逗号分隔）</label>
        <input
          className={inputCls}
          value={moment.tags.join('，')}
          onChange={(e) =>
            onUpdate({
              tags: e.target.value
                .split(/[,，]/)
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </div>
    </div>
  )
}

// ── Site Text Editor ──
function SiteTextEditor({
  siteText,
  onChange,
}: {
  siteText: SiteText
  onChange: (s: SiteText) => void
}) {
  const [section, setSection] = useState<'hero' | 'prologue' | 'stats' | 'optionalLetter' | 'footer'>('hero')

  const update = (section: keyof SiteText, patch: Partial<typeof siteText[typeof section]>) =>
    onChange({ ...siteText, [section]: { ...siteText[section], ...patch } })

  const sectionBtns: { key: typeof section; label: string }[] = [
    { key: 'hero', label: '首页' },
    { key: 'prologue', label: '序章' },
    { key: 'stats', label: '数字' },
    { key: 'optionalLetter', label: '可选信' },
    { key: 'footer', label: '结尾' },
  ]

  return (
    <div>
      {/* Section selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {sectionBtns.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`${section === s.key ? btnAmber : btnDark}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mb-4 p-3 rounded-lg bg-night-700/50 border border-amber-warm/15 text-xs text-text-faint">
        提示：<code className="text-amber-soft">{'{days}'}</code> = 认识天数，<code className="text-amber-soft">{'{toAnniv}'}</code> = 距一周年天数，<code className="text-amber-soft">{'{startDate}'}</code> = 起始日期，<code className="text-amber-soft">{'{annivDate}'}</code> = 周年日期
      </div>

      {/* Hero section */}
      {section === 'hero' && (
        <div className="space-y-3 p-4 rounded-xl bg-night-700/50 border border-amber-warm/15">
          <div>
            <label className={labelCls}>日期范围（顶部小字）</label>
            <input className={inputCls} value={siteText.hero.dateRange}
              onChange={(e) => update('hero', { dateRange: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>主标题（大字）</label>
              <input className={inputCls} value={siteText.hero.mainTitle}
                onChange={(e) => update('hero', { mainTitle: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>副标题（标题下方）</label>
              <input className={inputCls} value={siteText.hero.subTitle}
                onChange={(e) => update('hero', { subTitle: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelCls}>第一行文字</label>
            <input className={inputCls} value={siteText.hero.line1}
              onChange={(e) => update('hero', { line1: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>第二行文字（可用变量）</label>
            <input className={inputCls} value={siteText.hero.line2}
              onChange={(e) => update('hero', { line2: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>按钮文字</label>
              <input className={inputCls} value={siteText.hero.buttonText}
                onChange={(e) => update('hero', { buttonText: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>滚动提示</label>
              <input className={inputCls} value={siteText.hero.scrollHint}
                onChange={(e) => update('hero', { scrollHint: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {/* Prologue section */}
      {section === 'prologue' && (
        <div className="space-y-3 p-4 rounded-xl bg-night-700/50 border border-amber-warm/15">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>标题</label>
              <input className={inputCls} value={siteText.prologue.title}
                onChange={(e) => update('prologue', { title: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>副标题</label>
              <input className={inputCls} value={siteText.prologue.subtitle}
                onChange={(e) => update('prologue', { subtitle: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelCls}>联系人名称（聊天顶栏）</label>
            <input className={inputCls} value={siteText.prologue.contactName}
              onChange={(e) => update('prologue', { contactName: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>底部引言</label>
            <textarea className={`${inputCls} min-h-[60px] resize-y`} value={siteText.prologue.quote}
              onChange={(e) => update('prologue', { quote: e.target.value })} />
          </div>
          <div className="pt-3 border-t border-night-500/50">
            <p className="text-xs text-text-faint mb-2">序章聊天消息：</p>
            {siteText.prologue.messages.map((msg, j) => (
              <div key={j} className="flex items-start gap-2 p-2 rounded bg-night-800/50 mb-1">
                <select className="bg-night-800 border border-night-500 rounded px-2 py-1 text-xs text-text shrink-0"
                  value={msg.from}
                  onChange={(e) => update('prologue', {
                    messages: siteText.prologue.messages.map((m2, k) =>
                      k === j ? { ...m2, from: e.target.value as 'me' | 'her' } : m2),
                  })}>
                  <option value="her">她</option>
                  <option value="me">我</option>
                </select>
                <input className={`${inputCls} text-xs flex-1`} value={msg.text}
                  onChange={(e) => update('prologue', {
                    messages: siteText.prologue.messages.map((m2, k) =>
                      k === j ? { ...m2, text: e.target.value } : m2),
                  })} />
                <input className={`${inputCls} text-xs w-20`} value={msg.time}
                  onChange={(e) => update('prologue', {
                    messages: siteText.prologue.messages.map((m2, k) =>
                      k === j ? { ...m2, time: e.target.value } : m2),
                  })} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats section */}
      {section === 'stats' && (
        <div className="space-y-3 p-4 rounded-xl bg-night-700/50 border border-amber-warm/15">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>标题</label>
              <input className={inputCls} value={siteText.stats.title}
                onChange={(e) => update('stats', { title: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>副标题</label>
              <input className={inputCls} value={siteText.stats.subtitle}
                onChange={(e) => update('stats', { subtitle: e.target.value })} />
            </div>
          </div>
          <div className="pt-3 border-t border-night-500/50 space-y-2">
            <p className="text-xs text-text-faint mb-2">数字卡片：</p>
            {siteText.stats.items.map((item, j) => (
              <div key={j} className="p-2 rounded bg-night-800/50 space-y-1">
                <div className="flex gap-2">
                  <input className={`${inputCls} text-xs`} placeholder="标签" value={item.label}
                    onChange={(e) => update('stats', {
                      items: siteText.stats.items.map((it, k) =>
                        k === j ? { ...it, label: e.target.value } : it),
                    })} />
                  <input className={`${inputCls} text-xs`} placeholder="值（可用变量）" value={item.value}
                    onChange={(e) => update('stats', {
                      items: siteText.stats.items.map((it, k) =>
                        k === j ? { ...it, value: e.target.value } : it),
                    })} />
                </div>
                <input className={`${inputCls} text-xs`} placeholder="副文字（可用变量）" value={item.sub}
                  onChange={(e) => update('stats', {
                    items: siteText.stats.items.map((it, k) =>
                      k === j ? { ...it, sub: e.target.value } : it),
                  })} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Letter section */}
      {section === 'optionalLetter' && (
        <div className="space-y-3 p-4 rounded-xl bg-night-700/50 border border-amber-warm/15">
          <div>
            <label className={labelCls}>引导文字（按钮上方）</label>
            <input className={inputCls} value={siteText.optionalLetter.intro}
              onChange={(e) => update('optionalLetter', { intro: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>按钮文字</label>
              <input className={inputCls} value={siteText.optionalLetter.buttonText}
                onChange={(e) => update('optionalLetter', { buttonText: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>按钮副文字</label>
              <input className={inputCls} value={siteText.optionalLetter.buttonSubtext}
                onChange={(e) => update('optionalLetter', { buttonSubtext: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelCls}>信件正文</label>
            <textarea className={`${inputCls} min-h-[200px] resize-y font-mono`} value={siteText.optionalLetter.letterContent}
              onChange={(e) => update('optionalLetter', { letterContent: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>落款</label>
            <input className={inputCls} value={siteText.optionalLetter.signature}
              onChange={(e) => update('optionalLetter', { signature: e.target.value })} />
          </div>
        </div>
      )}

      {/* Footer section */}
      {section === 'footer' && (
        <div className="space-y-3 p-4 rounded-xl bg-night-700/50 border border-amber-warm/15">
          <div>
            <label className={labelCls}>结尾大标题</label>
            <input className={inputCls} value={siteText.footer.title}
              onChange={(e) => update('footer', { title: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>第一行祝福语</label>
            <textarea className={`${inputCls} min-h-[40px] resize-y`} value={siteText.footer.line1}
              onChange={(e) => update('footer', { line1: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>第二行祝福语</label>
            <textarea className={`${inputCls} min-h-[40px] resize-y`} value={siteText.footer.line2}
              onChange={(e) => update('footer', { line2: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>"回到开头"按钮</label>
              <input className={inputCls} value={siteText.footer.restartButton}
                onChange={(e) => update('footer', { restartButton: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>"再听一遍"按钮</label>
              <input className={inputCls} value={siteText.footer.replayButton}
                onChange={(e) => update('footer', { replayButton: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelCls}>版权文字（最底部）</label>
            <input className={inputCls} value={siteText.footer.copyright}
              onChange={(e) => update('footer', { copyright: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  )
}
