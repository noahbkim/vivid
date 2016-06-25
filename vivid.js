/** A set of tools for the Vivid visualizer. */

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
	
	/* If the time slider is being held down. */
	this.elapsedHeldDown = false;
    
	/* Bind mouse move to showing the controls. */
	document.addEventListener("mousemove", function(event) {
		that.cooldown = that.cooldownStart;
		that.lastMouseX = event.x;
		that.lastMouseY = event.y;
		that.mouseInside = true;
        that.show();
		that.visible = true;
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
	buttons.play.addEventListener("click", function(event) {
		if (player.playing) player.pause();
		else player.play();
	});
	player.addEventListener("play", function() { buttons.play.innerHTML = "pause"; });
	player.addEventListener("pause", function() { buttons.play.innerHTML = "play"; });

	/* If elapsed time is being manipulated. */
	inputs.time.addEventListener("mousedown", function(event) {
		that.elapsedHeldDown = true;
	});
	inputs.time.addEventListener("mouseup", function() {
		that.elapsedHeldDown = false;
	});
	inputs.time.addEventListener("change", function() {
		player.setElapsed(inputs.time.value / 10);
	});
	
	/* Constantly update times. */
	setInterval(function() {
		if (player.playing && !that.elapsedHeldDown) {
			var elapsed = Math.floor(player.getElapsed());
			inputs.time.value = elapsed * 10;
			displays.elapsed.innerHTML = formatTime(elapsed)
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
		inputs.time.max = song.length*10;
		for (button in buttons) buttons[button].style.color = "black";
		displays.elapsed.innerHTML = formatTime(0);
		displays.total.innerHTML = formatTime(player.song.length);
	});
	
	/* When song unloaded. */
	player.addEventListener("unloaded", function() {
		inputs.time.value = 0;
		inputs.time.disabled = true;
		for (button in buttons) buttons[button].style.color = "lightgray";
		displays.elapsed.innerHTML = formatTime(0);
		displays.total.innerHTML = formatTime(0);
	});
	
	/** Load songs. */
    this.load = function(files) {
		var song = Song.fromFile(files[0]);
		song.addEventListener("loaded", function() { 
			player.load(song); 
		});
    }
	
	/* Check for mouse in and out of window. */
	document.addEventListener("mouseleave", function(event) { that.mouseInside = false; });
	document.addEventListener("mouseenter", function(event) { that.mouseInside = true; });
	
	/* Constantly try to lerp the controls to being hidden. */
	setInterval(function() {
		that.cooldown = Math.max(0, that.cooldown - that.cooldownInterval);
		if (that.cooldown == 0 && that.visible) 
			that.hide();
	}, 250);

    /** Show the overlay. */
    this.show = function() {
        controls.style.opacity = 1;
        information.style.opacity = 1;
    }
    
    /** Hide the overlay. */
    this.hide = function() {
        controls.style.opacity = 0;
        information.style.opacity = 0;
    }
    
    /** Draw the canvas. */
    this.draw = function() {

		/* Call animation again. */    
    	requestAnimationFrame(this.draw.bind(this));
    	
    	/* Get canvas width and height. */
    	var w = canvas.width;
    	var h = canvas.height;
    	
		/* Clear context. */
		context.fillStyle = "white";
		context.fillRect(0, 0, w, h);
    	
    	/* Get equalizer data if a song is loaded. */
		var equalizer;
		if (equalizer = player.getEqualizer()) {
		
		} else {
			context.fillStyle = "black";
			context.textAlign = "center";
			context.textBaseline = "middle";
			context.font = "20px sans-serif";
			context.fillText("drag and drop to play", w/2, h/2);
		}
	
    }
    
    /* Actually draw. */
    this.draw();
    
})();

/* Window resizing and canvas size. */
var resize = window.onload = window.onresize = function() {
	var canvas = document.getElementById("canvas");
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
}