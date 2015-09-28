define(["Tone", "jquery", "Logo.scss", "Waveforms"], function(Tone, $, LogoStyle, Waveforms){

	var colors = ["#3833ED","#1EDF3E","#ED3333","#7F33ED","#22DBC0","#ED33CF","#FFFC0C","#f5871f"];

	var bufferLen = 256;

	var waveform = Waveforms(bufferLen).random;

	/**
	 *  @class  Tone.Logo visualizes current Tone.js context
	 *  @param  {Object}  options  The options
	 */
	Tone.Logo = function(options){

		options = this.defaultArg(options, Tone.Logo.defaults);

		/**
		 *  The container element
		 *  @type  {Element}
		 */
		this.element = $("<div>", {
			"id" : "TonejsLogo"
		}).appendTo(options.container);


		/**
		 *  the Tone.js title
		 *  @type  {Element}
		 */
		this.textContainer = $("<div>", {
			"id" : "TextContainer",
		}).appendTo(this.element);

		/**
		 *  the waveform canvas
		 *  @type  {Element}
		 */
		this.canvas = $("<canvas>", {
			"id" : "Canvas",
		}).appendTo(this.textContainer);

		/**
		 *  the drawing context
		 *  @type  {Canavs}
		 */
		this.context = this.canvas.get(0).getContext("2d");

		/**
		 *  the Tone.js title
		 *  @type  {Element}
		 */
		this.title = $("<div>", {
			"id" : "Title",
			// "text" : "Tone.js"
		}).appendTo(this.textContainer).html("Tone<span>.</span>js");

		/**
		 *  The waveform analysis of the incoming signal
		 *  @type  {Tone.Analyser}
		 */
		this.analyser = new Tone.Analyser({
			"size" : bufferLen,
			"type" : "waveform",
			"returnType" : "byte"
		});

		/**
		 *  A signal to make the analyser rest
		 *  at 0 when nothing is connected
		 *  @private
		 */
		this._signal = new Tone.Signal(0).connect(this.analyser);

		/**
		 *  the value below which it is considered silent
		 */
		this._silentThresh = 0.01;

		/**
		 *  The current RMS of the incoming signal
		 */
		this._rms = 0;

		//set the size
		this.resize(options.width, options.height);
		//connect the master output to the analyser
		Tone.Master.connect(this.analyser);

		//start the draw loop
		this._draw();
	};

	Tone.extend(Tone.Logo);

	/**
	 *  The defaults
	 *  @type  {Object}
	 */
	Tone.Logo.defaults = {
		"container" : "body",
		"width" : 300,
		"height" : 80,
	};

	/**
	 *  Set the size of the logo
	 *  @param  {Number}  width
	 *  @param  {Number}  height
	 *  @return  {Tone.Logo}  this
	 */
	Tone.Logo.prototype.resize = function(width, height) {
		//set the size of the logo
		this.element.width(width);
		this.element.height(height);
		// this.canvas.width(height);
		//double pixel density
		this.context.canvas.width = this.canvas.height() * 2;
		this.context.canvas.height = this.canvas.height() * 2;
		//set the font size

		this.title.css({
			"line-height" : (height * 0.85).toString() + "px",
			"font-size" : height * 0.88,
			// "text-shadow" : "-"+textShadow+"px "+textShadow+"px #3833ED"
		});
		this.canvas.css({
			"border-radius" : height/50,
			"width" : this.canvas.height(),
			"height" : this.canvas.height()
		});
		return this;
	};

	/**
	 *  The draw loop which paints the waveform
	 */
	Tone.Logo.prototype._draw = function() {
		requestAnimationFrame(this._draw.bind(this));
		var analysis = this.analyser.analyse();
		//if it's silent, draw a canned waveform when the mouse is over
		if (this._isSilent(analysis)){
			this._drawBuffer(waveform, true);
		} else { //if it's not silent, draw the waveform
			this._drawBuffer(analysis, false);
		}
	};

	/**
	 *  Draw the given buffer onto the canvas
	 */
	Tone.Logo.prototype._drawBuffer = function(buffer, silent){
		var context = this.context;
		var width = this.context.canvas.width;
		var height = this.context.canvas.height;
		if (silent){
			margin = this._scale(this._rms, 0, this._silentThresh, height * 0.2, height * 0.5);
		} else {
			margin = height * 0.2;
		}
		var sideMargin = this.lineWidth;
		context.clearRect(0, 0, width, height);
		context.beginPath();

		var firstValue;

		for (var i = 0, len = buffer.length; i < len; i++){
			var x = this._scale(i, 0, len - 1, 0, width);
			var y = this._scale(buffer[i], 0, 255, height - margin, margin);
			if (i === 0){
				firstValue = y;
				context.moveTo(x, y);
			} else {
				context.lineTo(x, y);
			}
		}
		context.lineTo(width, height);
		context.lineTo(0, height);
		context.lineTo(0, firstValue);
		context.lineCap = "round";
		// context.stroke();
		context.fillStyle = "#22DBC0";
		context.fill();

	};

	/**
	 *  True if the analyser analysis array is silent (all 0s)
	 *  @private
	 */
	Tone.Logo.prototype._isSilent = function(analysis){
		//if the average is close to 128
		var total = 0;
		for (var i = 0; i < analysis.length; i++){
			total += Math.pow((analysis[i] - 128) / 128, 2);
		}
		var rms = Math.sqrt(total / analysis.length);
		this._rms = Math.max(rms, this._rms * 0.9);
		return this._rms < this._silentThresh;
	};

	/**
	 *  Scale a value from between the inputMin/Max to the outputMin/Max
	 *  @private
	 */
	Tone.Logo.prototype._scale = function(value, inputMin, inputMax, outputMin, outputMax){
		var norm = (value - inputMin) / (inputMax - inputMin);
		return norm * (outputMax - outputMin) + outputMin;
	};

	/**
	 *  Clean up
	 *  @returns {Tone.Logo} this
	 */
	Tone.Logo.prototype.dispose = function(){
		this.element.remove();
		this.element = null;
		this.canvas.remove();
		this.canvas = null;
		this.title.remove();
		this.title = null;
		this.context = null;
		this.analyser.dispose();
		this.analyser = null;
		this._signal.dispose();
		this._signal = null;
	};

	return Tone.Logo;
});