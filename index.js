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
  const FRAGMENT_SHADER = await loadAsset("./shaders/raymarcher.frag");
  
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

  let tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
              1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              pixel);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  let img = new Image();
  document.body.appendChild(img);
  img.onload = () => {
    console.log("img loaded");
      let c2 = document.createElement("canvas");
      c2.width = 256; c2.height = 256;
      c2.getContext("2d").drawImage(img, 0, 0, 256, 256);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, c2);
  };
  img.crossOrigin = "anonymous";
  img.src = "https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/how-to-keep-ducks-call-ducks-1615457181.jpg?resize=640:*";
  
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