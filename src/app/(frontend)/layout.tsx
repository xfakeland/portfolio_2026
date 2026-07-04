import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'

import { Nav } from './_components/Nav'
import './styles.css'

export const metadata: Metadata = {
  title: 'Katem — Thibault Grall',
  description: 'Direction artistique · Design graphique · Branding.',
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'projects',
    sort: 'order',
    limit: 500,
    depth: 0,
  })
  const projectSlugs = docs
    .map((p) => (p as { slug?: string | null }).slug)
    .filter((s): s is string => typeof s === 'string' && s.length > 0)

  return (
    <html lang="fr">
      <body>
        <div className="site">
          <header className="site-header">
            <Link href="/" aria-label="Accueil">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-thibault.webp"
                alt="Thibault Grall"
                className="logo-thibault"
                draggable={false}
              />
            </Link>
            <Nav projectSlugs={projectSlugs} />
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
