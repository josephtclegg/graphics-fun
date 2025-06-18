function sdfTextBannerCanvas() {
  const mat4 = glMatrix.mat4;
  const vec3 = glMatrix.vec3;

  const X = 0.525731112119133606;
  const Z = 0.850650808352039932;
  const PI = 3.141592653589792;
  const UP_vec3 = vec3.fromValues(0.0, 2.0*Z, 2.0*X);
  const UP = {x: 0.0, y: 2.0*Z/vec3.length(UP_vec3), z: 2.0*X/vec3.length(UP_vec3)};
  const CAMERA_POS = [0.0, 0.0, -1.0*Math.sqrt(200.0)];

  const isPowerOf2 = function(n) {
    return (n > 0 && (n & (n - 1)) === 0);
  }
  
  const date = new Date();
  let mouseX = 0;
  let mouseY = 0;
  const createShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      //this is really useful!
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };
  
  //We need 3 canvases, one renders the text in an HTML 2d context, another generates an SDF from the
  //texture of the 2d canvas, another renders the text from the SDF + whatever effects we add
  //bannerglCanvas is the third and final canvas
  const bannerglCanvas = document.getElementById('sdftextbannercanvas');

  const getMousePosition = (e) => {
    const rect = bannerglCanvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  };
  const getCanvasMousePosition = (e) => {
    var pos = getMousePosition(e);
    pos.x = pos.x * bannerglCanvas.width / bannerglCanvas.clientWidth;
    pos.y = pos.y * bannerglCanvas.height / bannerglCanvas.clientHeight;
    return pos;
  };
  const handleMouseMove = (e) => {
    const mouse_pos = getCanvasMousePosition(e);
    mouseX = mouse_pos.x;
    mouseY = bannerglCanvas.height - mouse_pos.y;
  };
  bannerglCanvas.addEventListener('mousemove', handleMouseMove);

  //GETTING THE INTIAL TEXT TEXTURE ***********************************************************
  //first canvas
  const textCanvas = document.createElement('canvas'); //not in DOM, we just want its texture later
  textCanvas.width = bannerglCanvas.width;
  textCanvas.height = bannerglCanvas.height;

  const fillWrappedText = (context, text, x, y, maxWidth, lineHeight) => {
    const words = text.split(' ');
    let line = '';
    let lineY = y;

    for (let i=0; i < words.length; i++) {
      const metrics = context.measureText(line+words[i]+' ');
      if (metrics.width > maxWidth && i > 0) {
        context.fillText(line, x, lineY);
        line = words[i]+' ';
        lineY += lineHeight;
      } else {
        line += words[i]+' ';
      }
    } 
  };

  //fill the off-screen text canvas with text
  const textContext = textCanvas.getContext('2d');
  const textFontSize = bannerglCanvas.height/5;
  textContext.font = `${textFontSize}px serif`;
  textContext.textBaseline = 'middle';

  const bannerText = 'free goats '.repeat(50);
  const lineHeight = textFontSize;
  //Note on the y offset, textFontSize/2-(textFontSize/10).  Ideally it would just be textFontSize/2, to
  //get the top of the text to line up with the top of the banner, but the reality of the size of the text
  //is that characters like 'g' extend a little further below than we expect, causing weird rendering artifacts
  //so I just experimented and found textFontSize/10 to be a decent enough offset to avoid that
  fillWrappedText(textContext, bannerText, 0, textFontSize/2-(textFontSize/10), textCanvas.width, lineHeight);
  const textImage = textContext.getImageData(0, 0, textCanvas.width, textCanvas.height);
  if (!textImage) {
    console.error('Can\'t get text image!');
    return;
  }
  const textImageData = textImage.data;
  if (!textImageData) {
    console.error('Can\'t get text image data!');
    return;
  }

  //GENERATING THE SDF ****************************************************************
  //second canvas
  const sdfCanvas = document.createElement('canvas'); //not in DOM, we just want its texture later
  sdfCanvas.width = textCanvas.width;
  sdfCanvas.height = textCanvas.height;
  const sdfgl = sdfCanvas.getContext('webgl', {alpha: true});
  if (!sdfgl) {
    console.error('WebGL not supported');
    return;
  }
  sdfgl.enable(sdfgl.BLEND);
  sdfgl.blendFunc(sdfgl.SRC_ALPHA, sdfgl.ONE_MINUS_SRC_ALPHA);
  sdfgl.viewport(0, 0, sdfCanvas.width, sdfCanvas.height);

  function createBanner() {
    const positions = [-1.0, 1.0, 0.0,  //top left
                       -1.0,-1.0, 0.0,  //bot left
                        1.0,-1.0, 0.0,  //bot right
                        1.0, 1.0, 0.0]  //top right
    const texcoords = [ 0.0,  1.0,  //top left
                        0.0,  0.0,  //bot left
                        1.0,  0.0,  //bot right
                        1.0,  1.0]; //top right
    const position_indices = [0, 1, 2,
                              2, 3, 0];
    const uv_indices = position_indices;
    const position_data = position_indices.flatMap((n) => [positions[3*n], positions[3*n+1], positions[3*n+2]]);
    const uv_data = uv_indices.flatMap((n) => [texcoords[2*n], texcoords[2*n+1]]);
    const banner = {
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

    return banner;
  };

  const sdfVertSource = `
    precision lowp float;
    attribute vec3 position;
    attribute vec2 texcoord;
    varying vec2 uv;
    void main()
    {
        uv = texcoord;
        gl_Position = vec4(position, 1.0);
    }
  `;

  //ripped from xordev https://mini.gmshaders.com/p/gm-shaders-mini-jfa
  const sdfFragSource = `
    precision lowp float;
    varying vec2 uv;

    //The size of a texel (1 / texture_resolution)
    uniform vec2 texel;
    //Jump distance in pixels
    uniform float jump;
    //Starting pass (1.0 if first, 0.0 after)
    uniform float first;
    uniform sampler2D texture1;

    //Center RG value
    #define CENTER 127.0/255.0
    //RG value range
    #define RANGE  255.0

    //Jump Flooding Algorithm
    //RG encodes XY offset
    //Alpha encodes inverted distance
    vec4 JFA(sampler2D t, vec2 uv)
    {
        //True if this is the first pass
        bool first = first>0.5;
        //Initialize output
        vec4 encode = vec4(0.0);
        //Initialize the closest distance (1.0 is outside the range)
        float dist = 1.0;
        
        //Loop through neighbor cells
        for(int x = -1; x <= 1; x++)
        for(int y = -1; y <= 1; y++)
        {
            //Pixel offset with jump distance
            vec2 off = vec2(x,y) * jump;
            //Compute new texture coordinates
            vec2 coord = uv + off * texel;
            //Skip texels outside of the texture
            if (coord != clamp(coord, 0.0, 1.0)) continue;
            
            //Sample the texture at the coordinates
            vec4 samp = texture2D(t, coord);
            
            //If we're over the surface, preserves the color
            if (x==0 && y==0 && samp.a>=1.0)
            {
                return samp;
            }
            //Encode the offset (-0.5 to +0.5)
            vec2 tex_off = (samp.rg - CENTER) * vec2(samp.a<1.0) + off / RANGE;
            //Compute offset distance (inverted)
            float tex_dist = length(tex_off); 
            
            //Check for the closest
            if (dist > tex_dist && (!first || samp.a>=1.0))
            {
                //Store texel offset
                encode.rg = tex_off + CENTER;
                //Store the closest distance
                dist = tex_dist;
                encode.a = 1.0 - tex_dist*3.0;
            }
        }
        return encode;
    }

    void main()
    {
        gl_FragColor = JFA(texture1, uv);
    }
  `;

  const sdfglData = {
    shaderProgram: sdfgl.createProgram(),
    positionBuffer: sdfgl.createBuffer(),
    uvBuffer: sdfgl.createBuffer(),
    texture1: sdfgl.createTexture(),
    texture2: sdfgl.createTexture(),
    textTexture: sdfgl.createTexture(),
    frameBuffer1: sdfgl.createFramebuffer(),
    frameBuffer2: sdfgl.createFramebuffer()
  };
  const sdfVert = createShader(sdfgl, sdfgl.VERTEX_SHADER, sdfVertSource);
  const sdfFrag = createShader(sdfgl, sdfgl.FRAGMENT_SHADER, sdfFragSource);
  sdfgl.attachShader(sdfglData.shaderProgram, sdfVert);
  sdfgl.attachShader(sdfglData.shaderProgram, sdfFrag);
  sdfgl.linkProgram(sdfglData.shaderProgram);

  if (!sdfgl.getProgramParameter(sdfglData.shaderProgram, sdfgl.LINK_STATUS)) {
    console.error('Failed to link shader program: ', sdfgl.getProgramInfoLog(sdfglData.shaderProgram));
    return;
  }

  //Get sdf shader attribute/uniform locations
  const sdfPositionAttribLocation = sdfgl.getAttribLocation(sdfglData.shaderProgram, 'position');
  const sdfTexcoordAttribLocation = sdfgl.getAttribLocation(sdfglData.shaderProgram, 'texcoord');
  const sdfTex1Location = sdfgl.getUniformLocation(sdfglData.shaderProgram, 'texture1');
  const sdfTexelLocation = sdfgl.getUniformLocation(sdfglData.shaderProgram, 'texel');
  const sdfJumpLocation = sdfgl.getUniformLocation(sdfglData.shaderProgram, 'jump');
  const sdfFirstLocation = sdfgl.getUniformLocation(sdfglData.shaderProgram, 'first');
  //Create buffers
  const sdfPositionBuffer = sdfglData.positionBuffer;
  const sdfUvBuffer = sdfglData.uvBuffer;
  const sdfTexture1 = sdfglData.texture1;
  const sdfTexture2 = sdfglData.texture2;
  const sdfTextTexture = sdfglData.textTexture;
  const sdfFramebuffer1 = sdfglData.frameBuffer1;
  const sdfFramebuffer2 = sdfglData.frameBuffer2;

  //Bind sdf shader program
  sdfgl.useProgram(sdfglData.shaderProgram);
  //Set uniforms
  sdfgl.uniform1i(sdfTex1Location, 0); //here we bound shader's texture to TEXTURE0
  sdfgl.uniform2f(sdfTexelLocation, 1.0/sdfCanvas.width, 1.0/sdfCanvas.height);


  //Set up blank textures we will associate with framebuffers
  [sdfTexture1, sdfTexture2].forEach(texture => {
    sdfgl.bindTexture(sdfgl.TEXTURE_2D, texture);
    sdfgl.texImage2D(sdfgl.TEXTURE_2D, 0, sdfgl.RGBA, sdfCanvas.width, sdfCanvas.height, 0, sdfgl.RGBA, sdfgl.UNSIGNED_BYTE, null);
    if (isPowerOf2(sdfCanvas.width) && isPowerOf2(sdfCanvas.height)) {
      //Yes, generate mips
      sdfgl.generateMipmap(sdfgl.TEXTURE_2D);
    } else {
      sdfgl.texParameteri(sdfgl.TEXTURE_2D, sdfgl.TEXTURE_MIN_FILTER, sdfgl.LINEAR);
      sdfgl.texParameteri(sdfgl.TEXTURE_2D, sdfgl.TEXTURE_MAG_FILTER, sdfgl.LINEAR);
      sdfgl.texParameteri(sdfgl.TEXTURE_2D, sdfgl.TEXTURE_WRAP_S, sdfgl.CLAMP_TO_EDGE);
      sdfgl.texParameteri(sdfgl.TEXTURE_2D, sdfgl.TEXTURE_WRAP_T, sdfgl.CLAMP_TO_EDGE);
    }
  });
  //Set up text texture we got from the 2d canvas
  sdfgl.bindTexture(sdfgl.TEXTURE_2D, sdfTextTexture);
  sdfgl.texImage2D(sdfgl.TEXTURE_2D, 0, sdfgl.RGBA, sdfgl.RGBA, sdfgl.UNSIGNED_BYTE, textCanvas);
  if (isPowerOf2(textCanvas.width) && isPowerOf2(textCanvas.height)) {
    //Yes, generate mips
    sdfgl.generateMipmap(sdfgl.TEXTURE_2D);
  } else {
    sdfgl.texParameteri(sdfgl.TEXTURE_2D, sdfgl.TEXTURE_MIN_FILTER, sdfgl.LINEAR);
    sdfgl.texParameteri(sdfgl.TEXTURE_2D, sdfgl.TEXTURE_MAG_FILTER, sdfgl.LINEAR);
    sdfgl.texParameteri(sdfgl.TEXTURE_2D, sdfgl.TEXTURE_WRAP_S, sdfgl.CLAMP_TO_EDGE);
    sdfgl.texParameteri(sdfgl.TEXTURE_2D, sdfgl.TEXTURE_WRAP_T, sdfgl.CLAMP_TO_EDGE);
  }

  //Bind framebuffers to textures
  sdfgl.bindFramebuffer(sdfgl.FRAMEBUFFER, sdfFramebuffer1);
  sdfgl.framebufferTexture2D(sdfgl.FRAMEBUFFER, sdfgl.COLOR_ATTACHMENT0, sdfgl.TEXTURE_2D, sdfTexture1, 0);
  sdfgl.bindFramebuffer(sdfgl.FRAMEBUFFER, sdfFramebuffer2);
  sdfgl.framebufferTexture2D(sdfgl.FRAMEBUFFER, sdfgl.COLOR_ATTACHMENT0, sdfgl.TEXTURE_2D, sdfTexture2, 0);

  //let jump = Math.max(sdfCanvas.width, sdfCanvas.height)/2;
  let jump = 256;
  let first_jfa = true;
  let sdfReadTexture = sdfTextTexture;
  let sdfWriteBuffer = sdfFramebuffer1;
  let banner = createBanner();
  let sdfWriteTexture = 1;
  //Set sdfbanner positions
  sdfgl.bindBuffer(sdfgl.ARRAY_BUFFER, sdfPositionBuffer);
  sdfgl.enableVertexAttribArray(sdfPositionAttribLocation);
  sdfgl.vertexAttribPointer(sdfPositionAttribLocation, 3, sdfgl.FLOAT, false, 0, 0);
  sdfgl.bufferData(sdfgl.ARRAY_BUFFER, new Float32Array(banner.getPositionData()), sdfgl.STATIC_DRAW);
  //Set sdfbanner texture
  sdfgl.bindBuffer(sdfgl.ARRAY_BUFFER, sdfUvBuffer);
  sdfgl.enableVertexAttribArray(sdfTexcoordAttribLocation);
  sdfgl.vertexAttribPointer(sdfTexcoordAttribLocation, 2, sdfgl.FLOAT, false, 0, 0);
  sdfgl.bufferData(sdfgl.ARRAY_BUFFER, new Float32Array(banner.getUvData()), sdfgl.STATIC_DRAW);
  sdfgl.viewport(0, 0, sdfCanvas.width, sdfCanvas.height);
  //So we're using the jump flooding algorithm (JFA) to generate the SDF.  The shader above does
  //one iteration of the algorithm, and the way JFA works we have to do subsequent iterations
  //using the output of the previous one as the input to the current one, which we use these
  //framebuffers for.  So we swap the buffers, run JFA (drawArrays executes the draw call which
  //produces the next iteration), and so on until we divide our jump value down to 0, then we
  //stop.
  while (jump >= 1) {
    sdfgl.bindFramebuffer(sdfgl.FRAMEBUFFER, sdfWriteBuffer);
    sdfgl.activeTexture(sdfgl.TEXTURE0);
    sdfgl.bindTexture(sdfgl.TEXTURE_2D, sdfReadTexture);

    sdfgl.uniform1f(sdfFirstLocation, first_jfa ? 1.0 : 0.0);
    sdfgl.uniform1f(sdfJumpLocation, jump);
    sdfgl.clearColor(0, 0, 0, 0);
    sdfgl.clear(sdfgl.COLOR_BUFFER_BIT);
    //Draw banner
    sdfgl.drawArrays(sdfgl.TRIANGLES, 0, banner.numVertices());
    if (sdfWriteTexture === 1) {
      sdfReadTexture = sdfTexture1;
      sdfWriteBuffer = sdfFramebuffer2;
      sdfWriteTexture = 2;
    } else {
      sdfReadTexture = sdfTexture2;
      sdfWriteBuffer = sdfFramebuffer1;
      sdfWriteTexture = 1;
    }
    jump /= 2;
    first_jfa = false;
  }


  //WEBGL CANVAS STUFF **************************************************************

  //WebGL initialization stuff
  const bannergl = bannerglCanvas.getContext('webgl', {alpha: true});
  if (!bannergl) {
    console.error('WebGL not supported');
    return;
  }
  bannergl.enable(bannergl.BLEND);
  bannergl.blendFunc(bannergl.SRC_ALPHA, bannergl.ONE_MINUS_SRC_ALPHA);
  bannergl.viewport(0, 0, bannerglCanvas.width, bannerglCanvas.height);
  bannergl.pixelStorei(bannergl.UNPACK_FLIP_Y_WEBGL, true);

  const bannerVertSource = `
    precision lowp float;
    attribute vec3 position;
    attribute vec2 texcoord;
    varying vec2 uv;
    void main() {
      //uv = vec2(texcoord.x, -1.*texcoord.y);
      uv = texcoord;
      gl_Position = vec4(position, 1.0);
    }
  `;
  const bannerFragSource = `
    precision lowp float;
    uniform vec2 resolution;
    uniform float time;
    uniform sampler2D texture1;
    uniform float radius;
    uniform vec2 mp;
    varying vec2 uv;

    mat2 rotate2d(float angle) {
      return mat2(cos(angle),-sin(angle),
                  sin(angle),cos(angle));
    }

    mat2 scale2d(float k) {
      return mat2(k,0,
                  0,k);
    }

    float dist2d(vec2 p1, vec2 p2) {
      float x_dist = p1.x - p2.x;
      float y_dist = p1.y - p2.y;
      return sqrt(x_dist * x_dist + y_dist * y_dist);
    }

    void main() {
      vec2 shadow_uv_off = resolution/10.0;
      float r = resolution.x;
      float t = time/8.;
      vec2 st = uv;
      st = scale2d(gl_FragCoord.x/resolution.x)*st;
      if (dist2d(gl_FragCoord.xy, mp) < r) {
        st = rotate2d(dist2d(gl_FragCoord.xy, mp)/r/2.)*st;
      }
      vec4 bgcolor = vec4(1.0, 1.0, 1.0, 1.0);
      //make wavy effect on text
      vec2 text_uv = vec2(st.x, st.y+sin(16.*st.x+time)/8.*st.x);
      vec4 texcolor = texture2D(texture1,  text_uv);
      vec4 shadowcolor = texture2D(texture1,  text_uv+0.02);
      if (texcolor.a > 0.98) {
        texcolor.rgb = vec3(0.0);
        texcolor.a = 1.0;
      } else {
        texcolor.a = 0.0;
      }
      if (shadowcolor.a > 0.97) {
        shadowcolor.rgb = vec3(0.0);
        //shadowcolor.a = 0.6;
        shadowcolor.a = clamp(0.2, 0.5, shadowcolor.a);
      } else {
        shadowcolor.a = 0.0;
      }
      float alpha = texcolor.a;
      bgcolor = shadowcolor;
      vec4 finalcolor = vec4(
        texcolor.rgb * alpha + bgcolor.rgb * (1.0 - alpha),
        alpha + bgcolor.a * (1.0 - alpha)
      );
      gl_FragColor = finalcolor;
    }
  `;

  const bannerglData = {
    shaderProgram: bannergl.createProgram(),
    positionBuffer: bannergl.createBuffer(),
    uvBuffer: bannergl.createBuffer(),
    textTexture: bannergl.createTexture()
  };
  const bannerVert = createShader(bannergl, bannergl.VERTEX_SHADER, bannerVertSource);
  const bannerFrag = createShader(bannergl, bannergl.FRAGMENT_SHADER, bannerFragSource);
  bannergl.attachShader(bannerglData.shaderProgram, bannerVert);
  bannergl.attachShader(bannerglData.shaderProgram, bannerFrag);
  bannergl.linkProgram(bannerglData.shaderProgram);
  if (!bannergl.getProgramParameter(bannerglData.shaderProgram, bannergl.LINK_STATUS)) {
    console.error('Failed to link shader program: ', bannergl.getProgramInfoLog(bannerglData.shaderProgram));
    return;
  }

  //Get banner shader attribute/uniform locations
  const bannerPositionAttribLocation = bannergl.getAttribLocation(bannerglData.shaderProgram, 'position');
  const bannerResolutionUniformLocation = bannergl.getUniformLocation(bannerglData.shaderProgram, 'resolution');
  const bannerTimeUniformLocation = bannergl.getUniformLocation(bannerglData.shaderProgram, 'time');
  const bannerTexcoordAttribLocation = bannergl.getAttribLocation(bannerglData.shaderProgram, 'texcoord');
  const bannerTex1Location = bannergl.getUniformLocation(bannerglData.shaderProgram, 'texture1');
  const bannerMpUniformLocation = bannergl.getUniformLocation(bannerglData.shaderProgram, 'mp');
  const bannerRadiusUniformLocation = bannergl.getUniformLocation(bannerglData.shaderProgram, 'radius');
  //Create buffers
  const bannerPositionBuffer = bannerglData.positionBuffer;
  const bannerTextUvBuffer = bannerglData.uvBuffer;
  const bannerTextTexture = bannerglData.textTexture;

  //Create texture 0
  sdfgl.bindFramebuffer(sdfgl.FRAMEBUFFER, sdfWriteBuffer === sdfFramebuffer1 ? sdfFramebuffer2 : sdfFramebuffer1);
  const pixels = new Uint8Array(sdfCanvas.width * sdfCanvas.height * 4);
  sdfgl.readPixels(0, 0, sdfCanvas.width, sdfCanvas.height, sdfgl.RGBA, sdfgl.UNSIGNED_BYTE, pixels);
  bannergl.activeTexture(bannergl.TEXTURE0); //because we bound the texture to TEXTURE0 above
  bannergl.bindTexture(bannergl.TEXTURE_2D, bannerTextTexture);
  bannergl.texImage2D(bannergl.TEXTURE_2D, 0, bannergl.RGBA, sdfCanvas.width, sdfCanvas.height, 0, bannergl.RGBA, bannergl.UNSIGNED_BYTE, pixels);
  if (isPowerOf2(sdfCanvas.width) && isPowerOf2(sdfCanvas.height)) {
    //Yes, generate mips
    bannergl.generateMipmap(bannergl.TEXTURE_2D);
  } else {
    //bannergl.texImage2D(bannergl.TEXTURE_2D, 0, bannergl.RGBA, bannergl.RGBA, bannergl.UNSIGNED_BYTE, textCanvas);
    bannergl.texParameteri(bannergl.TEXTURE_2D, bannergl.TEXTURE_WRAP_S, bannergl.CLAMP_TO_EDGE);
    bannergl.texParameteri(bannergl.TEXTURE_2D, bannergl.TEXTURE_WRAP_T, bannergl.CLAMP_TO_EDGE);
    bannergl.texParameteri(bannergl.TEXTURE_2D, bannergl.TEXTURE_MIN_FILTER, bannergl.LINEAR);
  }

  const render = () => {
    bannergl.bindFramebuffer(bannergl.FRAMEBUFFER, null);
    bannergl.viewport(0, 0, bannerglCanvas.width, bannerglCanvas.height);
    bannergl.clearColor(0, 0, 0, 0);
    bannergl.clear(bannergl.COLOR_BUFFER_BIT);
    //Bind banner shader program
    bannergl.useProgram(bannerglData.shaderProgram);
    //Set banner positions
    bannergl.bindBuffer(bannergl.ARRAY_BUFFER, bannerPositionBuffer);
    bannergl.enableVertexAttribArray(bannerPositionAttribLocation);
    bannergl.vertexAttribPointer(bannerPositionAttribLocation, 3, bannergl.FLOAT, false, 0, 0);
    bannergl.bufferData(bannergl.ARRAY_BUFFER, new Float32Array(banner.getPositionData()), bannergl.STATIC_DRAW);
    //Set banner texture
    bannergl.bindBuffer(bannergl.ARRAY_BUFFER, bannerTextUvBuffer);
    bannergl.enableVertexAttribArray(bannerTexcoordAttribLocation);
    bannergl.vertexAttribPointer(bannerTexcoordAttribLocation, 2, bannergl.FLOAT, false, 0, 0);
    bannergl.bufferData(bannergl.ARRAY_BUFFER, new Float32Array(banner.getUvData()), bannergl.STATIC_DRAW);

    bannergl.activeTexture(bannergl.TEXTURE0);
    bannergl.bindTexture(bannergl.TEXTURE_2D, bannerTextTexture);

    //Set uniforms
    bannergl.uniform2f(bannerResolutionUniformLocation, bannerglCanvas.width, bannerglCanvas.height);
    bannergl.uniform1i(bannerTex1Location, 0); //we bound bannerTex1 to TEXTURE0
    bannergl.uniform1f(bannerTimeUniformLocation, performance.now()/2048);
    bannergl.uniform1f(bannerRadiusUniformLocation, bannerglCanvas.height);
    bannergl.uniform2f(bannerMpUniformLocation, mouseX, mouseY);
    //Draw banner
    bannergl.drawArrays(bannergl.TRIANGLE_STRIP, 0, banner.numVertices());
    requestAnimationFrame(render);
  };
  const animationId = requestAnimationFrame(render);
}
sdfTextBannerCanvas();
