function compileShader(gl, shaderCode, type) {
  var shader = gl.createShader(type);

  gl.shaderSource(shader, shaderCode);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log(`Error compiling ${type === gl.VERTEX_SHADER ? "vertex" : "fragment"} shader:`);
      console.log(gl.getShaderInfoLog(shader));
  }
  return shader;
}

//Builds the shader program.
function buildShaderProgram(gl, vert, frag) {

  var shaderProgram = gl.createProgram();

  gl.attachShader(shaderProgram, compileShader(gl, vert, gl.VERTEX_SHADER));

  gl.attachShader(shaderProgram, compileShader(gl, frag, gl.FRAGMENT_SHADER));

  gl.linkProgram(shaderProgram);

  return shaderProgram;
}


function setUniform(
gl,
program,
uniformName,
uniformType,
uniformValue
) {
gl["uniform" + uniformType](
  gl.getUniformLocation(program, uniformName),
  uniformValue
);
}

const FULLSCREEN_QUAD = new Float32Array([
  -1, 1, 1, 1, 1, -1, -1, 1, 1, -1, -1, -1,
]);
