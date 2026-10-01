import { PerspectiveCamera, Scene, Vector3 } from 'three'
import type { WebGPURenderer } from 'three/webgpu'
import { loadCatalog } from '../sim/catalog'
import { createStates, stepEphemeris } from '../sim/ephemeris'
import { copy, mag, subTo, v3 } from '../sim/units'
import { controlShip, spawnAtEarth } from '../ship/Controller'
import { maybeAutoLock, stepAutopilot } from '../ship/Autopilot'
import { createRenderer, makeCamera, makeScene } from '../render/Renderer'
import { buildScene, syncScene, type SceneBits } from '../render/SceneRoot'
import { makePost } from '../render/Post'
import { Hud } from '../hud/Hud'
import { Input } from './Input'
import { Time } from './Time'
import { World } from './World'

const look = new Vector3()
const offset = new Vector3()
const up = new Vector3(0, 1, 0)
const delta = v3()

export class Engine {
  world = new World()
  time = new Time()
  private renderer!: WebGPURenderer
  private scene!: Scene
  private camera!: PerspectiveCamera
  private input!: Input
  private bits!: SceneBits
  private hud!: Hud
  private post!: { render: () => void }
  private last = 0
  private running = false

  async start(canvas: HTMLCanvasElement): Promise<void> {
    this.world.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    const { renderer, backend } = await createRenderer(canvas)
    this.renderer = renderer
    this.world.backend = backend
    this.scene = makeScene()
    this.camera = makeCamera()
    this.input = new Input(canvas)
    this.input.onLock.add((locked) => {
      this.world.paused = !locked
    })

    this.world.catalog = await loadCatalog()
    this.world.bodies = createStates(this.world.catalog)
    stepEphemeris(this.world.bodies, this.world.catalog, 0)
    for (const b of this.world.bodies) copy(b.prevPosKm, b.posKm)
    spawnAtEarth(this.world)

    this.bits = await buildScene(this.scene, this.world.catalog)
    this.post = makePost(this.renderer, this.scene, this.camera, this.world.reducedMotion)
    this.hud = new Hud(this.world)

    window.addEventListener('resize', this.onResize)
    this.running = true
    this.last = performance.now()
    this.renderer.setAnimationLoop(this.frame)
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight, false)
  }

  private frame = (now: number): void => {
    if (!this.running) return
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    this.handleTaps()
    if (!this.world.paused) {
      const simDt = this.time.advance(dt)
      this.world.simSeconds = this.time.simSeconds
      stepEphemeris(this.world.bodies, this.world.catalog, this.world.simSeconds)
      stepAutopilot(this.world)
      controlShip(this.world, this.input, dt)
      maybeAutoLock(this.world)
      void simDt
    } else {
      this.input.consumeMouse()
    }
    copy(this.world.originKm, this.world.ship.posKm)
    this.placeCamera()
    syncScene(this.world, this.bits, this.world.originKm)
    this.post.render()
    this.hud.render(this.time)
  }

  private handleTaps(): void {
    const i = this.input
    if (i.tap('Comma')) this.time.bump(-1)
    if (i.tap('Period')) this.time.bump(1)
    if (i.tap('KeyC')) this.world.cameraMode = this.world.cameraMode === 'chase' ? 'cockpit' : 'chase'
    if (i.tap('KeyL')) this.world.frameLock = !this.world.frameLock
    if (i.tap('KeyJ')) this.world.ship.jumping = true
    if (i.tap('Tab')) this.cycleTarget()
    if (i.tap('Escape') && this.input.locked) document.exitPointerLock()
  }

  private cycleTarget(): void {
    const rows = [...this.world.bodies].sort((a, b) => {
      subTo(a.posKm, this.world.ship.posKm, delta)
      const da = mag(delta)
      subTo(b.posKm, this.world.ship.posKm, delta)
      return da - mag(delta)
    })
    const idx = rows.findIndex((b) => b.def.id === this.world.selectedId)
    const next = rows[(idx + 1) % rows.length]
    if (next) this.world.selectedId = next.def.id
  }

  private placeCamera(): void {
    const q = this.world.ship.quat
    if (this.world.cameraMode === 'cockpit') {
      offset.set(0, 0.12, 0.2).applyQuaternion(q)
      this.camera.position.copy(offset)
      look.set(0, 0.08, -4).applyQuaternion(q)
      this.camera.up.copy(up).applyQuaternion(q)
      this.camera.lookAt(look)
      return
    }
    offset.set(0, 0.48, 3.1).applyQuaternion(q)
    this.camera.position.copy(offset)
    look.set(0, 0.18, -8).applyQuaternion(q)
    this.camera.up.copy(up).applyQuaternion(q)
    this.camera.lookAt(look)
  }
}
