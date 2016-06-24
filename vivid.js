/** A set of tools for the Vivid visualizer. */

/* Create a player. */
var player = new Player();

/* Set up the controls manager. */
var controls = new (function Controller() {

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

	/* Grab the footer controls. */
	this.element = document.getElementById("controls");
	this.transformDefault = this.element.style.transform;
	
	/* Bind mouse move to showing the controls. */
	document.addEventListener("mousemove", function(event) {
		that.cooldown = that.cooldownStart;
		that.lastMouseX = event.x;
		that.lastMouseY = event.y;
		that.mouseInside = true;
		that.element.style.transform = "none";
		this.visible = true;
	});
	
	/* Check for mouse in and out of window. */
	document.addEventListener("mouseleave", function(event) { that.mouseInside = false; });
	document.addEventListener("mouseenter", function(event) { that.mouseInside = true; });
	
	/* Constantly try to lerp the controls to being hidden. */
	setInterval(function() {
		controls.cooldown = Math.max(0, controls.cooldown - that.cooldownInterval);
		if (controls.cooldown == 0 && that.element.style.transform == "none") 
			that.element.style.transform = controls.transformDefault;
	}, 50);

})();

/* Window resizing and canvas size. */
var resize = window.onload = window.onresize = function() {
	var canvas = document.getElementById("canvas");
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
}