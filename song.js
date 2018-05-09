/** Song and playlist models. 

Song objects can only be instantiated with local files as of the 
current version. */


/** The song object. */
class Song extends EventInterface {

  constructor() {
    super();
    this.name = "";
	  this.length = 0;
    this.type = Song.LOCAL;
    this.state = Song.WAIT;
    this.buffer = null;
  }

  static load(file) {
    let song = new Song();
    let context = new AudioContext();
    song.name = file.name;
    song.type = Song.LOCAL;
    let reader = new FileReader();
    reader.onload = (event) => {
      let data = event.target.result;
      context.decodeAudioData(data, (buffer) => {
        song.buffer = buffer;
        song.length = buffer.duration;
        song.state = Song.DONE;
        song.fireEvent("loaded");
      });
    };
    reader.onerror = (event) => {
      song.state = Song.FAIL;
      song.fireEvent("failed")
    };
    reader.readAsArrayBuffer(file);
    return song;
  }

}

Song.WAIT = 0;
Song.LOAD = 1;
Song.DONE = 2;
Song.FAIL = 3;
Song.MEDIA = "media";
Song.LOCAL = "local";
