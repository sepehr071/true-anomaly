import { DataTexture, SRGBColorSpace, Texture, TextureLoader } from 'three'

const loader = new TextureLoader()

const FALLBACK: Record<string, number> = {
  sun: 0xf0c060,
  mercury: 0x8a8680,
  venus: 0xc4a56a,
  earth: 0x3d6ea8,
  moon: 0x9a958c,
  mars: 0xb24a32,
  jupiter: 0xd4a070,
  saturn: 0xe6d0a0,
  uranus: 0x8ec4c8,
  neptune: 0x3d6ec8,
  pluto: 0xc4b8a8,
  stars: 0x0c0a08,
}

export function solid(hex: number): DataTexture {
  const t = new DataTexture(new Uint8Array([(hex >> 16) & 255, (hex >> 8) & 255, hex & 255, 255]), 1, 1)
  t.colorSpace = SRGBColorSpace
  t.needsUpdate = true
  return t
}

export async function loadTexture(url: string, fallbackHex = 0x888888): Promise<Texture> {
  try {
    const tex = await loader.loadAsync(url)
    tex.colorSpace = SRGBColorSpace
    tex.anisotropy = 8
    return tex
  } catch {
    return solid(fallbackHex)
  }
}

export function fallbackHex(id: string): number {
  return FALLBACK[id] ?? 0x888888
}
