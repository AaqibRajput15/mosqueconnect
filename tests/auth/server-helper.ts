import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'

export interface RunningServer {
  process: ChildProcessWithoutNullStreams
  baseUrl: string
}

const BASE_PORT = 3100

export async function startNextServer(): Promise<RunningServer> {
  const baseUrl = `http://127.0.0.1:${BASE_PORT}`
  const child = spawn('pnpm', ['next', 'dev', '-p', String(BASE_PORT), '-H', '127.0.0.1'], {
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'development' },
  })

  await waitForServer(baseUrl)
  return { process: child, baseUrl }
}

export async function stopNextServer(server: RunningServer) {
  server.process.kill('SIGTERM')
}

async function waitForServer(baseUrl: string) {
  const maxAttempts = 90
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const response = await fetch(`${baseUrl}/auth/sign-in`)
      if (response.status >= 200) return
    } catch {
      // ignore while booting
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('Next.js server did not start in time')
}
