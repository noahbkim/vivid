/** A Javascript and HTML5 audio player. 

The audio player is capable of playing, pausing, tracking, and changing
volume. It also offers access to equalizer and waveform data. */


/** Audio file cursor. */
function Cursor() {

	/* Start datetime and elapsed song time both in SECONDS. */
	this.start = 0;
	this.elapsed = 0;
	
	/* Reset the cursor. */
	this.reset = function() { this.start = this.elapsed = 0; }
	
}

/** The music player. */
class Player extends EventInterface {

  /** Generate audio components. */
  constructor() {
    super();

    /* Create the components. */
    this.audio = new AudioContext();              // Audio element
    this.gain = this.audio.createGain();		      // Volume
    this.gain.connect(this.audio.destination);
    this.analyser = this.audio.createAnalyser();  // Equalizer and waveform
    this.analyser.connect(this.gain);
    this.source = null; 					                // Linked to songs

    /*  Attach analyzer */
    this.gain.gain.value = 0.5;

    /* Song cursor. */
    this.cursor = new Cursor();
    this.song = null;

    /* Loaded and playing. */
    this.loaded = false;
    this.playing = false;

    /* Miscellaneous properties. */
    this.ignoreManualSourceStop = false;          // Used to prevent manual ended callbacks on pause

  }

  /** Unload the current song. */
  unload() {
    if (!this.loaded) { console.warn("Nothing loaded!"); return; }
    if (this.playing) this.pause();
    this.song.clearEventListeners();
    this.loaded = false;
    this.fireEvent("unloaded", this.song)
  }
    
  /** Load a song into the player. */
  load(song, autoplay) {
    if (!(song && song.state && song.state === Song.DONE)) { console.warn("Song not playable."); return; }
    if (this.loaded) this.unload();
    this.song = song;
		this.cursor.reset();
		this.loaded = true;
		this.fireEvent("loaded", song);
    if (autoplay) this.play();
  }
    
  /** Create the audio source of a song. */
  prepare(song) {
    this.source = this.audio.createBufferSource();
    this.source.connect(this.analyser);
		this.source.buffer = song.buffer;
		this.source.onended = this.finish.bind(this);
  }
    
  /** Play the loaded song. */
	play() {
		if (this.playing) { console.log("Already playing!"); return; }
		if (!this.loaded) { console.warn("Nothing loaded!"); return; }
    this.prepare(this.song);
    this.cursor.start = Date.now() / 1000;
		this.cursor.start -= this.cursor.elapsed;
		this.playing = true;
    this.source.start(0, this.cursor.elapsed);
    this.fireEvent("play", this.song);
	}
	
	/** Pause the loaded song. */
	pause() {
    if (!this.playing) { console.log("Already paused!"); return; }
		if (!this.loaded) { console.warn("Nothing loaded!"); return; }
    this.cursor.elapsed = Date.now() / 1000 - this.cursor.start;
    this.playing = false;
    this.ignoreManualSourceStop = true;
    this.source.stop();
    this.fireEvent("pause", this.song);
	}
	
	/** Called when a songs ends. */
	finish() {
    if (this.ignoreManualSourceStop) { this.ignoreManualSourceStop = false; return; }
		console.log("Reached the end!");
		this.pause();
		this.cursor.elapsed = this.song.length;
	}
	
	/** Set the volume, typically to a value between 0 and 1. */
	volume(level) {
		if (level === undefined) return this.gain.gain.value;
		this.gain.gain.value = level;
		this.fireEvent("volume", level);
	}
	
	/** Set the elapsed track time in seconds. */
	elapsed(time) {
    if (!this.loaded) return;
	  if (time === undefined) {
  		if (this.playing) return (Date.now() / 1000 - this.cursor.start);
		  else return this.cursor.elapsed;
    } else {
      let resume = this.playing;
      if (resume) this.pause();
      this.cursor.elapsed = Math.max(0, Math.min(this.song.length, time));
      if (resume) this.play();
      this.fireEvent("elapsed", this.cursor.elapsed);
    }
	}

	/** Get equalizer data. */
  equalizer() {
		if (!this.loaded) return;
    let array = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(array);
    return array;
  }
    
  /** Get waveform data. */
  waveform() {
    if (!this.loaded) return;
    let array = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(array);
    return array;
  }

}

