import {
  Engine,
  Scene,
  MeshBuilder,
  ArcRotateCamera,
  Vector3,
  SceneLoader,
  HemisphericLight,
} from '@babylonjs/core'

export default (engine: Engine, scene: Scene, canvas: HTMLCanvasElement) => {
  const ground = MeshBuilder.CreateGround('ground', {width: 10, height: 10})
  const box = MeshBuilder.CreateBox('box', {})
  box.position.y = 0.5
  const camera: ArcRotateCamera = new ArcRotateCamera(
    'Camera',
    Math.PI / 2,
    Math.PI / 2,
    2,
    Vector3.Zero(),
    scene
  )
  const light = new HemisphericLight('light', new Vector3(1, 1, 0))
  camera.attachControl(canvas, true)
}
