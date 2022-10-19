function calcNormal(p0, p1, p2) {
  // v0: a vector from p1 to p0, v1; a vector from p1 to p2
  var v0 = new Float32Array(3)
  var v1 = new Float32Array(3)
  for (var i = 0; i < 3; i++) {
    v0[i] = p0[i] - p1[i]
    v1[i] = p2[i] - p1[i]
  }

  // The cross product of v0 and v1
  var c = new Float32Array(3)
  c[0] = v0[1] * v1[2] - v0[2] * v1[1]
  c[1] = v0[2] * v1[0] - v0[0] * v1[2]
  c[2] = v0[0] * v1[1] - v0[1] * v1[0]

  // Normalize the result
  var v = new Vector3(c)
  v.normalize()
  return v.elements
}

// Get the length of word
function getWordLength(str, start) {
  var n = 0
  for (var i = start, len = str.length; i < len; i++) {
    var c = str.charAt(i)
    if (c == '\t' || c == ' ' || c == '(' || c == ')' || c == '"') break
  }
  return i - start
}

class StringParser {
  constructor(str) {
    this.init(str)
  }

  init(str) {
    this.str = str
    this.index = 0
  }

  skipDelimiters() {
    for (var i = this.index, len = this.str.length; i < len; i++) {
      var c = this.str.charAt(i)
      // Skip TAB, Space, '(', ')
      if (c == '\t' || c == ' ' || c == '(' || c == ')' || c == '"') continue
      break
    }
    this.index = i
  }

  skipToNextWord() {
    this.skipDelimiters()
    var n = getWordLength(this.str, this.index)
    this.index += n + 1
  }

  getWord() {
    this.skipDelimiters()
    var n = getWordLength(this.str, this.index)
    if (n == 0) return null
    var word = this.str.substr(this.index, n)
    this.index += n + 1

    return word
  }

  getInt() {
    return parseInt(this.getWord())
  }

  getFloat() {
    return parseFloat(this.getWord())
  }
}

class OBJObject {
  constructor(name) {
    this.name = name
    this.faces = new Array(0)
    this.numIndices = 0
  }

  addFace(face) {
    this.faces.push(face)
    this.numIndices += face.numIndices
  }
}

class Face {
  constructor(materialName = '') {
    this.materialName = materialName
    this.vIndices = new Array(0)
    this.nIndices = new Array(0)
  }
}

class Vertex {
  constructor(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
  }
}

class Normal {
  constructor(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
  }
}

export default class ObjDoc {
  constructor() {
    this.objectMap = {}
    this.vertices = new Array(0) // Initialize the property for Vertex
    this.normals = new Array(0) // Initialize the property for Normal
  }

  parse(fileString, scale, reverse) {
    const lines = fileString.split('\n')
    lines.push(null)
    let index = 0
    let currentObject = null

    let line
    const sp = new StringParser()
    while ((line = lines[index++]) != null) {
      sp.init(line) // init StringParser
      const command = sp.getWord() // Get command
      if (command == null) continue // check null command

      switch (command) {
        case '#':
          continue // Skip comments
        case 'o': // Read Object name
          const {object, name} = this.parseObjectName(sp)
          this.objectMap[name] = object
          currentObject = object
          continue // Go to the next line
        case 'v': // Read vertex
          var vertex = this.parseVertex(sp, scale)
          this.vertices.push(vertex)
          continue // Go to the next line
        case 'vn': // Read normal
          var normal = this.parseNormal(sp)
          this.normals.push(normal)
          continue // Go to the next line
        case 'f': // Read face
          var face = this.parseFace(sp, this.vertices, reverse)
          currentObject.addFace(face)
          continue // Go to the next line
      }
    }
    return true
  }

