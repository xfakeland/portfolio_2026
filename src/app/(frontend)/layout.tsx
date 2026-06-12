import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { FollowCursor } from './_components/FollowCursor'
import { Nav } from './_components/Nav'
import './styles.css'

export const metadata: Metadata = {
  title: 'Katem — Thibault Grall',
  description: 'Direction artistique · Design graphique · Branding.',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <FollowCursor />
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
            <Nav />
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
