async function squareCanvas() {
  const mat4 = glMatrix.mat4;
  const vec3 = glMatrix.vec3;

  const PI = 3.141592653589792;
  const UP_vec3 = vec3.fromValues(0.0, 1.0, 0.0);
  const UP = {x: 0.0, y: 1.0, z: 0.0};
  const CAMERA_POS = [0.0, 0.0, -5.0];
  const GUMMYBEAR_CAMERA_POS = CAMERA_POS;
  const GUMMYBEAR_LIGHT_POS = [-15.0, 15.0, -15.0];

  const isPowerOf2 = function(n) {
    return (n > 0 && (n & (n - 1)) === 0);
  }

  const squareVertexShaderSource = `
  	attribute vec3 position;
    attribute vec2 texcoord;

    varying vec2 uv;

  	void main() {
      uv = texcoord;
  	  gl_Position = vec4(position, 1.0);
  	}
  `;
  const squareFragmentShaderSource = `
  	precision highp float;

    varying vec2 uv;

  	uniform vec2 resolution;
  	uniform float time;
    uniform sampler2D texture;

    vec2 sinWave(vec2 p, float t) {
      p.x=(0.55*p.x)+0.5;
      p.y=(-0.55*p.y)+0.5;
      float x = sin(2.*p.y+5.*p.x+6.28*t)*0.05;
      float y = sin(3.*p.y+10.*p.x+6.28*t)*0.05;
      return vec2(p.x+x, p.y+y);
    }

  	void main() {
      float t = time/-3.0;
      vec2 st = uv.xy*-3.;
      st.y += t;
      vec4 texcolor = texture2D(texture, sinWave(st, t));
      gl_FragColor = texcolor;
      //if (gl_FragColor.rgb == vec3(1., 1., 1.)) {
      //  gl_FragColor = vec4(sin(st.x*3.14), sin(st.y*6.28), sin(st.x+3.14), 1.0);
      //}
  	}
  `;

  function createSquare() {
    const positions = [-1.0, 1.0, 0.0,  //top left
                       -1.0,-1.0, 0.0,  //bot left
                        1.0,-1.0, 0.0,  //bot right
                        1.0, 1.0, 0.0]  //top right
    const texcoords = [ 0.0, -1.0,  //top left
                        0.0,  0.0,  //bot left
                        1.0,  0.0,  //bot right
                        1.0, -1.0]; //top right
    const position_indices = [0, 1, 2,
                              2, 3, 0];
    const uv_indices = position_indices;
    const position_data = position_indices.flatMap((n) => [positions[3*n], positions[3*n+1], positions[3*n+2]]);
    const uv_data = uv_indices.flatMap((n) => [texcoords[2*n], texcoords[2*n+1]]);
    const square = {
      getPositionData() {
	      return position_data;
      },
      getUvData() {
	      return uv_data;
      },
      numVertices() {
        return position_data.length/3;
      }
    };

    return square;
  };
 
  const date = new Date();
  const canvas = document.getElementById('angelscanvas');
  const gl = canvas.getContext('webgl', { alpha: true});
  
  //gl.enable(gl.CULL_FACE);
  //gl.cullFace(gl.BACK);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  //Create vertex shader
  const squareVertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(squareVertexShader, squareVertexShaderSource);
  gl.compileShader(squareVertexShader);
  
  //Create fragment shader
  const squareFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(squareFragmentShader, squareFragmentShaderSource);
  gl.compileShader(squareFragmentShader);
  
  //Create shader program
  const squareShaderProgram = gl.createProgram();
  gl.attachShader(squareShaderProgram, squareVertexShader);
  gl.attachShader(squareShaderProgram, squareFragmentShader);
  gl.linkProgram(squareShaderProgram);
  gl.useProgram(squareShaderProgram);

  //Get attribute and uniform locations
  const squarePositionAttributeLocation = gl.getAttribLocation(squareShaderProgram, 'position');
  const squareResolutionUniformLocation = gl.getUniformLocation(squareShaderProgram, 'resolution');
  const squareTimeUniformLocation = gl.getUniformLocation(squareShaderProgram, 'time');
  const squareTexcoordAttributeLocation = gl.getAttribLocation(squareShaderProgram, 'texcoord');
  
  //Create buffes
  const squarePositionBuffer = gl.createBuffer();
  const squareTextureBuffer = gl.createBuffer();

  //Set uniforms
  gl.uniform2f(squareResolutionUniformLocation, canvas.width, canvas.height);

  //Create texture
  gl.bindBuffer(gl.ARRAY_BUFFER, squareTextureBuffer);
  gl.enableVertexAttribArray(squareTexcoordAttributeLocation);
  gl.vertexAttribPointer(squareTexcoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
  const squareTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, squareTexture);

  //Fill the texture with placeholder value
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

  //Asynchronously load an image
  let angelImage = new Image();
  angelImage.src = "./angels2.png";
  angelImage.addEventListener('load', function () {
    //Copy image to the texture
    gl.bindTexture(gl.TEXTURE_2D, squareTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, angelImage);

    //Check if image is a power of 2 in both dimensions
    if (isPowerOf2(angelImage.width) && isPowerOf2(angelImage.height)) {
      //Yes, generate mips
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      //No, turn off mips and set wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  });
 
  // **********************************************************************************************
  // RENDER LOOP
  // **********************************************************************************************

  function render() {
    let square = createSquare();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0, 0, 0, 0.01);

    //Bind square program
    gl.useProgram(squareShaderProgram);

    //Set square positions
    gl.bindBuffer(gl.ARRAY_BUFFER, squarePositionBuffer);
    gl.enableVertexAttribArray(squarePositionAttributeLocation);
    gl.vertexAttribPointer(squarePositionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(square.getPositionData()), gl.STATIC_DRAW);

    //Set square positions
    gl.bindBuffer(gl.ARRAY_BUFFER, squareTextureBuffer);
    gl.enableVertexAttribArray(squareTexcoordAttributeLocation);
    gl.vertexAttribPointer(squareTexcoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(square.getUvData()), gl.STATIC_DRAW);

    //Set square uniforms
    gl.uniform1f(squareTimeUniformLocation, performance.now() / 4096);

    //Draw square
    gl.drawArrays(gl.TRIANGLES /* TRIANGLE_STRIP */, 0, square.numVertices());

    requestAnimationFrame(render);
  }
  
  render();
}
squareCanvas();
