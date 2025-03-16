function icoEarthCanvas() {
  const mat4 = glMatrix.mat4;
  const vec3 = glMatrix.vec3;

  const X = 0.525731112119133606;
  const Z = 0.850650808352039932;
  const PI = 3.141592653589792;
  const UP_vec3 = vec3.fromValues(0.0, 2.0*Z, 2.0*X);
  const UP = {x: 0.0, y: 2.0*Z/vec3.length(UP_vec3), z: 2.0*X/vec3.length(UP_vec3)};
  //const UP_vec3 = vec3.fromValues(0.0, Math.sqrt(0.5), Math.sqrt(0.5));
  //const UP = {x: 0.0, y: Math.sqrt(0.5), z: Math.sqrt(0.5)};
  const CAMERA_POS = [0.0, 0.0, -1.0*Math.sqrt(200.0)];

  const isPowerOf2 = function(n) {
    return (n > 0 && (n & (n - 1)) === 0);
  }
  
  const earthVertexShaderSource = `
  	attribute vec3 position;
    attribute vec2 texcoord;

  	uniform mat4 mvp;

    varying vec2 uv;
  
  	void main() {
      uv = texcoord;
  	  gl_Position = mvp * vec4(normalize(position), 1.0);
  	}
  `;
  const earthFragmentShaderSource = `
  	precision mediump float;

  	uniform vec2 resolution;
  	uniform float time;
    uniform sampler2D texture;

  	varying vec2 uv;
  
  	void main() {
  	  gl_FragColor = texture2D(texture, uv);
      gl_FragColor *= 2.52;
  	}
  `;

  const extend = function(V, r) {
    const i = Math.sqrt(Math.pow(V.x, 2) + Math.pow(V.y, 2) + Math.pow(V.z, 2))/r;
    return { x: V.x*i, y: V.y*i, z: V.z*i };
  }

  const createIcoearth = function (COLORS) {
    const R = Z;
  
    const positions = [
      -X, 0.0, Z,  //0
      X, 0.0, Z,   //1
      -X, 0.0, -Z, //2
      X, 0.0, -Z,  //3
      0.0, Z, X,   //4
      0.0, Z, -X,  //5
      0.0, -Z, X,  //6
      0.0, -Z, -X, //7
      Z, X, 0.0,   //8
      -Z, X, 0.0,  //9
      Z, -X, 0.0,  //10
      -Z, -X, 0.0  //11
    ];
  
    const indices = [
      0,4,1,  
      0,9,4,
      9,5,4,
      4,5,8,
      4,8,1,
      8,10,1,
      8,3,10,
      5,3,8,
      5,2,3,
      2,7,3,
      7,10,3,
      7,6,10,
      7,11,6,
      11,0,6,
      0,1,6,
      6,1,10,
      9,0,11,
      9,11,2,
      9,2,5,
      7,2,11
    ];

    let uvs = [
      116.0/256.0, 40.0/256.0,  140.0/256.0, 79.0/256.0,  163.0/256.0, 41.0/256.0, //0,4,1
      116.0/256.0, 40.0/256.0,  92.0/256.0, 79.0/256.0,  140.0/256.0, 79.0/256.0, //0,9,4
      117.0/256.0, 120.0/256.0,  163.0/256.0, 119.0/256.0,  140.0/256.0, 79.0/256.0, //9,5,4
      140.0/256.0, 79.0/256.0,  163.0/256.0, 119.0/256.0,  185.0/256.0, 80.0/256.0, //4,5,8
      141.0/256.0, 79.0/256.0,  185.0/256.0, 80.0/256.0,  163.0/256.0, 41.0/256.0, //4,8,1
      185.0/256.0, 80.0/256.0,  208.0/256.0, 40.0/256.0,  163.0/256.0, 40.0/256.0, //8,10,1
      185.0/256.0, 80.0/256.0,  231.0/256.0, 79.0/256.0,  207.0/256.0, 40.0/256.0, //8,3,10
      162.0/256.0, 119.0/256.0,  208.0/256.0, 121.0/256.0,  185.0/256.0, 80.0/256.0, //5,3,8
      162.0/256.0, 119.0/256.0,  185.0/256.0, 159.0/256.0,  208.0/256.0, 121.0/256.0, //5,2,3
      47.0/256.0, 79.0/256.0,  23.0/256.0, 41.0/256.0,  1.0/256.0, 79.0/256.0, //2,7,3
      231.0/256.0, 0.0/256.0,  208.0/256.0, 39.0/256.0,  254.0/256.0, 39.0/256.0, //7,10,3
      231.0/256.0, 0.0/256.0, 187.0/256.0, 0.0/256.0,  208.0/256.0, 39.0/256.0, //7,6,10
      47.0/256.0, 0.0/256.0,  70.0/256.0, 40.0/256.0,  92.00/256.0, 0.0/256.0, //7,11,6
      71.0/256.0, 42.0/256.0,  116.0/256.0, 42.0/256.0,  91.00/256.0, 0.0/256.0, //11,0,6
      116.0/256.0, 42.0/256.0,  162.0/256.0, 42.0/256.0,  139.0/256.0, 0.0/256.0, //0,1,6
      187./256.0, 0.0/256.0,  163.0/256.0, 42.0/256.0,  208.0/256.0, 42.0/256.0, //6,1,10
      93.0/256.0, 79.0/256.0,  116.0/256.0, 41.0/256.0,  70.0/256.0, 41.0/256.0, //9,0,11
      93.0/256.0, 79.0/256.0,  70.0/256.0, 40.0/256.0,  47.0/256.0, 80.0/256.0, //9,11,2
      93.0/256.0, 79.0/256.0,  46.0/256.0, 79.0/256.0,  69.0/256.0, 119.0/256.0, //9,2,5
      23.0/256.0, 42.0/256.0,  46.0/256.0, 79.0/256.0,  70.0/256.0, 42.0/256.0  //7,2,11
    ];
 
    let vertices = indices.flatMap((n) => [positions[3*n], positions[(3*n)+1], positions[(3*n)+2]]);
    let colors = indices.flatMap((n) => [COLORS[3*n], COLORS[(3*n)+1], COLORS[(3*n)+2]]);

    const icoearth = {
      getVertices() {
	      return vertices;
      },
      getColors() {
	      return colors;
      },
      getUvs() {
        return uvs;
      },
      numVertices() {
        return vertices.length/3;
      },
      subdivide() {
	      const subdivideVertices = function(EXTEND, face_vertices) {                  //      A
          let C = { x: face_vertices[0], y: face_vertices[1], z: face_vertices[2] }; //      /\
          let B = { x: face_vertices[3], y: face_vertices[4], z: face_vertices[5] }; //     /  \
          let A = { x: face_vertices[6], y: face_vertices[7], z: face_vertices[8] }; //    / 1  \
	        let D = { x: (A.x+C.x)/2.0,    y: (A.y+C.y)/2.0,    z: (A.z+C.z)/2.0 }; //    D /------\ E
	        let E = { x: (A.x+B.x)/2.0,    y: (A.y+B.y)/2.0,    z: (A.z+B.z)/2.0 }; //     / \ 4  / \
	        let F = { x: (B.x+C.x)/2.0,    y: (B.y+C.y)/2.0,    z: (B.z+C.z)/2.0 }; //    / 3 \  / 2 \
	        let new_vertices = [E, A, D,  // 1                                           /_____\/_____\
	                            B, E, F,  // 2                                          C       F      B
	                            F, D, C,  // 3
	                            E, D, F]; // 4
		      return new_vertices.map((n) => EXTEND ? extend(n, R) : n).flatMap((n) => [n.x, n.y, n.z]);
	      };

	      const subdivideColors = function(EXTEND, face_vertices) {
          let C = { x: face_vertices[0], y: face_vertices[1], z: face_vertices[2] };
          let B = { x: face_vertices[3], y: face_vertices[4], z: face_vertices[5] };
          let A = { x: face_vertices[6], y: face_vertices[7], z: face_vertices[8] };
	        let D = { x: (A.x+C.x)/2.0,    y: (A.y+C.y)/2.0,    z: (A.z+C.z)/2.0 };
	        let E = { x: (A.x+B.x)/2.0,    y: (A.y+B.y)/2.0,    z: (A.z+B.z)/2.0 };
	        let F = { x: (B.x+C.x)/2.0,    y: (B.y+C.y)/2.0,    z: (B.z+C.z)/2.0 };
	        let new_vertices = [E, A, D,
	                            B, E, F,
	                            F, D, C,
	                            E, D, F];
		      return new_vertices.map((n) => EXTEND ? extend(n, R) : n).flatMap((n) => [n.x, n.y, n.z]);
	      };

	      const subdivideUvs = function(EXTEND, face_vertices) { 
          let C = { x: face_vertices[0], y: face_vertices[1] };
          let B = { x: face_vertices[2], y: face_vertices[3] };
          let A = { x: face_vertices[4], y: face_vertices[5] };
	        let D = { x: (A.x+C.x)/2.0,    y: (A.y+C.y)/2.0 };
	        let E = { x: (A.x+B.x)/2.0,    y: (A.y+B.y)/2.0 };
	        let F = { x: (B.x+C.x)/2.0,    y: (B.y+C.y)/2.0 };
	        let new_vertices = [E, A, D,
	                            B, E, F,
	                            F, D, C,
	                            E, D, F]
		      return new_vertices.flatMap((n) => [n.x, n.y]);
	      };

        vertices = Array.from(new Array(vertices.length), (x, i) => i)
	                 .filter((n) => n % 9 == 0)
	                 .flatMap((n) => subdivideVertices(true,
			  	                                           [vertices[n],   //vertex 1
                                                      vertices[n+1],
                                                      vertices[n+2],
                                                      vertices[n+3], //vertex 2
                                                      vertices[n+4],
                                                      vertices[n+5],
                                                      vertices[n+6], //vertex 3
                                                      vertices[n+7],
                                                      vertices[n+8]]));
	      colors = Array.from(new Array(colors.length), (x, i) => i)
	               .filter((n) => n % 9 == 0)
	               .flatMap((n) => subdivideColors(false,
			                                           [colors[n],   //red
                                                  colors[n+1],
                                                  colors[n+2],
                                                  colors[n+3], //green
                                                  colors[n+4],
                                                  colors[n+5],
                                                  colors[n+6], //blue
                                                  colors[n+7],
                                                  colors[n+8]]));
	      uvs = Array.from(new Array(uvs.length), (x, i) => i)
	               .filter((n) => n % 6 == 0)
	               .flatMap((n) => subdivideUvs(false,
			                                           [uvs[n],   //vertex 1
                                                  uvs[n+1],
                                                  uvs[n+2], //vertex 2
                                                  uvs[n+3],
                                                  uvs[n+4], //vertex 3
                                                  uvs[n+5]]));
      }
    };

    return icoearth;
  };
  
  const date = new Date();
  const canvas = document.getElementById('icoearthcanvas');
  const gl = canvas.getContext('webgl');
  
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.cullFace(gl.BACK);

  //create perspective matrices
  const earth_projection = mat4.create();
  const earth_modelview = mat4.create();
  const earth_mvp = mat4.create();
  const earth_mit = mat4.create();
  const earth_minv = mat4.create();

  /*************************************** EARTH ***************************************/

  //Create vertex shader
  const earthVertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(earthVertexShader, earthVertexShaderSource);
  gl.compileShader(earthVertexShader);
  
  //Create fragment shader
  const earthFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(earthFragmentShader, earthFragmentShaderSource);
  gl.compileShader(earthFragmentShader);
  
  //Create shader program
  const earthShaderProgram = gl.createProgram();
  gl.attachShader(earthShaderProgram, earthVertexShader);
  gl.attachShader(earthShaderProgram, earthFragmentShader);
  gl.linkProgram(earthShaderProgram);
  gl.useProgram(earthShaderProgram);

  //Get attribute and uniform locations
  const earthPositionAttributeLocation = gl.getAttribLocation(earthShaderProgram, 'position');
  const earthTexcoordAttributeLocation = gl.getAttribLocation(earthShaderProgram, 'texcoord');
  const earthResolutionUniformLocation = gl.getUniformLocation(earthShaderProgram, 'resolution');
  const earthTimeUniformLocation = gl.getUniformLocation(earthShaderProgram, 'time');
  const earthMvpUniformLocation = gl.getUniformLocation(earthShaderProgram, 'mvp');
  
  //Create buffes
  const earthPositionBuffer = gl.createBuffer();
  const earthTextureBuffer = gl.createBuffer();

  //Set uniforms
  gl.uniform2f(earthResolutionUniformLocation, canvas.width, canvas.height);
 
  //Create texture
  const earthTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, earthTexture);

  //Fill the texture with placeholder value
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));

  //Asynchronously load an image
  var earthImage = new Image();
  earthImage.src = "./bluemarbleicosahedron.png";
  earthImage.addEventListener('load', function() {
    //Copy image to the texture
    gl.bindTexture(gl.TEXTURE_2D, earthTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, earthImage);

    //Check if image is a power of 2 in both dimensions
    if (isPowerOf2(earthImage.width) && isPowerOf2(earthImage.height)) {
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
    const subs = document.getElementById('icospheresubdivisions').value;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0, 0, 0, 0.01);

    let earth = createIcoearth([]);
    for (let i=0; i < subs; i++) {
      earth.subdivide();
    }

    mat4.perspective(earth_projection, 1.0/2.0, 4.0/3.0, -0.5, 0.5);
  
    //mat4.lookAt(modelview, [-4*UP.x,-4*UP.y,-4*UP.z], [0,0,0], [UP.x,UP.y,UP.z]);
    mat4.lookAt(earth_modelview, CAMERA_POS, [0,0,0], [UP.x,UP.y,UP.z]);
    mat4.rotate(earth_modelview, earth_modelview, (performance.now()/-4096), [UP.x, UP.y, UP.z]);
    //mat4.rotateZ(earth_modelview, earth_modelview, 3.14);
  
    mat4.multiply(earth_mvp, earth_projection, earth_modelview);

    //Bind earth program
    gl.useProgram(earthShaderProgram);

    //Set earth positions
    gl.bindBuffer(gl.ARRAY_BUFFER, earthPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(earth.getVertices()), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(earthPositionAttributeLocation);
    gl.vertexAttribPointer(earthPositionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    //Set earth uvs
    gl.bindBuffer(gl.ARRAY_BUFFER, earthTextureBuffer);
    gl.enableVertexAttribArray(earthTexcoordAttributeLocation);
    gl.vertexAttribPointer(earthTexcoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(earth.getUvs()), gl.STATIC_DRAW);

    //Set earth uniforms
    gl.uniform1f(earthTimeUniformLocation, performance.now() / 4096);
    gl.uniformMatrix4fv(earthMvpUniformLocation, false, earth_mvp);

    //Draw earth
    gl.drawArrays(gl.TRIANGLES /* TRIANGLE_STRIP */, 0, earth.numVertices());

    requestAnimationFrame(render);
  }
  
  render();
}
icoEarthCanvas();
