/** A set of tools for the Vivid visualizer. */

/* Create a player. */
var player = new Player();

/* Grab the footer controls. */
var controls = document.getElementById("controls");
var information = document.getElementById("information")

/* Set up the controls manager. */
var overlay = new (function Overlay() {

	/* Reference. */
	var that = this;

	/* Cooldown for displaying the controls. */
	this.cooldown = 0;
	this.cooldownStart = 20;
	this.cooldownInterval = 0.5;
	this.lastMouseX = 0;
	this.lastMouseY = 0;
	this.mouseInside = false;
	this.visible = false;
    
	/* Bind mouse move to showing the controls. */
	document.addEventListener("mousemove", function(event) {
		that.cooldown = that.cooldownStart;
		that.lastMouseX = event.x;
		that.lastMouseY = event.y;
		that.mouseInside = true;
        that.show();
		that.visible = true;
	});
	
	/* Check for mouse in and out of window. */
	document.addEventListener("mouseleave", function(event) { that.mouseInside = false; });
	document.addEventListener("mouseenter", function(event) { that.mouseInside = true; });
	
	/* Constantly try to lerp the controls to being hidden. */
	setInterval(function() {
		that.cooldown = Math.max(0, that.cooldown - that.cooldownInterval);
		if (that.cooldown == 0 && that.visible) 
			that.hide();
	}, 50);

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
    
})();

/* Window resizing and canvas size. */
var resize = window.onload = window.onresize = function() {
	var canvas = document.getElementById("canvas");
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
}