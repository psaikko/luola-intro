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
    
var heightmap_dim = 1<<8;

var viewport_imagedata = viewport_g.getImageData(0,0,viewport_w,viewport_h);
var buffer = viewport_imagedata.data;

var player_x = 300;
var player_y = 0;
var player_h = 160;

var far_distance = 500;

var water_level = 150;
var h_scale = 1000;  

var horizon = viewport_h / 2;

var y_buf = [];
var y_buf_top = [];

function vertLine(x, y_start, y_end){
  for (var i = y_start|0; i < y_end; i++) {
    var j = (viewport_w*i + x)*4;
    buffer[j++] = r;
    buffer[j++] = g;
    buffer[j++] = b;
    buffer[j++] = 255;
  }
}

function getSample(x, y) {
  return heightmap_arr[((x|0)+heightmap_dim)%heightmap_dim + 
                       ((y|0)+heightmap_dim)%heightmap_dim * heightmap_dim];
}

function drawViewport() {

  // y-buffers for drawing front-to-back
  for (var i = 0; i < viewport_w; i++) {
    y_buf[i] = viewport_h;
    y_buf_top[i] = 0;
  }

  for (var d = 0; d < far_distance; d++) {

    var lx = player_x + d /2;
    var rx = player_x - d /2;
    var my = player_y + d /2;

    for (var i = 0; i < viewport_w; i++) {
      var mx = (lx + i * (rx - lx) / viewport_w)|0;

      var map_h = getSample(mx,my);

      var viewport_y_top = horizon - (player_h - map_h) / d * h_scale;

      var fog = 1 - d / far_distance;

      var tex = getSample(mx, my)*fog;

      r = tex*.8;
      g = r/2;
      b = g/2;

      // floor
      if (map_h < water_level) {
        var depth = Math.pow(map_h / water_level,5);
        var wave = getSample(mx*2+player_y,my*3+player_y)/2*fog*(1-depth)

        r = wave + r * depth;
        g = 1.4*wave + g * depth;
        b = wave + b * depth;
      }

      var viewport_y = horizon + (player_h - map_h) / d * h_scale;
      
      // ceiling
      vertLine(i, y_buf_top[i], Math.min(viewport_y_top, y_buf[i])); // ceil
      // floor
      vertLine(i, Math.max(viewport_y, y_buf_top[i]), y_buf[i]); // bot

      y_buf_top[i] = Math.max(viewport_y_top, y_buf_top[i])
      y_buf[i] = Math.min(viewport_y, y_buf[i]);
    }
  }

  // clear sky
  for (var i = 0; i < viewport_w; i++) vertLine(i, y_buf_top[i], y_buf[i]);
};

var r=1

function color(avg, depth) {
  var p = depth / heightmap_dim * 2;
  return avg * (1-p) + (.5+(r = (16807*r + 1)|0)/8e9)*255 * p;
}

var skip = heightmap_dim/2;
var diamond = true;

while (skip|0) {
  var odd = false;
  for (var y = diamond ? skip : 0; y < heightmap_dim; y += diamond ? skip*2 : skip) {
    for (var x = diamond ? skip : (odd ? 0 : skip); x < heightmap_dim; x += skip*2) {
      var sum = diamond ? getSample(x-skip,y-skip) + getSample(x+skip,y-skip) + getSample(x-skip,y+skip) + getSample(x+skip,y+skip) :
                          getSample(x-skip,y) + getSample(x+skip,y) + getSample(x,y-skip) + getSample(x,y+skip);
      heightmap_arr[x + heightmap_dim * y] = color(sum/4, skip)|0;
    }
    odd = !odd;
  }
  
  if (diamond = !diamond) skip /= 2;
}

(function tick() {
  
  player_y += 0.5;
  
  drawViewport();

  viewport_g.putImageData(viewport_imagedata, 0, 0);

  window.setTimeout(tick,0);
})();
