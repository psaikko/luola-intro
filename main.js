"use strict";

var viewport = document.getElementById("viewport");
var viewport_g = viewport.getContext("2d");
    
var viewport_w = viewport.width,
    viewport_h = viewport.height;

var heightmap = document.getElementById("heightmap");
var heightmap_g = heightmap.getContext("2d");
    
var heightmap_w = heightmap.width,
    heightmap_h = heightmap.height;

var viewport_imagedata = viewport_g.getImageData(0,0,viewport_w,viewport_h);
var viewport_buffer32 = new Uint32Array(viewport_imagedata.data.buffer);

var heightmap_imagedata = heightmap_g.getImageData(0,0,heightmap_w,heightmap_h);
var heightmap_buffer32 = new Uint32Array(heightmap_imagedata.data.buffer);

var heightmap_arr = new Uint8ClampedArray(heightmap_w * heightmap_h);

var player_x = heightmap_w / 2;
var player_y = heightmap_h / 2;
var player_h = 100;
var player_dir = 0;

var far_distance = heightmap_w / 2;
var near_distance = 1;
var focal_length = viewport_w / 2; // 90 degree fov

function vertLine(arr, x, y_start, y_end, r, g, b){
  for (var y = y_start | 0; y < y_end | 0; y++) {
    var i = viewport_w * y + x;

    var v = 255 << 24;
    v |= b << 16;
    v |= g << 8;
    v |= r;
    
    arr[i] = v;
  }
};

function drawViewport(arr) {

  var horizon = viewport_h / 2;
  var h_scale = 50;

  // y-buffer for drawing front-to-back
  var y_buf = [];
  for (var i = 0; i < viewport_w; ++i) 
    y_buf[i] = viewport_h;

  var half_fov_angle = Math.atan(viewport_w / (2 * focal_length));
  var cos_hfa = Math.cos(half_fov_angle);

  var l_sin = Math.sin(player_dir + half_fov_angle);
  var l_cos = Math.cos(player_dir + half_fov_angle);

  var r_sin = Math.sin(player_dir - half_fov_angle);
  var r_cos = Math.cos(player_dir - half_fov_angle);

  

  for (var d = near_distance; d <= far_distance; ++d) {
    
    var d_ = d / cos_hfa;

    var lx = player_x + d_ * l_sin;
    var ly = player_y + d_ * l_cos;

    var rx = player_x + d_ * r_sin;
    var ry = player_y + d_ * r_cos;
    
    // draw fov cone on heightmap
    
    heightmap_g.strokeStyle = "rgb(0,255,0)";
    heightmap_g.beginPath();
    
    heightmap_g.moveTo(lx, ly);
    heightmap_g.lineTo(rx, ry);
    heightmap_g.stroke();

    heightmap_g.closePath();
    
    
    // sample pl..pr line for each x pixel
    var dx = (rx - lx) / viewport_w;
    var dy = (ry - ly) / viewport_w;

    for (var i = 0; i < viewport_w; ++i) {
      
      var map_x = (lx + i * dx) | 0;
      var map_y = (ly + i * dy) | 0;
      
      //var map_x = 1, map_y = 1;

      //console.log(map_x, map_y);
      if (map_x < 0 || map_x >= heightmap_w || map_y < 0 || map_y >= heightmap_h)
        continue;

      //var map_h = heightmap_mat[map_y][map_x];
      var map_h = heightmap_arr[map_y * heightmap_w + map_x];

      var viewport_y = horizon + (player_h - map_h) / d * h_scale;
      /*
      if (viewport_y >= viewport_h)
        continue;
      */
      var color = [map_h,map_h,map_h];
      var r = map_h,
          g = map_h,
          b = map_h;

      if (map_h == 0) {
        r = 50;
        g = 100;
        b = 255;
      }

      vertLine(arr, i, viewport_y, y_buf[i], r, g, b);

      y_buf[i] = Math.min(viewport_y, y_buf[i]);

    }
  }

  // clear sky
  for (var i = 0; i < viewport_w; ++i)
    vertLine(arr, i, 0, y_buf[i], 150,150,255);
};
 
function drawHeightmap(arr) {
  for (var y = 0; y < heightmap_h; ++y) {
    for (var x = 0; x < heightmap_w; ++x) {

      var ht = heightmap_arr[y * heightmap_w + x];

      var v = 255 << 24;
      v |= ht << 16;
      v |= ht << 8;
      v |= ht;

      var i = heightmap_w * y + x;
      arr[i] = v;
    }
  }
}

function generateHeightmap(n_components) {

  var directions = [];
  var amplitudes = [];
  var frequenqies = [];

  var total_amp = 0;

  for (var i = 0; i < n_components; ++i) {
    //directions.push(Math.random() * Math.PI * 2);
    directions.push(i+1);
    //frequenqies.push(freq_min + Math.random() * (freq_max - freq_min));
    //amplitudes.push(amp_min + Math.random() * (amp_max - amp_min));
    frequenqies.push(i+1);
    amplitudes.push(n_components - i);
    total_amp += amplitudes[i];
  }

  for (var y = 0; y < heightmap_h; ++y) {
    for (var x = 0; x < heightmap_w; ++x) {
      var ht = 0; 

      // add sine wave components
      for (var c = 0; c < n_components; ++c) {
        var v = Math.sin(directions[c])*x + Math.cos(directions[c])*y;
        ht += amplitudes[c] * 
              (1 + Math.sin(v / heightmap_w * Math.PI * 2 * frequenqies[c])) / 2;
      }
      
      // normalize to 0..255
      ht /= total_amp;
      ht *= 255;
      // clip values below 126 for "water level"
      ht = (ht > 126) ? (ht-126)*2 : 0;

      heightmap_arr[y * heightmap_w + x] = ht;
    }
  }

};

function init() {
  generateHeightmap(20);
}

function update() {
  player_dir -= 0.01;
}

function draw() {    
  
  drawHeightmap(heightmap_buffer32);
  heightmap_g.putImageData(heightmap_imagedata, 0, 0);

  //heightmap_g.strokeStyle = "rgb(0,255,0)";


  drawViewport(viewport_buffer32);
  viewport_g.putImageData(viewport_imagedata, 0, 0);
  
};

var prev_time = 0;
var ticks = 0;
var tick_time = 0;

function tick(timestamp) {
  ++ticks;
  var tick_start = new Date().getTime();

  document.getElementById("fps").innerHTML = "" + 1000 / (timestamp - prev_time);
  document.getElementById("frametime").innerHTML = "" + tick_time / ticks;

  prev_time = timestamp;

  update();
  draw();

  var tick_end = new Date().getTime();
  tick_time += (tick_end - tick_start);

  window.requestAnimationFrame(tick);
}

init();
window.requestAnimationFrame(tick);