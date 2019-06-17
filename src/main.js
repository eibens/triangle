import { mat4, vec3 } from 'gl-matrix'
import { transition } from './lib/time'

const LEVELS = 6
const TAU = 2 * Math.PI

const clamp = (min, max, x) => Math.min(max, Math.max(min, x))

const vertexShader = `
attribute vec3 position;
attribute vec3 positionTarget;
attribute vec4 color;
attribute vec4 colorTarget;

uniform float time;
uniform mat4 matrix;

varying vec4 v_color;

void main (void) {
  v_color = mix(color, colorTarget, time);
  gl_Position = matrix * vec4(mix(position, positionTarget, time), 1.0);
}
`

const fragmentShader = `
precision mediump float;

varying vec4 v_color;

void main (void) {
  gl_FragColor = v_color;
}
`

const createMesh = levels => {
  const positions = [
    [1, 1, -1],
    [1, -1, 1],
    [-1, -1, -1],
    [-1, 1, 1]
  ]
  const colors = [
    [0.85, 0.11, 0.38, 1.0],
    [0.56, 0.14, 0.67, 1.0],
    [0.40, 0.23, 0.72, 1.0],
    [0.25, 0.32, 0.71, 1.0]
  ]

  const neg = ([x, y, z]) => [-x, -y, -z]
  const add = ([ax, ay, az], [bx, by, bz]) => [ax + bx, ay + by, az + bz]
  const mul = (s, [x, y, z]) => [s * x, s * y, s * z]
  const mix = (a, b) => mul(0.5, add(a, b))
  const range = n => new Array(n).fill(0).map((x, i) => i)
  const rotate = (array, k) => [...array.slice(k), ...array.slice(0, k)]
  const mirror = (x, p1, p2) => add(neg(x), add(p1, p2))

  const tetrahedron = (positions, colors, triangle = false) => {
    const [A, B, C, D] = positions
    const AA = [A, A]
    const BB = [B, B]
    const CC = [C, C]
    const D1 = mirror(A, B, C)
    const D2 = triangle ? mirror(B, C, A) : D
    const D3 = triangle ? mirror(C, A, B) : D
    return [
      [AA, BB, CC],
      [BB, CC, [D1, D]],
      [CC, [D2, D], AA],
      [[D3, D], AA, BB]
    ].map((face, f) => face.map(([position, positionTarget]) => {
        const color = !triangle && f === 1
          ? colors[(f + 3) % 4]
          : colors[f]
        return [position, positionTarget, color, colors[f]]
      }))
  }

  const subdivision = positions => range(4)
    .map(t => rotate(positions, t))
    .map(([A, B, C, D]) => [A, mix(A, B), mix(A, C), mix(A, D)])

  const fractal = (level, positions, colors) => level > 0
    ? subdivision(positions).map((child, i) => fractal(level - 1, child, rotate(colors, i)))
    : tetrahedron(positions, colors)

  const flatten = array => Array.isArray(array)
    ? array.reduce((a, x) => [...a, ...flatten(x)], [])
    : [array]

  const count = level => 12 * Math.pow(4, level)
  const meshes = range(levels)
    .map(level => ({
      offset: range(level).reduce((a, x) => a + count(x), 0),
      count: count(level)
    }))

  const vertices = flatten(range(levels)
    .map(level => level === 0
      ? tetrahedron(positions, colors, true)
      : fractal(level, positions, colors)))

  return { vertices, meshes }
}

