export class Input {
  private down = new Set<string>()
  mouseDx = 0
  mouseDy = 0
  locked = false
  readonly onLock = new Set<(locked: boolean) => void>()

  constructor(private canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', this.onKey)
    window.addEventListener('keyup', this.onUp)
    window.addEventListener('blur', () => this.down.clear())
    const lock = (e?: KeyboardEvent): void => {
      if (this.locked) return
      if (e?.code === 'Escape') return
      void canvas.requestPointerLock()
    }
    canvas.addEventListener('click', () => lock())
    window.addEventListener('keydown', lock)
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas
      this.mouseDx = 0
      this.mouseDy = 0
      for (const fn of this.onLock) fn(this.locked)
    })
    document.addEventListener('mousemove', this.onMove)
  }

  private onKey = (e: KeyboardEvent): void => {
    if (e.repeat) {
      this.down.add(e.code)
      return
    }
    this.down.add(e.code)
    this.pressed.add(e.code)
    if (
      [
        'Tab',
        'Slash',
        'KeyJ',
        'Space',
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
      ].includes(e.code)
    ) {
      e.preventDefault()
    }
  }

  private pressed = new Set<string>()

  private onUp = (e: KeyboardEvent): void => {
    this.down.delete(e.code)
  }

  private onMove = (e: MouseEvent): void => {
    if (!this.locked) return
    this.mouseDx += e.movementX
    this.mouseDy += e.movementY
  }

  hold(code: string): boolean {
    return this.down.has(code)
  }

  tap(code: string): boolean {
    if (!this.pressed.has(code)) return false
    this.pressed.delete(code)
    return true
  }

  consumeMouse(): { x: number; y: number } {
    const x = this.mouseDx
    const y = this.mouseDy
    this.mouseDx = 0
    this.mouseDy = 0
    return { x, y }
  }
}
