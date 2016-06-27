/** A Javascript and HTML5 audio player. 

The audio player is capable of playing, pausing, tracking, and changing
volume. It also offers access to equalizer and waveform data. */

/** Music song cursor. */
function Cursor() {

	/* Start datetime and elapsed song time both in SECONDS. */
	this.start = 0;
	this.elapsed = 0;
	
	/* Reset the cursor. */
	this.reset = function() { this.start = this.elapsed = 0; }
	
}

/** The music player. */
function Player() {

	/* Superclass. */
	Dispatcher.call(this);

    /* Reference to self. */
	var that = this;
    
    /** Core audio components. */
    this.audio = new AudioContext();  // Audio element
    
    /** Internal audio components. */
    this.analyser = this.audio.createAnalyser();  // Equalizer and waveform
    this.gain = this.audio.createGain();		  // Volume
    this.source;								  // Linked to songs
            
    /** Connect internal audio and set default volume. */
    this.analyser.connect(this.gain);
    this.gain.connect(this.audio.destination);
    this.gain.gain.value = 0.5;
    
    /** Song cursor. */
    this.cursor = new Cursor();
    this.song = null;
    
    /** Loaded and playing. */
    this.loaded = false;
    this.playing = false;
    
    /** Miscellaneous properties. */
    this.ignoreManualSourceStop = false;  // Used to prevent manual ended callbacks
    
    /** Unload the current song. */
    this.unload = function() {
    
		/* Check if already playing or not loaded. */
		if (!this.loaded) { console.warn("Nothing loaded!"); return; } 
		   	
    	/* Check if playing. */
    	if (this.playing) this.pause();
    	
    	/* Unbind everything. */
    	this.song.clearEventListeners();
    	
    	/* Update states and broadcast. */
    	this.loaded = false;
    	this.emit("unloaded", this.song)
    	
    }
    
    /** Load a song entirely newly. */
    this.load = function(song, autoplay) {
        
    	/* Check song. */
    	if (!(song && song.state && song.state == Song.DONE)) {
    		console.warn("Song not playable.");
    		return;
    	}
    
    	/* Check if buffer. */
    	if (this.loaded) this.unload();
		
		/* Set song. */
		this.song = song;
		
		/* Reset the cursor. */
		this.cursor.reset();
		
		/* Notify everybody. */
		this.loaded = true;
		this.emit("loaded", song);
		
		/* Autoplay. */
		if (autoplay) this.play();
    	
    }
    
    /** Create the audio source of a song. */
    this.prepare = function(song) {

    	/* Generate source, connect, and give buffer. */
    	this.source = this.audio.createBufferSource();
    	this.source.connect(this.analyser);
		this.source.buffer = song.buffer;
		
		/* Bind ended callback internally. */
		this.source.onended = function() { that.onEnded(); }
    
    }
    
    /** Play the loaded song. */
	this.play = function() {
	
		/* Check if already playing or not loaded. */
		if (this.playing) { console.log("Already playing!"); return; }
		if (!this.loaded) { console.warn("Nothing loaded!"); return; }

		/* Prepare the audio. */
		this.prepare(this.song);

		/* Set cursor start time to now and subtract elapsed time. */
		this.cursor.start = Date.now() / 1000;
		this.cursor.start -= this.cursor.elapsed;
		
		/* Reset source stop ignore flag. */
		/* this.ignoreManualSourceStop = false; */
		
		/* Set playing before start to prevent callback collisions. */
		this.playing = true;
		
		/* Play at current time. */
		this.source.start(0, this.cursor.elapsed)
		
		/* Tell everyone. */
		this.emit("play", this.song)
	
	}
	
	/** Pause the loaded song. */
	this.pause = function() {
		
		/* Check if already paused or not loaded. */
		if (!this.playing) { console.log("Already paused!"); return; }
		if (!this.loaded) { console.warn("Nothing loaded!"); return; }
		
		/* Calculate the elapsed cursor time. */
		this.cursor.elapsed = Date.now() / 1000 - this.cursor.start;
		
		/* Set paused before stop to prevent callback collisions. */
		this.playing = false;
		
		/* Enable source stop. Will be reset by the onEnded call. */
		this.ignoreManualSourceStop = true;

		/* Stop the audio and create a new one. */
		this.source.stop();
		
		/* Tell everyone. */
		this.emit("pause", this.song)
		
	}
	
	/** Called when a songs ends. */
	this.onEnded = function() {
	
		/* If it was stopped by pause. */
		if (this.ignoreManualSourceStop) {
			this.ignoreManualSourceStop = false;
			return;
		}
		
		/* Actually ended. */
		console.log("Reached the end!");
		this.pause();
		this.cursor.elapsed = this.song.length;
	
	}
	
	/** Set the volume, typically to a value between 0 and 1. */
	this.setVolume = function(level) {
		
		/* Modify the gain and emit an event. */
		this.gain.gain.value = level;
		this.emit("volume", level);
		
	}
	
	/** Get the volume. */
	this.getVolume = function() {
	
		/* :-O */
		return this.gain.gain.value;
	
	}
	
	/** Set the elapsed track time in seconds. */
	this.setElapsed = function(time) {
	
		/* Check if loaded. */
		if (!this.loaded) { return; }
        
        /* Check if should play after. */
        var resume = this.playing;
        
        /* Pause the player, set the time, play again. */
        if (this.playing) this.pause();
    	this.cursor.elapsed = Math.max(0, Math.min(this.song.length, time));
    	if (resume) this.play();
    	
    	/* Notify. */
    	this.emit("elapsed", this.cursor.elapsed);
        
	}
	
	/** Get the elapsed track time in seconds. */
	this.getElapsed = function() {
	
		/* Check if loaded. */
		if (!this.loaded) { return; }
	
		/* Calculate if playing, otherwise return elapsed. */
		if (this.playing) return (Date.now() / 1000 - this.cursor.start);
		else return this.cursor.elapsed;
	
	}
	
	/** Get equalizer data. */
    this.getEqualizer = function() {
        
        /* Check if loaded. */
		if (!this.loaded) return;

        /* Get the analyzer array. */
        var array = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(array);
        return array;
        
    }
    
    /** Get waveform data. */
    this.getWaveform = function() {

        /* Check if loaded. */
    	if (!this.loaded) return;
    	
    	/* Get the waveform array. */
    	var array = new Uint8Array(this.analyser.frequencyBinCount);
    	this.analyser.getByteTimeDomainData(array);
    	return array;
    
    }

}

