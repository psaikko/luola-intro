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

var view_distance = heightmap_h / 2;

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

  for (var d = view_distance; d > 0; --d) {
    var lx = player_x - d;
    var rx = player_x + d;

    var map_y = player_y - d;

    // sample pl..pr line for each x pixel
    for (var xi = 0; xi < viewport_w; ++xi) {
      var map_x = lx + xi * (rx - lx) / viewport_w;
      var map_h = heightmap_mat[map_y | 0][map_x | 0];

      var viewport_y = horizon + (player_h - map_h) / d * h_scale;
      var color = [map_h,map_h,255*(d / view_distance)];

      if (viewport_y < viewport_h)
        vertLine(arr, xi, viewport_y, viewport_h, color);
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

  var amp_min = 1;
  var amp_max = 10;
  var total_amp = 0;

  var freq_min = 1;
  var freq_max = 10;

  for (var i = 0; i < n_components; ++i) {
    directions.push(Math.random() * Math.PI * 2);
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

function draw() {    
  
  //vertLine(buffer, w/2, 0, h, [255,255,0]);

  generateHeightmap(20);
  drawHeightmap(heightmap_buffer);

  drawViewport(viewport_buffer);
  
  heightmap_g.putImageData(heightmap_imagedata, 0, 0);
  viewport_g.putImageData(viewport_imagedata, 0, 0);
};

draw();