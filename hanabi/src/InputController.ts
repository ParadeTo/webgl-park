import {ActionManager, ExecuteCodeAction, Scalar, Scene} from '@babylonjs/core'

const step = 0.2
const interval = 5
export default class InputController {
  private scene: Scene
  private input: string
  verticalAxis: number
  vertical: any
  horizontal: number
  horizontalAxis: number
  constructor(scene: Scene) {
    this.scene = scene
    const actionManager = (scene.actionManager = new ActionManager(scene))
    actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
        this.input = evt.sourceEvent.key
      })
    )
    actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
        this.input = ''
      })
    )
    scene.onBeforeRenderObservable.add(() => {
      this.updateFromKeyboard()
    })
  }

  private updateFromKeyboard(): void {
    console.log(this.input)
    switch (this.input) {
      case 'ArrowUp':
        this.verticalAxis = 1
        this.vertical = 0.01
        this.horizontal = 0
        this.horizontalAxis = 0
        break
      case 'ArrowDown':
        this.verticalAxis = -1
        this.vertical = -0.01 //Scalar.Lerp(this.vertical, -step, step / interval)
        this.horizontal = 0
        this.horizontalAxis = 0
        break
      case 'ArrowLeft':
        this.horizontalAxis = -1
        this.horizontal = -0.01 //Scalar.Lerp(this.horizontal, -step, step / interval)
        this.verticalAxis = 0
        this.vertical = 0
        break
      case 'ArrowRight':
        this.horizontalAxis = 1
        this.horizontal = 0.01 //Scalar.Lerp(this.horizontal, step, step / interval)
        this.verticalAxis = 0
        this.vertical = 0
        break
      default:
        this.horizontal = 0
        this.horizontalAxis = 0
        this.verticalAxis = 0
        this.vertical = 0
        break
    }

    //forward - backwards movement
    // if (this.input ['ArrowUp']) {
    //   // Scalar.Lerp(this.vertical, step, step / interval)
    // } else if (this.inputMap['ArrowDown']) {
    //   this.vertical = -0.01 //Scalar.Lerp(this.vertical, -step, step / interval)
    //   this.verticalAxis = -1
    // } else if () {
    //   this.vertical = 0
    //   this.verticalAxis = 0
    // }

    // //left - right movement
    // if (this.inputMap['ArrowLeft']) {

    // } else if (this.inputMap['ArrowRight']) {

    // } else {

    // }
  }
}
