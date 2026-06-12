import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'

import { Footer } from '../_components/Footer'

export const dynamic = 'force-dynamic'

export default async function WorkPage() {
  const payload = await getPayload({ config })
  const { docs: projects } = await payload.find({
    collection: 'projects',
    sort: 'order',
    limit: 100,
    depth: 2,
  })

  if (projects.length === 0) {
    return (
      <>
        <main className="work">
          <p className="work__empty">
            Aucun projet pour l’instant. Va dans{' '}
            <Link href="/admin" style={{ textDecoration: 'underline' }}>
              l’admin
            </Link>{' '}
            pour en ajouter.
          </p>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
    <main className="work">
      <ul className="work__list">
        {projects.map((p) => {
          const cover =
            typeof p.cover === 'object' && p.cover
              ? p.cover
              : (Array.isArray(p.media) && p.media[0] && typeof p.media[0].file === 'object'
                  ? p.media[0].file
                  : null)
          const coverUrl =
            cover?.sizes?.feature?.url ?? cover?.sizes?.card?.url ?? cover?.url ?? null
          const cats = Array.isArray(p.categories)
            ? p.categories
                .map((c) => (typeof c === 'object' && c ? c.name : null))
                .filter((x): x is string => !!x)
            : []
          return (
            <li key={p.id} className="work__item">
              <Link href={`/work/${p.slug}`} className="work__cover" aria-label={p.title}>
                {coverUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={coverUrl} alt={cover?.alt ?? p.title} />
                ) : (
                  <div className="work__cover-fallback">{p.title}</div>
                )}
              </Link>
              <div className="work__meta">
                <Link href={`/work/${p.slug}`} className="work__title">
                  {p.title}
                </Link>
                {cats.length > 0 && (
                  <ul className="work__tags">
                    {cats.map((c) => (
                      <li key={c} className="work__tag">
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </main>
    <Footer />
    </>
  )
}
