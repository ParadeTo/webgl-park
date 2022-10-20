attribute vec4 aPosition;
attribute vec4 aNormal;
attribute vec4 aColor;
uniform int uDrawType; // 0: others, 1: text, 2: grid, 3: moon

uniform mat4 uModelMatrix;
uniform mat4 uProjMatrix;
uniform mat4 uNormalMatrix;
uniform mat4 uViewMatrix;
varying vec4 vColor;
varying vec3 vNormal;
varying vec3 vPosition;
void main(){
  gl_Position = uProjMatrix * uViewMatrix  * uModelMatrix * aPosition;

  if (uDrawType == 3) {
    gl_PointSize = 150.0;
    return;
  }

  vPosition = vec3(uModelMatrix * aPosition);
  vNormal = normalize(uNormalMatrix * aNormal).xyz;
  vColor = aColor;
}