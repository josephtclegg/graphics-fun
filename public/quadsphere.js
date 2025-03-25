function quadSphereCanvas() {
  const mat4 = glMatrix.mat4;
  const vec3 = glMatrix.vec3;
  
  const X = 0.525731112119133606;
  const Z = 0.850650808352039932;
  const PI = 3.141592653589792;

  const UP = {x: 0, y: 1, z: 0};
  const CAMERA_POS = [0.0, -10.0, 10.0];

  function extend(V, r) {
    const i = Math.sqrt(Math.pow(V.x, 2) + Math.pow(V.y, 2) + Math.pow(V.z, 2))/r;
    return { x: V.x*i, y: V.y*i, z: V.z*i };
  }

  function isPowerOf2(n) {
    return (n > 0 && (n & (n - 1)) === 0);
  }
  

  const vertexShaderSource = `
    attribute vec3 position;
    attribute vec2 texcoord;

    uniform mat4 mvp;
    
    varying vec2 uv;
    varying vec3 pos;

    void main () {
      vec3 normal = normalize(position);
      uv = texcoord;
      gl_Position = mvp * vec4(normal, 1.0);
      pos = position;
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;

    uniform vec2 resolution;
    uniform float time;
    uniform sampler2D texture;

    varying vec2 uv;
    varying vec3 pos;

    void main() {
      gl_FragColor = texture2D(texture, uv);
    }
  `;

  const createCubesphere = function() {
    const Z = 0.5;
    const R = Z;

    var positions = [
      -Z, Z,-Z, // 1 +------/+ 2
      -Z, Z, Z, //   |  TOP  |    Triangles 0,1
       Z, Z, Z, //   |  /    |
       Z, Z,-Z, // 0 +/------+ 3

      -Z,-Z,-Z, // 0 +------/+ 3
       Z,-Z,-Z, //   | FRONT |    Triangles 2,3
                //   |  /    |
                // 4 +/------+ 5

      -Z,-Z, Z, // 2 +------/+ 1
       Z,-Z, Z //   | BACK  |    Triangles 4,5
                //   |  /    |
                // 7 +/------+ 6

                // 1 +------/+ 0
                //   | LEFT  |    Triangles 6,7
                //   |  /    |
                // 6 +/------+ 4

                // 3 +------/+ 2
                //   | RIGHT |    Triangles 8,9
                //   |  /    |
                // 5 +/------+ 7

                // 4 +------/+ 5
                //   |  BOT  |    Triangles 10,11
                //   |  /    |
                // 6 +/------+ 7

    ];

    var indices = [
      0,2,1,
      3,2,0,
      4,3,0,
      5,3,4,
      7,1,2,
      6,1,7,
      6,0,1,
      4,0,6,
      5,2,3,
      7,2,5,
      6,5,4,
      7,5,6
    ];

    var vertices = indices.flatMap((n) => [positions[3*n], positions[(3*n)+1], positions[(3*n)+2]]);

    let uvs = [
      0.0, 0.0,  1.0, 1.0,  0.0, 1.0,
      1.0, 0.0,  1.0, 1.0,  0.0, 0.0,
      0.0, 0.0,  1.0, 1.0,  0.0, 1.0,
      1.0, 0.0,  1.0, 1.0,  0.0, 0.0,
      0.0, 0.0,  1.0, 1.0,  0.0, 1.0,
      1.0, 0.0,  1.0, 1.0,  0.0, 0.0,
      0.0, 0.0,  1.0, 1.0,  0.0, 1.0,
      1.0, 0.0,  1.0, 1.0,  0.0, 0.0,
      0.0, 0.0,  1.0, 1.0,  0.0, 1.0,
      1.0, 0.0,  1.0, 1.0,  0.0, 0.0,
      0.0, 0.0,  1.0, 1.0,  0.0, 1.0,
      1.0, 0.0,  1.0, 1.0,  0.0, 0.0
    ];

    const cube_sphere = {
      getVertices() {
        return vertices;
      },
      getUvs() {
        return uvs;
      },
      numVertices() {
        return vertices.length/3;
      },
      subdivide() {
        /*
        * We take 4 input vertices and make 9 output out of them, and extrude them to the
        * radius to curve them like a sphere :)
        *
        * A      E       B
        * +------+-------+
        * |      |       |
        * |      |       |
        *H+------+I------+F
        * |      |       |
        * |      |       |
        * +------+-------+
        * D      G       C
        */
        const subdivideVertices = function(EXTEND, face_vertices) {
          let A = { x: face_vertices[0], y: face_vertices[1], z: face_vertices[2] };
          let B = { x: face_vertices[3], y: face_vertices[4], z: face_vertices[5] };
          let C = { x: face_vertices[6], y: face_vertices[7], z: face_vertices[8] };
          let D = { x: face_vertices[9], y: face_vertices[10], z: face_vertices[11] };
          let E = { x: (A.x+B.x)/2.0, y: (A.y+B.y)/2.0, z: (A.z+B.z)/2.0 };
          let F = { x: (C.x+B.x)/2.0, y: (C.y+B.y)/2.0, z: (C.z+B.z)/2.0 };
          let G = { x: (C.x+D.x)/2.0, y: (C.y+D.y)/2.0, z: (C.z+D.z)/2.0 };
          let H = { x: (A.x+D.x)/2.0, y: (A.y+D.y)/2.0, z: (A.z+D.z)/2.0 };
          let I = { x: (H.x+F.x)/2.0, y: (H.y+F.y)/2.0, z: (H.z+F.z)/2.0 };
          let new_vertices = [H,E,A,
                              I,E,H,
                              I,B,E,
                              F,B,I,
                              D,I,H,
                              G,I,D,
                              G,F,I,
                              C,F,G];
          return new_vertices.map((n) => EXTEND ? extend(n, R) : n).flatMap((n) => [n.x, n.y, n.z]);
        };

        vertices = Array.from(new Array(vertices.length), (x, i) => i)
                   .filter((n) => n % 18 == 0)
                   .flatMap((n) => subdivideVertices(true,
                                                     [vertices[n+6],
                                                      vertices[n+7],
                                                      vertices[n+8],
                                                      vertices[n+3],
                                                      vertices[n+4],
                                                      vertices[n+5],
                                                      vertices[n+9],
                                                      vertices[n+10],
                                                      vertices[n+11],
                                                      vertices[n+0],
                                                      vertices[n+1],
                                                      vertices[n+2]]));

        const subdivideUvs = function(EXTEND, face_uvs) {
          let A = { x: face_uvs[0], y: face_uvs[1] };
          let B = { x: face_uvs[2], y: face_uvs[3] };
          let C = { x: face_uvs[4], y: face_uvs[5] };
          let D = { x: face_uvs[6], y: face_uvs[7] };
          let E = { x: (A.x+B.x)/2.0, y: (A.y+B.y)/2.0 };
          let F = { x: (C.x+B.x)/2.0, y: (C.y+B.y)/2.0 };
          let G = { x: (C.x+D.x)/2.0, y: (C.y+D.y)/2.0 };
          let H = { x: (A.x+D.x)/2.0, y: (A.y+D.y)/2.0 };
          let I = { x: (H.x+F.x)/2.0, y: (H.y+F.y)/2.0 };
          let new_vertices = [H,E,A,
                              I,E,H,
                              I,B,E,
                              F,B,I,
                              D,I,H,
                              G,I,D,
                              G,F,I,
                              C,F,G];
		      return new_vertices.flatMap((n) => [n.x, n.y]);
        };

        uvs = Array.from(new Array(uvs.length), (x, i) => i)
	               .filter((n) => n % 12 == 0)
	               .flatMap((n) => subdivideUvs(false,
			                                           [uvs[n+4],
                                                  uvs[n+5],
                                                  uvs[n+2],
                                                  uvs[n+3],
                                                  uvs[n+6],
                                                  uvs[n+7],
                                                  uvs[n+0],
                                                  uvs[n+1]]));
      }
    };

    return cube_sphere;
  };

  const canvas = document.getElementById('cubespherecanvas');
  const gl = canvas.getContext('webgl');

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.cullFace(gl.BACK);

  //create perspective matrices
  const projection = mat4.create();
  const modelview = mat4.create();
  const mvp = mat4.create();
  const mit = mat4.create();
  const minv = mat4.create();

  //create shaders and shader pogram
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  gl.useProgram(shaderProgram);

  //Get attribute and uniform locations
  const positionAttribLocation = gl.getAttribLocation(shaderProgram, 'position');
  const texcoordAttribLocation = gl.getAttribLocation(shaderProgram, 'texcoord');
  const resolutionUniformLocation = gl.getUniformLocation(shaderProgram, 'resolution');
  const timeUniformLocation = gl.getUniformLocation(shaderProgram, 'time');
  const mvpUniformLocation = gl.getUniformLocation(shaderProgram, 'mvp');

  //set position attribute
  const positionBuffer = gl.createBuffer();

  //set resolution uniform
  gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);

  //set earth texture
  const earthTextureBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, earthTextureBuffer);
  gl.enableVertexAttribArray(texcoordAttribLocation);
  gl.vertexAttribPointer(texcoordAttribLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);

  const earthTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, earthTexture);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));

  var earthImage = new Image();
  earthImage.src = "./grid32.png";
  earthImage.addEventListener('load', function() {
    gl.bindTexture(gl.TEXTURE_2D, earthTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, earthImage);

    //Check if image is power of 2 in both dimensions and generate mips
    if (isPowerOf2(earthImage.width) && isPowerOf2(earthImage.height)) {
      //Yes, generate mips
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParamateri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParamateri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParamateri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  });

  function render() {
    gl.useProgram(shaderProgram);
    const earth = createCubesphere();
    const subs = document.getElementById('cubespheresubdivisions').value;
    for (var i = 0; i < subs; i++) {
      earth.subdivide();
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0, 0, 0, 0.01);

    gl.bindBuffer(gl.ARRAY_BUFFER, earthTextureBuffer);
    gl.enableVertexAttribArray(texcoordAttribLocation);
    gl.vertexAttribPointer(texcoordAttribLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(earth.getUvs()), gl.STATIC_DRAW);

    mat4.perspective(projection, 1.0/2.0, 4.0/3.0, -0.5, 0.5);

    mat4.lookAt(modelview, CAMERA_POS, [0,0,0], [UP.x,UP.y,UP.z]);
    mat4.rotate(modelview, modelview, performance.now()/-4096, [UP.x,UP.y,UP.z]);
    //mat4.rotateZ(modelview, modelview, -0.4);

    mat4.multiply(mvp, projection, modelview);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(earth.getVertices()), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttribLocation);
    gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, false, 0, 0);

    gl.uniform1f(timeUniformLocation, performance.now()/4096);
    gl.uniformMatrix4fv(mvpUniformLocation, false, mvp);

    gl.drawArrays(gl.TRIANGLES, 0, earth.numVertices());

    requestAnimationFrame(render);
  }

  render();
}
quadSphereCanvas();
