import Link from 'next/link'

const links = [
  { href: '/work', label: 'Work' },
  { href: '/contact', label: 'Contact' },
]

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="site-footer__col">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
      </div>
      <div className="site-footer__col site-footer__right">
        <span>Thibault Grall [Katem]</span>
        <span>©{year}</span>
      </div>
    </footer>
  )
}
