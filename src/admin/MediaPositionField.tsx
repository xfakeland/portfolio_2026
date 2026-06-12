'use client'

import { useField, useForm, useFormFields } from '@payloadcms/ui'
import { useEffect, useRef } from 'react'

export default function MediaPositionField() {
  const { path } = useField({ path: '' })
  const { moveFieldRow } = useForm()
  const inputRef = useRef<HTMLInputElement>(null)

  const total = useFormFields(([fields]) => {
    if (!fields) return 0
    let i = 0
    while (Object.prototype.hasOwnProperty.call(fields, `media.${i}.kind`)) i++
    return i
  })

  // path = "media.N.position" → on récupère N
  const index = extractIndex(path)

  useEffect(() => {
    const el = inputRef.current
    if (!el || document.activeElement === el) return
    el.value = String(index + 1)
  }, [index])

  const commit = (raw: string) => {
    const el = inputRef.current
    const n = parseInt(raw, 10)
    if (!Number.isFinite(n) || n === index + 1) {
      if (el) el.value = String(index + 1)
      return
    }
    const target = Math.max(0, Math.min(total - 1, n - 1))
    if (target === index) {
      if (el) el.value = String(index + 1)
      return
    }
    moveFieldRow({ moveFromIndex: index, moveToIndex: target, path: 'media' })
  }

  return (
    <div className="field-type" style={{ marginTop: 8 }}>
      <label className="field-label" style={{ display: 'block', marginBottom: 6 }}>
        Position
      </label>
      <input
        ref={inputRef}
        type="number"
        min={1}
        max={Math.max(1, total)}
        defaultValue={index + 1}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            ;(e.currentTarget as HTMLInputElement).blur()
          } else if (e.key === 'Escape') {
            ;(e.currentTarget as HTMLInputElement).value = String(index + 1)
            ;(e.currentTarget as HTMLInputElement).blur()
          }
        }}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: 14,
          border: '1px solid var(--theme-elevation-150)',
          background: 'var(--theme-input-bg)',
          color: 'var(--theme-text)',
          borderRadius: 2,
          fontVariantNumeric: 'tabular-nums',
        }}
        title={`Position dans la composition (1–${Math.max(1, total)})`}
      />
      <div style={{ marginTop: 4, fontSize: 12, opacity: 0.6 }}>
        Tape un numéro (1–{Math.max(1, total)}) et Entrée pour déplacer ce média à cette position.
      </div>
    </div>
  )
}

function extractIndex(path?: string): number {
  if (!path) return 0
  const m = path.match(/\.(\d+)\./)
  return m ? parseInt(m[1], 10) : 0
}
