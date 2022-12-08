import {Scene, SceneLoader} from '@babylonjs/core'

export default class LoadModel {
  public static async load(scene: Scene, name: string) {
    return SceneLoader.ImportMeshAsync(null, '/models/', `${name}.glb`, scene)
  }
}
