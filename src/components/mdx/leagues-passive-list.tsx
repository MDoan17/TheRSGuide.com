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
    <div className="mb-4">
      <h3 className="mb-2 text-lg font-semibold">Passives</h3>
      <ul className="list-disc pl-6">
        {passives.map((passive) => {
          const repeatedDescription = passive.title === passive.description

          return (
            <li className="my-1" key={`${passive.title}-${passive.description}`}>
              {repeatedDescription ? (
                passive.description
              ) : (
                <>
                  <strong>{passive.title}:</strong> {passive.description}
                </>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export { LeaguesPassiveList }
export type { LeaguesPassive, LeaguesPassiveListProps }
