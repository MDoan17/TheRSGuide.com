import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, CircleDashed, LockKeyhole, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ProgressionAdvisor } from '@/components/progression-advisor'
import { usePlayerData } from '@/mdx_components/components/player-data-context'
import {
  evaluateProgression,
  type EvaluatedRecommendation,
  type ProgressionStage,
  type ProgressionStatus,
} from '@/lib/player-progression'

const stages: { key: ProgressionStage; title: string }[] = [
  { key: 'early', title: 'Early game' },
  { key: 'mid', title: 'Mid game' },
  { key: 'late', title: 'Late game' },
]

const EMPTY_MANUAL_COMPLETIONS = new Set<string>()
const MANUAL_COMPLETION_PREFIX = 'rs3-manual-progression:v1:'

const statusLabels: Record<ProgressionStatus, string> = {
  completed: 'Completed',
  ready: 'Requirements met',
  locked: 'Requirements not met',
}

function StatusIcon({ status }: { status: ProgressionStatus }) {
  if (status === 'completed') return <Check aria-hidden="true" />
  if (status === 'ready') return <CircleDashed aria-hidden="true" />
  return <LockKeyhole aria-hidden="true" />
}

function RecommendationRow({
  recommendation,
  onManualCompletionChange,
}: {
  recommendation: EvaluatedRecommendation
  onManualCompletionChange: (path: string, completed: boolean) => void
}) {
  const isManuallyTrackable = !recommendation.completionQuest
  const detail = recommendation.status === 'completed'
    ? isManuallyTrackable ? 'Confirmed by you' : 'Confirmed by RuneMetrics'
    : recommendation.status === 'locked'
    ? `Needs ${recommendation.missing.slice(0, 2).join(' · ')}${recommendation.missing.length > 2 ? ` · +${recommendation.missing.length - 2} more` : ''}`
    : recommendation.manualChecks.length
      ? `In-game check: ${recommendation.manualChecks[0]}${recommendation.manualChecks.length > 1 ? ` · +${recommendation.manualChecks.length - 1} more` : ''}`
      : recommendation.requirementCount
        ? `${recommendation.requirementCount} tracked requirement${recommendation.requirementCount === 1 ? '' : 's'}`
        : 'No additional tracked requirements'

  return (
    <article className="progression-row" data-status={recommendation.status}>
      {isManuallyTrackable ? (
        <span className="progression-manual-control">
          <Checkbox
            checked={recommendation.status === 'completed'}
            onCheckedChange={(checked) => onManualCompletionChange(recommendation.path, checked === true)}
            aria-label={`Mark ${recommendation.title} ${recommendation.status === 'completed' ? 'incomplete' : 'complete'}`}
          />
        </span>
      ) : (
        <span className="progression-status-icon"><StatusIcon status={recommendation.status} /></span>
      )}
      <Link className="progression-row-link" to={recommendation.path}>
        <span className="progression-row-copy">
          <span className="progression-row-title-line">
            <strong>{recommendation.title}</strong>
            <span className="progression-status-label">{statusLabels[recommendation.status]}</span>
          </span>
          <small>{detail}</small>
        </span>
        <ArrowRight className="progression-row-arrow" aria-hidden="true" />
      </Link>
    </article>
  )
}

function PlayerSearchForm({ initialValue = '' }: { initialValue?: string }) {
  const { searchPlayer, loading } = usePlayerData()
  const [, setSearchParams] = useSearchParams()
  const [username, setUsername] = useState(initialValue)

  useEffect(() => setUsername(initialValue), [initialValue])

  function submit(event: FormEvent) {
    event.preventDefault()
    const value = username.trim()
    if (!value) return
    setSearchParams({ username: value })
    void searchPlayer(value)
  }

  return (
    <form className="player-lookup-form" onSubmit={submit}>
      <div className="player-lookup-field">
        <Search aria-hidden="true" />
        <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter your username" aria-label="RuneScape username" />
      </div>
      <Button type="submit" disabled={loading || !username.trim()}>{loading ? 'Looking up…' : 'Look up player'}</Button>
    </form>
  )
}

function PlayerPageSkeleton() {
  return (
    <div className="player-page-loading" aria-label="Loading player progression">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-12 w-full" />
      <div className="progression-columns">
        {stages.map((stage) => <Skeleton key={stage.key} className="h-96 w-full" />)}
      </div>
    </div>
  )
}

