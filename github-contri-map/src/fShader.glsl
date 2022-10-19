#ifdef GL_ES
precision mediump float;
#endif
varying vec4 vColor;
uniform int uDrawType; // 0: others, 1: text, 2: grid, 3: moon
void main(){
  if (uDrawType == 2) {
    gl_FragColor = vec4(76.0/255.0,103.0/255.0,156.0/255.0,1);
  } else if (uDrawType == 3) {
    float dis = distance(gl_PointCoord, vec2(0.5, 0.5));
    if (dis < 0.5) {
      gl_FragColor = vec4(255.0,103.0/255.0,156.0/255.0,1);
      float e = 0.65;
      float r = 0.5;
      vec4 start = vec4(1.0, 1.0, 1.0, 1);
      vec4 end = vec4(0.0, 0.0, 0.0, 1);
      gl_FragColor = mix(start, end, (dis / r - e) / (1.0 - e));
    } else {
      discard;
    }
  } else {
    gl_FragColor = vColor;
  }
}