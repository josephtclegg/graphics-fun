function icoSphereCanvas() {
  const mat4 = glMatrix.mat4;
  const vec3 = glMatrix.vec3;

  const X = 0.525731112119133606;
  const Z = 0.850650808352039932;
  const PI = 3.141592653589792;
  const UP_vec3 = vec3.fromValues(0.0, 2.0*Z, 2.0*X);
  const UP = {x: 0.0, y: 2.0*Z/vec3.length(UP_vec3), z: 2.0*X/vec3.length(UP_vec3)};
  //const CAMERA_POS = [1.5*UP.x, 1.5*UP.y, (1.5*UP.z)-1.6];
  //const UP_vec3 = vec3.fromValues(0.0, Math.sqrt(0.5), Math.sqrt(0.5));
  //const UP = {x: 0.0, y: Math.sqrt(0.5), z: Math.sqrt(0.5)};
  const CAMERA_POS = [0.0, 0.0, -1.0*Math.sqrt(200.0)];

  const isPowerOf2 = function(n) {
    return (n > 0 && (n & (n - 1)) === 0);
  }
  
  const sphereVertexShaderSource = `
  	attribute vec3 position;
    attribute vec2 texcoord;

  	uniform mat4 mvp;

    varying vec2 uv;
  
  	void main() {
      uv = texcoord;
  	  gl_Position = mvp * vec4(normalize(position), 1.0);
  	}
  `;
  const sphereFragmentShaderSource = `
  	precision highp float;
  	uniform vec2 resolution;
  	uniform float time;
    uniform sampler2D texture;

  	varying vec2 uv;
  
  	void main() {
  	  gl_FragColor = texture2D(texture, uv);
  	}
  `;

  const extend = function(V, r) {
    const i = Math.sqrt(Math.pow(V.x, 2) + Math.pow(V.y, 2) + Math.pow(V.z, 2))/r;
    return { x: V.x*i, y: V.y*i, z: V.z*i };
  }

  const createIcosphere = function (COLORS) {
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

    let dymaxion_uvs = [
      693.0/1024.0, 267.0/449.0,  539.0/1024.0, 267.0/449.0,  616.0/1024.0, 399.0/449.0, //0,4,1
      693.0/1024.0, 267.0/449.0,  615.0/1024.0, 133.0/449.0,  539.0/1024.0, 266.0/449.0, //0,9,4
      615.0/1024.0, 133.0/449.0,  461.0/1024.0, 133.0/449.0,  539.0/1024.0, 266.0/449.0, //9,5,4
      539.0/1024.0, 266.0/449.0,  461.0/1024.0, 133.0/449.0,  385.0/1024.0, 366.0/449.0, //4,5,8
      539.0/1024.0, 266.0/449.0,  461.0/1024.0, 399.0/449.0,  616.0/1024.0, 399.0/449.0, //4,8,1
      385.0/1024.0, 266.0/449.0,  230.0/1024.0, 266.0/449.0,  307.0/1024.0, 399.0/449.0, //8,10,1
      385.0/1024.0, 266.0/449.0,  308.0/1024.0, 133.0/449.0,  230.0/1024.0, 266.0/449.0, //8,3,10
      461.0/1024.0, 133.0/449.0,  308.0/1024.0, 133.0/449.0,  385.0/1024.0, 266.0/449.0, //5,3,8
      461.0/1024.0, 133.0/449.0,  385.0/1024.0, 0.000/449.0,  308.0/1024.0, 133.0/449.0, //5,2,3
      385.0/1024.0, 0.000/449.0,  230.0/1024.0, 0.000/449.0,  308.0/1024.0, 133.0/449.0, //2,7,3
      153.0/1024.0, 133.0/449.0,  230.0/1024.0, 266.0/449.0,  308.0/1024.0, 133.0/449.0, //7,10,3
      153.0/1024.0, 133.0/449.0,  77.00/1024.0, 266.0/449.0,  230.0/1024.0, 266.0/449.0, //7,6,10
      153.0/1024.0, 133.0/449.0,  0.000/1024.0, 133.0/449.0,  77.00/1024.0, 266.0/449.0, //7,11,6
      769.0/1024.0, 133.0/449.0,  692.0/1024.0, 266.0/449.0,  847.0/1024.0, 266.0/449.0, //11,0,6
      692.0/1024.0, 266.0/449.0,  615.0/1024.0, 400.0/449.0,  769.0/1024.0, 400.0/449.0, //0,1,6
      77.00/1024.0, 266.0/449.0,  153.0/1024.0, 400.0/449.0,  230.0/1024.0, 266.0/449.0, //6,1,10
      615.0/1024.0, 133.0/449.0,  692.0/1024.0, 266.0/449.0,  769.0/1024.0, 133.0/449.0, //9,0,11
      615.0/1024.0, 133.0/449.0,  769.0/1024.0, 133.0/449.0,  693.0/1024.0, 0.000/449.0, //9,11,2
      615.0/1024.0, 133.0/449.0,  539.0/1024.0, 0.000/449.0,  462.0/1024.0, 133.0/449.0, //9,2,5
      846.0/1024.0, 0.000/449.0,  693.0/1024.0, 0.000/449.0,  769.0/1024.0, 133.0/449.0  //7,2,11
    ];

    let uvs = [
      30.0/128.0, 21.0/64.0,  20.0/128.0, 1.0/64.0,  10.0/128.0, 21.0/64.0, //0,4,1
      30.0/128.0, 21.0/64.0,  50.0/128.0, 21.0/64.0,  40.0/128.0, 1.0/64.0, //0,9,4
      50.0/128.0, 21.0/64.0,  70.0/128.0, 21.0/64.0,  60.0/128.0, 1.0/64.0, //9,5,4
      80.0/128.0, 1.0/64.0,  70.0/128.0, 21.0/64.0,  90.0/128.0, 21.0/64.0, //4,5,8
      100.0/128.0, 1.0/64.0,  90.0/128.0, 21.0/64.0,  110.0/128.0, 21.0/64.0, //4,8,1
      90.0/128.0, 21.0/64.0,  100.0/128.0, 42.0/64.0,  110.0/128.0, 21.0/64.0, //8,10,1
      90.0/128.0, 21.0/64.0,  80.0/128.0, 42.0/64.0,  100.0/128.0, 42.0/64.0, //8,3,10
      70.0/128.0, 21.0/64.0,  80.0/128.0, 42.0/64.0,  90.0/128.0, 21.0/64.0, //5,3,8
      70.0/128.0, 21.0/64.0,  60.0/128.0, 42.0/64.0,  80.0/128.0, 42.0/64.0, //5,2,3
      60.0/128.0, 42.0/64.0,  70.0/128.0, 62.0/64.0,  80.0/128.0, 42.0/64.0, //2,7,3
      90.0/128.0, 62.0/64.0,  100.0/128.0, 42.0/64.0,  80.0/128.0, 42.0/64.0, //7,10,3
      110.0/128.0, 62.0/64.0,  120.00/128.0, 42.0/64.0,  100.0/128.0, 42.0/64.0, //7,6,10
      30.0/128.0, 62.0/64.0,  40.0/128.0, 42.0/64.0,  20.0/128.0, 42.0/64.0, //7,11,6
      40.0/128.0, 42.0/64.0,  30.0/128.0, 21.0/64.0,  20.00/128.0, 42.0/64.0, //11,0,6
      30.0/128.0, 21.0/64.0,  10.0/128.0, 21.0/64.0,  20.00/128.0, 42.0/64.0, //0,1,6 *
      120.0/128.0, 42.0/64.0, 110.0/128.0, 21.0/64.0,  100.0/128.0, 42.0/64.0, //6,1,10
      50.0/128.0, 21.0/64.0,  30.0/128.0, 21.0/64.0,  40.0/128.0, 42.0/64.0, //9,0,11
      50.0/128.0, 21.0/64.0,  40.0/128.0, 42.0/64.0,  60.0/128.0, 42.0/64.0, //9,11,2
      50.0/128.0, 21.0/64.0,  60.0/128.0, 42.0/64.0,  70.0/128.0, 21.0/64.0, //9,2,5
      50.0/128.0, 63.0/64.0,  60.0/128.0, 42.0/64.0,  40.0/128.0, 42.0/64.0  //7,2,11
    ];
 
    let vertices = indices.flatMap((n) => [positions[3*n], positions[(3*n)+1], positions[(3*n)+2]]);
    let colors = indices.flatMap((n) => [COLORS[3*n], COLORS[(3*n)+1], COLORS[(3*n)+2]]);

    const icosphere = {
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
          let A = { x: face_vertices[0], y: face_vertices[1], z: face_vertices[2] }; //      /\
          let B = { x: face_vertices[3], y: face_vertices[4], z: face_vertices[5] }; //     /  \
          let C = { x: face_vertices[6], y: face_vertices[7], z: face_vertices[8] }; //    / 1  \
	        let D = { x: (A.x+C.x)/2.0,    y: (A.y+C.y)/2.0,    z: (A.z+C.z)/2.0 }; //    D /------\ E
	        let E = { x: (A.x+B.x)/2.0,    y: (A.y+B.y)/2.0,    z: (A.z+B.z)/2.0 }; //     / \ 4  / \
	        let F = { x: (B.x+C.x)/2.0,    y: (B.y+C.y)/2.0,    z: (B.z+C.z)/2.0 }; //    / 3 \  / 2 \
	        let new_vertices = [D, A, E,  // 1                                           /_____\/_____\
	                            F, E, B,  // 2                                          C       F      B
	                            C, D, F,  // 3
	                            F, D, E]; // 4
		      return new_vertices.map((n) => EXTEND ? extend(n, R) : n).flatMap((n) => [n.x, n.y, n.z]);
	      };

	      const subdivideColors = function(EXTEND, face_vertices) {
          let A = { x: face_vertices[0], y: face_vertices[1], z: face_vertices[2] };
          let B = { x: face_vertices[3], y: face_vertices[4], z: face_vertices[5] };
          let C = { x: face_vertices[6], y: face_vertices[7], z: face_vertices[8] };
	        let D = { x: (A.x+C.x)/2.0,    y: (A.y+C.y)/2.0,    z: (A.z+C.z)/2.0 };
	        let E = { x: (A.x+B.x)/2.0,    y: (A.y+B.y)/2.0,    z: (A.z+B.z)/2.0 };
	        let F = { x: (B.x+C.x)/2.0,    y: (B.y+C.y)/2.0,    z: (B.z+C.z)/2.0 };
	        let new_vertices = [D, A, E,
	                            F, E, B,
	                            C, D, F,
	                            F, D, E];
		      return new_vertices.map((n) => EXTEND ? extend(n, R) : n).flatMap((n) => [n.x, n.y, n.z]);
	      };

	      const subdivideUvs = function(EXTEND, face_vertices) { 
          let A = { x: face_vertices[0], y: face_vertices[1] };
          let B = { x: face_vertices[2], y: face_vertices[3] };
          let C = { x: face_vertices[4], y: face_vertices[5] };
	        let D = { x: (A.x+C.x)/2.0,    y: (A.y+C.y)/2.0 };
	        let E = { x: (A.x+B.x)/2.0,    y: (A.y+B.y)/2.0 };
	        let F = { x: (B.x+C.x)/2.0,    y: (B.y+C.y)/2.0 };
	        let new_vertices = [D, A, E,
	                            F, E, B,
	                            C, D, F,
	                            F, D, E]
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

    return icosphere;
  };
  
  const date = new Date();
  const canvas = document.getElementById('icospherecanvas');
  const gl = canvas.getContext('webgl');
  
  gl.enable(gl.CULL_FACE);
  //gl.enable(gl.BLEND);
  //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.cullFace(gl.BACK);

  //create perspective matrices
  const sphere_projection = mat4.create();
  const sphere_modelview = mat4.create();
  const sphere_mvp = mat4.create();
  const sphere_mit = mat4.create();
  const sphere_minv = mat4.create();

  /*************************************** EARTH ***************************************/

  //Create vertex shader
  const sphereVertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(sphereVertexShader, sphereVertexShaderSource);
  gl.compileShader(sphereVertexShader);
  
  //Create fragment shader
  const sphereFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(sphereFragmentShader, sphereFragmentShaderSource);
  gl.compileShader(sphereFragmentShader);
  
  //Create shader program
  const sphereShaderProgram = gl.createProgram();
  gl.attachShader(sphereShaderProgram, sphereVertexShader);
  gl.attachShader(sphereShaderProgram, sphereFragmentShader);
  gl.linkProgram(sphereShaderProgram);
  gl.useProgram(sphereShaderProgram);

  //Get attribute and uniform locations
  const spherePositionAttributeLocation = gl.getAttribLocation(sphereShaderProgram, 'position');
  const sphereTexcoordAttributeLocation = gl.getAttribLocation(sphereShaderProgram, 'texcoord');
  const sphereResolutionUniformLocation = gl.getUniformLocation(sphereShaderProgram, 'resolution');
  const sphereTimeUniformLocation = gl.getUniformLocation(sphereShaderProgram, 'time');
  const sphereMvpUniformLocation = gl.getUniformLocation(sphereShaderProgram, 'mvp');
  
  //Create buffes
  const spherePositionBuffer = gl.createBuffer();
  const sphereTextureBuffer = gl.createBuffer();

  //Set uniforms
  gl.uniform2f(sphereResolutionUniformLocation, canvas.width, canvas.height);
 
  //Create texture
  const sphereTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, sphereTexture);

  //Fill the texture with placeholder value
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));

  //Asynchronously load an image
  var sphereImage = new Image();
  sphereImage.src = "./icogridnotriangles.png";
  sphereImage.addEventListener('load', function() {
    //Copy image to the texture
    gl.bindTexture(gl.TEXTURE_2D, sphereTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sphereImage);

    //Check if image is a power of 2 in both dimensions
    if (isPowerOf2(sphereImage.width) && isPowerOf2(sphereImage.height)) {
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

    let sphere = createIcosphere([]);
    for (let i=0; i < subs; i++) {
      sphere.subdivide();
    }

    mat4.perspective(sphere_projection, 1.0/2.0, 4.0/3.0, -0.5, 0.5);
  
    //mat4.lookAt(modelview, [-4*UP.x,-4*UP.y,-4*UP.z], [0,0,0], [UP.x,UP.y,UP.z]);
    mat4.lookAt(sphere_modelview, CAMERA_POS, [0,0,0], [UP.x,UP.y,UP.z]);
    mat4.rotate(sphere_modelview, sphere_modelview, (performance.now()/-4096), [UP.x, UP.y, UP.z]);
    //mat4.rotateZ(sphere_modelview, sphere_modelview, 3.14);
  
    mat4.multiply(sphere_mvp, sphere_projection, sphere_modelview);

    mat4.invert(sphere_minv, sphere_modelview);
    mat4.transpose(sphere_mit, sphere_minv);

    //Bind sphere program
    gl.useProgram(sphereShaderProgram);

    //Set sphere positions
    gl.bindBuffer(gl.ARRAY_BUFFER, spherePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.getVertices()), gl.STATIC_DRAW);
    if (spherePositionAttributeLocation != -1) {
      gl.enableVertexAttribArray(spherePositionAttributeLocation);
      gl.vertexAttribPointer(spherePositionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    }

    //Set sphere uvs
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereTextureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.getUvs()), gl.STATIC_DRAW);
    if (sphereTexcoordAttributeLocation != -1) {
      gl.enableVertexAttribArray(sphereTexcoordAttributeLocation);
      gl.vertexAttribPointer(sphereTexcoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    }

    //Set sphere uniforms
    gl.uniform1f(sphereTimeUniformLocation, performance.now() / 4096);
    gl.uniformMatrix4fv(sphereMvpUniformLocation, false, sphere_mvp);

    //Draw sphere
    gl.drawArrays(gl.TRIANGLES /* TRIANGLE_STRIP */, 0, sphere.numVertices());

    requestAnimationFrame(render);
  }
  
  render();
}
icoSphereCanvas();
