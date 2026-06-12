/**
 * Migration SQLite -> Postgres + upload des fichiers /media vers R2.
 * Usage: node --env-file=.env scripts/migrate.mjs
 */
import { createClient } from '@libsql/client'
import { Client } from 'pg'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import fs from 'node:fs'
import path from 'node:path'

const sqliteUrl = `file:${path.resolve('payload.db')}`
const mediaDir = path.resolve('media')
const prefix = 'media'

const sqlite = createClient({ url: sqliteUrl })
const pg = new Client({ connectionString: process.env.DATABASE_URI })
const s3 = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
})
const bucket = process.env.R2_BUCKET

const contentTypeByExt = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
}

function guessContentType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return contentTypeByExt[ext] || 'application/octet-stream'
}

async function alreadyOnR2(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch {
    return false
  }
}

async function uploadOne(filename) {
  const filePath = path.join(mediaDir, filename)
  if (!fs.existsSync(filePath)) return { ok: false, reason: 'missing-on-disk' }
  const key = `${prefix}/${filename}`
  if (await alreadyOnR2(key)) return { ok: true, reason: 'already-uploaded' }
  const body = fs.readFileSync(filePath)
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: guessContentType(filename),
    }),
  )
  return { ok: true, reason: 'uploaded' }
}

async function rows(query, args = []) {
  const r = await sqlite.execute({ sql: query, args })
  return r.rows
}

