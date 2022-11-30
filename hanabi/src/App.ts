import {
  Engine,
  HemisphericLight,
  Scene,
  Vector3,
  ArcRotateCamera,
  MeshBuilder,
  SceneLoader,
} from '@babylonjs/core'
import Ground from './Ground'
import Box from './map/Box'
import Player from './Player'

export default class App {
  private canvas!: HTMLCanvasElement
  private scene: Scene
  private engine: Engine

  constructor() {
    this.createCanvas()
    const engine = (this.engine = new Engine(this.canvas))
    const scene = (this.scene = new Scene(engine))
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene)
    const camera = new ArcRotateCamera(
      'camera',
      1,
      1,
      10,
      new Vector3(0, 0, 0),
      scene
    )
    camera.attachControl(this.canvas)
    // const box = MeshBuilder.CreateBox('box', {size: 2}, scene)

    engine.runRenderLoop(function () {
      scene.render()
    })

    scene.debugLayer.show()

    const player = new Player(scene)
    player.load()

    new Ground(scene)
    new Box(scene)
  }

  private createCanvas(): HTMLCanvasElement {
    //Commented out for development
    document.documentElement.style['overflow'] = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.width = '100%'
    document.documentElement.style.height = '100%'
    document.documentElement.style.margin = '0'
    document.documentElement.style.padding = '0'
    document.body.style.overflow = 'hidden'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
    document.body.style.margin = '0'
    document.body.style.padding = '0'

    //create the canvas html element and attach it to the webpage
    this.canvas = document.createElement('canvas')
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.id = 'gameCanvas'
    document.body.appendChild(this.canvas)

    return this.canvas
  }
}
