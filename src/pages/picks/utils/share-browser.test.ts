import { describe, expect, it } from 'vitest'

import { canvasToShareImage, getShareImageFilename } from './share-browser'

function canvasReturning(blob: Blob | null) {
  return {
    toBlob(callback: BlobCallback) {
      callback(blob)
    },
  } as HTMLCanvasElement
}

describe('canvasToShareImage', () => {
  it('keeps WebP output when the browser supports it', async () => {
    const blob = new Blob(['webp'], { type: 'image/webp' })

    await expect(canvasToShareImage(canvasReturning(blob))).resolves.toBe(blob)
  })

  it('accepts the PNG fallback returned by browsers without WebP encoding', async () => {
    const blob = new Blob(['png'], { type: 'image/png' })

    await expect(canvasToShareImage(canvasReturning(blob))).resolves.toBe(blob)
  })

  it('rejects missing or unsupported output', async () => {
    await expect(canvasToShareImage(canvasReturning(null))).rejects.toThrow(
      'could not generate the share image',
    )
    await expect(
      canvasToShareImage(canvasReturning(new Blob(['gif'], { type: 'image/gif' }))),
    ).rejects.toThrow('unsupported image type')
  })
})

describe('share image filenames', () => {
  it('uses the image format returned by the browser', () => {
    expect(getShareImageFilename('  The Guthix Gambit!  ', 'image/webp')).toBe(
      'the-guthix-gambit.webp',
    )
    expect(getShareImageFilename('  The Guthix Gambit!  ', 'image/png')).toBe(
      'the-guthix-gambit.png',
    )
  })

  it('uses the event name when the build name is empty', () => {
    expect(getShareImageFilename('')).toBe(
      'runescape-leagues-2-equilibrium.webp',
    )
  })
})
