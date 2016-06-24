/** Event listener mockup. */
function Dispatcher() {
	
	/* Event to callback list. */
	var map = {};
	
	/** Add a callback to an event. */
	this.addEventListener = function(event, callback) { 
		if (map[event]) map[event].push(callback);
		else map[event] = [callback];
	}
	
	/** Clear all callbacks. */
	this.clearEventListeners = function() {
		this.map = {};
	}
	
	/** Fire an event with data. */
	this.emit = function(event, data) { 
		var callbacks = map[event];
		for (var i in callbacks) callbacks[i](data);
	}
	
}