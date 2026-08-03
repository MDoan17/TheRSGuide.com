import {
  createShareResponseSchema,
  type CreateShareRequest,
} from '../../shared/share-contract'

async function getErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown }
    if (typeof body.error === 'string') return body.error
  } catch {
    // Fall through to a status-based message.
  }
  return `Share request failed (${response.status})`
}

export async function createShare(request: CreateShareRequest, image: Blob) {
  const body = new FormData()
  body.append('build', JSON.stringify(request))
  body.append('image', image, 'build.webp')

  const response = await fetch('/api/shares', {
    method: 'POST',
    body,
  })
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return localizeShare(createShareResponseSchema.parse(await response.json()).share)
}

export async function getSharedBuild(code: string) {
  const response = await fetch(`/api/shares/${encodeURIComponent(code)}`)
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return localizeShare(createShareResponseSchema.parse(await response.json()).share)
}

function localizeShare<T extends { code: string; shareUrl: string }>(share: T): T {
  return {
    ...share,
    shareUrl: `${window.location.origin}/leagues/leagues-ii/picker?share=${encodeURIComponent(share.code)}`,
  }
}

