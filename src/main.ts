import { Engine } from './engine/Engine'

const canvas = document.getElementById('c') as HTMLCanvasElement
const engine = new Engine()
// dev-only handle for scripts/capture-screenshots.cjs; stripped from production builds
if (import.meta.env.DEV) (window as unknown as { engine: Engine }).engine = engine
engine.start(canvas).catch((err) => {
  const pause = document.getElementById('pause')
  if (pause) pause.textContent = `FAILED — ${err instanceof Error ? err.message : String(err)}`
  console.error(err)
})