const init = gl => {
  const mesh = createMesh(LEVELS)

  const vertexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW)

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
  gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 56, 0)
  gl.enableVertexAttribArray(position)

  const targetPosition = gl.getAttribLocation(program, 'positionTarget')
  gl.vertexAttribPointer(targetPosition, 3, gl.FLOAT, false, 56, 12)
  gl.enableVertexAttribArray(targetPosition)

  const color = gl.getAttribLocation(program, 'color')
  gl.vertexAttribPointer(color, 4, gl.FLOAT, true, 56, 24)
  gl.enableVertexAttribArray(color)

  const targetColor = gl.getAttribLocation(program, 'colorTarget')
  gl.vertexAttribPointer(targetColor, 4, gl.FLOAT, true, 56, 40)
  gl.enableVertexAttribArray(targetColor)

  gl.enable(gl.DEPTH_TEST)

  return {
    meshes: mesh.meshes,
    time: gl.getUniformLocation(program, 'time'),
    matrix: gl.getUniformLocation(program, 'matrix')
  }
}

const createMatrix = (width, height, phi, theta) => {
  const world = mat4.create()
  mat4.rotateX(world, world, theta)
  mat4.rotateY(world, world, phi)

  const eye = vec3.fromValues(0, 0, -5)
  const target = vec3.fromValues(0, 0, 0)
  const up = vec3.fromValues(0, 1, 0)
  const camera = mat4.targetTo(mat4.create(), eye, target, up)

  const fov = TAU / 8
  const aspect = width / height
  const projection = mat4.perspective(mat4.create(), fov, aspect, 0.1, 10)

  const matrix = mat4.create()
  mat4.mul(matrix, world, matrix)
  mat4.mul(matrix, camera, matrix)
  mat4.mul(matrix, projection, matrix)
  return matrix
}

const draw = (gl, effect, state) => {
  const oldWidth = gl.canvas.width
  const newWidth = gl.canvas.clientWidth
  if (oldWidth !== newWidth) gl.canvas.width = newWidth

  const oldHeight = gl.canvas.height
  const newHeight = gl.canvas.clientHeight
  if (oldHeight !== newHeight) gl.canvas.height = newHeight

  const time = state.param < LEVELS ? state.param % 1 : 1
  gl.uniform1f(effect.time, time)
  gl.uniformMatrix4fv(effect.matrix, false, createMatrix(
    gl.canvas.width,
    gl.canvas.height,
    state.phi,
    state.theta
  ))

  gl.viewport(0, 0, newWidth, newHeight)
  gl.clear(gl.COLOR_BUFFER_BIT)

  const level = clamp(0, LEVELS - 1, Math.floor(state.param))
  const { offset, count } = effect.meshes[level]
  gl.drawArrays(gl.TRIANGLES, offset, count)
}

(window => {
  const document = window.document

  const getLevelFromHash = () => parseInt(location.hash.match(/^#?(.*)$/)[1] || 0)
  const updateTitle = level => document.title = level
    ? 'tetrahedron level ' + level
    : 'triangle'
  const updateButtonState = () => {
    Array.from(document.querySelectorAll('a'))
      .forEach(button => button.getAttribute('href') === location.hash
        ? button.classList.add('active')
        : button.classList.remove('active'))
  }

  const initialLevel = getLevelFromHash()
  const timeline = transition(initialLevel)
  updateTitle(initialLevel)
  updateButtonState()

  window.addEventListener('hashchange', () => {
    const level = getLevelFromHash()
    const speed = parseFloat(document.getElementById('speed').value)
    updateTitle(level)
    timeline.update(level, speed)
    updateButtonState()
  })

  window.addEventListener('keydown', event => {
    const level = parseInt(event.key)
    if (isNaN(level)) return
    if (LEVELS < level) return
    window.location = '#' + level
  })

  let phi = TAU / 8
  let theta = 0
  document.addEventListener('mousemove', event => {
    if (event.buttons !== 1) return
    phi += (TAU + event.movementX / 100) % TAU,
    theta = clamp(-TAU / 4, TAU / 4, theta - event.movementY / 100)
  })

  const gl = document.getElementById('canvas').getContext('webgl')
  if (!gl) {
    return
  }
  const effect = init(gl)
  const loop = () => {
    draw(gl, effect, {
      phi,
      theta,
      param: timeline.sample()
    })
    requestAnimationFrame(loop)
  }
  loop()
})(window)
