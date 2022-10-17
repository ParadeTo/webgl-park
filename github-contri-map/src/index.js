import fShader from './fShader'
import ObjDoc from './ObjDoc'
import vShader from './vShader'

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
    this.trapezoidDiffOfUpAndDown = 3
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
    this.setLight()
    this.addEventListener()

    this.getParams()
    await this.getData()
    this.charObjDoc = await this.getParsedObjDoc('/resources/char.obj')
    this.draw()
  }

  async getParsedObjDoc(filename) {
    try {
      const cnt = await (await fetch(filename)).text()
      const objDoc = new ObjDoc()
      const parseResult = objDoc.parse(cnt, this.textScale)
      if (!parseResult) throw new Error('parse obj file wrong.')
      return objDoc
    } catch (error) {
      console.log(error)
    }
  }

  setUniformValue(key, value) {
    const uVar = this.getVarLocation(key, 'Uniform')
    this.gl.uniform1i(uVar, value)
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
      this.charObjDoc.getDrawingInfo(name + year, this.charObjDoc)
    if (
      !this.initArrayBuffer(
        'aPosition',
        new Float32Array(vertices),
        gl.FLOAT,
        3
      )
    )
      return
    if (
      !this.initArrayBuffer('aNormal', new Float32Array(normals), gl.FLOAT, 3)
    )
      return
    if (!this.initArrayBuffer('aColor', new Float32Array(colors), gl.FLOAT, 3))
      return
    this.initElementArrayBuffer(new Uint16Array(indices))

    this.setUniformValue('uIsDrawText', true)
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
    const {gl} = this
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)

    // draw grid
    this.setUniformValue('uIsDrawLines', true)
    this.setUniformValue('uIsDrawText', false)
    this.drawGrid()

    // draw cubics
    // if (!this.contributions) return
    this.setUniformValue('uIsDrawLines', false)

    this.drawTrapezoid((matrix) => {
      matrix.translate(
        -(((this.weeks - 1) * (this.pillarSize + this.pillarGap)) / 2),
        0,
        -(6 * (this.pillarSize + this.pillarGap)) / 2
      )
    })
    this.drawCubics(this.contributions)

    this.drawText(this.name.toUpperCase(), this.year)
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
    this.canvas.addEventListener('mousedown', (e) => {
      isMouseDown = true
      lastX = e.clientX
      lastY = e.clientY
    })

    this.canvas.addEventListener('mousemove', (e) => {
      if (isMouseDown) {
        const dx = factor * (e.clientX - lastX)
        const dy = factor * (e.clientY - lastY)
        this.rotateY += dx
        this.rotateX = Math.max(Math.min(this.rotateX + dy, 90), 0)
        this.setViewMatrix()
        this.draw()

        // decelerate(dy, dx, 0.1)
      }
      lastX = e.clientX
      lastY = e.clientY
    })

    this.canvas.addEventListener('mouseup', (e) => {
      isMouseDown = false
    })

    document.querySelector('#create').addEventListener('click', async () => {
      this.getParams()
      await this.getData()
      this.draw()
    })
  }

  drawHexahedron({vertexs, normals, colors, setModelMatrix}) {
    const {gl} = this
    if (!this.initArrayBuffer('aPosition', vertexs, gl.FLOAT, 3)) return
    if (!this.initArrayBuffer('aNormal', normals, gl.FLOAT, 3)) return
    if (!this.initArrayBuffer('aColor', colors, gl.FLOAT, 3)) return

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
    const n = this.initElementArrayBuffer(indices)
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
     *  v0v1 × v0v3 = (0, 1, 4)
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
      setModelMatrix,
    })
  }

  drawGrid() {
    const {gl} = this
    let points = new Float32Array([0, 0.0, 1.0, 0, 0.0, -1.0])
    if (!this.initArrayBuffer('aPosition', points, gl.FLOAT, 3)) return
    for (let i = 0; i < this.lineNum; i++) {
      this.setModelMatrix((matrix) => {
        matrix
          .scale(1, 1, 2000)
          .translate(
            i * this.lineGap - ((this.lineNum - 1) * this.lineGap) / 2,
            -this.trapezoidHeight * 2,
            0
          )
      })
      gl.drawArrays(gl.LINES, 0, 2)
    }
    points = new Float32Array([1.0, 0.0, 0.0, -1.0, 0.0, 0.0])
    if (!this.initArrayBuffer('aPosition', points, gl.FLOAT, 3)) return
    for (let i = 0; i < this.lineNum; i++) {
      this.setModelMatrix((matrix) => {
        matrix
          .scale(2000, 1, 1)
          .translate(
            0,
            -this.trapezoidHeight * 2,
            i * this.lineGap - ((this.lineNum - 1) * this.lineGap) / 2
          )
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

    if (!this.initArrayBuffer('aPosition', vertexs, gl.FLOAT, 3)) return
    if (!this.initArrayBuffer('aNormal', normals, gl.FLOAT, 3)) return
    if (!this.initArrayBuffer('aColor', colors, gl.FLOAT, 3)) return

    // prettier-ignore
    var indices = new Uint8Array([
          0, 1, 2,   0, 2, 3,    // front
          4, 5, 6,   4, 6, 7,    // right
          8, 9,10,   8,10,11,    // up
          12,13,14,  12,14,15,    // left
          16,17,18,  16,18,19,    // down
          20,21,22,  20,22,23     // back
        ]);

    const n = this.initElementArrayBuffer(indices)
    const uModelMatrix = this.getVarLocation('uModelMatrix', 'Uniform')

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
    const uLightDirection = this.getVarLocation('uLightDirection', 'Uniform')
    const uLightColor = this.getVarLocation('uLightColor', 'Uniform')
    const uAmbientLightColor = this.getVarLocation(
      'uAmbientLightColor',
      'Uniform'
    )
    this.gl.uniform3f(
      uLightDirection,
      ...new Vector3([0, 2, 10]).normalize().elements
    )
    this.gl.uniform3f(uLightColor, 1, 1, 1)
    this.gl.uniform3f(uAmbientLightColor, 0.3, 0.3, 0.3)
  }

  getVarLocation(name, type = 'Attrib') {
    const loc = this.gl[`get${type}Location`](this.gl.program, name)
    if (loc < 0 || loc === null) {
      throw `Failed to get the storage location of ${name}`
    }
    return loc
  }

  setModelMatrix(fn) {
    const {gl} = this
    const modelMatrix = new Matrix4()
    const uModelMatrix = this.getVarLocation('uModelMatrix', 'Uniform')
    fn && fn(modelMatrix)
    gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix.elements)
  }

  setNormalMatrix(modelMatrix) {
    const {gl} = this
    const normalMatrix = new Matrix4()
    normalMatrix.setInverseOf(modelMatrix)
    normalMatrix.transpose()
    const uNormalMatrix = this.getVarLocation('uNormalMatrix', 'Uniform')
    gl.uniformMatrix4fv(uNormalMatrix, false, normalMatrix.elements)
  }

  setProjMatrix() {
    const {gl} = this
    const projMatrix = new Matrix4()
    projMatrix.setPerspective(
      100,
      this.canvas.width / this.canvas.height,
      1,
      500
    )
    const uProjMatrix = this.getVarLocation('uProjMatrix', 'Uniform')
    gl.uniformMatrix4fv(uProjMatrix, false, projMatrix.elements)
  }

  setViewMatrix(rotateX = 0, rotateY = 0) {
    const {gl} = this
    const viewMatrix = new Matrix4()
    viewMatrix.setLookAt(0, 0, 95, 0, 0, 0, 0, 1, 0)

    const angle = (Math.PI * this.rotateY) / 180
    const s = Math.sin(angle)
    const c = Math.cos(angle)

    // to keep the same with github skyline
    // rotate Y axis firstly then rotate the origin X axis (not the new X axis)
    viewMatrix.rotate(this.rotateY, 0, 1, 0).rotate(this.rotateX, c, 0, s)
    const uViewMatrix = this.getVarLocation('uViewMatrix', 'Uniform')
    gl.uniformMatrix4fv(uViewMatrix, false, viewMatrix.elements)
  }

  initElementArrayBuffer(indices) {
    const {gl} = this

    // Write the indices to the buffer object
    var indexBuffer = gl.createBuffer()
    if (!indexBuffer) {
      console.log('Failed to create the buffer object')
      return false
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)
    return indices.length
  }

  initArrayBuffer(attribute, data, type, num) {
    const {gl} = this

    // Create a buffer object
    var buffer = gl.createBuffer()
    if (!buffer) {
      console.log('Failed to create the buffer object')
      return false
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    // Assign the buffer object to the attribute variable
    var attr = this.getVarLocation(attribute)
    gl.vertexAttribPointer(attr, num, type, false, 0, 0)
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(attr)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    return true
  }
}

window.onload = () => new GithubContriMap().run()
