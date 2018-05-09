/** A set of tools for the Vivid visualizer. */



class Controller {

  player:

}







/* Convenience. */
function formatTime(seconds) {
	var s = Math.floor(seconds) % 60;
	var m = Math.floor(seconds / 60);
	return m + ":" + ("0"+s).substr(-2);
}

/* Create a player. */
var player = new Player();

/* Canvas. */
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");

/* Grab controls. */
var controls = document.getElementById("controls");
var information = document.getElementById("information")
var buttons = {
	last: document.getElementById("last"),
	play: document.getElementById("play"),
	next: document.getElementById("next"),
}
var displays = {
	volume: document.getElementById("level"),
	title: document.getElementById("title"),
	elapsed: document.getElementById("elapsed"),
	total: document.getElementById("total"),
}
var inputs = {
	time: document.getElementById("time"),
	volume: document.getElementById("volume"),
	type: document.getElementById("type"),
}

/* Set up the controls manager. */
var overlay = new (function Overlay() {

	/* Reference. */
	var that = this;

	/* Cooldown for displaying the controls. */
	this.cooldown = 0;
	this.cooldownStart = 20;
	this.cooldownInterval = 2;
	this.lastMouseX = 0;
	this.lastMouseY = 0;
	this.mouseInside = false;
	this.visible = false;
	
	/* If the time slider is being held down and how many points per second on the slider. */
	this.elapsedHeldDown = false;
    this.elapsedResolution = 25;
    this.elapsedGhostValue = 0;  /* For when manually panning. */
    
    /* Visualizers. */
    this.visualizers = {};
    this.visualizers.bars = new Bars();
    this.visualizers.wave = new Wave();
    this.visualizer = this.visualizers.bars;
    
	/* Bind mouse move to showing the controls. */
	document.addEventListener("mousemove", function(event) {
		that.cooldown = that.cooldownStart;
		that.lastMouseX = event.x;
		that.lastMouseY = event.y;
		that.mouseInside = true;
        that.show();
		that.visible = true;
	});
	
	/* Change visualizer. */
	inputs.type.addEventListener("change", function() {
		console.log(inputs.type.value);
		that.visualizer = that.visualizers[inputs.type.value];
	});
	
	/* Drag and drop. */
	document.body.addEventListener("dragover", function(event) {
		event.stopPropagation();
		event.preventDefault();
		event.dataTransfer.dropEffect = "copy";
	}, false);
	document.body.addEventListener("drop", function(event) {
		event.stopPropagation();
		event.preventDefault();
		that.load(event.dataTransfer.files);
	}, false);
	
	/* Pause and play. */
	buttons.play.addEventListener("click", function(event) { that.toggle(); });
	player.addEventListener("play", function() { buttons.play.innerHTML = "pause"; });
	player.addEventListener("pause", function() { buttons.play.innerHTML = "play"; });

	/* If elapsed time is being manipulated. */
	inputs.time.addEventListener("mousedown", function(event) { that.elapsedHeldDown = true; });
	inputs.time.addEventListener("mouseup", function() { that.elapsedHeldDown = false; });
    inputs.time.addEventListener("input", function() { that.elapsedGhostValue = inputs.time.value / that.elapsedResolution; });
	inputs.time.addEventListener("change", function() { player.setElapsed(inputs.time.value / that.elapsedResolution); });
	
	/* Constantly update times. */
	setInterval(function() {
		if (player.playing && !that.elapsedHeldDown) {
			var elapsed = player.getElapsed();
			inputs.time.value = Math.floor(elapsed * that.elapsedResolution);
            displays.elapsed.innerHTML = formatTime(elapsed);
		} else if (that.elapsedHeldDown) {
            displays.elapsed.innerHTML = formatTime(that.elapsedGhostValue);
        }
	}, 50);
	
	/* Volume. */
	inputs.volume.addEventListener("input", function() {
		player.setVolume(inputs.volume.value / 100);
		displays.volume.innerHTML = inputs.volume.value + "%";
	});
	
	/* Change title when song loaded. */
	player.addEventListener("loaded", function(song) {
		displays.title.innerHTML = song.name;
		inputs.time.disabled = false;
		inputs.time.max = Math.floor(song.length * that.elapsedResolution);
		for (button in buttons) buttons[button].style.color = buttons[button].style.colorEnabled;
		displays.elapsed.innerHTML = formatTime(0);
		displays.total.innerHTML = formatTime(player.song.length);
	});
	
	/* When song unloaded. */
	player.addEventListener("unloaded", function() {
		inputs.time.value = 0;
		inputs.time.disabled = true;
		for (button in buttons) buttons[button].style.color = buttons[button].style.colorDisabled;
		displays.elapsed.innerHTML = formatTime(0);
		displays.total.innerHTML = formatTime(0);
	});
	
	/* Check for mouse in and out of window. */
	document.addEventListener("mouseleave", function(event) { that.mouseInside = false; });
	document.addEventListener("mouseenter", function(event) { that.mouseInside = true; });
	
	/* Constantly try to lerp the controls to being hidden. */
	setInterval(function() {
		that.cooldown = Math.max(0, that.cooldown - that.cooldownInterval);
		if (that.cooldown == 0 && that.visible)
			that.hide();
	}, 250);
    
	/** Load songs. */
    this.load = function(files) {
		var song = Song.fromFile(files[0]);
		song.addEventListener("loaded", function() { 
			player.load(song, true); //  autoplay 
		});
    }
    
    /** Toggle play and pause. */
    this.toggle = function() {
		if (player.playing) player.pause();
		else player.play();
    }

    /** Show the overlay. */
    this.show = function() {
        controls.style.opacity = 1;
        information.style.opacity = 1;
        canvas.style.cursor = "default";
        controls.style.cursor = "default";
        information.style.cursor = "default";
    }
    
    /** Hide the overlay. */
    this.hide = function() {
        controls.style.opacity = 0;
        information.style.opacity = 0;
        canvas.style.cursor = "none";
        controls.style.cursor = "none";
        information.style.cursor = "none";
    }
    
    /** Draw the canvas. */
    this.draw = function() {

		/* Call animation again. */    
    	requestAnimationFrame(this.draw.bind(this));
    	
    	/* Get canvas width and height. */
    	var w = canvas.width;
    	var h = canvas.height;
    	
		/* Clear context. */
		context.clearRect(0, 0, w, h);
    	
    	/* Get equalizer data if a song is loaded. */
		if (player.loaded) {
		
            this.visualizer.draw(player, canvas, context);
            
		} else {
			context.fillStyle = "white";
			context.textAlign = "center";
			context.textBaseline = "middle";
            context.font = "80px sans-serif";
            context.fillText("vivid", w/2, h/2-20);
			context.font = "20px sans-serif";
			context.fillText("drag and drop to play", w/2, h/2+40);
		}
	
    }
    
    /* Actually draw. */
    this.draw();
    
})();

