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
var viewport_buffer = viewport_imagedata.data;

var heightmap_imagedata = heightmap_g.getImageData(0,0,heightmap_w,heightmap_h);
var heightmap_buffer = heightmap_imagedata.data;
    
var heightmap_mat = [];
for (var i = 0; i < heightmap_h; ++i)
  heightmap_mat.push([]);

var player_x = heightmap_w / 2;
var player_y = heightmap_h / 2;
var player_h = 100;
var player_dir = 0;

var far_distance = heightmap_h / 2;
var near_distance = 1;
var focal_length = viewport_w / 2; // 90 degree fov

function vertLine(arr, x, y_start, y_end, color){
  for (var y = y_start | 0; y < y_end | 0; y++) {
    var i = 4 * (viewport_w * y) + 4 * x;
    arr[i + 0] = color[0];
    arr[i + 1] = color[1];
    arr[i + 2] = color[2];
    arr[i + 3] = 255;
  }
};

function drawViewport(arr) {

  var horizon = viewport_h / 2;
  var h_scale = 50;

  for (var d = far_distance; d >= near_distance; --d) {
    var map_w = viewport_w * (d / focal_length);
    /*
    var lx = player_x - (map_w / 2);
    var rx = player_x + (map_w / 2);

    var ly = player_y - d;
    var ry = player_y - d;
    */

    var lx = player_x - 
      (d * Math.sin(player_dir) + map_w / 2 * Math.sin(-(Math.PI / 2 - player_dir)));
    var rx = player_x - 
      (d * Math.sin(player_dir) - map_w / 2 * Math.sin(-(Math.PI / 2 - player_dir)));

    var ly = player_y - 
      (d * Math.cos(player_dir) - map_w / 2 * Math.cos(-(Math.PI / 2) - player_dir));
    var ry = player_y - 
      (d * Math.cos(player_dir) + map_w / 2 * Math.cos(-(Math.PI / 2) - player_dir));

    if (d == far_distance) {
      heightmap_g.strokeStyle = "rgb(255,0,0)";
      heightmap_g.beginPath();
      heightmap_g.moveTo(player_x, player_y);
      heightmap_g.lineTo(player_x - d * Math.sin(player_dir), player_y - d * Math.cos(player_dir));
      heightmap_g.stroke();
      heightmap_g.closePath();
    }



    //if (d == far_distance) {
      heightmap_g.strokeStyle = "rgb(0,255,0)";
      heightmap_g.beginPath();
      heightmap_g.moveTo(lx, ly);
      heightmap_g.lineTo(rx, ry);
      heightmap_g.stroke();
      heightmap_g.closePath();
    //}

    // sample pl..pr line for each x pixel
    for (var i = 0; i < viewport_w; ++i) {
      var map_x = lx + i * (rx - lx) / viewport_w;
      var map_y = ly + i * (ry - ly) / viewport_w;

      //console.log(map_x, map_y);
      if (map_x < 0 || map_x >= heightmap_w || map_y < 0 || map_y >= heightmap_h)
        continue;

      var map_h = heightmap_mat[map_y | 0][map_x | 0];

      var viewport_y = horizon + (player_h - map_h) / d * h_scale;
      var color = [map_h,map_h,map_h];
      if (map_h == 0) color = [50,100,255];

      if (viewport_y < viewport_h)
        vertLine(arr, i, viewport_y, viewport_h, color);
    }
  }

};
 
function drawHeightmap(arr) {
  for (var y = 0; y < heightmap_h; ++y) {
    for (var x = 0; x < heightmap_w; ++x) {

      var ht = heightmap_mat[y][x];
      var color = [ht,ht,ht];

      var i = 4 * (heightmap_w * y) + 4 * x;
      arr[i + 0] = color[0];
      arr[i + 1] = color[1];
      arr[i + 2] = color[2];
      arr[i + 3] = 255;

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

      heightmap_mat[y][x] = ht;
    }
  }

};

function init() {
  generateHeightmap(20);
  drawHeightmap(heightmap_buffer);
  heightmap_g.putImageData(heightmap_imagedata, 0, 0);
}

function update() {
  player_dir += 0.02;
}

function draw() {    

  viewport_g.clearRect(0, 0, viewport_w, viewport_h);

  drawHeightmap(heightmap_buffer);
  heightmap_g.putImageData(heightmap_imagedata, 0, 0);

  drawViewport(viewport_buffer);
  viewport_g.putImageData(viewport_imagedata, 0, 0);

};

function tick() {
  update();
  draw();

  window.requestAnimationFrame(tick);
}

init();
draw();

tick();