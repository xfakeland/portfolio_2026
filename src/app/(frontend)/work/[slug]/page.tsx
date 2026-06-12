import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

import { ArrowLeft, ArrowRight } from '../../_components/Arrows'
import { Footer } from '../../_components/Footer'

export const dynamic = 'force-dynamic'

type Args = { params: Promise<{ slug: string }> }

function mediaUrl(file: unknown, size: 'feature' | 'card' | 'thumbnail' = 'feature'): string | null {
  if (!file || typeof file !== 'object') return null
  const f = file as { url?: string; sizes?: Record<string, { url?: string }> }
  return f.sizes?.[size]?.url ?? f.sizes?.card?.url ?? f.url ?? null
}

export default async function ProjectPage({ params }: Args) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const [{ docs: matched }, { docs: all }] = await Promise.all([
    payload.find({
      collection: 'projects',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 2,
    }),
    payload.find({
      collection: 'projects',
      sort: 'order',
      limit: 200,
      depth: 0,
    }),
  ])

  const project = matched[0]
  if (!project) notFound()

  const cols = project.gridColumns ?? 5
  const cats = Array.isArray(project.categories)
    ? project.categories
        .map((c) => (typeof c === 'object' && c ? c.name : null))
        .filter((x): x is string => !!x)
    : []

  // Cover: prefer the `cover` field; fall back to media[0]
  const coverFile = project.cover && typeof project.cover === 'object' ? project.cover : null
  const fallbackFirstMedia =
    Array.isArray(project.media) && project.media[0] && typeof project.media[0].file === 'object'
      ? project.media[0].file
      : null
  const coverUrl = mediaUrl(coverFile ?? fallbackFirstMedia)
  const gallery = coverFile
    ? project.media ?? []
    : (project.media ?? []).slice(1) // avoid duplicating media[0] used as cover

  // Prev/next (circular, by `order`)
  const idx = all.findIndex((p) => p.id === project.id)
  const prev = all.length > 1 && idx >= 0 ? all[(idx - 1 + all.length) % all.length] : null
  const next = all.length > 1 && idx >= 0 ? all[(idx + 1) % all.length] : null

  return (
    <>
      <nav className="project-nav" aria-label="Navigation projet">
        <div className="project-nav__row">
          <Link href="/work" className="project-nav__back">
            Retour
          </Link>
          <div className="project-nav__sides">
            {prev && (
              <Link href={`/work/${prev.slug}`} className="project-nav__side">
                <ArrowLeft />
                <span>Projet précédent</span>
              </Link>
            )}
            {prev && next && <span className="project-nav__sep">/</span>}
            {next && (
              <Link href={`/work/${next.slug}`} className="project-nav__side">
                <span>Projet suivant</span>
                <ArrowRight />
              </Link>
            )}
          </div>
        </div>
        <div className="project-nav__rule" />
      </nav>

      <main className="project">
        {coverUrl && (
          <div className="project__cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt={coverFile?.alt ?? project.title}
            />
          </div>
        )}

        <header className="project__header">
          <h1 className="project__title">{project.title}</h1>
          {cats.length > 0 && (
            <ul className="work__tags">
              {cats.map((c) => (
                <li key={c} className="work__tag">{c}</li>
              ))}
            </ul>
          )}
        </header>

        {project.description && (
          <div className="project__desc">{project.description}</div>
        )}

        {gallery.length > 0 && (
          <div
            className="project__grid"
            style={{ ['--cols' as string]: cols }}
          >
            {gallery.map((m, i) => {
              const url =
                m.kind === 'image' || m.kind === 'video'
                  ? mediaUrl(m.file, m.kind === 'video' ? 'card' : 'feature') ?? m.externalUrl
                  : m.externalUrl ?? mediaUrl(m.file, 'card')
              if (!url) return null
              const span = Math.max(1, Math.min(cols, m.colSpan ?? 1))
              const style = { gridColumn: `span ${span} / span ${span}` } as const
              if (m.kind === 'video') {
                return (
                  <video
                    key={i}
                    src={url}
                    muted
                    autoPlay
                    loop
                    playsInline
                    controls
                    style={style}
                  />
                )
              }
              if (m.kind === 'audio') {
                return <audio key={i} src={url} controls style={style} />
              }
              return (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={i}
                  src={url}
                  alt={m.alt ?? ''}
                  style={style}
                />
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
