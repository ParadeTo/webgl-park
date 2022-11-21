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
  Color4,
  FreeCamera,
} from '@babylonjs/core'
import {AdvancedDynamicTexture, Image, Button, Control} from '@babylonjs/gui'

//enum for states
enum State {
  START = 0,
  GAME = 1,
  LOSE = 2,
  CUTSCENE = 3,
}

class App {
  // General Entire Application
  private _scene: Scene
  private _canvas: HTMLCanvasElement
  private _engine: Engine

  //this._scene - related
  private _state: number = 0
  private _gamescene: Scene
  private _cutScene: Scene

  constructor() {
    // create the canvas html element and attach it to the webpage
    this._canvas = this._createCanvas()

    // initialize babylon this._scene and engine
    this._engine = new Engine(this._canvas, true)
    this._scene = new Scene(this._engine)

    // hide/show the Inspector
    window.addEventListener('keydown', (ev) => {
      // Shift+Ctrl+Alt+I
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
        if (this._scene.debugLayer.isVisible()) {
          this._scene.debugLayer.hide()
        } else {
          this._scene.debugLayer.show()
        }
      }
    })

    this._main()
  }

  private async _main(): Promise<void> {
    await this._goToStart()

    // run the main render loop
    this._engine.runRenderLoop(() => {
      this._scene.render()
    })
  }

  //set up the canvas
  private _createCanvas(): HTMLCanvasElement {
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
    this._canvas = document.createElement('canvas')
    this._canvas.style.width = '100%'
    this._canvas.style.height = '100%'
    this._canvas.id = 'gameCanvas'
    document.body.appendChild(this._canvas)

    return this._canvas
  }

  private async _goToStart() {
    this._engine.displayLoadingUI()

    this._scene.detachControl()
    let scene = new Scene(this._engine)
    scene.clearColor = new Color4(0, 0, 0, 1)
    let camera = new FreeCamera('camera1', new Vector3(0, 0, 0), scene)
    camera.setTarget(Vector3.Zero())
    debugger
    //--GUI--
    const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI('UI')
    guiMenu.idealHeight = 720
    //create a simple button
    const startBtn = Button.CreateSimpleButton('start', 'PLAY')
    startBtn.width = 0.2
    startBtn.height = '40px'
    startBtn.color = 'white'
    startBtn.top = '-14px'
    startBtn.thickness = 0
    startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM
    guiMenu.addControl(startBtn)

    //this handles interactions with the start button attached to the scene
    startBtn.onPointerDownObservable.add(() => {
      this._goToCutScene()
      scene.detachControl() //observables disabled
    })
    //--SCENE FINISHED LOADING--
    await scene.whenReadyAsync()
    this._engine.hideLoadingUI()
    //lastly set the current state to the start state and set the scene to the start scene
    this._scene.dispose()
    this._scene = scene
    this._state = State.START
  }

  private async _goToCutScene(): Promise<void> {
    this._engine.displayLoadingUI()
    //--SETUP SCENE--
    //dont detect any inputs from this ui while the game is loading
    this._scene.detachControl()
    this._cutScene = new Scene(this._engine)
    let camera = new FreeCamera('camera1', new Vector3(0, 0, 0), this._cutScene)
    camera.setTarget(Vector3.Zero())
    this._cutScene.clearColor = new Color4(0, 0, 0, 1)

    //--GUI--
    const cutScene = AdvancedDynamicTexture.CreateFullscreenUI('cutscene')
    let transition = 0 //increment based on dialogue
    let canplay = false
    let finished_anim = false
    let anims_loaded = 0

    //Animations
    const beginning_anim = new Image(
      'sparkLife',
      './sprites/beginning_anim.png'
    )
    beginning_anim.stretch = Image.STRETCH_UNIFORM
    beginning_anim.cellId = 0
    beginning_anim.cellHeight = 480
    beginning_anim.cellWidth = 480
    beginning_anim.sourceWidth = 480
    beginning_anim.sourceHeight = 480
    cutScene.addControl(beginning_anim)
    beginning_anim.onImageLoadedObservable.add(() => {
      anims_loaded++
    })
    const working_anim = new Image('sparkLife', './sprites/working_anim.png')
    working_anim.stretch = Image.STRETCH_UNIFORM
    working_anim.cellId = 0
    working_anim.cellHeight = 480
    working_anim.cellWidth = 480
    working_anim.sourceWidth = 480
    working_anim.sourceHeight = 480
    working_anim.isVisible = false
    cutScene.addControl(working_anim)
    working_anim.onImageLoadedObservable.add(() => {
      anims_loaded++
    })
    const dropoff_anim = new Image('sparkLife', './sprites/dropoff_anim.png')
    dropoff_anim.stretch = Image.STRETCH_UNIFORM
    dropoff_anim.cellId = 0
    dropoff_anim.cellHeight = 480
    dropoff_anim.cellWidth = 480
    dropoff_anim.sourceWidth = 480
    dropoff_anim.sourceHeight = 480
    dropoff_anim.isVisible = false
    cutScene.addControl(dropoff_anim)
    dropoff_anim.onImageLoadedObservable.add(() => {
      anims_loaded++
    })
    const leaving_anim = new Image('sparkLife', './sprites/leaving_anim.png')
    leaving_anim.stretch = Image.STRETCH_UNIFORM
    leaving_anim.cellId = 0
    leaving_anim.cellHeight = 480
    leaving_anim.cellWidth = 480
    leaving_anim.sourceWidth = 480
    leaving_anim.sourceHeight = 480
    leaving_anim.isVisible = false
    cutScene.addControl(leaving_anim)
    leaving_anim.onImageLoadedObservable.add(() => {
      anims_loaded++
    })
    const watermelon_anim = new Image(
      'sparkLife',
      './sprites/watermelon_anim.png'
    )
    watermelon_anim.stretch = Image.STRETCH_UNIFORM
    watermelon_anim.cellId = 0
    watermelon_anim.cellHeight = 480
    watermelon_anim.cellWidth = 480
    watermelon_anim.sourceWidth = 480
    watermelon_anim.sourceHeight = 480
    watermelon_anim.isVisible = false
    cutScene.addControl(watermelon_anim)
    watermelon_anim.onImageLoadedObservable.add(() => {
      anims_loaded++
    })
    const reading_anim = new Image('sparkLife', './sprites/reading_anim.png')
    reading_anim.stretch = Image.STRETCH_UNIFORM
    reading_anim.cellId = 0
    reading_anim.cellHeight = 480
    reading_anim.cellWidth = 480
    reading_anim.sourceWidth = 480
    reading_anim.sourceHeight = 480
    reading_anim.isVisible = false
    cutScene.addControl(reading_anim)
    reading_anim.onImageLoadedObservable.add(() => {
      anims_loaded++
    })

    //Dialogue animations
    const dialogueBg = new Image(
      'sparkLife',
      './sprites/bg_anim_text_dialogue.png'
    )
    dialogueBg.stretch = Image.STRETCH_UNIFORM
    dialogueBg.cellId = 0
    dialogueBg.cellHeight = 480
    dialogueBg.cellWidth = 480
    dialogueBg.sourceWidth = 480
    dialogueBg.sourceHeight = 480
    dialogueBg.horizontalAlignment = 0
    dialogueBg.verticalAlignment = 0
    dialogueBg.isVisible = false
    cutScene.addControl(dialogueBg)
    dialogueBg.onImageLoadedObservable.add(() => {
      anims_loaded++
    })

    const dialogue = new Image('sparkLife', './sprites/text_dialogue.png')
    dialogue.stretch = Image.STRETCH_UNIFORM
    dialogue.cellId = 0
    dialogue.cellHeight = 480
    dialogue.cellWidth = 480
    dialogue.sourceWidth = 480
    dialogue.sourceHeight = 480
    dialogue.horizontalAlignment = 0
    dialogue.verticalAlignment = 0
    dialogue.isVisible = false
    cutScene.addControl(dialogue)
    dialogue.onImageLoadedObservable.add(() => {
      anims_loaded++
    })

    //looping animation for the dialogue background
    let dialogueTimer = setInterval(() => {
      if (finished_anim && dialogueBg.cellId < 3) {
        dialogueBg.cellId++
      } else {
        dialogueBg.cellId = 0
      }
    }, 250)

    //skip cutscene
    const skipBtn = Button.CreateSimpleButton('skip', 'SKIP')
    skipBtn.fontFamily = 'Viga'
    skipBtn.width = '45px'
    skipBtn.left = '-14px'
    skipBtn.height = '40px'
    skipBtn.color = 'white'
    skipBtn.top = '14px'
    skipBtn.thickness = 0
    skipBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
    skipBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT
    cutScene.addControl(skipBtn)

    skipBtn.onPointerDownObservable.add(() => {
      this._cutScene.detachControl()
      clearInterval(animTimer)
      clearInterval(anim2Timer)
      clearInterval(dialogueTimer)
      this._engine.displayLoadingUI()
      canplay = true
    })

    //--PLAYING ANIMATIONS--
    let animTimer
    let anim2Timer
    let anim = 1 //keeps track of which animation we're playing
    //sets up the state machines for animations
    this._cutScene.onBeforeRenderObservable.add(() => {
      console.log(11111)
      if (anims_loaded == 8) {
        this._engine.hideLoadingUI()
        anims_loaded = 0

        //animation sequence
        animTimer = setInterval(() => {
          switch (anim) {
            case 1:
              if (beginning_anim.cellId == 9) {
                //each animation could have a different number of frames
                anim++
                beginning_anim.isVisible = false // current animation hidden
                working_anim.isVisible = true // show the next animation
              } else {
                beginning_anim.cellId++
              }
              break
            case 2:
              if (working_anim.cellId == 11) {
                anim++
                working_anim.isVisible = false
                dropoff_anim.isVisible = true
              } else {
                working_anim.cellId++
              }
              break
            case 3:
              if (dropoff_anim.cellId == 11) {
                anim++
                dropoff_anim.isVisible = false
                leaving_anim.isVisible = true
              } else {
                dropoff_anim.cellId++
              }
              break
            case 4:
              if (leaving_anim.cellId == 9) {
                anim++
                leaving_anim.isVisible = false
                watermelon_anim.isVisible = true
              } else {
                leaving_anim.cellId++
              }
              break
            default:
              break
          }
        }, 250)

        //animation sequence 2 that uses a different time interval
        anim2Timer = setInterval(() => {
          switch (anim) {
            case 5:
              if (watermelon_anim.cellId == 8) {
                anim++
                watermelon_anim.isVisible = false
                reading_anim.isVisible = true
              } else {
                watermelon_anim.cellId++
              }
              break
            case 6:
              if (reading_anim.cellId == 11) {
                reading_anim.isVisible = false
                finished_anim = true
                dialogueBg.isVisible = true
                dialogue.isVisible = true
                next.isVisible = true
              } else {
                reading_anim.cellId++
              }
              break
          }
        }, 750)
      }

      //only once all of the game assets have finished loading and you've completed the animation sequence + dialogue can you go to the game state
      if (finishedLoading && canplay) {
        canplay = false
        this._goToGame()
      }
    })

    //--PROGRESS DIALOGUE--
    const next = Button.CreateImageOnlyButton('next', './sprites/arrowBtn.png')
    next.rotation = Math.PI / 2
    next.thickness = 0
    next.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM
    next.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT
    next.width = '64px'
    next.height = '64px'
    next.top = '-3%'
    next.left = '-12%'
    next.isVisible = false
    cutScene.addControl(next)

    next.onPointerUpObservable.add(() => {
      if (transition == 8) {
        //once we reach the last dialogue frame, goToGame
        this._cutScene.detachControl()
        this._engine.displayLoadingUI() //if the game hasn't loaded yet, we'll see a loading screen
        transition = 0
        canplay = true
      } else if (transition < 8) {
        // 8 frames of dialogue
        transition++
        dialogue.cellId++
      }
    })

    //--WHEN SCENE IS FINISHED LOADING--
    await this._cutScene.whenReadyAsync()
    this._scene.dispose()
    this._state = State.CUTSCENE
    this._scene = this._cutScene

    //--START LOADING AND SETTING UP THE GAME DURING THIS SCENE--
    var finishedLoading = false
    await this._setUpGame().then((res) => {
      finishedLoading = true
    })
  }

  private async _goToGame() {
    throw new Error('Method not implemented.')
  }

  private async _setUpGame() {
    throw new Error('Method not implemented.')
  }

  private async _goToLose(): Promise<void> {
    this._engine.displayLoadingUI()

    //--SCENE SETUP--
    this._scene.detachControl()
    let scene = new Scene(this._engine)
    scene.clearColor = new Color4(0, 0, 0, 1)
    let camera = new FreeCamera('camera1', new Vector3(0, 0, 0), scene)
    camera.setTarget(Vector3.Zero())

    //--GUI--
    const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI('UI')
    const mainBtn = Button.CreateSimpleButton('mainmenu', 'MAIN MENU')
    mainBtn.width = 0.2
    mainBtn.height = '40px'
    mainBtn.color = 'white'
    guiMenu.addControl(mainBtn)
    //this handles interactions with the start button attached to the scene
    mainBtn.onPointerUpObservable.add(() => {
      this._goToStart()
    })

    //--SCENE FINISHED LOADING--
    await scene.whenReadyAsync()
    this._engine.hideLoadingUI() //when the scene is ready, hide loading
    //lastly set the current state to the lose state and set the scene to the lose scene
    this._scene.dispose()
    this._scene = scene
    this._state = State.LOSE
  }
}
new App()
