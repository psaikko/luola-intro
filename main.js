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
var player_h = 10;
var player_dir = 0;

var far_distance = 300;
var near_distance = 1;
var focal_length = viewport_w / 2; // 90 degree fov

var interpolate = true;

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
  var h_scale = 20;

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

  var terrain_h = heightmap_arr[(player_y|0) * heightmap_w + (player_x|0)];

  for (var d = near_distance; d <= far_distance; d += 1) {
    
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
      
      var map_x_f = (lx + i * dx);
      var map_y_f = (ly + i * dy);

      while (map_x_f < 0) map_x_f += heightmap_w;
      while (map_y_f < 0) map_y_f += heightmap_h;

      map_x_f %= heightmap_w;
      map_y_f %= heightmap_h;

      var map_x_i = map_x_f | 0;
      var map_y_i = map_y_f | 0;

      var map_h = 0;
      var map_arr_ind = map_y_i * heightmap_w + map_x_i;

      if (interpolate) {

        var frac_x = map_x_f - map_x_i;
        var frac_y = map_y_f - map_y_i;

        var map_x_i_2 = (map_x_i + 1) % heightmap_w;
        var map_y_i_2 = (map_y_i + 1) % heightmap_h;

        map_h += heightmap_arr[map_y_i * heightmap_w + map_x_i]     * (1 - frac_x) * (1 - frac_y);
        map_h += heightmap_arr[map_y_i * heightmap_w + map_x_i_2]   * (frac_x) * (1 - frac_y);
        map_h += heightmap_arr[map_y_i_2 * heightmap_w + map_x_i]   * (1 - frac_x) * (frac_y);
        map_h += heightmap_arr[map_y_i_2 * heightmap_w + map_x_i_2] * frac_x * frac_y;
        map_h = map_h | 0;

      } else {
        map_h = heightmap_arr[map_arr_ind];
      }

      var viewport_y = horizon + (terrain_h + player_h - map_h) / d * h_scale;
      /*
      if (viewport_y >= viewport_h)
        continue;
      */
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

  var x_freq = [];
  var y_freq = [];
  var amplitudes = [];

  var total_amp = 0;

  for (var i = 0; i < n_components; ++i) {
    //directions.push(i+1);

    x_freq.push((Math.random() * (i+1)) | 0);
    y_freq.push((Math.random() * (i+1)) | 0);
    amplitudes.push((n_components - i) * (n_components - i));
    total_amp += amplitudes[i];
  }

  for (var y = 0; y < heightmap_h; ++y) {
    for (var x = 0; x < heightmap_w; ++x) {
      var ht = 0; 

      // add sine wave components
      for (var c = 0; c < n_components; ++c) {
        var v = x_freq[c]*x + y_freq[c]*y;
        ht += amplitudes[c] * 
              (1 + Math.sin(v / heightmap_w * Math.PI * 2)) / 2;
      }

      // normalize to 0..255
      ht /= total_amp;
      ht *= 255;

      // clip values below 126 for "water level"
      ht = (ht > 126) ? (ht-126)*2 : 0;

      heightmap_arr[y * heightmap_w + x] = ht | 0; 
    }
  }

};

function init() {
  generateHeightmap(50);
}

function update() {
  player_dir -= 0.004;
  player_y += 0.2;
  if (player_y < 0) player_y += heightmap_h;
  if (player_y > heightmap_h-1) player_y -= heightmap_h;
}

function draw() {
  
  drawHeightmap(heightmap_buffer32);
  heightmap_g.putImageData(heightmap_imagedata, 0, 0);

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