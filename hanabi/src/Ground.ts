import {
  Scene,
  StandardMaterial,
  Texture,
  MeshBuilder,
  PhysicsImpostor,
  Mesh,
} from '@babylonjs/core'

export default class Ground {
  mesh: Mesh
  constructor(scene: Scene) {
    //Create Village ground
    const groundMat = new StandardMaterial('groundMat')
    groundMat.diffuseTexture = new Texture('/pictures/villagegreen.png')
    groundMat.diffuseTexture.hasAlpha = true

    const ground = MeshBuilder.CreateGround(
      'ground',
      {
        width: 24,
        height: 24,
      },
      scene
    )
    ground.material = groundMat
    ground.physicsImpostor = new PhysicsImpostor(
      ground,
      PhysicsImpostor.BoxImpostor,
      {mass: 0, friction: 0.1, restitution: 0.7},
      scene
    )
  }
}
