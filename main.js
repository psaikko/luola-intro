//
// Audio
//

var heightmap_arr = [];

function wave(i, freq) {
  return Math.sin(i * .0008 * freq) > 0;
}

for (var i = 0; i < 480000; ++i) {
  heightmap_arr[i] = wave(i, 220 * (2 + Math.sin(i * .0008)))*255;
}

//
// Video
//

document.body.innerHTML = "<canvas id='V'width='800'height='600'style='width:100%;height:100%;'>";
new Audio("data:audio/wav;base64,"+btoa("RIFF$\xa6\x0e\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00@\x1f\x00\x00@\x1f\x00\x00\x01\x00\x08\x00data\x00\xa6\x0e\x00"+String.fromCharCode.apply(0, heightmap_arr))).play();

var viewport_g = document.getElementById("V").getContext("2d");
    
var viewport_w = 800;
var viewport_h = 600;
    
var heightmap_dim = 2000;

var viewport_imagedata = viewport_g.getImageData(0,0,viewport_w,viewport_h);
var viewport_buffer32 = new Uint32Array(viewport_imagedata.data.buffer);

var player_x = heightmap_dim/2;
var player_y = 0;
var player_h = 600;

var far_distance = 600;

var water_level = 160;

var t = 0;

var y_buf = [];
var y_buf_top = [];

function vertLine(x, y_start, y_end){
  for (var i = y_start|0; i < y_end; i++)
    viewport_buffer32[viewport_w * i + x] = (255<<24)+(b<<16)+(g<<8)+r;
};

function getSample(x, y) {
  return heightmap_arr[x%heightmap_dim + (y%heightmap_dim) * heightmap_dim];
}

function drawViewport() {

  var horizon = viewport_h / 2;
  var h_scale = 30;  

  // y-buffers for drawing front-to-back
  for (var i = 0; i < viewport_w; i++) {
    y_buf[i] = viewport_h;
    y_buf_top[i] = 0;
  }

  t++;

  for (var d = 0; d < far_distance; d++) {

    var lx = player_x + d /2;
    var rx = player_x - d /2;

    var my = (player_y + d /2)|0;

    for (var i = 0; i < viewport_w; i++) {
      var mx = (lx + i * (rx - lx) / viewport_w)|0;

      var map_h = getSample(mx,my);

      var map_top = map_h * map_h / 100;

      var viewport_y_top = horizon - (1000 + player_h - map_top) / d * h_scale;

      //var viewport_y = horizon + (100 + player_h - map_h) / d * h_scale;

      var fog = 1 - d / far_distance;

      var shadow = (1 + ((map_h - getSample(mx+1,my+1)) / (map_h)))/2;

      var tex = getSample(mx*5, my*30)/8;

      r = (tex + 255*7/8)*shadow*fog*.7;
      g = (tex + 255*7/8)*shadow*fog*.4;
      b = (tex + 255*7/8)*shadow*fog*.2;

      // ceiling
      vertLine(i, y_buf_top[i], viewport_y_top, viewport_h); // ceil
      
      // floor
      if (map_h < water_level) {
        var depth = map_h / water_level;
        var wave = (100 + getSample(mx*5+t,my*5+t)/10)*(1-depth)*fog;

        r = wave + depth*depth * r;
        g = wave + depth*depth * g;
        b = wave + depth*depth * b;

        map_h = water_level;
      }

      var viewport_y = horizon + (player_h - map_h) / d * h_scale;
      
      vertLine(i, viewport_y, y_buf[i]); // bot

      y_buf_top[i] = Math.max(viewport_y_top, y_buf_top[i]);
      y_buf[i] = Math.min(viewport_y, y_buf[i]);
    }
  }

  // clear sky
  for (var i = 0; i < viewport_w; i++)
    vertLine(i, y_buf_top[i], y_buf[i]);
};

var x_freq =     [ 16, 22, 19, 23, 13, 29, 27];
var y_freq =     [ 11,  6, 26,  8, 18, 10, 7 ];
var amplitudes = [ 50, 40, 32, 25, 18, 13, 5 ];

for (var i = 0; i < heightmap_dim; i++)
  for (var j = 0; j < heightmap_dim; j++) {
    var ht = 0; 

    // add sine wave components
    for (var k = 0; k < 7; k++)
      ht += amplitudes[k] * (1 + Math.sin((x_freq[k]*i + y_freq[k]*j) / 1000 * 6.18));

    heightmap_arr[j * heightmap_dim + i] = ht;
  }

(function tick() {

  //0 -= 0.002;
  
  player_y += 0.3;
  
  drawViewport();

  viewport_g.putImageData(viewport_imagedata, 0, 0);

  window.setTimeout(tick,1);
})();