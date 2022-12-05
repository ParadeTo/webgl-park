import {CreateLines, Scene, Vector3, Color3, MeshBuilder} from '@babylonjs/core'

const size = 10
export default class Axis {
  constructor(scene: Scene) {
    var pilot_local_axisX = CreateLines(
      'pilot_local_axisX',
      {
        points: [
          Vector3.Zero(),
          new Vector3(size, 0, 0),
          new Vector3(size * 0.95, 0.05 * size, 0),
          new Vector3(size, 0, 0),
          new Vector3(size * 0.95, -0.05 * size, 0),
        ],
      },
      scene
    )
    pilot_local_axisX.color = new Color3(1, 0, 0)
    pilot_local_axisX.isPickable = false

    var pilot_local_axisY = CreateLines(
      'pilot_local_axisY',
      {
        points: [
          Vector3.Zero(),
          new Vector3(0, size, 0),
          new Vector3(-0.05 * size, size * 0.95, 0),
          new Vector3(0, size, 0),
          new Vector3(0.05 * size, size * 0.95, 0),
        ],
      },
      scene
    )
    pilot_local_axisY.color = new Color3(0, 1, 0)
    pilot_local_axisY.isPickable = false

    var pilot_local_axisZ = CreateLines(
      'pilot_local_axisZ',
      {
        points: [
          Vector3.Zero(),
          new Vector3(0, 0, size),
          new Vector3(0, -0.05 * size, size * 0.95),
          new Vector3(0, 0, size),
          new Vector3(0, 0.05 * size, size * 0.95),
        ],
      },
      scene
    )
    pilot_local_axisZ.color = new Color3(0, 0, 1)
    pilot_local_axisZ.isPickable = false
  }
}
