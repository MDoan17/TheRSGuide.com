import { lazy, type ComponentProps, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
import { SplitContent, SplitItem, Center } from './components/split-content'
import { YouTubeEmbed } from './components/youtube-embed'
import { Steps, Step } from './components/steps'

const InteractiveLegend = lazy(() => import('./components/interactive-legend').then((module) => ({ default: module.InteractiveLegend })))
const PlayerSearch = lazy(() => import('./components/player-search').then((module) => ({ default: module.PlayerSearch })))
const QuestRequirements = lazy(() => import('./components/quest-requirements').then((module) => ({ default: module.QuestRequirements })))
const SkillTrainingLookup = lazy(() => import('./components/skill-training-lookup').then((module) => ({ default: module.SkillTrainingLookup })))
const InteractiveMapMarker = lazy(() => import('./components/interactive-map-marker').then((module) => ({ default: module.InteractiveMapMarker })))
const CombatStyleAnalysis = lazy(() => import('./components/combat-style-analysis').then((module) => ({ default: module.CombatStyleAnalysis })))
const GearProgression = lazy(() => import('./components/gear-progression').then((module) => ({ default: module.GearProgression })))
const GearRecommendations = lazy(() => import('./components/gear-recommendations').then((module) => ({ default: module.GearRecommendations })))
const RecurringActivitiesTool = lazy(() => import('./components/recurring-activities-tool').then((module) => ({ default: module.RecurringActivitiesTool })))
const EfficiencyGuideTool = lazy(() => import('./components/efficiency-guide-tool').then((module) => ({ default: module.EfficiencyGuideTool })))
const LeaguesRegionMap = lazy(() => import('./components/leagues-region-map'))

function SmartLink({ href = '', children, ...props }: ComponentProps<'a'>) {
  if (href.startsWith('/')) return <Link to={href} {...props}>{children}</Link>
  return <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" {...props}>{children}</a>
}

function ImageZoom(props: ComponentProps<'img'>) {
  if (!props.src) return null
  return <Zoom><img loading="lazy" {...props} /></Zoom>
}

function DocCard({ title, href, children }: { title?: string; href?: string; children?: ReactNode }) {
  const content = <><div className="doc-card-title">{title ?? children}</div>{href && <ExternalLink aria-hidden="true" />}</>
  return href ? <SmartLink href={href} className="doc-card">{content}</SmartLink> : <div className="doc-card">{content}</div>
}

function Cards({ children }: { children?: ReactNode }) {
  return <div className="doc-cards">{children}</div>
}

export const mdxComponents = {
  a: SmartLink,
  img: ImageZoom,
  Card: DocCard,
  Cards,
  SplitContent,
  SplitItem,
  Center,
  YouTubeEmbed,
  Steps,
  Step,
  InteractiveLegend,
  PlayerSearch,
  QuestRequirements,
  SkillTrainingLookup,
  InteractiveMapMarker,
  CombatStyleAnalysis,
  GearProgression,
  GearRecommendations,
  RecurringActivitiesTool,
  EfficiencyGuideTool,
  LeaguesRegionMap,
}
