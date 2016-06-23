/** Song and playlist models. 

Song objects can only be instantiated with local files as of the 
current version. */

/** The song object. */
function Song() {

	/* Inherit. */
	Propagatenator.call(this);

	/* Self. */
	var that = this;
	
	/* Who am I??? */
	this.name;
	this.length;

	/* Type and state. */
	this.type = Song.LOCAL;
	this.state = Song.WAIT;
	
	/* Cache. */
	this.index = Song.index++;
	Song.cache[this.index] = this;
	
	/* Content. */
	this.buffer;

}

/* Local song loading. */
Song.fromFile = function(file) {

	/* Check if file cached. */
	if (Song.cache.hasOwnProperty(file)) return Song.cache[file];

	/* Create the song and a spare audio context. */
	var song = new Song();
	var context = new AudioContext();
	
	/* It's from a file. */
	song.name = file.name;
	song.type = Song.LOCAL;

	/* Set up a file reader. */
	var reader = new FileReader();
	reader.onload = function(event) {
		var data = event.target.result;
		context.decodeAudioData(data, function(buffer) {
			song.buffer = buffer;
			song.length = buffer.duration;
			song.state = Song.DONE;  // Also cache by file
			Song.cache[file] = song;
			song.emit("loaded");
		});
	}
	reader.onerror = function(event) {
		song.state = Song.FAIL;
		song.emit("failed");
	}

	/* Read the file. */
	reader.readAsArrayBuffer(file);
	
	/* Return. */
	return song;

}

/* Song indexing. */
Song.index = 0;
Song.cache = {};

/* Song states. */
Song.WAIT = 0;
Song.LOAD = 1;
Song.DONE = 2;
Song.FAIL = 3;

/* Song types. */
Song.MEDIA = "media";
Song.LOCAL = "local";

