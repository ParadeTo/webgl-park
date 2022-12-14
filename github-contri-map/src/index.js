import fShader from './fShader'
import ObjDoc from './ObjDoc'
import vShader from './vShader'
import {
  initArrayBuffer,
  initElementArrayBuffer,
  getVarLocation,
  generateColors,
  hexToRGBArr,
} from '../../lib/gl-utils'
import charObj from '../../resources/char.obj'

class GithubContriMap {
  constructor() {
    const h = document.documentElement.clientHeight
    const w = document.documentElement.clientWidth
    this.canvas = document.getElementById('webgl')
    this.canvas.width = w
    this.canvas.height = h

    this.pillarSize = 3
    this.pillarGap = 0
    this.padding = 2
    this.trapezoidDiffOfUpAndDown = 2
    this.trapezoidHeight = 10
    this.weeks = 53
    this.lineSize = 0.4
    this.lineGap = 30
    this.lineNum = 100
    this.rotateY = 0
    this.rotateX = 0
    this.contributions = null
    this.charObjDoc = null
    this.textScale = 9
    this.year = ''
    this.name = ''
    this.isPointLight = false
    this.light = {
      position: [100, 500, 2000],
      color: [1, 1, 1],
    }
    this.objectsColor = [100 / 255, 100 / 255, 100 / 255]
    this.viewPosition = [0, 0, 126000 / (w + 600)]

    const gl = getWebGLContext(this.canvas)
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL')
      return
    }

