import fShader from './fShader'
import vShader from './vShader'

class GithubContriMap {
  constructor() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl')
    canvas.width = document.documentElement.clientWidth
    canvas.height = document.documentElement.clientHeight

    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas)
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

    // Draw a point
    gl.drawArrays(gl.POINTS, 0, 1)
  }

  drawCubic(x, y, l, w, h) {
    const {gl} = this
    const vertexBuffer = gl.createBuffer()
  }

  initArrayBuffer(gl, attribute, data, type, num) {
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
    var aAttribute = gl.getAttribLocation(gl.program, attribute)
    if (aAttribute < 0) {
      console.log('Failed to get the storage location of ' + attribute)
      return false
    }
    gl.vertexAttribPointer(aAttribute, num, type, false, 0, 0)
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(aAttribute)
    return true
  }
}

window.onload = new GithubContriMap().run()
