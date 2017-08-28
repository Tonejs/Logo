define(["Logo.scss", "Analyser", "T.svg"], function(LogoStyle, Analyser, svgT){

	/**
	 *  @class  Logo visualizes current Tone.js context
	 *  @param  {Object}  options  The options
	 */
	var Logo = function(options){

		if (this instanceof Logo) {

			//get the defaults
			for (var attr in Logo.defaults){
				if (typeof options[attr] === "undefined"){
					options[attr] = Logo.defaults[attr];
				}
			}

			/**
			 *  The container element
			 *  @type  {Element}
			 */
			this.element = document.createElement("div");
			this.element.id = "TonejsLogo";

			if (typeof options.container === "string"){
				document.querySelector(options.container).appendChild(this.element);
			} else if (options.container instanceof Element){
				options.container.appendChild(this.element);
			}


			/**
			 *  the Tone.js title
			 *  @type  {Element}
			 */
			this.logoContainer = document.createElement("div");
			this.logoContainer.id = "LogoContainer";
			this.logoContainer.innerHTML = "<span id='T'></span><span id='one'></span><span id='js'></span>";
			this.element.appendChild(this.logoContainer);

			/**
			 *  the element which holds the waveform
			 *  @type  {Element}
			 */
			this.canvasContainer = document.createElement("div");
			this.canvasContainer.id = "Canvas";
			this.logoContainer.appendChild(this.canvasContainer);

			/**
			 *  the waveform
			 *  @type  {Analyser}
			 */
			this.analyser = new Analyser(this.canvasContainer);

			/**
			 *  The link
			 *  @type {Element}
			 */
			this.link = document.createElement("a");
			this.link.href = "https://tonejs.github.io";
			this.logoContainer.appendChild(this.link);


			this.resize(options.width, options.height);

		} else {
			return new Logo(options);
		}
	};

	/**
	 *  The defaults
	 *  @type  {Object}
	 */
	Logo.defaults = {
		"container" : "body",
		"width" : 300,
		"height" : 80,
	};

	/**
	 *  Set the size of the logo
	 *  @param  {Number}  width
	 *  @param  {Number}  height
	 *  @return  {Logo}  this
	 */
	Logo.prototype.resize = function(width, height) {
		//set the size of the logo
		this.element.style.width = width + "px";
		this.element.style.height = height + "px";

		// make sure the logo container maintains the right aspect ratio
		width = height / 0.3;

		this.logoContainer.style.width = width + "px";
		this.logoContainer.style.height = height + "px";

		this.canvasContainer.style.borderRadius = height/50 + "px";
		this.canvasContainer.style.width = this.canvasContainer.offsetHeight + "px";
		this.canvasContainer.style.height = this.canvasContainer.offsetHeight + "px";

		this.analyser.resize(this.canvasContainer.offsetHeight, this.canvasContainer.offsetHeight);

		return this;
	};

	/**
	 *  The draw loop which paints the waveform
	 */
	Logo.prototype._draw = function() {
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
	Logo.prototype._drawBuffer = function(buffer, silent){
		var context = this.context;
		var width = this.context.canvas.width;
		var height = this.context.canvas.height;
		if (silent){
			margin = this._scale(this._rms, 0, this._silentThresh, height * 0.2, height * 0.5);
		} else {
			margin = height * 0.2;
		}
		context.clearRect(0, 0, width, height);
		context.beginPath();

		var firstValue;

		for (var i = 0, len = buffer.length; i < len; i++){
			var x = this._scale(i, 0, len - 1, 0, width);
			var y = this._scale(buffer[i], -1, 1, height - margin, margin);
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
	Logo.prototype._isSilent = function(analysis){
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
	Logo.prototype._scale = function(value, inputMin, inputMax, outputMin, outputMax){
		var norm = (value - inputMin) / (inputMax - inputMin);
		return norm * (outputMax - outputMin) + outputMin;
	};

	/**
	 *  Clean up
	 *  @returns {Logo} this
	 */
	Logo.prototype.dispose = function(){
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

	return Logo;
});
