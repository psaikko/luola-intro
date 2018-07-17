"use strict";

var canvas = document.getElementById("viewport");
var g = canvas.getContext("2d");

var moveSpeed, rotSpeed;
    
var w = canvas.width,
    h = canvas.height;
    
function vertLine(arr, x, yStart, yEnd, color){
  for (var y = yStart | 0; y < yEnd | 0; y++) {
    var i = 4 * (w * y) + 4 * x;
    arr[i + 0] = color[0];
    arr[i + 1] = color[1];
    arr[i + 2] = color[2];
    arr[i + 3] = 255;
  }
};
 
function generateTerrain(arr, terrain_w, terrain_h, n_components) {

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
    frequenqies.push(freq_min + Math.random() * (freq_max - freq_min));
    amplitudes.push(amp_min + Math.random() * (amp_max - amp_min));
    total_amp += amplitudes[i];
  }

  for (var y = 0; y < terrain_h; ++y) {
    for (var x = 0; x < terrain_w; ++x) {
      var ht = 0; 

      // add sine wave components
      for (var c = 0; c < n_components; ++c) {
        var v = Math.sin(directions[c])*x + Math.cos(directions[c])*y;
        ht += amplitudes[c] * 
              (1 + Math.sin(v / terrain_w * Math.PI * 2 * frequenqies[c])) / 2;
      }
      
      // normalize to 0..255
      ht /= total_amp;
      ht *= 255;

      var color = [ht,ht,ht];

      var i = 4 * (terrain_w * y) + 4 * x;
      arr[i + 0] = color[0];
      arr[i + 1] = color[1];
      arr[i + 2] = color[2];
      arr[i + 3] = 255;
    }
  }

};

var imagedata = g.getImageData(0,0,w,h);
var buffer = imagedata.data;

function draw() {    
  
  //vertLine(buffer, w/2, 0, h, [255,255,0]);

  generateTerrain(buffer, w, h, 40);
  
  g.putImageData(imagedata, 0, 0);
};

draw();