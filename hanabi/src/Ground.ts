import {Scene, StandardMaterial, Texture, MeshBuilder} from '@babylonjs/core'

export default class Ground {
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
  }
}
