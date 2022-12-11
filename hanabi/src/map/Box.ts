import {
  MeshBuilder,
  Texture,
  StandardMaterial,
  Scene,
  Vector3,
  Matrix,
  PhysicsImpostor,
  Mesh,
} from '@babylonjs/core'

export default class Box {
  mesh: Mesh

  constructor(scene: Scene) {
    var box = (this.mesh = MeshBuilder.CreateBox('crate', {size: 2}, scene))
    box.material = new StandardMaterial('Mat', scene)
    box.material.diffuseTexture = new Texture('/pictures/crate.png', scene)
    box.material.diffuseTexture.hasAlpha = true
    // box.position =
    box.bakeTransformIntoVertices(Matrix.Translation(0, 1, 0))
    box.position = new Vector3(2, 0, 0)
    box.physicsImpostor = new PhysicsImpostor(
      box,
      PhysicsImpostor.BoxImpostor,
      {mass: 2, friction: 0.1, restitution: 0.7},
      scene
    )
  }
}
