/** A set of tools for the Vivid visualizer. */


class Controller {

  constructor(canvas, upload) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
  	this.player = null;
  	this.song = null;
  	this.bars = new Bars();
  	upload.addEventListener("input", () => this.load(upload.files[0]));
	}

	load(file) {
    if (!this.player) {  // Do setup with user input callback if not already.
      this.player = new Player();
      this.draw();
    }
    let song = Song.load(file);
		song.addEventListener("loaded", () => this.player.load(song, true));
  }

  draw() {
    requestAnimationFrame(this.draw.bind(this));

    /* Localize variables for multiple use. */
    let w = this.canvas.width;
    let h = this.canvas.height;

    /* Clear canvas. */
		this.context.clearRect(0, 0, w, h);

		/* Render visualizers if loaded. */
		if (this.player.loaded) {
		  this.bars.draw(this.player, this.canvas, this.context);
    }
  }

}


/* Draw equalizer bars. */    
class Bars {
    
  constructor() {
    this.gap = 10;
    this.bottom = 5;
    this.start = 0;
    this.range = 48;
    this.count = 48;
    this.smoothing = 0;
    this.arrays = new Array(this.smoothing);
  }
        
  draw(player, canvas, context) {
    let max = 0.6 * canvas.height;
    let array = player.equalizer();
    let width = (canvas.width - (this.range + 1) * this.gap) / this.range;
    let step = Math.round(this.range / Math.min(this.range, this.count));

    for (let i = 0; i < this.range; i++) {
      let raw = 0;
      raw = array[i * step + this.start];

      let value = Math.pow(raw / 256, 8);
      let x = Math.floor(i * (width + this.gap) + this.gap);
      let y = canvas.height - value * max;

      context.fillStyle = "hsl(" + Math.ceil(player.elapsed() * 2) % 360 + ",100%," + Math.floor(value * 45 + 5) + "%)";
      context.fillRect(x, y, Math.ceil(width), value * max - this.bottom);
    }
  }
    
}

/* Radial pulses for base. */
function Wave() {

	this.draw = function(player, canvas, context) {
	
		context.strokeStyle = "white";
		context.beginPath();
		context.moveTo(0, canvas.height/2);
		
		var array = player.getWaveform();
		for (var i = 0; i < array.length; i += array.length / 1024) {
			context.lineTo(i*canvas.width/1024, (3/4 - array[i]/255/2)*canvas.height);
		}
		
		context.stroke();
	
	}

}


let canvas = document.getElementById("canvas");
let upload = document.getElementById("file");

let resize = window.onresize = () => {
	let canvas = document.getElementById("canvas");
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight;
};

resize();

let controller = new Controller(canvas, upload);
