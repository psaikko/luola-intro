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
 
var imagedata = g.getImageData(0,0,w,h);
var buffer = imagedata.data;

function draw() {    
  
  vertLine(buffer, w/2, 0, h, [255,255,0]);
  
  g.putImageData(imagedata, 0, 0);
};

draw();