/* Draw equalizer bars. */    
function Bars() {
    
    this.config = {};
    this.config.gap = 3;
    this.config.bottom = 0;
    this.config.start = 0;
    this.config.range = 48;
    this.config.count = 48;
    this.color = 0;
    
    this.smoothing = 0;
    this.arrays = new Array(this.smoothing);
        
    this.draw = function(player, canvas, context) {
        
        maxHeight = 0.5 * canvas.height;
        
        /* Get the equalizer data. */
        var array = player.getEqualizer();
        
        /* Get some math. */
        var width = (canvas.width - (this.config.range+1)*this.config.gap) / this.config.range;
        var step = Math.round(this.config.range / Math.min(this.config.range, this.config.count));
        
        /* Draw each bar. */
        for (var i = 0; i < this.config.range; i++) {
        
        	var raw = 0;
        	if (this.smoothing == 0) {
        		raw = array[i * step + this.config.start];
        	
        	/* Experimental smoothing. */
        	} else {
				var index = i * step + this.config.start;	
				var sum = array[index];
				var div = this.smoothing + 1;
				for (var j = 0; j < this.smoothing; j++) {
					if (this.arrays[j]) sum += this.arrays[j][index];
					else div -= 1;
				}
				raw = sum/div;
			}
        	        	        
        				
            var value = Math.pow(raw/256, 8);
            var x = Math.floor(i * (width + this.config.gap) + this.config.gap)
            var y = canvas.height - value*maxHeight;
            context.fillStyle = "hsl(" + Math.ceil(player.getElapsed()*2) % 360 + ",100%,"+Math.floor(value*45+5)+"%)";
            context.fillRect(x, y, Math.ceil(width), value*maxHeight - this.config.bottom);
            this.color++;
        }
        
        /* Store the last array. */
        this.arrays.unshift(array);
        this.arrays.pop(this.smoothing);
        
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

/* Window resizing and canvas size. */
var resize = window.onload = window.onresize = function() {
	var canvas = document.getElementById("canvas");
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
}
