const draw = (gl, now) => {
  console.log(now)
  gl.clearColor(...[233, 30, 99, 255].map(x => x / 255))
  gl.clear(gl.COLOR_BUFFER_BIT)
}

const resize = gl => {
  const oldWidth = gl.canvas.width
  const newWidth = gl.canvas.clientWidth
  if (oldWidth !== newWidth) gl.canvas.width = newWidth

  const oldHeight = gl.canvas.height
  const newHeight = gl.canvas.clientHeight
  if (oldHeight !== newHeight) gl.canvas.height = newHeight

  gl.viewport(0, 0, newWidth, newHeight)
}

const main = () => {
  const gl = document.getElementById('canvas').getContext('webgl')
  if (!gl) {
    console.log('no webgl :(')
    return
  }
  const loop = now => {
    now /= 1000
    resize(gl)
    draw(gl, now)
    requestAnimationFrame(loop)
  }
  loop()
}
main()
