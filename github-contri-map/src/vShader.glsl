attribute vec4 aPosition;
attribute vec4 aNormal;
attribute vec4 aColor;
uniform mediump int uDrawType; // 0: others, 1: text, 2: grid, 3: moon
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform vec3 uAmbientLightColor;
uniform mat4 uModelMatrix;
uniform mat4 uProjMatrix;
uniform mat4 uNormalMatrix;
uniform mat4 uViewMatrix;
varying vec4 vColor;
void main(){
  gl_Position = uProjMatrix * uViewMatrix  * uModelMatrix * aPosition;
  vec4 normal = aNormal;
  if (uDrawType == 1) {
    normal = uNormalMatrix * normal;
  }
  if (uDrawType <= 1) {
    gl_Position = uProjMatrix * uViewMatrix * uModelMatrix * aPosition;
    vec3 n = normalize(normal.xyz);
    float nDotL = max(dot(uLightDirection, n), 0.0);
    vec3 diffuse = uLightColor * aColor.xyz * nDotL;
    vec3 ambient = uAmbientLightColor * aColor.xyz;
    vColor = vec4(diffuse + ambient, 1);
  }
  if (uDrawType == 3) {
    gl_PointSize = 150.0;
  } 
}