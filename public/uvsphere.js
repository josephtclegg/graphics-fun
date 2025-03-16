function uvSphereCanvas() {
  const mat4 = glMatrix.mat4;
  const vec3 = glMatrix.vec3;
  
  const X = 0.525731112119133606;
  const Z = 0.850650808352039932;

  function extend(V, r) {
    const i = Math.sqrt(Math.pow(V.x, 2) + Math.pow(V.y, 2) + Math.pow(V.z, 2))/r;
    return { x: V.x*i, y: V.y*i, z: V.z*i };
  }

  function isPowerOf2(n) {
    return (n > 0 && (n & (n - 1)) === 0);
  }
  
  const UP = {x: 0, y: 1, z: 0};
  const CAMERA_POS = [0.0, 10.0, 10.0];

  const vertexShaderSource = `
    attribute vec3 position;
    attribute vec3 normal;

    uniform mat4 mvp;
    
    varying vec2 uv;
    varying vec3 pos;
    float PI = 3.141592653589792;

    void main () {
      //vec3 normal = normalize(position);
      //cylindrical projection
      float u = (atan(normal.x, normal.z)/PI) + 0.5;
      float v = asin(normal.y)/PI + 0.5;
      uv = vec2(u, v);
      pos = position;
      gl_Position = mvp * vec4(normalize(position), 1.0);
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

  const createUvsphere = function(slices, stacks) {
    const Z = 0.5;
    const R = Z;
    let SLICES = slices;
    let STACKS = stacks;

    let positions = [];
    let indices = [];
    let vertices = [];
    let normals = [];

    const sphere = {
      getSlices() {
        return SLICES;
      },
      getStacks() {
        return STACKS;
      },
      getVertices() {
        return positions;
      },
      numVertices() {
        return positions.length/3;
      },
      getIndices() {
        return indices;
      },
      getNormals() {
        return normals;
      },
      //(much) inspired by freeglut implementation, which currently seems to reside at
      //https://freeglut.sourceforge.net/
      //https://github.com/freeglut/freeglut
      generateVertices(slices, stacks) {
        SLICES = slices;
        STACKS = stacks;
        positions = [];
        indices = [];
        vertices = [];
        normals = [];

        let sint1 = [];
        let cost1 = [];
        let sint2 = [];
        let cost2 = [];

        const generateCircle = function(n, hc) {
          let sint = [];
          let cost = [];

          const size = Math.abs(n);
          let angle = (hc ? 1 : 2)*Math.PI/(n == 0 ? 1 : n);
          sint.push(0.0);
          cost.push(1.0);

          for (let i=1; i<size; i++) {
            sint.push(Math.sin(angle*i));
            cost.push(Math.cos(angle*i));
          }

          if (hc) {
            sint.push(0.0);
            cost.push(-1.0);
          } else {
            sint.push(sint[0]);
            cost.push(cost[0]);
          }

          return { s: sint, c: cost };
        };

        let circle1 = generateCircle(-slices, false);
        let circle2 = generateCircle(stacks, true);
        sint1 = circle1.s;
        cost1 = circle1.c;
        sint2 = circle2.s;
        cost2 = circle2.c;

        positions.push(0.0);
        positions.push(0.0);
        positions.push(R);
        normals.push(0.0);
        normals.push(0.0);
        normals.push(1.0);

        for (let i=1; i<stacks; i++) {
          for (let j=0; j<slices; j++) {
            let x = cost1[j]*sint2[i];
            let y = sint1[j]*sint2[i];
            let z = cost2[i];

            positions.push(x*R);
            positions.push(y*R);
            positions.push(z*R);
            normals.push(x);
            normals.push(y);
            normals.push(z);
          }
        }

        positions.push(0.0);
        positions.push(0.0);
        positions.push(-R);
        normals.push(0.0);
        normals.push(0.0);
        normals.push(-1.0);

        for (let j=0; j<slices; j++) {
          indices.push(j+1);
          indices.push(0);
        }

        indices.push(1);
        indices.push(0);
        let offset = 0;

        for (let i=0; i<stacks-2; i++) {
          offset = 1+i*slices;
          for (let j=0; j<slices; j++) {
            indices.push(offset+j+slices);
            indices.push(offset+j);
          }
          indices.push(offset+slices);
          indices.push(offset);
        }

        offset = 1+(stacks-2)*slices;
        const nVert = slices*(stacks-1)+2;
        for (let j=0; j<slices; j++) {
          indices.push(nVert-1);
          indices.push(offset+j);
        }
        indices.push(nVert-1);
        indices.push(offset);

        //vertices = indices.flatMap((n) => [positions[3*n], positions[(3*n)+1], positions[(3*n)+2]]);
        vertices = positions;
      }
    }

    sphere.generateVertices(slices, stacks);
    return sphere;
  };

  const canvas = document.getElementById('uvspherecanvas');
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
  const normalAttribLocation = gl.getAttribLocation(shaderProgram, 'normal');
  const resolutionUniformLocation = gl.getUniformLocation(shaderProgram, 'resolution');
  const timeUniformLocation = gl.getUniformLocation(shaderProgram, 'time');
  const mvpUniformLocation = gl.getUniformLocation(shaderProgram, 'mvp');

  //create buffers
  const spherePositionBuffer = gl.createBuffer();
  const sphereIndexBuffer = gl.createBuffer();
  const sphereNormalBuffer = gl.createBuffer();

  //set resolution uniform
  gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);

  const sphereTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, sphereTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));

  var sphereImage = new Image();
  sphereImage.src = "./grid32.png";
  sphereImage.addEventListener('load', function() {
    gl.bindTexture(gl.TEXTURE_2D, sphereTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sphereImage);

    //Check if image is power of 2 in both dimensions and generate mips
    if (isPowerOf2(sphereImage.width) && isPowerOf2(sphereImage.height)) {
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
    let slices = parseInt(document.getElementById('uvsphereslices').value);
    let stacks = parseInt(document.getElementById('uvspherestacks').value);
    slices = slices > 3 ? slices : 4;
    stacks = stacks > 3 ? stacks : 4;
    let sphere = createUvsphere(slices, stacks);
    //sphere.generateVertices(slices, stacks);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0, 0, 0, 0.01);

    mat4.perspective(projection, 1.0/2.0, 4.0/3.0, -0.5, 0.5);

    mat4.lookAt(modelview, CAMERA_POS, [0,0,0], [UP.x,UP.y,UP.z]);
    mat4.rotate(modelview, modelview, performance.now()/4096, [UP.x,UP.y,UP.z]);
    //mat4.rotateZ(modelview, modelview, -0.4);

    mat4.multiply(mvp, projection, modelview);
    
    gl.uniform1f(timeUniformLocation, performance.now()/4096);
    gl.uniformMatrix4fv(mvpUniformLocation, false, mvp);

    gl.bindBuffer(gl.ARRAY_BUFFER, spherePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.getVertices()), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttribLocation);
    gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.getNormals()), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(normalAttribLocation);
    gl.vertexAttribPointer(normalAttribLocation, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphere.getIndices()), gl.STATIC_DRAW);

    //gl.drawArrays(gl.TRIANGLES, 0, sphere.numVertices());

    //console.log(sphere.getIndices());

    for (let i=0; i<sphere.getStacks(); i++) {
      gl.drawElements(gl.TRIANGLE_STRIP, (sphere.getSlices()+1)*2, gl.UNSIGNED_SHORT, 2*i*((sphere.getSlices()+1)*2));
    }

    requestAnimationFrame(render);
  }

  render();
}
uvSphereCanvas();
