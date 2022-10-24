#ifdef GL_ES
precision highp float;
precision highp int;
#endif
uniform bool uIsPointLight;
uniform int uDrawType; // 0: others, 1: text, 2: grid, 3: moon
uniform vec3 uLightDirection;
uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uAmbientLightColor;
uniform vec3 uViewPosition;
varying vec4 vColor;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  if (uDrawType == 2) {
    gl_FragColor = vec4(76.0/255.0,103.0/255.0,156.0/255.0,1);
  } else if (uDrawType == 3) {
    float dis = distance(gl_PointCoord, vec2(0.5, 0.5));
    if (dis < 0.5) {
      float e = 0.6;
      float r = 0.5;
      vec4 start = vec4(uLightColor.rgb, 1);
      vec4 end = vec4(0.0, 0.0, 0.0, 1);
      gl_FragColor = mix(start, end, (dis / r - e) / (1.0 - e));
    } else {
      discard;
    }
  } else {
    vec3 normal = normalize(vNormal);
    vec3 lightDirection = uLightDirection;

    if (uIsPointLight) {
      lightDirection = normalize(uLightPosition - vPosition);
    }

    float nDotL = max(dot(lightDirection, normal), 0.0);
    vec3 diffuse = uLightColor * vColor.rgb * nDotL;

    vec3 ambient = uAmbientLightColor * vColor.rgb;

    vec3 viewDirection = normalize(uViewPosition - vPosition);
    vec3 halfVector = normalize(lightDirection + viewDirection);
    float specular = 0.0;
    if (nDotL > 0.0) {
      specular = pow(dot(normal, halfVector), 40.0);
    }

    gl_FragColor = vec4(diffuse + ambient + specular * uLightColor, vColor.a);
  }
}