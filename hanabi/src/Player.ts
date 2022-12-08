import {
  AnimationGroup,
  Matrix,
  Mesh,
  MeshBuilder,
  Quaternion,
  Scalar,
  Scene,
  SceneLoader,
  Vector3,
} from '@babylonjs/core'
import InputController from './InputController'

export default class Player {
  private scene: Scene

  public mesh: Mesh

  private idle: AnimationGroup
  private input: InputController
  deltaTime: number
  moveDirection: Vector3

  constructor(scene: Scene, input: InputController) {
    this.scene = scene
    this.input = input
  }

  async init() {
    this.mesh = this.createOuter()
    const result = await this.load()
    const body = result.meshes[0]
    body.parent = this.mesh
    body.isPickable = false
    body.getChildMeshes().forEach((m) => {
      m.isPickable = false
    })

    this.idle = result.animationGroups[0]
    this.idle.loopAnimation = true
    this.idle.play(true)

    this.scene.registerBeforeRender(() => {
      this.updateFromControls()
    })
  }

  private updateFromControls(): void {
    const {vertical, horizontal, horizontalAxis, verticalAxis} = this.input
    this.deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0

    this.moveDirection = Vector3.Zero()

    let fwd = new Vector3(0, 0, 1)
    let right = new Vector3(1, 0, 0)
    let correctedVertical = fwd.scaleInPlace(vertical)
    let correctedHorizontal = right.scaleInPlace(horizontal)

    let move = correctedHorizontal.addInPlace(correctedVertical)
    this.moveDirection = correctedHorizontal.addInPlace(correctedVertical) //new Vector3(move.x, 0, move.normalize().z)
    //check if there is movement to determine if rotation is needed
    let input = new Vector3(horizontalAxis, 0, verticalAxis) //along which axis is the direction
    if (input.length() == 0) {
      //if there's no input detected, prevent rotation and keep player in same rotation
      return
    }

    const angle1 = Math.atan2(horizontalAxis, verticalAxis)
    const angle2 = angle1 - Math.PI * 2
    let angle = angle1
    if (
      Math.abs(this.mesh.rotation.y - angle1) >
      Math.abs(this.mesh.rotation.y - angle2)
    )
      angle = angle2
    this.mesh.rotation.y = +Scalar.Lerp(
      this.mesh.rotation.y,
      angle,
      10 * this.deltaTime
    )

    this.mesh.moveWithCollisions(this.moveDirection)
  }

  private createOuter() {
    //collision mesh
    const outer = MeshBuilder.CreateBox(
      'outer',
      {width: 2, depth: 1, height: 3},
      this.scene
    )
    outer.isVisible = false
    outer.isPickable = false
    outer.checkCollisions = true
    // 改变了 mesh 的顶点坐标
    outer.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0))
    outer.scaling = new Vector3(0.5, 0.5, 0.5)
    return outer
  }

  private async load() {
    return SceneLoader.ImportMeshAsync(
      null,
      '/models/',
      'player.glb',
      this.scene
    )
  }
}
