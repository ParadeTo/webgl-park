#ifdef GL_ES
precision mediump float;
#endif
varying vec4 vColor;
uniform bool uIsDrawLines;
void main(){
  if (uIsDrawLines) {
    gl_FragColor = vec4(76.0/255.0,103.0/255.0,156.0/255.0,1);
  } else {
    gl_FragColor = vColor;
  }
}