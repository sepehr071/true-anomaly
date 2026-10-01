import type { Camera, Scene } from 'three'
import { RenderPipeline, type WebGPURenderer } from 'three/webgpu'
import { pass } from 'three/tsl'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'

export function makePost(
  renderer: WebGPURenderer,
  scene: Scene,
  camera: Camera,
  reduced: boolean,
): { render: () => void } {
  if (reduced) return { render: () => renderer.render(scene, camera) }
  const pipe = new RenderPipeline(renderer)
  const scenePass = pass(scene, camera)
  const color = scenePass.getTextureNode('output')
  pipe.outputNode = color.add(bloom(color, 0.28, 0.22, 0.82))
  return { render: () => pipe.render() }
}
