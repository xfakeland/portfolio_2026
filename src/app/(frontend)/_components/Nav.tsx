'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const defaultItems = [
  { href: '/work', label: 'Work' },
  { href: '/contact', label: 'Contact' },
]

type Props = {
  projectSlugs?: string[]
}

export function Nav({ projectSlugs = [] }: Props) {
  const pathname = usePathname()
  const projectMatch = pathname.match(/^\/work\/([^/]+)\/?$/)
  const currentSlug = projectMatch?.[1]

  if (currentSlug && projectSlugs.length > 0) {
    const idx = projectSlugs.indexOf(currentSlug)
    const prev =
      idx >= 0 && projectSlugs.length > 1
        ? projectSlugs[(idx - 1 + projectSlugs.length) % projectSlugs.length]
        : null
    const next =
      idx >= 0 && projectSlugs.length > 1
        ? projectSlugs[(idx + 1) % projectSlugs.length]
        : null

    const items = [
      { href: '/work', label: 'Retour' },
      prev ? { href: `/work/${prev}`, label: 'Projet précédent' } : null,
      next ? { href: `/work/${next}`, label: 'Projet suivant' } : null,
    ].filter((x): x is { href: string; label: string } => x !== null)

    return (
      <nav className="site-nav" aria-label="Projet">
        {items.map((it, i) => (
          <span key={it.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 60 }}>
            <Link href={it.href}>{it.label}</Link>
            {i < items.length - 1 && (
              <span className="site-nav__sep" aria-hidden>
                ⁑
              </span>
            )}
          </span>
        ))}
      </nav>
    )
  }

  return (
    <nav className="site-nav" aria-label="Principale">
      {defaultItems.map((it, i) => {
        const active = pathname === it.href || pathname.startsWith(it.href + '/')
        return (
          <span key={it.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 60 }}>
            <Link href={it.href} aria-current={active ? 'page' : undefined}>
              {it.label}
            </Link>
            {i < defaultItems.length - 1 && (
              <span className="site-nav__sep" aria-hidden>
                ⁑
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
