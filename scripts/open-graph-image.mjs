import { promises as fs } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

export const OPEN_GRAPH_IMAGE_WIDTH = 1200
export const OPEN_GRAPH_IMAGE_HEIGHT = 630

const escapeXml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

const wordsToLines = (value, maximumCharacters, maximumLines) => {
  const words = String(value).trim().split(/\s+/)
  const lines = []

  for (const word of words) {
    const current = lines.at(-1)
    if (!current || current.length + word.length + 1 > maximumCharacters) {
      if (lines.length === maximumLines) {
        const last = lines.length - 1
        lines[last] = `${lines[last].replace(/[.,;:!?]?$/, '')}…`
        break
      }
      lines.push(word)
    } else {
      lines[lines.length - 1] = `${current} ${word}`
    }
  }

  return lines
}

const textLines = (lines, x, y, lineHeight, attributes = '') =>
  `<text x="${x}" y="${y}" ${attributes}>${lines.map((line, index) =>
    `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
  ).join('')}</text>`

export const openGraphImagePath = (route) => {
  const slug = route.split('/').filter(Boolean).join('-') || 'home'
  return `/og/${slug}.png`
}

export async function generateOpenGraphImage({
  root,
  outputDirectory,
  title,
  description,
  section,
  detail,
}) {
  const fontPath = path.join(root, 'public', 'fonts', 'cinzel-variable-latin.woff2')
  const fontData = (await fs.readFile(fontPath)).toString('base64')
  const titleSize = title.length > 48 ? 49 : title.length > 34 ? 57 : 68
  const titleCharacters = title.length > 48 ? 34 : title.length > 34 ? 30 : 25
  const titleLines = wordsToLines(title, titleCharacters, 3)
  const summaryLines = wordsToLines(description, 58, 2)
  const summaryY = 235 + (titleLines.length - 1) * 70

  const svg = `
    <svg width="${OPEN_GRAPH_IMAGE_WIDTH}" height="${OPEN_GRAPH_IMAGE_HEIGHT}" viewBox="0 0 ${OPEN_GRAPH_IMAGE_WIDTH} ${OPEN_GRAPH_IMAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @font-face {
            font-family: Cinzel;
            src: url(data:font/woff2;base64,${fontData}) format('woff2');
            font-weight: 400 900;
          }
          .display { font-family: Cinzel, Georgia, serif; }
          .sans { font-family: Arial, Helvetica, sans-serif; }
        </style>
        <linearGradient id="warmth" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#1b1611" />
          <stop offset="0.62" stop-color="#0a0908" />
          <stop offset="1" stop-color="#141210" />
        </linearGradient>
        <radialGradient id="glow" cx="84%" cy="15%" r="70%">
          <stop offset="0" stop-color="#cc9a63" stop-opacity=".16" />
          <stop offset="1" stop-color="#cc9a63" stop-opacity="0" />
        </radialGradient>
        <pattern id="grid" width="54" height="54" patternUnits="userSpaceOnUse">
          <path d="M 54 0 L 0 0 0 54" fill="none" stroke="#cc9a63" stroke-opacity=".045" stroke-width="1" />
        </pattern>
      </defs>

      <rect width="1200" height="630" fill="url(#warmth)" />
      <rect width="1200" height="630" fill="url(#glow)" />
      <rect width="1200" height="630" fill="url(#grid)" />
      <rect x="1.5" y="1.5" width="1197" height="627" fill="none" stroke="#4a3926" stroke-width="3" />
      <rect x="70" y="72" width="5" height="486" rx="2.5" fill="#cc9a63" />

      <text x="105" y="99" class="display" fill="#efe4d2" font-size="25" font-weight="700" letter-spacing="2.5">THE <tspan fill="#cc9a63">RS</tspan> GUIDE</text>
      <text x="1095" y="99" class="sans" fill="#cc9a63" font-size="18" font-weight="700" letter-spacing="2" text-anchor="end">${escapeXml(section.toUpperCase())}</text>

      ${textLines(
        titleLines,
        105,
        190,
        70,
        `class="display" fill="#f5ecdf" font-size="${titleSize}" font-weight="700"`,
      )}

      ${textLines(
        summaryLines,
        108,
        summaryY,
        39,
        'class="sans" fill="#d8c7b2" font-size="29" font-weight="400"',
      )}

      <line x1="105" y1="512" x2="1095" y2="512" stroke="#4a3926" stroke-width="2" />
      <text x="105" y="553" class="sans" fill="#cc9a63" font-size="19" font-weight="700" letter-spacing="1.6">${escapeXml(detail.toUpperCase())}</text>
      <text x="1095" y="553" class="sans" fill="#9d8062" font-size="18" text-anchor="end">thersguide.com</text>
    </svg>
  `

  await fs.mkdir(path.dirname(outputDirectory), { recursive: true })
  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9, palette: true })
    .toFile(outputDirectory)
}
