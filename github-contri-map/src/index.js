import fShader from './fShader'
import vShader from './vShader'

class GithubContriMap {
  constructor() {
    const h = document.documentElement.clientHeight
    const w = document.documentElement.clientWidth
    this.canvas = document.getElementById('webgl')
    this.canvas.width = w
    this.canvas.height = h

    this.pillarSize = 4
    this.pillarGap = 0
    this.padding = 2
    this.trapezoidDiffOfUpAndDown = 3
    this.trapezoidHeight = 10
    this.weeks = 53

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

    this.viewMatrix = new Matrix4()
    this.rotateY = 0
    this.rotateX = 0
    this.contributions = null
  }

  async getData() {
    try {
      const rsp = await fetch('/api/paradeto/2021')
      const {contributions} = await rsp.json()
      this.contributions = contributions
    } catch (error) {}
  }

  async run() {
    await this.getData()
    this.setProjMatrix()
    this.setViewMatrix()
    this.setLight()
    this.draw()
    this.addCursorEvent()
    // this.gl.clearColor(0.0, 0.0, 0.0, 1.0)
    // this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    // this.gl.enable(this.gl.DEPTH_TEST)
    // this.drawCubic()
  }

  addCursorEvent() {
    const tick = () => {
      // this.rotateY += 1
      this.rotateX += 1
      this.setViewMatrix()
      this.draw()
      requestAnimationFrame(tick)
    }
    // tick()

    const anglePerPixel = 1
    let startX,
      startY = 0
    let isMouseDown = false
    this.canvas.addEventListener('mousedown', (e) => {
      isMouseDown = true
      startX = e.clientX
      startY = e.clientY
    })

    this.canvas.addEventListener('mousemove', (e) => {
      if (isMouseDown) {
        // console.log(e.clientX - startX)
        // console.log(e.clientY - startY)
        // const {clientX, clientY} = e
        this.rotateY = e.clientX - startX
        this.rotateX = e.clientY - startY
        this.setViewMatrix()
        // this.setViewMatrix(e.clientX - startX, -e.clientY + startY)
        // startX = clientX
        // startY = clientY
        this.draw()
      }
    })

    this.canvas.addEventListener('mouseup', (e) => {
      isMouseDown = false
    })
  }

  async draw() {
    const {gl, contributions} = this

    try {
      if (contributions) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.enable(gl.DEPTH_TEST)
        // contributions.forEach(({week, days}) => {
        //   for (let i = 0, len = days.length; i < len; i++) {
        //     const {count} = days[i]
        //     if (week < this.weeks - 1)
        //       this.drawCubic({
        //         x: week * (this.pillarSize + this.pillarGap),
        //         z: (7 - len + i) * (this.pillarSize + this.pillarGap),
        //         h: count,
        //         l: this.pillarSize / 2,
        //         w: this.pillarSize / 2,
        //       })
        //     else
        //       this.drawCubic({
        //         x: week * (this.pillarSize + this.pillarGap),
        //         z: i * (this.pillarSize + this.pillarGap),
        //         h: count,
        //         l: this.pillarSize / 2,
        //         w: this.pillarSize / 2,
        //       })
        //   }
        // })
        this.drawTrapezoid((matrix) => {
          matrix.translate(
            -(((this.weeks - 1) * (this.pillarSize + this.pillarGap)) / 2),
            0,
            -(6 * (this.pillarSize + this.pillarGap)) / 2
          )
        })
      }
    } catch (error) {
      console.log(error)
    }
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
    this.viewMatrix.setLookAt(0, 0, 150, 0, 0, 0, 0, 1, 0)
    this.viewMatrix.rotate(this.rotateY, 0, 1, 0).rotate(this.rotateX, 1, 0, 0)
    const uViewMatrix = this.getVarLocation('uViewMatrix', 'Uniform')
    gl.uniformMatrix4fv(uViewMatrix, false, this.viewMatrix.elements)
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