    // Initialize shaders
    if (!initShaders(gl, vShader, fShader)) {
      console.log('Failed to intialize shaders.')
      return
    }
    this.gl = gl
  }

  getParams() {
    const $name = document.querySelector('#name')
    const $year = document.querySelector('#year')
    if (!$name.value || !$year.value) return
    this.year = $year.value
    this.name = $name.value
  }

  async getData() {
    if (!this.name || !this.year) return
    try {
      const rsp = await fetch(`/api/${this.name}/${this.year}`)
      const {contributions} = await rsp.json()
      this.contributions = contributions
    } catch (error) {}
  }

  async run() {
    this.setProjMatrix()
    this.setViewMatrix()
    this.addEventListener()

    this.getParams()
    this.charObjDoc = await this.getParsedObjDoc(charObj)
    this.draw()
  }

  async getParsedObjDoc(cnt) {
    try {
      const objDoc = new ObjDoc()
      const parseResult = objDoc.parse(cnt, this.textScale)
      if (!parseResult) throw new Error('parse obj file wrong.')
      return objDoc
    } catch (error) {
      console.log(error)
    }
  }

  setUniformValue(key, value, fn) {
    const uVar = getVarLocation(this.gl, key, 'Uniform')
    if (fn) this.gl[fn](uVar, value)
    else this.gl.uniform1i(uVar, value)
  }

  // async drawMoon() {
  //   const {gl} = this
  //   const center = [0, 0, 40]
  //   const radius = 10
  //   const vertices = [0, 0]
  //   const div = 100
  //   for (let i = 0; i < div; i++) {
  //     const delta = (360 / div) * (Math.PI / 180)
  //     const angle = delta * i
  //     vertices.push(Math.cos(angle), Math.sin(angle))
  //   }
  //   vertices.push(vertices[2], vertices[3])
  //   if (
  //     !initArrayBuffer(gl, 'aPosition', new Float32Array(vertices), gl.FLOAT, 2)
  //   )
  //     return

  //   this.setModelMatrix((matrix) => {
  //     matrix.scale(10, 10, 1)
  //   })
  //   gl.drawArrays(gl.POINTS, 0, 102)
  // }

  drawLightSrc() {
    const {gl, light} = this
    if (
      !initArrayBuffer(gl, 'aPosition', new Float32Array([0, 0]), gl.FLOAT, 2)
    )
      return
    this.setModelMatrix((matrix) => {
      matrix.translate(...light.position)
      this.setNormalMatrix(matrix)
    })
    gl.drawArrays(gl.POINTS, 0, 1)
  }

  async drawText(name, year = '') {
    const {
      gl,
      textScale,
      pillarGap,
      pillarSize,
      trapezoidDiffOfUpAndDown,
      trapezoidHeight,
      padding,
      weeks,
    } = this
    const nameLen = name.length
    const yearLen = year.length
    const {vertices, normals, indices, colors, charParams} =
      this.charObjDoc.getTextDrawingInfo(name + year, this.charObjDoc)
    if (
      !initArrayBuffer(gl, 'aPosition', new Float32Array(vertices), gl.FLOAT, 3)
    )
      return
    if (!initArrayBuffer(gl, 'aNormal', new Float32Array(normals), gl.FLOAT, 3))
      return
    if (
      !initArrayBuffer(
        gl,
        'aColor',
        new Float32Array(generateColors(vertices.length, ...this.objectsColor)),
        gl.FLOAT,
        3
      )
    )
      return
    initElementArrayBuffer(gl, new Uint16Array(indices))

    this.setUniformValue('uDrawType', 1)
    for (let i = 0; i < charParams.length; i++) {
      const char = charParams[i]
      // need to minus some angle to adjust
      const theta = Math.atan(trapezoidDiffOfUpAndDown / trapezoidHeight) - 0.15
      const deltaLen = ((pillarGap + pillarSize) * 7) / 2 + padding
      const charW = textScale / 2 + 1.3
      const downDis = 11
      if (i < nameLen)
        this.setModelMatrix((matrix) => {
          matrix
            .scale(1, 0.6, 1)
            .rotate(90 - (theta * 180) / Math.PI, 1, 0, 0)
            .translate(
              charW * i - (weeks * (pillarGap + pillarSize)) / 2,
              deltaLen * Math.cos(theta),
              deltaLen * Math.sin(theta) + downDis
            )
          this.setNormalMatrix(matrix)
        })
      else {
        this.setModelMatrix((matrix) => {
          matrix
            .scale(1, 0.6, 1)
            .rotate(90 - (theta * 180) / Math.PI, 1, 0, 0)
            .translate(
              -charW * (yearLen - i + nameLen) +
                (weeks * (pillarGap + pillarSize)) / 2,
              deltaLen * Math.cos(theta),
              deltaLen * Math.sin(theta) + downDis
            )
          this.setNormalMatrix(matrix)
        })
      }
      gl.drawElements(gl.TRIANGLES, char.n, gl.UNSIGNED_SHORT, char.offset * 2)
    }
  }

  async draw() {
    if (!this.contributions) return

    const {gl} = this
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)

    this.setLight()

    // draw grid
    this.setUniformValue('uDrawType', 2)
    this.drawGrid()

    // draw cubics
    this.setUniformValue('uDrawType', 0)
    this.drawTrapezoid((matrix) => {
      matrix.translate(
        -(((this.weeks - 1) * (this.pillarSize + this.pillarGap)) / 2),
        0,
        -(6 * (this.pillarSize + this.pillarGap)) / 2
      )
      this.setNormalMatrix(matrix)
    })
    this.drawCubics(this.contributions)

    this.setUniformValue('uDrawType', 1)
    this.drawText(this.name.toUpperCase(), this.year)

    this.setUniformValue('uDrawType', 3)
    this.drawLightSrc()
  }

  addEventListener() {
    // const tick = () => {
    //   // this.rotateY += 1
    //   // this.rotateX += 1
    //   // this.setViewMatrix()
    //   this.draw()
    //   requestAnimationFrame(tick)
    // }
    // tick()

    const debounce = (func, delay) => {
      let debounceTimer
      return function () {
        const context = this
        const args = arguments
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => func.apply(context, args), delay)
      }
    }

    // const start = debounce(() => {
    //   decelerate(5, 5, 0.1)
    // }, 10)

    const factor = 0.5

    // const decelerate = debounce((yV, xV, step) => {
    //   this.rotateY += xV * step
    //   this.rotateX = Math.max(Math.min(this.rotateX + yV * step, 90), 0)
    //   this.setViewMatrix()
    //   this.draw()
    //   requestAnimationFrame(() =>
    //     decelerate(yV - step * yV, xV - step * xV, step)
    //   )
    // }, 10)

    let lastX = 0
    let lastY = 0
    let isMouseDown = false
    const onDown = (e) => {
      isMouseDown = true
      if (e.touches) {
        lastX = e.touches[0].clientX
        lastY = e.touches[0].clientY
      } else {
        lastX = e.clientX
        lastY = e.clientY
      }
    }
    this.canvas.addEventListener('mousedown', onDown)
    this.canvas.addEventListener('touchstart', onDown)

    const onMove = (e) => {
      let clientX = e.clientX
      let clientY = e.clientY
      if (e.touches) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      }
      if (isMouseDown) {
        const dx = factor * (clientX - lastX)
        const dy = factor * (clientY - lastY)
        this.rotateY += dx
        this.rotateX = Math.max(Math.min(this.rotateX + dy, 90), 0)
        this.setViewMatrix()
        this.draw()
      }
      lastX = clientX
      lastY = clientY
    }
    this.canvas.addEventListener('mousemove', onMove)
    this.canvas.addEventListener('touchmove', onMove)

    const onEnd = (e) => {
      isMouseDown = false
    }
    this.canvas.addEventListener('mouseup', onEnd)
    this.canvas.addEventListener('touchend', onEnd)

    document.querySelector('#getData').addEventListener('click', async () => {
      this.getParams()
      window.open(
        `https://skyline.github.com/${this.name}/${this.year}.json`,
        '__blank'
      )
    })

    document.querySelector('#confirm').addEventListener('click', async () => {
      try {
        const cnt = document.querySelector('#data').value
        this.contributions = JSON.parse(cnt).contributions
        this.getParams()
        this.draw()
      } catch (error) {}
    })

    document.querySelector('#lightColor').addEventListener('change', (e) => {
      const color = hexToRGBArr(e.target.value)
      this.light.color = color
      this.draw()
    })

    document.querySelector('#objectColor').addEventListener('change', (e) => {
      const color = hexToRGBArr(e.target.value)
      this.objectsColor = color
      this.draw()
    })

    document.querySelector('#pointLight').addEventListener('change', (e) => {
      this.isPointLight = e.target.checked
      this.draw()
    })
    ;[
      document.querySelector('#lightX'),
      document.querySelector('#lightY'),
      document.querySelector('#lightZ'),
    ].forEach(($, i) => {
      $.addEventListener('change', (e) => {
        this.light.position[i] = Number(e.target.value)
        this.setLight()
        this.draw()
      })
    })

    let isKeyDown = false
    let rotateY = 0
    const step = 0.1

    const move = () => {
      if (!isKeyDown) return
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
      } else if (e.key === 'ArrowRight') {
      }
    })
  }

  drawHexahedron({vertexs, normals, colors, setModelMatrix}) {
    const {gl} = this
    if (!initArrayBuffer(gl, 'aPosition', vertexs, gl.FLOAT, 3)) return
    if (!initArrayBuffer(gl, 'aNormal', normals, gl.FLOAT, 3)) return
    if (!initArrayBuffer(gl, 'aColor', colors, gl.FLOAT, 3)) return

    // prettier-ignore
    var indices = new Uint8Array([
      0, 1, 2,   0, 2, 3,    // front
      4, 5, 6,   4, 6, 7,    // right
      8, 9,10,   8,10,11,    // up
      12,13,14,  12,14,15,    // left
      16,17,18,  16,18,19,    // down
      20,21,22,  20,22,23     // back
    ]);
    this.setModelMatrix(setModelMatrix)
    const n = initElementArrayBuffer(gl, indices)
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0)
  }

  drawTrapezoid(setModelMatrix) {
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3

    /**
     *  v0v1 = (-2, 0, 0)
     *  v0v3 = (0.5,-2,0.5)
     *  v0v1 ?? v0v3 = (0, 1, 4)
     */
    const {
      pillarGap,
      pillarSize,
      padding,
      trapezoidHeight,
      trapezoidDiffOfUpAndDown,
      weeks,
    } = this
    const step = pillarGap + pillarSize
    const p = padding + pillarSize / 2
    const upRightX = (weeks - 1) * step + p
    const v0 = new Vector3(upRightX, 0, 7 * step)
    const v1 = new Vector3(-p, 0, 7 * step)
    const v2 = new Vector3(
      -(p + trapezoidDiffOfUpAndDown),
      -trapezoidHeight,
      7 * step + trapezoidDiffOfUpAndDown
    )
    const v3 = new Vector3(
      upRightX + trapezoidDiffOfUpAndDown,
      -trapezoidHeight,
      7 * step + trapezoidDiffOfUpAndDown
    )
    const v4 = new Vector3(
      upRightX + trapezoidDiffOfUpAndDown,
      -trapezoidHeight,
      -(p + trapezoidDiffOfUpAndDown)
    )
    const v5 = new Vector3(upRightX, 0, -p)
    const v6 = new Vector3(-p, 0, -p)
    const v7 = new Vector3(
      -(p + trapezoidDiffOfUpAndDown),
      -trapezoidHeight,
      -(p + trapezoidDiffOfUpAndDown)
    )

    // prettier-ignore
    const vertexs = new Float32Array([
      ...v0.elements, ...v1.elements, ...v2.elements, ...v3.elements, // v0-v1-v2-v3 front
      ...v0.elements, ...v3.elements, ...v4.elements, ...v5.elements, // v0-v3-v4-v5 right
      ...v0.elements, ...v5.elements, ...v6.elements, ...v1.elements, // v0-v5-v6-v1 up
      ...v1.elements, ...v6.elements, ...v7.elements, ...v2.elements, // v1-v6-v7-v2 left
      ...v7.elements, ...v4.elements, ...v3.elements, ...v2.elements, // v7-v4-v3-v2 down
      ...v4.elements, ...v7.elements, ...v6.elements, ...v5.elements, // v4-v7-v6-v5 back
    ])

    // front
    const v0v1 = v1.sub(v0)
    const v0v3 = v3.sub(v0)
    const fNormal = v0v1.cross(v0v3).repeat(4)
    // right
    const v0v5 = v5.sub(v0)
    const rNormal = v0v3.cross(v0v5).repeat(4)
    // up
    const uNormal = v0v5.cross(v0v1).repeat(4)
    // left
    const v1v6 = v6.sub(v1)
    const v1v2 = v2.sub(v1)
    const lNormal = v1v6.cross(v1v2).repeat(4)
    // down
    const v3v4 = v4.sub(v3)
    const v3v2 = v2.sub(v3)
    const dNormal = v3v2.cross(v3v4).repeat(4)
    // back
    const v5v4 = v4.sub(v5)
    const v5v6 = v6.sub(v5)
    const bNormal = v5v4.cross(v5v6).repeat(4)
    const normals = new Float32Array([
      ...fNormal,
      ...rNormal,
      ...uNormal,
      ...lNormal,
      ...dNormal,
      ...bNormal,
    ])

    // prettier-ignore
    // const colors = new Float32Array([
    //   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,  // v0-v1-v2-v3 front
    //   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,  // v0-v3-v4-v5 right
    //   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,  // v0-v5-v6-v1 up
    //   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,  // v1-v6-v7-v2 left
    //   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,  // v7-v4-v3-v2 down
    //   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 0.0   // v4-v7-v6-v5 back
    // ])

    // prettier-ignore
    const colors = new Float32Array(generateColors(vertexs.length, ...this.objectsColor))

    this.drawHexahedron({
      vertexs,
      normals,
      colors,
      setModelMatrix,
    })
  }

  drawGrid() {
    const {gl} = this
    let points = new Float32Array([0, 0.0, 1.0, 0, 0.0, -1.0])
    if (!initArrayBuffer(gl, 'aPosition', points, gl.FLOAT, 3)) return
    for (let i = 0; i < this.lineNum; i++) {
      this.setModelMatrix((matrix) => {
        matrix
          .scale(1, 1, 2000)
          .translate(
            i * this.lineGap - ((this.lineNum - 1) * this.lineGap) / 2,
            -this.trapezoidHeight * 2,
            0
          )
        this.setNormalMatrix(matrix)
      })
      gl.drawArrays(gl.LINES, 0, 2)
    }
    points = new Float32Array([1.0, 0.0, 0.0, -1.0, 0.0, 0.0])
    if (!initArrayBuffer(gl, 'aPosition', points, gl.FLOAT, 3)) return
    for (let i = 0; i < this.lineNum; i++) {
      this.setModelMatrix((matrix) => {
        matrix
          .scale(2000, 1, 1)
          .translate(
            0,
            -this.trapezoidHeight * 2,
            i * this.lineGap - ((this.lineNum - 1) * this.lineGap) / 2
          )
        this.setNormalMatrix(matrix)
      })
      gl.drawArrays(gl.LINES, 0, 2)
    }
  }

  drawCubics(contributions) {
    const {gl} = this
    // prettier-ignore
    const vertexs = new Float32Array([
      1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0, // v0-v1-v2-v3 front
      1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0, // v0-v3-v4-v5 right
      1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
      -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0, // v1-v6-v7-v2 left
      -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0, // v7-v4-v3-v2 down
      1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0  // v4-v7-v6-v5 back
    ])

    // prettier-ignoreget
    const normals = new Float32Array([
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      1.0, // v0-v1-v2-v3 front
      1.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0, // v0-v3-v4-v5 right
      0.0,
      1.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      1.0,
      0.0, // v0-v5-v6-v1 up
      -1.0,
      0.0,
      0.0,
      -1.0,
      0.0,
      0.0,
      -1.0,
      0.0,
      0.0,
      -1.0,
      0.0,
      0.0, // v1-v6-v7-v2 left
      0.0,
      -1.0,
      0.0,
      0.0,
      -1.0,
      0.0,
      0.0,
      -1.0,
      0.0,
      0.0,
      -1.0,
      0.0, // v7-v4-v3-v2 down
      0.0,
      0.0,
      -1.0,
      0.0,
      0.0,
      -1.0,
      0.0,
      0.0,
      -1.0,
      0.0,
      0.0,
      -1.0, // v4-v7-v6-v5 back
    ])

    // prettier-ignore
    const colors = new Float32Array(generateColors(vertexs.length, ...this.objectsColor))

    if (!initArrayBuffer(gl, 'aPosition', vertexs, gl.FLOAT, 3)) return
    if (!initArrayBuffer(gl, 'aNormal', normals, gl.FLOAT, 3)) return
    if (!initArrayBuffer(gl, 'aColor', colors, gl.FLOAT, 3)) return

    // prettier-ignore
    var indices = new Uint8Array([
          0, 1, 2,   0, 2, 3,    // front
          4, 5, 6,   4, 6, 7,    // right
          8, 9,10,   8,10,11,    // up
          12,13,14,  12,14,15,    // left
          16,17,18,  16,18,19,    // down
          20,21,22,  20,22,23     // back
        ]);

    const n = initElementArrayBuffer(gl, indices)
    const uModelMatrix = getVarLocation(gl, 'uModelMatrix', 'Uniform')

    contributions.forEach(({week, days}) => {
      for (let i = 0, len = days.length; i < len; i++) {
        const modelMatrix = new Matrix4()
        const {count} = days[i]
        let x, z, h, l, w
        if (week < this.weeks - 1) {
          x = week * (this.pillarSize + this.pillarGap)
          z = (7 - len + i) * (this.pillarSize + this.pillarGap)
          h = count
          l = this.pillarSize / 2
          w = this.pillarSize / 2
        } else {
          x = week * (this.pillarSize + this.pillarGap)
          z = i * (this.pillarSize + this.pillarGap)
          h = count
          l = this.pillarSize / 2
          w = this.pillarSize / 2
        }
        // console.log('count, x, z, w, h, l')
        // console.log(count, x, z, w, h, l)
        modelMatrix
          .setTranslate(x, 0, z)
          .translate(
            -(((this.weeks - 1) * (this.pillarSize + this.pillarGap)) / 2),
            h,
            -(6 * (this.pillarSize + this.pillarGap)) / 2
          )
          .scale(w, h, l)
        this.setNormalMatrix(modelMatrix)
        gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix.elements)
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0)
      }
    })
  }

  drawCubic({x = 0, y = 0, z = 0, w = 1, h = 1, l = 1} = {}) {
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    // prettier-ignore
    const vertexs = new Float32Array([
      1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0, // v0-v1-v2-v3 front
      1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0, // v0-v3-v4-v5 right
      1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
      -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0, // v1-v6-v7-v2 left
      -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0, // v7-v4-v3-v2 down
      1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0  // v4-v7-v6-v5 back
    ])

    // prettier-ignore
    const normals = new Float32Array([
      0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
      1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
      0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
      -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
      0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
      0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
    ])

    // prettier-ignore
    const colors = new Float32Array([
      1.0, 1.0, 1.0,   1.0, 1.0, 1.0,   1.0, 1.0, 1.0,   1.0, 1.0, 1.0,  // v0-v1-v2-v3 front
      1.0, 1.0, 1.0,   1.0, 1.0, 1.0,   1.0, 1.0, 1.0,   1.0, 1.0, 1.0,  // v0-v3-v4-v5 right
      1.0, 1.0, 1.0,   1.0, 1.0, 1.0,   1.0, 1.0, 1.0,   1.0, 1.0, 1.0,  // v0-v5-v6-v1 up
      1.0, 1.0, 1.0,   1.0, 1.0, 1.0,   1.0, 1.0, 1.0,   1.0, 1.0, 1.0,  // v1-v6-v7-v2 left
      1.0, 1.0, 1.0,   1.0, 1.0, 1.0,   1.0, 1.0, 1.0,   1.0, 1.0, 1.0,  // v7-v4-v3-v2 down
      1.0, 1.0, 1.0,   1.0, 1.0, 1.0,   1.0, 1.0, 1.0,   1.0, 1.0, 1.0   // v4-v7-v6-v5 back
    ])
    this.drawHexahedron({
      vertexs,
      normals,
      colors,
      setModelMatrix: (modelMatrix) => {
        modelMatrix
          .setTranslate(x, 0, z)
          .translate(
            -(((this.weeks - 1) * (this.pillarSize + this.pillarGap)) / 2),
            h,
            -(6 * (this.pillarSize + this.pillarGap)) / 2
          )
          .scale(w, h, l)
      },
    })
  }

  setLight() {
    const {gl, isPointLight, light} = this
    const uAmbientLightColor = getVarLocation(
      gl,
      'uAmbientLightColor',
      'Uniform'
    )
    gl.uniform3f(uAmbientLightColor, 0.3, 0.3, 0.3)
    this.setUniformValue('uIsPointLight', this.isPointLight)

    if (isPointLight) {
      const uLightPosition = getVarLocation(gl, 'uLightPosition', 'Uniform')
      const uLightColor = getVarLocation(gl, 'uLightColor', 'Uniform')
      gl.uniform3f(uLightPosition, ...light.position)
      gl.uniform3f(uLightColor, ...light.color)
    } else {
      const uLightDirection = getVarLocation(gl, 'uLightDirection', 'Uniform')
      const uLightColor = getVarLocation(gl, 'uLightColor', 'Uniform')

      gl.uniform3f(
        uLightDirection,
        ...new Vector3(light.position).normalize().elements
      )
      gl.uniform3f(uLightColor, ...light.color)
    }
  }

  setModelMatrix(fn) {
    const {gl} = this
    const modelMatrix = new Matrix4()
    const uModelMatrix = getVarLocation(gl, 'uModelMatrix', 'Uniform')
    fn && fn(modelMatrix)
    gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix.elements)
  }

  setNormalMatrix(modelMatrix) {
    const {gl} = this
    const normalMatrix = new Matrix4()
    normalMatrix.setInverseOf(modelMatrix)
    normalMatrix.transpose()
    const uNormalMatrix = getVarLocation(gl, 'uNormalMatrix', 'Uniform')
    gl.uniformMatrix4fv(uNormalMatrix, false, normalMatrix.elements)
  }

  setProjMatrix() {
    const {gl} = this
    const projMatrix = new Matrix4()
    projMatrix.setPerspective(
      100,
      this.canvas.width / this.canvas.height,
      1,
      3000
    )
    const uProjMatrix = getVarLocation(gl, 'uProjMatrix', 'Uniform')
    gl.uniformMatrix4fv(uProjMatrix, false, projMatrix.elements)
  }

  setViewMatrix() {
    const {gl} = this
    const viewMatrix = new Matrix4()
    viewMatrix.setLookAt(...this.viewPosition, 0, 0, 0, 0, 1, 0)

    const angle = (Math.PI * this.rotateY) / 180
    const s = Math.sin(angle)
    const c = Math.cos(angle)

    // to keep the same with github skyline
    // rotate Y axis firstly then rotate the origin X axis (not the new X axis)
    viewMatrix.rotate(this.rotateY, 0, 1, 0).rotate(this.rotateX, c, 0, s)
    const uViewMatrix = getVarLocation(gl, 'uViewMatrix', 'Uniform')
    gl.uniformMatrix4fv(uViewMatrix, false, viewMatrix.elements)

    const matrix = new Matrix4()
    matrix.setInverseOf(viewMatrix)
    // matrix.transpose()

    const newV = matrix.multiplyVector3(new Vector3(this.viewPosition)).elements
    this.setUniformValue('uViewPosition', new Float32Array(newV), 'uniform3fv')
  }
}

function initDialog() {
  const modal = document.querySelector('.modal')
  const trigger = document.querySelector('#edit')
  const closeButton = document.querySelector('.close-button')
  const confirm = document.querySelector('#confirm')

  function toggleModal() {
    modal.classList.toggle('show-modal')
  }

  function windowOnClick(event) {
    if (event.target === modal) {
      toggleModal()
    }
  }

  trigger.addEventListener('click', toggleModal)
  closeButton.addEventListener('click', toggleModal)
  window.addEventListener('click', windowOnClick)
  confirm.addEventListener('click', toggleModal)
}

window.onload = () => {
  new GithubContriMap().run()
  initDialog()
}
