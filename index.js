function ext(url) {
  return url.match(/\.\w+$/g)[0];
}



function makeAssetLoader() {
  let assets = {};
  return async function (url) {
    let asset = assets[url];
    if (asset) {
      return url;
    } else {
      let extension = ext(url);
      if ([".vert", ".frag"].includes(extension)) {
        return (await (await fetch(url)).text());
      }
    }
  }
}

let loadAsset = makeAssetLoader();


let mousePos = { x: 0, y: 0 };
let smoothMousePos = { x: 0, y: 0 };
document.addEventListener("mousemove", e => {
	mousePos = {
		x: e.clientX,
		y: e.clientY
	};
});


async function main() {
  const VERTEX_SHADER = await loadAsset("./shaders/vertex.vert");
  const FRAGMENT_SHADER = await loadAsset("./shaders/fragment.frag");
  
  let c = document.getElementById("canvas");
  let gl = c.getContext("webgl2");

  window.addEventListener("resize", e => {
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    gl.viewport(0, 0, c.width, c.height);
  });
  window.dispatchEvent(new Event("resize"));

  let shaderProgram = buildShaderProgram(
      gl,
      VERTEX_SHADER,
      FRAGMENT_SHADER
  );

  let fullscreenQuadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenQuadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, FULLSCREEN_QUAD, gl.STATIC_DRAW);

  gl.useProgram(shaderProgram);

  let vertexPositionAttribLocation = gl.getAttribLocation(
      shaderProgram,
      "vertexPosition"
  );


  gl.enableVertexAttribArray(vertexPositionAttribLocation);
  gl.vertexAttribPointer(
      vertexPositionAttribLocation,
      2,
      gl.FLOAT,
      false,
      8,
      0
  );

let t = 0;
  loop = () => {
    t++;
    //let p = [Math.cos(t / 100) * 0.13 + 0.5, Math.sin(t / 100) * 0.13 - 0.5]
        smoothMousePos = {
          x: smoothMousePos.x + (mousePos.x - smoothMousePos.x) * 0.06,
          y: smoothMousePos.y + (mousePos.y - smoothMousePos.y) * 0.06,
        };
    let p = [
      smoothMousePos.x / c.width * 1.0 + -0.0,
      -smoothMousePos.y / c.height * 1.0 + -0.0
    ];
    setUniform(gl, shaderProgram, "p", "2fv", p);
    setUniform(gl, shaderProgram, "aspect", "1f", c.height / c.width);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(loop);
  }
  loop();
}
main();