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
import InputController from './InputController'
import Box from './map/Box'
import Player from './Player'
import Axis from './Axis'
import LoadModel from './demo/loadModel'

export default class App {
  private canvas!: HTMLCanvasElement
  private scene: Scene
  private engine: Engine
  input: InputController

  constructor() {
    this.createCanvas()
    const engine = (this.engine = new Engine(this.canvas))
    const scene = (this.scene = new Scene(engine))
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene)
    const camera = new ArcRotateCamera(
      'camera',
      (3 / 2) * Math.PI,
      1,
      10,
      new Vector3(0, 0, 0),
      scene
    )
    // camera.attachControl(this.canvas)

    engine.runRenderLoop(function () {
      scene.render()
    })

    scene.debugLayer.show()

    const input = new InputController(scene)
    const player = new Player(scene, input)
    player.init()

    new Ground(scene)
    new Box(scene)
    new Axis(scene)

    // LoadModel.load(scene, 'test')
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
