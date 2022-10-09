attribute vec4 aPosition;
uniform mat4 uModelMatrix;
void main(){
  // gl_Position = uModelMatrix * aPosition;
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
  gl_PointSize = 200.0;
}