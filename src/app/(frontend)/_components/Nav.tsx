'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/work', label: 'Work' },
  { href: '/contact', label: 'Contact' },
]

export function Nav() {
  const pathname = usePathname()
  return (
    <nav className="site-nav" aria-label="Principale">
      {items.map((it, i) => {
        const active = pathname === it.href || pathname.startsWith(it.href + '/')
        return (
          <span key={it.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 60 }}>
            <Link href={it.href} aria-current={active ? 'page' : undefined}>
              {it.label}
            </Link>
            {i < items.length - 1 && <span className="site-nav__sep" aria-hidden>⁑</span>}
          </span>
        )
      })}
    </nav>
  )
}
