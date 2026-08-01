import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { EvaluatedRecommendation } from '@/lib/player-progression'
import { getPlayerSuggestions } from '@/lib/player-suggestions'

const stageLabels = {
  early: 'Early game',
  mid: 'Mid game',
  late: 'Late game',
}

export function ProgressionAdvisor({
  username,
  recommendations,
}: {
  username: string
  recommendations: EvaluatedRecommendation[]
}) {
  const [open, setOpen] = useState(false)
  const suggestions = useMemo(() => getPlayerSuggestions(recommendations), [recommendations])
  const [primary, ...secondary] = suggestions

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="progression-advisor-trigger">
          <span className="progression-advisor-trigger-square" aria-hidden="true" />
          <span>Click me for suggestions</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="progression-advisor-dialog">
        <ScrollArea className="progression-advisor-scroll">
          <div className="progression-advisor-body">
            <DialogHeader>
              <DialogTitle>{username}&apos;s next steps</DialogTitle>
              <DialogDescription>Suggestions based on this player&apos;s RuneMetrics data and manually checked unlocks.</DialogDescription>
            </DialogHeader>

            {primary ? (
              <>
                <section className="progression-advisor-primary">
                  <div className="progression-advisor-primary-heading">
                    <h3>{primary.recommendation.title}</h3>
                    <span>{primary.kind === 'ready' ? 'Ready now' : 'Build toward'} {'\u00b7'} {stageLabels[primary.recommendation.stage]}</span>
                  </div>
                  <p>{primary.reason}</p>
                  <Button size="sm" asChild>
                    <Link to={primary.recommendation.path}>Open guide<ArrowRight data-icon="inline-end" /></Link>
                  </Button>
                </section>

                {secondary.length > 0 && (
                  <div className="progression-advisor-list">
                    {secondary.map((suggestion) => (
                      <Link key={suggestion.recommendation.path} to={suggestion.recommendation.path} className="progression-advisor-suggestion">
                        <span>
                          <strong>{suggestion.recommendation.title}</strong>
                          <small>{suggestion.kind === 'ready' ? 'Ready now' : 'Build toward'} {'\u00b7'} {stageLabels[suggestion.recommendation.stage]}</small>
                          <span>{suggestion.reason}</span>
                        </span>
                        <ArrowRight aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="progression-advisor-complete">Everything in the current progression list is complete. You&apos;re ready for the next set of recommendations.</p>
            )}
          </div>
        </ScrollArea>

        <div className="progression-advisor-character" role="img" aria-label="Suggestion character placeholder" />
      </DialogContent>
    </Dialog>
  )
}
