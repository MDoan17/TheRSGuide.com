const RUNEMETRICS = 'https://apps.runescape.com/runemetrics'

const send = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

export async function handlePlayerApi(req, res) {
  const username = decodeURIComponent((req.url?.split('/api/player/')[1] ?? '').split('?')[0]).trim()
  if (!username) return send(res, 400, { error: 'Username is required' })
  try {
    const user = encodeURIComponent(username)
    const [profileResponse, questResponse] = await Promise.all([
      fetch(`${RUNEMETRICS}/profile/profile?user=${user}&activities=0`, { headers: { accept: 'application/json' } }),
      fetch(`${RUNEMETRICS}/quests?user=${user}`, { headers: { accept: 'application/json' } }),
    ])
    if (!profileResponse.ok || !questResponse.ok) return send(res, 502, { error: 'Failed to fetch player data' })
    const [profile, questPayload] = await Promise.all([profileResponse.json(), questResponse.json()])
    if (profile.error === 'NO_PROFILE') return send(res, 404, profile)
    if (profile.error === 'PROFILE_PRIVATE') return send(res, 403, profile)
    return send(res, 200, { ...profile, quests: Array.isArray(questPayload) ? questPayload : questPayload.quests })
  } catch {
    return send(res, 500, { error: 'Failed to fetch player data' })
  }
}
