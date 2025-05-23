function paintBanner() {
  const colinput = document.getElementById("colorinput");
  const bancanvas = document.getElementById("bannercanvas");
  const context = bancanvas.getContext("2d");
  const rect = bancanvas.getBoundingClientRect();
  const date = new Date();

  var PAINTING = false;
  var last_point = {x: 0, y: 0};

  const bannerImage = new Image();
  bannerImage.src = "./freegoats_acid.png";
  bannerImage.addEventListener("load", function () {
    //Copy image to the texture
    context.drawImage(bannerImage, 0, 0, rect.width, rect.height);

    var z_stack = [];
    var y_stack = [];
    
    const drawPoint = function(e) {
      const red_hex = colinput.value.substring(1, 3);
      const green_hex = colinput.value.substring(3, 5);
      const blue_hex = colinput.value.substring(5, 7);
      const red = parseInt(red_hex, 16);
      const green = parseInt(green_hex, 16);
      const blue = parseInt(blue_hex, 16);
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      last_point.x = x;
      last_point.y = y;
      var imageData = context.getImageData(0, 0, rect.width, rect.height);
      var data = imageData.data;
      const RED = (y * (rect.width * 4)) + (x * 4);
      const GREEN = RED+1;
      const BLUE = GREEN+1;
      const ALPHA = BLUE+1;
      imageData.data[RED] = red;
      imageData.data[GREEN] = green;
      imageData.data[BLUE] = blue;
      imageData.data[ALPHA] = 255;
      context.putImageData(imageData, 0, 0, 0, 0, rect.width, rect.height);
    };

    const drawLine = function(e) {
      const red_hex = colinput.value.substring(1, 3);
      const green_hex = colinput.value.substring(3, 5);
      const blue_hex = colinput.value.substring(5, 7);
      const red = parseInt(red_hex, 16);
      const green = parseInt(green_hex, 16);
      const blue = parseInt(blue_hex, 16);
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      var imageData = context.getImageData(0, 0, rect.width, rect.height);
      var data = imageData.data;

      var l_x = x;
      var l_y = y;
      while(l_y != last_point.y && l_x != last_point.x) {
        const RED = (l_y * (rect.width * 4)) + (l_x * 4);
        const GREEN = RED+1;
        const BLUE = GREEN+1;
        const ALPHA = BLUE+1;
        imageData.data[RED] = red;
        imageData.data[GREEN] = green;
        imageData.data[BLUE] = blue;
        imageData.data[ALPHA] = 255;
        
        const data_top = {x: l_x, y: l_y+1};
        const data_left = {x: l_x+1, y: l_y};
        const data_right = {x: l_x-1, y: l_y};
        const data_bot = {x: l_x, y: l_y-1};

        const dist_top = Math.sqrt(Math.pow(data_top.x-last_point.x, 2) + Math.pow(data_top.y - last_point.y, 2));
        const dist_left = Math.sqrt(Math.pow(data_left.x-last_point.x, 2) + Math.pow(data_left.y - last_point.y, 2));
        const dist_right = Math.sqrt(Math.pow(data_right.x-last_point.x, 2) + Math.pow(data_right.y - last_point.y, 2));
        const dist_bot = Math.sqrt(Math.pow(data_bot.x-last_point.x, 2) + Math.pow(data_bot.y - last_point.y, 2));

        if (dist_top <= dist_left && dist_top <= dist_right && dist_top <= dist_bot) {
          l_x = data_top.x;
          l_y = data_top.y;
        } else if (dist_left <= dist_top && dist_left <= dist_right && dist_left <= dist_bot) {
          l_x = data_left.x;
          l_y = data_left.y;
        } else if (dist_right <= dist_top && dist_right <= dist_left && dist_right <= dist_bot) {
          l_x = data_right.x;
          l_y = data_right.y;
        } else {
          l_x = data_bot.x;
          l_y = data_bot.y;
        }
      }
    context.putImageData(imageData, 0, 0, 0, 0, rect.width, rect.height);
    };

    bancanvas.addEventListener("mousedown", function (e) {
      PAINTING = true;
      drawPoint(e);
    });
    bancanvas.addEventListener("mouseup", function (e) {
      drawLine(e);
      drawPoint(e);
      z_stack.push(context.getImageData(0, 0, rect.width, rect.height));
      y_stack = [];
      PAINTING = false;
    });
    bancanvas.addEventListener("mousemove", function (e) {
      if (PAINTING) {
        drawLine(e);
        drawPoint(e);
      }
    });
    bancanvas.addEventListener("keydown", function (e) {
      if (e.ctrlKey && e.key === "z") {
        if (z_stack.length > 0) {
          const back = z_stack.pop();
          y_stack.push(back);
          context.putImageData(back, 0, 0, 0, 0, rect.width, rect.height);
        }
      }
      if (e.ctrlKey && e.key === "y") {
        if (y_stack.length > 0) {
          const back = y_stack.pop();
          z_stack.push(back);
          context.putImageData(back, 0, 0, 0, 0, rect.width, rect.height);
        }
      }
    });
  });
}
paintBanner();
