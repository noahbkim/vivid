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

/** Player object. */
function Player() {
    
    /** Core audio components. */
    this.audio;     // Audio element
    this.context;   // Audio context
    this.source;    // Audio source
    this.buffer;    // Audio buffer
    this.analyser;  // Equalizer data
    this.gain;      // Volume control
    
    /** Audio states. */
    this.state = NONE;
    
    /** Load a new song into the player. */
    this.load = function(file) {
        
        /* Reference to self. */
        var reader = new FileReader();
        reader.onload = function(e) {
            var data = e.target.result;
            that.audio.decodeAudioData(data, function(buffer) {
                that.buffer = buffer;
                that.state = READY;
            }, function(error) {
                consolg.log("Invalid file!");
            });
            
        }
        reader.onerror = function(error) { console.log("Error reading file!"); };
        reader.readAsArrayBuffer(file);
        
    }
    
}
