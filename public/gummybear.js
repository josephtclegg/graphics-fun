async function gummyBearCanvas() {
  const mat4 = glMatrix.mat4;
  const vec3 = glMatrix.vec3;

  const PI = 3.141592653589792;
  const UP_vec3 = vec3.fromValues(0.0, 1.0, 0.0);
  const UP = {x: 0.0, y: 1.0, z: 0.0};
  const CAMERA_POS = [0.0, 0.0, -5.0];
  const GUMMYBEAR_CAMERA_POS = CAMERA_POS;
  const GUMMYBEAR_LIGHT_POS = [-100.0, 100.0, -2.0];

  const isPowerOf2 = function(n) {
    return (n > 0 && (n & (n - 1)) === 0);
  }

  const gummyBearVertexShaderSource = `
  	attribute vec3 position;
    attribute vec2 texcoord;
  	attribute vec3 normal;

  	uniform mat4 mvp;
    uniform mat4 mit;

    uniform vec3 lightpos;
    uniform vec3 camerapos;

    varying vec2 uv;
    varying vec3 v_normal;
    varying vec3 v_surfacetolight;
    varying vec3 v_surfacetocamera;
  
  	void main() {
      v_normal = mat3(mit)*normal;
      v_surfacetolight = lightpos-position;
      v_surfacetocamera = camerapos-position;
      uv = texcoord;
  	  gl_Position = mvp * vec4(position, 1.0);
  	}
  `;
  const gummyBearFragmentShaderSource = `
  	precision mediump float;

  	uniform vec2 resolution;
  	uniform float time;
    uniform sampler2D texture;

  	varying vec2 uv;
  	varying vec3 v_normal;
  	varying vec3 v_surfacetolight;
  	varying vec3 v_surfacetocamera;

    uniform float shininess;
    //uniform float lightcolor;
    //uniform float specularcolor;
  
  	void main() {
      vec3 lightcolor = vec3(1.0, 1.0, 1.0);
      vec3 specularcolor = vec3(1.0, 1.0, 1.0);

      vec2 new_uv = uv;
      new_uv.y = 1.0 - new_uv.y;

      vec3 normal = normalize(v_normal);
      vec3 surfacetolight = normalize(v_surfacetolight);
      vec3 surfacetocamera = normalize(v_surfacetocamera);
      vec3 halfvector = normalize(surfacetolight+surfacetocamera);

      float ambient = 0.2;
      float light = max(dot(normal, normalize(v_surfacetolight)), ambient);
      float specular = 1.0;
      if (light > 0.0) {
        specular = pow(dot(normal, halfvector), shininess);
      }

      light *= 1.9;
      lightcolor = texture2D(texture, new_uv).rgb;
  	  gl_FragColor = vec4(lightcolor, 0.65);
      gl_FragColor.rgb *= light*lightcolor;

      //specular is same color as underlying
      specularcolor = gl_FragColor.rgb;
      gl_FragColor.rgb += specular*specularcolor;
  	}
  `;

  const RESPONSE = await fetch("./gummybear.obj");
  const RAWDATA = await RESPONSE.text();

  function createGummyBear(data) {
    const lines = data.split("\n");

    const parsePositions = function(data) {
      let p_lines = [];

      for (const line of data) {
        if (line.startsWith("v ")) {
          p_lines.push(line.substring(2));
        }
      }

      let positions = [];

      for (const line of p_lines) {
        for (const coord of line.split(" ")) {
          positions.push(coord);
        }
      }

      return positions;
    }

    const parseUvs = function(data) {
      let u_lines = [];

      for (const line of data) {
        if (line.startsWith("vt ")) {
          u_lines.push(line.substring(3));
        }
      }

      let uvs = [];

      for (const line of u_lines) {
        for (const coord of line.split(" ")) {
          uvs.push(coord);
        }
      }

      return uvs;
    }

    const parseNormals = function(data) {
      let n_lines = [];

      for (const line of data) {
        if (line.startsWith("vn ")) {
          n_lines.push(line.substring(3));
        }
      }

      let normals = [];

      for (const line of n_lines) {
        for (const coord of line.split(" ")) {
          normals.push(coord);
        }
      }

      return normals;
    }

    const parseIndices = function(data) {
      let i_lines = [];

      for (const line of data) {
        if (line.startsWith("f ")) {
          i_lines.push(line.substring(2));
        }
      }

      let triangle_positions = [];
      let triangle_uvs = [];
      let triangle_normals = [];

      for (const line of i_lines) {
        triangle_positions.push(line.split(" ")[0].split("/")[0]);
        triangle_uvs.push(line.split(" ")[0].split("/")[1]);
        triangle_normals.push(line.split(" ")[0].split("/")[2]);
        triangle_positions.push(line.split(" ")[1].split("/")[0]);
        triangle_uvs.push(line.split(" ")[1].split("/")[1]);
        triangle_normals.push(line.split(" ")[1].split("/")[2]);
        triangle_positions.push(line.split(" ")[2].split("/")[0]);
        triangle_uvs.push(line.split(" ")[2].split("/")[1]);
        triangle_normals.push(line.split(" ")[2].split("/")[2]);
      }

      return {
        position_indices: triangle_positions,
        uv_indices: triangle_uvs,
        normal_indices: triangle_normals
      };
    }

    const positions = parsePositions(lines);
    const uvs = parseUvs(lines);
    const normals = parseNormals(lines);
    const indices = parseIndices(lines);
    const position_indices = indices.position_indices;
    const uv_indices = indices.uv_indices;
    const normal_indices = indices.normal_indices;
    const position_data = position_indices.flatMap((n) => [positions[3*(n-1)], positions[(3*(n-1))+1], positions[(3*(n-1))+2]]);
    const uv_data = uv_indices.flatMap((n) => [uvs[2*(n-1)], uvs[(2*(n-1))+1]]);
    const normal_data = normal_indices.flatMap((n) => [normals[3*(n-1)], normals[(3*(n-1))+1], normals[(3*(n-1))+2]]);

    const gummybear = {
      getPositionData() {
	      return position_data;
      },
      getNormalData() {
	      return normal_data;
      },
      getUvData() {
        return uv_data;
      },
      numVertices() {
        return position_data.length/3;
      }
    };

    return gummybear;
  };
 
  const date = new Date();
  const canvas = document.getElementById('gummybearcanvas');
  const gl = canvas.getContext('webgl');
  
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.cullFace(gl.BACK);

  //create perspective matrices
  const gummyBear_projection = mat4.create();
  const gummyBear_modelview = mat4.create();
  const gummyBear_mvp = mat4.create();
  const gummyBear_mit = mat4.create();
  const gummyBear_minv = mat4.create();

  /*************************************** EARTH ***************************************/

  //Create vertex shader
  const gummyBearVertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(gummyBearVertexShader, gummyBearVertexShaderSource);
  gl.compileShader(gummyBearVertexShader);
  
  //Create fragment shader
  const gummyBearFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(gummyBearFragmentShader, gummyBearFragmentShaderSource);
  gl.compileShader(gummyBearFragmentShader);
  
  //Create shader program
  const gummyBearShaderProgram = gl.createProgram();
  gl.attachShader(gummyBearShaderProgram, gummyBearVertexShader);
  gl.attachShader(gummyBearShaderProgram, gummyBearFragmentShader);
  gl.linkProgram(gummyBearShaderProgram);
  gl.useProgram(gummyBearShaderProgram);

  //Get attribute and uniform locations
  const gummyBearPositionAttributeLocation = gl.getAttribLocation(gummyBearShaderProgram, 'position');
  const gummyBearTexcoordAttributeLocation = gl.getAttribLocation(gummyBearShaderProgram, 'texcoord');
  const gummyBearNormalAttributeLocation = gl.getAttribLocation(gummyBearShaderProgram, 'normal');
  const gummyBearResolutionUniformLocation = gl.getUniformLocation(gummyBearShaderProgram, 'resolution');
  const gummyBearTimeUniformLocation = gl.getUniformLocation(gummyBearShaderProgram, 'time');
  const gummyBearMvpUniformLocation = gl.getUniformLocation(gummyBearShaderProgram, 'mvp');
  const gummyBearMitUniformLocation = gl.getUniformLocation(gummyBearShaderProgram, 'mit');
  const gummyBearShininessUniformLocation = gl.getUniformLocation(gummyBearShaderProgram, 'shininess');
  //const gummyBearLightcolorUniformLocation = gl.getUniformLocation(gummyBearShaderProgram, 'lightcolor');
  //const gummyBearSpecularcolorUniformLocation = gl.getUniformLocation(gummyBearShaderProgram, 'specularcolor');
  const gummyBearLightposUniformLocation = gl.getUniformLocation(gummyBearShaderProgram, 'lightpos');
  const gummyBearCameraposUniformLocation = gl.getUniformLocation(gummyBearShaderProgram, 'camerapos');
  
  //Create buffes
  const gummyBearPositionBuffer = gl.createBuffer();
  const gummyBearTextureBuffer = gl.createBuffer();
  const gummyBearNormalBuffer = gl.createBuffer();

  //Set uniforms
  gl.uniform2f(gummyBearResolutionUniformLocation, canvas.width, canvas.height);
 
  //Create texture
  const gummyBearTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, gummyBearTexture);

  //Fill the texture with placeholder value
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));

  //Asynchronously load an image
  var gummyBearImage = new Image();
  gummyBearImage.src = "./gummybear5.png";
  gummyBearImage.addEventListener('load', function() {
    //Copy image to the texture
    gl.bindTexture(gl.TEXTURE_2D, gummyBearTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, gummyBearImage);

    //Check if image is a power of 2 in both dimensions
    if (isPowerOf2(gummyBearImage.width) && isPowerOf2(gummyBearImage.height)) {
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
  let gummyBear = createGummyBear(RAWDATA);

  function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0, 0, 0, 0.01);

    mat4.perspective(gummyBear_projection, Math.PI/4, 1.0, -0.5, 0.5);
  
    //mat4.lookAt(modelview, [-4*UP.x,-4*UP.y,-4*UP.z], [0,0,0], [UP.x,UP.y,UP.z]);
    mat4.lookAt(gummyBear_modelview, CAMERA_POS, [0,0,0], [UP.x,UP.y,UP.z]);
    mat4.rotate(gummyBear_modelview, gummyBear_modelview, (performance.now()/-4096), [UP.x, UP.y, UP.z]);
    //mat4.rotateZ(gummyBear_modelview, gummyBear_modelview, 3.14);
  
    mat4.multiply(gummyBear_mvp, gummyBear_projection, gummyBear_modelview);
    mat4.invert(gummyBear_minv, gummyBear_modelview);
    mat4.transpose(gummyBear_mit, gummyBear_minv);

    //Bind gummyBear program
    gl.useProgram(gummyBearShaderProgram);

    //Set gummyBear positions
    gl.bindBuffer(gl.ARRAY_BUFFER, gummyBearPositionBuffer);
    gl.enableVertexAttribArray(gummyBearPositionAttributeLocation);
    gl.vertexAttribPointer(gummyBearPositionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gummyBear.getPositionData()), gl.STATIC_DRAW);

    //Set gummyBear uvs
    gl.bindBuffer(gl.ARRAY_BUFFER, gummyBearTextureBuffer);
    gl.enableVertexAttribArray(gummyBearTexcoordAttributeLocation);
    gl.vertexAttribPointer(gummyBearTexcoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gummyBear.getUvData()), gl.STATIC_DRAW);

    //Set gummyBear normals 
    gl.bindBuffer(gl.ARRAY_BUFFER, gummyBearNormalBuffer);
    gl.enableVertexAttribArray(gummyBearNormalAttributeLocation);
    gl.vertexAttribPointer(gummyBearNormalAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gummyBear.getNormalData()), gl.STATIC_DRAW);

    //Set gummyBear uniforms
    gl.uniform1f(gummyBearTimeUniformLocation, performance.now() / 4096);
    gl.uniform1f(gummyBearShininessUniformLocation, 0.8);
    gl.uniform3fv(gummyBearLightposUniformLocation, new Float32Array(GUMMYBEAR_LIGHT_POS));
    gl.uniform3fv(gummyBearCameraposUniformLocation, new Float32Array(GUMMYBEAR_CAMERA_POS));
    //gl.uniform3fv(gummyBearLightcolorUniformLocation, new Float32Array([1.0, 1.0, 1.0]));
    //gl.uniform3fv(gummyBearSpecularcolorUniformLocation, new Float32Array([1.0, 1.0, 1.0]));
    gl.uniformMatrix4fv(gummyBearMvpUniformLocation, false, gummyBear_mvp);
    gl.uniformMatrix4fv(gummyBearMitUniformLocation, false, gummyBear_mit);

    //Draw gummyBear
    gl.drawArrays(gl.TRIANGLES /* TRIANGLE_STRIP */, 0, gummyBear.numVertices());

    requestAnimationFrame(render);
  }
  
  render();
}
gummyBearCanvas();
