//
// Audio
//

var data = Array(60*8000);

function wave(i, freq) {
  return Math.sin(i * 2 * Math.PI / 8000 * freq) > 0 ? 0 : 255;
}

for (var i = 0; i < 60*8000; ++i) {
  data[i] = wave(i, 220 * (2 + Math.sin(i * 2 * Math.PI / 8000 * 0.1))); 
}

function bytesToString(bs) {
  var s = "";
  for (var i = 0; i < bs.length; ++i)
    s += String.fromCharCode(bs[i]);
  return s;
}

var header = "RIFF$\xa6\x0e\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00@\x1f\x00\x00@\x1f\x00\x00\x01\x00\x08\x00data\x00\xa6\x0e\x00";
document.body.innerHTML = '<audio autoplay src="data:audio/wav;base64,'+btoa(header + bytesToString(data))+'"></audio>'

//
// Video
//

document.body.innerHTML += "<canvas id='V' width='800' height='600' style='width: 100%;height 100%;'></canvas>"

var viewport = document.getElementById("V");
var viewport_g = viewport.getContext("2d");
    
var viewport_w = 800,
    viewport_h = 600;
    
var heightmap_w = 256,
    heightmap_h = 256;

var viewport_imagedata = viewport_g.getImageData(0,0,viewport_w,viewport_h);
var viewport_buffer32 = new Uint32Array(viewport_imagedata.data.buffer);

var player_x = 0;
var player_y = 0;
var player_h = 100;
var player_dir = 0;

var ceil_h = 1000;

var far_distance = 200;

var water_level = 140;

var n_components = 15;
var intensity = 2;

function vertLine(x, y_start, y_end, r, g, b){
  for (var y = y_start|0; y < y_end; y++) {    
    viewport_buffer32[viewport_w * y + x] = (255<<24)+(b<<16)+(g<<8)+r;
  }
};

function drawViewport() {

  var horizon = viewport_h / 2;
  var h_scale = 30;  

  // y-buffers for drawing front-to-back
  var y_buf = [];
  var y_buf_top = [];
  for (var i = 0; i < viewport_w; ++i) {
    y_buf[i] = viewport_h;
    y_buf_top[i] = 0;
  }
    
  var l_sin = Math.sin(player_dir + .8) * .7;
  var l_cos = Math.cos(player_dir + .8) * .7;

  var r_sin = Math.sin(player_dir - .8) * .7;
  var r_cos = Math.cos(player_dir - .8) * .7;

  var terrain_h = evalHeightmap(player_x, player_y);//heightmap_arr[(player_y|0) * heightmap_w + (player_x|0)];

  var d_incr = .01;
  for (var d = 4; d <= far_distance; d += d_incr) {
    
    d_incr *= 1.02;

    var lx = player_x + d * l_sin;
    var ly = player_y + d * l_cos;

    var rx = player_x + d * r_sin;
    var ry = player_y + d * r_cos;
    
    // sample pl..pr line for each x pixel
    var dx = (rx - lx) / viewport_w;
    var dy = (ry - ly) / viewport_w;

    for (var i = 0; i < viewport_w; ++i) {

      var map_h = evalHeightmap(lx + i * dx, ly + i * dy);

      var map_top = map_h * map_h * map_h / 10000;

      var viewport_y_top = horizon - ((ceil_h - terrain_h) + player_h - map_top) / d * h_scale;

      terrain_h = terrain_h < water_level ? water_level : terrain_h;

      var viewport_y = horizon + (terrain_h + player_h - map_h) / d * h_scale;

      var r = map_h * 0.8,
          g = r * 0.6,
          b = r * 0.3;

      var fog = 1 - (d * d / (far_distance * far_distance));

      // ceiling

      //vertLine(i, y_buf_top[i], Math.min(viewport_y_top, y_buf[i]), r * fog, g * fog, b * fog); // ceil

      // floor

      if (map_h < water_level) {
        var depth = 0; 
        r = 50;
        g = 100;
        b = 255;
        viewport_y = horizon + (terrain_h + player_h - water_level) / d * h_scale;
      }

      vertLine(i, Math.max(y_buf_top[i], viewport_y), y_buf[i], r * fog, g * fog, b * fog); // bot


      //y_buf_top[i] = Math.max(viewport_y_top, y_buf_top[i]);
      y_buf[i] = Math.min(viewport_y, y_buf[i]);

    }
  }

  // clear sky
  for (var i = 0; i < viewport_w; ++i)
    vertLine(i, y_buf_top[i], y_buf[i], 0,0,0);
};


//function generateHeightmap(n_components) {

  var x_freq = [];
  var y_freq = [];
  var amplitudes = [];

  var total_amp = 0;

  for (var i = 0; i < n_components; ++i) {
    //directions.push(i+1);

    x_freq.push((Math.random() * (i+5)*intensity) | 0);
    y_freq.push((Math.random() * (i+5)*intensity) | 0);
    amplitudes.push((n_components - i) * (n_components - i));
    total_amp += amplitudes[i];
  }

function evalHeightmap(x, y) {
  var ht = 0; 

  // add sine wave components
  for (var c = 0; c < n_components; ++c) {
    var v = x_freq[c]*x + y_freq[c]*y;
    ht += amplitudes[c] * 
          (1 + Math.sin(v / heightmap_w * Math.PI * 2)) / 2;
  }

  // normalize to 0..255
  return (ht * 255 / total_amp); 
}

(function tick() {

  player_dir -= 0.004;
  player_y += 0.2;
  if (player_y < 0) player_y += heightmap_h;
  if (player_y > heightmap_h-1) player_y -= heightmap_h;
  
  drawViewport(viewport_buffer32);
  viewport_g.putImageData(viewport_imagedata, 0, 0);

  window.setTimeout(tick,0);
})();