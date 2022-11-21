import '@babylonjs/core/Debug/debugLayer'
import '@babylonjs/inspector'
import '@babylonjs/loaders/glTF'
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  SceneLoader,
} from '@babylonjs/core'
import init from './demos/village'
class App {
  constructor() {
    // create the canvas html element and attach it to the webpage
    var canvas = document.createElement('canvas')
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.id = 'gameCanvas'
    document.body.appendChild(canvas)

    // initialize babylon scene and engine
    var engine = new Engine(canvas, true)
    var scene = new Scene(engine)

    init(engine, scene)

    // hide/show the Inspector
    window.addEventListener('keydown', (ev) => {
      // Shift+Ctrl+Alt+I
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
        if (scene.debugLayer.isVisible()) {
          scene.debugLayer.hide()
        } else {
          scene.debugLayer.show()
        }
      }
    })

    // run the main render loop
    engine.runRenderLoop(() => {
      scene.render()
    })
  }
}
new App()
