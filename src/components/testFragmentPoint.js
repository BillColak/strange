const testFragmentPoint= `
#define GLSLIFY 1
uniform vec3 uColor;

void main() {
  vec3 color = vec3(uColor);
  gl_FragColor = vec4(color, 1.0);
}
`
export default testFragmentPoint


