import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { execSync } from 'child_process' //child_process is a built-in Node.js module. It lets you run terminal commands from inside your code. execSync('npx prisma migrate deploy') — runs that command in your terminal
import { beforeAll, afterAll } from 'vitest'

let container: StartedPostgreSqlContainer

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:15").start()
  process.env.DATABASE_URL = container.getConnectionUri()
  execSync('npx prisma migrate deploy', { env: process.env })
}, 60000)

afterAll(async () => {
  await container.stop()
})

