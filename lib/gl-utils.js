export function getVarLocation(gl, name, type = 'Attrib') {
  const loc = gl[`get${type}Location`](gl.program, name)
  if (loc < 0 || loc === null) {
    throw `Failed to get the storage location of ${name}`
  }
  return loc
}

export function initArrayBuffer(gl, attribute, data, type, num) {
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
  var attr = getVarLocation(gl, attribute)
  gl.vertexAttribPointer(attr, num, type, false, 0, 0)
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(attr)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  return true
}

export function initElementArrayBuffer(gl, indices) {
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

export function generateColors(n, r, g, b, a) {
  const colors = []
  for (let i = 0; i < n; i++) {
    colors.push(r)
    colors.push(g)
    colors.push(b)
    if (a) colors.push(a)
  }
  return colors
}

export function hexToRGBArr(hex) {
  const r = parseInt('0x' + hex.slice(1, 3)) / 255
  const g = parseInt('0x' + hex.slice(3, 5)) / 255
  const b = parseInt('0x' + hex.slice(5, 7)) / 255
  return [r, g, b]
}
