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

  	void main() {
  	  gl_Position = vec4(position, 1.0);
  	}
  `;
  const squareFragmentShaderSource = `
  	precision highp float;

  	uniform vec2 resolution;
  	uniform float time;

    //Taken from @patriciogv http://patriciogonzalezvivo.com

    float random (in vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233)))*43758.5453123);
    }

    //noise function from Inigo Quilez - iq2013 https://www.shadertoy.com/view/lsf3WH
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(random(i+vec2(0.0,0.0)),
                     random(i+vec2(1.0,0.0)), u.x),
                 mix(random(i+vec2(0.0,1.0)),
                     random(i+vec2(1.0,1.0)), u.x), u.y);
    }

    mat2 rotate2d(float angle){
      return mat2(cos(angle),-sin(angle),
                  sin(angle),cos(angle));
    }

    float lines(in vec2 pos, float b){
      float scale = 10.0;
      pos *= scale;
      return smoothstep(0.0,
                        0.5+b*0.5,
                        abs((sin(pos.x*3.1415)+b*2.0))*0.5);
    }

    float swirls(in vec2 pos, float b) {
      
    }

    //float lines(in vec2, float a) {
    //  
    //}

  	void main() {
      vec2 st = gl_FragCoord.xy/resolution.xy;
      st.y *= resolution.y/resolution.x;
      vec2 pos = st.yx*vec2(10.,3.);
      float pattern = pos.x;
      //pos = rotate2d(noise(pos+time))*pos;
      pattern = lines(pos,.5);
      gl_FragColor = vec4(vec3(pattern),1.0);
      //gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
  	}
  `;

  function createSquare() {
    //two triangles for a quad
    const position_data = [-1.0,-1.0, 0.0,  //top left
                           -1.0, 1.0, 0.0,  //bot left
                            1.0,-1.0, 0.0,  //bot right
                           -1.0, 1.0, 0.0,  //bot left
                            1.0, 1.0, 0.0,  //bot right
                            1.0,-1.0, 0.0]; //top right
    const square = {
      getPositionData() {
	      return position_data;
      },
      numVertices() {
        return position_data.length/3;
      }
    };

    return square;
  };
 
  const date = new Date();
  const canvas = document.getElementById('goopcanvas');
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
  
  //Create buffes
  const squarePositionBuffer = gl.createBuffer();

  //Set uniforms
  gl.uniform2f(squareResolutionUniformLocation, canvas.width, canvas.height);
 
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

    //Set square uniforms
    gl.uniform1f(squareTimeUniformLocation, performance.now() / 4096);

    //Draw square
    gl.drawArrays(gl.TRIANGLES /* TRIANGLE_STRIP */, 0, square.numVertices());

    requestAnimationFrame(render);
  }
  
  render();
}
squareCanvas();
