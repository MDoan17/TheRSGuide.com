export const SHARE_MESSAGE =
  'Check out my picks for RuneScape Leagues II: Equilibrium!'

export function createDiscordShareText(shareUrl: string): string {
  return `${SHARE_MESSAGE}\n${shareUrl}`
}

export function createTwitterShareUrl(shareUrl: string): string {
  const params = new URLSearchParams({ text: SHARE_MESSAGE, url: shareUrl })
  return `https://x.com/intent/tweet?${params.toString()}`
}


