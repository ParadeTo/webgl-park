import {
  MeshBuilder,
  Texture,
  StandardMaterial,
  Scene,
  Vector3,
  Matrix,
} from '@babylonjs/core'

export default class Box {
  constructor(scene: Scene) {
    var box = MeshBuilder.CreateBox('crate', {size: 1}, scene)
    box.material = new StandardMaterial('Mat', scene)
    box.material.diffuseTexture = new Texture('/pictures/crate.png', scene)
    box.material.diffuseTexture.hasAlpha = true
    // box.position =
    box.bakeTransformIntoVertices(Matrix.Translation(0, 0.5, 0))
    box.position = new Vector3(2, 0, 2)
  }
}
