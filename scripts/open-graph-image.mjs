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
  const shareTitle = title === 'The RS Guide'
    ? title
    : `${title} | The RS Guide`
  const shareTitleSize = shareTitle.length > 55 ? 37 : shareTitle.length > 40 ? 44 : 54
  const shareTitleLines = wordsToLines(shareTitle, 52, 2)
  const shareTitleY = shareTitleLines.length === 1 ? 88 : 66
  const shareSummaryY = shareTitleLines.length === 1 ? 132 : 148
  const screenY = shareTitleLines.length === 1 ? 163 : 178
  const screenHeight = 600 - screenY
  const miniTitleSize = title.length > 36 ? 29 : title.length > 20 ? 32 : 40
  const miniTitleLines = wordsToLines(title, title.length > 20 ? 22 : 30, 2)
  const miniSummaryLines = wordsToLines(description, 60, 2)
  const miniBodyY = screenY + 178 + (miniTitleLines.length - 1) * 41

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
        <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fbfaf8" />
          <stop offset=".55" stop-color="#eeeae4" />
          <stop offset="1" stop-color="#d6cfc6" />
        </linearGradient>
        <linearGradient id="site" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#15110d" />
          <stop offset=".64" stop-color="#0a0908" />
          <stop offset="1" stop-color="#100e0c" />
        </linearGradient>
        <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#cc9a63" stroke-opacity=".045" stroke-width="1" />
        </pattern>
        <filter id="screen-shadow" x="-20%" y="-25%" width="140%" height="155%">
          <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#1a130c" flood-opacity=".42" />
        </filter>
        <clipPath id="screen-clip">
          <rect x="80" y="${screenY + 10}" width="1040" height="${screenHeight - 20}" rx="12" />
        </clipPath>
      </defs>

      <rect width="1200" height="630" fill="url(#paper)" />

      ${textLines(
        shareTitleLines,
        600,
        shareTitleY,
        45,
        `class="display" fill="#171411" font-size="${shareTitleSize}" font-weight="700" text-anchor="middle"`,
      )}
      <text x="600" y="${shareSummaryY}" class="sans" fill="#5d5650" font-size="22" text-anchor="middle">${escapeXml(description)}</text>

      <rect x="67" y="${screenY}" width="1066" height="${screenHeight}" rx="19" fill="#f9f7f3" filter="url(#screen-shadow)" />
      <rect x="72" y="${screenY + 5}" width="1056" height="${screenHeight - 5}" rx="15" fill="#bdb5ab" />

      <g clip-path="url(#screen-clip)">
        <rect x="80" y="${screenY + 10}" width="1040" height="${screenHeight - 20}" fill="url(#site)" />
        <rect x="80" y="${screenY + 10}" width="1040" height="${screenHeight - 20}" fill="url(#grid)" />

        <rect x="80" y="${screenY + 10}" width="1040" height="48" fill="#0f0d0b" />
        <line x1="80" y1="${screenY + 58}" x2="1120" y2="${screenY + 58}" stroke="#4a3926" />
        <text x="111" y="${screenY + 41}" class="display" fill="#efe4d2" font-size="16" font-weight="700" letter-spacing="1.5">THE <tspan fill="#cc9a63">RS</tspan> GUIDE</text>
        <text x="1090" y="${screenY + 40}" class="sans" fill="#a98a67" font-size="11" font-weight="700" text-anchor="end">GUIDES  ·  GETTING STARTED  ·  SETUP  ·  EXTRAS</text>

        <rect x="80" y="${screenY + 58}" width="218" height="${screenHeight - 78}" fill="#141210" />
        <line x1="298" y1="${screenY + 58}" x2="298" y2="${screenY + screenHeight - 10}" stroke="#4a3926" />
        <text x="108" y="${screenY + 93}" class="display" fill="#d8c7b2" font-size="12" font-weight="700" letter-spacing="1.2">GETTING STARTED</text>
        <rect x="103" y="${screenY + 112}" width="160" height="9" rx="4.5" fill="#cc9a63" opacity=".9" />
        <rect x="103" y="${screenY + 139}" width="128" height="7" rx="3.5" fill="#8f765b" opacity=".74" />
        <rect x="103" y="${screenY + 163}" width="145" height="7" rx="3.5" fill="#8f765b" opacity=".62" />
        <rect x="103" y="${screenY + 187}" width="115" height="7" rx="3.5" fill="#8f765b" opacity=".54" />
        <text x="108" y="${screenY + 233}" class="display" fill="#d8c7b2" font-size="12" font-weight="700" letter-spacing="1.2">GUIDES</text>
        <rect x="103" y="${screenY + 252}" width="137" height="7" rx="3.5" fill="#8f765b" opacity=".62" />
        <rect x="103" y="${screenY + 276}" width="155" height="7" rx="3.5" fill="#8f765b" opacity=".54" />
        <rect x="103" y="${screenY + 300}" width="122" height="7" rx="3.5" fill="#8f765b" opacity=".46" />

        <text x="338" y="${screenY + 91}" class="sans" fill="#cc9a63" font-size="12" font-weight="700" letter-spacing="1.2">HOME  /  ${escapeXml(section.toUpperCase())}</text>
        ${textLines(
          miniTitleLines,
          338,
          screenY + 139,
          41,
          `class="display" fill="#f5ecdf" font-size="${miniTitleSize}" font-weight="700"`,
        )}
        ${textLines(
          miniSummaryLines,
          338,
          miniBodyY,
          25,
          'class="sans" fill="#d8c7b2" font-size="16"',
        )}

        <line x1="338" y1="${miniBodyY + 39}" x2="862" y2="${miniBodyY + 39}" stroke="#4a3926" />
        <text x="338" y="${miniBodyY + 79}" class="display" fill="#efe4d2" font-size="22">Guide overview</text>
        <rect x="338" y="${miniBodyY + 97}" width="475" height="7" rx="3.5" fill="#d8c7b2" opacity=".73" />
        <rect x="338" y="${miniBodyY + 115}" width="514" height="7" rx="3.5" fill="#d8c7b2" opacity=".58" />
        <rect x="338" y="${miniBodyY + 133}" width="403" height="7" rx="3.5" fill="#d8c7b2" opacity=".45" />

        <line x1="892" y1="${screenY + 82}" x2="892" y2="${screenY + screenHeight - 34}" stroke="#4a3926" />
        <text x="920" y="${screenY + 104}" class="display" fill="#efe4d2" font-size="13" font-weight="700">ON THIS PAGE</text>
        <rect x="920" y="${screenY + 128}" width="132" height="6" rx="3" fill="#cc9a63" />
        <rect x="920" y="${screenY + 153}" width="151" height="6" rx="3" fill="#8f765b" />
        <rect x="920" y="${screenY + 178}" width="116" height="6" rx="3" fill="#8f765b" opacity=".8" />
        <rect x="920" y="${screenY + 203}" width="143" height="6" rx="3" fill="#8f765b" opacity=".65" />
        <rect x="920" y="${screenY + 228}" width="101" height="6" rx="3" fill="#8f765b" opacity=".5" />

        <rect x="80" y="${screenY + screenHeight - 46}" width="1040" height="36" fill="#0f0d0b" opacity=".96" />
        <text x="106" y="${screenY + screenHeight - 22}" class="sans" fill="#cc9a63" font-size="11" font-weight="700" letter-spacing="1">${escapeXml(detail.toUpperCase())}</text>
        <text x="1093" y="${screenY + screenHeight - 22}" class="sans" fill="#9d8062" font-size="11" text-anchor="end">thersguide.com</text>
      </g>
    </svg>
  `

  await fs.mkdir(path.dirname(outputDirectory), { recursive: true })
  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9, palette: true })
    .toFile(outputDirectory)
}
