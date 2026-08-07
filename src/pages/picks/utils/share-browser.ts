const SHARE_WEBP_QUALITY = 0.9
const SHARE_IMAGE_TYPES = new Set(['image/png', 'image/webp'])

export function canvasToShareImage(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('This browser could not generate the share image'))
          return
        }
        if (!SHARE_IMAGE_TYPES.has(blob.type)) {
          reject(new Error(`This browser generated an unsupported image type: ${blob.type || 'unknown'}`))
          return
        }
        resolve(blob)
      },
      'image/webp',
      SHARE_WEBP_QUALITY,
    )
  })
}

export function getShareImageFilename(buildName: string, imageType = 'image/webp') {
  const filename = buildName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  const extension = imageType === 'image/png' ? 'png' : 'webp'
  return `${filename || 'runescape-leagues-2-equilibrium'}.${extension}`
}

export async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await Promise.race([
        navigator.clipboard.writeText(value),
        new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error('Clipboard timed out')), 1_500),
        ),
      ])
      return
    } catch {
      // Fall back when clipboard permission is unavailable.
    }
  }

  const textArea = document.createElement('textarea')
  textArea.value = value
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.select()
  const copied = document.execCommand('copy')
  textArea.remove()
  if (!copied) throw new Error('The share was created, but the link could not be copied')
}


