import { AgXToneMapping, PerspectiveCamera, Scene, SRGBColorSpace } from 'three'
import { WebGPURenderer } from 'three/webgpu'

export async function createRenderer(canvas: HTMLCanvasElement): Promise<{
  renderer: WebGPURenderer
  backend: 'webgpu' | 'webgl'
}> {
  const opts = {
    canvas,
    antialias: true,
    reversedDepthBuffer: true,
    powerPreference: 'high-performance' as const,
    alpha: false,
  }
  let renderer = new WebGPURenderer(opts)
  let backend: 'webgpu' | 'webgl' = 'webgpu'
  try {
    await renderer.init()
  } catch {
    renderer.dispose()
    renderer = new WebGPURenderer({ ...opts, forceWebGL: true })
    await renderer.init()
    backend = 'webgl'
  }
  renderer.highPrecision = true
  renderer.toneMapping = AgXToneMapping
  renderer.toneMappingExposure = 0.62
  renderer.outputColorSpace = SRGBColorSpace
  const cap = Math.min(window.devicePixelRatio, 1.5)
  renderer.setPixelRatio(cap)
  renderer.setSize(window.innerWidth, window.innerHeight, false)
  return { renderer, backend }
}

export function makeCamera(): PerspectiveCamera {
  const cam = new PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.08, 2_000_000)
  cam.position.set(0, 0.6, 3.4)
  return cam
}

export function makeScene(): Scene {
  const scene = new Scene()
  scene.background = null
  return scene
}
