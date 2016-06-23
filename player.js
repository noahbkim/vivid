/** The Javascript audio player. 

The audio player is capable of basic functionality such as play and
pause, skipping, and volume. It also offers access to equalizer and
waveform data. */

/** Audio states. */
var NONE = 0;
var READY = 1;
var PLAY = 2;
var PAUSE = 3;
var ERROR = 4;

/** Audio availability. */
try { AudioContext; } catch (e) { console.warn("Audio unavailable!"); }
AudioContext = AudioContext || mozAudioContext || webkitAudioContext || msAudioContext;

/** Bound X between A low and B high. */
function bound(x, a, b) { return Math.min(Math.max(x, a), b); }

/** Player object. */
function Player() {
    
    /* Reference to self. */
	var that = this;
    
    /** Core audio components. */
    this.audio = new AudioContext();  // Audio element
    
    /** Internal audio components. */
    this.source;    // Audio source
    this.buffer;    // Audio buffer
    this.analyser;  // Equalizer data
    this.gain;      // Volume control
    
    /** Audio states. */
    this.state = NONE;  // Player state defined above
    
    /** Audio control. */
    this.audioVolume = 0.5;
    this.audioStartTime = 0;
    this.audioElapsedTime = 0;
	    
    /** Load a new song into the player. */
    this.loadFile = function(file, autoplay, overplay) {
        
        /* Create a new reader. */
        var reader = new FileReader();
        reader.onload = function(e) {
            var data = e.target.result;
            that.audio.decodeAudioData(data, function(buffer) {
            
            	/* Overplay stops anything that's playing and starts the new audio if not false. */
            	if (overplay != false && that.state === PLAY) that.pause();
            	
                that.buffer = buffer;
                that.state = READY;
            
            	/* Autoplay automatically starts the next audio if not false. */    
                if (autoplay != false) that.play();
            
            }, function(error) {
                consolg.log("Invalid file!");
            });
        }
        reader.onerror = function(error) { console.log("Error reading file!"); };
        
        /* Read the file. */
        reader.readAsArrayBuffer(file);
        
    }
    
    /** Play the currently loaded audio. */
    this.play = function() {
    
    	/* Check if there's not file. */
    	if (!this.buffer) { console.warn("Nothing to play!"); return; }
    	
    	/* Check if something is playing. */
    	if (this.state == PLAY) { this.pause(); console.log(6); }
        
        /* Set up the audio. */
        var source = this.audio.createBufferSource();
        var analyser = this.audio.createAnalyser();
        var gain = this.audio.createGain();
        source.connect(analyser);
        analyser.connect(gain);
        gain.connect(this.audio.destination);
        source.buffer = this.buffer;
        
        /* Set the audio volume. */
        gain.gain.value = this.audioVolume;
        
        /* Check audio member functions. */
        if (!source.start) source.start = source.noteOn;
        if (!source.stop) source.stop = source.noteOff;
        
        /* Give the source a start time. */
        this.audioStartTime = Date.now();
        
        /* Give the source a callback for when finished. */
        source.onended = function() { that.onEnded(); };
        
        /* If a new audio has been loaded, leave the start time as the current time and assign an elapsed counter. */
        if (this.state == READY) this.audioElapsedTime = 0;

        /* If paused, move the start time back by the old elapsed time. */    
        else if (this.state == PAUSE) this.audioStartTime -= this.audioElapsedTime;
        
        /* Start the audio. */
        source.start(0, this.audioElapsedTime / 1000);
        this.state = PLAY;
        
        /* Reassign all new values. */
        this.source = source;
        this.analyser = analyser;
        this.gain = gain;

    }
    
    /** Pause the audio stream. */
    this.pause = function() {
    
    	/* Must be playing. */
    	if (this.state !== PLAY) return;
        
        /* Set state. */
        this.state = PAUSE;
        
        /* Stop audio and modify elapsed time.*/
        this.source.stop(0);
        this.audioElapsedTime = Date.now() - this.audioStartTime;
        
    }

	/** Check if there is an audio source. */
	this.hasAudio = function() {
		return this.source ? true : false;
	}
    
    /** Set the volume to a level between 0 and 1. */
    this.setVolume = function(volume) {
        this.audioVolume = Math.min(1, Math.max(0, volume));
        this.gain.gain.value = this.audioVolume;
    }
    
    /** Get the volume from 0 to 1. */
    this.getVolume = function() {
    	return this.audioVolume;
    }
    
    /** Get the total time of the current source. */
    this.getTotalTime = function() {
    	if (this.source) return this.buffer.duration;
    	else return undefined;
    }
    
    /** Set the elapsed time of the song in seconds. */
    this.setElapsedTime = function(time) {
    	if (!this.hasAudio()) { console.warn("No audio to set elapsed time!"); return; }
    	this.pause();
    	this.audioElapsedTime = bound(time, 0, this.getTotalTime()) * 1000;
    	this.play();
    }    
    
    /** Get the elapsed time of the current song in seconds. */
    this.getElapsedTime = function() {
    	if (this.state == PLAY) return bound((Date.now() - this.audioStartTime) / 1000, 0, this.getTotalTime());
    	else if (this.state == PAUSE) return this.audioElapsedTime / 1000;
    	else return undefined;
    }
    
    /** Get the frequency levels of the current frame. */
    this.getFrequencyArray = function() {
    	if (!this.hasAudio()) { console.warn("No audio to get frequency array!"); return; }
		var array = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(array);
        return array;
    }
    
    /** Called when the audio stops. */
    this.onEnded = function() {
        if (this.state == PLAY)
            if (this.getElapsedTime() >= this.getTotalTime()) this.pause();
    }
    
    
    
}
