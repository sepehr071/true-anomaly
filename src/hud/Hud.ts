import type { World } from '../engine/World'
import { formatRange, formatSpeed, mag, subTo, v3, kmToVisualRadius, KM_PER_UNIT } from '../sim/units'
import type { Time } from '../engine/Time'

const d = v3()

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T
}

export class Hud {
  private thr = el<HTMLElement>('thr')
  private warp = el<HTMLElement>('warp')
  private tgt = el<HTMLElement>('tgt')
  private rng = el<HTMLElement>('rng')
  private spd = el<HTMLElement>('spd')
  private frm = el<HTMLElement>('frm')
  private clock = el<HTMLElement>('clock')
  private blist = el<HTMLElement>('blist')
  private pause = el<HTMLElement>('pause')
  private prox = el<HTMLElement>('prox')

  constructor(private world: World) {
    el('hud').classList.add('ready')
  }

  render(time: Time): void {
    const w = this.world
    this.thr.style.height = `${Math.round(w.ship.throttle * 100)}%`
    this.warp.textContent = `×${time.warp}`
    const tgt = w.selected()
    this.tgt.textContent = (tgt?.def.name ?? '—').toUpperCase()
    if (tgt) {
      subTo(tgt.posKm, w.ship.posKm, d)
      this.rng.textContent = formatRange(mag(d))
      const vis = kmToVisualRadius(tgt.def.radiusKm, tgt.def.id === 'sun')
      const visRange = mag(d) / KM_PER_UNIT
      const hit = visRange < vis * 1.15
      this.prox.style.display = hit ? 'block' : 'none'
      if (hit) this.prox.textContent = `PROXIMITY ${(visRange / vis).toFixed(2)} R`
    } else {
      this.rng.textContent = '—'
      this.prox.style.display = 'none'
    }
    this.spd.textContent = formatSpeed(mag(w.ship.velKmS))
    const frame = w.frame()
    this.frm.textContent = w.frameLock ? `${(frame?.def.name ?? '—').toUpperCase()} LOCK` : 'SUN INERTIAL'
    const utc = new Date((w.catalog.epochJd - 2440587.5) * 86400000 + w.simSeconds * 1000)
    this.clock.textContent = `UTC ${utc.toISOString().replace('.000Z', 'Z')} · ${w.backend.toUpperCase()}`
    this.pause.style.display = w.paused ? 'block' : 'none'

    const rows = [...w.bodies].sort((a, b) => {
      subTo(a.posKm, w.ship.posKm, d)
      const da = mag(d)
      subTo(b.posKm, w.ship.posKm, d)
      return da - mag(d)
    })
    this.blist.innerHTML = rows
      .map((b) => {
        const cls = [b.def.id === w.selectedId ? 'sel' : '', b.def.id === w.frameId && w.frameLock ? 'lock' : '']
          .filter(Boolean)
          .join(' ')
        subTo(b.posKm, w.ship.posKm, d)
        return `<li class="${cls}"><span>${b.def.name.toUpperCase()}</span><i>${formatRange(mag(d))}</i></li>`
      })
      .join('')
  }
}
