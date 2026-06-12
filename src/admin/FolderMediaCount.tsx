'use client'

import { useFormFields } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

export default function FolderMediaCount() {
  const folderId = useFormFields(([fields]) => fields?.importFromFolder?.value as
    | string
    | number
    | null
    | undefined)
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!folderId) {
      setCount(null)
      setError(null)
      return
    }
    let cancelled = false
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    fetch(
      `/api/media?where[folder][equals]=${encodeURIComponent(String(folderId))}&limit=0&depth=0`,
      { signal: controller.signal },
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        if (cancelled) return
        setCount(typeof data?.totalDocs === 'number' ? data.totalDocs : 0)
      })
      .catch((e: Error) => {
        if (cancelled || e.name === 'AbortError') return
        setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [folderId])

  if (!folderId) return null

  return (
    <div
      style={{
        marginTop: -8,
        marginBottom: 16,
        fontSize: 12,
        opacity: 0.75,
      }}
    >
      {loading && 'Comptage…'}
      {error && `Erreur : ${error}`}
      {!loading && !error && count !== null && (
        <>
          <strong>{count}</strong> média{count > 1 ? 's' : ''} dans ce dossier
          {count > 0 && ' — seront ajoutés à la liste ci-dessous au prochain enregistrement.'}
        </>
      )}
    </div>
  )
}
