import {ActionManager, ExecuteCodeAction, Scalar, Scene} from '@babylonjs/core'

const step = 0.2
const interval = 5
export default class InputController {
  private scene: Scene
  public input: string
  verticalAxis: number
  vertical: any
  horizontal: number
  horizontalAxis: number
  inputMap = {}
  pushKeyDown: boolean = false

  constructor(scene: Scene) {
    this.scene = scene
    const actionManager = (scene.actionManager = new ActionManager(scene))
    actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
        // this.input = evt.sourceEvent.key
        this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == 'keydown'
      })
    )
    actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
        // this.input = ''
        this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == 'keydown'
      })
    )
    scene.onBeforeRenderObservable.add(() => {
      this.updateFromKeyboard()
    })
  }

  private updateFromKeyboard(): void {
    if (this.inputMap['ArrowUp']) {
      this.verticalAxis = 1
      this.vertical = 0.01
    } else if (this.inputMap['ArrowDown']) {
      this.verticalAxis = -1
      this.vertical = -0.01 //Scalar.Lerp(this.vertical, -step, step / interval)
    } else {
      this.vertical = 0
      this.verticalAxis = 0
    }

    if (this.inputMap['ArrowLeft']) {
      this.horizontalAxis = -1
      this.horizontal = -0.01 //Scalar.Lerp(this.horizontal, -step, step / interval)
    } else if (this.inputMap['ArrowRight']) {
      this.horizontalAxis = 1
      this.horizontal = 0.01 //Scalar.Lerp(this.horizontal, step, step / interval)
    } else {
      this.horizontal = 0
      this.horizontalAxis = 0
    }

    //Jump Checks (SPACE)
    if (this.inputMap[' ']) {
      this.pushKeyDown = true
    } else {
      this.pushKeyDown = false
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
