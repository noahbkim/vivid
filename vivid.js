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
    
    /* Page components. */
    this.canvas;
    this.upload;
    this.list;
    
    /* Internal components. */
    this.audio;
    this.context;
    this.source;
    this.analyser;
    this.gain;
    
    /* Stuff. */
    this.frame;
    this.buffer;
    this.volume = 50;
    this.voluming = false;
    this.state = WAITING;
    this.switched = false;
    this.hover = false;
    this.name = "";
    this.fullname = "";
    this.time = 0;
    this.index = -1;
    this.files = [];
    this.cache = {};
    
    /* Theme info. */
    this.theme = {};
    this.theme.color = {};
    this.theme.color.r = 256;
    this.theme.color.g = 0;
    this.theme.color.b = 64;
    
    /* Drawing. */
    this.mode = new Bars();
    
    /* Bind the visualizer to page components. */
    this.bind = function(canvas, upload, list) {
        
        /* Reference to self. */
        var that = this;
        
        /* Set the components. */
        this.canvas = canvas;
        this.upload = upload;
        this.list = list;
        var body = document.getElementsByTagName("body")[0];
        
        /* Grab internals. */
        this.context = canvas.getContext("2d");

        /* Define drag and drop. */        
        this.upload.onchange = function() {
            if (that.upload.files.length === 0) return;
            that.load(that.upload.files);
        }        
        body.addEventListener("dragover", function(e) {
            e.stopPropagation();
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
        }, false);
        body.addEventListener("drop", function(e) {
            e.stopPropagation();
            e.preventDefault();
            that.load(e.dataTransfer.files);
        }, false);
        
        /* Play and pause. */
        canvas.addEventListener("mouseover", function(e) {
            that.hover = true;
        }, false);
        canvas.addEventListener("mouseout", function(e) {
            that.hover = false;
        }, false);
        canvas.addEventListener("mousedown", function(e) {
            var x = that.canvas.offsetLeft + that.canvas.width - e.pageX;
            var y = e.pageY - that.canvas.offsetTop;
            if (10 <= x && x <= 30 && 10 <= y && y <= 30) that.next();
            else if (40 <= x && x <= 60 && 10 <= y && y <= 30) that.toggle();
            else if (70 <= x && x <= 90 && 10 <= y && y <= 30) that.last();
            if (100 <= x && x <= 204 && 10 <= y && y <= 30) that.voluming = true;
        }, false);
        canvas.addEventListener("mouseup", function(e) {
            that.voluming = false;
        }, false);
        canvas.addEventListener("mousemove", function(e) {
            if (that.voluming) {
                var x = e.pageX - that.canvas.offsetLeft;
                that.volume = Math.max(0, Math.min(100, x + 204 - canvas.width));
                that.gain.gain.value = that.volume * 2 / 100;
            }
        })
        
        /* Draw instructions. */
        this.context.textBaseline = "middle";
        this.context.textAlign = "center";
        this.context.font = "20px sans-serif";
        this.context.fillStyle = "white";
        this.context.fillText("drag and drop a music file to upload and play", 400, 175);
        this.context.fillStyle = "black";

    }
    
    /* Load an uploaded file. */
    this.load = function(files) {
                
        for (var i = 0; i < files.length; i++) {
                        
            /* Get an individual file. */
            var file = files[i];
        
            /* Get the file index and add to list. */
            var index = this.files.length;
            this.files.push(file);

            /* Generate a row. */
            var row = document.createElement("li");
            var id = file.name;
            var show = "&#9658;&nbsp;" + file.name;
            var link = "javascript: play(" + index + ")";
            row.innerHTML = "<span id=\"" + id + "\" onclick=\"" + link + "\">" + show + "</span>";
            this.list.appendChild(row);
            
        }
        
        
        /* Play if nothing is playing. */
        if (this.state !== PLAYING) this.play(this.files.length - 1);
        
    }
    
    /* Play a file. */
    this.play = function(index) {
        
        /* Reference to self. */
        var that = this;
        
        /* Get the file and create a reader. */
        var file = this.files[index];
        var reader = new FileReader();
        this.index = index;
        
        /* Read the file. */
        reader.onload = function(e) {
            var result = e.target.result;
            that.audio.decodeAudioData(result, function(buffer) {
                that.buffer = buffer;
                that.state = WAITING;
                that.resume();
            
                var classes = document.getElementsByTagName("span");
                for (var i = 0; i < classes.length; i++) {
                    console.log(classes[i].id);
                    if (classes[i].id == that.fullname) {
                        classes[i].style.fontWeight = "normal";
                    } else if (classes[i].id == that.files[index].name) {
                        classes[i].style.fontWeight = "bold";  
                    }
                }
                that.fullname = that.files[index].name;
                that.name = that.files[index].name.replace(/\.[^/.]+$/, "");
        
            /* Otherwise. */
            }, function(e) {
                console.log("Invalid file");
            });
        };
        reader.onerror = function(e) { console.log("Error reading file"); };
        reader.readAsArrayBuffer(file);
        
    }
    
    this.resume = function() {
        
        /* Set up the audio. */
        var source = this.audio.createBufferSource();
        var analyser = this.audio.createAnalyser();
        var gain = this.audio.createGain();
        source.connect(analyser);
        analyser.connect(gain);
        gain.connect(this.audio.destination);
        source.buffer = this.buffer;
        
        /* Set volume. */
        gain.gain.value = this.volume / 100;

        /* Check audio members and stop current song. */
        if (!source.start) source.start = source.noteOn;
        if (!source.stop) source.stop = source.noteOff;
        if (this.source) this.source.stop(0);

        /* Start the audio and visualizer. */
        source.time = Date.now();
        if (this.state === PAUSED) {
            source.time -= this.time;
            source.start(0, this.time / 1000);
        } else {
            source.start();
            this.time = 0;
        }
        
        /* Set allthe the things. */
        this.state = PLAYING;
        this.switched = true;
        this.source = source;
        this.analyser = analyser;
        this.gain = gain;
        
        /* Set ending. */
        this.source.onended = function() { 
            if (!this.switched) this.state = WAITING;
            this.switched = false;
        };
        
        /* Animate. */
        this.animate();
    }
    
    this.next = function() {
        if (this.index == -1) return;
        if (this.index+1 < this.files.length) this.play(this.index+1);
    }
    
    this.last = function() {
        if (this.index == -1) return;
        if (this.index-1 >= 0) this.play(this.index-1);
    }
    
    /* Pause. */
    this.suspend = function() {
        this.state = PAUSED;
        this.source.stop(0);
        this.time = Date.now() - this.source.time;
    }
    
    /* Play from position. */
    this.toggle = function(e) {
        if (this.state === PLAYING) {
            this.suspend();
        } else if (this.state === PAUSED) {
            this.resume();
        }
    }
    
    /* Animate the visualizer. */
    this.animate = function() {
        
        /* Animation. */
        requestAnimationFrame(this.animate.bind(this));
        if (this.state == WAITING) return;
        
        /* Draw. */
        this.mode.draw(this.canvas, this.context, this.analyser, this.theme);
        
        /* Controls. */
        if (this.hover) {
            
            /* Style. */
            //this.context.fillStyle = "lightgray";
            
            /* Name and time. */
            var time = Date.now() - this.source.time;
            var minutes = Math.floor((time / 1000) / 60);
            var seconds = ("0" + Math.floor((time / 1000) % 60)).substr(-2);
            var name = this.name ? " | " + (this.name.length > 43 ? this.name.substr(0, 40) + "..." : this.name) : "";
            this.context.textBaseline = "top";
            this.context.textAlign = "left";
            this.context.fillStyle = "white";
            this.context.fillText(minutes + ":" + seconds + name, 10, 10)
            
            /* Volume. */
            this.context.fillRect(this.canvas.width - 204, 18, 104, 4);
            this.context.fillRect(this.canvas.width - 204 + this.volume, 10, 4, 20)
            
            /* Next. */
            this.context.beginPath();
            this.context.moveTo(this.canvas.width - 30, 10);
            this.context.lineTo(this.canvas.width - 10, 20);
            this.context.lineTo(this.canvas.width - 30, 30);
            this.context.closePath();
            this.context.fill();
            this.context.fillRect(this.canvas.width - 13, 10, 4, 20);
            
            /* Play pause. */
            if (this.state == PLAYING) {
                this.context.fillRect(this.canvas.width - 60, 10, 7, 20);
                this.context.fillRect(this.canvas.width - 47, 10, 7, 20);
            } else if (this.state == PAUSED) {
                this.context.beginPath();
                this.context.moveTo(this.canvas.width - 60, 10);
                this.context.lineTo(this.canvas.width - 40, 20);
                this.context.lineTo(this.canvas.width - 60, 30);
                this.context.closePath();
                this.context.fill();
            }
            
            /* Next. */
            this.context.beginPath();
            this.context.moveTo(this.canvas.width - 70, 10);
            this.context.lineTo(this.canvas.width - 90, 20);
            this.context.lineTo(this.canvas.width - 70, 30);
            this.context.closePath();
            this.context.fill();
            this.context.fillRect(this.canvas.width - 90, 10, 4, 20);
        
        }
    }
    
    /* Start the visualizer. */
    this.start = function() {
        this.audio = audio();
        if (this.canvas === null) { console.log("No canvas bound"); return; }
    }
    
}

function Bars() {
    
    this.config = {};
    this.config.gap = 3;
    this.config.bottom = 0;
    this.config.height = 400;
    this.config.start = 0;
    this.config.range = 75;
    this.config.count = 75;
    
    this.draw = function(canvas, context, analyser, theme) {
        var array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        var width = (canvas.width - (this.config.range+1)*this.config.gap) / this.config.range;
        var step = Math.round(this.config.range / Math.min(this.config.range, this.config.count));
        
        for (var i = 0; i < this.config.range; i++) {
            var value = Math.pow(array[i * step + this.config.start],2)/256/256;
            var x = Math.floor(i * (width + this.config.gap) + this.config.gap)
            var y = canvas.height - value*this.config.height;
            
            context.fillStyle = "rgb("+Math.floor(value*this.theme.r)+","+Math.floor(value*this.theme.g)+","+Math.floor(value*this.theme.b)+")";
            context.fillRect(x, y, Math.ceil(width), value*this.config.height - this.config.bottom);
        }
    }
    
}


