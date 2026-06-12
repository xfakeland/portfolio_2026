'use client'

import { useForm, useFormFields } from '@payloadcms/ui'
import { useEffect, useMemo, useState } from 'react'

type Row = {
  index: number
  kind: string | null
  fileId: string | number | null
}

type MediaDoc = {
  id: string | number
  filename?: string
  url?: string
  mimeType?: string
  sizes?: { thumbnail?: { url?: string } }
}

export default function MediaBulkDelete() {
  const { removeFieldRow } = useForm()

  // Construit la liste des lignes à partir des champs du formulaire
  const rows = useFormFields(([fields]) => {
    if (!fields) return [] as Row[]
    const list: Row[] = []
    let i = 0
    while (Object.prototype.hasOwnProperty.call(fields, `media.${i}.kind`)) {
      const fileRaw = fields[`media.${i}.file`]?.value as
        | string
        | number
        | { id: string | number }
        | null
        | undefined
      const fileId =
        typeof fileRaw === 'object' && fileRaw && 'id' in fileRaw
          ? fileRaw.id
          : (fileRaw as string | number | null | undefined) ?? null
      list.push({
        index: i,
        kind: (fields[`media.${i}.kind`]?.value as string) ?? null,
        fileId: fileId ?? null,
      })
      i++
    }
    return list
  })

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [docs, setDocs] = useState<Record<string, MediaDoc>>({})

  // Précharge les noms/thumbs des médias référencés
  const ids = useMemo(
    () => Array.from(new Set(rows.map((r) => r.fileId).filter((x): x is string | number => !!x))),
    [rows],
  )

  useEffect(() => {
    const missing = ids.filter((id) => !docs[String(id)])
    if (missing.length === 0) return
    const controller = new AbortController()
    const qs = missing.map((id) => `where[id][in][]=${encodeURIComponent(String(id))}`).join('&')
    fetch(`/api/media?${qs}&limit=${missing.length}&depth=0`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data: { docs?: MediaDoc[] }) => {
        if (!data.docs) return
        setDocs((prev) => {
          const next = { ...prev }
          for (const d of data.docs!) next[String(d.id)] = d
          return next
        })
      })
      .catch(() => {})
    return () => controller.abort()
  }, [ids, docs])

  // Filtrage à la volée (évite une boucle d'effet quand useFormFields renvoie un nouvel array)
  const validIndices = useMemo(() => new Set(rows.map((r) => r.index)), [rows])
  const effectiveSelected = useMemo(
    () => new Set(Array.from(selected).filter((i) => validIndices.has(i))),
    [selected, validIndices],
  )

  if (rows.length === 0) return null

  const toggle = (i: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  const allChecked = effectiveSelected.size === rows.length && rows.length > 0
  const someChecked = effectiveSelected.size > 0

  const handleDelete = () => {
    if (effectiveSelected.size === 0) return
    if (
      !confirm(
        `Supprimer ${effectiveSelected.size} média${effectiveSelected.size > 1 ? 's' : ''} de la composition ?`,
      )
    )
      return
    // Index décroissant : pas de décalage à mi-parcours
    const sorted = Array.from(effectiveSelected).sort((a, b) => b - a)
    for (const idx of sorted) {
      removeFieldRow({ path: 'media', rowIndex: idx })
    }
    setSelected(new Set())
  }

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <strong style={{ fontSize: 13 }}>
          Composition — {rows.length} média{rows.length > 1 ? 's' : ''}
          {effectiveSelected.size > 0 && ` · ${effectiveSelected.size} sélectionné${effectiveSelected.size > 1 ? 's' : ''}`}
        </strong>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.index)))}
            style={btnStyle}
          >
            {allChecked ? 'Tout décocher' : 'Tout cocher'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!someChecked}
            style={{
              ...btnStyle,
              background: someChecked ? '#c0392b' : undefined,
              color: someChecked ? '#fff' : undefined,
              borderColor: someChecked ? '#c0392b' : undefined,
              cursor: someChecked ? 'pointer' : 'not-allowed',
              opacity: someChecked ? 1 : 0.5,
            }}
          >
            Supprimer la sélection
          </button>
        </div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4 }}>
        {rows.map((r) => {
          const doc = r.fileId ? docs[String(r.fileId)] : null
          const thumb = doc?.sizes?.thumbnail?.url ?? doc?.url ?? null
          const label = doc?.filename ?? (r.fileId ? `media #${r.fileId}` : 'sans fichier')
          const checked = effectiveSelected.has(r.index)
          return (
            <li
              key={r.index}
              onClick={() => toggle(r.index)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '6px 8px',
                background: checked ? 'var(--theme-elevation-100)' : 'transparent',
                borderRadius: 3,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(r.index)}
                onClick={(e) => e.stopPropagation()}
                style={{ margin: 0 }}
              />
              <span style={{ width: 28, fontSize: 11, opacity: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                #{r.index + 1}
              </span>
              {thumb ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={thumb}
                  alt=""
                  style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 2, background: '#0001' }}
                />
              ) : (
                <span style={{ width: 32, height: 32, display: 'inline-block', background: 'var(--theme-elevation-100)', borderRadius: 2 }} />
              )}
              <span style={{ fontSize: 12, opacity: 0.85, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label}
              </span>
              <span style={{ fontSize: 11, opacity: 0.5 }}>{r.kind}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  fontSize: 12,
  padding: '4px 10px',
  border: '1px solid var(--theme-elevation-200)',
  background: 'transparent',
  borderRadius: 3,
  cursor: 'pointer',
}

