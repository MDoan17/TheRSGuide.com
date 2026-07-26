import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { afterEach, describe, expect, it } from 'vitest'
import {
  generateOpenGraphImage,
  OPEN_GRAPH_IMAGE_HEIGHT,
  openGraphImagePath,
  OPEN_GRAPH_IMAGE_WIDTH,
} from './open-graph-image.mjs'

const temporaryDirectories = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    fs.rm(directory, { recursive: true, force: true })
  ))
})

describe('Open Graph image generation', () => {
  it('uses stable route-specific image paths', () => {
    expect(openGraphImagePath('/')).toBe('/og/home.png')
    expect(openGraphImagePath('/guides/mid-game/invention')).toBe(
      '/og/guides-mid-game-invention.png',
    )
  })

  it('renders a standard social preview image', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'rs-guide-og-'))
    temporaryDirectories.push(directory)
    const output = path.join(directory, 'preview.png')

    await generateOpenGraphImage({
      root: process.cwd(),
      outputDirectory: output,
      title: 'Chaotic and Ruinous Weapons',
      description: 'Efficient weapon upgrades from Dungeoneering rewards',
      section: 'Mid Game',
      detail: 'RuneScape guide · 4 sections',
    })

    const metadata = await sharp(output).metadata()
    expect(metadata).toMatchObject({
      format: 'png',
      width: OPEN_GRAPH_IMAGE_WIDTH,
      height: OPEN_GRAPH_IMAGE_HEIGHT,
    })
  })
})