export function PlayerPage() {
  const [searchParams] = useSearchParams()
  const requestedUsername = searchParams.get('username')?.trim() ?? ''
  const { playerData, loading, error, searchPlayer } = usePlayerData()
  const requestedRef = useRef('')
  const [manualCompletions, setManualCompletions] = useState<{ username: string; paths: Set<string> }>({
    username: '',
    paths: new Set(),
  })

  useEffect(() => {
    document.title = playerData ? `${playerData.username} Progression | The RS Guide` : 'Player Progression | The RS Guide'
    window.scrollTo(0, 0)
  }, [playerData])

  useEffect(() => {
    if (!requestedUsername) return
    if (loading) return
    if (playerData?.username.toLowerCase() === requestedUsername.toLowerCase()) return
    if (requestedRef.current.toLowerCase() === requestedUsername.toLowerCase()) return
    requestedRef.current = requestedUsername
    void searchPlayer(requestedUsername)
  }, [loading, playerData, requestedUsername, searchPlayer])

  useEffect(() => {
    if (!playerData) return
    const username = playerData.username.toLowerCase()
    let paths: string[] = []
    try {
      const saved = localStorage.getItem(`${MANUAL_COMPLETION_PREFIX}${username}`)
      const parsed = saved ? JSON.parse(saved) : []
      if (Array.isArray(parsed)) paths = parsed.filter((path): path is string => typeof path === 'string')
    } catch {
      paths = []
    }
    setManualCompletions({ username, paths: new Set(paths) })
  }, [playerData])

  const activeManualCompletions = playerData && manualCompletions.username === playerData.username.toLowerCase()
    ? manualCompletions.paths
    : EMPTY_MANUAL_COMPLETIONS
  const recommendations = useMemo(
    () => playerData ? evaluateProgression(playerData, activeManualCompletions) : [],
    [activeManualCompletions, playerData],
  )

  function setManualCompletion(path: string, completed: boolean) {
    if (!playerData) return
    const username = playerData.username.toLowerCase()
    setManualCompletions((current) => {
      const paths = new Set(current.username === username ? current.paths : [])
      if (completed) paths.add(path)
      else paths.delete(path)
      localStorage.setItem(`${MANUAL_COMPLETION_PREFIX}${username}`, JSON.stringify([...paths]))
      return { username, paths }
    })
  }

  return (
    <main className="player-page">
      <div className="player-page-inner">
        <nav className="player-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span>/</span><Link to="/extras">Extras</Link><span>/</span><b>Player</b>
        </nav>

        {!requestedUsername && !playerData && (
          <section className="player-empty-state">
            <h1>Find your next unlock.</h1>
            <p>Enter a RuneScape username to compare its levels and completed quests against every early, mid, and late game recommendation in the guide.</p>
            <PlayerSearchForm />
          </section>
        )}

        {loading && !playerData && <PlayerPageSkeleton />}

        {error && !loading && !playerData && (
          <section className="player-empty-state player-error-state">
            <h1>We couldn’t load that profile.</h1>
            <p>{error}. Check the spelling and make sure the RuneMetrics profile is public.</p>
            <PlayerSearchForm initialValue={requestedUsername} />
          </section>
        )}

        {playerData && (
          <>
            <header className="player-profile-header">
              <div className="player-title-line">
                <h1>{playerData.username}</h1>
                <span>Total level {playerData.totalLevel.toLocaleString()}</span>
              </div>
              <PlayerSearchForm initialValue={playerData.username} />
            </header>

            <p className="player-progress-note">Quest completion comes from RuneMetrics. Check off other unlocks yourself.</p>

            <div className="progression-columns">
              {stages.map((stage) => {
                const stageRecommendations = recommendations.filter((recommendation) => recommendation.stage === stage.key)
                return (
                  <section className="progression-stage" key={stage.key}>
                    <header>
                      <h2>{stage.title}<span>{stageRecommendations.filter((item) => item.status === 'completed').length}/{stageRecommendations.length}</span></h2>
                    </header>
                    <div className="progression-list">
                      {stageRecommendations.map((recommendation) => (
                        <RecommendationRow
                          key={recommendation.path}
                          recommendation={recommendation}
                          onManualCompletionChange={setManualCompletion}
                        />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
            <ProgressionAdvisor username={playerData.username} recommendations={recommendations} />
          </>
        )}
      </div>
    </main>
  )
}
