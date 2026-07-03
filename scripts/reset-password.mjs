/**
 * Reset le mot de passe d'un user Payload — écrit directement en Postgres.
 * Payload utilise PBKDF2-SHA256, 25000 itérations, keylen 512.
 *
 * Usage:
 *   node --env-file=.env scripts/reset-password.mjs --list
 *   node --env-file=.env scripts/reset-password.mjs <email> <new-password>
 */
import { Client } from 'pg'
import { pbkdf2, randomBytes } from 'node:crypto'
import { promisify } from 'node:util'

const pbkdf2Async = promisify(pbkdf2)

async function hashPassword(password) {
  const salt = randomBytes(32).toString('hex')
  const derived = await pbkdf2Async(password, salt, 25000, 512, 'sha256')
  const hash = derived.toString('hex')
  return { salt, hash }
}

async function main() {
  const [, , arg1, arg2] = process.argv
  if (!process.env.DATABASE_URI) {
    console.error('✖ DATABASE_URI manquant. Lance avec --env-file=.env')
    process.exit(1)
  }
  const pg = new Client({ connectionString: process.env.DATABASE_URI })
  await pg.connect()

  try {
    if (arg1 === '--list') {
      const { rows } = await pg.query('SELECT id, email FROM users ORDER BY id')
      if (rows.length === 0) {
        console.log('Aucun user.')
      } else {
        console.log('Users:')
        for (const r of rows) console.log(`  - ${r.email} (id=${r.id})`)
      }
      return
    }

    if (!arg1 || !arg2) {
      console.error(
        'Usage:\n  node --env-file=.env scripts/reset-password.mjs <email> <new-password>\n  node --env-file=.env scripts/reset-password.mjs --list',
      )
      process.exit(1)
    }

    const email = arg1
    const newPassword = arg2

    const { rows } = await pg.query('SELECT id, email FROM users WHERE email = $1', [email])
    if (rows.length === 0) {
      console.error(`✖ Aucun user avec l'email ${email}.`)
      process.exit(1)
    }

    const { salt, hash } = await hashPassword(newPassword)
    await pg.query(
      `UPDATE users
       SET salt = $1,
           hash = $2,
           login_attempts = 0,
           lock_until = NULL,
           reset_password_token = NULL,
           reset_password_expiration = NULL,
           updated_at = NOW()
       WHERE id = $3`,
      [salt, hash, rows[0].id],
    )
    console.log(`✔ Mot de passe mis à jour pour ${email} (id=${rows[0].id}).`)
  } finally {
    await pg.end()
  }
}

main().catch((err) => {
  console.error('✖ Erreur:', err)
  process.exit(1)
})
