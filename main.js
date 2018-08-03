//
// Audio
//

var data = [r=1];

function rng() { return .5+(r = (16807*r + 1)|0)/8e9; }

var audio_data ;
var k = 100;
for (var i = 0; i < 960000; i++) {
  var x = i % 8000

/*
  var bt0 = beat_time(i, sample_rate, 10);

  var bi = beat_idx(i, sample_rate, 10);
*/
  if (!x) k *= Math.pow(1.06,rng()*8-4|0);

  //data[i] = 0;
  audio_data += String.fromCharCode(70 * ((i%k)/k + (i%k/2)/k/2 * (1-x/8000) + 1 - rng()*(i%2000)/2000) | 0); 
  //if (bi % 10 < 3) data[i] += (66 * noise(i, sample_rate, f1) * bt0 * bt0) | 0; 
}

//
// Video
//

document.body.style = "margin:0"
document.body.innerHTML = "<canvas id=2d width=960 height=540 style='width:100%;height:100%;cursor:none'>";
new Audio("data:audio/wav;base64,"+btoa("RIFF$\xa6\x0e\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x80>\x00\x00\x01\x00\x08\x00data\x00\xa6\x0e\x00"+audio_data)).play();

var viewport_g = document.getElementById("2d").getContext("2d");
var viewport_w = 960;
var viewport_h = 540;
    
var heightmap_dim = 1<<8;

var viewport_imagedata = viewport_g.getImageData(0,0,viewport_w,viewport_h);
var buffer = viewport_imagedata.data;

var player_x = 200;
var player_y = r = 6;
var player_h = 150;

var far_distance = 540;

var water_level = 145;
var h_scale = 960;

function px(x,y) {
  var j = (viewport_w*y + x)*4;
  buffer[j++] = r;
  buffer[j++] = g;
  buffer[j++] = b;
  buffer[j++] = 255;
}

function vertLine(x, y_start, y_buf){
  for (var i = y_start|0; i < y_buf; i++)
    px(x,i), px(x, viewport_h-i)
}

function getSample(x, y) {
  return data[((x|0)+heightmap_dim)%heightmap_dim + 
                       ((y|0)+heightmap_dim)%heightmap_dim * heightmap_dim];
}

function drawViewport() {

  for (var i = 0; i < viewport_w; i++) {
    var y_buf = viewport_h;

    for (var d = 0; d < far_distance; d++) {

      var my = player_y + d /2;
      var mx = (player_x + d/2 + i * -d / viewport_w)|0;

      var map_h = getSample(mx,my);

      //var viewport_y_top = horizon - (player_h - map_h) / d * h_scale;

      var fog = 1 - d / far_distance;

      var viewport_y = viewport_h/2 + (player_h - map_h) / d * h_scale;

      var depth = Math.min(1,Math.pow(map_h / water_level, 8));

      var wave = getSample(mx*2+player_y, my*4+player_y*2)/2*fog*(1-depth)

      r = wave + map_h*fog*depth*.8;
      g = 1.6*wave + map_h*fog*depth*.5;
      b = wave + map_h*fog*depth*.3;        

      vertLine(i, Math.max(viewport_y, viewport_h/2), y_buf);
      y_buf = Math.min(viewport_y, y_buf);
    }

    // clear sky
    vertLine(i, viewport_h/2, y_buf);
  }
};

function color(avg, depth) {
  var p = depth / heightmap_dim * 2;
  return avg/4 * (1-p) + rng()*255 * p;
}

var skip = heightmap_dim/2;
var diamond = 1;

while (skip|0) {
  var odd = 0;
  for (var y = 0; y < heightmap_dim; y += skip) {
    if (diamond)
      y+=skip;
    for (var x = (diamond||!odd) ? skip : 0; x < heightmap_dim; x += skip*2)
      data[x + heightmap_dim * y] = color(diamond ? getSample(x-skip,y-skip) + getSample(x+skip,y-skip) + getSample(x-skip,y+skip) + getSample(x+skip,y+skip) :
                          getSample(x-skip,y) + getSample(x+skip,y) + getSample(x,y-skip) + getSample(x,y+skip), skip)|0;
    odd = !odd;
  }
  
  if (diamond = !diamond) skip /= 2;
}

(function tick() {
  
  player_y += .4;
  
  drawViewport();

  viewport_g.putImageData(viewport_imagedata, 0, 0);

  window.setTimeout(tick,0);
})();
