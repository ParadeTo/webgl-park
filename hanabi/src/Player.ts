import {
  AnimationGroup,
  Matrix,
  Mesh,
  MeshBuilder,
  Quaternion,
  Scene,
  SceneLoader,
  Vector3,
} from '@babylonjs/core'

export default class Player {
  private scene: Scene

  public mesh: Mesh

  private idle: AnimationGroup

  constructor(scene: Scene) {
    this.scene = scene
  }

  createOuter() {
    //collision mesh
    const outer = MeshBuilder.CreateBox(
      'outer',
      {width: 2, depth: 1, height: 3},
      this.scene
    )
    outer.isVisible = false
    outer.isPickable = false
    outer.checkCollisions = true
    // move origin of box collider to the bottom of the mesh (to match player mesh)
    // 改变了 mesh 的顶点坐标
    outer.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0))
    //for collisions
    // outer.ellipsoid = new Vector3(1, 1.5, 1)
    // outer.ellipsoidOffset = new Vector3(0, 1.5, 0)

    // outer.rotationQuaternion = new Quaternion(0, 1, 0, 0) // rotate the player mesh 180 since we want to see the back of the player
  }

  async load() {
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

    const result = await SceneLoader.ImportMeshAsync(
      null,
      '/models/',
      'player.glb',
      this.scene
    )
    const body = result.meshes[0]
    body.parent = outer
    body.isPickable = false
    body.getChildMeshes().forEach((m) => {
      m.isPickable = false
    })

    this.idle = result.animationGroups[1]
    this.idle.loopAnimation = true
    this.idle.play(true)
  }
}
