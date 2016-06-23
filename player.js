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
	Propagatenator.call(this);

    /* Reference to self. */
	var that = this;
    
    /** Core audio components. */
    this.audio = new AudioContext();  // Audio element
    
    /** Internal audio components. */
    this.analyser = this.audio.createAnalyser();  // Equalizer and waveform
    this.gain = this.audio.createGain();		  // Volume
    this.source;								  // Linked to songs
    
    /** Connect internal audio. */
    this.analyser.connect(this.gain);
    this.gain.connect(this.audio.destination);
    
    /** Song cursor. */
    this.cursor = new Cursor();
    this.song = null;
    
    /** Loaded and playing. */
    this.loaded = false;
    this.playing = false;
    
    /** Load a song entirely newly. */
    this.load = function(song, autoplay) {
    
    	/* Check if buffer. */
    	if (this.song && this.playing) this.pause();
		
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
		
		/* Play at current time. */
		this.source.start(0, this.cursor.elapsed)
		
		/* Tell everyone. */
		this.playing = true;
		this.emit("playing", this.song)
	
	}
	
	/** Pause the loaded song. */
	this.pause = function() {
		
		/* Check if already paused or not loaded. */
		if (!this.playing) { console.log("Already paused!"); return; }
		if (!this.loaded) { console.warn("Nothing loaded!"); return; }
		
		/* Calculate the elapsed cursor time. */
		this.cursor.elapsed = Date.now() / 1000 - this.cursor.start;
		
		/* Stop the audio and create a new one. */
		this.source.stop();
		
		/* Tell everyone. */
		this.playing = false;
		this.emit("paused", this.song)
		
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
		if (!this.loaded) { console.warn("Nothing loaded!"); return; }
        
        /* Check if should play after. */
        var resume = this.playing;
        
        /* Pause the player, set the time, play again. */
        if (this.playing) this.pause();
    	this.cursor.elapsed = Math.max(0, Math.min(this.song.length, time));
    	if (resume) this.play();
        
	}
	
	/** Get the elapsed track time in seconds. */
	this.getElapsed = function() {
	
		/* Check if loaded. */
		if (!this.loaded) { console.warn("Nothing loaded!"); return; }
	
		/* Calculate if playing, otherwise return elapsed. */
		if (this.playing) return (Date.now() / 1000 - this.cursor.start);
		else return this.cursor.elapsed;
	
	}
	
	/** Get equalizer data. */
    this.getEqualizer = function() {
        
        /* Check if loaded. */
		if (!this.loaded) { console.warn("Nothing loaded!"); return; }

        /* Get the analyzer array. */
        var array = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(array);
        return array;
        
    }
	

}

