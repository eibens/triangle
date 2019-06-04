const color = [233, 30, 99, 255].map(x => x / 255)

const vertexShader = `
attribute vec3 coordinates;

void main (void) {
  gl_Position = vec4 (coordinates, 1.0);
}
`

const fragmentShader = `
void main (void) {
  gl_FragColor = vec4 (${color.join(',')});
}
`
const vertices = [
  0.0, 1, 0.0,
  -0.5, -1, 0.0,
  0.5, -1, 0.0
]

const indices = [0, 1, 2]

const init = gl => {
  const vertexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

  const indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

  const compile = (gl, type, source) => {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    return shader
  }
  const program = gl.createProgram()
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexShader))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentShader))
  gl.linkProgram(program)
  gl.useProgram(program)

  const a_position = gl.getAttribLocation(program, 'coordinates')
  gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(a_position);

  gl.enable(gl.DEPTH_TEST)
}


const draw = (gl, now) => {
  const oldWidth = gl.canvas.width
  const newWidth = gl.canvas.clientWidth
  if (oldWidth !== newWidth) gl.canvas.width = newWidth

  const oldHeight = gl.canvas.height
  const newHeight = gl.canvas.clientHeight
  if (oldHeight !== newHeight) gl.canvas.height = newHeight

  gl.viewport(0, 0, newWidth, newHeight)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)
}


const main = () => {
  const gl = document.getElementById('canvas').getContext('webgl')
  if (!gl) {
    console.log('no webgl :(')
    return
  }
  init(gl)
  const loop = now => {
    draw(gl, now / 1000)
    requestAnimationFrame(loop)
  }
  loop()
}
main()
