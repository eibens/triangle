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

const tetra = (positions, colors) => {
  const rotate = (array, k) => [...array.slice(k), ...array.slice(0, k)]
  const mix = (A, B) => A.map((x, i) => (x + B[i]) / 2)
  const vertices = []
  for (let t = 0; t < 4; t++) {
    const [A, B, C, D] = rotate(positions, t)
    const small = [A, mix(A, B), mix(A, C), mix(A, D)]
    for (let f = 0; f < 4; f++) {
      const color = rotate(colors, f)[f]
      for (let p = 0; p < 3; p++) {
        const position = small[(f + p) % 4]
        vertices.push(...position)
        const animated = f === 1 && p === 2
        vertices.push(...(animated ? mix(B, C) : position))
        vertices.push(...color)
      }
    }
  }
  return {
    vertexData: new Float32Array(vertices),
    count: vertices.length / 10
  }
}

const colors = [
  [0.85, 0.11, 0.38],
  [0.56, 0.14, 0.67],
  [0.40, 0.23, 0.72],
  [0.25, 0.32, 0.71]
]

const positions = [
  [-1, -1, -1],
  [-1, 1, 1],
  [1, 1, -1],
  [1, -1, 1]
]

const mesh = tetra(positions, colors)

const init = gl => {
  const vertexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, mesh.vertexData, gl.STATIC_DRAW)

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

  const phi = state.time * tau
  const world = mat4.rotateY(mat4.create(), mat4.create(), phi)

  const eye = vec3.fromValues(0, 0, -5)
  const target = vec3.fromValues(0, 0, 0)
  const up = vec3.fromValues(0, 1, 0)
  const camera = mat4.targetTo(mat4.create(), eye, target, up)

  const fov = tau / 8
  const aspect = state.width / state.height
  const projection = mat4.perspective(mat4.create(), fov, aspect, 0.1, 10)

  const matrix = mat4.create()
  mat4.mul(matrix, world, matrix)
  mat4.mul(matrix, camera, matrix)
  mat4.mul(matrix, projection, matrix)
  return matrix
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
  gl.drawArrays(gl.TRIANGLES, 0, mesh.count)
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
