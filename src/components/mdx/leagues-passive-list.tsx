import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"

type LeaguesPassive = {
  title: string
  description: string
}

type LeaguesPassiveListProps = {
  passives: LeaguesPassive[]
}

function LeaguesPassiveList({ passives }: LeaguesPassiveListProps) {
  if (passives.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
        {passives.map((effect, effectIndex) => (
            <Popover key={effectIndex}>
                <PopoverTrigger>
                    <div className="bg-card p-2 cursor-pointer hover:bg-accent/50 text-xs">
                        <strong>{effect.title}</strong>
                    </div>
                </PopoverTrigger>
                <PopoverContent>
                    <p>{effect.description}</p>
                </PopoverContent>
            </Popover>
        ))}
    </div>
  )
}

export { LeaguesPassiveList }
export type { LeaguesPassive, LeaguesPassiveListProps }