async function migrate() {
  await pg.connect()
  console.log('→ Postgres connected')

  console.log('→ Truncating destination tables…')
  await pg.query(`
    TRUNCATE
      projects_rels, projects_media, projects,
      media,
      payload_folders_folder_type, payload_folders,
      categories,
      users
    RESTART IDENTITY CASCADE
  `)

  /* ───────── users ───────── */
  const users = await rows('SELECT * FROM users')
  for (const u of users) {
    await pg.query(
      `INSERT INTO users (id, email, salt, hash, login_attempts, lock_until,
                          reset_password_token, reset_password_expiration,
                          updated_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [u.id, u.email, u.salt, u.hash, u.login_attempts, u.lock_until,
       u.reset_password_token, u.reset_password_expiration,
       u.updated_at, u.created_at],
    )
  }
  console.log(`  users: ${users.length}`)

  /* ───────── categories ───────── */
  const cats = await rows('SELECT * FROM categories')
  for (const c of cats) {
    await pg.query(
      `INSERT INTO categories (id, name, slug, updated_at, created_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [c.id, c.name, c.slug, c.updated_at, c.created_at],
    )
  }
  console.log(`  categories: ${cats.length}`)

  /* ───────── payload_folders (parents avant enfants) ───────── */
  const folders = await rows('SELECT * FROM payload_folders')
  const map = new Map(folders.map((f) => [f.id, f]))
  const done = new Set()
  const insertFolder = async (f) => {
    if (done.has(f.id)) return
    if (f.folder_id && map.has(f.folder_id)) await insertFolder(map.get(f.folder_id))
    await pg.query(
      `INSERT INTO payload_folders (id, name, folder_id, updated_at, created_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [f.id, f.name, f.folder_id, f.updated_at, f.created_at],
    )
    done.add(f.id)
  }
  for (const f of folders) await insertFolder(f)
  console.log(`  payload_folders: ${folders.length}`)

  /* ───────── payload_folders_folder_type ───────── */
  const fft = await rows('SELECT * FROM payload_folders_folder_type')
  for (const r of fft) {
    await pg.query(
      `INSERT INTO payload_folders_folder_type (id, "order", parent_id, value)
       VALUES ($1,$2,$3,$4)`,
      [r.id, r.order, r.parent_id, r.value],
    )
  }
  console.log(`  payload_folders_folder_type: ${fft.length}`)

  /* ───────── media ───────── */
  const media = await rows('SELECT * FROM media')
  for (const m of media) {
    await pg.query(
      `INSERT INTO media (
        id, alt, caption, folder_id, updated_at, created_at,
        url, thumbnail_u_r_l, filename, mime_type, filesize, width, height, focal_x, focal_y,
        sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, sizes_thumbnail_mime_type, sizes_thumbnail_filesize, sizes_thumbnail_filename,
        sizes_card_url, sizes_card_width, sizes_card_height, sizes_card_mime_type, sizes_card_filesize, sizes_card_filename,
        sizes_feature_url, sizes_feature_width, sizes_feature_height, sizes_feature_mime_type, sizes_feature_filesize, sizes_feature_filename,
        prefix
      ) VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,$11,$12,$13,$14,$15,
        $16,$17,$18,$19,$20,$21,
        $22,$23,$24,$25,$26,$27,
        $28,$29,$30,$31,$32,$33,
        $34
      )`,
      [
        m.id, m.alt, m.caption, m.folder_id, m.updated_at, m.created_at,
        m.url, m.thumbnail_u_r_l, m.filename, m.mime_type, m.filesize, m.width, m.height, m.focal_x, m.focal_y,
        m.sizes_thumbnail_url, m.sizes_thumbnail_width, m.sizes_thumbnail_height, m.sizes_thumbnail_mime_type, m.sizes_thumbnail_filesize, m.sizes_thumbnail_filename,
        m.sizes_card_url, m.sizes_card_width, m.sizes_card_height, m.sizes_card_mime_type, m.sizes_card_filesize, m.sizes_card_filename,
        m.sizes_feature_url, m.sizes_feature_width, m.sizes_feature_height, m.sizes_feature_mime_type, m.sizes_feature_filesize, m.sizes_feature_filename,
        prefix,
      ],
    )
  }
  console.log(`  media: ${media.length}`)

  /* ───────── projects ───────── */
  const projects = await rows('SELECT * FROM projects')
  for (const p of projects) {
    await pg.query(
      `INSERT INTO projects (id, title, slug, date, grid_columns, description,
                              cover_id, import_from_folder_id, "order",
                              updated_at, created_at, _status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [p.id, p.title, p.slug, p.date, p.grid_columns, p.description,
       p.cover_id, p.import_from_folder_id, p.order,
       p.updated_at, p.created_at, p._status],
    )
  }
  console.log(`  projects: ${projects.length}`)

  /* ───────── projects_media ───────── */
  const pm = await rows('SELECT * FROM projects_media')
  for (const r of pm) {
    await pg.query(
      `INSERT INTO projects_media (_order, _parent_id, id, kind, file_id, external_url, col_span, alt)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [r._order, r._parent_id, r.id, r.kind, r.file_id, r.external_url, r.col_span, r.alt],
    )
  }
  console.log(`  projects_media: ${pm.length}`)

  /* ───────── projects_rels ───────── */
  const pr = await rows('SELECT * FROM projects_rels')
  for (const r of pr) {
    await pg.query(
      `INSERT INTO projects_rels (id, "order", parent_id, path, categories_id)
       VALUES ($1,$2,$3,$4,$5)`,
      [r.id, r.order, r.parent_id, r.path, r.categories_id],
    )
  }
  console.log(`  projects_rels: ${pr.length}`)

  /* ───────── reset des séquences ───────── */
  console.log('→ Resetting Postgres sequences…')
  const tables = [
    'users',
    'categories',
    'payload_folders',
    'payload_folders_folder_type',
    'media',
    'projects',
    'projects_rels',
  ]
  for (const t of tables) {
    await pg.query(
      `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM ${t}), 1))`,
      [t],
    )
  }

  /* ───────── upload des fichiers vers R2 ───────── */
  console.log('→ Uploading files to R2…')
  const filenames = new Set()
  for (const m of media) {
    for (const f of [
      m.filename,
      m.sizes_thumbnail_filename,
      m.sizes_card_filename,
      m.sizes_feature_filename,
    ]) {
      if (f) filenames.add(String(f))
    }
  }
  let up = 0, kept = 0, miss = 0, idx = 0
  const total = filenames.size
  for (const f of filenames) {
    idx++
    const res = await uploadOne(f)
    if (res.reason === 'uploaded') up++
    else if (res.reason === 'already-uploaded') kept++
    else miss++
    if (idx % 10 === 0 || idx === total) {
      process.stdout.write(`  ${idx}/${total}\r`)
    }
  }
  console.log(`\n  uploaded: ${up}, already on R2: ${kept}, missing on disk: ${miss}`)

  await pg.end()
  console.log('✔ Done.')
}

migrate().catch((err) => {
  console.error('✖ Migration failed:', err)
  process.exit(1)
})