  getTextDrawingInfo(text, objDoc) {
    const charArr = text.split('')
    const vertices = []
    const normals = []
    const indices = []
    const colors = []
    const charParams = []

    let indexIndices = 0
    let charNum = 0
    for (let i = 0; i < charArr.length; i++) {
      const object = objDoc.objectMap[charArr[i]]
      const prevCharParams = i > 0 ? charParams[i - 1] : {offset: 0}
      const char = {offset: charNum + prevCharParams.offset}
      charNum = 0
      for (let j = 0; j < object.faces.length; j++) {
        const face = object.faces[j]
        const faceNormal = face.normal
        for (let k = 0; k < face.vIndices.length; k++) {
          indices[indexIndices] = indexIndices
          const vIdx = face.vIndices[k]
          // Copy vertex
          const vertex = this.vertices[vIdx]
          vertices[indexIndices * 3 + 0] = vertex.x
          vertices[indexIndices * 3 + 1] = vertex.y
          vertices[indexIndices * 3 + 2] = vertex.z
          // Copy color
          // use the same color
          colors[indexIndices * 3 + 0] = 1.0
          colors[indexIndices * 3 + 1] = 1.0
          colors[indexIndices * 3 + 2] = 1.0
          // Copy normal
          var nIdx = face.nIndices[k]
          if (nIdx >= 0) {
            var normal = this.normals[nIdx]
            normals[indexIndices * 3 + 0] = normal.x
            normals[indexIndices * 3 + 1] = normal.y
            normals[indexIndices * 3 + 2] = normal.z
          } else {
            normals[indexIndices * 3 + 0] = faceNormal.x
            normals[indexIndices * 3 + 1] = faceNormal.y
            normals[indexIndices * 3 + 2] = faceNormal.z
          }
          indexIndices++
          charNum++
        }
      }
      char.n = charNum
      charParams.push(char)
    }

    return {vertices, normals, indices, colors, charParams}
  }

  parseObjectName(sp) {
    const name = sp.getWord()
    return {object: new OBJObject(name), name}
  }

  parseVertex(sp, scale) {
    var x = sp.getFloat() * scale
    var y = sp.getFloat() * scale
    var z = sp.getFloat() * scale
    return new Vertex(x, y, z)
  }

  parseNormal(sp) {
    var x = sp.getFloat()
    var y = sp.getFloat()
    var z = sp.getFloat()
    return new Normal(x, y, z)
  }

  parseFace(sp, vertices, reverse) {
    var face = new Face()
    // get indices
    for (;;) {
      var word = sp.getWord()
      if (word == null) break
      var subWords = word.split('/')
      if (subWords.length >= 1) {
        var vi = parseInt(subWords[0]) - 1
        face.vIndices.push(vi)
      }
      if (subWords.length >= 3) {
        var ni = parseInt(subWords[2]) - 1
        face.nIndices.push(ni)
      } else {
        face.nIndices.push(-1)
      }
    }

    // calc normal
    var v0 = [
      vertices[face.vIndices[0]].x,
      vertices[face.vIndices[0]].y,
      vertices[face.vIndices[0]].z,
    ]
    var v1 = [
      vertices[face.vIndices[1]].x,
      vertices[face.vIndices[1]].y,
      vertices[face.vIndices[1]].z,
    ]
    var v2 = [
      vertices[face.vIndices[2]].x,
      vertices[face.vIndices[2]].y,
      vertices[face.vIndices[2]].z,
    ]

    var normal = calcNormal(v0, v1, v2)
    if (normal == null) {
      if (face.vIndices.length >= 4) {
        var v3 = [
          vertices[face.vIndices[3]].x,
          vertices[face.vIndices[3]].y,
          vertices[face.vIndices[3]].z,
        ]
        normal = calcNormal(v1, v2, v3)
      }
      if (normal == null) {
        normal = [0.0, 1.0, 0.0]
      }
    }
    if (reverse) {
      normal[0] = -normal[0]
      normal[1] = -normal[1]
      normal[2] = -normal[2]
    }
    face.normal = new Normal(normal[0], normal[1], normal[2])

    // Devide to triangles if face contains over 3 points.
    if (face.vIndices.length > 3) {
      var n = face.vIndices.length - 2
      var newVIndices = new Array(n * 3)
      var newNIndices = new Array(n * 3)
      for (var i = 0; i < n; i++) {
        newVIndices[i * 3 + 0] = face.vIndices[0]
        newVIndices[i * 3 + 1] = face.vIndices[i + 1]
        newVIndices[i * 3 + 2] = face.vIndices[i + 2]
        newNIndices[i * 3 + 0] = face.nIndices[0]
        newNIndices[i * 3 + 1] = face.nIndices[i + 1]
        newNIndices[i * 3 + 2] = face.nIndices[i + 2]
      }
      face.vIndices = newVIndices
      face.nIndices = newNIndices
    }
    face.numIndices = face.vIndices.length

    return face
  }
}
