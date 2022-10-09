import fShader from './fShader'
import vShader from './vShader'

class GithubContriMap {
  constructor() {
    const canvas = document.getElementById('webgl')
    const h = document.documentElement.clientHeight
    const w = document.documentElement.clientWidth
    const min = Math.min(h, w)
    canvas.width = min
    canvas.height = min

    // Get the rendering context for WebGL
    const gl = getWebGLContext(canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
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

  run() {
    const {gl} = this
    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0)

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)

    // Set Matrix
    this.setProjMatrix()
    this.setViewMatrix()

    // Set Light
    this.setLight()

    // Draw a point
    this.drawCubic({x: 0})
    this.drawCubic({x: 10, h: 6})
    this.drawCubic({z: 10, h: 4})
    // this.drawCubic()
    // this.drawCubic()
    // this.drawCubic()
    // this.drawCubic()
  }

  drawCubic({x = 0, y = 0, z = 0, w = 1, h = 1, l = 1}) {
    const {gl} = this
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

    if (!this.initArrayBuffer('aPosition', vertexs, gl.FLOAT, 3)) return
    if (!this.initArrayBuffer('aNormal', normals, gl.FLOAT, 3)) return
    if (!this.initArrayBuffer('aColor', colors, gl.FLOAT, 3)) return

    // Indices of the vertices
    // prettier-ignore
    var indices = new Uint8Array([
      0, 1, 2,   0, 2, 3,    // front
      4, 5, 6,   4, 6, 7,    // right
      8, 9,10,   8,10,11,    // up
      12,13,14,  12,14,15,    // left
      16,17,18,  16,18,19,    // down
      20,21,22,  20,22,23     // back
    ]);

    this.setModelMatrix((modelMatrix) => {
      modelMatrix.setTranslate(x, y, z).translate(0, h, 0).scale(w, h, l)
    })

    const n = this.initElementArrayBuffer(indices)
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0)
  }

  setLight() {
    const uLightDirection = this.getVarLocation('uLightDirection', 'Uniform')
    const uLightColor = this.getVarLocation('uLightColor', 'Uniform')
    this.gl.uniform3f(uLightDirection, 0, 10, 10)
    this.gl.uniform3f(uLightColor, 0.5, 0.5, 0.5)
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
    fn(modelMatrix)
    gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix.elements)
  }

  setProjMatrix() {
    const {gl} = this
    const projMatrix = new Matrix4()
    projMatrix.setPerspective(45, 1, 1, 200)
    const uProjMatrix = this.getVarLocation('uProjMatrix', 'Uniform')
    gl.uniformMatrix4fv(uProjMatrix, false, projMatrix.elements)
  }

  setViewMatrix() {
    const {gl} = this
    const viewMatrix = new Matrix4()
    viewMatrix.setLookAt(50, 50, 50, 0, 0, 0, 0, 1, 0)
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
