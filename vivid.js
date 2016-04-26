/* States */
var WAITING = 0;
var PLAYING = 1;
var PAUSED = 2;

/* Access any crossplatform window objects. */
function identify() {
    for (i in arguments) {
        var w = arguments[i];
        window[w] = window[w] || window["webkit"+w] || window["moz"+w] || window["ms"+w];
    }
}

/* Create an audio context. */
function audio() {
    try { return new AudioContext(); }
    catch (e) { alert("No audio support"); return null; }
}

/* Call what we need. */
identify("AudioContext", "requestAnimationFrame", "cancelAnimationFrame");

/* Caller for playing songs. */
function play(index) {
    alert("No play function is defined!");
}

/* Main visualizer class. */
function Visualizer() {
    
    this.canvas;
    this.audio;
    this.context;
    this.upload;
    this.list;
    
    this.source;
    this.analyser;
    
    this.frame;
    this.state = WAITING;
    this.files = [];
    
    this.bind = function(canvas, upload, list) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.upload = upload;
        this.list = list;
        
        var that = this;
        
        this.upload.onchange = function() {
            if (that.upload.files.length === 0) return;
            for (var i = 0; i < that.upload.files.length; i++) {
                var file = that.upload.files[i];
                that.load(file);
            }
        }
        
        var body = document.getElementsByTagName("body")[0];
        
        body.addEventListener("dragover", function(e) {
            e.stopPropagation();
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
        }, false);
        
        body.addEventListener("drop", function(e) {
            e.stopPropagation();
            e.preventDefault();
            that.load(e.dataTransfer.files[0]);
        }, false);
        
        this.context.textBaseline = "middle";
        this.context.textAlign = "center";
        this.context.font = "20px sans-serif";
        this.context.fillText("drag and drop to upload", 400, 175);

    }
    
    this.load = function(file) {
        var index = this.files.length;
        this.files.push(file);
        var row = document.createElement("li");
        row.innerHTML = "<span onclick=\"javascript: play(" + index + ");\">" + file.name;
        this.list.appendChild(row);
    }
    
    this.play = function(index) {
        var that = this;
        console.log(this);
        var file = this.files[index];
        var reader = new FileReader();
        
        reader.onload = function(e) {
            var result = e.target.result;
            that.audio.decodeAudioData(result, function(buffer) {
                that.visualize(buffer);
            }, function(e) {
                console.log("Invalid file");
            });
        };
        reader.onerror = function(e) { console.log("Error reading file"); };
        reader.readAsArrayBuffer(file);
    }
    
    this.visualize = function(buffer) {
        var that = this;
        var source = this.audio.createBufferSource();
        var analyser = this.audio.createAnalyser();
        source.connect(analyser);
        analyser.connect(this.audio.destination);
        source.buffer = buffer;
        
        if (!source.start) source.start = source.noteOn;
        if (!source.stop) source.stop = source.noteOff;
        
        if (this.frame !== null) cancelAnimationFrame(this.frame);
        if (this.source) this.source.stop(0);
        
        source.start(0);
        this.state = PLAYING;
        this.source = source;
        this.analyser = analyser;
        this.source.onended = function() { that.end(); };
        this.animate();
    }
    
    this.animate = function() {
        requestAnimationFrame(this.animate.bind(this));
        if (this.state !== PLAYING) return;
        this.draw(this.canvas, this.context, this.analyser);
    }
    
    this.draw = bars;
    
    this.start = function() {
        this.audio = audio();
        if (this.canvas === null) { console.log("No canvas bound"); return; }
    }
    
    this.end = function() {
        this.state = WAITING;
    }
    
}

/* Visualizer functions. */
function bars(canvas, context, analyser) {
    
    var gap = 8;
    var start = 0;
    var range = 32;
    var count = Math.min(64, range);
    var width = (canvas.width - (count+1)*gap) / count;
    var step = Math.round(range / count);
    
    var array = new Uint8Array(this.analyser.frequencyBinCount);
    analyser.getByteFrequencyData(array);
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < count; i++) {
        var value = array[i * step + start];
        context.fillStyle = "#000";
        context.fillRect(i * (width + gap) + gap, canvas.height - value, width, canvas.height);
    }
}