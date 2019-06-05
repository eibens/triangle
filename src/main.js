import { mat4, vec3 } from 'gl-matrix'

const color = [233, 30, 99, 255].map(x => x / 255)

const vertexShader = `
attribute vec3 position;
attribute vec3 target;
attribute vec4 color;

uniform float time;
uniform mat4 matrix;

varying vec4 v_color;

void main (void) {
  v_color = color;
  gl_Position = matrix * vec4(mix(position, target, time), 1.0);
}
`

const fragmentShader = `
precision mediump float;

varying vec4 v_color;

void main (void) {
  gl_FragColor = v_color;
}
`

const indices = [0, 1, 2]
const vertices = [
  0.0, -1, 0, /**/ 0.0, 1.0, 0, /**/ ...color,
  -1, -1, 0,  /**/ -1, -1, 0,   /**/ 0, 0, 0, 0,
  1, -1, 0,   /**/ 1, -1, 0,    /**/ 0, 0, 0, 0
]

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

  const position = gl.getAttribLocation(program, 'position')
  gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 40, 0)
  gl.enableVertexAttribArray(position);

  const target = gl.getAttribLocation(program, 'target')
  gl.vertexAttribPointer(target, 3, gl.FLOAT, false, 40, 12)
  gl.enableVertexAttribArray(target)

  const color = gl.getAttribLocation(program, 'color')
  gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 40, 24)
  gl.enableVertexAttribArray(color);

  gl.enable(gl.DEPTH_TEST)

  return {
    time: gl.getUniformLocation(program, 'time'),
    matrix: gl.getUniformLocation(program, 'matrix')
  }
}

const state = {}
const process = () => {
  const action = location.hash.match(/^#?(.*)$/)[1]
  switch (action) {
    case '%CE%9B':
      state.reverse = false
      if (state.time == null) state.time = 1
      break
    default:
      state.reverse = true
      if (state.time == null) state.time = 0
  }
}
window.addEventListener('hashchange', process)
process()

const createMatrix = state => {
  const tau = 2 * Math.PI
  const fov = tau / 6
  const aspect = state.width / state.height
  return mat4.perspective(mat4.create(), fov, aspect, 0.1, 10)
}

const draw = (gl, effect, delta) => {
  const oldWidth = gl.canvas.width
  const newWidth = gl.canvas.clientWidth
  if (oldWidth !== newWidth) gl.canvas.width = newWidth

  const oldHeight = gl.canvas.height
  const newHeight = gl.canvas.clientHeight
  if (oldHeight !== newHeight) gl.canvas.height = newHeight

  state.width = gl.canvas.width
  state.height = gl.canvas.height

  state.time = state.reverse
    ? Math.max(0, state.time - delta)
    : Math.min(1, state.time + delta)
  gl.uniform1f(effect.time, state.time)
  gl.uniformMatrix4fv(effect.matrix, false, createMatrix(state))

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
  const effect = init(gl)
  let then = 0
  const loop = now => {
    now /= 1000
    draw(gl, effect, now - then)
    requestAnimationFrame(loop)
    then = now
  }
  loop(0)
}
main()
