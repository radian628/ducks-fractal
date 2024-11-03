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
        return await (await fetch(url)).text();
      }
    }
  };
}

let loadAsset = makeAssetLoader();

async function main() {
  const VERTEX_SHADER = await loadAsset("./shaders/vertex.vert");
  const FRAGMENT_SHADER = await loadAsset("./shaders/fragment.frag");

  let c = document.getElementById("canvas");
  let gl = c.getContext("webgl2");

  let screenshotButton = document.getElementById("screenshot-button");
  let screenshotNextFrame = false;
  screenshotButton.addEventListener("click", (e) => {
    screenshotNextFrame = true;
  });

  let corner1 = [-1, -1];
  let corner2 = [1, 1];

  let p = [0.734, -0.433];

  let mousePos = { x: 0, y: 0 };
  let smoothMousePos = { x: 0, y: 0 };
  let mouseButtons = {};
  document.addEventListener("mousemove", (e) => {
    mousePos = {
      x: e.clientX,
      y: e.clientY,
    };
    if (mouseButtons[0]) {
      let offsetX =
        (-e.movementX / c.width) * Math.abs(corner2[0] - corner1[0]);
      let offsetY =
        (e.movementY / c.height) * Math.abs(corner2[1] - corner1[1]);
      corner1[0] += offsetX;
      corner2[0] += offsetX;
      corner1[1] += offsetY;
      corner2[1] += offsetY;
    }
  });
  document.addEventListener("mousedown", (e) => {
    mouseButtons[e.button] = true;
  });
  document.addEventListener("mouseup", (e) => {
    mouseButtons[e.button] = false;
  });
  document.addEventListener("wheel", (e) => {
    let center = [(corner1[0] + corner2[0]) / 2, (corner1[1] + corner2[1]) / 2];
    if (e.deltaY < 0) {
      corner1[0] = center[0] + (corner1[0] - center[0]) * 0.9;
      corner1[1] = center[1] + (corner1[1] - center[1]) * 0.9;
      corner2[0] = center[0] + (corner2[0] - center[0]) * 0.9;
      corner2[1] = center[1] + (corner2[1] - center[1]) * 0.9;
    } else if (e.deltaY > 0) {
      corner1[0] = center[0] + (corner1[0] - center[0]) / 0.9;
      corner1[1] = center[1] + (corner1[1] - center[1]) / 0.9;
      corner2[0] = center[0] + (corner2[0] - center[0]) / 0.9;
      corner2[1] = center[1] + (corner2[1] - center[1]) / 0.9;
    }
  });

  window.addEventListener("resize", (e) => {
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    let aspect = window.innerHeight / window.innerWidth;
    let center = [(corner1[0] + corner2[0]) / 2, (corner1[1] + corner2[1]) / 2];
    let halfSpan = [
      (corner2[0] - corner1[0]) / 2,
      (corner2[1] - corner1[1]) / 2,
    ];
    corner1 = [center[0] - halfSpan[0], center[1] - halfSpan[0] * aspect];
    corner2 = [center[0] + halfSpan[0], center[1] + halfSpan[0] * aspect];

    gl.viewport(0, 0, c.width, c.height);
  });

  let texture = undefined;
  document.getElementById("image").addEventListener("change", (e) => {
    const file = e.currentTarget.files[0];

    if (!file) {
      texture = undefined;
      return;
    }

    if (texture) {
      gl.deleteTexture(texture);
    }

    texture = gl.createTexture(texture);

    const img = document.createElement("img");
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    };
    img.src = URL.createObjectURL(file);
  });

  window.dispatchEvent(new Event("resize"));

  let shaderProgram = buildShaderProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);

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
    if (mouseButtons[2]) {
      // p = [
      //   p[0] + Math.exp((Math.abs(mousePos.x / c.width - 0.5) * 6)) * 0.001,
      //   p[1] + Math.exp((Math.abs(mousePos.y / c.height - 0.5) * 6)) * 0.001
      // ];
      p = [mousePos.x / c.width, -mousePos.y / c.height];
    }
    //let p = [Math.cos(t / 100) * 0.13 + 0.5, Math.sin(t / 100) * 0.13 - 0.5]
    //     smoothMousePos = {
    //       x: smoothMousePos.x + (mousePos.x - smoothMousePos.x) * 0.06,
    //       y: smoothMousePos.y + (mousePos.y - smoothMousePos.y) * 0.06,
    //     };
    // let p = [
    //   smoothMousePos.x / c.width * 1.0 + -0.0,
    //   -smoothMousePos.y / c.height * 1.0 + -0.0
    // ];
    setUniform(gl, shaderProgram, "p", "2fv", p);
    setUniform(gl, shaderProgram, "aspect", "1f", c.height / c.width);
    setUniform(
      gl,
      shaderProgram,
      "sampleSideLength",
      "1f",
      screenshotNextFrame ? 8 : 1
    );
    setUniform(gl, shaderProgram, "brightness", "1f", 5);

    setUniform(gl, shaderProgram, "corner1", "2fv", /*p*/ corner1);
    setUniform(gl, shaderProgram, "corner2", "2fv", /*p*/ corner2);

    setUniform(gl, shaderProgram, "winSize", "2fv", /*p*/ [c.width, c.height]);

    setUniform(
      gl,
      shaderProgram,
      "iterations",
      "1i",
      parseInt(document.getElementById("iterations").value)
    );

    if (texture) {
      setUniform(gl, shaderProgram, "imageEnabled", "1i", 1);
      setUniform(gl, shaderProgram, "image", "1i", 0);
    } else {
      setUniform(gl, shaderProgram, "imageEnabled", "1i", 0);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (screenshotNextFrame) {
      c.toBlob((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.style.display = "none";
        link.download = "ducks-fractal.png";
        document.body.appendChild(link);
        link.href = url;
        link.click();
        window.URL.revokeObjectURL(url);
      });
      screenshotNextFrame = false;
    }
    requestAnimationFrame(loop);
  };
  loop();
}
main();
