/** A set of tools for the Vivid visualizer. */


const options = {bars: true, wave: false, circle: false};
const controls = {
  bars: document.getElementById("bars"),
  wave: document.getElementById("wave"),
  circle: document.getElementById("circle"),
};

for (let option of Object.keys(options)) {
  let control = controls[option];
  control && control.addEventListener("click", () => {
    options[option] = !options[option];
    control.classList.toggle("off");
  });
}



class Controller {

  constructor(canvas, upload) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
  	this.player = null;
  	this.song = null;
  	this.bars = new Bars();
  	this.wave = new Wave();
  	this.circle = new Circle();
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
    let w = this.canvas.width;
    let h = this.canvas.height;
    this.context.clearRect(0, 0, w, h);
    if (this.player.loaded) {
		  if (options.bars) this.bars.draw(this.player, this.canvas, this.context);
		  if (options.wave) this.wave.draw(this.player, this.canvas, this.context);
		  if (options.circle) this.circle.draw(this.player, this.canvas, this.context);
    }
  }

}


/* Draw equalizer bars. */    
class Bars {
    
  constructor() {
    this.gap = 5;
    this.bottom = 5;
    this.start = 0;
    this.range = 64;  // Array range
    this.count = 64;  // Bar count
  }
        
  draw(player, canvas, context) {
    let max = 0.6 * canvas.height;
    let array = player.equalizer();
    let width = (canvas.width - (this.count + 1) * this.gap) / this.count;
    let step = Math.floor(this.range / Math.min(this.count, this.range));
    for (let i = 0; i < this.count; i++) {
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
class Wave {

	draw(player, canvas, context) {
    context.lineWidth = 3;
    context.strokeStyle = "white";
		context.beginPath();
		context.moveTo(0, canvas.height/2);
		let array = player.waveform();
		for (let i = 0; i < array.length; i += array.length / 1024)
			context.lineTo(i*canvas.width/1024, (3/4 - array[i]/255/2)*canvas.height);
		context.stroke();
	}

}


/* Bass circle. */
class Circle {

  constructor() {
    this.last = 0;
    this.count = 3;
  }

  draw(player, canvas, context) {
    let bass = player.equalizer().slice(0, this.count).reduce((a, b) => a + b) / 256 / this.count;
    let average = (bass + this.last) / 2;
    this.last = bass;
    context.lineWidth = 3;
    context.strokeStyle = "white";
    context.beginPath();
    context.arc(canvas.width / 2, canvas.height / 2, 150 * average, 0, 2*Math.PI);
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


