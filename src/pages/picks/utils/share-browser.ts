const SHARE_WEBP_QUALITY = 0.9

export function canvasToWebP(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.type !== 'image/webp') {
          reject(new Error('This browser could not generate the WebP share image'))
          return
        }
        resolve(blob)
      },
      'image/webp',
      SHARE_WEBP_QUALITY,
    )
  })
}

export function getShareImageFilename(buildName: string) {
  const filename = buildName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${filename || 'runescape-leagues-2-equilibrium'}.webp`
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


