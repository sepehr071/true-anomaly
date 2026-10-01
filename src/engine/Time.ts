export const WARPS = [1, 10, 100, 1_000, 10_000, 100_000] as const

export class Time {
  simSeconds = 0
  warpIndex = 0
  accumulator = 0
  readonly step = 1 / 60

  get warp(): number {
    return WARPS[this.warpIndex]
  }

  bump(dir: number): void {
    this.warpIndex = Math.min(WARPS.length - 1, Math.max(0, this.warpIndex + dir))
  }

  advance(dt: number): number {
    const scaled = dt * this.warp
    this.simSeconds += scaled
    return scaled
  }
}
