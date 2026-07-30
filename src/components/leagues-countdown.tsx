import { useEffect, useState } from 'react'
import { countdownUnits, resolveLeaguesCountdown } from '@/lib/leagues-countdown'

const countdownParts = [
  ['days', 'Days'],
  ['hours', 'Hours'],
  ['minutes', 'Minutes'],
  ['seconds', 'Seconds'],
] as const

export function LeaguesCountdown() {
  const [now, setNow] = useState(() => Date.now())
  const countdown = resolveLeaguesCountdown(
    now,
    import.meta.env.VITE_LEAGUES_START_DATE,
    import.meta.env.VITE_LEAGUES_END_DATE,
  )

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  if (!countdown) return null

  const units = countdownUnits(countdown.targetTimestamp - now)
  const phaseLabel = countdown.phase === 'starts' ? 'Leagues II begins in' : 'Leagues II ends in'

  return (
    <section
      className="leagues-countdown"
      data-countdown-phase={countdown.phase}
      aria-label={`${phaseLabel} ${Object.values(units).join(' ')}`}
    >
      <div className="leagues-countdown-units">
        {countdownParts.map(([key, label]) => (
          <span className="leagues-countdown-unit" key={key}>
            <strong>{String(units[key]).padStart(2, '0')}</strong>
            <small>{label}</small>
          </span>
        ))}
      </div>
    </section>
  )
}
