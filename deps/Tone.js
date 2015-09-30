(function (root) {
	"use strict";
	var Tone;
	//constructs the main Tone object
	function Main(func){
		Tone = func();
	}
	//invokes each of the modules with the main Tone object as the argument
	function Module(func){
		func(Tone);
	}
	/**
	 *  Tone.js
	 *  @author Yotam Mann
	 *  @license http://opensource.org/licenses/MIT MIT License
	 *  @copyright 2014-2015 Yotam Mann
	 */
	Main(function () {
	    
	    //////////////////////////////////////////////////////////////////////////
	    //	WEB AUDIO CONTEXT
	    ///////////////////////////////////////////////////////////////////////////
	    //borrowed from underscore.js
	    function isUndef(val) {
	        return val === void 0;
	    }
	    //borrowed from underscore.js
	    function isFunction(val) {
	        return typeof val === 'function';
	    }
	    var audioContext;
	    //polyfill for AudioContext and OfflineAudioContext
	    if (isUndef(window.AudioContext)) {
	        window.AudioContext = window.webkitAudioContext;
	    }
	    if (isUndef(window.OfflineAudioContext)) {
	        window.OfflineAudioContext = window.webkitOfflineAudioContext;
	    }
	    if (!isUndef(AudioContext)) {
	        audioContext = new AudioContext();
	    } else {
	        throw new Error('Web Audio is not supported in this browser');
	    }
	    //SHIMS////////////////////////////////////////////////////////////////////
	    if (!isFunction(AudioContext.prototype.createGain)) {
	        AudioContext.prototype.createGain = AudioContext.prototype.createGainNode;
	    }
	    if (!isFunction(AudioContext.prototype.createDelay)) {
	        AudioContext.prototype.createDelay = AudioContext.prototype.createDelayNode;
	    }
	    if (!isFunction(AudioContext.prototype.createPeriodicWave)) {
	        AudioContext.prototype.createPeriodicWave = AudioContext.prototype.createWaveTable;
	    }
	    if (!isFunction(AudioBufferSourceNode.prototype.start)) {
	        AudioBufferSourceNode.prototype.start = AudioBufferSourceNode.prototype.noteGrainOn;
	    }
	    if (!isFunction(AudioBufferSourceNode.prototype.stop)) {
	        AudioBufferSourceNode.prototype.stop = AudioBufferSourceNode.prototype.noteOff;
	    }
	    if (!isFunction(OscillatorNode.prototype.start)) {
	        OscillatorNode.prototype.start = OscillatorNode.prototype.noteOn;
	    }
	    if (!isFunction(OscillatorNode.prototype.stop)) {
	        OscillatorNode.prototype.stop = OscillatorNode.prototype.noteOff;
	    }
	    if (!isFunction(OscillatorNode.prototype.setPeriodicWave)) {
	        OscillatorNode.prototype.setPeriodicWave = OscillatorNode.prototype.setWaveTable;
	    }
	    //extend the connect function to include Tones
	    AudioNode.prototype._nativeConnect = AudioNode.prototype.connect;
	    AudioNode.prototype.connect = function (B, outNum, inNum) {
	        if (B.input) {
	            if (Array.isArray(B.input)) {
	                if (isUndef(inNum)) {
	                    inNum = 0;
	                }
	                this.connect(B.input[inNum]);
	            } else {
	                this.connect(B.input, outNum, inNum);
	            }
	        } else {
	            try {
	                if (B instanceof AudioNode) {
	                    this._nativeConnect(B, outNum, inNum);
	                } else {
	                    this._nativeConnect(B, outNum);
	                }
	            } catch (e) {
	                throw new Error('error connecting to node: ' + B);
	            }
	        }
	    };
	    ///////////////////////////////////////////////////////////////////////////
	    //	TONE
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *  @class  Tone is the base class of all other classes. It provides 
		 *          a lot of methods and functionality to all classes that extend
		 *          it. 
		 *  
		 *  @constructor
		 *  @alias Tone
		 *  @param {number} [inputs=1] the number of input nodes
		 *  @param {number} [outputs=1] the number of output nodes
		 */
	    var Tone = function (inputs, outputs) {
	        /**
			 *  the input node(s)
			 *  @type {GainNode|Array}
			 */
	        if (isUndef(inputs) || inputs === 1) {
	            this.input = this.context.createGain();
	        } else if (inputs > 1) {
	            this.input = new Array(inputs);
	        }
	        /**
			 *  the output node(s)
			 *  @type {GainNode|Array}
			 */
	        if (isUndef(outputs) || outputs === 1) {
	            this.output = this.context.createGain();
	        } else if (outputs > 1) {
	            this.output = new Array(inputs);
	        }
	    };
	    /**
		 *  Set the parameters at once. Either pass in an
		 *  object mapping parameters to values, or to set a
		 *  single parameter, by passing in a string and value.
		 *  The last argument is an optional ramp time which 
		 *  will ramp any signal values to their destination value
		 *  over the duration of the rampTime.
		 *  @param {Object|string} params
		 *  @param {number=} value
		 *  @param {Time=} rampTime
		 *  @returns {Tone} this
		 *  @example
		 * //set values using an object
		 * filter.set({
		 * 	"frequency" : 300,
		 * 	"type" : highpass
		 * });
		 *  @example
		 * filter.set("type", "highpass");
		 *  @example
		 * //ramp to the value 220 over 3 seconds. 
		 * oscillator.set({
		 * 	"frequency" : 220
		 * }, 3);
		 */
	    Tone.prototype.set = function (params, value, rampTime) {
	        if (typeof params === 'object') {
	            rampTime = value;
	        } else if (typeof params === 'string') {
	            var tmpObj = {};
	            tmpObj[params] = value;
	            params = tmpObj;
	        }
	        for (var attr in params) {
	            value = params[attr];
	            var parent = this;
	            if (attr.indexOf('.') !== -1) {
	                var attrSplit = attr.split('.');
	                for (var i = 0; i < attrSplit.length - 1; i++) {
	                    parent = parent[attrSplit[i]];
	                }
	                attr = attrSplit[attrSplit.length - 1];
	            }
	            var param = parent[attr];
	            if (isUndef(param)) {
	                continue;
	            }
	            if (isFunction(Tone.Signal) && param instanceof Tone.Signal) {
	                if (param.value !== value) {
	                    if (isUndef(rampTime)) {
	                        param.value = value;
	                    } else {
	                        param.rampTo(value, rampTime);
	                    }
	                }
	            } else if (param instanceof AudioParam) {
	                if (param.value !== value) {
	                    param.value = value;
	                }
	            } else if (param instanceof Tone) {
	                param.set(value);
	            } else if (param !== value) {
	                parent[attr] = value;
	            }
	        }
	        return this;
	    };
	    /**
		 *  Get the object's attributes. Given no arguments get
		 *  will return all available object properties and their corresponding
		 *  values. Pass in a single attribute to retrieve or an array
		 *  of attributes. The attribute strings can also include a "."
		 *  to access deeper properties.
		 *  @example
		 * osc.get();
		 * //returns {"type" : "sine", "frequency" : 440, ...etc}
		 *  @example
		 * osc.get("type");
		 * //returns { "type" : "sine"}
		 * @example
		 * //use dot notation to access deep properties
		 * synth.get(["envelope.attack", "envelope.release"]);
		 * //returns {"envelope" : {"attack" : 0.2, "release" : 0.4}}
		 *  @param {Array=|string|undefined} params the parameters to get, otherwise will return 
		 *  					                  all available.
		 *  @returns {Object}
		 */
	    Tone.prototype.get = function (params) {
	        if (isUndef(params)) {
	            params = this._collectDefaults(this.constructor);
	        } else if (typeof params === 'string') {
	            params = [params];
	        }
	        var ret = {};
	        for (var i = 0; i < params.length; i++) {
	            var attr = params[i];
	            var parent = this;
	            var subRet = ret;
	            if (attr.indexOf('.') !== -1) {
	                var attrSplit = attr.split('.');
	                for (var j = 0; j < attrSplit.length - 1; j++) {
	                    var subAttr = attrSplit[j];
	                    subRet[subAttr] = subRet[subAttr] || {};
	                    subRet = subRet[subAttr];
	                    parent = parent[subAttr];
	                }
	                attr = attrSplit[attrSplit.length - 1];
	            }
	            var param = parent[attr];
	            if (typeof params[attr] === 'object') {
	                subRet[attr] = param.get();
	            } else if (Tone.Signal && param instanceof Tone.Signal) {
	                subRet[attr] = param.value;
	            } else if (param instanceof AudioParam) {
	                subRet[attr] = param.value;
	            } else if (param instanceof Tone) {
	                subRet[attr] = param.get();
	            } else if (!isFunction(param) && !isUndef(param)) {
	                subRet[attr] = param;
	            }
	        }
	        return ret;
	    };
	    /**
		 *  collect all of the default attributes in one
		 *  @private
		 *  @param {function} constr the constructor to find the defaults from
		 *  @return {Array} all of the attributes which belong to the class
		 */
	    Tone.prototype._collectDefaults = function (constr) {
	        var ret = [];
	        if (!isUndef(constr.defaults)) {
	            ret = Object.keys(constr.defaults);
	        }
	        if (!isUndef(constr._super)) {
	            var superDefs = this._collectDefaults(constr._super);
	            //filter out repeats
	            for (var i = 0; i < superDefs.length; i++) {
	                if (ret.indexOf(superDefs[i]) === -1) {
	                    ret.push(superDefs[i]);
	                }
	            }
	        }
	        return ret;
	    };
	    /**
		 *  Set the preset if it exists. 
		 *  @param {string} presetName the name of the preset
		 *  @returns {Tone} this
		 */
	    Tone.prototype.setPreset = function (presetName) {
	        if (!this.isUndef(this.preset) && this.preset.hasOwnProperty(presetName)) {
	            this.set(this.preset[presetName]);
	        }
	        return this;
	    };
	    /**
		 *  @returns {string} returns the name of the class as a string
		 */
	    Tone.prototype.toString = function () {
	        for (var className in Tone) {
	            var isLetter = className[0].match(/^[A-Z]$/);
	            var sameConstructor = Tone[className] === this.constructor;
	            if (isFunction(Tone[className]) && isLetter && sameConstructor) {
	                return className;
	            }
	        }
	        return 'Tone';
	    };
	    ///////////////////////////////////////////////////////////////////////////
	    //	CLASS VARS
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *  A static pointer to the audio context accessible as Tone.context. 
		 *  @type {AudioContext}
		 */
	    Tone.context = audioContext;
	    /**
		 *  The audio context.
		 *  @type {AudioContext}
		 */
	    Tone.prototype.context = Tone.context;
	    /**
		 *  the default buffer size
		 *  @type {number}
		 *  @static
		 *  @const
		 */
	    Tone.prototype.bufferSize = 2048;
	    /**
		 *  The delay time of a single frame (128 samples according to the spec). 
		 *  @type {number}
		 *  @static
		 *  @const
		 */
	    Tone.prototype.blockTime = 128 / Tone.context.sampleRate;
	    ///////////////////////////////////////////////////////////////////////////
	    //	CONNECTIONS
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *  disconnect and dispose
		 *  @returns {Tone} this
		 */
	    Tone.prototype.dispose = function () {
	        if (!this.isUndef(this.input)) {
	            if (this.input instanceof AudioNode) {
	                this.input.disconnect();
	            }
	            this.input = null;
	        }
	        if (!this.isUndef(this.output)) {
	            if (this.output instanceof AudioNode) {
	                this.output.disconnect();
	            }
	            this.output = null;
	        }
	        return this;
	    };
	    /**
		 *  a silent connection to the DesinationNode
		 *  which will ensure that anything connected to it
		 *  will not be garbage collected
		 *  
		 *  @private
		 */
	    var _silentNode = null;
	    /**
		 *  makes a connection to ensure that the node will not be garbage collected
		 *  until 'dispose' is explicitly called
		 *
		 *  use carefully. circumvents JS and WebAudio's normal Garbage Collection behavior
		 *  @returns {Tone} this
		 */
	    Tone.prototype.noGC = function () {
	        this.output.connect(_silentNode);
	        return this;
	    };
	    AudioNode.prototype.noGC = function () {
	        this.connect(_silentNode);
	        return this;
	    };
	    /**
		 *  connect the output of a ToneNode to an AudioParam, AudioNode, or ToneNode
		 *  @param  {Tone | AudioParam | AudioNode} unit 
		 *  @param {number} [outputNum=0] optionally which output to connect from
		 *  @param {number} [inputNum=0] optionally which input to connect to
		 *  @returns {Tone} this
		 */
	    Tone.prototype.connect = function (unit, outputNum, inputNum) {
	        if (Array.isArray(this.output)) {
	            outputNum = this.defaultArg(outputNum, 0);
	            this.output[outputNum].connect(unit, 0, inputNum);
	        } else {
	            this.output.connect(unit, outputNum, inputNum);
	        }
	        return this;
	    };
	    /**
		 *  disconnect the output
		 *  @returns {Tone} this
		 */
	    Tone.prototype.disconnect = function (outputNum) {
	        if (Array.isArray(this.output)) {
	            outputNum = this.defaultArg(outputNum, 0);
	            this.output[outputNum].disconnect();
	        } else {
	            this.output.disconnect();
	        }
	        return this;
	    };
	    /**
		 *  connect together all of the arguments in series
		 *  @param {...AudioParam|Tone|AudioNode}
		 *  @returns {Tone} this
		 */
	    Tone.prototype.connectSeries = function () {
	        if (arguments.length > 1) {
	            var currentUnit = arguments[0];
	            for (var i = 1; i < arguments.length; i++) {
	                var toUnit = arguments[i];
	                currentUnit.connect(toUnit);
	                currentUnit = toUnit;
	            }
	        }
	        return this;
	    };
	    /**
		 *  fan out the connection from the first argument to the rest of the arguments
		 *  @param {...AudioParam|Tone|AudioNode}
		 *  @returns {Tone} this
		 */
	    Tone.prototype.connectParallel = function () {
	        var connectFrom = arguments[0];
	        if (arguments.length > 1) {
	            for (var i = 1; i < arguments.length; i++) {
	                var connectTo = arguments[i];
	                connectFrom.connect(connectTo);
	            }
	        }
	        return this;
	    };
	    /**
		 *  Connect the output of this node to the rest of the nodes in series.
		 *  @example
		 *  //connect a node to an effect, panVol and then to the master output
		 *  node.chain(effect, panVol, Tone.Master);
		 *  @param {...AudioParam|Tone|AudioNode} nodes
		 *  @returns {Tone} this
		 */
	    Tone.prototype.chain = function () {
	        if (arguments.length > 0) {
	            var currentUnit = this;
	            for (var i = 0; i < arguments.length; i++) {
	                var toUnit = arguments[i];
	                currentUnit.connect(toUnit);
	                currentUnit = toUnit;
	            }
	        }
	        return this;
	    };
	    /**
		 *  connect the output of this node to the rest of the nodes in parallel.
		 *  @param {...AudioParam|Tone|AudioNode}
		 *  @returns {Tone} this
		 */
	    Tone.prototype.fan = function () {
	        if (arguments.length > 0) {
	            for (var i = 0; i < arguments.length; i++) {
	                this.connect(arguments[i]);
	            }
	        }
	        return this;
	    };
	    //give native nodes chain and fan methods
	    AudioNode.prototype.chain = Tone.prototype.chain;
	    AudioNode.prototype.fan = Tone.prototype.fan;
	    ///////////////////////////////////////////////////////////////////////////
	    //	UTILITIES / HELPERS / MATHS
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *  if a the given is undefined, use the fallback. 
		 *  if both given and fallback are objects, given
		 *  will be augmented with whatever properties it's
		 *  missing which are in fallback
		 *
		 *  warning: if object is self referential, it will go into an an 
		 *  infinite recursive loop. 
		 *  
		 *  @param  {*} given    
		 *  @param  {*} fallback 
		 *  @return {*}          
		 */
	    Tone.prototype.defaultArg = function (given, fallback) {
	        if (typeof given === 'object' && typeof fallback === 'object' && !Array.isArray(given) && !Array.isArray(fallback)) {
	            var ret = {};
	            //make a deep copy of the given object
	            for (var givenProp in given) {
	                ret[givenProp] = this.defaultArg(given[givenProp], given[givenProp]);
	            }
	            for (var prop in fallback) {
	                ret[prop] = this.defaultArg(given[prop], fallback[prop]);
	            }
	            return ret;
	        } else {
	            return isUndef(given) ? fallback : given;
	        }
	    };
	    /**
		 *  returns the args as an options object with given arguments
		 *  mapped to the names provided. 
		 *
		 *  if the args given is an array containing an object, it is assumed
		 *  that that's already the options object and will just return it. 
		 *  
		 *  @param  {Array} values  the 'arguments' object of the function
		 *  @param  {Array} keys the names of the arguments as they
		 *                                 should appear in the options object
		 *  @param {Object=} defaults optional defaults to mixin to the returned 
		 *                            options object                              
		 *  @return {Object}       the options object with the names mapped to the arguments
		 */
	    Tone.prototype.optionsObject = function (values, keys, defaults) {
	        var options = {};
	        if (values.length === 1 && typeof values[0] === 'object') {
	            options = values[0];
	        } else {
	            for (var i = 0; i < keys.length; i++) {
	                options[keys[i]] = values[i];
	            }
	        }
	        if (!this.isUndef(defaults)) {
	            return this.defaultArg(options, defaults);
	        } else {
	            return options;
	        }
	    };
	    /**
		 *  test if the arg is undefined
		 *  @param {*} arg the argument to test
		 *  @returns {boolean} true if the arg is undefined
		 *  @function
		 */
	    Tone.prototype.isUndef = isUndef;
	    /**
		 *  test if the arg is a function
		 *  @param {*} arg the argument to test
		 *  @returns {boolean} true if the arg is a function
		 *  @function
		 */
	    Tone.prototype.isFunction = isFunction;
	    /**
		 *  Test if the argument is a number, or a 
		 *  string in the form of a number.
		 *  @param {*} arg the argument to test
		 *  @returns {boolean} true if the arg is a number
		 *  @function
		 */
	    Tone.prototype.isNumber = function () {
	        var exp = /^\d+(\.\d+)?$/;
	        return function (arg) {
	            return typeof arg === 'number' || typeof arg === 'string' && exp.test(arg);
	        };
	    }();
	    /**
		 *  An empty function.
		 *  @static
		 */
	    Tone.noOp = function () {
	    };
	    /**
		 *  Make the property not writable. Internal use only. 
		 *  @private
		 *  @param  {string}  property  the property to make not writable
		 */
	    Tone.prototype._readOnly = function (property) {
	        if (Array.isArray(property)) {
	            for (var i = 0; i < property.length; i++) {
	                this._readOnly(property[i]);
	            }
	        } else {
	            Object.defineProperty(this, property, {
	                writable: false,
	                enumerable: true
	            });
	        }
	    };
	    /**
		 *  Make an attribute writeable. Interal use only. 
		 *  @private
		 *  @param  {string}  property  the property to make writable
		 */
	    Tone.prototype._writable = function (property) {
	        if (Array.isArray(property)) {
	            for (var i = 0; i < property.length; i++) {
	                this._writable(property[i]);
	            }
	        } else {
	            Object.defineProperty(this, property, { writable: true });
	        }
	    };
	    /**
		 * Possible play states. 
		 * @enum {string}
		 */
	    Tone.State = {
	        Started: 'started',
	        Stopped: 'stopped',
	        Paused: 'paused'
	    };
	    ///////////////////////////////////////////////////////////////////////////
	    // GAIN CONVERSIONS
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *  Equal power gain scale. Good for cross-fading.
		 *  @param  {NormalRange} percent (0-1)
		 *  @return {Gain}         output gain (0-1)
		 */
	    Tone.prototype.equalPowerScale = function (percent) {
	        var piFactor = 0.5 * Math.PI;
	        return Math.sin(percent * piFactor);
	    };
	    /**
		 *  Convert decibels into gain.
		 *  @param  {Decibels} db
		 *  @return {Gain}   
		 */
	    Tone.prototype.dbToGain = function (db) {
	        return Math.pow(2, db / 6);
	    };
	    /**
		 *  Convert gain to decibels.
		 *  @param  {Gain} gain (0-1)
		 *  @return {Decibels}   
		 */
	    Tone.prototype.gainToDb = function (gain) {
	        return 20 * (Math.log(gain) / Math.LN10);
	    };
	    ///////////////////////////////////////////////////////////////////////////
	    //	TIMING
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *  Return the current time of the clock + a single buffer frame. 
		 *  If this value is used to schedule a value to change, the earliest
		 *  it could be scheduled is the following frame. 
		 *  @return {number} the currentTime from the AudioContext
		 */
	    Tone.prototype.now = function () {
	        return this.context.currentTime;
	    };
	    ///////////////////////////////////////////////////////////////////////////
	    //	INHERITANCE
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *  have a child inherit all of Tone's (or a parent's) prototype
		 *  to inherit the parent's properties, make sure to call 
		 *  Parent.call(this) in the child's constructor
		 *
		 *  based on closure library's inherit function
		 *
		 *  @static
		 *  @param  {function} 	child  
		 *  @param  {function=} parent (optional) parent to inherit from
		 *                             if no parent is supplied, the child
		 *                             will inherit from Tone
		 */
	    Tone.extend = function (child, parent) {
	        if (isUndef(parent)) {
	            parent = Tone;
	        }
	        function TempConstructor() {
	        }
	        TempConstructor.prototype = parent.prototype;
	        child.prototype = new TempConstructor();
	        /** @override */
	        child.prototype.constructor = child;
	        child._super = parent;
	    };
	    ///////////////////////////////////////////////////////////////////////////
	    //	CONTEXT
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *  array of callbacks to be invoked when a new context is added
		 *  @private 
		 *  @private
		 */
	    var newContextCallbacks = [];
	    /**
		 *  invoke this callback when a new context is added
		 *  will be invoked initially with the first context
		 *  @private 
		 *  @static
		 *  @param {function(AudioContext)} callback the callback to be invoked
		 *                                           with the audio context
		 */
	    Tone._initAudioContext = function (callback) {
	        //invoke the callback with the existing AudioContext
	        callback(Tone.context);
	        //add it to the array
	        newContextCallbacks.push(callback);
	    };
	    /**
		 *  Tone automatically creates a context on init, but if you are working
		 *  with other libraries which also create an AudioContext, it can be
		 *  useful to set your own. If you are going to set your own context, 
		 *  be sure to do it at the start of your code, before creating any objects.
		 *  @static
		 *  @param {AudioContext} ctx The new audio context to set
		 */
	    Tone.setContext = function (ctx) {
	        //set the prototypes
	        Tone.prototype.context = ctx;
	        Tone.context = ctx;
	        //invoke all the callbacks
	        for (var i = 0; i < newContextCallbacks.length; i++) {
	            newContextCallbacks[i](ctx);
	        }
	    };
	    /**
		 *  Bind this to a touchstart event to start the audio on mobile devices. 
		 *  <br>
		 *  http://stackoverflow.com/questions/12517000/no-sound-on-ios-6-web-audio-api/12569290#12569290
		 *  @static
		 */
	    Tone.startMobile = function () {
	        var osc = Tone.context.createOscillator();
	        var silent = Tone.context.createGain();
	        silent.gain.value = 0;
	        osc.connect(silent);
	        silent.connect(Tone.context.destination);
	        var now = Tone.context.currentTime;
	        osc.start(now);
	        osc.stop(now + 1);
	    };
	    //setup the context
	    Tone._initAudioContext(function (audioContext) {
	        //set the blockTime
	        Tone.prototype.blockTime = 128 / audioContext.sampleRate;
	        _silentNode = audioContext.createGain();
	        _silentNode.gain.value = 0;
	        _silentNode.connect(audioContext.destination);
	    });
	    Tone.version = 'r6-dev';
	    console.log('%c * Tone.js ' + Tone.version + ' * ', 'background: #000; color: #fff');
	    return Tone;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Base class for all Signals. Used Internally. 
		 *
		 *  @constructor
		 *  @extends {Tone}
		 */
	    Tone.SignalBase = function () {
	    };
	    Tone.extend(Tone.SignalBase);
	    /**
		 *  When signals connect to other signals or AudioParams, 
		 *  they take over the output value of that signal or AudioParam. 
		 *  For all other nodes, the behavior is the same as a default <code>connect</code>. 
		 *
		 *  @override
		 *  @param {AudioParam|AudioNode|Tone.Signal|Tone} node 
		 *  @param {number} [outputNumber=0] The output number to connect from.
		 *  @param {number} [inputNumber=0] The input number to connect to.
		 *  @returns {Tone.SignalBase} this
		 */
	    Tone.SignalBase.prototype.connect = function (node, outputNumber, inputNumber) {
	        //zero it out so that the signal can have full control
	        if (node.constructor === Tone.Signal) {
	            //cancel changes
	            node._value.cancelScheduledValues(0);
	            //reset the value
	            node._value.value = 0;
	            //mark the value as overridden
	            node.overridden = true;
	        } else if (node instanceof AudioParam) {
	            node.cancelScheduledValues(0);
	            node.value = 0;
	        }
	        Tone.prototype.connect.call(this, node, outputNumber, inputNumber);
	        return this;
	    };
	    return Tone.SignalBase;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Wraps the native Web Audio API 
		 *         [WaveShaperNode](http://webaudio.github.io/web-audio-api/#the-waveshapernode-interface).
		 *
		 *  @extends {Tone.SignalBase}
		 *  @constructor
		 *  @param {function|Array|Number} mapping The function used to define the values. 
		 *                                    The mapping function should take two arguments: 
		 *                                    the first is the value at the current position 
		 *                                    and the second is the array position. 
		 *                                    If the argument is an array, that array will be
		 *                                    set as the wave shaping function. The input
		 *                                    signal is an AudioRange [-1, 1] value and the output
		 *                                    signal can take on any numerical values. 
		 *                                    
		 *  @param {Number} [bufferLen=1024] The length of the WaveShaperNode buffer.
		 *  @example
		 * var timesTwo = new Tone.WaveShaper(function(val){
		 * 	return val * 2;
		 * }, 2048);
		 *  @example
		 * //a waveshaper can also be constructed with an array of values
		 * var invert = new Tone.WaveShaper([1, -1]);
		 */
	    Tone.WaveShaper = function (mapping, bufferLen) {
	        /**
			 *  the waveshaper
			 *  @type {WaveShaperNode}
			 *  @private
			 */
	        this._shaper = this.input = this.output = this.context.createWaveShaper();
	        /**
			 *  the waveshapers curve
			 *  @type {Float32Array}
			 *  @private
			 */
	        this._curve = null;
	        if (Array.isArray(mapping)) {
	            this.curve = mapping;
	        } else if (isFinite(mapping) || this.isUndef(mapping)) {
	            this._curve = new Float32Array(this.defaultArg(mapping, 1024));
	        } else if (this.isFunction(mapping)) {
	            this._curve = new Float32Array(this.defaultArg(bufferLen, 1024));
	            this.setMap(mapping);
	        }
	    };
	    Tone.extend(Tone.WaveShaper, Tone.SignalBase);
	    /**
		 *  Uses a mapping function to set the value of the curve. 
		 *  @param {function} mapping The function used to define the values. 
		 *                            The mapping function take two arguments: 
		 *                            the first is the value at the current position 
		 *                            which goes from -1 to 1 over the number of elements
		 *                            in the curve array. The second argument is the array position. 
		 *  @returns {Tone.WaveShaper} this
		 *  @example
		 * //map the input signal from [-1, 1] to [0, 10]
		 * shaper.setMap(function(val, index){
		 * 	return (val + 1) * 5;
		 * })
		 */
	    Tone.WaveShaper.prototype.setMap = function (mapping) {
	        for (var i = 0, len = this._curve.length; i < len; i++) {
	            var normalized = i / len * 2 - 1;
	            this._curve[i] = mapping(normalized, i);
	        }
	        this._shaper.curve = this._curve;
	        return this;
	    };
	    /**
		 * The array to set as the waveshaper curve. For linear curves
		 * array length does not make much difference, but for complex curves
		 * longer arrays will provide smoother interpolation. 
		 * @memberOf Tone.WaveShaper#
		 * @type {Array}
		 * @name curve
		 */
	    Object.defineProperty(Tone.WaveShaper.prototype, 'curve', {
	        get: function () {
	            return this._shaper.curve;
	        },
	        set: function (mapping) {
	            this._curve = new Float32Array(mapping);
	            this._shaper.curve = this._curve;
	        }
	    });
	    /**
		 * Specifies what type of oversampling (if any) should be used when 
		 * applying the shaping curve. Can either be "none", "2x" or "4x". 
		 * @memberOf Tone.WaveShaper#
		 * @type {string}
		 * @name oversample
		 */
	    Object.defineProperty(Tone.WaveShaper.prototype, 'oversample', {
	        get: function () {
	            return this._shaper.oversample;
	        },
	        set: function (oversampling) {
	            if ([
	                    'none',
	                    '2x',
	                    '4x'
	                ].indexOf(oversampling) !== -1) {
	                this._shaper.oversample = oversampling;
	            } else {
	                throw new Error('invalid oversampling: ' + oversampling);
	            }
	        }
	    });
	    /**
		 *  Clean up.
		 *  @returns {Tone.WaveShaper} this
		 */
	    Tone.WaveShaper.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._shaper.disconnect();
	        this._shaper = null;
	        this._curve = null;
	        return this;
	    };
	    return Tone.WaveShaper;
	});
	Module(function (Tone) {
	    ///////////////////////////////////////////////////////////////////////////
	    //	TYPES
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 * Units which a value can take on.
		 * @enum {String}
		 */
	    Tone.Type = {
	        /** 
			 *  The default value is a number which can take on any value between [-Infinity, Infinity]
			 */
	        Default: 'number',
	        /**
			 *  Time can be described in a number of ways. Read more [Time](https://github.com/Tonejs/Tone.js/wiki/Time).
			 *
			 *  <ul>
			 *  <li>Numbers, which will be taken literally as the time (in seconds).</li>
			 *  <li>Notation, ("4n", "8t") describes time in BPM and time signature relative values.</li>
			 *  <li>TransportTime, ("4:3:2") will also provide tempo and time signature relative times 
			 *  in the form BARS:QUARTERS:SIXTEENTHS.</li>
			 *  <li>Frequency, ("8hz") is converted to the length of the cycle in seconds.</li>
			 *  <li>Now-Relative, ("+1") prefix any of the above with "+" and it will be interpreted as 
			 *  "the current time plus whatever expression follows".</li>
			 *  <li>Expressions, ("3:0 + 2 - (1m / 7)") any of the above can also be combined 
			 *  into a mathematical expression which will be evaluated to compute the desired time.</li>
			 *  <li>No Argument, for methods which accept time, no argument will be interpreted as 
			 *  "now" (i.e. the currentTime).</li>
			 *  </ul>
			 *  
			 *  @typedef {Time}
			 */
	        Time: 'time',
	        /**
			 *  Frequency can be described similar to time, except ultimately the
			 *  values are converted to frequency instead of seconds. A number
			 *  is taken literally as the value in hertz. Additionally any of the 
			 *  Time encodings can be used. Note names in the form
			 *  of NOTE OCTAVE (i.e. C4) are also accepted and converted to their
			 *  frequency value. 
			 *  @typedef {Frequency}
			 */
	        Frequency: 'frequency',
	        /**
			 * Gain is the ratio between the input and the output value of a signal.
			 *  @typedef {Gain}
			 */
	        Gain: 'gain',
	        /** 
			 *  Normal values are within the range [0, 1].
			 *  @typedef {NormalRange}
			 */
	        NormalRange: 'normalRange',
	        /** 
			 *  AudioRange values are between [-1, 1].
			 *  @typedef {AudioRange}
			 */
	        AudioRange: 'audioRange',
	        /** 
			 *  Decibels are a logarithmic unit of measurement which is useful for volume
			 *  because of the logarithmic way that we perceive loudness. 0 decibels 
			 *  means no change in volume. -10db is approximately half as loud and 10db 
			 *  is twice is loud. 
			 *  @typedef {Decibels}
			 */
	        Decibels: 'db',
	        /** 
			 *  Half-step note increments, i.e. 12 is an octave above the root. and 1 is a half-step up.
			 *  @typedef {Interval}
			 */
	        Interval: 'interval',
	        /** 
			 *  Beats per minute. 
			 *  @typedef {BPM}
			 */
	        BPM: 'bpm',
	        /** 
			 *  The value must be greater than 0.
			 *  @typedef {Positive}
			 */
	        Positive: 'positive',
	        /** 
			 *  A cent is a hundredth of a semitone. 
			 *  @typedef {Cents}
			 */
	        Cents: 'cents',
	        /** 
			 *  Angle between 0 and 360. 
			 *  @typedef {Degrees}
			 */
	        Degrees: 'degrees',
	        /** 
			 *  A number representing a midi note.
			 *  @typedef {MIDI}
			 */
	        MIDI: 'midi',
	        /** 
			 *  A colon-separated representation of time in the form of
			 *  BARS:QUARTERS:SIXTEENTHS. 
			 *  @typedef {TransportTime}
			 */
	        TransportTime: 'transportTime',
	        /** 
			 *  Ticks are the basic subunit of the Transport. They are
			 *  the smallest unit of time that the Transport supports.
			 *  @typedef {Ticks}
			 */
	        Ticks: 'tick',
	        /** 
			 *  A frequency represented by a letter name, 
			 *  accidental and octave. This system is known as
			 *  [Scientific Pitch Notation](https://en.wikipedia.org/wiki/Scientific_pitch_notation).
			 *  @typedef {Note}
			 */
	        Note: 'note',
	        /** 
			 *  One millisecond is a thousandth of a second. 
			 *  @typedef {Milliseconds}
			 */
	        Milliseconds: 'milliseconds',
	        /** 
			 *  A string representing a duration relative to a measure. 
			 *  <ul>
			 *  	<li>"4n" = quarter note</li>
			 *   	<li>"2m" = two measures</li>
			 *    	<li>"8t" = eighth-note triplet</li>
			 *  </ul>
			 *  @typedef {Notation}
			 */
	        Notation: 'notation'
	    };
	    ///////////////////////////////////////////////////////////////////////////
	    //	MATCHING TESTS
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *  Test if a function is "now-relative", i.e. starts with "+".
		 *  
		 *  @param {String} str The string to test
		 *  @return {boolean} 
		 *  @method isNowRelative
		 *  @lends Tone.prototype.isNowRelative
		 */
	    Tone.prototype.isNowRelative = function () {
	        var nowRelative = new RegExp(/^\W*\+(.)+/i);
	        return function (note) {
	            return nowRelative.test(note);
	        };
	    }();
	    /**
		 *  Tests if a string is in Ticks notation. 
		 *  
		 *  @param {String} str The string to test
		 *  @return {boolean} 
		 *  @method isTicks
		 *  @lends Tone.prototype.isTicks
		 */
	    Tone.prototype.isTicks = function () {
	        var tickFormat = new RegExp(/^\d+i$/i);
	        return function (note) {
	            return tickFormat.test(note);
	        };
	    }();
	    /**
		 *  Tests if a string is musical notation.
		 *  i.e.:
		 *  <ul>
		 *  	<li>4n = quarter note</li>
		 *   	<li>2m = two measures</li>
		 *    	<li>8t = eighth-note triplet</li>
		 *  </ul>
		 *  
		 *  @param {String} str The string to test
		 *  @return {boolean} 
		 *  @method isNotation
		 *  @lends Tone.prototype.isNotation
		 */
	    Tone.prototype.isNotation = function () {
	        var notationFormat = new RegExp(/^[0-9]+[mnt]$/i);
	        return function (note) {
	            return notationFormat.test(note);
	        };
	    }();
	    /**
		 *  Test if a string is in the transportTime format. 
		 *  "Bars:Beats:Sixteenths"
		 *  @param {String} transportTime
		 *  @return {boolean} 
		 *  @method isTransportTime
		 *  @lends Tone.prototype.isTransportTime
		 */
	    Tone.prototype.isTransportTime = function () {
	        var transportTimeFormat = new RegExp(/^(\d+(\.\d+)?\:){1,2}(\d+(\.\d+)?)?$/i);
	        return function (transportTime) {
	            return transportTimeFormat.test(transportTime);
	        };
	    }();
	    /**
		 *  Test if a string is in Scientific Pitch Notation: i.e. "C4". 
		 *  @param  {String}  note The note to test
		 *  @return {boolean}      true if it's in the form of a note
		 *  @method isNote
		 *  @lends Tone.prototype.isNote
		 *  @function
		 */
	    Tone.prototype.isNote = function () {
	        var noteFormat = new RegExp(/^[a-g]{1}(b|#|x|bb)?-?[0-9]+$/i);
	        return function (note) {
	            return noteFormat.test(note);
	        };
	    }();
	    /**
		 *  Test if the input is in the format of number + hz
		 *  i.e.: 10hz
		 *
		 *  @param {String} freq 
		 *  @return {boolean} 
		 *  @function
		 */
	    Tone.prototype.isFrequency = function () {
	        var freqFormat = new RegExp(/^\d*\.?\d+hz$/i);
	        return function (freq) {
	            return freqFormat.test(freq);
	        };
	    }();
	    /**
		 *  Get the Tone.Type of the argument
		 *  @param {String|Number} value The value to test the type of
		 *  @returns {Tone.Type} The type of that value.
		 */
	    Tone.prototype.getType = function (value) {
	        if (this.isTicks(value)) {
	            return Tone.Type.Ticks;
	        } else if (this.isNotation(value)) {
	            return Tone.Type.Notation;
	        } else if (this.isNote(value)) {
	            return Tone.Type.Note;
	        } else if (this.isTransportTime(value)) {
	            return Tone.Type.TransportTime;
	        } else if (this.isFrequency(value)) {
	            return Tone.Type.Frequency;
	        } else if (isFinite(value)) {
	            return Tone.Type.Default;
	        }
	    };
	    ///////////////////////////////////////////////////////////////////////////
	    //	TO SECOND CONVERSIONS
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *  @private
		 *  @return  {Object}  The Transport's BPM if the Transport exists, 
		 *                         otherwise returns reasonable defaults.
		 */
	    function getTransportBpm() {
	        if (Tone.Transport && Tone.Transport.bpm) {
	            return Tone.Transport.bpm.value;
	        } else {
	            return 120;
	        }
	    }
	    /**
		 *  @private
		 *  @return  {Object}  The Transport's Time Signature if the Transport exists, 
		 *                         otherwise returns reasonable defaults.
		 */
	    function getTransportTimeSignature() {
	        if (Tone.Transport && Tone.Transport.timeSignature) {
	            return Tone.Transport.timeSignature;
	        } else {
	            return 4;
	        }
	    }
	    /**
		 *
		 *  convert notation format strings to seconds
		 *  
		 *  @param  {String} notation     
		 *  @param {BPM=} bpm 
		 *  @param {number=} timeSignature 
		 *  @return {number} 
		 *                
		 */
	    Tone.prototype.notationToSeconds = function (notation, bpm, timeSignature) {
	        bpm = this.defaultArg(bpm, getTransportBpm());
	        timeSignature = this.defaultArg(timeSignature, getTransportTimeSignature());
	        var beatTime = 60 / bpm;
	        //special case: 1n = 1m
	        if (notation === '1n') {
	            notation = '1m';
	        }
	        var subdivision = parseInt(notation, 10);
	        var beats = 0;
	        if (subdivision === 0) {
	            beats = 0;
	        }
	        var lastLetter = notation.slice(-1);
	        if (lastLetter === 't') {
	            beats = 4 / subdivision * 2 / 3;
	        } else if (lastLetter === 'n') {
	            beats = 4 / subdivision;
	        } else if (lastLetter === 'm') {
	            beats = subdivision * timeSignature;
	        } else {
	            beats = 0;
	        }
	        return beatTime * beats;
	    };
	    /**
		 *  convert transportTime into seconds.
		 *  
		 *  ie: 4:2:3 == 4 measures + 2 quarters + 3 sixteenths
		 *
		 *  @param  {TransportTime} transportTime 
		 *  @param {BPM=} bpm 
		 *  @param {number=} timeSignature
		 *  @return {number}               seconds
		 *
		 *  @lends Tone.prototype.transportTimeToSeconds
		 */
	    Tone.prototype.transportTimeToSeconds = function (transportTime, bpm, timeSignature) {
	        bpm = this.defaultArg(bpm, getTransportBpm());
	        timeSignature = this.defaultArg(timeSignature, getTransportTimeSignature());
	        var measures = 0;
	        var quarters = 0;
	        var sixteenths = 0;
	        var split = transportTime.split(':');
	        if (split.length === 2) {
	            measures = parseFloat(split[0]);
	            quarters = parseFloat(split[1]);
	        } else if (split.length === 1) {
	            quarters = parseFloat(split[0]);
	        } else if (split.length === 3) {
	            measures = parseFloat(split[0]);
	            quarters = parseFloat(split[1]);
	            sixteenths = parseFloat(split[2]);
	        }
	        var beats = measures * timeSignature + quarters + sixteenths / 4;
	        return beats * this.notationToSeconds('4n', bpm, timeSignature);
	    };
	    /**
		 *  convert ticks into seconds
		 *  
		 *  @param  {Ticks} ticks 
		 *  @param {BPM=} bpm 
		 *  @param {number=} timeSignature
		 *  @return {number}               seconds
		 *  @private
		 */
	    Tone.prototype.ticksToSeconds = function (ticks, bpm, timeSignature) {
	        if (this.isUndef(Tone.Transport)) {
	            return 0;
	        }
	        ticks = parseInt(ticks);
	        var quater = this.notationToSeconds('4n', bpm, timeSignature);
	        return quater * ticks / Tone.Transport.PPQ;
	    };
	    /**
		 *  Convert a frequency into seconds.
		 *  Accepts numbers and strings: i.e. "10hz" or 
		 *  10 both return 0.1. 
		 *  
		 *  @param  {Frequency} freq 
		 *  @return {number}      
		 */
	    Tone.prototype.frequencyToSeconds = function (freq) {
	        return 1 / parseFloat(freq);
	    };
	    /**
		 *  Convert a sample count to seconds.
		 *  @param  {number} samples 
		 *  @return {number}         
		 */
	    Tone.prototype.samplesToSeconds = function (samples) {
	        return samples / this.context.sampleRate;
	    };
	    /**
		 *  Convert from seconds to samples. 
		 *  @param  {number} seconds 
		 *  @return {number} The number of samples        
		 */
	    Tone.prototype.secondsToSamples = function (seconds) {
	        return seconds * this.context.sampleRate;
	    };
	    ///////////////////////////////////////////////////////////////////////////
	    //	FROM SECOND CONVERSIONS
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *  Convert seconds to transportTime in the form 
		 *  	"measures:quarters:sixteenths"
		 *
		 *  @param {Number} seconds 
		 *  @param {BPM=} bpm 
		 *  @param {Number=} timeSignature
		 *  @return {TransportTime}  
		 */
	    Tone.prototype.secondsToTransportTime = function (seconds, bpm, timeSignature) {
	        bpm = this.defaultArg(bpm, getTransportBpm());
	        timeSignature = this.defaultArg(timeSignature, getTransportTimeSignature());
	        var quarterTime = this.notationToSeconds('4n', bpm, timeSignature);
	        var quarters = seconds / quarterTime;
	        var measures = Math.floor(quarters / timeSignature);
	        var sixteenths = quarters % 1 * 4;
	        quarters = Math.floor(quarters) % timeSignature;
	        var progress = [
	            measures,
	            quarters,
	            sixteenths
	        ];
	        return progress.join(':');
	    };
	    /**
		 *  Convert a number in seconds to a frequency.
		 *  @param  {number} seconds 
		 *  @return {number}         
		 */
	    Tone.prototype.secondsToFrequency = function (seconds) {
	        return 1 / seconds;
	    };
	    ///////////////////////////////////////////////////////////////////////////
	    //	GENERALIZED CONVERSIONS
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *  Convert seconds to the closest transportTime in the form 
		 *  	measures:quarters:sixteenths
		 *
		 *  @method toTransportTime
		 *  
		 *  @param {Time} time 
		 *  @param {BPM=} bpm 
		 *  @param {number=} timeSignature
		 *  @return {TransportTime}  
		 *  
		 *  @lends Tone.prototype.toTransportTime
		 */
	    Tone.prototype.toTransportTime = function (time, bpm, timeSignature) {
	        var seconds = this.toSeconds(time, bpm, timeSignature);
	        return this.secondsToTransportTime(seconds, bpm, timeSignature);
	    };
	    /**
		 *  Convert a frequency representation into a number.
		 *  	
		 *  @param  {Frequency} freq 
		 *  @param {number=} 	now 	if passed in, this number will be 
		 *                        		used for all 'now' relative timings
		 *  @return {number}      the frequency in hertz
		 */
	    Tone.prototype.toFrequency = function (freq, now) {
	        if (this.isFrequency(freq)) {
	            return parseFloat(freq);
	        } else if (this.isNotation(freq) || this.isTransportTime(freq)) {
	            return this.secondsToFrequency(this.toSeconds(freq, now));
	        } else if (this.isNote(freq)) {
	            return this.noteToFrequency(freq);
	        } else {
	            return freq;
	        }
	    };
	    /**
		 *  Convert the time representation into ticks.
		 *  Now-Relative timing will be relative to the current
		 *  Tone.Transport.ticks. 
		 *  @param  {Time} time
		 *  @return {Ticks}   
		 *  @private   
		 */
	    Tone.prototype.toTicks = function (time, bpm, timeSignature) {
	        if (this.isUndef(Tone.Transport)) {
	            return 0;
	        }
	        //get the seconds
	        var plusNow = 0;
	        if (this.isNowRelative(time)) {
	            time = time.replace(/^\W*/, '');
	            plusNow = Tone.Transport.ticks;
	        } else if (this.isUndef(time)) {
	            return Tone.Transport.ticks;
	        }
	        var seconds = this.toSeconds(time);
	        var quarter = this.notationToSeconds('4n', bpm, timeSignature);
	        var quarters = seconds / quarter;
	        var tickNum = quarters * Tone.Transport.PPQ;
	        //quantize to tick value
	        return Math.round(tickNum) + plusNow;
	    };
	    /**
		 *  convert a time into samples
		 *  
		 *  @param  {Time} time
		 *  @return {number}         
		 */
	    Tone.prototype.toSamples = function (time) {
	        var seconds = this.toSeconds(time);
	        return Math.round(seconds * this.context.sampleRate);
	    };
	    /**
		 *  Convert Time into seconds.
		 *  
		 *  Unlike the method which it overrides, this takes into account 
		 *  transporttime and musical notation.
		 *
		 *  Time : 1.40
		 *  Notation: 4n|1m|2t
		 *  TransportTime: 2:4:1 (measure:quarters:sixteens)
		 *  Now Relative: +3n
		 *  Math: 3n+16n or even very complicated expressions ((3n*2)/6 + 1)
		 *
		 *  @override
		 *  @param  {Time} time       
		 *  @param {number=} 	now 	if passed in, this number will be 
		 *                        		used for all 'now' relative timings
		 *  @return {number} 
		 */
	    Tone.prototype.toSeconds = function (time, now) {
	        now = this.defaultArg(now, this.now());
	        if (typeof time === 'number') {
	            return time;    //assuming that it's seconds
	        } else if (typeof time === 'string') {
	            var plusTime = 0;
	            if (this.isNowRelative(time)) {
	                time = time.replace(/^\W*/, '');
	                plusTime = now;
	            }
	            var components = time.split(/[\(\)\-\+\/\*]/);
	            if (components.length > 1) {
	                var originalTime = time;
	                for (var i = 0; i < components.length; i++) {
	                    var symb = components[i].trim();
	                    if (symb !== '') {
	                        var val = this.toSeconds(symb);
	                        time = time.replace(symb, val);
	                    }
	                }
	                try {
	                    //eval is evil, but i think it's safe here
	                    time = eval(time);    // jshint ignore:line
	                } catch (e) {
	                    throw new EvalError('problem evaluating Time: ' + originalTime);
	                }
	            } else if (this.isNotation(time)) {
	                time = this.notationToSeconds(time);
	            } else if (this.isTransportTime(time)) {
	                time = this.transportTimeToSeconds(time);
	            } else if (this.isFrequency(time)) {
	                time = this.frequencyToSeconds(time);
	            } else if (this.isTicks(time)) {
	                time = this.ticksToSeconds(time);
	            } else {
	                time = parseFloat(time);
	            }
	            return time + plusTime;
	        } else {
	            return now;
	        }
	    };
	    /**
		 *  Convert a Time to Notation. Values will be thresholded to the nearest 128th note. 
		 *  @param {Time} time 
		 *  @param {BPM=} bpm 
		 *  @param {number=} timeSignature
		 *  @return {Notation}  
		 */
	    Tone.prototype.toNotation = function (time, bpm, timeSignature) {
	        var testNotations = [
	            '1m',
	            '2n',
	            '4n',
	            '8n',
	            '16n',
	            '32n',
	            '64n',
	            '128n'
	        ];
	        var retNotation = toNotationHelper.call(this, time, bpm, timeSignature, testNotations);
	        //try the same thing but with tripelets
	        var testTripletNotations = [
	            '1m',
	            '2n',
	            '2t',
	            '4n',
	            '4t',
	            '8n',
	            '8t',
	            '16n',
	            '16t',
	            '32n',
	            '32t',
	            '64n',
	            '64t',
	            '128n'
	        ];
	        var retTripletNotation = toNotationHelper.call(this, time, bpm, timeSignature, testTripletNotations);
	        //choose the simpler expression of the two
	        if (retTripletNotation.split('+').length < retNotation.split('+').length) {
	            return retTripletNotation;
	        } else {
	            return retNotation;
	        }
	    };
	    /**
		 *  Helper method for Tone.toNotation
		 *  @private
		 */
	    function toNotationHelper(time, bpm, timeSignature, testNotations) {
	        var seconds = this.toSeconds(time);
	        var threshold = this.notationToSeconds(testNotations[testNotations.length - 1], bpm, timeSignature);
	        var retNotation = '';
	        for (var i = 0; i < testNotations.length; i++) {
	            var notationTime = this.notationToSeconds(testNotations[i], bpm, timeSignature);
	            //account for floating point errors (i.e. round up if the value is 0.999999)
	            var multiple = seconds / notationTime;
	            var floatingPointError = 0.000001;
	            if (1 - multiple % 1 < floatingPointError) {
	                multiple += floatingPointError;
	            }
	            multiple = Math.floor(multiple);
	            if (multiple > 0) {
	                if (multiple === 1) {
	                    retNotation += testNotations[i];
	                } else {
	                    retNotation += multiple.toString() + '*' + testNotations[i];
	                }
	                seconds -= multiple * notationTime;
	                if (seconds < threshold) {
	                    break;
	                } else {
	                    retNotation += ' + ';
	                }
	            }
	        }
	        return retNotation;
	    }
	    ///////////////////////////////////////////////////////////////////////////
	    //	FREQUENCY CONVERSIONS
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *  Note to scale index
		 *  @type  {Object}
		 */
	    var noteToScaleIndex = {
	        'cbb': -2,
	        'cb': -1,
	        'c': 0,
	        'c#': 1,
	        'cx': 2,
	        'dbb': 0,
	        'db': 1,
	        'd': 2,
	        'd#': 3,
	        'dx': 4,
	        'ebb': 2,
	        'eb': 3,
	        'e': 4,
	        'e#': 5,
	        'ex': 6,
	        'fbb': 3,
	        'fb': 4,
	        'f': 5,
	        'f#': 6,
	        'fx': 7,
	        'gbb': 5,
	        'gb': 6,
	        'g': 7,
	        'g#': 8,
	        'gx': 9,
	        'abb': 7,
	        'ab': 8,
	        'a': 9,
	        'a#': 10,
	        'ax': 11,
	        'bbb': 9,
	        'bb': 10,
	        'b': 11,
	        'b#': 12,
	        'bx': 13
	    };
	    /**
		 *  scale index to note (sharps)
		 *  @type  {Array}
		 */
	    var scaleIndexToNote = [
	        'C',
	        'C#',
	        'D',
	        'D#',
	        'E',
	        'F',
	        'F#',
	        'G',
	        'G#',
	        'A',
	        'A#',
	        'B'
	    ];
	    /**
		 *  The [concert pitch](https://en.wikipedia.org/wiki/Concert_pitch, 
		 *  A4's values in Hertz. 
		 *  @type {Frequency}
		 *  @static
		 */
	    Tone.A4 = 440;
	    /**
		 *  Convert a note name to frequency. 
		 *  @param  {String} note
		 *  @return {number}     
		 *  @example
		 * var freq = tone.noteToFrequency("A4"); //returns 440
		 */
	    Tone.prototype.noteToFrequency = function (note) {
	        //break apart the note by frequency and octave
	        var parts = note.split(/(-?\d+)/);
	        if (parts.length === 3) {
	            var index = noteToScaleIndex[parts[0].toLowerCase()];
	            var octave = parts[1];
	            var noteNumber = index + (parseInt(octave, 10) + 1) * 12;
	            return this.midiToFrequency(noteNumber);
	        } else {
	            return 0;
	        }
	    };
	    /**
		 *  Convert a frequency to a note name (i.e. A4, C#5).
		 *  @param  {number} freq
		 *  @return {String}         
		 */
	    Tone.prototype.frequencyToNote = function (freq) {
	        var log = Math.log(freq / Tone.A4) / Math.LN2;
	        var noteNumber = Math.round(12 * log) + 57;
	        var octave = Math.floor(noteNumber / 12);
	        if (octave < 0) {
	            noteNumber += -12 * octave;
	        }
	        var noteName = scaleIndexToNote[noteNumber % 12];
	        return noteName + octave.toString();
	    };
	    /**
		 *  Convert an interval (in semitones) to a frequency ratio.
		 *
		 *  @param  {Interval} interval the number of semitones above the base note
		 *  @return {number}          the frequency ratio
		 *  @example
		 * tone.intervalToFrequencyRatio(0); // returns 1
		 * tone.intervalToFrequencyRatio(12); // returns 2
		 */
	    Tone.prototype.intervalToFrequencyRatio = function (interval) {
	        return Math.pow(2, interval / 12);
	    };
	    /**
		 *  Convert a midi note number into a note name. 
		 *
		 *  @param  {MIDI} midiNumber the midi note number
		 *  @return {String}            the note's name and octave
		 *  @example
		 * tone.midiToNote(60); // returns "C3"
		 */
	    Tone.prototype.midiToNote = function (midiNumber) {
	        var octave = Math.floor(midiNumber / 12) - 1;
	        var note = midiNumber % 12;
	        return scaleIndexToNote[note] + octave;
	    };
	    /**
		 *  Convert a note to it's midi value. 
		 *
		 *  @param  {String} note the note name (i.e. "C3")
		 *  @return {MIDI} the midi value of that note
		 *  @example
		 * tone.noteToMidi("C3"); // returns 60
		 */
	    Tone.prototype.noteToMidi = function (note) {
	        //break apart the note by frequency and octave
	        var parts = note.split(/(\d+)/);
	        if (parts.length === 3) {
	            var index = noteToScaleIndex[parts[0].toLowerCase()];
	            var octave = parts[1];
	            return index + (parseInt(octave, 10) + 1) * 12;
	        } else {
	            return 0;
	        }
	    };
	    /**
		 *  Convert a MIDI note to frequency value. 
		 *
		 *  @param  {MIDI} midi The midi number to convert.
		 *  @return {Frequency} the corresponding frequency value
		 *  @example
		 * tone.midiToFrequency(57); // returns 440
		 */
	    Tone.prototype.midiToFrequency = function (midi) {
	        return Tone.A4 * Math.pow(2, (midi - 69) / 12);
	    };
	    return Tone;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  A signal is an audio-rate value. Tone.Signal is a core component of the library.
		 *          Unlike a number, Signals can be scheduled with sample-level accuracy. Tone.Signal
		 *          has all of the methods available to native Web Audio 
		 *          [AudioParam](http://webaudio.github.io/web-audio-api/#the-audioparam-interface)
		 *          as well as additional conveniences. Read more about working with signals 
		 *          [here](https://github.com/Tonejs/Tone.js/wiki/Signals).
		 *
		 *  @constructor
		 *  @extends {Tone.SignalBase}
		 *  @param {Number|AudioParam} [value] Initial value of the signal. If an AudioParam
		 *                                     is passed in, that parameter will be wrapped
		 *                                     and controlled by the Signal. 
		 *  @param {string} [units=Number] unit The units the signal is in. 
		 *  @example
		 * var signal = new Tone.Signal(10);
		 */
	    Tone.Signal = function () {
	        var options = this.optionsObject(arguments, [
	            'value',
	            'units'
	        ], Tone.Signal.defaults);
	        /**
			 * The units of the signal.
			 * @type {string}
			 */
	        this.units = options.units;
	        /**
			 *  When true, converts the set value
			 *  based on the units given. When false,
			 *  applies no conversion and the units
			 *  are merely used as a label. 
			 *  @type  {boolean}
			 */
	        this.convert = options.convert;
	        /**
			 *  True if the signal value is being overridden by 
			 *  a connected signal.
			 *  @readOnly
			 *  @type  {boolean}
			 *  @private
			 */
	        this.overridden = false;
	        /**
			 * The node where the constant signal value is scaled.
			 * @type {GainNode}
			 * @private
			 */
	        this.output = this._scaler = this.context.createGain();
	        /**
			 *  the minimum output value
			 *  @type {number}
			 *  @private
			 */
	        this._minOutput = 0.00001;
	        /**
			 * The node where the value is set.
			 * @type {AudioParam}
			 * @private
			 */
	        this.input = this._value = this._scaler.gain;
	        if (options.value instanceof AudioParam) {
	            this._scaler.connect(options.value);
	            //zero out the value
	            options.value.value = 0;
	        } else {
	            if (!this.isUndef(options.param)) {
	                this._scaler.connect(options.param);
	                options.param.value = 0;
	            }
	            this.value = options.value;
	        }
	        //connect the constant 1 output to the node output
	        Tone.Signal._constant.chain(this._scaler);
	    };
	    Tone.extend(Tone.Signal, Tone.SignalBase);
	    /**
		 *  The default values
		 *  @type  {Object}
		 *  @static
		 *  @const
		 */
	    Tone.Signal.defaults = {
	        'value': 0,
	        'param': undefined,
	        'units': Tone.Type.Default,
	        'convert': true
	    };
	    /**
		 * The current value of the signal. 
		 * @memberOf Tone.Signal#
		 * @type {Number}
		 * @name value
		 */
	    Object.defineProperty(Tone.Signal.prototype, 'value', {
	        get: function () {
	            return this._toUnits(this._value.value);
	        },
	        set: function (value) {
	            var convertedVal = this._fromUnits(value);
	            this._value.value = convertedVal;
	        }
	    });
	    /**
		 *  Convert the given value from the type specified by Tone.Signal.units
		 *  into the destination value (such as gain).
		 *  @private
		 *  @param  {*} val the value to convert
		 *  @return {number}     the number which the value should be set to
		 */
	    Tone.Signal.prototype._fromUnits = function (val) {
	        if (this.convert || this.isUndef(this.convert)) {
	            switch (this.units) {
	            case Tone.Type.Time:
	                return this.toSeconds(val);
	            case Tone.Type.Frequency:
	                return this.toFrequency(val);
	            case Tone.Type.Decibels:
	                return this.dbToGain(val);
	            case Tone.Type.NormalRange:
	                return Math.min(Math.max(val, 0), 1);
	            case Tone.Type.AudioRange:
	                return Math.min(Math.max(val, -1), 1);
	            case Tone.Type.Positive:
	                return Math.max(val, 0);
	            default:
	                return val;
	            }
	        } else {
	            return val;
	        }
	    };
	    /**
		 * Convert the signals true value into the units specified by Tone.Signal.units.
		 * @private
		 * @param  {number} val the value to convert
		 * @return {number}
		 */
	    Tone.Signal.prototype._toUnits = function (val) {
	        if (this.convert || this.isUndef(this.convert)) {
	            switch (this.units) {
	            case Tone.Type.Decibels:
	                return this.gainToDb(val);
	            default:
	                return val;
	            }
	        } else {
	            return val;
	        }
	    };
	    /**
		 *  Schedules a parameter value change at the given time.
		 *  @param {*}	value The value to set the signal.
		 *  @param {Time}  time The time when the change should occur.
		 *  @returns {Tone.Signal} this
		 *  @example
		 * //set the frequency to "G4" in exactly 1 second from now. 
		 * freq.setValueAtTime("G4", "+1");
		 */
	    Tone.Signal.prototype.setValueAtTime = function (value, time) {
	        value = this._fromUnits(value);
	        this._value.setValueAtTime(value, this.toSeconds(time));
	        return this;
	    };
	    /**
		 *  Creates a schedule point with the current value at the current time.
		 *  This is useful for creating an automation anchor point in order to 
		 *  schedule changes from the current value. 
		 *
		 *  @param {number=} now (Optionally) pass the now value in. 
		 *  @returns {Tone.Signal} this
		 */
	    Tone.Signal.prototype.setRampPoint = function (now) {
	        now = this.defaultArg(now, this.now());
	        var currentVal = this._value.value;
	        this._value.setValueAtTime(currentVal, now);
	        return this;
	    };
	    /**
		 *  Schedules a linear continuous change in parameter value from the 
		 *  previous scheduled parameter value to the given value.
		 *  
		 *  @param  {number} value   
		 *  @param  {Time} endTime 
		 *  @returns {Tone.Signal} this
		 */
	    Tone.Signal.prototype.linearRampToValueAtTime = function (value, endTime) {
	        value = this._fromUnits(value);
	        this._value.linearRampToValueAtTime(value, this.toSeconds(endTime));
	        return this;
	    };
	    /**
		 *  Schedules an exponential continuous change in parameter value from 
		 *  the previous scheduled parameter value to the given value.
		 *  
		 *  @param  {number} value   
		 *  @param  {Time} endTime 
		 *  @returns {Tone.Signal} this
		 */
	    Tone.Signal.prototype.exponentialRampToValueAtTime = function (value, endTime) {
	        value = this._fromUnits(value);
	        value = Math.max(this._minOutput, value);
	        this._value.exponentialRampToValueAtTime(value, this.toSeconds(endTime));
	        return this;
	    };
	    /**
		 *  Schedules an exponential continuous change in parameter value from 
		 *  the current time and current value to the given value over the 
		 *  duration of the rampTime.
		 *  
		 *  @param  {number} value   The value to ramp to.
		 *  @param  {Time} rampTime the time that it takes the 
		 *                               value to ramp from it's current value
		 *  @returns {Tone.Signal} this
		 *  @example
		 * //exponentially ramp to the value 2 over 4 seconds. 
		 * signal.exponentialRampToValue(2, 4);
		 */
	    Tone.Signal.prototype.exponentialRampToValue = function (value, rampTime) {
	        var now = this.now();
	        // exponentialRampToValueAt cannot ever ramp from 0, apparently.
	        // More info: https://bugzilla.mozilla.org/show_bug.cgi?id=1125600#c2
	        var currentVal = this.value;
	        this.setValueAtTime(Math.max(currentVal, this._minOutput), now);
	        this.exponentialRampToValueAtTime(value, now + this.toSeconds(rampTime));
	        return this;
	    };
	    /**
		 *  Schedules an linear continuous change in parameter value from 
		 *  the current time and current value to the given value over the 
		 *  duration of the rampTime.
		 *  
		 *  @param  {number} value   The value to ramp to.
		 *  @param  {Time} rampTime the time that it takes the 
		 *                               value to ramp from it's current value
		 *  @returns {Tone.Signal} this
		 *  @example
		 * //linearly ramp to the value 4 over 3 seconds. 
		 * signal.linearRampToValue(4, 3);
		 */
	    Tone.Signal.prototype.linearRampToValue = function (value, rampTime) {
	        var now = this.now();
	        this.setRampPoint(now);
	        this.linearRampToValueAtTime(value, now + this.toSeconds(rampTime));
	        return this;
	    };
	    /**
		 *  Start exponentially approaching the target value at the given time with
		 *  a rate having the given time constant.
		 *  @param {number} value        
		 *  @param {Time} startTime    
		 *  @param {number} timeConstant 
		 *  @returns {Tone.Signal} this 
		 */
	    Tone.Signal.prototype.setTargetAtTime = function (value, startTime, timeConstant) {
	        value = this._fromUnits(value);
	        // The value will never be able to approach without timeConstant > 0.
	        // http://www.w3.org/TR/webaudio/#dfn-setTargetAtTime, where the equation
	        // is described. 0 results in a division by 0.
	        value = Math.max(this._minOutput, value);
	        timeConstant = Math.max(this._minOutput, timeConstant);
	        this._value.setTargetAtTime(value, this.toSeconds(startTime), timeConstant);
	        return this;
	    };
	    /**
		 *  Sets an array of arbitrary parameter values starting at the given time
		 *  for the given duration.
		 *  	
		 *  @param {Array} values    
		 *  @param {Time} startTime 
		 *  @param {Time} duration  
		 *  @returns {Tone.Signal} this
		 */
	    Tone.Signal.prototype.setValueCurveAtTime = function (values, startTime, duration) {
	        for (var i = 0; i < values.length; i++) {
	            values[i] = this._fromUnits(values[i]);
	        }
	        this._value.setValueCurveAtTime(values, this.toSeconds(startTime), this.toSeconds(duration));
	        return this;
	    };
	    /**
		 *  Cancels all scheduled parameter changes with times greater than or 
		 *  equal to startTime.
		 *  
		 *  @param  {Time} startTime
		 *  @returns {Tone.Signal} this
		 */
	    Tone.Signal.prototype.cancelScheduledValues = function (startTime) {
	        this._value.cancelScheduledValues(this.toSeconds(startTime));
	        return this;
	    };
	    /**
		 *  Ramps to the given value over the duration of the rampTime. 
		 *  Automatically selects the best ramp type (exponential or linear)
		 *  depending on the `units` of the signal
		 *  
		 *  @param  {number} value   
		 *  @param  {Time} rampTime the time that it takes the 
		 *                               value to ramp from it's current value
		 *  @returns {Tone.Signal} this
		 *  @example
		 * //ramp to the value either linearly or exponentially 
		 * //depending on the "units" value of the signal
		 * signal.rampTo(0, 10);
		 */
	    Tone.Signal.prototype.rampTo = function (value, rampTime) {
	        rampTime = this.defaultArg(rampTime, 0);
	        if (this.units === Tone.Type.Frequency || this.units === Tone.Type.BPM) {
	            this.exponentialRampToValue(value, rampTime);
	        } else {
	            this.linearRampToValue(value, rampTime);
	        }
	        return this;
	    };
	    /**
		 *  dispose and disconnect
		 *  @returns {Tone.Signal} this
		 */
	    Tone.Signal.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._value = null;
	        this._scaler = null;
	        return this;
	    };
	    ///////////////////////////////////////////////////////////////////////////
	    //	STATIC
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *  Generates a constant output of 1.
		 *  @static
		 *  @private
		 *  @const
		 *  @type {AudioBufferSourceNode}
		 */
	    Tone.Signal._constant = null;
	    /**
		 *  initializer function
		 */
	    Tone._initAudioContext(function (audioContext) {
	        var buffer = audioContext.createBuffer(1, 128, audioContext.sampleRate);
	        var arr = buffer.getChannelData(0);
	        for (var i = 0; i < arr.length; i++) {
	            arr[i] = 1;
	        }
	        Tone.Signal._constant = audioContext.createBufferSource();
	        Tone.Signal._constant.channelCount = 1;
	        Tone.Signal._constant.channelCountMode = 'explicit';
	        Tone.Signal._constant.buffer = buffer;
	        Tone.Signal._constant.loop = true;
	        Tone.Signal._constant.start(0);
	        Tone.Signal._constant.noGC();
	    });
	    return Tone.Signal;
	});
	Module(function (Tone) {
	    /**
		 *  @class A Timeline class for scheduling and maintaining state
		 *         along a timeline. All events must have a "time" property. 
		 *         Internally, events are stored in time order for fast 
		 *         retrieval.
		 *  @extends {Tone}
		 */
	    Tone.Timeline = function () {
	        /**
			 *  The array of scheduled timeline events
			 *  @type  {Array}
			 *  @private
			 */
	        this._timeline = [];
	    };
	    Tone.extend(Tone.Timeline);
	    /**
		 *  The number of items in the timeline.
		 *  @type {Number}
		 *  @memberOf Tone.Timeline#
		 *  @name length
		 *  @readOnly
		 */
	    Object.defineProperty(Tone.Timeline.prototype, 'length', {
	        get: function () {
	            return this._timeline.length;
	        }
	    });
	    /**
		 *  Insert an event object onto the timeline. Events must have a "time" attribute.
		 *  @param  {Object}  event  The event object to insert into the 
		 *                           timeline. 
		 *  @returns {Tone.Timeline} this
		 */
	    Tone.Timeline.prototype.addEvent = function (event) {
	        //the event needs to have a time attribute
	        if (this.isUndef(event.time)) {
	            throw new Error('events must have a time attribute');
	        }
	        event.time = this.toSeconds(event.time);
	        if (this._timeline.length) {
	            var index = this._search(event.time);
	            this._timeline.splice(index + 1, 0, event);
	        } else {
	            this._timeline.push(event);
	        }
	        return this;
	    };
	    /**
		 *  Remove an event from the timeline.
		 *  @param  {Object}  event  The event object to remove from the list.
		 *  @returns {Tone.Timeline} this
		 */
	    Tone.Timeline.prototype.removeEvent = function (event) {
	        this.forEachAtTime(event.time, function (testEvent, index) {
	            if (testEvent === event) {
	                this._timeline.splice(index, 1);
	            }
	        }.bind(this));
	        return this;
	    };
	    /**
		 *  Get the event whose time is less than or equal to the given time.
		 *  @param  {Number}  time  The time to query.
		 *  @returns {Object} The event object set after that time.
		 */
	    Tone.Timeline.prototype.getEvent = function (time) {
	        time = this.toSeconds(time);
	        var index = this._search(time);
	        if (index !== -1) {
	            return this._timeline[index];
	        } else {
	            return null;
	        }
	    };
	    /**
		 *  Get the event which is scheduled after the given time.
		 *  @param  {Number}  time  The time to query.
		 *  @returns {Object} The event object after the given time
		 */
	    Tone.Timeline.prototype.getEventAfter = function (time) {
	        time = this.toSeconds(time);
	        var index = this._search(time);
	        if (index + 1 < this._timeline.length) {
	            return this._timeline[index + 1];
	        } else {
	            return null;
	        }
	    };
	    /**
		 *  Get the event before the event at the given time.
		 *  @param  {Number}  time  The time to query.
		 *  @returns {Object} The event object before the given time
		 */
	    Tone.Timeline.prototype.getEventBefore = function (time) {
	        time = this.toSeconds(time);
	        var index = this._search(time);
	        if (index - 1 >= 0) {
	            return this._timeline[index - 1];
	        } else {
	            return null;
	        }
	    };
	    /**
		 *  Cancel events after the given time
		 *  @param  {Time}  time  The time to query.
		 *  @returns {Tone.Timeline} this
		 */
	    Tone.Timeline.prototype.cancel = function (after) {
	        if (this._timeline.length) {
	            after = this.toSeconds(after);
	            var index = this._search(after);
	            if (index >= 0) {
	                this._timeline = this._timeline.slice(0, index);
	            } else {
	                this._timeline = [];
	            }
	        }
	        return this;
	    };
	    /**
		 *  Cancel events before or equal to the given time.
		 *  @param  {Time}  time  The time to cancel before.
		 *  @returns {Tone.Timeline} this
		 */
	    Tone.Timeline.prototype.cancelBefore = function (time) {
	        if (this._timeline.length) {
	            time = this.toSeconds(time);
	            var index = this._search(time);
	            if (index >= 0) {
	                this._timeline = this._timeline.slice(index + 1);
	            }
	        }
	        return this;
	    };
	    /**
		 *  Does a binary serach on the timeline array and returns the 
		 *  event which is after or equal to the time.
		 *  @param  {Number}  time  
		 *  @return  {Number} the index in the timeline array 
		 *  @private
		 */
	    Tone.Timeline.prototype._search = function (time) {
	        var beginning = 0;
	        var len = this._timeline.length;
	        var end = len;
	        // continue searching while [imin,imax] is not empty
	        while (beginning <= end && beginning < len) {
	            // calculate the midpoint for roughly equal partition
	            var midPoint = Math.floor(beginning + (end - beginning) / 2);
	            var event = this._timeline[midPoint];
	            if (event.time === time) {
	                //choose the last one that has the same time
	                for (var i = midPoint; i < this._timeline.length; i++) {
	                    var testEvent = this._timeline[i];
	                    if (testEvent.time === time) {
	                        midPoint = i;
	                    }
	                }
	                return midPoint;
	            } else if (event.time > time) {
	                //search lower
	                end = midPoint - 1;
	            } else if (event.time < time) {
	                //search upper
	                beginning = midPoint + 1;
	            }
	        }
	        return beginning - 1;
	    };
	    /**
		 *  Iterate over everything in the array
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Tone.Timeline} this
		 */
	    Tone.Timeline.prototype.forEach = function (callback) {
	        //iterate over the items in reverse so that removing an item doesn't break things
	        for (var i = this._timeline.length - 1; i >= 0; i--) {
	            callback(this._timeline[i], i);
	        }
	        return this;
	    };
	    /**
		 *  Iterate over everything in the array at or before the given time.
		 *  @param  {Time}  time The time to check if items are before
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Tone.Timeline} this
		 */
	    Tone.Timeline.prototype.forEachBefore = function (time, callback) {
	        //iterate over the items in reverse so that removing an item doesn't break things
	        time = this.toSeconds(time);
	        var startIndex = this._search(time);
	        if (startIndex !== -1) {
	            for (var i = startIndex; i >= 0; i--) {
	                callback(this._timeline[i], i);
	            }
	        }
	        return this;
	    };
	    /**
		 *  Iterate over everything in the array after the given time.
		 *  @param  {Time}  time The time to check if items are before
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Tone.Timeline} this
		 */
	    Tone.Timeline.prototype.forEachAfter = function (time, callback) {
	        //iterate over the items in reverse so that removing an item doesn't break things
	        time = this.toSeconds(time);
	        var endIndex = this._search(time);
	        for (var i = this._timeline.length - 1; i > endIndex; i--) {
	            callback(this._timeline[i], i);
	        }
	        return this;
	    };
	    /**
		 *  Iterate over everything in the array at or after the given time.
		 *  @param  {Time}  time The time to check if items are before
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Tone.Timeline} this
		 */
	    Tone.Timeline.prototype.forEachFrom = function (time, callback) {
	        //iterate over the items in reverse so that removing an item doesn't break things
	        time = this.toSeconds(time);
	        var endIndex = this._search(time);
	        // if ()
	        endIndex = Math.max(endIndex, 0);
	        for (var i = this._timeline.length - 1; i >= endIndex; i--) {
	            callback(this._timeline[i], i);
	        }
	        return this;
	    };
	    /**
		 *  Iterate over everything in the array at the given time
		 *  @param  {Time}  time The time to check if items are before
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Tone.Timeline} this
		 */
	    Tone.Timeline.prototype.forEachAtTime = function (time, callback) {
	        //iterate over the items in reverse so that removing an item doesn't break things
	        time = this.toSeconds(time);
	        var index = this._search(time);
	        if (index !== -1) {
	            for (var i = index; i >= 0; i--) {
	                var event = this._timeline[i];
	                if (event.time === time) {
	                    callback(event, i);
	                } else {
	                    break;
	                }
	            }
	        }
	        return this;
	    };
	    /**
		 *  Clean up.
		 *  @return  {Tone.Timeline}  this
		 */
	    Tone.Timeline.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._timeline = null;
	    };
	    return Tone.Timeline;
	});
	Module(function (Tone) {
	    /**
		 *  @class A signal which adds the method getValueAtTime. 
		 *         Code and inspiration from https://github.com/jsantell/web-audio-automation-timeline
		 */
	    Tone.TimelineSignal = function () {
	        //extend Tone.Signal
	        Tone.Signal.apply(this, arguments);
	        /**
			 *  The scheduled events
			 *  @type {Tone.Timeline}
			 *  @private
			 */
	        this._events = new Tone.Timeline();
	        /**
			 *  The initial scheduled value
			 *  @type {Number}
			 *  @private
			 */
	        this._initial = this._value.value;
	    };
	    Tone.extend(Tone.TimelineSignal, Tone.Signal);
	    /**
		 *  The event types of a schedulable signal.
		 *  @enum {String}
		 */
	    Tone.TimelineSignal.Type = {
	        Linear: 'linear',
	        Exponential: 'exponential',
	        Target: 'target',
	        Set: 'set'
	    };
	    /**
		 * The current value of the signal. 
		 * @memberOf Tone.TimelineSignal#
		 * @type {Number}
		 * @name value
		 */
	    Object.defineProperty(Tone.TimelineSignal.prototype, 'value', {
	        get: function () {
	            return this._toUnits(this._value.value);
	        },
	        set: function (value) {
	            var convertedVal = this._fromUnits(value);
	            this._initial = convertedVal;
	            this._value.value = convertedVal;
	        }
	    });
	    ///////////////////////////////////////////////////////////////////////////
	    //	SCHEDULING
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *  Schedules a parameter value change at the given time.
		 *  @param {*}	value The value to set the signal.
		 *  @param {Time}  time The time when the change should occur.
		 *  @returns {Tone.TimelineSignal} this
		 *  @example
		 * //set the frequency to "G4" in exactly 1 second from now. 
		 * freq.setValueAtTime("G4", "+1");
		 */
	    Tone.TimelineSignal.prototype.setValueAtTime = function (value, startTime) {
	        var unitValue = this._fromUnits(value);
	        startTime = this.toSeconds(startTime);
	        this._events.addEvent({
	            'type': Tone.TimelineSignal.Type.Set,
	            'value': unitValue,
	            'time': startTime
	        });
	        //invoke the original event
	        Tone.Signal.prototype.setValueAtTime.apply(this, arguments);
	        return this;
	    };
	    /**
		 *  Schedules a linear continuous change in parameter value from the 
		 *  previous scheduled parameter value to the given value.
		 *  
		 *  @param  {number} value   
		 *  @param  {Time} endTime 
		 *  @returns {Tone.TimelineSignal} this
		 */
	    Tone.TimelineSignal.prototype.linearRampToValueAtTime = function (value, endTime) {
	        var unitValue = this._fromUnits(value);
	        endTime = this.toSeconds(endTime);
	        this._events.addEvent({
	            'type': Tone.TimelineSignal.Type.Linear,
	            'value': unitValue,
	            'time': endTime
	        });
	        Tone.Signal.prototype.linearRampToValueAtTime.apply(this, arguments);
	        return this;
	    };
	    /**
		 *  Schedules an exponential continuous change in parameter value from 
		 *  the previous scheduled parameter value to the given value.
		 *  
		 *  @param  {number} value   
		 *  @param  {Time} endTime 
		 *  @returns {Tone.TimelineSignal} this
		 */
	    Tone.TimelineSignal.prototype.exponentialRampToValueAtTime = function (value, endTime) {
	        var unitValue = this._fromUnits(value);
	        unitValue = Math.max(this._minOutput, unitValue);
	        endTime = this.toSeconds(endTime);
	        this._events.addEvent({
	            'type': Tone.TimelineSignal.Type.Exponential,
	            'value': unitValue,
	            'time': endTime
	        });
	        Tone.Signal.prototype.exponentialRampToValueAtTime.apply(this, arguments);
	        return this;
	    };
	    /**
		 *  Start exponentially approaching the target value at the given time with
		 *  a rate having the given time constant.
		 *  @param {number} value        
		 *  @param {Time} startTime    
		 *  @param {number} timeConstant 
		 *  @returns {Tone.TimelineSignal} this 
		 */
	    Tone.TimelineSignal.prototype.setTargetAtTime = function (value, startTime, timeConstant) {
	        var unitValue = this._fromUnits(value);
	        unitValue = Math.max(this._minOutput, unitValue);
	        startTime = this.toSeconds(startTime);
	        this._events.addEvent({
	            'type': Tone.TimelineSignal.Type.Target,
	            'value': unitValue,
	            'time': startTime,
	            'constant': timeConstant
	        });
	        Tone.Signal.prototype.setTargetAtTime.apply(this, arguments);
	        return this;
	    };
	    /**
		 *  Cancels all scheduled parameter changes with times greater than or 
		 *  equal to startTime.
		 *  
		 *  @param  {Time} startTime
		 *  @returns {Tone.TimelineSignal} this
		 */
	    Tone.TimelineSignal.prototype.cancelScheduledValues = function (after) {
	        this._events.clear(after);
	        Tone.Signal.prototype.cancelScheduledValues.apply(this, arguments);
	        return this;
	    };
	    /**
		 *  Sets the computed value at the given time. This provides
		 *  a point from which a linear or exponential curve
		 *  can be scheduled after.
		 *  @param {Time} time When to set the ramp point
		 *  @returns {Tone.TimelineSignal} this
		 */
	    Tone.TimelineSignal.prototype.setRampPoint = function (time) {
	        time = this.toSeconds(time);
	        //get the value at the given time
	        var val = this.getValueAtTime(time);
	        this.setValueAtTime(val, time);
	        return this;
	    };
	    /**
		 *  Do a linear ramp to the given value between the start and finish times.
		 *  @param {Number} value The value to ramp to.
		 *  @param {Time} start The beginning anchor point to do the linear ramp
		 *  @param {Time} finish The ending anchor point by which the value of
		 *                       the signal will equal the given value.
		 */
	    Tone.TimelineSignal.prototype.linearRampToValueBetween = function (value, start, finish) {
	        this.setRampPoint(start);
	        this.linearRampToValueAtTime(value, finish);
	        return this;
	    };
	    /**
		 *  Do a exponential ramp to the given value between the start and finish times.
		 *  @param {Number} value The value to ramp to.
		 *  @param {Time} start The beginning anchor point to do the exponential ramp
		 *  @param {Time} finish The ending anchor point by which the value of
		 *                       the signal will equal the given value.
		 */
	    Tone.TimelineSignal.prototype.exponentialRampToValueBetween = function (value, start, finish) {
	        this.setRampPoint(start);
	        this.exponentialRampToValueAtTime(value, finish);
	        return this;
	    };
	    ///////////////////////////////////////////////////////////////////////////
	    //	GETTING SCHEDULED VALUES
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *  Returns the value before or equal to the given time
		 *  @param  {Number}  time  The time to query
		 *  @return  {Object}  The event at or before the given time.
		 *  @private
		 */
	    Tone.TimelineSignal.prototype._searchBefore = function (time) {
	        return this._events.getEvent(time);
	    };
	    /**
		 *  The event after the given time
		 *  @param  {Number}  time  The time to query.
		 *  @return  {Object}  The next event after the given time
		 */
	    Tone.TimelineSignal.prototype._searchAfter = function (time) {
	        return this._events.getEventAfter(time);
	    };
	    /**
		 *  Get the scheduled value at the given time.
		 *  @param  {Number}  time  The time in seconds.
		 *  @return  {Number}  The scheduled value at the given time.
		 */
	    Tone.TimelineSignal.prototype.getValueAtTime = function (time) {
	        var after = this._searchAfter(time);
	        var before = this._searchBefore(time);
	        //if it was set by
	        if (before === null) {
	            return this._initial;
	        } else if (before.type === Tone.TimelineSignal.Type.Target) {
	            var previous = this._searchBefore(before.time - 0.0001);
	            var previouVal;
	            if (previous === null) {
	                previouVal = this._initial;
	            } else {
	                previouVal = previous.value;
	            }
	            return this._exponentialApproach(before.time, previouVal, before.value, before.constant, time);
	        } else if (after === null) {
	            return before.value;
	        } else if (after.type === Tone.TimelineSignal.Type.Linear) {
	            return this._linearInterpolate(before.time, before.value, after.time, after.value, time);
	        } else if (after.type === Tone.TimelineSignal.Type.Exponential) {
	            return this._exponentialInterpolate(before.time, before.value, after.time, after.value, time);
	        } else {
	            return before.value;
	        }
	    };
	    ///////////////////////////////////////////////////////////////////////////
	    //	AUTOMATION CURVE CALCULATIONS
	    //	MIT License, copyright (c) 2014 Jordan Santell
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *  Calculates the the value along the curve produced by setTargetAtTime
		 *  @private
		 */
	    Tone.TimelineSignal.prototype._exponentialApproach = function (t0, v0, v1, timeConstant, t) {
	        return v1 + (v0 - v1) * Math.exp(-(t - t0) / timeConstant);
	    };
	    /**
		 *  Calculates the the value along the curve produced by linearRampToValueAtTime
		 *  @private
		 */
	    Tone.TimelineSignal.prototype._linearInterpolate = function (t0, v0, t1, v1, t) {
	        return v0 + (v1 - v0) * ((t - t0) / (t1 - t0));
	    };
	    /**
		 *  Calculates the the value along the curve produced by exponentialRampToValueAtTime
		 *  @private
		 */
	    Tone.TimelineSignal.prototype._exponentialInterpolate = function (t0, v0, t1, v1, t) {
	        v0 = Math.max(this._minOutput, v0);
	        return v0 * Math.pow(v1 / v0, (t - t0) / (t1 - t0));
	    };
	    /**
		 *  Clean up.
		 *  @return {Tone.TimelineSignal} this
		 */
	    Tone.TimelineSignal.prototype.dispose = function () {
	        Tone.Signal.prototype.dispose.call(this);
	        this._events.dispose();
	        this._events = null;
	    };
	    return Tone.TimelineSignal;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Pow applies an exponent to the incoming signal. The incoming signal
		 *         must be AudioRange.
		 *
		 *  @extends {Tone.SignalBase}
		 *  @constructor
		 *  @param {Positive} exp The exponent to apply to the incoming signal, must be at least 2. 
		 *  @example
		 * var pow = new Tone.Pow(2);
		 * var sig = new Tone.Signal(0.5).connect(pow);
		 * //output of pow is 0.25. 
		 */
	    Tone.Pow = function (exp) {
	        /**
			 * the exponent
			 * @private
			 * @type {number}
			 */
	        this._exp = this.defaultArg(exp, 1);
	        /**
			 *  @type {WaveShaperNode}
			 *  @private
			 */
	        this._expScaler = this.input = this.output = new Tone.WaveShaper(this._expFunc(this._exp), 8192);
	    };
	    Tone.extend(Tone.Pow, Tone.SignalBase);
	    /**
		 * The value of the exponent.
		 * @memberOf Tone.Pow#
		 * @type {number}
		 * @name value
		 */
	    Object.defineProperty(Tone.Pow.prototype, 'value', {
	        get: function () {
	            return this._exp;
	        },
	        set: function (exp) {
	            this._exp = exp;
	            this._expScaler.setMap(this._expFunc(this._exp));
	        }
	    });
	    /**
		 *  the function which maps the waveshaper
		 *  @param   {number} exp
		 *  @return {function}
		 *  @private
		 */
	    Tone.Pow.prototype._expFunc = function (exp) {
	        return function (val) {
	            return Math.pow(Math.abs(val), exp);
	        };
	    };
	    /**
		 *  Clean up.
		 *  @returns {Tone.Pow} this
		 */
	    Tone.Pow.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._expScaler.dispose();
	        this._expScaler = null;
	        return this;
	    };
	    return Tone.Pow;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.Envelope is an [ADSR](https://en.wikipedia.org/wiki/Synthesizer#ADSR_envelope)
		 *          envelope generator. Tone.Envelope outputs a signal which 
		 *          can be connected to an AudioParam or Tone.Signal. 
		 *          <img src="https://upload.wikimedia.org/wikipedia/commons/e/ea/ADSR_parameter.svg">
		 *
		 *  @constructor
		 *  @extends {Tone}
		 *  @param {Time} [attack] The amount of time it takes for the envelope to go from 
		 *                         0 to it's maximum value. 
		 *  @param {Time} [decay]	The period of time after the attack that it takes for the envelope
		 *                       	to fall to the sustain value. 
		 *  @param {NormalRange} [sustain]	The percent of the maximum value that the envelope rests at until
		 *                                	the release is triggered. 
		 *  @param {Time} [release]	The amount of time after the release is triggered it takes to reach 0. 
		 *  @example
		 * //an amplitude envelope
		 * var gainNode = Tone.context.createGain();
		 * var env = new Tone.Envelope({
		 * 	"attack" : 0.1,
		 * 	"decay" : 0.2,
		 * 	"sustain" : 1,
		 * 	"release" : 0.8,
		 * });
		 * env.connect(gainNode.gain);
		 */
	    Tone.Envelope = function () {
	        //get all of the defaults
	        var options = this.optionsObject(arguments, [
	            'attack',
	            'decay',
	            'sustain',
	            'release'
	        ], Tone.Envelope.defaults);
	        /** 
			 *  When triggerAttack is called, the attack time is the amount of
			 *  time it takes for the envelope to reach it's maximum value. 
			 *  @type {Time}
			 */
	        this.attack = options.attack;
	        /**
			 *  After the attack portion of the envelope, the value will fall
			 *  over the duration of the decay time to it's sustain value. 
			 *  @type {Time}
			 */
	        this.decay = options.decay;
	        /**
			 * 	The sustain value is the value 
			 * 	which the envelope rests at after triggerAttack is
			 * 	called, but before triggerRelease is invoked. 
			 *  @type {NormalRange}
			 */
	        this.sustain = options.sustain;
	        /**
			 *  After triggerRelease is called, the envelope's
			 *  value will fall to it's miminum value over the
			 *  duration of the release time. 
			 *  @type {Time}
			 */
	        this.release = options.release;
	        /**
			 *  the next time the envelope is at standby
			 *  @type {number}
			 *  @private
			 */
	        this._attackCurve = Tone.Envelope.Type.Linear;
	        /**
			 *  the next time the envelope is at standby
			 *  @type {number}
			 *  @private
			 */
	        this._releaseCurve = Tone.Envelope.Type.Exponential;
	        /**
			 *  the minimum output value
			 *  @type {number}
			 *  @private
			 */
	        this._minOutput = 0.00001;
	        /**
			 *  the signal
			 *  @type {Tone.TimelineSignal}
			 *  @private
			 */
	        this._sig = this.output = new Tone.TimelineSignal();
	        this._sig.setValueAtTime(0, 0);
	        //set the attackCurve initially
	        this.attackCurve = options.attackCurve;
	        this.releaseCurve = options.releaseCurve;
	    };
	    Tone.extend(Tone.Envelope);
	    /**
		 *  the default parameters
		 *  @static
		 *  @const
		 */
	    Tone.Envelope.defaults = {
	        'attack': 0.01,
	        'decay': 0.1,
	        'sustain': 0.5,
	        'release': 1,
	        'attackCurve': 'linear',
	        'releaseCurve': 'exponential'
	    };
	    /**
		 *  the envelope time multipler
		 *  @type {number}
		 *  @private
		 */
	    Tone.Envelope.prototype._timeMult = 0.25;
	    /**
		 * Read the current value of the envelope. Useful for 
		 * syncronizing visual output to the envelope. 
		 * @memberOf Tone.Envelope#
		 * @type {Number}
		 * @name value
		 * @readOnly
		 */
	    Object.defineProperty(Tone.Envelope.prototype, 'value', {
	        get: function () {
	            return this._sig.value;
	        }
	    });
	    /**
		 * The slope of the attack. Either "linear" or "exponential". 
		 * @memberOf Tone.Envelope#
		 * @type {string}
		 * @name attackCurve
		 * @example
		 * env.attackCurve = "linear";
		 */
	    Object.defineProperty(Tone.Envelope.prototype, 'attackCurve', {
	        get: function () {
	            return this._attackCurve;
	        },
	        set: function (type) {
	            if (type === Tone.Envelope.Type.Linear || type === Tone.Envelope.Type.Exponential) {
	                this._attackCurve = type;
	            } else {
	                throw Error('attackCurve must be either "linear" or "exponential". Invalid type: ', type);
	            }
	        }
	    });
	    /**
		 * The slope of the Release. Either "linear" or "exponential".
		 * @memberOf Tone.Envelope#
		 * @type {string}
		 * @name releaseCurve
		 * @example
		 * env.releaseCurve = "linear";
		 */
	    Object.defineProperty(Tone.Envelope.prototype, 'releaseCurve', {
	        get: function () {
	            return this._releaseCurve;
	        },
	        set: function (type) {
	            if (type === Tone.Envelope.Type.Linear || type === Tone.Envelope.Type.Exponential) {
	                this._releaseCurve = type;
	            } else {
	                throw Error('releaseCurve must be either "linear" or "exponential". Invalid type: ', type);
	            }
	        }
	    });
	    /**
		 *  Trigger the attack/decay portion of the ADSR envelope. 
		 *  @param  {Time} [time=now] When the attack should start.
		 *  @param {NormalRange} [velocity=1] The velocity of the envelope scales the vales.
		 *                               number between 0-1
		 *  @returns {Tone.Envelope} this
		 *  @example
		 *  //trigger the attack 0.5 seconds from now with a velocity of 0.2
		 *  env.triggerAttack("+0.5", 0.2);
		 */
	    Tone.Envelope.prototype.triggerAttack = function (time, velocity) {
	        //to seconds
	        var now = this.now() + this.blockTime;
	        time = this.toSeconds(time, now);
	        var attack = this.toSeconds(this.attack) + time;
	        var decay = this.toSeconds(this.decay);
	        velocity = this.defaultArg(velocity, 1);
	        //attack
	        if (this._attackCurve === Tone.Envelope.Type.Linear) {
	            this._sig.linearRampToValueBetween(velocity, time, attack);
	        } else {
	            this._sig.exponentialRampToValueBetween(velocity, time, attack);
	        }
	        //decay
	        this._sig.setTargetAtTime(this.sustain * velocity, attack, decay * this._timeMult);
	        return this;
	    };
	    /**
		 *  Triggers the release of the envelope.
		 *  @param  {Time} [time=now] When the release portion of the envelope should start. 
		 *  @returns {Tone.Envelope} this
		 *  @example
		 *  //trigger release immediately
		 *  env.triggerRelease();
		 */
	    Tone.Envelope.prototype.triggerRelease = function (time) {
	        var now = this.now() + this.blockTime;
	        time = this.toSeconds(time, now);
	        var release = this.toSeconds(this.release);
	        if (this._releaseCurve === Tone.Envelope.Type.Linear) {
	            this._sig.linearRampToValueBetween(this._minOutput, time, time + release);
	        } else {
	            this._sig.setTargetAtTime(this._minOutput, time, release * this._timeMult);
	        }
	        return this;
	    };
	    /**
		 *  triggerAttackRelease is shorthand for triggerAttack, then waiting
		 *  some duration, then triggerRelease. 
		 *  @param {Time} duration The duration of the sustain.
		 *  @param {Time} [time=now] When the attack should be triggered.
		 *  @param {number} [velocity=1] The velocity of the envelope. 
		 *  @returns {Tone.Envelope} this
		 *  @example
		 * //trigger the attack and then the release after 0.6 seconds.
		 * env.triggerAttackRelease(0.6);
		 */
	    Tone.Envelope.prototype.triggerAttackRelease = function (duration, time, velocity) {
	        time = this.toSeconds(time);
	        this.triggerAttack(time, velocity);
	        this.triggerRelease(time + this.toSeconds(duration));
	        return this;
	    };
	    /**
		 *  Borrows the connect method from Tone.Signal. 
		 *  @function
		 *  @private
		 */
	    Tone.Envelope.prototype.connect = Tone.Signal.prototype.connect;
	    /**
		 *  Disconnect and dispose.
		 *  @returns {Tone.Envelope} this
		 */
	    Tone.Envelope.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._sig.dispose();
	        this._sig = null;
	        return this;
	    };
	    /**
		 *  The phase of the envelope. 
		 *  @enum {string}
		 */
	    Tone.Envelope.Phase = {
	        Attack: 'attack',
	        Decay: 'decay',
	        Sustain: 'sustain',
	        Release: 'release',
	        Standby: 'standby'
	    };
	    /**
		 *  The phase of the envelope. 
		 *  @enum {string}
		 */
	    Tone.Envelope.Type = {
	        Linear: 'linear',
	        Exponential: 'exponential'
	    };
	    return Tone.Envelope;
	});
	Module(function (Tone) {
	    /**
		 *  @class A thin wrapper around the Native Web Audio GainNode.
		 *         The GainNode is a basic building block of the Web Audio
		 *         API and is useful for routing audio and adjusting gains. 
		 *  @extends {Tone}
		 *  @param  {Number=}  initial  The initial gain of the GainNode
		 */
	    Tone.Gain = function (initial) {
	        var options = this.optionsObject(arguments, ['gain'], Tone.Gain.defaults);
	        /**
			 *  The GainNode
			 *  @type  {GainNode}
			 *  @private
			 */
	        this._gainNode = this.input = this.output = this.context.createGain();
	        /**
			 *  The gain of the gain node.
			 *  @type {Number}
			 *  @signal
			 */
	        this.gain = this._gainNode.gain;
	        //set the initial value
	        this._readOnly('gain');
	        this.gain.value = options.gain;
	    };
	    Tone.extend(Tone.Gain);
	    /**
		 *  The defaults
		 *  @const
		 *  @type  {Object}
		 */
	    Tone.Gain.defaults = { 'gain': 1 };
	    /**
		 *  Clean up.
		 *  @return  {Tone.Gain}  this
		 */
	    Tone.Gain.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._gainNode.disconnect();
	        this._gainNode = null;
	        this._writable('gain');
	        this.gain = null;
	    };
	    return Tone.Gain;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.AmplitudeEnvelope is a Tone.Envelope connected to a gain node. 
		 *          Unlike Tone.Envelope, which outputs the envelope's value, Tone.AmplitudeEnvelope accepts
		 *          an audio signal as the input and will apply the envelope to the amplitude
		 *          of the signal. Read more about ADSR Envelopes on [Wikipedia](https://en.wikipedia.org/wiki/Synthesizer#ADSR_envelope).
		 *  
		 *  @constructor
		 *  @extends {Tone.Envelope}
		 *  @param {Time|Object} [attack] The amount of time it takes for the envelope to go from 
		 *                               0 to it's maximum value. 
		 *  @param {Time} [decay]	The period of time after the attack that it takes for the envelope
		 *                       	to fall to the sustain value. 
		 *  @param {NormalRange} [sustain]	The percent of the maximum value that the envelope rests at until
		 *                                	the release is triggered. 
		 *  @param {Time} [release]	The amount of time after the release is triggered it takes to reach 0. 
		 *  @example
		 * var ampEnv = new Tone.AmplitudeEnvelope({
		 * 	"attack": 0.1,
		 * 	"decay": 0.2,
		 * 	"sustain": 1.0,
		 * 	"release": 0.8
		 * }).toMaster();
		 * //create an oscillator and connect it
		 * var osc = new Tone.Oscillator().connect(ampEnv).start();
		 * //trigger the envelopes attack and release "8t" apart
		 * ampEnv.triggerAttackRelease("8t");
		 */
	    Tone.AmplitudeEnvelope = function () {
	        Tone.Envelope.apply(this, arguments);
	        /**
			 *  the input node
			 *  @type {GainNode}
			 *  @private
			 */
	        this.input = this.output = new Tone.Gain();
	        this._sig.connect(this.output.gain);
	    };
	    Tone.extend(Tone.AmplitudeEnvelope, Tone.Envelope);
	    /**
		 *  Clean up
		 *  @return  {Tone.AmplitudeEnvelope}  this
		 */
	    Tone.AmplitudeEnvelope.prototype.dispose = function () {
	        this.input.dispose();
	        this.input = null;
	        Tone.Envelope.prototype.dispose.call(this);
	        return this;
	    };
	    return Tone.AmplitudeEnvelope;
	});
	Module(function (Tone) {
	    /**
		 *  @class  Wrapper around the native Web Audio's 
		 *          [AnalyserNode](http://webaudio.github.io/web-audio-api/#idl-def-AnalyserNode).
		 *          Extracts FFT or Waveform data from the incoming signal.
		 *  @extends {Tone}
		 *  @param {Number=} size The size of the FFT. Value must be a power of 
		 *                       two in the range 32 to 32768.
		 *  @param {String=} type The return type of the analysis, either "fft", or "waveform". 
		 */
	    Tone.Analyser = function () {
	        var options = this.optionsObject(arguments, [
	            'size',
	            'type'
	        ], Tone.Analyser.defaults);
	        /**
			 *  The analyser node.
			 *  @private
			 *  @type {AnalyserNode}
			 */
	        this._analyser = this.input = this.context.createAnalyser();
	        /**
			 *  The analysis type
			 *  @type {String}
			 *  @private
			 */
	        this._type = options.type;
	        /**
			 *  The return type of the analysis
			 *  @type {String}
			 *  @private
			 */
	        this._returnType = options.returnType;
	        /**
			 *  The buffer that the FFT data is written to
			 *  @type {TypedArray}
			 *  @private
			 */
	        this._buffer = null;
	        //set the values initially
	        this.size = options.size;
	        this.type = options.type;
	        this.returnType = options.returnType;
	        this.minDecibels = options.minDecibels;
	        this.maxDecibels = options.maxDecibels;
	    };
	    Tone.extend(Tone.Analyser);
	    /**
		 *  The default values.
		 *  @type {Object}
		 *  @const
		 */
	    Tone.Analyser.defaults = {
	        'size': 2048,
	        'returnType': 'byte',
	        'type': 'fft',
	        'smoothing': 0.8,
	        'maxDecibels': -30,
	        'minDecibels': -100
	    };
	    /**
		 *  Possible return types of Tone.Analyser.value
		 *  @enum {String}
		 */
	    Tone.Analyser.Type = {
	        Waveform: 'waveform',
	        FFT: 'fft'
	    };
	    /**
		 *  Possible return types of Tone.Analyser.value
		 *  @enum {String}
		 */
	    Tone.Analyser.ReturnType = {
	        Byte: 'byte',
	        Float: 'float'
	    };
	    /**
		 *  Run the analysis given the current settings and return the 
		 *  result as a TypedArray. 
		 *  @returns {TypedArray}
		 */
	    Tone.Analyser.prototype.analyse = function () {
	        if (this._type === Tone.Analyser.Type.FFT) {
	            if (this._returnType === Tone.Analyser.ReturnType.Byte) {
	                this._analyser.getByteFrequencyData(this._buffer);
	            } else {
	                this._analyser.getFloatFrequencyData(this._buffer);
	            }
	        } else if (this._type === Tone.Analyser.Type.Waveform) {
	            if (this._returnType === Tone.Analyser.ReturnType.Byte) {
	                this._analyser.getByteTimeDomainData(this._buffer);
	            } else {
	                this._analyser.getFloatTimeDomainData(this._buffer);
	            }
	        }
	        return this._buffer;
	    };
	    /**
		 *  The size of analysis. This must be a power of two in the range 32 to 32768.
		 *  @memberOf Tone.Analyser#
		 *  @type {Number}
		 *  @name size
		 */
	    Object.defineProperty(Tone.Analyser.prototype, 'size', {
	        get: function () {
	            return this._analyser.frequencyBinCount;
	        },
	        set: function (size) {
	            this._analyser.fftSize = size * 2;
	            this.type = this._type;
	        }
	    });
	    /**
		 *  The return type of Tone.Analyser.value, either "byte" or "float". 
		 *  When the type is set to "byte" the range of values returned in the array
		 *  are between 0-255, when set to "float" the values are between 0-1. 
		 *  @memberOf Tone.Analyser#
		 *  @type {String}
		 *  @name type
		 */
	    Object.defineProperty(Tone.Analyser.prototype, 'returnType', {
	        get: function () {
	            return this._returnType;
	        },
	        set: function (type) {
	            if (type === Tone.Analyser.ReturnType.Byte) {
	                this._buffer = new Uint8Array(this._analyser.frequencyBinCount);
	            } else if (type === Tone.Analyser.ReturnType.Float) {
	                this._buffer = new Float32Array(this._analyser.frequencyBinCount);
	            } else {
	                throw new Error('Invalid Return Type: ' + type);
	            }
	            this._returnType = type;
	        }
	    });
	    /**
		 *  The analysis function returned by Tone.Analyser.value, either "fft" or "waveform". 
		 *  @memberOf Tone.Analyser#
		 *  @type {String}
		 *  @name type
		 */
	    Object.defineProperty(Tone.Analyser.prototype, 'type', {
	        get: function () {
	            return this._type;
	        },
	        set: function (type) {
	            if (type !== Tone.Analyser.Type.Waveform && type !== Tone.Analyser.Type.FFT) {
	                throw new Error('Invalid Type: ' + type);
	            }
	            this._type = type;
	        }
	    });
	    /**
		 *  0 represents no time averaging with the last analysis frame.
		 *  @memberOf Tone.Analyser#
		 *  @type {NormalRange}
		 *  @name smoothing
		 */
	    Object.defineProperty(Tone.Analyser.prototype, 'smoothing', {
	        get: function () {
	            return this._analyser.smoothingTimeConstant;
	        },
	        set: function (val) {
	            this._analyser.smoothingTimeConstant = val;
	        }
	    });
	    /**
		 *  The smallest decibel value which is analysed by the FFT. 
		 *  @memberOf Tone.Analyser#
		 *  @type {Decibels}
		 *  @name minDecibels
		 */
	    Object.defineProperty(Tone.Analyser.prototype, 'minDecibels', {
	        get: function () {
	            return this._analyser.minDecibels;
	        },
	        set: function (val) {
	            this._analyser.minDecibels = val;
	        }
	    });
	    /**
		 *  The largest decibel value which is analysed by the FFT. 
		 *  @memberOf Tone.Analyser#
		 *  @type {Decibels}
		 *  @name maxDecibels
		 */
	    Object.defineProperty(Tone.Analyser.prototype, 'maxDecibels', {
	        get: function () {
	            return this._analyser.maxDecibels;
	        },
	        set: function (val) {
	            this._analyser.maxDecibels = val;
	        }
	    });
	    /**
		 *  Clean up.
		 *  @return  {Tone.Analyser}  this
		 */
	    Tone.Analyser.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._analyser.disconnect();
	        this._analyser = null;
	        this._buffer = null;
	    };
	    return Tone.Analyser;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.Compressor is a thin wrapper around the Web Audio 
		 *         [DynamicsCompressorNode](http://webaudio.github.io/web-audio-api/#the-dynamicscompressornode-interface).
		 *         Compression reduces the volume of loud sounds or amplifies quiet sounds 
		 *         by narrowing or "compressing" an audio signal's dynamic range. 
		 *         Read more on [Wikipedia](https://en.wikipedia.org/wiki/Dynamic_range_compression).
		 *
		 *  @extends {Tone}
		 *  @constructor
		 *  @param {Decibels|Object} [threshold] The value above which the compression starts to be applied.
		 *  @param {Positive} [ratio] The gain reduction ratio.
		 *  @example
		 * var comp = new Tone.Compressor(-30, 3);
		 */
	    Tone.Compressor = function () {
	        var options = this.optionsObject(arguments, [
	            'threshold',
	            'ratio'
	        ], Tone.Compressor.defaults);
	        /**
			 *  the compressor node
			 *  @type {DynamicsCompressorNode}
			 *  @private
			 */
	        this._compressor = this.input = this.output = this.context.createDynamicsCompressor();
	        /**
			 *  the threshold vaue
			 *  @type {Decibels}
			 *  @signal
			 */
	        this.threshold = this._compressor.threshold;
	        /**
			 *  The attack parameter
			 *  @type {Time}
			 *  @signal
			 */
	        this.attack = new Tone.Signal(this._compressor.attack, Tone.Type.Time);
	        /**
			 *  The release parameter
			 *  @type {Time}
			 *  @signal
			 */
	        this.release = new Tone.Signal(this._compressor.release, Tone.Type.Time);
	        /**
			 *  The knee parameter
			 *  @type {Decibels}
			 *  @signal
			 */
	        this.knee = this._compressor.knee;
	        /**
			 *  The ratio value
			 *  @type {Number}
			 *  @signal
			 */
	        this.ratio = this._compressor.ratio;
	        //set the defaults
	        this._readOnly([
	            'knee',
	            'release',
	            'attack',
	            'ratio',
	            'threshold'
	        ]);
	        this.set(options);
	    };
	    Tone.extend(Tone.Compressor);
	    /**
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
	    Tone.Compressor.defaults = {
	        'ratio': 12,
	        'threshold': -24,
	        'release': 0.25,
	        'attack': 0.003,
	        'knee': 30
	    };
	    /**
		 *  clean up
		 *  @returns {Tone.Compressor} this
		 */
	    Tone.Compressor.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._writable([
	            'knee',
	            'release',
	            'attack',
	            'ratio',
	            'threshold'
	        ]);
	        this._compressor.disconnect();
	        this._compressor = null;
	        this.attack.dispose();
	        this.attack = null;
	        this.release.dispose();
	        this.release = null;
	        this.threshold = null;
	        this.ratio = null;
	        this.knee = null;
	        return this;
	    };
	    return Tone.Compressor;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Add a signal and a number or two signals. When no value is
		 *         passed into the constructor, Tone.Add will sum <code>input[0]</code>
		 *         and <code>input[1]</code>. If a value is passed into the constructor, 
		 *         the it will be added to the input.
		 *  
		 *  @constructor
		 *  @extends {Tone.Signal}
		 *  @param {number=} value If no value is provided, Tone.Add will sum the first
		 *                         and second inputs. 
		 *  @example
		 * var signal = new Tone.Signal(2);
		 * var add = new Tone.Add(2);
		 * signal.connect(add);
		 * //the output of add equals 4
		 *  @example
		 * //if constructed with no arguments
		 * //it will add the first and second inputs
		 * var add = new Tone.Add();
		 * var sig0 = new Tone.Signal(3).connect(add, 0, 0);
		 * var sig1 = new Tone.Signal(4).connect(add, 0, 1);
		 * //the output of add equals 7. 
		 */
	    Tone.Add = function (value) {
	        Tone.call(this, 2, 0);
	        /**
			 *  the summing node
			 *  @type {GainNode}
			 *  @private
			 */
	        this._sum = this.input[0] = this.input[1] = this.output = this.context.createGain();
	        /**
			 *  @private
			 *  @type {Tone.Signal}
			 */
	        this._value = this.input[1] = new Tone.Signal(value);
	        this._value.connect(this._sum);
	    };
	    Tone.extend(Tone.Add, Tone.Signal);
	    /**
		 *  Clean up.
		 *  @returns {Tone.Add} this
		 */
	    Tone.Add.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._sum.disconnect();
	        this._sum = null;
	        this._value.dispose();
	        this._value = null;
	        return this;
	    };
	    return Tone.Add;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Multiply two incoming signals. Or, if a number is given in the constructor, 
		 *          multiplies the incoming signal by that value. 
		 *
		 *  @constructor
		 *  @extends {Tone.Signal}
		 *  @param {number=} value Constant value to multiple. If no value is provided,
		 *                         it will return the product of the first and second inputs
		 *  @example
		 * var mult = new Tone.Multiply();
		 * var sigA = new Tone.Signal(3);
		 * var sigB = new Tone.Signal(4);
		 * sigA.connect(mult, 0, 0);
		 * sigB.connect(mult, 0, 1);
		 * //output of mult is 12.
		 *  @example
		 * var mult = new Tone.Multiply(10);
		 * var sig = new Tone.Signal(2).connect(mult);
		 * //the output of mult is 20. 
		 */
	    Tone.Multiply = function (value) {
	        Tone.call(this, 2, 0);
	        /**
			 *  the input node is the same as the output node
			 *  it is also the GainNode which handles the scaling of incoming signal
			 *  
			 *  @type {GainNode}
			 *  @private
			 */
	        this._mult = this.input[0] = this.output = this.context.createGain();
	        /**
			 *  the scaling parameter
			 *  @type {AudioParam}
			 *  @private
			 */
	        this._value = this.input[1] = this.output.gain;
	        this._value.value = this.defaultArg(value, 0);
	    };
	    Tone.extend(Tone.Multiply, Tone.Signal);
	    /**
		 *  clean up
		 *  @returns {Tone.Multiply} this
		 */
	    Tone.Multiply.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._mult.disconnect();
	        this._mult = null;
	        this._value = null;
	        return this;
	    };
	    return Tone.Multiply;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Negate the incoming signal. i.e. an input signal of 10 will output -10
		 *
		 *  @constructor
		 *  @extends {Tone.SignalBase}
		 *  @example
		 * var neg = new Tone.Negate();
		 * var sig = new Tone.Signal(-2).connect(neg);
		 * //output of neg is positive 2. 
		 */
	    Tone.Negate = function () {
	        /**
			 *  negation is done by multiplying by -1
			 *  @type {Tone.Multiply}
			 *  @private
			 */
	        this._multiply = this.input = this.output = new Tone.Multiply(-1);
	    };
	    Tone.extend(Tone.Negate, Tone.SignalBase);
	    /**
		 *  clean up
		 *  @returns {Tone.Negate} this
		 */
	    Tone.Negate.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._multiply.dispose();
	        this._multiply = null;
	        return this;
	    };
	    return Tone.Negate;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Subtract the signal connected to <code>input[1]</code> from the signal connected 
		 *         to <code>input[0]</code>. If an argument is provided in the constructor, the 
		 *         signals <code>.value</code> will be subtracted from the incoming signal.
		 *
		 *  @extends {Tone.Signal}
		 *  @constructor
		 *  @param {number=} value The value to subtract from the incoming signal. If the value
		 *                         is omitted, it will subtract the second signal from the first.
		 *  @example
		 * var sub = new Tone.Subtract(1);
		 * var sig = new Tone.Signal(4).connect(sub);
		 * //the output of sub is 3. 
		 *  @example
		 * var sub = new Tone.Subtract();
		 * var sigA = new Tone.Signal(10);
		 * var sigB = new Tone.Signal(2.5);
		 * sigA.connect(sub, 0, 0);
		 * sigB.connect(sub, 0, 1);
		 * //output of sub is 7.5
		 */
	    Tone.Subtract = function (value) {
	        Tone.call(this, 2, 0);
	        /**
			 *  the summing node
			 *  @type {GainNode}
			 *  @private
			 */
	        this._sum = this.input[0] = this.output = this.context.createGain();
	        /**
			 *  negate the input of the second input before connecting it
			 *  to the summing node.
			 *  @type {Tone.Negate}
			 *  @private
			 */
	        this._neg = new Tone.Negate();
	        /**
			 *  the node where the value is set
			 *  @private
			 *  @type {Tone.Signal}
			 */
	        this._value = this.input[1] = new Tone.Signal(value);
	        this._value.chain(this._neg, this._sum);
	    };
	    Tone.extend(Tone.Subtract, Tone.Signal);
	    /**
		 *  Clean up.
		 *  @returns {Tone.SignalBase} this
		 */
	    Tone.Subtract.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._neg.dispose();
	        this._neg = null;
	        this._sum.disconnect();
	        this._sum = null;
	        this._value.dispose();
	        this._value = null;
	        return this;
	    };
	    return Tone.Subtract;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  GreaterThanZero outputs 1 when the input is strictly greater than zero
		 *  
		 *  @constructor
		 *  @extends {Tone.SignalBase}
		 *  @example
		 * var gt0 = new Tone.GreaterThanZero();
		 * var sig = new Tone.Signal(0.01).connect(gt0);
		 * //the output of gt0 is 1. 
		 * sig.value = 0;
		 * //the output of gt0 is 0. 
		 */
	    Tone.GreaterThanZero = function () {
	        /**
			 *  @type {Tone.WaveShaper}
			 *  @private
			 */
	        this._thresh = this.output = new Tone.WaveShaper(function (val) {
	            if (val <= 0) {
	                return 0;
	            } else {
	                return 1;
	            }
	        });
	        /**
			 *  scale the first thresholded signal by a large value.
			 *  this will help with values which are very close to 0
			 *  @type {Tone.Multiply}
			 *  @private
			 */
	        this._scale = this.input = new Tone.Multiply(10000);
	        //connections
	        this._scale.connect(this._thresh);
	    };
	    Tone.extend(Tone.GreaterThanZero, Tone.SignalBase);
	    /**
		 *  dispose method
		 *  @returns {Tone.GreaterThanZero} this
		 */
	    Tone.GreaterThanZero.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._scale.dispose();
	        this._scale = null;
	        this._thresh.dispose();
	        this._thresh = null;
	        return this;
	    };
	    return Tone.GreaterThanZero;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  EqualZero outputs 1 when the input is equal to 
		 *          0 and outputs 0 otherwise. 
		 *  
		 *  @constructor
		 *  @extends {Tone.SignalBase}
		 *  @example
		 * var eq0 = new Tone.EqualZero();
		 * var sig = new Tone.Signal(0).connect(eq0);
		 * //the output of eq0 is 1. 
		 */
	    Tone.EqualZero = function () {
	        /**
			 *  scale the incoming signal by a large factor
			 *  @private
			 *  @type {Tone.Multiply}
			 */
	        this._scale = this.input = new Tone.Multiply(10000);
	        /**
			 *  @type {Tone.WaveShaper}
			 *  @private
			 */
	        this._thresh = new Tone.WaveShaper(function (val) {
	            if (val === 0) {
	                return 1;
	            } else {
	                return 0;
	            }
	        }, 128);
	        /**
			 *  threshold the output so that it's 0 or 1
			 *  @type {Tone.GreaterThanZero}
			 *  @private
			 */
	        this._gtz = this.output = new Tone.GreaterThanZero();
	        //connections
	        this._scale.chain(this._thresh, this._gtz);
	    };
	    Tone.extend(Tone.EqualZero, Tone.SignalBase);
	    /**
		 *  Clean up.
		 *  @returns {Tone.EqualZero} this
		 */
	    Tone.EqualZero.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._gtz.dispose();
	        this._gtz = null;
	        this._scale.dispose();
	        this._scale = null;
	        this._thresh.dispose();
	        this._thresh = null;
	        return this;
	    };
	    return Tone.EqualZero;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Output 1 if the signal is equal to the value, otherwise outputs 0. 
		 *          Can accept two signals if connected to inputs 0 and 1.
		 *  
		 *  @constructor
		 *  @extends {Tone.SignalBase}
		 *  @param {number=} value The number to compare the incoming signal to
		 *  @example
		 * var eq = new Tone.Equal(3);
		 * var sig = new Tone.Signal(3).connect(eq);
		 * //the output of eq is 1. 
		 */
	    Tone.Equal = function (value) {
	        Tone.call(this, 2, 0);
	        /**
			 *  subtract the value from the incoming signal
			 *  
			 *  @type {Tone.Add}
			 *  @private
			 */
	        this._sub = this.input[0] = new Tone.Subtract(value);
	        /**
			 *  @type {Tone.EqualZero}
			 *  @private
			 */
	        this._equals = this.output = new Tone.EqualZero();
	        this._sub.connect(this._equals);
	        this.input[1] = this._sub.input[1];
	    };
	    Tone.extend(Tone.Equal, Tone.SignalBase);
	    /**
		 * The value to compare to the incoming signal.
		 * @memberOf Tone.Equal#
		 * @type {number}
		 * @name value
		 */
	    Object.defineProperty(Tone.Equal.prototype, 'value', {
	        get: function () {
	            return this._sub.value;
	        },
	        set: function (value) {
	            this._sub.value = value;
	        }
	    });
	    /**
		 *  Clean up.
		 *  @returns {Tone.Equal} this
		 */
	    Tone.Equal.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._equals.dispose();
	        this._equals = null;
	        this._sub.dispose();
	        this._sub = null;
	        return this;
	    };
	    return Tone.Equal;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Select between any number of inputs, sending the one 
		 *         selected by the gate signal to the output
		 *
		 *  @constructor
		 *  @extends {Tone.SignalBase}
		 *  @param {number} [sourceCount=2] the number of inputs the switch accepts
		 *  @example
		 * var sel = new Tone.Select(2);
		 * var sigA = new Tone.Signal(10).connect(sel, 0, 0);
		 * var sigB = new Tone.Signal(20).connect(sel, 0, 1);
		 * sel.gate.value = 0;
		 * //sel outputs 10 (the value of sigA);
		 * sel.gate.value = 1;
		 * //sel outputs 20 (the value of sigB);
		 */
	    Tone.Select = function (sourceCount) {
	        sourceCount = this.defaultArg(sourceCount, 2);
	        Tone.call(this, sourceCount, 1);
	        /**
			 *  the control signal
			 *  @type {Number}
			 *  @signal
			 */
	        this.gate = new Tone.Signal(0);
	        this._readOnly('gate');
	        //make all the inputs and connect them
	        for (var i = 0; i < sourceCount; i++) {
	            var switchGate = new SelectGate(i);
	            this.input[i] = switchGate;
	            this.gate.connect(switchGate.selecter);
	            switchGate.connect(this.output);
	        }
	    };
	    Tone.extend(Tone.Select, Tone.SignalBase);
	    /**
		 *  Open a specific input and close the others.
		 *  @param {number} which The gate to open. 
		 *  @param {Time} [time=now] The time when the switch will open
		 *  @returns {Tone.Select} this
		 *  @example
		 * //open input 1 in a half second from now
		 * sel.select(1, "+0.5");
		 */
	    Tone.Select.prototype.select = function (which, time) {
	        //make sure it's an integer
	        which = Math.floor(which);
	        this.gate.setValueAtTime(which, this.toSeconds(time));
	        return this;
	    };
	    /**
		 *  Clean up.
		 *  @returns {Tone.Select} this
		 */
	    Tone.Select.prototype.dispose = function () {
	        this._writable('gate');
	        this.gate.dispose();
	        this.gate = null;
	        for (var i = 0; i < this.input.length; i++) {
	            this.input[i].dispose();
	            this.input[i] = null;
	        }
	        Tone.prototype.dispose.call(this);
	        return this;
	    };
	    ////////////START HELPER////////////
	    /**
		 *  helper class for Tone.Select representing a single gate
		 *  @constructor
		 *  @extends {Tone}
		 *  @private
		 */
	    var SelectGate = function (num) {
	        /**
			 *  the selector
			 *  @type {Tone.Equal}
			 */
	        this.selecter = new Tone.Equal(num);
	        /**
			 *  the gate
			 *  @type {GainNode}
			 */
	        this.gate = this.input = this.output = this.context.createGain();
	        //connect the selecter to the gate gain
	        this.selecter.connect(this.gate.gain);
	    };
	    Tone.extend(SelectGate);
	    /**
		 *  clean up
		 *  @private
		 */
	    SelectGate.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this.selecter.dispose();
	        this.gate.disconnect();
	        this.selecter = null;
	        this.gate = null;
	    };
	    ////////////END HELPER////////////
	    //return Tone.Select
	    return Tone.Select;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class IfThenElse has three inputs. When the first input (if) is true (i.e. === 1), 
		 *         then it will pass the second input (then) through to the output, otherwise, 
		 *         if it's not true (i.e. === 0) then it will pass the third input (else) 
		 *         through to the output. 
		 *
		 *  @extends {Tone.SignalBase}
		 *  @constructor
		 *  @example
		 * var ifThenElse = new Tone.IfThenElse();
		 * var ifSignal = new Tone.Signal(1).connect(ifThenElse.if);
		 * var pwmOsc = new Tone.PWMOscillator().connect(ifThenElse.then);
		 * var pulseOsc = new Tone.PulseOscillator().connect(ifThenElse.else);
		 * //ifThenElse outputs pwmOsc
		 * signal.value = 0;
		 * //now ifThenElse outputs pulseOsc
		 */
	    Tone.IfThenElse = function () {
	        Tone.call(this, 3, 0);
	        /**
			 *  the selector node which is responsible for the routing
			 *  @type {Tone.Select}
			 *  @private
			 */
	        this._selector = this.output = new Tone.Select(2);
	        //the input mapping
	        this.if = this.input[0] = this._selector.gate;
	        this.then = this.input[1] = this._selector.input[1];
	        this.else = this.input[2] = this._selector.input[0];
	    };
	    Tone.extend(Tone.IfThenElse, Tone.SignalBase);
	    /**
		 *  clean up
		 *  @returns {Tone.IfThenElse} this
		 */
	    Tone.IfThenElse.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._selector.dispose();
	        this._selector = null;
	        this.if = null;
	        this.then = null;
	        this.else = null;
	        return this;
	    };
	    return Tone.IfThenElse;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class [OR](https://en.wikipedia.org/wiki/OR_gate)
		 *         the inputs together. True if at least one of the inputs is true. 
		 *
		 *  @extends {Tone.SignalBase}
		 *  @constructor
		 *  @param {number} [inputCount=2] the input count
		 *  @example
		 * var or = new Tone.OR(2);
		 * var sigA = new Tone.Signal(0)connect(or, 0, 0);
		 * var sigB = new Tone.Signal(1)connect(or, 0, 1);
		 * //output of or is 1 because at least
		 * //one of the inputs is equal to 1. 
		 */
	    Tone.OR = function (inputCount) {
	        inputCount = this.defaultArg(inputCount, 2);
	        Tone.call(this, inputCount, 0);
	        /**
			 *  a private summing node
			 *  @type {GainNode}
			 *  @private
			 */
	        this._sum = this.context.createGain();
	        /**
			 *  @type {Tone.Equal}
			 *  @private
			 */
	        this._gtz = this.output = new Tone.GreaterThanZero();
	        //make each of the inputs an alias
	        for (var i = 0; i < inputCount; i++) {
	            this.input[i] = this._sum;
	        }
	        this._sum.connect(this._gtz);
	    };
	    Tone.extend(Tone.OR, Tone.SignalBase);
	    /**
		 *  clean up
		 *  @returns {Tone.OR} this
		 */
	    Tone.OR.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._gtz.dispose();
	        this._gtz = null;
	        this._sum.disconnect();
	        this._sum = null;
	        return this;
	    };
	    return Tone.OR;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class [AND](https://en.wikipedia.org/wiki/Logical_conjunction)
		 *         returns 1 when all the inputs are equal to 1 and returns 0 otherwise.
		 *
		 *  @extends {Tone.SignalBase}
		 *  @constructor
		 *  @param {number} [inputCount=2] the number of inputs. NOTE: all inputs are
		 *                                 connected to the single AND input node
		 *  @example
		 * var and = new Tone.AND(2);
		 * var sigA = new Tone.Signal(0).connect(and, 0, 0);
		 * var sigB = new Tone.Signal(1).connect(and, 0, 1);
		 * //the output of and is 0. 
		 */
	    Tone.AND = function (inputCount) {
	        inputCount = this.defaultArg(inputCount, 2);
	        Tone.call(this, inputCount, 0);
	        /**
			 *  @type {Tone.Equal}
			 *  @private
			 */
	        this._equals = this.output = new Tone.Equal(inputCount);
	        //make each of the inputs an alias
	        for (var i = 0; i < inputCount; i++) {
	            this.input[i] = this._equals;
	        }
	    };
	    Tone.extend(Tone.AND, Tone.SignalBase);
	    /**
		 *  clean up
		 *  @returns {Tone.AND} this
		 */
	    Tone.AND.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._equals.dispose();
	        this._equals = null;
	        return this;
	    };
	    return Tone.AND;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Just an alias for Tone.EqualZero, but has the same effect as a NOT operator. 
		 *          Outputs 1 when input equals 0. 
		 *  
		 *  @constructor
		 *  @extends {Tone.SignalBase}
		 *  @example
		 * var not = new Tone.NOT();
		 * var sig = new Tone.Signal(1).connect(not);
		 * //output of not equals 0. 
		 * sig.value = 0;
		 * //output of not equals 1.
		 */
	    Tone.NOT = Tone.EqualZero;
	    return Tone.NOT;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Output 1 if the signal is greater than the value, otherwise outputs 0.
		 *          can compare two signals or a signal and a number. 
		 *  
		 *  @constructor
		 *  @extends {Tone.Signal}
		 *  @param {number} [value=0] the value to compare to the incoming signal
		 *  @example
		 * var gt = new Tone.GreaterThan(2);
		 * var sig = new Tone.Signal(4).connect(gt);
		 * //output of gt is equal 1. 
		 */
	    Tone.GreaterThan = function (value) {
	        Tone.call(this, 2, 0);
	        /**
			 *  subtract the amount from the incoming signal
			 *  @type {Tone.Subtract}
			 *  @private
			 */
	        this._value = this.input[0] = new Tone.Subtract(value);
	        this.input[1] = this._value.input[1];
	        /**
			 *  compare that amount to zero
			 *  @type {Tone.GreaterThanZero}
			 *  @private
			 */
	        this._gtz = this.output = new Tone.GreaterThanZero();
	        //connect
	        this._value.connect(this._gtz);
	    };
	    Tone.extend(Tone.GreaterThan, Tone.Signal);
	    /**
		 *  dispose method
		 *  @returns {Tone.GreaterThan} this
		 */
	    Tone.GreaterThan.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._value.dispose();
	        this._value = null;
	        this._gtz.dispose();
	        this._gtz = null;
	        return this;
	    };
	    return Tone.GreaterThan;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Output 1 if the signal is less than the value, otherwise outputs 0.
		 *          Can compare two signals or a signal and a number. 
		 *  
		 *  @constructor
		 *  @extends {Tone.Signal}
		 *  @param {number=} value The value to compare to the incoming signal. 
		 *                            If no value is provided, it will compare 
		 *                            <code>input[0]</code> and <code>input[1]</code>
		 *  @example
		 * var lt = new Tone.LessThan(2);
		 * var sig = new Tone.Signal(-1).connect(lt);
		 * //if (sig < 2) lt outputs 1
		 */
	    Tone.LessThan = function (value) {
	        Tone.call(this, 2, 0);
	        /**
			 *  negate the incoming signal
			 *  @type {Tone.Negate}
			 *  @private
			 */
	        this._neg = this.input[0] = new Tone.Negate();
	        /**
			 *  input < value === -input > -value
			 *  @type {Tone.GreaterThan}
			 *  @private
			 */
	        this._gt = this.output = new Tone.GreaterThan();
	        /**
			 *  negate the signal coming from the second input
			 *  @private
			 *  @type {Tone.Negate}
			 */
	        this._rhNeg = new Tone.Negate();
	        /**
			 *  the node where the value is set
			 *  @private
			 *  @type {Tone.Signal}
			 */
	        this._value = this.input[1] = new Tone.Signal(value);
	        //connect
	        this._neg.connect(this._gt);
	        this._value.connect(this._rhNeg);
	        this._rhNeg.connect(this._gt, 0, 1);
	    };
	    Tone.extend(Tone.LessThan, Tone.Signal);
	    /**
		 *  Clean up.
		 *  @returns {Tone.LessThan} this
		 */
	    Tone.LessThan.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._neg.dispose();
	        this._neg = null;
	        this._gt.dispose();
	        this._gt = null;
	        this._rhNeg.dispose();
	        this._rhNeg = null;
	        this._value.dispose();
	        this._value = null;
	        return this;
	    };
	    return Tone.LessThan;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Return the absolute value of an incoming signal. 
		 *  
		 *  @constructor
		 *  @extends {Tone.SignalBase}
		 *  @example
		 * var signal = new Tone.Signal(-1);
		 * var abs = new Tone.Abs();
		 * signal.connect(abs);
		 * //the output of abs is 1. 
		 */
	    Tone.Abs = function () {
	        Tone.call(this, 1, 0);
	        /**
			 *  @type {Tone.LessThan}
			 *  @private
			 */
	        this._ltz = new Tone.LessThan(0);
	        /**
			 *  @type {Tone.Select}
			 *  @private
			 */
	        this._switch = this.output = new Tone.Select(2);
	        /**
			 *  @type {Tone.Negate}
			 *  @private
			 */
	        this._negate = new Tone.Negate();
	        //two signal paths, positive and negative
	        this.input.connect(this._switch, 0, 0);
	        this.input.connect(this._negate);
	        this._negate.connect(this._switch, 0, 1);
	        //the control signal
	        this.input.chain(this._ltz, this._switch.gate);
	    };
	    Tone.extend(Tone.Abs, Tone.SignalBase);
	    /**
		 *  dispose method
		 *  @returns {Tone.Abs} this
		 */
	    Tone.Abs.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._switch.dispose();
	        this._switch = null;
	        this._ltz.dispose();
	        this._ltz = null;
	        this._negate.dispose();
	        this._negate = null;
	        return this;
	    };
	    return Tone.Abs;
	});
	Module(function (Tone) {
	    
	    /**
		 * 	@class  Outputs the greater of two signals. If a number is provided in the constructor
		 * 	        it will use that instead of the signal. 
		 * 	
		 *  @constructor
		 *  @extends {Tone.Signal}
		 *  @param {number=} max Max value if provided. if not provided, it will use the
		 *                       signal value from input 1. 
		 *  @example
		 * var max = new Tone.Max(2);
		 * var sig = new Tone.Signal(3).connect(max);
		 * //max outputs 3
		 * sig.value = 1;
		 * //max outputs 2
		 *  @example
		 * var max = new Tone.Max();
		 * var sigA = new Tone.Signal(3);
		 * var sigB = new Tone.Signal(4);
		 * sigA.connect(max, 0, 0);
		 * sigB.connect(max, 0, 1);
		 * //output of max is 4.
		 */
	    Tone.Max = function (max) {
	        Tone.call(this, 2, 0);
	        this.input[0] = this.context.createGain();
	        /**
			 *  the max signal
			 *  @type {Tone.Signal}
			 *  @private
			 */
	        this._value = this.input[1] = new Tone.Signal(max);
	        /**
			 *  @type {Tone.Select}
			 *  @private
			 */
	        this._ifThenElse = this.output = new Tone.IfThenElse();
	        /**
			 *  @type {Tone.Select}
			 *  @private
			 */
	        this._gt = new Tone.GreaterThan();
	        //connections
	        this.input[0].chain(this._gt, this._ifThenElse.if);
	        this.input[0].connect(this._ifThenElse.then);
	        this._value.connect(this._ifThenElse.else);
	        this._value.connect(this._gt, 0, 1);
	    };
	    Tone.extend(Tone.Max, Tone.Signal);
	    /**
		 * 	Clean up.
		 *  @returns {Tone.Max} this
		 */
	    Tone.Max.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._value.dispose();
	        this._ifThenElse.dispose();
	        this._gt.dispose();
	        this._value = null;
	        this._ifThenElse = null;
	        this._gt = null;
	        return this;
	    };
	    return Tone.Max;
	});
	Module(function (Tone) {
	    
	    /**
		 * 	@class  Outputs the lesser of two signals. If a number is given 
		 * 	        in the constructor, it will use a signal and a number. 
		 * 	
		 *  @constructor
		 *  @extends {Tone.Signal}
		 *  @param {number} min The minimum to compare to the incoming signal
		 *  @example
		 * var min = new Tone.Min(2);
		 * var sig = new Tone.Signal(3).connect(min);
		 * //min outputs 2
		 * sig.value = 1;
		 * //min outputs 1
		 * 	 @example
		 * var min = new Tone.Min();
		 * var sigA = new Tone.Signal(3);
		 * var sigB = new Tone.Signal(4);
		 * sigA.connect(min, 0, 0);
		 * sigB.connect(min, 0, 1);
		 * //output of min is 3.
		 */
	    Tone.Min = function (min) {
	        Tone.call(this, 2, 0);
	        this.input[0] = this.context.createGain();
	        /**
			 *  @type {Tone.Select}
			 *  @private
			 */
	        this._ifThenElse = this.output = new Tone.IfThenElse();
	        /**
			 *  @type {Tone.Select}
			 *  @private
			 */
	        this._lt = new Tone.LessThan();
	        /**
			 *  the min signal
			 *  @type {Tone.Signal}
			 *  @private
			 */
	        this._value = this.input[1] = new Tone.Signal(min);
	        //connections
	        this.input[0].chain(this._lt, this._ifThenElse.if);
	        this.input[0].connect(this._ifThenElse.then);
	        this._value.connect(this._ifThenElse.else);
	        this._value.connect(this._lt, 0, 1);
	    };
	    Tone.extend(Tone.Min, Tone.Signal);
	    /**
		 *  clean up
		 *  @returns {Tone.Min} this
		 */
	    Tone.Min.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._value.dispose();
	        this._ifThenElse.dispose();
	        this._lt.dispose();
	        this._value = null;
	        this._ifThenElse = null;
	        this._lt = null;
	        return this;
	    };
	    return Tone.Min;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Signal-rate modulo operator. Only works in AudioRange [-1, 1] and for modulus
		 *         values in the NormalRange. 
		 *
		 *  @constructor
		 *  @extends {Tone.SignalBase}
		 *  @param {NormalRange} modulus The modulus to apply.
		 *  @example
		 * var mod = new Tone.Modulo(0.2)
		 * var sig = new Tone.Signal(0.5).connect(mod);
		 * //mod outputs 0.1
		 */
	    Tone.Modulo = function (modulus) {
	        Tone.call(this, 1, 1);
	        /**
			 *  A waveshaper gets the integer multiple of 
			 *  the input signal and the modulus.
			 *  @private
			 *  @type {Tone.WaveShaper}
			 */
	        this._shaper = new Tone.WaveShaper(Math.pow(2, 16));
	        /**
			 *  the integer multiple is multiplied by the modulus
			 *  @type  {Tone.Multiply}
			 *  @private
			 */
	        this._multiply = new Tone.Multiply();
	        /**
			 *  and subtracted from the input signal
			 *  @type  {Tone.Subtract}
			 *  @private
			 */
	        this._subtract = this.output = new Tone.Subtract();
	        /**
			 *  the modulus signal
			 *  @type  {Tone.Signal}
			 *  @private
			 */
	        this._modSignal = new Tone.Signal(modulus);
	        //connections
	        this.input.fan(this._shaper, this._subtract);
	        this._modSignal.connect(this._multiply, 0, 0);
	        this._shaper.connect(this._multiply, 0, 1);
	        this._multiply.connect(this._subtract, 0, 1);
	        this._setWaveShaper(modulus);
	    };
	    Tone.extend(Tone.Modulo, Tone.SignalBase);
	    /**
		 *  @param  {number}  mod  the modulus to apply
		 *  @private
		 */
	    Tone.Modulo.prototype._setWaveShaper = function (mod) {
	        this._shaper.setMap(function (val) {
	            var multiple = Math.floor((val + 0.0001) / mod);
	            return multiple;
	        });
	    };
	    /**
		 * The modulus value.
		 * @memberOf Tone.Modulo#
		 * @type {NormalRange}
		 * @name value
		 */
	    Object.defineProperty(Tone.Modulo.prototype, 'value', {
	        get: function () {
	            return this._modSignal.value;
	        },
	        set: function (mod) {
	            this._modSignal.value = mod;
	            this._setWaveShaper(mod);
	        }
	    });
	    /**
		 * clean up
		 *  @returns {Tone.Modulo} this
		 */
	    Tone.Modulo.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._shaper.dispose();
	        this._shaper = null;
	        this._multiply.dispose();
	        this._multiply = null;
	        this._subtract.dispose();
	        this._subtract = null;
	        this._modSignal.dispose();
	        this._modSignal = null;
	        return this;
	    };
	    return Tone.Modulo;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class AudioToGain converts an input in AudioRange [-1,1] to NormalRange [0,1]. 
		 *         See Tone.GainToAudio.
		 *
		 *  @extends {Tone.SignalBase}
		 *  @constructor
		 *  @example
		 *  var a2g = new Tone.AudioToGain();
		 */
	    Tone.AudioToGain = function () {
	        /**
			 *  @type {WaveShaperNode}
			 *  @private
			 */
	        this._norm = this.input = this.output = new Tone.WaveShaper(function (x) {
	            return (x + 1) / 2;
	        });
	    };
	    Tone.extend(Tone.AudioToGain, Tone.SignalBase);
	    /**
		 *  clean up
		 *  @returns {Tone.AudioToGain} this
		 */
	    Tone.AudioToGain.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._norm.dispose();
	        this._norm = null;
	        return this;
	    };
	    return Tone.AudioToGain;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Evaluate an expression at audio rate. <br><br>
		 *         Parsing code modified from https://code.google.com/p/tapdigit/
		 *         Copyright 2011 2012 Ariya Hidayat, New BSD License
		 *
		 *  @extends {Tone.SignalBase}
		 *  @constructor
		 *  @param {string} expr the expression to generate
		 *  @example
		 * //adds the signals from input[0] and input[1].
		 * var expr = new Tone.Expr("$0 + $1");
		 */
	    Tone.Expr = function () {
	        var expr = this._replacements(Array.prototype.slice.call(arguments));
	        var inputCount = this._parseInputs(expr);
	        /**
			 *  hold onto all of the nodes for disposal
			 *  @type {Array}
			 *  @private
			 */
	        this._nodes = [];
	        /**
			 *  The inputs. The length is determined by the expression. 
			 *  @type {Array}
			 */
	        this.input = new Array(inputCount);
	        //create a gain for each input
	        for (var i = 0; i < inputCount; i++) {
	            this.input[i] = this.context.createGain();
	        }
	        //parse the syntax tree
	        var tree = this._parseTree(expr);
	        //evaluate the results
	        var result;
	        try {
	            result = this._eval(tree);
	        } catch (e) {
	            this._disposeNodes();
	            throw new Error('Could evaluate expression: ' + expr);
	        }
	        /**
			 *  The output node is the result of the expression
			 *  @type {Tone}
			 */
	        this.output = result;
	    };
	    Tone.extend(Tone.Expr, Tone.SignalBase);
	    //some helpers to cut down the amount of code
	    function applyBinary(Constructor, args, self) {
	        var op = new Constructor();
	        self._eval(args[0]).connect(op, 0, 0);
	        self._eval(args[1]).connect(op, 0, 1);
	        return op;
	    }
	    function applyUnary(Constructor, args, self) {
	        var op = new Constructor();
	        self._eval(args[0]).connect(op, 0, 0);
	        return op;
	    }
	    function getNumber(arg) {
	        return arg ? parseFloat(arg) : undefined;
	    }
	    function literalNumber(arg) {
	        return arg && arg.args ? parseFloat(arg.args) : undefined;
	    }
	    /*
		 *  the Expressions that Tone.Expr can parse.
		 *
		 *  each expression belongs to a group and contains a regexp 
		 *  for selecting the operator as well as that operators method
		 *  
		 *  @type {Object}
		 *  @private
		 */
	    Tone.Expr._Expressions = {
	        //values
	        'value': {
	            'signal': {
	                regexp: /^\d+\.\d+|^\d+/,
	                method: function (arg) {
	                    var sig = new Tone.Signal(getNumber(arg));
	                    return sig;
	                }
	            },
	            'input': {
	                regexp: /^\$\d/,
	                method: function (arg, self) {
	                    return self.input[getNumber(arg.substr(1))];
	                }
	            }
	        },
	        //syntactic glue
	        'glue': {
	            '(': { regexp: /^\(/ },
	            ')': { regexp: /^\)/ },
	            ',': { regexp: /^,/ }
	        },
	        //functions
	        'func': {
	            'abs': {
	                regexp: /^abs/,
	                method: applyUnary.bind(this, Tone.Abs)
	            },
	            'min': {
	                regexp: /^min/,
	                method: applyBinary.bind(this, Tone.Min)
	            },
	            'max': {
	                regexp: /^max/,
	                method: applyBinary.bind(this, Tone.Max)
	            },
	            'if': {
	                regexp: /^if/,
	                method: function (args, self) {
	                    var op = new Tone.IfThenElse();
	                    self._eval(args[0]).connect(op.if);
	                    self._eval(args[1]).connect(op.then);
	                    self._eval(args[2]).connect(op.else);
	                    return op;
	                }
	            },
	            'gt0': {
	                regexp: /^gt0/,
	                method: applyUnary.bind(this, Tone.GreaterThanZero)
	            },
	            'eq0': {
	                regexp: /^eq0/,
	                method: applyUnary.bind(this, Tone.EqualZero)
	            },
	            'mod': {
	                regexp: /^mod/,
	                method: function (args, self) {
	                    var modulus = literalNumber(args[1]);
	                    var op = new Tone.Modulo(modulus);
	                    self._eval(args[0]).connect(op);
	                    return op;
	                }
	            },
	            'pow': {
	                regexp: /^pow/,
	                method: function (args, self) {
	                    var exp = literalNumber(args[1]);
	                    var op = new Tone.Pow(exp);
	                    self._eval(args[0]).connect(op);
	                    return op;
	                }
	            },
	            'a2g': {
	                regexp: /^a2g/,
	                method: function (args, self) {
	                    var op = new Tone.AudioToGain();
	                    self._eval(args[0]).connect(op);
	                    return op;
	                }
	            }
	        },
	        //binary expressions
	        'binary': {
	            '+': {
	                regexp: /^\+/,
	                precedence: 1,
	                method: applyBinary.bind(this, Tone.Add)
	            },
	            '-': {
	                regexp: /^\-/,
	                precedence: 1,
	                method: function (args, self) {
	                    //both unary and binary op
	                    if (args.length === 1) {
	                        return applyUnary(Tone.Negate, args, self);
	                    } else {
	                        return applyBinary(Tone.Subtract, args, self);
	                    }
	                }
	            },
	            '*': {
	                regexp: /^\*/,
	                precedence: 0,
	                method: applyBinary.bind(this, Tone.Multiply)
	            },
	            '>': {
	                regexp: /^\>/,
	                precedence: 2,
	                method: applyBinary.bind(this, Tone.GreaterThan)
	            },
	            '<': {
	                regexp: /^</,
	                precedence: 2,
	                method: applyBinary.bind(this, Tone.LessThan)
	            },
	            '==': {
	                regexp: /^==/,
	                precedence: 3,
	                method: applyBinary.bind(this, Tone.Equal)
	            },
	            '&&': {
	                regexp: /^&&/,
	                precedence: 4,
	                method: applyBinary.bind(this, Tone.AND)
	            },
	            '||': {
	                regexp: /^\|\|/,
	                precedence: 5,
	                method: applyBinary.bind(this, Tone.OR)
	            }
	        },
	        //unary expressions
	        'unary': {
	            '-': {
	                regexp: /^\-/,
	                method: applyUnary.bind(this, Tone.Negate)
	            },
	            '!': {
	                regexp: /^\!/,
	                method: applyUnary.bind(this, Tone.NOT)
	            }
	        }
	    };
	    /**
		 *  @param   {string} expr the expression string
		 *  @return  {number}      the input count
		 *  @private
		 */
	    Tone.Expr.prototype._parseInputs = function (expr) {
	        var inputArray = expr.match(/\$\d/g);
	        var inputMax = 0;
	        if (inputArray !== null) {
	            for (var i = 0; i < inputArray.length; i++) {
	                var inputNum = parseInt(inputArray[i].substr(1)) + 1;
	                inputMax = Math.max(inputMax, inputNum);
	            }
	        }
	        return inputMax;
	    };
	    /**
		 *  @param   {Array} args 	an array of arguments
		 *  @return  {string} the results of the replacements being replaced
		 *  @private
		 */
	    Tone.Expr.prototype._replacements = function (args) {
	        var expr = args.shift();
	        for (var i = 0; i < args.length; i++) {
	            expr = expr.replace(/\%/i, args[i]);
	        }
	        return expr;
	    };
	    /**
		 *  tokenize the expression based on the Expressions object
		 *  @param   {string} expr 
		 *  @return  {Object}      returns two methods on the tokenized list, next and peek
		 *  @private
		 */
	    Tone.Expr.prototype._tokenize = function (expr) {
	        var position = -1;
	        var tokens = [];
	        while (expr.length > 0) {
	            expr = expr.trim();
	            var token = getNextToken(expr);
	            tokens.push(token);
	            expr = expr.substr(token.value.length);
	        }
	        function getNextToken(expr) {
	            for (var type in Tone.Expr._Expressions) {
	                var group = Tone.Expr._Expressions[type];
	                for (var opName in group) {
	                    var op = group[opName];
	                    var reg = op.regexp;
	                    var match = expr.match(reg);
	                    if (match !== null) {
	                        return {
	                            type: type,
	                            value: match[0],
	                            method: op.method
	                        };
	                    }
	                }
	            }
	            throw new SyntaxError('Unexpected token ' + expr);
	        }
	        return {
	            next: function () {
	                return tokens[++position];
	            },
	            peek: function () {
	                return tokens[position + 1];
	            }
	        };
	    };
	    /**
		 *  recursively parse the string expression into a syntax tree
		 *  
		 *  @param   {string} expr 
		 *  @return  {Object}
		 *  @private
		 */
	    Tone.Expr.prototype._parseTree = function (expr) {
	        var lexer = this._tokenize(expr);
	        var isUndef = this.isUndef.bind(this);
	        function matchSyntax(token, syn) {
	            return !isUndef(token) && token.type === 'glue' && token.value === syn;
	        }
	        function matchGroup(token, groupName, prec) {
	            var ret = false;
	            var group = Tone.Expr._Expressions[groupName];
	            if (!isUndef(token)) {
	                for (var opName in group) {
	                    var op = group[opName];
	                    if (op.regexp.test(token.value)) {
	                        if (!isUndef(prec)) {
	                            if (op.precedence === prec) {
	                                return true;
	                            }
	                        } else {
	                            return true;
	                        }
	                    }
	                }
	            }
	            return ret;
	        }
	        function parseExpression(precedence) {
	            if (isUndef(precedence)) {
	                precedence = 5;
	            }
	            var expr;
	            if (precedence < 0) {
	                expr = parseUnary();
	            } else {
	                expr = parseExpression(precedence - 1);
	            }
	            var token = lexer.peek();
	            while (matchGroup(token, 'binary', precedence)) {
	                token = lexer.next();
	                expr = {
	                    operator: token.value,
	                    method: token.method,
	                    args: [
	                        expr,
	                        parseExpression(precedence)
	                    ]
	                };
	                token = lexer.peek();
	            }
	            return expr;
	        }
	        function parseUnary() {
	            var token, expr;
	            token = lexer.peek();
	            if (matchGroup(token, 'unary')) {
	                token = lexer.next();
	                expr = parseUnary();
	                return {
	                    operator: token.value,
	                    method: token.method,
	                    args: [expr]
	                };
	            }
	            return parsePrimary();
	        }
	        function parsePrimary() {
	            var token, expr;
	            token = lexer.peek();
	            if (isUndef(token)) {
	                throw new SyntaxError('Unexpected termination of expression');
	            }
	            if (token.type === 'func') {
	                token = lexer.next();
	                return parseFunctionCall(token);
	            }
	            if (token.type === 'value') {
	                token = lexer.next();
	                return {
	                    method: token.method,
	                    args: token.value
	                };
	            }
	            if (matchSyntax(token, '(')) {
	                lexer.next();
	                expr = parseExpression();
	                token = lexer.next();
	                if (!matchSyntax(token, ')')) {
	                    throw new SyntaxError('Expected )');
	                }
	                return expr;
	            }
	            throw new SyntaxError('Parse error, cannot process token ' + token.value);
	        }
	        function parseFunctionCall(func) {
	            var token, args = [];
	            token = lexer.next();
	            if (!matchSyntax(token, '(')) {
	                throw new SyntaxError('Expected ( in a function call "' + func.value + '"');
	            }
	            token = lexer.peek();
	            if (!matchSyntax(token, ')')) {
	                args = parseArgumentList();
	            }
	            token = lexer.next();
	            if (!matchSyntax(token, ')')) {
	                throw new SyntaxError('Expected ) in a function call "' + func.value + '"');
	            }
	            return {
	                method: func.method,
	                args: args,
	                name: name
	            };
	        }
	        function parseArgumentList() {
	            var token, expr, args = [];
	            while (true) {
	                expr = parseExpression();
	                if (isUndef(expr)) {
	                    // TODO maybe throw exception?
	                    break;
	                }
	                args.push(expr);
	                token = lexer.peek();
	                if (!matchSyntax(token, ',')) {
	                    break;
	                }
	                lexer.next();
	            }
	            return args;
	        }
	        return parseExpression();
	    };
	    /**
		 *  recursively evaluate the expression tree
		 *  @param   {Object} tree 
		 *  @return  {AudioNode}      the resulting audio node from the expression
		 *  @private
		 */
	    Tone.Expr.prototype._eval = function (tree) {
	        if (!this.isUndef(tree)) {
	            var node = tree.method(tree.args, this);
	            this._nodes.push(node);
	            return node;
	        }
	    };
	    /**
		 *  dispose all the nodes
		 *  @private
		 */
	    Tone.Expr.prototype._disposeNodes = function () {
	        for (var i = 0; i < this._nodes.length; i++) {
	            var node = this._nodes[i];
	            if (this.isFunction(node.dispose)) {
	                node.dispose();
	            } else if (this.isFunction(node.disconnect)) {
	                node.disconnect();
	            }
	            node = null;
	            this._nodes[i] = null;
	        }
	        this._nodes = null;
	    };
	    /**
		 *  clean up
		 */
	    Tone.Expr.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._disposeNodes();
	    };
	    return Tone.Expr;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Convert an incoming signal between 0, 1 to an equal power gain scale.
		 *
		 *  @extends {Tone.SignalBase}
		 *  @constructor
		 *  @example
		 * var eqPowGain = new Tone.EqualPowerGain();
		 */
	    Tone.EqualPowerGain = function () {
	        /**
			 *  @type {Tone.WaveShaper}
			 *  @private
			 */
	        this._eqPower = this.input = this.output = new Tone.WaveShaper(function (val) {
	            if (Math.abs(val) < 0.001) {
	                //should output 0 when input is 0
	                return 0;
	            } else {
	                return this.equalPowerScale(val);
	            }
	        }.bind(this), 4096);
	    };
	    Tone.extend(Tone.EqualPowerGain, Tone.SignalBase);
	    /**
		 *  clean up
		 *  @returns {Tone.EqualPowerGain} this
		 */
	    Tone.EqualPowerGain.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._eqPower.dispose();
	        this._eqPower = null;
	        return this;
	    };
	    return Tone.EqualPowerGain;
	});
	Module(function (Tone) {
	    
	    /**
		 * @class  Tone.Crossfade provides equal power fading between two inputs. 
		 *         More on crossfading technique [here](https://en.wikipedia.org/wiki/Fade_(audio_engineering)#Crossfading).
		 *
		 * @constructor
		 * @extends {Tone}
		 * @param {NormalRange} [initialFade=0.5]
		 * @example
		 * var crossFade = new Tone.CrossFade(0.5);
		 * //connect effect A to crossfade from
		 * //effect output 0 to crossfade input 0
		 * effectA.connect(crossFade, 0, 0);
		 * //connect effect B to crossfade from
		 * //effect output 0 to crossfade input 1
		 * effectB.connect(crossFade, 0, 1);
		 * crossFade.fade.value = 0;
		 * // ^ only effectA is output
		 * crossFade.fade.value = 1;
		 * // ^ only effectB is output
		 * crossFade.fade.value = 0.5;
		 * // ^ the two signals are mixed equally. 
		 */
	    Tone.CrossFade = function (initialFade) {
	        Tone.call(this, 2, 1);
	        /**
			 *  Alias for <code>input[0]</code>. 
			 *  @type {GainNode}
			 */
	        this.a = this.input[0] = this.context.createGain();
	        /**
			 *  Alias for <code>input[1]</code>. 
			 *  @type {GainNode}
			 */
	        this.b = this.input[1] = this.context.createGain();
	        /**
			 * 	The mix between the two inputs. A fade value of 0
			 * 	will output 100% <code>input[0]</code> and 
			 * 	a value of 1 will output 100% <code>input[1]</code>. 
			 *  @type {NormalRange}
			 *  @signal
			 */
	        this.fade = new Tone.Signal(this.defaultArg(initialFade, 0.5), Tone.Type.NormalRange);
	        /**
			 *  equal power gain cross fade
			 *  @private
			 *  @type {Tone.EqualPowerGain}
			 */
	        this._equalPowerA = new Tone.EqualPowerGain();
	        /**
			 *  equal power gain cross fade
			 *  @private
			 *  @type {Tone.EqualPowerGain}
			 */
	        this._equalPowerB = new Tone.EqualPowerGain();
	        /**
			 *  invert the incoming signal
			 *  @private
			 *  @type {Tone}
			 */
	        this._invert = new Tone.Expr('1 - $0');
	        //connections
	        this.a.connect(this.output);
	        this.b.connect(this.output);
	        this.fade.chain(this._equalPowerB, this.b.gain);
	        this.fade.chain(this._invert, this._equalPowerA, this.a.gain);
	        this._readOnly('fade');
	    };
	    Tone.extend(Tone.CrossFade);
	    /**
		 *  clean up
		 *  @returns {Tone.CrossFade} this
		 */
	    Tone.CrossFade.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._writable('fade');
	        this._equalPowerA.dispose();
	        this._equalPowerA = null;
	        this._equalPowerB.dispose();
	        this._equalPowerB = null;
	        this.fade.dispose();
	        this.fade = null;
	        this._invert.dispose();
	        this._invert = null;
	        this.a.disconnect();
	        this.a = null;
	        this.b.disconnect();
	        this.b = null;
	        return this;
	    };
	    return Tone.CrossFade;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.Filter is a filter which allows for all of the same native methods
		 *          as the [BiquadFilterNode](http://webaudio.github.io/web-audio-api/#the-biquadfilternode-interface). 
		 *          Tone.Filter has the added ability to set the filter rolloff at -12 
		 *          (default), -24 and -48. 
		 *
		 *  @constructor
		 *  @extends {Tone}
		 *  @param {Frequency|Object} [frequency] The cutoff frequency of the filter.
		 *  @param {string=} type The type of filter.
		 *  @param {number=} rolloff The drop in decibels per octave after the cutoff frequency.
		 *                            3 choices: -12, -24, and -48
		 *  @example
		 *  var filter = new Tone.Filter(200, "highpass");
		 */
	    Tone.Filter = function () {
	        Tone.call(this);
	        var options = this.optionsObject(arguments, [
	            'frequency',
	            'type',
	            'rolloff'
	        ], Tone.Filter.defaults);
	        /**
			 *  the filter(s)
			 *  @type {Array}
			 *  @private
			 */
	        this._filters = [];
	        /**
			 *  The cutoff frequency of the filter. 
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.frequency = new Tone.Signal(options.frequency, Tone.Type.Frequency);
	        /**
			 *  The detune parameter
			 *  @type {Cents}
			 *  @signal
			 */
	        this.detune = new Tone.Signal(0, Tone.Type.Cents);
	        /**
			 *  The gain of the filter, only used in certain filter types
			 *  @type {Gain}
			 *  @signal
			 */
	        this.gain = new Tone.Signal({
	            'value': options.gain,
	            'units': Tone.Type.Gain,
	            'convert': false
	        });
	        /**
			 *  The Q or Quality of the filter
			 *  @type {Positive}
			 *  @signal
			 */
	        this.Q = new Tone.Signal(options.Q);
	        /**
			 *  the type of the filter
			 *  @type {string}
			 *  @private
			 */
	        this._type = options.type;
	        /**
			 *  the rolloff value of the filter
			 *  @type {number}
			 *  @private
			 */
	        this._rolloff = options.rolloff;
	        //set the rolloff;
	        this.rolloff = options.rolloff;
	        this._readOnly([
	            'detune',
	            'frequency',
	            'gain',
	            'Q'
	        ]);
	    };
	    Tone.extend(Tone.Filter);
	    /**
		 *  the default parameters
		 *
		 *  @static
		 *  @type {Object}
		 */
	    Tone.Filter.defaults = {
	        'type': 'lowpass',
	        'frequency': 350,
	        'rolloff': -12,
	        'Q': 1,
	        'gain': 0
	    };
	    /**
		 * The type of the filter. Types: "lowpass", "highpass", 
		 * "bandpass", "lowshelf", "highshelf", "notch", "allpass", or "peaking". 
		 * @memberOf Tone.Filter#
		 * @type {string}
		 * @name type
		 */
	    Object.defineProperty(Tone.Filter.prototype, 'type', {
	        get: function () {
	            return this._type;
	        },
	        set: function (type) {
	            var types = [
	                'lowpass',
	                'highpass',
	                'bandpass',
	                'lowshelf',
	                'highshelf',
	                'notch',
	                'allpass',
	                'peaking'
	            ];
	            if (types.indexOf(type) === -1) {
	                throw new Error('Tone.Filter does not have filter type ' + type);
	            }
	            this._type = type;
	            for (var i = 0; i < this._filters.length; i++) {
	                this._filters[i].type = type;
	            }
	        }
	    });
	    /**
		 * The rolloff of the filter which is the drop in db
		 * per octave. Implemented internally by cascading filters.
		 * Only accepts the values -12, -24, -48 and -96.
		 * @memberOf Tone.Filter#
		 * @type {number}
		 * @name rolloff
		 */
	    Object.defineProperty(Tone.Filter.prototype, 'rolloff', {
	        get: function () {
	            return this._rolloff;
	        },
	        set: function (rolloff) {
	            rolloff = parseInt(rolloff, 10);
	            var possibilities = [
	                -12,
	                -24,
	                -48,
	                -96
	            ];
	            var cascadingCount = possibilities.indexOf(rolloff);
	            //check the rolloff is valid
	            if (cascadingCount === -1) {
	                throw new Error('Filter rolloff can only be -12, -24, -48 or -96');
	            }
	            cascadingCount += 1;
	            this._rolloff = rolloff;
	            //first disconnect the filters and throw them away
	            this.input.disconnect();
	            for (var i = 0; i < this._filters.length; i++) {
	                this._filters[i].disconnect();
	                this._filters[i] = null;
	            }
	            this._filters = new Array(cascadingCount);
	            for (var count = 0; count < cascadingCount; count++) {
	                var filter = this.context.createBiquadFilter();
	                filter.type = this._type;
	                this.frequency.connect(filter.frequency);
	                this.detune.connect(filter.detune);
	                this.Q.connect(filter.Q);
	                this.gain.connect(filter.gain);
	                this._filters[count] = filter;
	            }
	            //connect them up
	            var connectionChain = [this.input].concat(this._filters).concat([this.output]);
	            this.connectSeries.apply(this, connectionChain);
	        }
	    });
	    /**
		 *  Clean up. 
		 *  @return {Tone.Filter} this
		 */
	    Tone.Filter.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        for (var i = 0; i < this._filters.length; i++) {
	            this._filters[i].disconnect();
	            this._filters[i] = null;
	        }
	        this._filters = null;
	        this._writable([
	            'detune',
	            'frequency',
	            'gain',
	            'Q'
	        ]);
	        this.frequency.dispose();
	        this.Q.dispose();
	        this.frequency = null;
	        this.Q = null;
	        this.detune.dispose();
	        this.detune = null;
	        this.gain.dispose();
	        this.gain = null;
	        return this;
	    };
	    return Tone.Filter;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Split the incoming signal into three bands (low, mid, high)
		 *         with two crossover frequency controls. 
		 *
		 *  @extends {Tone}
		 *  @constructor
		 *  @param {Frequency|Object} [lowFrequency] the low/mid crossover frequency
		 *  @param {Frequency} [highFrequency] the mid/high crossover frequency
		 */
	    Tone.MultibandSplit = function () {
	        var options = this.optionsObject(arguments, [
	            'lowFrequency',
	            'highFrequency'
	        ], Tone.MultibandSplit.defaults);
	        /**
			 *  the input
			 *  @type {GainNode}
			 *  @private
			 */
	        this.input = this.context.createGain();
	        /**
			 *  the outputs
			 *  @type {Array}
			 *  @private
			 */
	        this.output = new Array(3);
	        /**
			 *  The low band. Alias for <code>output[0]</code>
			 *  @type {Tone.Filter}
			 */
	        this.low = this.output[0] = new Tone.Filter(0, 'lowpass');
	        /**
			 *  the lower filter of the mid band
			 *  @type {Tone.Filter}
			 *  @private
			 */
	        this._lowMidFilter = new Tone.Filter(0, 'highpass');
	        /**
			 *  The mid band output. Alias for <code>output[1]</code>
			 *  @type {Tone.Filter}
			 */
	        this.mid = this.output[1] = new Tone.Filter(0, 'lowpass');
	        /**
			 *  The high band output. Alias for <code>output[2]</code>
			 *  @type {Tone.Filter}
			 */
	        this.high = this.output[2] = new Tone.Filter(0, 'highpass');
	        /**
			 *  The low/mid crossover frequency.
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.lowFrequency = new Tone.Signal(options.lowFrequency, Tone.Type.Frequency);
	        /**
			 *  The mid/high crossover frequency.
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.highFrequency = new Tone.Signal(options.highFrequency, Tone.Type.Frequency);
	        /**
			 *  The quality of all the filters
			 *  @type {Number}
			 *  @signal
			 */
	        this.Q = new Tone.Signal(options.Q);
	        this.input.fan(this.low, this.high);
	        this.input.chain(this._lowMidFilter, this.mid);
	        //the frequency control signal
	        this.lowFrequency.connect(this.low.frequency);
	        this.lowFrequency.connect(this._lowMidFilter.frequency);
	        this.highFrequency.connect(this.mid.frequency);
	        this.highFrequency.connect(this.high.frequency);
	        //the Q value
	        this.Q.connect(this.low.Q);
	        this.Q.connect(this._lowMidFilter.Q);
	        this.Q.connect(this.mid.Q);
	        this.Q.connect(this.high.Q);
	        this._readOnly([
	            'high',
	            'mid',
	            'low',
	            'highFrequency',
	            'lowFrequency'
	        ]);
	    };
	    Tone.extend(Tone.MultibandSplit);
	    /**
		 *  @private
		 *  @static
		 *  @type {Object}
		 */
	    Tone.MultibandSplit.defaults = {
	        'lowFrequency': 400,
	        'highFrequency': 2500,
	        'Q': 1
	    };
	    /**
		 *  Clean up.
		 *  @returns {Tone.MultibandSplit} this
		 */
	    Tone.MultibandSplit.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._writable([
	            'high',
	            'mid',
	            'low',
	            'highFrequency',
	            'lowFrequency'
	        ]);
	        this.low.dispose();
	        this.low = null;
	        this._lowMidFilter.dispose();
	        this._lowMidFilter = null;
	        this.mid.dispose();
	        this.mid = null;
	        this.high.dispose();
	        this.high = null;
	        this.lowFrequency.dispose();
	        this.lowFrequency = null;
	        this.highFrequency.dispose();
	        this.highFrequency = null;
	        this.Q.dispose();
	        this.Q = null;
	        return this;
	    };
	    return Tone.MultibandSplit;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.EQ3 is a three band EQ with control over low, mid, and high gain as
		 *         well as the low and high crossover frequencies.
		 *
		 *  @constructor
		 *  @extends {Tone}
		 *  
		 *  @param {Decibels|Object} [lowLevel] The gain applied to the lows.
		 *  @param {Decibels} [midLevel] The gain applied to the mid.
		 *  @param {Decibels} [highLevel] The gain applied to the high.
		 *  @example
		 * var eq = new Tone.EQ3(-10, 3, -20);
		 */
	    Tone.EQ3 = function () {
	        var options = this.optionsObject(arguments, [
	            'low',
	            'mid',
	            'high'
	        ], Tone.EQ3.defaults);
	        /**
			 *  the output node
			 *  @type {GainNode}
			 *  @private
			 */
	        this.output = this.context.createGain();
	        /**
			 *  the multiband split
			 *  @type {Tone.MultibandSplit}
			 *  @private
			 */
	        this._multibandSplit = this.input = new Tone.MultibandSplit({
	            'lowFrequency': options.lowFrequency,
	            'highFrequency': options.highFrequency
	        });
	        /**
			 *  the low gain
			 *  @type {GainNode}
			 *  @private
			 */
	        this._lowGain = this.context.createGain();
	        /**
			 *  the mid gain
			 *  @type {GainNode}
			 *  @private
			 */
	        this._midGain = this.context.createGain();
	        /**
			 *  the high gain
			 *  @type {GainNode}
			 *  @private
			 */
	        this._highGain = this.context.createGain();
	        /**
			 * The gain in decibels of the low part
			 * @type {Decibels}
			 * @signal
			 */
	        this.low = new Tone.Signal(this._lowGain.gain, Tone.Type.Decibels);
	        /**
			 * The gain in decibels of the mid part
			 * @type {Decibels}
			 * @signal
			 */
	        this.mid = new Tone.Signal(this._midGain.gain, Tone.Type.Decibels);
	        /**
			 * The gain in decibels of the high part
			 * @type {Decibels}
			 * @signal
			 */
	        this.high = new Tone.Signal(this._highGain.gain, Tone.Type.Decibels);
	        /**
			 *  The Q value for all of the filters. 
			 *  @type {Positive}
			 *  @signal
			 */
	        this.Q = this._multibandSplit.Q;
	        /**
			 *  The low/mid crossover frequency. 
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.lowFrequency = this._multibandSplit.lowFrequency;
	        /**
			 *  The mid/high crossover frequency. 
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.highFrequency = this._multibandSplit.highFrequency;
	        //the frequency bands
	        this._multibandSplit.low.chain(this._lowGain, this.output);
	        this._multibandSplit.mid.chain(this._midGain, this.output);
	        this._multibandSplit.high.chain(this._highGain, this.output);
	        //set the gains
	        this.low.value = options.low;
	        this.mid.value = options.mid;
	        this.high.value = options.high;
	        this._readOnly([
	            'low',
	            'mid',
	            'high',
	            'lowFrequency',
	            'highFrequency'
	        ]);
	    };
	    Tone.extend(Tone.EQ3);
	    /**
		 *  the default values
		 */
	    Tone.EQ3.defaults = {
	        'low': 0,
	        'mid': 0,
	        'high': 0,
	        'lowFrequency': 400,
	        'highFrequency': 2500
	    };
	    /**
		 *  clean up
		 *  @returns {Tone.EQ3} this
		 */
	    Tone.EQ3.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._writable([
	            'low',
	            'mid',
	            'high',
	            'lowFrequency',
	            'highFrequency'
	        ]);
	        this._multibandSplit.dispose();
	        this._multibandSplit = null;
	        this.lowFrequency = null;
	        this.highFrequency = null;
	        this._lowGain.disconnect();
	        this._lowGain = null;
	        this._midGain.disconnect();
	        this._midGain = null;
	        this._highGain.disconnect();
	        this._highGain = null;
	        this.low.dispose();
	        this.low = null;
	        this.mid.dispose();
	        this.mid = null;
	        this.high.dispose();
	        this.high = null;
	        this.Q = null;
	        return this;
	    };
	    return Tone.EQ3;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Performs a linear scaling on an input signal.
		 *          Scales a NormalRange input to between
		 *          outputMin and outputMax.
		 *
		 *  @constructor
		 *  @extends {Tone.SignalBase}
		 *  @param {number} [outputMin=0] The output value when the input is 0. 
		 *  @param {number} [outputMax=1]	The output value when the input is 1. 
		 *  @example
		 * var scale = new Tone.Scale(50, 100);
		 * var signal = new Tone.Signal(0.5).connect(scale);
		 * //the output of scale equals 75
		 */
	    Tone.Scale = function (outputMin, outputMax) {
	        /** 
			 *  @private
			 *  @type {number}
			 */
	        this._outputMin = this.defaultArg(outputMin, 0);
	        /** 
			 *  @private
			 *  @type {number}
			 */
	        this._outputMax = this.defaultArg(outputMax, 1);
	        /** 
			 *  @private
			 *  @type {Tone.Multiply}
			 *  @private
			 */
	        this._scale = this.input = new Tone.Multiply(1);
	        /** 
			 *  @private
			 *  @type {Tone.Add}
			 *  @private
			 */
	        this._add = this.output = new Tone.Add(0);
	        this._scale.connect(this._add);
	        this._setRange();
	    };
	    Tone.extend(Tone.Scale, Tone.SignalBase);
	    /**
		 * The minimum output value. This number is output when 
		 * the value input value is 0. 
		 * @memberOf Tone.Scale#
		 * @type {number}
		 * @name min
		 */
	    Object.defineProperty(Tone.Scale.prototype, 'min', {
	        get: function () {
	            return this._outputMin;
	        },
	        set: function (min) {
	            this._outputMin = min;
	            this._setRange();
	        }
	    });
	    /**
		 * The maximum output value. This number is output when 
		 * the value input value is 1. 
		 * @memberOf Tone.Scale#
		 * @type {number}
		 * @name max
		 */
	    Object.defineProperty(Tone.Scale.prototype, 'max', {
	        get: function () {
	            return this._outputMax;
	        },
	        set: function (max) {
	            this._outputMax = max;
	            this._setRange();
	        }
	    });
	    /**
		 *  set the values
		 *  @private
		 */
	    Tone.Scale.prototype._setRange = function () {
	        this._add.value = this._outputMin;
	        this._scale.value = this._outputMax - this._outputMin;
	    };
	    /**
		 *  Clean up.
		 *  @returns {Tone.Scale} this
		 */
	    Tone.Scale.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._add.dispose();
	        this._add = null;
	        this._scale.dispose();
	        this._scale = null;
	        return this;
	    };
	    return Tone.Scale;
	});
	Module(function (Tone) {
	    /**
		 *  @class  Performs an exponential scaling on an input signal.
		 *          Scales a NormalRange value [0,1] exponentially
		 *          to the output range of outputMin to outputMax.
		 *
		 *  @constructor
		 *  @extends {Tone.SignalBase}
		 *  @param {number} [outputMin=0] The output value when the input is 0. 
		 *  @param {number} [outputMax=1]	The output value when the input is 1. 
		 *  @param {number} [exponent=2] The exponent which scales the incoming signal.
		 *  @example
		 * var scaleExp = new Tone.ScaleExp(0, 100, 2);
		 * var signal = new Tone.Signal(0.5).connect(scaleExp);
		 */
	    Tone.ScaleExp = function (outputMin, outputMax, exponent) {
	        /**
			 *  scale the input to the output range
			 *  @type {Tone.Scale}
			 *  @private
			 */
	        this._scale = this.output = new Tone.Scale(outputMin, outputMax);
	        /**
			 *  @private
			 *  @type {Tone.Pow}
			 *  @private
			 */
	        this._exp = this.input = new Tone.Pow(this.defaultArg(exponent, 2));
	        this._exp.connect(this._scale);
	    };
	    Tone.extend(Tone.ScaleExp, Tone.SignalBase);
	    /**
		 * Instead of interpolating linearly between the <code>min</code> and 
		 * <code>max</code> values, setting the exponent will interpolate between
		 * the two values with an exponential curve. 
		 * @memberOf Tone.ScaleExp#
		 * @type {number}
		 * @name exponent
		 */
	    Object.defineProperty(Tone.ScaleExp.prototype, 'exponent', {
	        get: function () {
	            return this._exp.value;
	        },
	        set: function (exp) {
	            this._exp.value = exp;
	        }
	    });
	    /**
		 * The minimum output value. This number is output when 
		 * the value input value is 0. 
		 * @memberOf Tone.ScaleExp#
		 * @type {number}
		 * @name min
		 */
	    Object.defineProperty(Tone.ScaleExp.prototype, 'min', {
	        get: function () {
	            return this._scale.min;
	        },
	        set: function (min) {
	            this._scale.min = min;
	        }
	    });
	    /**
		 * The maximum output value. This number is output when 
		 * the value input value is 1. 
		 * @memberOf Tone.ScaleExp#
		 * @type {number}
		 * @name max
		 */
	    Object.defineProperty(Tone.ScaleExp.prototype, 'max', {
	        get: function () {
	            return this._scale.max;
	        },
	        set: function (max) {
	            this._scale.max = max;
	        }
	    });
	    /**
		 *  Clean up.
		 *  @returns {Tone.ScaleExp} this
		 */
	    Tone.ScaleExp.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._scale.dispose();
	        this._scale = null;
	        this._exp.dispose();
	        this._exp = null;
	        return this;
	    };
	    return Tone.ScaleExp;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Comb filters are basic building blocks for physical modeling. Read more
		 *         about comb filters on [CCRMA's website](https://ccrma.stanford.edu/~jos/pasp/Feedback_Comb_Filters.html).
		 *
		 *  @extends {Tone}
		 *  @constructor
		 *  @param {Time|Object} [delayTime] The delay time of the filter. 
		 *  @param {NormalRange=} resonance The amount of feedback the filter has. 
		 */
	    Tone.FeedbackCombFilter = function () {
	        Tone.call(this);
	        var options = this.optionsObject(arguments, [
	            'delayTime',
	            'resonance'
	        ], Tone.FeedbackCombFilter.defaults);
	        /**
			 *  The amount of feedback of the delayed signal. 
			 *  @type {NormalRange}
			 *  @signal
			 */
	        this.resonance = new Tone.Signal(options.resonance, Tone.Type.NormalRange);
	        /**
			 *  the delay node
			 *  @type {DelayNode}
			 *  @private
			 */
	        this._delay = this.input = this.output = this.context.createDelay(1);
	        /**
			 *  The amount of delay of the comb filter. 
			 *  @type {Time}
			 *  @signal
			 */
	        this.delayTime = new Tone.Signal(options.delayTime, Tone.Type.Time);
	        /**
			 *  the feedback node
			 *  @type {GainNode}
			 *  @private
			 */
	        this._feedback = this.context.createGain();
	        this._delay.chain(this._feedback, this._delay);
	        this.resonance.connect(this._feedback.gain);
	        this.delayTime.connect(this._delay.delayTime);
	        this._readOnly([
	            'resonance',
	            'delayTime'
	        ]);
	    };
	    Tone.extend(Tone.FeedbackCombFilter);
	    /**
		 *  the default parameters
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
	    Tone.FeedbackCombFilter.defaults = {
	        'delayTime': 0.1,
	        'resonance': 0.5
	    };
	    /**
		 *  clean up
		 *  @returns {Tone.FeedbackCombFilter} this
		 */
	    Tone.FeedbackCombFilter.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._writable([
	            'resonance',
	            'delayTime'
	        ]);
	        this._delay.disconnect();
	        this._delay = null;
	        this.delayTime.dispose();
	        this.delayTime = null;
	        this.resonance.dispose();
	        this.resonance = null;
	        this._feedback.disconnect();
	        this._feedback = null;
	        return this;
	    };
	    return Tone.FeedbackCombFilter;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.Follower is a  crude envelope follower which will follow 
		 *          the amplitude of an incoming signal. 
		 *          Take care with small (< 0.02) attack or decay values 
		 *          as follower has some ripple which is exaggerated
		 *          at these values. Read more about envelope followers (also known 
		 *          as envelope detectors) on [Wikipedia](https://en.wikipedia.org/wiki/Envelope_detector).
		 *  
		 *  @constructor
		 *  @extends {Tone}
		 *  @param {Time|Object} [attack] The rate at which the follower rises.
		 *  @param {Time=} release The rate at which the folower falls. 
		 *  @example
		 * var follower = new Tone.Follower(0.2, 0.4);
		 */
	    Tone.Follower = function () {
	        Tone.call(this);
	        var options = this.optionsObject(arguments, [
	            'attack',
	            'release'
	        ], Tone.Follower.defaults);
	        /**
			 *  @type {Tone.Abs}
			 *  @private
			 */
	        this._abs = new Tone.Abs();
	        /**
			 *  the lowpass filter which smooths the input
			 *  @type {BiquadFilterNode}
			 *  @private
			 */
	        this._filter = this.context.createBiquadFilter();
	        this._filter.type = 'lowpass';
	        this._filter.frequency.value = 0;
	        this._filter.Q.value = -100;
	        /**
			 *  @type {WaveShaperNode}
			 *  @private
			 */
	        this._frequencyValues = new Tone.WaveShaper();
	        /**
			 *  @type {Tone.Subtract}
			 *  @private
			 */
	        this._sub = new Tone.Subtract();
	        /**
			 *  @type {DelayNode}
			 *  @private
			 */
	        this._delay = this.context.createDelay();
	        this._delay.delayTime.value = this.blockTime;
	        /**
			 *  this keeps it far from 0, even for very small differences
			 *  @type {Tone.Multiply}
			 *  @private
			 */
	        this._mult = new Tone.Multiply(10000);
	        /**
			 *  @private
			 *  @type {number}
			 */
	        this._attack = options.attack;
	        /**
			 *  @private
			 *  @type {number}
			 */
	        this._release = options.release;
	        //the smoothed signal to get the values
	        this.input.chain(this._abs, this._filter, this.output);
	        //the difference path
	        this._abs.connect(this._sub, 0, 1);
	        this._filter.chain(this._delay, this._sub);
	        //threshold the difference and use the thresh to set the frequency
	        this._sub.chain(this._mult, this._frequencyValues, this._filter.frequency);
	        //set the attack and release values in the table
	        this._setAttackRelease(this._attack, this._release);
	    };
	    Tone.extend(Tone.Follower);
	    /**
		 *  @static
		 *  @type {Object}
		 */
	    Tone.Follower.defaults = {
	        'attack': 0.05,
	        'release': 0.5
	    };
	    /**
		 *  sets the attack and release times in the wave shaper
		 *  @param   {Time} attack  
		 *  @param   {Time} release 
		 *  @private
		 */
	    Tone.Follower.prototype._setAttackRelease = function (attack, release) {
	        var minTime = this.blockTime;
	        attack = this.secondsToFrequency(this.toSeconds(attack));
	        release = this.secondsToFrequency(this.toSeconds(release));
	        attack = Math.max(attack, minTime);
	        release = Math.max(release, minTime);
	        this._frequencyValues.setMap(function (val) {
	            if (val <= 0) {
	                return attack;
	            } else {
	                return release;
	            }
	        });
	    };
	    /**
		 * The attack time.
		 * @memberOf Tone.Follower#
		 * @type {Time}
		 * @name attack
		 */
	    Object.defineProperty(Tone.Follower.prototype, 'attack', {
	        get: function () {
	            return this._attack;
	        },
	        set: function (attack) {
	            this._attack = attack;
	            this._setAttackRelease(this._attack, this._release);
	        }
	    });
	    /**
		 * The release time.
		 * @memberOf Tone.Follower#
		 * @type {Time}
		 * @name release
		 */
	    Object.defineProperty(Tone.Follower.prototype, 'release', {
	        get: function () {
	            return this._release;
	        },
	        set: function (release) {
	            this._release = release;
	            this._setAttackRelease(this._attack, this._release);
	        }
	    });
	    /**
		 *  Borrows the connect method from Signal so that the output can be used
		 *  as a Tone.Signal control signal.
		 *  @function
		 */
	    Tone.Follower.prototype.connect = Tone.Signal.prototype.connect;
	    /**
		 *  dispose
		 *  @returns {Tone.Follower} this
		 */
	    Tone.Follower.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._filter.disconnect();
	        this._filter = null;
	        this._frequencyValues.disconnect();
	        this._frequencyValues = null;
	        this._delay.disconnect();
	        this._delay = null;
	        this._sub.disconnect();
	        this._sub = null;
	        this._abs.dispose();
	        this._abs = null;
	        this._mult.dispose();
	        this._mult = null;
	        this._curve = null;
	        return this;
	    };
	    return Tone.Follower;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.Gate only passes a signal through when the incoming 
		 *          signal exceeds a specified threshold. To do this, Gate uses 
		 *          a Tone.Follower to follow the amplitude of the incoming signal. 
		 *          A common implementation of this class is a [Noise Gate](https://en.wikipedia.org/wiki/Noise_gate).
		 *  
		 *  @constructor
		 *  @extends {Tone}
		 *  @param {Decibels|Object} [threshold] The threshold above which the gate will open. 
		 *  @param {Time=} attack The follower's attack time
		 *  @param {Time=} release The follower's release time
		 *  @example
		 * var gate = new Tone.Gate(-30, 0.2, 0.3).toMaster();
		 * var mic = new Tone.Microphone().connect(gate);
		 * //the gate will only pass through the incoming 
		 * //signal when it's louder than -30db
		 */
	    Tone.Gate = function () {
	        Tone.call(this);
	        var options = this.optionsObject(arguments, [
	            'threshold',
	            'attack',
	            'release'
	        ], Tone.Gate.defaults);
	        /**
			 *  @type {Tone.Follower}
			 *  @private
			 */
	        this._follower = new Tone.Follower(options.attack, options.release);
	        /**
			 *  @type {Tone.GreaterThan}
			 *  @private
			 */
	        this._gt = new Tone.GreaterThan(this.dbToGain(options.threshold));
	        //the connections
	        this.input.connect(this.output);
	        //the control signal
	        this.input.chain(this._gt, this._follower, this.output.gain);
	    };
	    Tone.extend(Tone.Gate);
	    /**
		 *  @const
		 *  @static
		 *  @type {Object}
		 */
	    Tone.Gate.defaults = {
	        'attack': 0.1,
	        'release': 0.1,
	        'threshold': -40
	    };
	    /**
		 * The threshold of the gate in decibels
		 * @memberOf Tone.Gate#
		 * @type {Decibels}
		 * @name threshold
		 */
	    Object.defineProperty(Tone.Gate.prototype, 'threshold', {
	        get: function () {
	            return this.gainToDb(this._gt.value);
	        },
	        set: function (thresh) {
	            this._gt.value = this.dbToGain(thresh);
	        }
	    });
	    /**
		 * The attack speed of the gate
		 * @memberOf Tone.Gate#
		 * @type {Time}
		 * @name attack
		 */
	    Object.defineProperty(Tone.Gate.prototype, 'attack', {
	        get: function () {
	            return this._follower.attack;
	        },
	        set: function (attackTime) {
	            this._follower.attack = attackTime;
	        }
	    });
	    /**
		 * The release speed of the gate
		 * @memberOf Tone.Gate#
		 * @type {Time}
		 * @name release
		 */
	    Object.defineProperty(Tone.Gate.prototype, 'release', {
	        get: function () {
	            return this._follower.release;
	        },
	        set: function (releaseTime) {
	            this._follower.release = releaseTime;
	        }
	    });
	    /**
		 *  Clean up. 
		 *  @returns {Tone.Gate} this
		 */
	    Tone.Gate.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._follower.dispose();
	        this._gt.dispose();
	        this._follower = null;
	        this._gt = null;
	        return this;
	    };
	    return Tone.Gate;
	});
	Module(function (Tone) {
	    /**
		 *  @class  A Timeline State. Provides the methods: <code>setStateAtTime("state", time)</code>
		 *          and <code>getStateAtTime(time)</code>.
		 *
		 *  @extends {Tone.Timeline}
		 *  @param {String} initial The initial state of the TimelineState. 
		 *                          Defaults to <code>undefined</code>
		 */
	    Tone.TimelineState = function (initial) {
	        Tone.Timeline.call(this);
	        /**
			 *  The initial state
			 *  @private
			 *  @type {String}
			 */
	        this._initial = initial;
	    };
	    Tone.extend(Tone.TimelineState, Tone.Timeline);
	    /**
		 *  Returns the scheduled state scheduled before or at
		 *  the given time.
		 *  @param  {Time}  time  The time to query.
		 *  @return  {String}  The name of the state input in setStateAtTime.
		 */
	    Tone.TimelineState.prototype.getStateAtTime = function (time) {
	        var event = this.getEvent(time);
	        if (event !== null) {
	            return event.state;
	        } else {
	            return this._initial;
	        }
	    };
	    /**
		 *  Returns the scheduled state scheduled before or at
		 *  the given time.
		 *  @param  {String}  state The name of the state to set.
		 *  @param  {Time}  time  The time to query.
		 */
	    Tone.TimelineState.prototype.setStateAtTime = function (state, time) {
	        this.addEvent({
	            'state': state,
	            'time': this.toSeconds(time)
	        });
	    };
	    return Tone.TimelineState;
	});
	Module(function (Tone) {
	    /**
		 *  @class  A sample accurate clock which provides a callback at the given rate. 
		 *          While the callback is not sample-accurate (it is still susceptible to
		 *          loose JS timing), the time passed in as the argument to the callback
		 *          is precise. For most applications, it is better to use Tone.Transport
		 *          instead of the Clock by itself since you can synchronize multiple callbacks.
		 *
		 * 	@constructor
		 * 	@extends {Tone}
		 * 	@param {Frequency} frequency The rate of the callback
		 * 	@param {function} callback The callback to be invoked with the time of the audio event
		 * 	@example
		 * //the callback will be invoked approximately once a second
		 * //and will print the time exactly once a second apart.
		 * var clock = new Tone.Clock(function(time){
		 * 	console.log(time);
		 * }, 1);
		 */
	    Tone.Clock = function () {
	        var options = this.optionsObject(arguments, [
	            'callback',
	            'frequency'
	        ], Tone.Clock.defaults);
	        /**
			 *  The callback function to invoke at the scheduled tick.
			 *  @type  {Function}
			 */
	        this.callback = options.callback;
	        /**
			 *  The time which the clock will schedule events in advance
			 *  of the current time. Scheduling notes in advance improves
			 *  performance and decreases the chance for clicks caused
			 *  by scheduling events in the past. If set to "auto",
			 *  this value will be automatically computed based on the 
			 *  rate of requestAnimationFrame (0.016 seconds). Larger values
			 *  will yeild better performance, but at the cost of latency. 
			 *  Values less than 0.016 are not recommended.
			 *  @type {Number|String}
			 */
	        this._lookAhead = 'auto';
	        /**
			 *  The lookahead value which was automatically
			 *  computed using a time-based averaging.
			 *  @type {Number}
			 *  @private
			 */
	        this._computedLookAhead = 1 / 60;
	        /**
			 *  The value afterwhich events are thrown out
			 *  @type {Number}
			 *  @private
			 */
	        this._threshold = 0.5;
	        /**
			 *  The next time the callback is scheduled.
			 *  @type {Number}
			 *  @private
			 */
	        this._nextTick = -1;
	        /**
			 *  The last time the callback was invoked
			 *  @type  {Number}
			 *  @private
			 */
	        this._lastUpdate = 0;
	        /**
			 *  The id of the requestAnimationFrame
			 *  @type {Number}
			 *  @private
			 */
	        this._loopID = -1;
	        /**
			 *  The rate the callback function should be invoked. 
			 *  @type  {BPM}
			 *  @signal
			 */
	        this.frequency = new Tone.TimelineSignal(options.frequency, Tone.Type.Frequency);
	        /**
			 *  The number of times the callback was invoked. Starts counting at 0
			 *  and increments after the callback was invoked. 
			 *  @type {Ticks}
			 *  @readOnly
			 */
	        this.ticks = 0;
	        /**
			 *  The state timeline
			 *  @type {Tone.TimelineState}
			 *  @private
			 */
	        this._state = new Tone.TimelineState(Tone.State.Stopped);
	        /**
			 *  A pre-binded loop function to save a tiny bit of overhead
			 *  of rebinding the function on every frame.
			 *  @type  {Function}
			 *  @private
			 */
	        this._boundLoop = this._loop.bind(this);
	        this._readOnly('frequency');
	        //start the loop
	        this._loop();
	    };
	    Tone.extend(Tone.Clock);
	    /**
		 *  The defaults
		 *  @const
		 *  @type  {Object}
		 */
	    Tone.Clock.defaults = {
	        'callback': Tone.noOp,
	        'frequency': 1,
	        'lookAhead': 'auto'
	    };
	    /**
		 *  Returns the playback state of the source, either "started", "stopped" or "paused".
		 *  @type {Tone.State}
		 *  @readOnly
		 *  @memberOf Tone.Clock#
		 *  @name state
		 */
	    Object.defineProperty(Tone.Clock.prototype, 'state', {
	        get: function () {
	            return this._state.getStateAtTime(this.now());
	        }
	    });
	    /**
		 *  The time which the clock will schedule events in advance
		 *  of the current time. Scheduling notes in advance improves
		 *  performance and decreases the chance for clicks caused
		 *  by scheduling events in the past. If set to "auto",
		 *  this value will be automatically computed based on the 
		 *  rate of requestAnimationFrame (0.016 seconds). Larger values
		 *  will yeild better performance, but at the cost of latency. 
		 *  Values less than 0.016 are not recommended.
		 *  @type {Number|String}
		 *  @memberOf Tone.Clock#
		 *  @name lookAhead
		 */
	    Object.defineProperty(Tone.Clock.prototype, 'lookAhead', {
	        get: function () {
	            return this._lookAhead;
	        },
	        set: function (val) {
	            if (val === 'auto') {
	                this._lookAhead = 'auto';
	            } else {
	                this._lookAhead = this.toSeconds(val);
	            }
	        }
	    });
	    /**
		 *  Start the clock at the given time. Optionally pass in an offset
		 *  of where to start the tick counter from.
		 *  @param  {Time}  time    The time the clock should start
		 *  @param  {Ticks=}  offset  Where the tick counter starts counting from.
		 *  @return  {Tone.Clock}  this
		 */
	    Tone.Clock.prototype.start = function (time, offset) {
	        time = this.toSeconds(time);
	        if (this._state.getStateAtTime(time) !== Tone.State.Started) {
	            this._state.addEvent({
	                'state': Tone.State.Started,
	                'time': time,
	                'offset': offset
	            });
	        }
	        return this;
	    };
	    /**
		 *  Stop the clock. Stopping the clock resets the tick counter to 0.
		 *  @param {Time} [time=now] The time when the clock should stop.
		 *  @returns {Tone.Clock} this
		 *  @example
		 * clock.stop();
		 */
	    Tone.Clock.prototype.stop = function (time) {
	        time = this.toSeconds(time);
	        if (this._state.getStateAtTime(time) !== Tone.State.Stopped) {
	            this._state.setStateAtTime(Tone.State.Stopped, time);
	        }
	        return this;
	    };
	    /**
		 *  Pause the clock. Pausing does not reset the tick counter.
		 *  @param {Time} [time=now] The time when the clock should stop.
		 *  @returns {Tone.Clock} this
		 */
	    Tone.Clock.prototype.pause = function (time) {
	        time = this.toSeconds(time);
	        if (this._state.getStateAtTime(time) === Tone.State.Started) {
	            this._state.setStateAtTime(Tone.State.Paused, time);
	        }
	        return this;
	    };
	    /**
		 *  The scheduling loop.
		 *  @param  {Number}  time  The current page time starting from 0
		 *                          when the page was loaded.
		 *  @private
		 */
	    Tone.Clock.prototype._loop = function (time) {
	        this._loopID = requestAnimationFrame(this._boundLoop);
	        //compute the look ahead
	        if (this._lookAhead === 'auto') {
	            if (!this.isUndef(time)) {
	                var diff = (time - this._lastUpdate) / 1000;
	                this._lastUpdate = time;
	                //throw away large differences
	                if (diff < this._threshold) {
	                    //averaging
	                    this._computedLookAhead = (9 * this._computedLookAhead + diff) / 10;
	                }
	            }
	        } else {
	            this._computedLookAhead = this._lookAhead;
	        }
	        //get the frequency value to compute the value of the next loop
	        var now = this.now();
	        //if it's started
	        var lookAhead = this._computedLookAhead * 2;
	        var event = this._state.getEvent(now + lookAhead);
	        var state = Tone.State.Stopped;
	        if (event) {
	            state = event.state;
	            //if it was stopped and now started
	            if (this._nextTick === -1 && state === Tone.State.Started) {
	                this._nextTick = event.time;
	                if (!this.isUndef(event.offset)) {
	                    this.ticks = event.offset;
	                }
	            }
	        }
	        if (state === Tone.State.Started) {
	            while (now + lookAhead > this._nextTick) {
	                //catch up
	                if (now > this._nextTick + this._threshold) {
	                    this._nextTick = now;
	                }
	                var tickTime = this._nextTick;
	                this._nextTick += 1 / this.frequency.getValueAtTime(this._nextTick);
	                this.callback(tickTime);
	                this.ticks++;
	            }
	        } else if (state === Tone.State.Stopped) {
	            this._nextTick = -1;
	            this.ticks = 0;
	        }
	    };
	    /**
		 *  Returns the scheduled state at the given time.
		 *  @param  {Time}  time  The time to query.
		 *  @return  {String}  The name of the state input in setStateAtTime.
		 *  @example
		 * clock.start("+0.1");
		 * clock.getStateAtTime("+0.1"); //returns "started"
		 */
	    Tone.Clock.prototype.getStateAtTime = function (time) {
	        return this._state.getStateAtTime(time);
	    };
	    /**
		 *  Clean up
		 *  @returns {Tone.Clock} this
		 */
	    Tone.Clock.prototype.dispose = function () {
	        cancelAnimationFrame(this._loopID);
	        Tone.TimelineState.prototype.dispose.call(this);
	        this._writable('frequency');
	        this.frequency.dispose();
	        this.frequency = null;
	        this._boundLoop = Tone.noOp;
	        this._nextTick = Infinity;
	        this.callback = null;
	        this._state.dispose();
	        this._state = null;
	    };
	    return Tone.Clock;
	});
	Module(function (Tone) {
	    /**
		 *  @class Tone.EventEmitter gives classes which extend it
		 *         the ability to listen for and trigger events. 
		 *         Inspiration and reference from Jerome Etienne's [MicroEvent](https://github.com/jeromeetienne/microevent.js).
		 *         MIT (c) 2011 Jerome Etienne.
		 *         
		 *  @extends {Tone}
		 */
	    Tone.EventEmitter = function () {
	        /**
			 *  Contains all of the events.
			 *  @private
			 *  @type  {Object}
			 */
	        this._events = {};
	    };
	    Tone.extend(Tone.EventEmitter);
	    /**
		 *  Bind a callback to a specific event.
		 *  @param  {String}    event     The name of the event to listen for.
		 *  @param  {Function}  callback  The callback to invoke when the
		 *                                event is triggered
		 *  @return  {Tone.EventEmitter}    this
		 */
	    Tone.EventEmitter.prototype.on = function (event, callback) {
	        //split the event
	        var events = event.split(/\W+/);
	        for (var i = 0; i < events.length; i++) {
	            var eventName = events[i];
	            if (!this._events.hasOwnProperty(eventName)) {
	                this._events[eventName] = [];
	            }
	            this._events[eventName].push(callback);
	        }
	        return this;
	    };
	    /**
		 *  Remove the event listener.
		 *  @param  {String}    event     The event to stop listening to.
		 *  @param  {Function=}  callback  The callback which was bound to 
		 *                                the event with Tone.EventEmitter.on.
		 *                                If no callback is given, all callbacks
		 *                                events are removed.
		 *  @return  {Tone.EventEmitter}    this
		 */
	    Tone.EventEmitter.prototype.off = function (event, callback) {
	        var events = event.split(/\W+/);
	        for (var ev = 0; ev < events.length; ev++) {
	            event = events[ev];
	            if (this._events.hasOwnProperty(event)) {
	                if (this.isUndef(callback)) {
	                    this._events[event] = [];
	                } else {
	                    var eventList = this._events[event];
	                    for (var i = 0; i < eventList.length; i++) {
	                        if (eventList[i] === callback) {
	                            eventList.splice(i, 1);
	                        }
	                    }
	                }
	            }
	        }
	        return this;
	    };
	    /**
		 *  Invoke all of the callbacks bound to the event
		 *  with any arguments passed in. 
		 *  @param  {String}  event  The name of the event.
		 *  @param {*...} args The arguments to pass to the functions listening.
		 *  @return  {Tone.EventEmitter}  this
		 */
	    Tone.EventEmitter.prototype.trigger = function (event) {
	        if (this._events) {
	            var args = Array.prototype.slice.call(arguments, 1);
	            if (this._events.hasOwnProperty(event)) {
	                var eventList = this._events[event];
	                for (var i = 0, len = eventList.length; i < len; i++) {
	                    eventList[i].apply(this, args);
	                }
	            }
	        }
	        return this;
	    };
	    /**
		 *  Add EventEmitter functions (on/off/trigger) to the object
		 *  @param  {Object|Function}  object  The object or class to extend.
		 */
	    Tone.EventEmitter.mixin = function (object) {
	        var functions = [
	            'on',
	            'off',
	            'trigger'
	        ];
	        object._events = {};
	        for (var i = 0; i < functions.length; i++) {
	            var func = functions[i];
	            var emitterFunc = Tone.EventEmitter.prototype[func];
	            object[func] = emitterFunc;
	        }
	    };
	    /**
		 *  Clean up
		 *  @return  {Tone.EventEmitter}  this
		 */
	    Tone.EventEmitter.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._events = null;
	        return this;
	    };
	    return Tone.EventEmitter;
	});
	Module(function (Tone) {
	    /**
		 *  @class Similar to Tone.Timeline, but all events represent
		 *         intervals with both "time" and "duration" times. The 
		 *         events are placed in a tree structure optimized
		 *         for querying an intersection point with the timeline
		 *         events. Internally uses an [Interval Tree](https://en.wikipedia.org/wiki/Interval_tree)
		 *         to represent the data.
		 *  @extends {Tone}
		 */
	    Tone.IntervalTimeline = function () {
	        /**
			 *  The root node of the inteval tree
			 *  @type  {IntervalNode}
			 *  @private
			 */
	        this._root = null;
	        /**
			 *  Keep track of the length of the timeline.
			 *  @type  {Number}
			 *  @private
			 */
	        this._length = 0;
	    };
	    Tone.extend(Tone.IntervalTimeline);
	    /**
		 *  The event to add to the timeline. All events must 
		 *  have a time and duration value
		 *  @param  {Object}  event  The event to add to the timeline
		 *  @return  {Tone.IntervalTimeline}  this
		 */
	    Tone.IntervalTimeline.prototype.addEvent = function (event) {
	        if (this.isUndef(event.time) || this.isUndef(event.duration)) {
	            throw new Error('events must have time and duration parameters');
	        }
	        var node = new IntervalNode(event.time, event.time + event.duration, event);
	        if (this._root === null) {
	            this._root = node;
	        } else {
	            this._root.insert(node);
	        }
	        this._length++;
	        // Restructure tree to be balanced
	        while (node !== null) {
	            node.updateHeight();
	            node.updateMax();
	            this._rebalance(node);
	            node = node.parent;
	        }
	        return this;
	    };
	    /**
		 *  Remove an event from the timeline.
		 *  @param  {Object}  event  The event to remove from the timeline
		 *  @return  {Tone.IntervalTimeline}  this
		 */
	    Tone.IntervalTimeline.prototype.removeEvent = function (event) {
	        if (this._root !== null) {
	            var results = [];
	            this._root.search(event.time, results);
	            for (var i = 0; i < results.length; i++) {
	                var node = results[i];
	                if (node.event === event) {
	                    this._removeNode(node);
	                    this._length--;
	                    break;
	                }
	            }
	        }
	        return this;
	    };
	    /**
		 *  The number of items in the timeline.
		 *  @type {Number}
		 *  @memberOf Tone.IntervalTimeline#
		 *  @name length
		 *  @readOnly
		 */
	    Object.defineProperty(Tone.IntervalTimeline.prototype, 'length', {
	        get: function () {
	            return this._length;
	        }
	    });
	    /**
		 *  Remove events whose time time is after the given time
		 *  @param  {Time}  time  The time to query.
		 *  @returns {Tone.IntervalTimeline} this
		 */
	    Tone.IntervalTimeline.prototype.cancel = function (after) {
	        after = this.toSeconds(after);
	        this.forEachAfter(after, function (event) {
	            this.removeEvent(event);
	        }.bind(this));
	        return this;
	    };
	    /**
		 *  Set the root node as the given node
		 *  @param {IntervalNode} node
		 *  @private
		 */
	    Tone.IntervalTimeline.prototype._setRoot = function (node) {
	        this._root = node;
	        if (this._root !== null) {
	            this._root.parent = null;
	        }
	    };
	    /**
		 *  Replace the references to the node in the node's parent
		 *  with the replacement node.
		 *  @param  {IntervalNode}  node        
		 *  @param  {IntervalNode}  replacement 
		 *  @private
		 */
	    Tone.IntervalTimeline.prototype._replaceNodeInParent = function (node, replacement) {
	        if (node.parent !== null) {
	            if (node.isLeftChild()) {
	                node.parent.left = replacement;
	            } else {
	                node.parent.right = replacement;
	            }
	            this._rebalance(node.parent);
	        } else {
	            this._setRoot(replacement);
	        }
	    };
	    /**
		 *  Remove the node from the tree and replace it with 
		 *  a successor which follows the schema.
		 *  @param  {IntervalNode}  node
		 *  @private
		 */
	    Tone.IntervalTimeline.prototype._removeNode = function (node) {
	        if (node.left === null && node.right === null) {
	            this._replaceNodeInParent(node, null);
	        } else if (node.right === null) {
	            this._replaceNodeInParent(node, node.left);
	        } else if (node.left === null) {
	            this._replaceNodeInParent(node, node.right);
	        } else {
	            var balance = node.getBalance();
	            var replacement, temp;
	            if (balance > 0) {
	                if (node.left.right === null) {
	                    replacement = node.left;
	                    replacement.right = node.right;
	                    temp = replacement;
	                } else {
	                    replacement = node.left.right;
	                    while (replacement.right !== null) {
	                        replacement = replacement.right;
	                    }
	                    replacement.parent.right = replacement.left;
	                    temp = replacement.parent;
	                    replacement.left = node.left;
	                    replacement.right = node.right;
	                }
	            } else {
	                if (node.right.left === null) {
	                    replacement = node.right;
	                    replacement.left = node.left;
	                    temp = replacement;
	                } else {
	                    replacement = node.right.left;
	                    while (replacement.left !== null) {
	                        replacement = replacement.left;
	                    }
	                    replacement.parent = replacement.parent;
	                    replacement.parent.left = replacement.right;
	                    temp = replacement.parent;
	                    replacement.left = node.left;
	                    replacement.right = node.right;
	                }
	            }
	            if (node.parent !== null) {
	                if (node.isLeftChild()) {
	                    node.parent.left = replacement;
	                } else {
	                    node.parent.right = replacement;
	                }
	            } else {
	                this._setRoot(replacement);
	            }
	            // this._replaceNodeInParent(node, replacement);
	            this._rebalance(temp);
	        }
	        node.dispose();
	    };
	    /**
		 *  Rotate the tree to the left
		 *  @param  {IntervalNode}  node
		 *  @private
		 */
	    Tone.IntervalTimeline.prototype._rotateLeft = function (node) {
	        var parent = node.parent;
	        var isLeftChild = node.isLeftChild();
	        // Make node.right the new root of this sub tree (instead of node)
	        var pivotNode = node.right;
	        node.right = pivotNode.left;
	        pivotNode.left = node;
	        if (parent !== null) {
	            if (isLeftChild) {
	                parent.left = pivotNode;
	            } else {
	                parent.right = pivotNode;
	            }
	        } else {
	            this._setRoot(pivotNode);
	        }
	    };
	    /**
		 *  Rotate the tree to the right
		 *  @param  {IntervalNode}  node
		 *  @private
		 */
	    Tone.IntervalTimeline.prototype._rotateRight = function (node) {
	        var parent = node.parent;
	        var isLeftChild = node.isLeftChild();
	        // Make node.left the new root of this sub tree (instead of node)
	        var pivotNode = node.left;
	        node.left = pivotNode.right;
	        pivotNode.right = node;
	        if (parent !== null) {
	            if (isLeftChild) {
	                parent.left = pivotNode;
	            } else {
	                parent.right = pivotNode;
	            }
	        } else {
	            this._setRoot(pivotNode);
	        }
	    };
	    /**
		 *  Balance the BST
		 *  @param  {IntervalNode}  node
		 *  @private
		 */
	    Tone.IntervalTimeline.prototype._rebalance = function (node) {
	        var balance = node.getBalance();
	        if (balance > 1) {
	            if (node.left.getBalance() < 0) {
	                this._rotateLeft(node.left);
	            } else {
	                this._rotateRight(node);
	            }
	        } else if (balance < -1) {
	            if (node.right.getBalance() > 0) {
	                this._rotateRight(node.right);
	            } else {
	                this._rotateLeft(node);
	            }
	        }
	    };
	    /**
		 *  Get an event whose time and duration span the give time. Will
		 *  return the match whose "time" value is closest to the given time.
		 *  @param  {Object}  event  The event to add to the timeline
		 *  @return  {Object}  The event which spans the desired time
		 */
	    Tone.IntervalTimeline.prototype.getEvent = function (time) {
	        if (this._root !== null) {
	            var results = [];
	            this._root.search(time, results);
	            if (results.length > 0) {
	                var max = results[0];
	                for (var i = 1; i < results.length; i++) {
	                    if (results[i].low > max.low) {
	                        max = results[i];
	                    }
	                }
	                return max.event;
	            }
	        }
	        return null;
	    };
	    /**
		 *  Iterate over everything in the timeline.
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Tone.IntervalTimeline} this
		 */
	    Tone.IntervalTimeline.prototype.forEach = function (callback) {
	        if (this._root !== null) {
	            var allNodes = [];
	            if (this._root !== null) {
	                this._root.traverse(function (node) {
	                    allNodes.push(node);
	                });
	            }
	            for (var i = 0; i < allNodes.length; i++) {
	                callback(allNodes[i].event);
	            }
	        }
	        return this;
	    };
	    /**
		 *  Iterate over everything in the array in which the given time
		 *  overlaps with the time and duration time of the event.
		 *  @param  {Time}  time The time to check if items are overlapping
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Tone.IntervalTimeline} this
		 */
	    Tone.IntervalTimeline.prototype.forEachOverlap = function (time, callback) {
	        //iterate over the items in reverse so that removing an item doesn't break things
	        time = this.toSeconds(time);
	        if (this._root !== null) {
	            var results = [];
	            this._root.search(time, results);
	            for (var i = results.length - 1; i >= 0; i--) {
	                callback(results[i].event);
	            }
	        }
	        return this;
	    };
	    /**
		 *  Iterate over everything in the array in which the time is greater
		 *  than the given time.
		 *  @param  {Time}  time The time to check if items are before
		 *  @param  {Function}  callback The callback to invoke with every item
		 *  @returns {Tone.IntervalTimeline} this
		 */
	    Tone.IntervalTimeline.prototype.forEachAfter = function (time, callback) {
	        //iterate over the items in reverse so that removing an item doesn't break things
	        time = this.toSeconds(time);
	        if (this._root !== null) {
	            var results = [];
	            this._root.searchAfter(time, results);
	            for (var i = results.length - 1; i >= 0; i--) {
	                callback(results[i].event);
	            }
	        }
	        return this;
	    };
	    /**
		 *  Clean up
		 *  @return  {Tone.IntervalTimeline}  this
		 */
	    Tone.IntervalTimeline.prototype.dispose = function () {
	        var allNodes = [];
	        if (this._root !== null) {
	            this._root.traverse(function (node) {
	                allNodes.push(node);
	            });
	        }
	        for (var i = 0; i < allNodes.length; i++) {
	            allNodes[i].dispose();
	        }
	        allNodes = null;
	        this._root = null;
	        return this;
	    };
	    ///////////////////////////////////////////////////////////////////////////
	    //	INTERVAL NODE HELPER
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *  Represents a node in the binary search tree, with the addition
		 *  of a "high" value which keeps track of the highest value of
		 *  its children. 
		 *  References: 
		 *  https://brooknovak.wordpress.com/2013/12/07/augmented-interval-tree-in-c/
		 *  http://www.mif.vu.lt/~valdas/ALGORITMAI/LITERATURA/Cormen/Cormen.pdf
		 *  @param {Number} low
		 *  @param {Number} high
		 *  @private
		 */
	    var IntervalNode = function (low, high, event) {
	        //the event container
	        this.event = event;
	        //the low value
	        this.low = low;
	        //the high value
	        this.high = high;
	        //the high value for this and all child nodes
	        this.max = this.high;
	        //the nodes to the left
	        this._left = null;
	        //the nodes to the right
	        this._right = null;
	        //the parent node
	        this.parent = null;
	        //the number of child nodes
	        this.height = 0;
	    };
	    /** 
		 *  Insert a node into the correct spot in the tree
		 *  @param  {IntervalNode}  node
		 */
	    IntervalNode.prototype.insert = function (node) {
	        if (node.low <= this.low) {
	            if (this.left === null) {
	                this.left = node;
	            } else {
	                this.left.insert(node);
	            }
	        } else {
	            if (this.right === null) {
	                this.right = node;
	            } else {
	                this.right.insert(node);
	            }
	        }
	    };
	    /**
		 *  Search the tree for nodes which overlap 
		 *  with the given point
		 *  @param  {Number}  point  The point to query
		 *  @param  {Array}  results  The array to put the results
		 */
	    IntervalNode.prototype.search = function (point, results) {
	        // If p is to the right of the rightmost point of any interval
	        // in this node and all children, there won't be any matches.
	        if (point > this.max) {
	            return;
	        }
	        // Search left children
	        if (this.left !== null) {
	            this.left.search(point, results);
	        }
	        // Check this node
	        if (this.low <= point && this.high >= point) {
	            results.push(this);
	        }
	        // If p is to the left of the time of this interval,
	        // then it can't be in any child to the right.
	        if (this.low > point) {
	            return;
	        }
	        // Search right children
	        if (this.right !== null) {
	            this.right.search(point, results);
	        }
	    };
	    /**
		 *  Search the tree for nodes which are less 
		 *  than the given point
		 *  @param  {Number}  point  The point to query
		 *  @param  {Array}  results  The array to put the results
		 */
	    IntervalNode.prototype.searchAfter = function (point, results) {
	        // Check this node
	        if (this.low >= point) {
	            results.push(this);
	            if (this.left !== null) {
	                this.left.searchAfter(point, results);
	            }
	        }
	        // search the right side
	        if (this.right !== null) {
	            this.right.searchAfter(point, results);
	        }
	    };
	    /**
		 *  Invoke the callback on this element and both it's branches
		 *  @param  {Function}  callback
		 */
	    IntervalNode.prototype.traverse = function (callback) {
	        callback(this);
	        if (this.left !== null) {
	            this.left.traverse(callback);
	        }
	        if (this.right !== null) {
	            this.right.traverse(callback);
	        }
	    };
	    /**
		 *  Update the height of the node
		 */
	    IntervalNode.prototype.updateHeight = function () {
	        if (this.left !== null && this.right !== null) {
	            this.height = Math.max(this.left.height, this.right.height) + 1;
	        } else if (this.right !== null) {
	            this.height = this.right.height + 1;
	        } else if (this.left !== null) {
	            this.height = this.left.height + 1;
	        } else {
	            this.height = 0;
	        }
	    };
	    /**
		 *  Update the height of the node
		 */
	    IntervalNode.prototype.updateMax = function () {
	        this.max = this.high;
	        if (this.left !== null) {
	            this.max = Math.max(this.max, this.left.max);
	        }
	        if (this.right !== null) {
	            this.max = Math.max(this.max, this.right.max);
	        }
	    };
	    /**
		 *  The balance is how the leafs are distributed on the node
		 *  @return  {Number}  Negative numbers are balanced to the right
		 */
	    IntervalNode.prototype.getBalance = function () {
	        var balance = 0;
	        if (this.left !== null && this.right !== null) {
	            balance = this.left.height - this.right.height;
	        } else if (this.left !== null) {
	            balance = this.left.height + 1;
	        } else if (this.right !== null) {
	            balance = -(this.right.height + 1);
	        }
	        return balance;
	    };
	    /**
		 *  @returns {Boolean} true if this node is the left child
		 *  of its parent
		 */
	    IntervalNode.prototype.isLeftChild = function () {
	        return this.parent !== null && this.parent.left === this;
	    };
	    /**
		 *  get/set the left node
		 *  @type {IntervalNode}
		 */
	    Object.defineProperty(IntervalNode.prototype, 'left', {
	        get: function () {
	            return this._left;
	        },
	        set: function (node) {
	            this._left = node;
	            if (node !== null) {
	                node.parent = this;
	            }
	            this.updateHeight();
	            this.updateMax();
	        }
	    });
	    /**
		 *  get/set the right node
		 *  @type {IntervalNode}
		 */
	    Object.defineProperty(IntervalNode.prototype, 'right', {
	        get: function () {
	            return this._right;
	        },
	        set: function (node) {
	            this._right = node;
	            if (node !== null) {
	                node.parent = this;
	            }
	            this.updateHeight();
	            this.updateMax();
	        }
	    });
	    /**
		 *  null out references.
		 */
	    IntervalNode.prototype.dispose = function () {
	        this.parent = null;
	        this._left = null;
	        this._right = null;
	        this.event = null;
	    };
	    ///////////////////////////////////////////////////////////////////////////
	    //	END INTERVAL NODE HELPER
	    ///////////////////////////////////////////////////////////////////////////
	    return Tone.IntervalTimeline;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Transport for timing musical events.
		 *          Supports tempo curves and time changes. Unlike browser-based timing (setInterval, requestAnimationFrame)
		 *          Tone.Transport timing events pass in the exact time of the scheduled event
		 *          in the argument of the callback function. Pass that time value to the object
		 *          you're scheduling. <br><br>
		 *          A single transport is created for you when the library is initialized. 
		 *          <br><br>
		 *          The transport emits the events: "start", "stop", "pause", and "loop" which are
		 *          called with the time of that event as the argument. 
		 *
		 *  @extends {Tone.EventEmitter}
		 *  @singleton
		 *  @example
		 * //repeated event every 8th note
		 * Tone.Transport.setInterval(function(time){
		 * 	//do something with the time
		 * }, "8n");
		 *  @example
		 * //one time event 1 second in the future
		 * Tone.Transport.setTimeout(function(time){
		 * 	//do something with the time
		 * }, 1);
		 *  @example
		 * //event fixed to the Transports timeline. 
		 * Tone.Transport.setTimeline(function(time){
		 * 	//do something with the time
		 * }, "16:0:0");
		 */
	    Tone.Transport = function () {
	        Tone.EventEmitter.call(this);
	        ///////////////////////////////////////////////////////////////////////
	        //	LOOPING
	        //////////////////////////////////////////////////////////////////////
	        /** 
			 * 	If the transport loops or not.
			 *  @type {boolean}
			 */
	        this.loop = false;
	        /** 
			 * 	The loop start position in ticks
			 *  @type {Ticks}
			 *  @private
			 */
	        this._loopStart = 0;
	        /** 
			 * 	The loop end position in ticks
			 *  @type {Ticks}
			 *  @private
			 */
	        this._loopEnd = 0;
	        ///////////////////////////////////////////////////////////////////////
	        //	CLOCK/TEMPO
	        //////////////////////////////////////////////////////////////////////
	        /**
			 *  Pulses per quarter is the number of ticks per quarter note.
			 *  @private
			 *  @type  {Number}
			 */
	        this._ppq = TransportConstructor.defaults.PPQ;
	        /**
			 *  watches the main oscillator for timing ticks
			 *  initially starts at 120bpm
			 *  @private
			 *  @type {Tone.Clock}
			 */
	        this._clock = new Tone.Clock({
	            'callback': this._processTick.bind(this),
	            'frequency': 0
	        });
	        /**
			 *  The Beats Per Minute of the Transport. 
			 *  @type {BPM}
			 *  @signal
			 *  @example
			 * Tone.Transport.bpm.value = 80;
			 * //ramp the bpm to 120 over 10 seconds
			 * Tone.Transport.bpm.rampTo(120, 10);
			 */
	        this.bpm = this._clock.frequency;
	        this.bpm._toUnits = this._toUnits.bind(this);
	        this.bpm._fromUnits = this._fromUnits.bind(this);
	        this.bpm.units = Tone.Type.BPM;
	        this.bpm.value = TransportConstructor.defaults.bpm;
	        this._readOnly('bpm');
	        /**
			 *  The time signature, or more accurately the numerator
			 *  of the time signature over a denominator of 4. 
			 *  @type {Number}
			 *  @private
			 */
	        this._timeSignature = TransportConstructor.defaults.timeSignature;
	        ///////////////////////////////////////////////////////////////////////
	        //	TIMELINE EVENTS
	        //////////////////////////////////////////////////////////////////////
	        /**
			 *  All the events in an object to keep track by ID
			 *  @type {Object}
			 *  @private
			 */
	        this._scheduledEvents = {};
	        /**
			 *  The event ID counter
			 *  @type {Number}
			 *  @private
			 */
	        this._eventID = 0;
	        /**
			 * 	The scheduled events.
			 *  @type {Tone.Timeline}
			 *  @private
			 */
	        this._timeline = new Tone.Timeline();
	        /**
			 *  Repeated events
			 *  @type {Array}
			 *  @private
			 */
	        this._repeatedEvents = new Tone.IntervalTimeline();
	        /**
			 *  Events that occur once
			 *  @type {Array}
			 *  @private
			 */
	        this._onceEvents = new Tone.Timeline();
	        /** 
			 *  All of the synced Signals
			 *  @private 
			 *  @type {Array}
			 */
	        this._syncedSignals = [];
	        ///////////////////////////////////////////////////////////////////////
	        //	SWING
	        //////////////////////////////////////////////////////////////////////
	        /**
			 *  The subdivision of the swing
			 *  @type  {Ticks}
			 *  @private
			 */
	        this._swingTicks = this.toTicks(TransportConstructor.defaults.swingSubdivision, TransportConstructor.defaults.bpm, TransportConstructor.defaults.timeSignature);
	        /**
			 *  The swing amount
			 *  @type {NormalRange}
			 *  @private
			 */
	        this._swingAmount = 0;
	    };
	    Tone.extend(Tone.Transport, Tone.EventEmitter);
	    /**
		 *  the defaults
		 *  @type {Object}
		 *  @const
		 *  @static
		 */
	    Tone.Transport.defaults = {
	        'bpm': 120,
	        'swing': 0,
	        'swingSubdivision': '16n',
	        'timeSignature': 4,
	        'loopStart': 0,
	        'loopEnd': '4m',
	        'PPQ': 48
	    };
	    ///////////////////////////////////////////////////////////////////////////////
	    //	TICKS
	    ///////////////////////////////////////////////////////////////////////////////
	    /**
		 *  called on every tick
		 *  @param   {number} tickTime clock relative tick time
		 *  @private
		 */
	    Tone.Transport.prototype._processTick = function (tickTime) {
	        //handle swing
	        if (this._swingAmount > 0 && this._clock.ticks % this._ppq !== 0 && //not on a downbeat
	            this._clock.ticks % this._swingTicks === 0) {
	            //add some swing
	            tickTime += this.ticksToSeconds(this._swingTicks) * this._swingAmount;
	        }
	        //do the loop test
	        if (this.loop) {
	            if (this._clock.ticks === this._loopEnd) {
	                this.ticks = this._loopStart;
	                this.trigger('loop', tickTime);
	            }
	        }
	        var ticks = this._clock.ticks;
	        //fire the next tick events if their time has come
	        this._timeline.forEachAtTime(ticks, function (event) {
	            event.callback(tickTime);
	        });
	        //process the repeated events
	        this._repeatedEvents.forEachOverlap(ticks, function (event) {
	            if ((ticks - event.time) % event.interval === 0) {
	                event.callback(tickTime);
	            }
	        });
	        //process the single occurrence events
	        this._onceEvents.forEachBefore(ticks, function (event) {
	            event.callback(tickTime);
	        });
	        //and clear the single occurrence timeline
	        this._onceEvents.cancelBefore(ticks);
	    };
	    ///////////////////////////////////////////////////////////////////////////////
	    //	SCHEDULABLE EVENTS
	    ///////////////////////////////////////////////////////////////////////////////
	    /**
		 *  Schedule an event along the timeline.
		 *  @param {TimelineEvent} event
		 *  @param {Time}   time 
		 *  @return {Number} The id of the event which can be used for canceling the event. 
		 *  @example
		 *  //trigger the callback when the Transport reaches the desired time
		 *  Tone.Transport.schedule(function(time){
		 *  	envelope.triggerAttack(time);
		 *  }, "128i");
		 */
	    Tone.Transport.prototype.schedule = function (callback, time) {
	        var event = {
	            'time': this.toTicks(time),
	            'callback': callback
	        };
	        var id = this._eventID++;
	        this._scheduledEvents[id.toString()] = {
	            'event': event,
	            'timeline': this._timeline
	        };
	        this._timeline.addEvent(event);
	        return id;
	    };
	    /**
		 *  Schedule a repeated event along the timeline.
		 *  @param  {Function}  callback   The callback to invoke.
		 *  @param  {Time}    interval   The duration between successive
		 *                               callbacks.
		 *  @param  {Time=}    startTime  When along the timeline the events should
		 *                               start being invoked.
		 *  @param {Time} [duration=Infinity] How long the event should repeat. 
		 *  @return  {Number}    The ID of the scheduled event. Use this to cancel
		 *                           the event. 
		 */
	    Tone.Transport.prototype.scheduleRepeat = function (callback, interval, startTime, duration) {
	        if (interval <= 0) {
	            throw new Error('repeat events must have an interval larger than 0');
	        }
	        var event = {
	            'time': this.toTicks(startTime),
	            'duration': this.toTicks(this.defaultArg(duration, Infinity)),
	            'interval': this.toTicks(interval),
	            'callback': callback
	        };
	        var id = this._eventID++;
	        this._scheduledEvents[id.toString()] = {
	            'event': event,
	            'timeline': this._repeatedEvents
	        };
	        this._repeatedEvents.addEvent(event);
	        return id;
	    };
	    /**
		 *  Schedule an event that will be removed after it is invoked. 
		 *  Note that if the given time is less than the current transport time, 
		 *  the event will be invoked immediately. 
		 *  @param {Function} callback The callback to invoke once.
		 *  @param {Time} time The time the callback should be invoked.
		 *  @returns {Number} The ID of the scheduled event. 
		 */
	    Tone.Transport.prototype.scheduleOnce = function (callback, time) {
	        var event = {
	            'time': this.toTicks(time),
	            'callback': callback
	        };
	        var id = this._eventID++;
	        this._scheduledEvents[id.toString()] = {
	            'event': event,
	            'timeline': this._onceEvents
	        };
	        this._onceEvents.addEvent(event);
	        return id;
	    };
	    /**
		 *  Clear the passed in event id from the timeline
		 *  @param {Number} eventId The id of the event.
		 *  @returns {Tone.Transport} this
		 */
	    Tone.Transport.prototype.clear = function (eventId) {
	        if (this._scheduledEvents.hasOwnProperty(eventId)) {
	            var item = this._scheduledEvents[eventId.toString()];
	            item.timeline.removeEvent(item.event);
	            delete this._scheduledEvents[eventId.toString()];
	        }
	        return this;
	    };
	    /**
		 *  Remove scheduled events from the timeline after
		 *  the given time. Repeated events will be removed
		 *  if their startTime is after the given time
		 *  @param {Time} [after=0] Clear all events after
		 *                          this time. 
		 *  @returns {Tone.Transport} this
		 */
	    Tone.Transport.prototype.cancel = function (after) {
	        after = this.defaultArg(after, 0);
	        after = this.toTicks(after);
	        this._timeline.cancel(after);
	        this._onceEvents.cancel(after);
	        this._repeatedEvents.cancel(after);
	        return this;
	    };
	    ///////////////////////////////////////////////////////////////////////////////
	    //	QUANTIZATION
	    ///////////////////////////////////////////////////////////////////////////////
	    /**
		 *  Returns the time of the next beat.
		 *  @param  {string} [subdivision="4n"]
		 *  @return {number} 	the time in seconds of the next subdivision
		 */
	    Tone.Transport.prototype.nextBeat = function (subdivision) {
	        subdivision = this.defaultArg(subdivision, '4n');
	        var tickNum = this.toTicks(subdivision);
	        var remainingTicks = transportTicks % tickNum;
	    };
	    ///////////////////////////////////////////////////////////////////////////////
	    //	START/STOP/PAUSE
	    ///////////////////////////////////////////////////////////////////////////////
	    /**
		 *  Returns the playback state of the source, either "started", "stopped", or "paused"
		 *  @type {String}
		 *  @readOnly
		 *  @memberOf Tone.State#
		 *  @name state
		 */
	    Object.defineProperty(Tone.Transport.prototype, 'state', {
	        get: function () {
	            return this._clock.getStateAtTime(this.now());
	        }
	    });
	    /**
		 *  Start the transport and all sources synced to the transport.
		 *  @param  {Time} [time=now] The time when the transport should start.
		 *  @param  {Time=} offset The timeline offset to start the transport.
		 *  @returns {Tone.Transport} this
		 *  @example
		 * //start the transport in one second starting at beginning of the 5th measure. 
		 * Tone.Transport.start("+1", "4:0:0");
		 */
	    Tone.Transport.prototype.start = function (time, offset) {
	        time = this.toSeconds(time);
	        if (!this.isUndef(offset)) {
	            offset = this.toTicks(offset);
	        } else {
	            offset = this.defaultArg(offset, this._clock.ticks);
	        }
	        //start the clock
	        this._clock.start(time, offset);
	        this.trigger('start', time, this.ticksToSeconds(offset));
	        return this;
	    };
	    /**
		 *  Stop the transport and all sources synced to the transport.
		 *  @param  {Time} [time=now] The time when the transport should stop. 
		 *  @returns {Tone.Transport} this
		 *  @example
		 * Tone.Transport.stop();
		 */
	    Tone.Transport.prototype.stop = function (time) {
	        time = this.toSeconds(time);
	        this._clock.stop(time);
	        this.trigger('stop', time);
	        return this;
	    };
	    /**
		 *  Pause the transport and all sources synced to the transport.
		 *  @param  {Time} [time=now]
		 *  @returns {Tone.Transport} this
		 */
	    Tone.Transport.prototype.pause = function (time) {
	        time = this.toSeconds(time);
	        this._clock.pause(time);
	        this.trigger('pause', time);
	        return this;
	    };
	    ///////////////////////////////////////////////////////////////////////////////
	    //	SETTERS/GETTERS
	    ///////////////////////////////////////////////////////////////////////////////
	    /**
		 *  The time signature as just the numerator over 4. 
		 *  For example 4/4 would be just 4 and 6/8 would be 3.
		 *  @memberOf Tone.Transport#
		 *  @type {number}
		 *  @name timeSignature
		 *  @example
		 * //common time
		 * Tone.Transport.timeSignature = 4;
		 * // 7/8
		 * Tone.Transport.timeSignature = 3.5;
		 */
	    Object.defineProperty(Tone.Transport.prototype, 'timeSignature', {
	        get: function () {
	            return this._timeSignature;
	        },
	        set: function (timeSig) {
	            if (Array.isArray(timeSig)) {
	                timeSig = timeSig[0] / timeSig[1] * 4;
	            }
	            this._timeSignature = timeSig;
	        }
	    });
	    /**
		 * When the Tone.Transport.loop = true, this is the starting position of the loop.
		 * @memberOf Tone.Transport#
		 * @type {Time}
		 * @name loopStart
		 */
	    Object.defineProperty(Tone.Transport.prototype, 'loopStart', {
	        get: function () {
	            return this.ticksToSeconds(this._loopStart);
	        },
	        set: function (startPosition) {
	            this._loopStart = this.toTicks(startPosition);
	        }
	    });
	    /**
		 * When the Tone.Transport.loop = true, this is the ending position of the loop.
		 * @memberOf Tone.Transport#
		 * @type {Time}
		 * @name loopEnd
		 */
	    Object.defineProperty(Tone.Transport.prototype, 'loopEnd', {
	        get: function () {
	            return this.ticksToSeconds(this._loopEnd);
	        },
	        set: function (endPosition) {
	            this._loopEnd = this.toTicks(endPosition);
	        }
	    });
	    /**
		 *  Set the loop start and stop at the same time. 
		 *  @param {Time} startPosition 
		 *  @param {Time} endPosition   
		 *  @returns {Tone.Transport} this
		 *  @example
		 * //loop over the first measure
		 * Tone.Transport.setLoopPoints(0, "1m");
		 * Tone.Transport.loop = true;
		 */
	    Tone.Transport.prototype.setLoopPoints = function (startPosition, endPosition) {
	        this.loopStart = startPosition;
	        this.loopEnd = endPosition;
	        return this;
	    };
	    /**
		 *  The swing value. Between 0-1 where 1 equal to 
		 *  the note + half the subdivision.
		 *  @memberOf Tone.Transport#
		 *  @type {NormalRange}
		 *  @name swing
		 */
	    Object.defineProperty(Tone.Transport.prototype, 'swing', {
	        get: function () {
	            return this._swingAmount * 2;
	        },
	        set: function (amount) {
	            //scale the values to a normal range
	            this._swingAmount = amount * 0.5;
	        }
	    });
	    /**
		 *  Set the subdivision which the swing will be applied to. 
		 *  The default values is a 16th note. Value must be less 
		 *  than a quarter note.
		 *  
		 *  @memberOf Tone.Transport#
		 *  @type {Time}
		 *  @name swingSubdivision
		 */
	    Object.defineProperty(Tone.Transport.prototype, 'swingSubdivision', {
	        get: function () {
	            return this.toNotation(this._swingTicks + 'i');
	        },
	        set: function (subdivision) {
	            this._swingTicks = this.toTicks(subdivision);
	        }
	    });
	    /**
		 *  The Transport's position in MEASURES:BEATS:SIXTEENTHS.
		 *  Setting the value will jump to that position right away. 
		 *  
		 *  @memberOf Tone.Transport#
		 *  @type {TransportTime}
		 *  @name position
		 */
	    Object.defineProperty(Tone.Transport.prototype, 'position', {
	        get: function () {
	            var quarters = this.ticks / this._ppq;
	            var measures = Math.floor(quarters / this._timeSignature);
	            var sixteenths = quarters % 1 * 4;
	            //if the sixteenths aren't a whole number, fix their length
	            if (sixteenths % 1 > 0) {
	                sixteenths = sixteenths.toFixed(3);
	            }
	            quarters = Math.floor(quarters) % this._timeSignature;
	            var progress = [
	                measures,
	                quarters,
	                sixteenths
	            ];
	            return progress.join(':');
	        },
	        set: function (progress) {
	            var ticks = this.toTicks(progress);
	            this.ticks = ticks;
	        }
	    });
	    /**
		 *  The Transport's loop position as a normalized value. 
		 *  @memberOf Tone.Transport#
		 *  @name progress
		 */
	    Object.defineProperty(Tone.Transport.prototype, 'progress', {
	        get: function () {
	            if (this.loop) {
	                return (this.ticks - this._loopStart) / (this._loopEnd - this._loopStart);
	            } else {
	                return 0;
	            }
	        }
	    });
	    /**
		 *  The transports current tick position.
		 *  
		 *  @memberOf Tone.Transport#
		 *  @type {Ticks}
		 *  @name ticks
		 */
	    Object.defineProperty(Tone.Transport.prototype, 'ticks', {
	        get: function () {
	            return this._clock.ticks;
	        },
	        set: function (t) {
	            this._clock.ticks = t;
	        }
	    });
	    /**
		 *  Pulses Per Quarter note. This is the smallest resolution
		 *  the Transport timing supports. This should be set once
		 *  on initialization and not set again. Changing this value 
		 *  after other objects have been created can cause problems. 
		 *  
		 *  @memberOf Tone.Transport#
		 *  @type {Number}
		 *  @name PPQ
		 */
	    Object.defineProperty(Tone.Transport.prototype, 'PPQ', {
	        get: function () {
	            return this._ppq;
	        },
	        set: function (ppq) {
	            this._ppq = ppq;
	            this.bpm.value = this.bpm.value;
	        }
	    });
	    /**
		 *  Convert from BPM to frequency (factoring in PPQ)
		 *  @param  {BPM}  bpm The BPM value to convert to frequency
		 *  @return  {Frequency}  The BPM as a frequency with PPQ factored in.
		 *  @private
		 */
	    Tone.Transport.prototype._fromUnits = function (bpm) {
	        return 1 / (60 / bpm / this.PPQ);
	    };
	    /**
		 *  Convert from frequency (with PPQ) into BPM
		 *  @param  {Frequency}  freq The clocks frequency to convert to BPM
		 *  @return  {BPM}  The frequency value as BPM.
		 *  @private
		 */
	    Tone.Transport.prototype._toUnits = function (freq) {
	        return freq / this.PPQ * 60;
	    };
	    ///////////////////////////////////////////////////////////////////////////////
	    //	SYNCING
	    ///////////////////////////////////////////////////////////////////////////////
	    /**
		 *  Attaches the signal to the tempo control signal so that 
		 *  any changes in the tempo will change the signal in the same
		 *  ratio. 
		 *  
		 *  @param  {Tone.Signal} signal 
		 *  @param {number=} ratio Optionally pass in the ratio between
		 *                         the two signals. Otherwise it will be computed
		 *                         based on their current values. 
		 *  @returns {Tone.Transport} this
		 */
	    Tone.Transport.prototype.syncSignal = function (signal, ratio) {
	        if (!ratio) {
	            //get the sync ratio
	            if (signal._value.value !== 0) {
	                ratio = signal._value.value / this.bpm._value.value;
	            } else {
	                ratio = 0;
	            }
	        }
	        var ratioSignal = new Tone.Gain(ratio);
	        this.bpm.chain(ratioSignal, signal._value);
	        this._syncedSignals.push({
	            'ratio': ratioSignal,
	            'signal': signal,
	            'initial': signal._value.value
	        });
	        signal._value.value = 0;
	        return this;
	    };
	    /**
		 *  Unsyncs a previously synced signal from the transport's control. 
		 *  See Tone.Transport.syncSignal.
		 *  @param  {Tone.Signal} signal 
		 *  @returns {Tone.Transport} this
		 */
	    Tone.Transport.prototype.unsyncSignal = function (signal) {
	        for (var i = this._syncedSignals.length - 1; i >= 0; i--) {
	            var syncedSignal = this._syncedSignals[i];
	            if (syncedSignal.signal === signal) {
	                syncedSignal.ratio.dispose();
	                syncedSignal.signal._value.value = syncedSignal.initial;
	                this._syncedSignals.splice(i, 1);
	            }
	        }
	        return this;
	    };
	    /**
		 *  Clean up. 
		 *  @returns {Tone.Transport} this
		 *  @private
		 */
	    Tone.Transport.prototype.dispose = function () {
	        Tone.EventEmitter.prototype.dispose.call(this);
	        this._clock.dispose();
	        this._clock = null;
	        this._writable('bpm');
	        this.bpm = null;
	        this._timeline.dispose();
	        this._timeline = null;
	        this._onceEvents.dispose();
	        this._onceEvents = null;
	        this._repeatedEvents.dispose();
	        this._repeatedEvents = null;
	        return this;
	    };
	    ///////////////////////////////////////////////////////////////////////////////
	    //	DEPRECATED FUNCTIONS
	    //	(will be removed in r7)
	    ///////////////////////////////////////////////////////////////////////////////
	    /**
		 *  @deprecated Use Tone.scheduleRepeat instead.
		 *  Set a callback for a recurring event.
		 *  @param {function} callback
		 *  @param {Time}   interval 
		 *  @return {number} the id of the interval
		 *  @example
		 *  //triggers a callback every 8th note with the exact time of the event
		 *  Tone.Transport.setInterval(function(time){
		 *  	envelope.triggerAttack(time);
		 *  }, "8n");
		 */
	    Tone.Transport.prototype.setInterval = function (callback, interval) {
	        console.warn('This method is deprecated. Use Tone.Transport.scheduleRepeat instead.');
	        return Tone.Transport.scheduleRepeat(callback, interval);
	    };
	    /**
		 *  @deprecated Use Tone.cancel instead.
		 *  Stop and ongoing interval.
		 *  @param  {number} intervalID  The ID of interval to remove. The interval
		 *                               ID is given as the return value in Tone.Transport.setInterval.
		 *  @return {boolean}            	true if the event was removed
		 */
	    Tone.Transport.prototype.clearInterval = function (id) {
	        console.warn('This method is deprecated. Use Tone.Transport.clear instead.');
	        return Tone.Transport.clear(id);
	    };
	    /**
		 *  @deprecated Use Tone.Note instead.
		 *  Set a timeout to occur after time from now. NB: the transport must be 
		 *  running for this to be triggered. All timeout events are cleared when the 
		 *  transport is stopped. 
		 *
		 *  @param {function} callback 
		 *  @param {Time}   time    The time (from now) that the callback will be invoked.
		 *  @return {number} The id of the timeout.
		 *  @example
		 *  //trigger an event to happen 1 second from now
		 *  Tone.Transport.setTimeout(function(time){
		 *  	player.start(time);
		 *  }, 1)
		 */
	    Tone.Transport.prototype.setTimeout = function (callback, timeout) {
	        console.warn('This method is deprecated. Use Tone.Transport.scheduleOnce instead.');
	        return Tone.Transport.scheduleOnce(callback, timeout);
	    };
	    /**
		 *  @deprecated Use Tone.Note instead.
		 *  Clear a timeout using it's ID.
		 *  @param  {number} intervalID  The ID of timeout to remove. The timeout
		 *                               ID is given as the return value in Tone.Transport.setTimeout.
		 *  @return {boolean}           true if the timeout was removed
		 */
	    Tone.Transport.prototype.clearTimeout = function (id) {
	        console.warn('This method is deprecated. Use Tone.Transport.clear instead.');
	        return Tone.Transport.clear(id);
	    };
	    /**
		 *  @deprecated Use Tone.Note instead.
		 *  Timeline events are synced to the timeline of the Tone.Transport.
		 *  Unlike Timeout, Timeline events will restart after the 
		 *  Tone.Transport has been stopped and restarted. 
		 *
		 *  @param {function} 	callback 	
		 *  @param {Time}  time  
		 *  @return {number} 				the id for clearing the transportTimeline event
		 *  @example
		 *  //trigger the start of a part on the 16th measure
		 *  Tone.Transport.setTimeline(function(time){
		 *  	part.start(time);
		 *  }, "16m");
		 */
	    Tone.Transport.prototype.setTimeline = function (callback, time) {
	        console.warn('This method is deprecated. Use Tone.Transport.schedule instead.');
	        return Tone.Transport.schedule(callback, time);
	    };
	    /**
		 *  @deprecated Use Tone.Note instead.
		 *  Clear the timeline event.
		 *  @param  {number} id 
		 *  @return {boolean} true if it was removed
		 */
	    Tone.Transport.prototype.clearTimeline = function (id) {
	        console.warn('This method is deprecated. Use Tone.Transport.clear instead.');
	        return Tone.Transport.clear(id);
	    };
	    ///////////////////////////////////////////////////////////////////////////////
	    //	INITIALIZATION
	    ///////////////////////////////////////////////////////////////////////////////
	    var TransportConstructor = Tone.Transport;
	    Tone._initAudioContext(function () {
	        if (typeof Tone.Transport === 'function') {
	            //a single transport object
	            Tone.Transport = new Tone.Transport();
	        } else {
	            //stop the clock
	            Tone.Transport.stop();
	            //get the previous values
	            var prevSettings = Tone.Transport.get();
	            //destory the old transport
	            Tone.Transport.dispose();
	            //make new Transport insides
	            TransportConstructor.call(Tone.Transport);
	            //set the previous config
	            Tone.Transport.set(prevSettings);
	        }
	    });
	    return Tone.Transport;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.Volume is a simple volume node, useful for creating a volume fader. 
		 *
		 *  @extends {Tone}
		 *  @constructor
		 *  @param {Decibels} [volume=0] the initial volume
		 *  @example
		 * var vol = new Tone.Volume(-12);
		 * instrument.chain(vol, Tone.Master);
		 */
	    Tone.Volume = function () {
	        var options = this.optionsObject(arguments, ['volume'], Tone.Volume.defaults);
	        /**
			 * the output node
			 * @type {GainNode}
			 * @private
			 */
	        this.output = this.input = new Tone.Gain();
	        /**
			 *  The volume control in decibels. 
			 *  @type {Decibels}
			 *  @signal
			 */
	        this.volume = new Tone.Signal({
	            'param': this.output.gain,
	            'value': options.volume,
	            'units': Tone.Type.Decibels
	        });
	        this._readOnly('volume');
	    };
	    Tone.extend(Tone.Volume);
	    /**
		 *  Defaults
		 *  @type  {Object}
		 *  @const
		 *  @static
		 */
	    Tone.Volume.defaults = { 'volume': 0 };
	    /**
		 *  clean up
		 *  @returns {Tone.Volume} this
		 */
	    Tone.Volume.prototype.dispose = function () {
	        this.input.dispose();
	        Tone.prototype.dispose.call(this);
	        this._writable('volume');
	        this.volume.dispose();
	        this.volume = null;
	        return this;
	    };
	    return Tone.Volume;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Base class for sources. Sources have start/stop methods
		 *          and the ability to be synced to the 
		 *          start/stop of Tone.Transport. 
		 *
		 *  @constructor
		 *  @extends {Tone}
		 *  @example
		 * //Multiple state change events can be chained together,
		 * //but must be set in the correct order and with ascending times
		 * 
		 * // OK
		 * state.start().stop("+0.2");
		 * // AND
		 * state.start().stop("+0.2").start("+0.4").stop("+0.7")
		 *
		 * // BAD
		 * state.stop("+0.2").start();
		 * // OR
		 * state.start("+0.3").stop("+0.2");
		 * 
		 */
	    Tone.Source = function (options) {
	        //Sources only have an output and no input
	        Tone.call(this);
	        options = this.defaultArg(options, Tone.Source.defaults);
	        /**
			 *  The volume node. 
			 *  @type  {Tone.Volume}
			 *  @private
			 */
	        this._volume = this.output = new Tone.Volume(options.volume);
	        /**
			 * The volume of the output in decibels.
			 * @type {Decibels}
			 * @signal
			 * @example
			 * source.volume.value = -6;
			 */
	        this.volume = this._volume.volume;
	        this._readOnly('volume');
	        /**
			 * 	Keep track of the scheduled state.
			 *  @type {Tone.TimelineState}
			 *  @private
			 */
	        this._state = new Tone.TimelineState(Tone.State.Stopped);
	        /**
			 *  The synced `start` callback function from the transport
			 *  @type {Function}
			 *  @private
			 */
	        this._syncStart = function (time, offset) {
	            time = this.toSeconds(time);
	            time += this.toSeconds(this._startDelay);
	            this.start(time, offset);
	        }.bind(this);
	        /**
			 *  The synced `stop` callback function from the transport
			 *  @type {Function}
			 *  @private
			 */
	        this._syncStop = this.stop.bind(this);
	        /**
			 *  The offset from the start of the Transport `start`
			 *  @type {Time}
			 *  @private
			 */
	        this._startDelay = 0;
	        //make the output explicitly stereo
	        this.output.channelCount = 2;
	        this.output.channelCountMode = 'explicit';
	    };
	    Tone.extend(Tone.Source);
	    /**
		 *  The default parameters
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
	    Tone.Source.defaults = { 'volume': 0 };
	    /**
		 *  Returns the playback state of the source, either "started" or "stopped".
		 *  @type {Tone.State}
		 *  @readOnly
		 *  @memberOf Tone.Source#
		 *  @name state
		 */
	    Object.defineProperty(Tone.Source.prototype, 'state', {
	        get: function () {
	            return this._state.getStateAtTime(this.now());
	        }
	    });
	    /**
		 *  Start the source at the specified time. If no time is given, 
		 *  start the source now.
		 *  @param  {Time} [time=now] When the source should be started.
		 *  @returns {Tone.Source} this
		 *  @example
		 * source.start("+0.5"); //starts the source 0.5 seconds from now
		 */
	    Tone.Source.prototype.start = function (time) {
	        time = this.toSeconds(time);
	        if (this._state.getStateAtTime(time) !== Tone.State.Started || this.retrigger) {
	            this._state.setStateAtTime(Tone.State.Started, time);
	            if (this._start) {
	                this._start.apply(this, arguments);
	            }
	        }
	        return this;
	    };
	    /**
		 *  Stop the source at the specified time. If no time is given, 
		 *  stop the source now.
		 *  @param  {Time} [time=now] When the source should be stopped. 
		 *  @returns {Tone.Source} this
		 *  @example
		 * source.stop(); // stops the source immediately
		 */
	    Tone.Source.prototype.stop = function (time) {
	        time = this.toSeconds(time);
	        if (this._state.getStateAtTime(time) === Tone.State.Started) {
	            this._state.setStateAtTime(Tone.State.Stopped, time);
	            if (this._stop) {
	                this._stop.apply(this, arguments);
	            }
	        }
	        return this;
	    };
	    /**
		 *  Sync the source to the Transport so that when the transport
		 *  is started, this source is started and when the transport is stopped
		 *  or paused, so is the source. 
		 *
		 *  @param {Time} [delay=0] Delay time before starting the source after the
		 *                               Transport has started. 
		 *  @returns {Tone.Source} this
		 *  @example
		 * //sync the source to start 1 measure after the transport starts
		 * source.sync("1m");
		 * //start the transport. the source will start 1 measure later. 
		 * Tone.Transport.start();
		 */
	    Tone.Source.prototype.sync = function (delay) {
	        this._startDelay = this.defaultArg(delay, 0);
	        Tone.Transport.on('start', this._syncStart);
	        Tone.Transport.on('stop pause', this._syncStop);
	        return this;
	    };
	    /**
		 *  Unsync the source to the Transport. See Tone.Source.sync
		 *  @returns {Tone.Source} this
		 */
	    Tone.Source.prototype.unsync = function () {
	        this._startDelay = 0;
	        Tone.Transport.off('start', this._syncStart);
	        Tone.Transport.off('stop pause', this._syncStop);
	        return this;
	    };
	    /**
		 *	Clean up.
		 *  @return {Tone.Source} this
		 */
	    Tone.Source.prototype.dispose = function () {
	        this.stop();
	        Tone.prototype.dispose.call(this);
	        this.unsync();
	        this._volume.dispose();
	        this._volume = null;
	        this._writable('volume');
	        this.volume = null;
	        this._state.dispose();
	        this._state = null;
	        this._syncStart = null;
	        this._syncStart = null;
	    };
	    return Tone.Source;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.Oscillator supports a number of features including
		 *         phase rotation, multiple oscillator types (see Tone.Oscillator.type), 
		 *         and Transport syncing (see Tone.Oscillator.syncFrequency).
		 *
		 *  @constructor
		 *  @extends {Tone.Source}
		 *  @param {Frequency} [frequency] Starting frequency
		 *  @param {string} [type] The oscillator type. Read more about type below.
		 *  @example
		 * //make and start a 440hz sine tone
		 * var osc = new Tone.Oscillator(440, "sine").toMaster().start();
		 */
	    Tone.Oscillator = function () {
	        var options = this.optionsObject(arguments, [
	            'frequency',
	            'type'
	        ], Tone.Oscillator.defaults);
	        Tone.Source.call(this, options);
	        /**
			 *  the main oscillator
			 *  @type {OscillatorNode}
			 *  @private
			 */
	        this._oscillator = null;
	        /**
			 *  The frequency control.
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.frequency = new Tone.Signal(options.frequency, Tone.Type.Frequency);
	        /**
			 *  The detune control signal.
			 *  @type {Cents}
			 *  @signal
			 */
	        this.detune = new Tone.Signal(options.detune, Tone.Type.Cents);
	        /**
			 *  the periodic wave
			 *  @type {PeriodicWave}
			 *  @private
			 */
	        this._wave = null;
	        /**
			 *  The partials of the oscillator
			 *  @type {Array}
			 *  @private
			 */
	        this._partials = this.defaultArg(options.partials, [1]);
	        /**
			 *  the phase of the oscillator
			 *  between 0 - 360
			 *  @type {number}
			 *  @private
			 */
	        this._phase = options.phase;
	        /**
			 *  the type of the oscillator
			 *  @type {string}
			 *  @private
			 */
	        this._type = null;
	        //setup
	        this.type = options.type;
	        this.phase = this._phase;
	        this._readOnly([
	            'frequency',
	            'detune'
	        ]);
	    };
	    Tone.extend(Tone.Oscillator, Tone.Source);
	    /**
		 *  the default parameters
		 *  @type {Object}
		 */
	    Tone.Oscillator.defaults = {
	        'type': 'sine',
	        'frequency': 440,
	        'detune': 0,
	        'phase': 0
	    };
	    /**
		 *  The Oscillator types
		 *  @enum {String}
		 */
	    Tone.Oscillator.Type = {
	        Sine: 'sine',
	        Triangle: 'triangle',
	        Sawtooth: 'sawtooth',
	        Square: 'square',
	        Custom: 'custom'
	    };
	    /**
		 *  start the oscillator
		 *  @param  {Time} [time=now] 
		 *  @private
		 */
	    Tone.Oscillator.prototype._start = function (time) {
	        //new oscillator with previous values
	        this._oscillator = this.context.createOscillator();
	        this._oscillator.setPeriodicWave(this._wave);
	        //connect the control signal to the oscillator frequency & detune
	        this._oscillator.connect(this.output);
	        this.frequency.connect(this._oscillator.frequency);
	        this.detune.connect(this._oscillator.detune);
	        //start the oscillator
	        this._oscillator.start(this.toSeconds(time));
	    };
	    /**
		 *  stop the oscillator
		 *  @private
		 *  @param  {Time} [time=now] (optional) timing parameter
		 *  @returns {Tone.Oscillator} this
		 */
	    Tone.Oscillator.prototype._stop = function (time) {
	        if (this._oscillator) {
	            this._oscillator.stop(this.toSeconds(time));
	            this._oscillator = null;
	        }
	        return this;
	    };
	    /**
		 *  Sync the signal to the Transport's bpm. Any changes to the transports bpm,
		 *  will also affect the oscillators frequency. 
		 *  @returns {Tone.Oscillator} this
		 *  @example
		 * Tone.Transport.bpm.value = 120;
		 * osc.frequency.value = 440;
		 * //the ration between the bpm and the frequency will be maintained
		 * osc.syncFrequency();
		 * Tone.Transport.bpm.value = 240; 
		 * // the frequency of the oscillator is doubled to 880
		 */
	    Tone.Oscillator.prototype.syncFrequency = function () {
	        Tone.Transport.syncSignal(this.frequency);
	        return this;
	    };
	    /**
		 *  Unsync the oscillator's frequency from the Transport. 
		 *  See Tone.Oscillator.syncFrequency
		 *  @returns {Tone.Oscillator} this
		 */
	    Tone.Oscillator.prototype.unsyncFrequency = function () {
	        Tone.Transport.unsyncSignal(this.frequency);
	        return this;
	    };
	    /**
		 * The type of the oscillator: either sine, square, triangle, or sawtooth. Also capable of
		 * setting the first x number of partials of the oscillator. For example: "sine4" would
		 * set be the first 4 partials of the sine wave and "triangle8" would set the first
		 * 8 partials of the triangle wave.
		 * <br><br> 
		 * Uses PeriodicWave internally even for native types so that it can set the phase. 
		 * PeriodicWave equations are from the 
		 * [Webkit Web Audio implementation](https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/modules/webaudio/PeriodicWave.cpp&sq=package:chromium).
		 *  
		 * @memberOf Tone.Oscillator#
		 * @type {string}
		 * @name type
		 * @example
		 * //set it to a square wave
		 * osc.type = "square";
		 * @example
		 * //set the first 6 partials of a sawtooth wave
		 * osc.type = "sawtooth6";
		 */
	    Object.defineProperty(Tone.Oscillator.prototype, 'type', {
	        get: function () {
	            return this._type;
	        },
	        set: function (type) {
	            var coefs = this._getRealImaginary(type, this._phase);
	            var periodicWave = this.context.createPeriodicWave(coefs[0], coefs[1]);
	            this._wave = periodicWave;
	            if (this._oscillator !== null) {
	                this._oscillator.setPeriodicWave(this._wave);
	            }
	            this._type = type;
	        }
	    });
	    /**
		 *  Returns the real and imaginary components based 
		 *  on the oscillator type.
		 *  @returns {Array} [real, imaginary]
		 *  @private
		 */
	    Tone.Oscillator.prototype._getRealImaginary = function (type, phase) {
	        var fftSize = 4096;
	        var periodicWaveSize = fftSize / 2;
	        var real = new Float32Array(periodicWaveSize);
	        var imag = new Float32Array(periodicWaveSize);
	        var partialCount = 1;
	        if (type === Tone.Oscillator.Type.Custom) {
	            partialCount = this._partials.length + 1;
	            periodicWaveSize = partialCount;
	        } else {
	            var partial = /^(sine|triangle|square|sawtooth)(\d+)$/.exec(type);
	            if (partial) {
	                partialCount = parseInt(partial[2]) + 1;
	                type = partial[1];
	                partialCount = Math.max(partialCount, 2);
	                periodicWaveSize = partialCount;
	            }
	        }
	        for (var n = 1; n < periodicWaveSize; ++n) {
	            var piFactor = 2 / (n * Math.PI);
	            var b;
	            switch (type) {
	            case Tone.Oscillator.Type.Sine:
	                b = n <= partialCount ? 1 : 0;
	                break;
	            case Tone.Oscillator.Type.Square:
	                b = n & 1 ? 2 * piFactor : 0;
	                break;
	            case Tone.Oscillator.Type.Sawtooth:
	                b = piFactor * (n & 1 ? 1 : -1);
	                break;
	            case Tone.Oscillator.Type.Triangle:
	                if (n & 1) {
	                    b = 2 * (piFactor * piFactor) * (n - 1 >> 1 & 1 ? -1 : 1);
	                } else {
	                    b = 0;
	                }
	                break;
	            case Tone.Oscillator.Type.Custom:
	                b = this._partials[n - 1];
	                break;
	            default:
	                throw new Error('invalid oscillator type: ' + type);
	            }
	            if (b !== 0) {
	                real[n] = -b * Math.sin(phase * n);
	                imag[n] = b * Math.cos(phase * n);
	            } else {
	                real[n] = 0;
	                imag[n] = 0;
	            }
	        }
	        return [
	            real,
	            imag
	        ];
	    };
	    /**
		 *  Compute the inverse FFT for a given phase.	
		 *  @param  {Float32Array}  real
		 *  @param  {Float32Array}  imag 
		 *  @param  {NormalRange}  phase 
		 *  @return  {AudioRange}
		 *  @private
		 */
	    Tone.Oscillator.prototype._inverseFFT = function (real, imag, phase) {
	        var sum = 0;
	        var len = real.length;
	        for (var i = 0; i < len; i++) {
	            sum += real[i] * Math.cos(i * phase) + imag[i] * Math.sin(i * phase);
	        }
	        return sum;
	    };
	    /**
		 *  Returns the initial value of the oscillator.
		 *  @return  {AudioRange}
		 *  @private
		 */
	    Tone.Oscillator.prototype._getInitialValue = function () {
	        var coefs = this._getRealImaginary(this._type, 0);
	        var real = coefs[0];
	        var imag = coefs[1];
	        var maxValue = 0;
	        var twoPi = Math.PI * 2;
	        //check for peaks in 8 places
	        for (var i = 0; i < 8; i++) {
	            maxValue = Math.max(this._inverseFFT(real, imag, i / 8 * twoPi), maxValue);
	        }
	        return -this._inverseFFT(real, imag, this._phase) / maxValue;
	    };
	    /**
		 * The partials of the waveform. A partial represents 
		 * the amplitude at a harmonic. The first harmonic is the 
		 * fundamental frequency, the second is the octave and so on
		 * following the harmonic series. 
		 * Setting this value will automatically set the type to "custom". 
		 * The value is an empty array when the type is not "custom". 
		 * @memberOf Tone.Oscillator#
		 * @type {Array}
		 * @name partials
		 * @example
		 * osc.partials = [1, 0.2, 0.01];
		 */
	    Object.defineProperty(Tone.Oscillator.prototype, 'partials', {
	        get: function () {
	            if (this._type !== Tone.Oscillator.Type.Custom) {
	                return [];
	            } else {
	                return this._partials;
	            }
	        },
	        set: function (partials) {
	            this._partials = partials;
	            this.type = Tone.Oscillator.Type.Custom;
	        }
	    });
	    /**
		 * The phase of the oscillator in degrees. 
		 * @memberOf Tone.Oscillator#
		 * @type {Degrees}
		 * @name phase
		 * @example
		 * osc.phase = 180; //flips the phase of the oscillator
		 */
	    Object.defineProperty(Tone.Oscillator.prototype, 'phase', {
	        get: function () {
	            return this._phase * (180 / Math.PI);
	        },
	        set: function (phase) {
	            this._phase = phase * Math.PI / 180;
	            //reset the type
	            this.type = this._type;
	        }
	    });
	    /**
		 *  Dispose and disconnect.
		 *  @return {Tone.Oscillator} this
		 */
	    Tone.Oscillator.prototype.dispose = function () {
	        Tone.Source.prototype.dispose.call(this);
	        if (this._oscillator !== null) {
	            this._oscillator.disconnect();
	            this._oscillator = null;
	        }
	        this._wave = null;
	        this._writable([
	            'frequency',
	            'detune'
	        ]);
	        this.frequency.dispose();
	        this.frequency = null;
	        this.detune.dispose();
	        this.detune = null;
	        this._partials = null;
	        return this;
	    };
	    return Tone.Oscillator;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  LFO stands for low frequency oscillator. Tone.LFO produces an output signal 
		 *          which can be attached to an AudioParam or Tone.Signal 
		 *          in order to modulate that parameter with an oscillator. The LFO can 
		 *          also be synced to the transport to start/stop and change when the tempo changes.
		 *
		 *  @constructor
		 *  @extends {Tone.Oscillator}
		 *  @param {Frequency|Object} [frequency] The frequency of the oscillation. Typically, LFOs will be
		 *                               in the frequency range of 0.1 to 10 hertz. 
		 *  @param {number=} min The minimum output value of the LFO. 
		 *  @param {number=} max The maximum value of the LFO. 
		 *  @example
		 * var lfo = new Tone.LFO("4n", 400, 4000);
		 * lfo.connect(filter.frequency);
		 */
	    Tone.LFO = function () {
	        var options = this.optionsObject(arguments, [
	            'frequency',
	            'min',
	            'max'
	        ], Tone.LFO.defaults);
	        /** 
			 *  The oscillator. 
			 *  @type {Tone.Oscillator}
			 *  @private
			 */
	        this._oscillator = new Tone.Oscillator({
	            'frequency': options.frequency,
	            'type': options.type
	        });
	        /**
			 *  the lfo's frequency
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.frequency = this._oscillator.frequency;
	        /**
			 * The amplitude of the LFO, which controls the output range between
			 * the min and max output. For example if the min is -10 and the max 
			 * is 10, setting the amplitude to 0.5 would make the LFO modulate
			 * between -5 and 5. 
			 * @type {Number}
			 * @signal
			 */
	        this.amplitude = this._oscillator.volume;
	        this.amplitude.units = Tone.Type.NormalRange;
	        this.amplitude.value = options.amplitude;
	        /**
			 *  The signal which is output when the LFO is stopped
			 *  @type  {Tone.Signal}
			 *  @private
			 */
	        this._stoppedSignal = new Tone.Signal(0, Tone.Type.AudioRange);
	        /**
			 *  The value that the LFO outputs when it's stopped
			 *  @type {AudioRange}
			 *  @private
			 */
	        this._stoppedValue = 0;
	        /**
			 *  @type {Tone.AudioToGain} 
			 *  @private
			 */
	        this._a2g = new Tone.AudioToGain();
	        /**
			 *  @type {Tone.Scale} 
			 *  @private
			 */
	        this._scaler = this.output = new Tone.Scale(options.min, options.max);
	        /**
			 *  the units of the LFO (used for converting)
			 *  @type {string} 
			 *  @private
			 */
	        this._units = Tone.Type.Default;
	        //connect it up
	        this._oscillator.chain(this._a2g, this._scaler);
	        this._stoppedSignal.connect(this._a2g);
	        this._readOnly([
	            'amplitude',
	            'frequency'
	        ]);
	        this.phase = options.phase;
	    };
	    Tone.extend(Tone.LFO, Tone.Oscillator);
	    /**
		 *  the default parameters
		 *
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
	    Tone.LFO.defaults = {
	        'type': 'sine',
	        'min': 0,
	        'max': 1,
	        'phase': 0,
	        'frequency': '4n',
	        'amplitude': 1
	    };
	    /**
		 *  Start the LFO. 
		 *  @param  {Time} [time=now] the time the LFO will start
		 *  @returns {Tone.LFO} this
		 */
	    Tone.LFO.prototype.start = function (time) {
	        time = this.toSeconds(time);
	        this._stoppedSignal.setValueAtTime(0, time);
	        this._oscillator.start(time);
	        return this;
	    };
	    /**
		 *  Stop the LFO. 
		 *  @param  {Time} [time=now] the time the LFO will stop
		 *  @returns {Tone.LFO} this
		 */
	    Tone.LFO.prototype.stop = function (time) {
	        time = this.toSeconds(time);
	        this._stoppedSignal.setValueAtTime(this._stoppedValue, time);
	        this._oscillator.stop(time);
	        return this;
	    };
	    /**
		 *  Sync the start/stop/pause to the transport 
		 *  and the frequency to the bpm of the transport
		 *
		 *  @param {Time} [delay=0] the time to delay the start of the
		 *                                LFO from the start of the transport
		 *  @returns {Tone.LFO} this
		 *  @example
		 *  lfo.frequency.value = "8n";
		 *  lfo.sync();
		 *  //the rate of the LFO will always be an eighth note, 
		 *  //even as the tempo changes
		 */
	    Tone.LFO.prototype.sync = function (delay) {
	        this._oscillator.sync(delay);
	        this._oscillator.syncFrequency();
	        return this;
	    };
	    /**
		 *  unsync the LFO from transport control
		 *  @returns {Tone.LFO} this
		 */
	    Tone.LFO.prototype.unsync = function () {
	        this._oscillator.unsync();
	        this._oscillator.unsyncFrequency();
	        return this;
	    };
	    /**
		 * The miniumum output of the LFO.
		 * @memberOf Tone.LFO#
		 * @type {number}
		 * @name min
		 */
	    Object.defineProperty(Tone.LFO.prototype, 'min', {
	        get: function () {
	            return this._toUnits(this._scaler.min);
	        },
	        set: function (min) {
	            min = this._fromUnits(min);
	            this._scaler.min = min;
	        }
	    });
	    /**
		 * The maximum output of the LFO.
		 * @memberOf Tone.LFO#
		 * @type {number}
		 * @name max
		 */
	    Object.defineProperty(Tone.LFO.prototype, 'max', {
	        get: function () {
	            return this._toUnits(this._scaler.max);
	        },
	        set: function (max) {
	            max = this._fromUnits(max);
	            this._scaler.max = max;
	        }
	    });
	    /**
		 * The type of the oscillator: sine, square, sawtooth, triangle. 
		 * @memberOf Tone.LFO#
		 * @type {string}
		 * @name type
		 */
	    Object.defineProperty(Tone.LFO.prototype, 'type', {
	        get: function () {
	            return this._oscillator.type;
	        },
	        set: function (type) {
	            this._oscillator.type = type;
	            this._stoppedValue = this._oscillator._getInitialValue();
	            this._stoppedSignal.value = this._stoppedValue;
	        }
	    });
	    /**
		 * The phase of the LFO.
		 * @memberOf Tone.LFO#
		 * @type {number}
		 * @name phase
		 */
	    Object.defineProperty(Tone.LFO.prototype, 'phase', {
	        get: function () {
	            return this._oscillator.phase;
	        },
	        set: function (phase) {
	            this._oscillator.phase = phase;
	            this._stoppedValue = this._oscillator._getInitialValue();
	            this._stoppedSignal.value = this._stoppedValue;
	        }
	    });
	    /**
		 * The output units of the LFO.
		 * @memberOf Tone.LFO#
		 * @type {Tone.Type}
		 * @name units
		 */
	    Object.defineProperty(Tone.LFO.prototype, 'units', {
	        get: function () {
	            return this._units;
	        },
	        set: function (val) {
	            var currentMin = this.min;
	            var currentMax = this.max;
	            //convert the min and the max
	            this._units = val;
	            this.min = currentMin;
	            this.max = currentMax;
	        }
	    });
	    /**
		 *  Connect the output of a ToneNode to an AudioParam, AudioNode, or Tone Node. 
		 *  will get the units from the connected node.
		 *  @param  {Tone | AudioParam | AudioNode} node 
		 *  @param {number} [outputNum=0] optionally which output to connect from
		 *  @param {number} [inputNum=0] optionally which input to connect to
		 *  @returns {Tone.LFO} this
		 *  @private
		 */
	    Tone.LFO.prototype.connect = function (node) {
	        if (node.constructor === Tone.Signal) {
	            this.convert = node.convert;
	            this.units = node.units;
	        }
	        Tone.Signal.prototype.connect.apply(this, arguments);
	        return this;
	    };
	    /**
		 *  private method borroed from Signal converts 
		 *  units from their destination value
		 *  @function
		 *  @private
		 */
	    Tone.LFO.prototype._fromUnits = Tone.Signal.prototype._fromUnits;
	    /**
		 *  private method borroed from Signal converts 
		 *  units to their destination value
		 *  @function
		 *  @private
		 */
	    Tone.LFO.prototype._toUnits = Tone.Signal.prototype._toUnits;
	    /**
		 *  disconnect and dispose
		 *  @returns {Tone.LFO} this
		 */
	    Tone.LFO.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._writable([
	            'amplitude',
	            'frequency'
	        ]);
	        this._oscillator.dispose();
	        this._oscillator = null;
	        this._stoppedSignal.dispose();
	        this._stoppedSignal = null;
	        this._scaler.dispose();
	        this._scaler = null;
	        this._a2g.dispose();
	        this._a2g = null;
	        this.frequency = null;
	        this.amplitude = null;
	        return this;
	    };
	    return Tone.LFO;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.Limiter will limit the loudness of an incoming signal. 
		 *         It is composed of a Tone.Compressor with a fast attack 
		 *         and release. Limiters are commonly used to safeguard against 
		 *         signal clipping. Unlike a compressor, limiters do not provide 
		 *         smooth gain reduction and almost completely prevent 
		 *         additional gain above the threshold.
		 *
		 *  @extends {Tone}
		 *  @constructor
		 *  @param {number} threshold The theshold above which the limiting is applied. 
		 *  @example
		 *  var limiter = new Tone.Limiter(-6);
		 */
	    Tone.Limiter = function () {
	        var options = this.optionsObject(arguments, ['threshold'], Tone.Limiter.defaults);
	        /**
			 *  the compressor
			 *  @private
			 *  @type {Tone.Compressor}
			 */
	        this._compressor = this.input = this.output = new Tone.Compressor({
	            'attack': 0.001,
	            'decay': 0.001,
	            'threshold': options.threshold
	        });
	        /**
			 * The threshold of of the limiter
			 * @type {Decibel}
			 * @signal
			 */
	        this.threshold = this._compressor.threshold;
	        this._readOnly('threshold');
	    };
	    Tone.extend(Tone.Limiter);
	    /**
		 *  The default value
		 *  @type {Object}
		 *  @const
		 *  @static
		 */
	    Tone.Limiter.defaults = { 'threshold': -12 };
	    /**
		 *  Clean up.
		 *  @returns {Tone.Limiter} this
		 */
	    Tone.Limiter.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._compressor.dispose();
	        this._compressor = null;
	        this._writable('threshold');
	        this.threshold = null;
	        return this;
	    };
	    return Tone.Limiter;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.Lowpass is a lowpass feedback comb filter. It is similar to 
		 *         Tone.FeedbackCombFilter, but includes a lowpass filter.
		 *
		 *  @extends {Tone}
		 *  @constructor
		 *  @param {Time|Object} [delayTime] The delay time of the comb filter
		 *  @param {NormalRange=} resonance The resonance (feedback) of the comb filter
		 *  @param {Frequency=} dampening The cutoff of the lowpass filter dampens the
		 *                                signal as it is fedback. 
		 */
	    Tone.LowpassCombFilter = function () {
	        Tone.call(this);
	        var options = this.optionsObject(arguments, [
	            'delayTime',
	            'resonance',
	            'dampening'
	        ], Tone.LowpassCombFilter.defaults);
	        /**
			 *  the delay node
			 *  @type {DelayNode}
			 *  @private
			 */
	        this._delay = this.input = this.context.createDelay(1);
	        /**
			 *  The delayTime of the comb filter. 
			 *  @type {Time}
			 *  @signal
			 */
	        this.delayTime = new Tone.Signal(options.delayTime, Tone.Type.Time);
	        /**
			 *  the lowpass filter
			 *  @type  {BiquadFilterNode}
			 *  @private
			 */
	        this._lowpass = this.output = this.context.createBiquadFilter();
	        this._lowpass.Q.value = 0;
	        this._lowpass.type = 'lowpass';
	        /**
			 *  The dampening control of the feedback
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.dampening = new Tone.Signal(this._lowpass.frequency, Tone.Type.Frequency);
	        this.dampening.value = options.dampening;
	        /**
			 *  the feedback gain
			 *  @type {GainNode}
			 *  @private
			 */
	        this._feedback = this.context.createGain();
	        /**
			 *  The amount of feedback of the delayed signal. 
			 *  @type {NormalRange}
			 *  @signal
			 */
	        this.resonance = new Tone.Signal(options.resonance, Tone.Type.NormalRange);
	        //connections
	        this._delay.chain(this._lowpass, this._feedback, this._delay);
	        this.delayTime.connect(this._delay.delayTime);
	        this.resonance.connect(this._feedback.gain);
	        this.dampening.connect(this._lowpass.frequency);
	        this._readOnly([
	            'dampening',
	            'resonance',
	            'delayTime'
	        ]);
	    };
	    Tone.extend(Tone.LowpassCombFilter);
	    /**
		 *  the default parameters
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
	    Tone.LowpassCombFilter.defaults = {
	        'delayTime': 0.1,
	        'resonance': 0.5,
	        'dampening': 3000
	    };
	    /**
		 *  Clean up. 
		 *  @returns {Tone.LowpassCombFilter} this
		 */
	    Tone.LowpassCombFilter.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._writable([
	            'dampening',
	            'resonance',
	            'delayTime'
	        ]);
	        this.dampening.dispose();
	        this.dampening = null;
	        this.resonance.dispose();
	        this.resonance = null;
	        this._delay.disconnect();
	        this._delay = null;
	        this._lowpass.disconnect();
	        this._lowpass = null;
	        this._feedback.disconnect();
	        this._feedback = null;
	        this.delayTime.dispose();
	        this.delayTime = null;
	        return this;
	    };
	    return Tone.LowpassCombFilter;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.Merge brings two signals into the left and right 
		 *          channels of a single stereo channel.
		 *
		 *  @constructor
		 *  @extends {Tone}
		 *  @example
		 * var merge = new Tone.Merge().toMaster();
		 * //routing a sine tone in the left channel
		 * //and noise in the right channel
		 * var osc = new Tone.Oscillator().connect(merge.left);
		 * var noise = new Tone.Noise().connect(merge.right);
		 * //starting our oscillators
		 * noise.start();
		 * osc.start();
		 */
	    Tone.Merge = function () {
	        Tone.call(this, 2, 0);
	        /**
			 *  The left input channel.
			 *  Alias for <code>input[0]</code>
			 *  @type {GainNode}
			 */
	        this.left = this.input[0] = this.context.createGain();
	        /**
			 *  The right input channel.
			 *  Alias for <code>input[1]</code>.
			 *  @type {GainNode}
			 */
	        this.right = this.input[1] = this.context.createGain();
	        /**
			 *  the merger node for the two channels
			 *  @type {ChannelMergerNode}
			 *  @private
			 */
	        this._merger = this.output = this.context.createChannelMerger(2);
	        //connections
	        this.left.connect(this._merger, 0, 0);
	        this.right.connect(this._merger, 0, 1);
	    };
	    Tone.extend(Tone.Merge);
	    /**
		 *  Clean up.
		 *  @returns {Tone.Merge} this
		 */
	    Tone.Merge.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this.left.disconnect();
	        this.left = null;
	        this.right.disconnect();
	        this.right = null;
	        this._merger.disconnect();
	        this._merger = null;
	        return this;
	    };
	    return Tone.Merge;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  A single master output which is connected to the
		 *          AudioDestinationNode (aka your speakers). 
		 *          It provides useful conveniences such as the ability 
		 *          to set the volume and mute the entire application. 
		 *          It also gives you the ability to apply master effects to your application. 
		 *          <br><br>
		 *          Like Tone.Transport, A single Tone.Master is created
		 *          on initialization and you do not need to explicitly construct one.
		 *
		 *  @constructor
		 *  @extends {Tone}
		 *  @singleton
		 *  @example
		 * //the audio will go from the oscillator to the speakers
		 * oscillator.connect(Tone.Master);
		 * //a convenience for connecting to the master output is also provided:
		 * oscillator.toMaster();
		 * //the above two examples are equivalent.
		 */
	    Tone.Master = function () {
	        Tone.call(this);
	        /**
			 * the unmuted volume
			 * @type {number}
			 * @private
			 */
	        this._unmutedVolume = 1;
	        /**
			 *  if the master is muted
			 *  @type {boolean}
			 *  @private
			 */
	        this._muted = false;
	        /**
			 * The volume of the master output.
			 * @type {Decibels}
			 * @signal
			 */
	        this.volume = new Tone.Signal(this.output.gain, Tone.Type.Decibels);
	        this._readOnly('volume');
	        //connections
	        this.input.chain(this.output, this.context.destination);
	    };
	    Tone.extend(Tone.Master);
	    /**
		 *  @type {Object}
		 *  @const
		 */
	    Tone.Master.defaults = {
	        'volume': 0,
	        'mute': false
	    };
	    /**
		 * Mute the output. 
		 * @memberOf Tone.Master#
		 * @type {boolean}
		 * @name mute
		 * @example
		 * //mute the output
		 * Tone.Master.mute = true;
		 */
	    Object.defineProperty(Tone.Master.prototype, 'mute', {
	        get: function () {
	            return this._muted;
	        },
	        set: function (mute) {
	            if (!this._muted && mute) {
	                this._unmutedVolume = this.volume.value;
	                //maybe it should ramp here?
	                this.volume.value = -Infinity;
	            } else if (this._muted && !mute) {
	                this.volume.value = this._unmutedVolume;
	            }
	            this._muted = mute;
	        }
	    });
	    /**
		 *  Add a master effects chain. NOTE: this will disconnect any nodes which were previously 
		 *  chained in the master effects chain. 
		 *  @param {AudioNode|Tone...} args All arguments will be connected in a row
		 *                                  and the Master will be routed through it.
		 *  @return  {Tone.Master}  this
		 *  @example
		 * //some overall compression to keep the levels in check
		 * var masterCompressor = new Tone.Compressor({
		 * 	"threshold" : -6,
		 * 	"ratio" : 3,
		 * 	"attack" : 0.5,
		 * 	"release" : 0.1
		 * });
		 * //give a little boost to the lows
		 * var lowBump = new Tone.Filter(200, "lowshelf");
		 * //route everything through the filter 
		 * //and compressor before going to the speakers
		 * Tone.Master.chain(lowBump, masterCompressor);
		 */
	    Tone.Master.prototype.chain = function () {
	        this.input.disconnect();
	        this.input.chain.apply(this.input, arguments);
	        arguments[arguments.length - 1].connect(this.output);
	    };
	    /**
		 *  Clean up
		 *  @return  {Tone.Master}  this
		 */
	    Tone.Master.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._writable('volume');
	        this.volume.dispose();
	        this.volume = null;
	    };
	    ///////////////////////////////////////////////////////////////////////////
	    //	AUGMENT TONE's PROTOTYPE
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *  Connect 'this' to the master output. Shorthand for this.connect(Tone.Master)
		 *  @returns {Tone} this
		 *  @example
		 * //connect an oscillator to the master output
		 * var osc = new Tone.Oscillator().toMaster();
		 */
	    Tone.prototype.toMaster = function () {
	        this.connect(Tone.Master);
	        return this;
	    };
	    /**
		 *  Also augment AudioNode's prototype to include toMaster
		 *  as a convenience
		 *  @returns {AudioNode} this
		 */
	    AudioNode.prototype.toMaster = function () {
	        this.connect(Tone.Master);
	        return this;
	    };
	    var MasterConstructor = Tone.Master;
	    /**
		 *  initialize the module and listen for new audio contexts
		 */
	    Tone._initAudioContext(function () {
	        //a single master output
	        if (!Tone.prototype.isUndef(Tone.Master)) {
	            Tone.Master = new MasterConstructor();
	        } else {
	            MasterConstructor.prototype.dispose.call(Tone.Master);
	            MasterConstructor.call(Tone.Master);
	        }
	    });
	    return Tone.Master;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.Meter gets the [RMS](https://en.wikipedia.org/wiki/Root_mean_square)
		 *          of an input signal with some averaging applied. 
		 *          It can also get the raw value of the signal or the value in dB. For signal 
		 *          processing, it's better to use Tone.Follower which will produce an audio-rate 
		 *          envelope follower instead of needing to poll the Meter to get the output.
		 *          <br><br>
		 *          Meter was inspired by [Chris Wilsons Volume Meter](https://github.com/cwilso/volume-meter/blob/master/volume-meter.js).
		 *
		 *  @constructor
		 *  @extends {Tone}
		 *  @param {number} [channels=1] number of channels being metered
		 *  @param {number} [smoothing=0.8] amount of smoothing applied to the volume
		 *  @param {number} [clipMemory=0.5] number in seconds that a "clip" should be remembered
		 *  @example
		 * var meter = new Tone.Meter();
		 * var mic = new Tone.Microphone().start();
		 * //connect mic to the meter
		 * mic.connect(meter);
		 * //use getLevel or getDb 
		 * //to access meter level
		 * meter.getLevel();
		 */
	    Tone.Meter = function () {
	        var options = this.optionsObject(arguments, [
	            'channels',
	            'smoothing'
	        ], Tone.Meter.defaults);
	        //extends Unit
	        Tone.call(this);
	        /** 
			 *  The channel count
			 *  @type  {number}
			 *  @private
			 */
	        this._channels = options.channels;
	        /**
			 * The amount which the decays of the meter are smoothed. Small values
			 * will follow the contours of the incoming envelope more closely than large values.
			 * @type {NormalRange}
			 */
	        this.smoothing = options.smoothing;
	        /** 
			 *  The amount of time a clip is remember for. 
			 *  @type  {Time}
			 */
	        this.clipMemory = options.clipMemory;
	        /** 
			 *  The value above which the signal is considered clipped.
			 *  @type  {Number}
			 */
	        this.clipLevel = options.clipLevel;
	        /** 
			 *  the rms for each of the channels
			 *  @private
			 *  @type {Array}
			 */
	        this._volume = new Array(this._channels);
	        /** 
			 *  the raw values for each of the channels
			 *  @private
			 *  @type {Array}
			 */
	        this._values = new Array(this._channels);
	        //zero out the volume array
	        for (var i = 0; i < this._channels; i++) {
	            this._volume[i] = 0;
	            this._values[i] = 0;
	        }
	        /** 
			 *  last time the values clipped
			 *  @private
			 *  @type {Array}
			 */
	        this._lastClip = new Array(this._channels);
	        //zero out the clip array
	        for (var j = 0; j < this._lastClip.length; j++) {
	            this._lastClip[j] = 0;
	        }
	        /** 
			 *  @private
			 *  @type {ScriptProcessorNode}
			 */
	        this._jsNode = this.context.createScriptProcessor(options.bufferSize, this._channels, 1);
	        this._jsNode.onaudioprocess = this._onprocess.bind(this);
	        //so it doesn't get garbage collected
	        this._jsNode.noGC();
	        //signal just passes
	        this.input.connect(this.output);
	        this.input.connect(this._jsNode);
	    };
	    Tone.extend(Tone.Meter);
	    /**
		 *  The defaults
		 *  @type {Object}
		 *  @static
		 *  @const
		 */
	    Tone.Meter.defaults = {
	        'smoothing': 0.8,
	        'bufferSize': 1024,
	        'clipMemory': 0.5,
	        'clipLevel': 0.9,
	        'channels': 1
	    };
	    /**
		 *  called on each processing frame
		 *  @private
		 *  @param  {AudioProcessingEvent} event 
		 */
	    Tone.Meter.prototype._onprocess = function (event) {
	        var bufferSize = this._jsNode.bufferSize;
	        var smoothing = this.smoothing;
	        for (var channel = 0; channel < this._channels; channel++) {
	            var input = event.inputBuffer.getChannelData(channel);
	            var sum = 0;
	            var total = 0;
	            var x;
	            for (var i = 0; i < bufferSize; i++) {
	                x = input[i];
	                total += x;
	                sum += x * x;
	            }
	            var average = total / bufferSize;
	            var rms = Math.sqrt(sum / bufferSize);
	            if (rms > 0.9) {
	                this._lastClip[channel] = Date.now();
	            }
	            this._volume[channel] = Math.max(rms, this._volume[channel] * smoothing);
	            this._values[channel] = average;
	        }
	    };
	    /**
		 *  Get the rms of the signal.
		 *  @param  {number} [channel=0] which channel
		 *  @return {number}         the value
		 */
	    Tone.Meter.prototype.getLevel = function (channel) {
	        channel = this.defaultArg(channel, 0);
	        var vol = this._volume[channel];
	        if (vol < 0.00001) {
	            return 0;
	        } else {
	            return vol;
	        }
	    };
	    /**
		 *  Get the raw value of the signal. 
		 *  @param  {number=} channel 
		 *  @return {number}         
		 */
	    Tone.Meter.prototype.getValue = function (channel) {
	        channel = this.defaultArg(channel, 0);
	        return this._values[channel];
	    };
	    /**
		 *  Get the volume of the signal in dB
		 *  @param  {number=} channel 
		 *  @return {Decibels}         
		 */
	    Tone.Meter.prototype.getDb = function (channel) {
	        return this.gainToDb(this.getLevel(channel));
	    };
	    /**
		 * @returns {boolean} if the audio has clipped. The value resets
		 *                       based on the clipMemory defined. 
		 */
	    Tone.Meter.prototype.isClipped = function (channel) {
	        channel = this.defaultArg(channel, 0);
	        return Date.now() - this._lastClip[channel] < this._clipMemory * 1000;
	    };
	    /**
		 *  Clean up.
		 *  @returns {Tone.Meter} this
		 */
	    Tone.Meter.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._jsNode.disconnect();
	        this._jsNode.onaudioprocess = null;
	        this._jsNode = null;
	        this._volume = null;
	        this._values = null;
	        this._lastClip = null;
	        return this;
	    };
	    return Tone.Meter;
	});
	Module(function (Tone) {
	    
	    /**
		 *	@class  Tone.Split splits an incoming signal into left and right channels.
		 *	
		 *  @constructor
		 *  @extends {Tone}
		 *  @example
		 * var split = new Tone.Split();
		 * stereoSignal.connect(split);
		 */
	    Tone.Split = function () {
	        Tone.call(this, 0, 2);
	        /** 
			 *  @type {ChannelSplitterNode}
			 *  @private
			 */
	        this._splitter = this.input = this.context.createChannelSplitter(2);
	        /** 
			 *  Left channel output. 
			 *  Alias for <code>output[0]</code>
			 *  @type {GainNode}
			 */
	        this.left = this.output[0] = this.context.createGain();
	        /**
			 *  Right channel output.
			 *  Alias for <code>output[1]</code>
			 *  @type {GainNode}
			 */
	        this.right = this.output[1] = this.context.createGain();
	        //connections
	        this._splitter.connect(this.left, 0, 0);
	        this._splitter.connect(this.right, 1, 0);
	    };
	    Tone.extend(Tone.Split);
	    /**
		 *  Clean up. 
		 *  @returns {Tone.Split} this
		 */
	    Tone.Split.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._splitter.disconnect();
	        this.left.disconnect();
	        this.right.disconnect();
	        this.left = null;
	        this.right = null;
	        this._splitter = null;
	        return this;
	    };
	    return Tone.Split;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Mid/Side processing separates the the 'mid' signal 
		 *         (which comes out of both the left and the right channel) 
		 *         and the 'side' (which only comes out of the the side channels). <br><br>
		 *         <code>
		 *         Mid = (Left+Right)/sqrt(2);   // obtain mid-signal from left and right<br>
		 *         Side = (Left-Right)/sqrt(2);   // obtain side-signal from left and righ<br>
		 *         </code>
		 *
		 *  @extends {Tone}
		 *  @constructor
		 */
	    Tone.MidSideSplit = function () {
	        Tone.call(this, 0, 2);
	        /**
			 *  split the incoming signal into left and right channels
			 *  @type  {Tone.Split}
			 *  @private
			 */
	        this._split = this.input = new Tone.Split();
	        /**
			 *  The mid send. Connect to mid processing. Alias for
			 *  <code>output[0]</code>
			 *  @type {Tone.Expr}
			 */
	        this.mid = this.output[0] = new Tone.Expr('($0 + $1) * $2');
	        /**
			 *  The side output. Connect to side processing. Alias for
			 *  <code>output[1]</code>
			 *  @type {Tone.Expr}
			 */
	        this.side = this.output[1] = new Tone.Expr('($0 - $1) * $2');
	        this._split.connect(this.mid, 0, 0);
	        this._split.connect(this.mid, 1, 1);
	        this._split.connect(this.side, 0, 0);
	        this._split.connect(this.side, 1, 1);
	        sqrtTwo.connect(this.mid, 0, 2);
	        sqrtTwo.connect(this.side, 0, 2);
	    };
	    Tone.extend(Tone.MidSideSplit);
	    /**
		 *  a constant signal equal to 1 / sqrt(2)
		 *  @type {Number}
		 *  @signal
		 *  @private
		 *  @static
		 */
	    var sqrtTwo = null;
	    Tone._initAudioContext(function () {
	        sqrtTwo = new Tone.Signal(1 / Math.sqrt(2));
	    });
	    /**
		 *  clean up
		 *  @returns {Tone.MidSideSplit} this
		 */
	    Tone.MidSideSplit.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this.mid.dispose();
	        this.mid = null;
	        this.side.dispose();
	        this.side = null;
	        this._split.dispose();
	        this._split = null;
	        return this;
	    };
	    return Tone.MidSideSplit;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Mid/Side processing separates the the 'mid' signal 
		 *         (which comes out of both the left and the right channel) 
		 *         and the 'side' (which only comes out of the the side channels). 
		 *         MidSideMerge merges the mid and side signal after they've been seperated
		 *         by Tone.MidSideSplit.<br><br>
		 *         <code>
		 *         Left = (Mid+Side)/sqrt(2);   // obtain left signal from mid and side<br>
		 *         Right = (Mid-Side)/sqrt(2);   // obtain right signal from mid and side<br>
		 *         </code>
		 *
		 *  @extends {Tone.StereoEffect}
		 *  @constructor
		 */
	    Tone.MidSideMerge = function () {
	        Tone.call(this, 2, 0);
	        /**
			 *  The mid signal input. Alias for
			 *  <code>input[0]</code>
			 *  @type  {GainNode}
			 */
	        this.mid = this.input[0] = this.context.createGain();
	        /**
			 *  recombine the mid/side into Left
			 *  @type {Tone.Expr}
			 *  @private
			 */
	        this._left = new Tone.Expr('($0 + $1) * $2');
	        /**
			 *  The side signal input. Alias for
			 *  <code>input[1]</code>
			 *  @type  {GainNode}
			 */
	        this.side = this.input[1] = this.context.createGain();
	        /**
			 *  recombine the mid/side into Right
			 *  @type {Tone.Expr}
			 *  @private
			 */
	        this._right = new Tone.Expr('($0 - $1) * $2');
	        /**
			 *  Merge the left/right signal back into a stereo signal.
			 *  @type {Tone.Merge}
			 *  @private
			 */
	        this._merge = this.output = new Tone.Merge();
	        this.mid.connect(this._left, 0, 0);
	        this.side.connect(this._left, 0, 1);
	        this.mid.connect(this._right, 0, 0);
	        this.side.connect(this._right, 0, 1);
	        this._left.connect(this._merge, 0, 0);
	        this._right.connect(this._merge, 0, 1);
	        sqrtTwo.connect(this._left, 0, 2);
	        sqrtTwo.connect(this._right, 0, 2);
	    };
	    Tone.extend(Tone.MidSideMerge);
	    /**
		 *  A constant signal equal to 1 / sqrt(2).
		 *  @type {Number}
		 *  @signal
		 *  @private
		 *  @static
		 */
	    var sqrtTwo = null;
	    Tone._initAudioContext(function () {
	        sqrtTwo = new Tone.Signal(1 / Math.sqrt(2));
	    });
	    /**
		 *  clean up
		 *  @returns {Tone.MidSideMerge} this
		 */
	    Tone.MidSideMerge.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this.mid.disconnect();
	        this.mid = null;
	        this.side.disconnect();
	        this.side = null;
	        this._left.dispose();
	        this._left = null;
	        this._right.dispose();
	        this._right = null;
	        this._merge.dispose();
	        this._merge = null;
	        return this;
	    };
	    return Tone.MidSideMerge;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.MidSideCompressor applies two different compressors to the mid
		 *         and side signal components. See Tone.MidSideSplit. 
		 *
		 *  @extends {Tone}
		 *  @param {Object} options The options that are passed to the mid and side
		 *                          compressors. 
		 *  @constructor
		 */
	    Tone.MidSideCompressor = function (options) {
	        options = this.defaultArg(options, Tone.MidSideCompressor.defaults);
	        /**
			 *  the mid/side split
			 *  @type  {Tone.MidSideSplit}
			 *  @private
			 */
	        this._midSideSplit = this.input = new Tone.MidSideSplit();
	        /**
			 *  the mid/side recombination
			 *  @type  {Tone.MidSideMerge}
			 *  @private
			 */
	        this._midSideMerge = this.output = new Tone.MidSideMerge();
	        /**
			 *  The compressor applied to the mid signal
			 *  @type  {Tone.Compressor}
			 */
	        this.mid = new Tone.Compressor(options.mid);
	        /**
			 *  The compressor applied to the side signal
			 *  @type  {Tone.Compressor}
			 */
	        this.side = new Tone.Compressor(options.side);
	        this._midSideSplit.mid.chain(this.mid, this._midSideMerge.mid);
	        this._midSideSplit.side.chain(this.side, this._midSideMerge.side);
	        this._readOnly([
	            'mid',
	            'side'
	        ]);
	    };
	    Tone.extend(Tone.MidSideCompressor);
	    /**
		 *  @const
		 *  @static
		 *  @type {Object}
		 */
	    Tone.MidSideCompressor.defaults = {
	        'mid': {
	            'ratio': 3,
	            'threshold': -24,
	            'release': 0.03,
	            'attack': 0.02,
	            'knee': 16
	        },
	        'side': {
	            'ratio': 6,
	            'threshold': -30,
	            'release': 0.25,
	            'attack': 0.03,
	            'knee': 10
	        }
	    };
	    /**
		 *  Clean up.
		 *  @returns {Tone.MidSideCompressor} this
		 */
	    Tone.MidSideCompressor.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._writable([
	            'mid',
	            'side'
	        ]);
	        this.mid.dispose();
	        this.mid = null;
	        this.side.dispose();
	        this.side = null;
	        this._midSideSplit.dispose();
	        this._midSideSplit = null;
	        this._midSideMerge.dispose();
	        this._midSideMerge = null;
	        return this;
	    };
	    return Tone.MidSideCompressor;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.Mono coerces the incoming mono or stereo signal into a mono signal
		 *         where both left and right channels have the same value. This can be useful 
		 *         for [stereo imaging](https://en.wikipedia.org/wiki/Stereo_imaging).
		 *
		 *  @extends {Tone}
		 *  @constructor
		 */
	    Tone.Mono = function () {
	        Tone.call(this, 1, 0);
	        /**
			 *  merge the signal
			 *  @type {Tone.Merge}
			 *  @private
			 */
	        this._merge = this.output = new Tone.Merge();
	        this.input.connect(this._merge, 0, 0);
	        this.input.connect(this._merge, 0, 1);
	        this.input.gain.value = this.dbToGain(-10);
	    };
	    Tone.extend(Tone.Mono);
	    /**
		 *  clean up
		 *  @returns {Tone.Mono} this
		 */
	    Tone.Mono.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._merge.dispose();
	        this._merge = null;
	        return this;
	    };
	    return Tone.Mono;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class A compressor with seperate controls over low/mid/high dynamics
		 *
		 *  @extends {Tone}
		 *  @constructor
		 *  @param {Object} options The low/mid/high compressor settings.
		 *  @example
		 *  var multiband = new Tone.MultibandCompressor({
		 *  	"lowFrequency" : 200,
		 *  	"highFrequency" : 1300
		 *  	"low" : {
		 *  		"threshold" : -12
		 *  	}
		 *  })
		 */
	    Tone.MultibandCompressor = function (options) {
	        options = this.defaultArg(arguments, Tone.MultibandCompressor.defaults);
	        /**
			 *  split the incoming signal into high/mid/low
			 *  @type {Tone.MultibandSplit}
			 *  @private
			 */
	        this._splitter = this.input = new Tone.MultibandSplit({
	            'lowFrequency': options.lowFrequency,
	            'highFrequency': options.highFrequency
	        });
	        /**
			 *  low/mid crossover frequency.
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.lowFrequency = this._splitter.lowFrequency;
	        /**
			 *  mid/high crossover frequency.
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.highFrequency = this._splitter.highFrequency;
	        /**
			 *  the output
			 *  @type {GainNode}
			 *  @private
			 */
	        this.output = this.context.createGain();
	        /**
			 *  The compressor applied to the low frequencies.
			 *  @type {Tone.Compressor}
			 */
	        this.low = new Tone.Compressor(options.low);
	        /**
			 *  The compressor applied to the mid frequencies.
			 *  @type {Tone.Compressor}
			 */
	        this.mid = new Tone.Compressor(options.mid);
	        /**
			 *  The compressor applied to the high frequencies.
			 *  @type {Tone.Compressor}
			 */
	        this.high = new Tone.Compressor(options.high);
	        //connect the compressor
	        this._splitter.low.chain(this.low, this.output);
	        this._splitter.mid.chain(this.mid, this.output);
	        this._splitter.high.chain(this.high, this.output);
	        this._readOnly([
	            'high',
	            'mid',
	            'low',
	            'highFrequency',
	            'lowFrequency'
	        ]);
	    };
	    Tone.extend(Tone.MultibandCompressor);
	    /**
		 *  @const
		 *  @static
		 *  @type {Object}
		 */
	    Tone.MultibandCompressor.defaults = {
	        'low': Tone.Compressor.defaults,
	        'mid': Tone.Compressor.defaults,
	        'high': Tone.Compressor.defaults,
	        'lowFrequency': 250,
	        'highFrequency': 2000
	    };
	    /**
		 *  clean up
		 *  @returns {Tone.MultibandCompressor} this
		 */
	    Tone.MultibandCompressor.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._splitter.dispose();
	        this._writable([
	            'high',
	            'mid',
	            'low',
	            'highFrequency',
	            'lowFrequency'
	        ]);
	        this.low.dispose();
	        this.mid.dispose();
	        this.high.dispose();
	        this._splitter = null;
	        this.low = null;
	        this.mid = null;
	        this.high = null;
	        this.lowFrequency = null;
	        this.highFrequency = null;
	        return this;
	    };
	    return Tone.MultibandCompressor;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Maps a NormalRange [0, 1] to an AudioRange [-1, 1]. 
		 *         See also Tone.AudioToGain. 
		 *
		 *  @extends {Tone.SignalBase}
		 *  @constructor
		 *  @example
		 * var g2a = new Tone.GainToAudio();
		 */
	    Tone.GainToAudio = function () {
	        /**
			 *  @type {WaveShaperNode}
			 *  @private
			 */
	        this._norm = this.input = this.output = new Tone.WaveShaper(function (x) {
	            return Math.abs(x) * 2 - 1;
	        });
	    };
	    Tone.extend(Tone.GainToAudio, Tone.SignalBase);
	    /**
		 *  clean up
		 *  @returns {Tone.GainToAudio} this
		 */
	    Tone.GainToAudio.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._norm.dispose();
	        this._norm = null;
	        return this;
	    };
	    return Tone.GainToAudio;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.Panner is an equal power Left/Right Panner and does not
		 *  support 3D. Panner uses the StereoPannerNode when available. 
		 *  
		 *  @constructor
		 *  @extends {Tone}
		 *  @param {NormalRange} [initialPan=0.5] The initail panner value (defaults to 0.5 = center)
		 *  @example
		 *  //pan the input signal hard right. 
		 *  var panner = new Tone.Panner(1);
		 */
	    Tone.Panner = function (initialPan) {
	        Tone.call(this);
	        /**
			 *  indicates if the panner is using the new StereoPannerNode internally
			 *  @type  {boolean}
			 *  @private
			 */
	        this._hasStereoPanner = this.isFunction(this.context.createStereoPanner);
	        if (this._hasStereoPanner) {
	            /**
				 *  the panner node
				 *  @type {StereoPannerNode}
				 *  @private
				 */
	            this._panner = this.input = this.output = this.context.createStereoPanner();
	            /**
				 *  The pan control. 0 = hard left, 1 = hard right. 
				 *  @type {NormalRange}
				 *  @signal
				 */
	            this.pan = new Tone.Signal(0, Tone.Type.NormalRange);
	            /**
				 *  scale the pan signal to between -1 and 1
				 *  @type {Tone.WaveShaper}
				 *  @private
				 */
	            this._scalePan = new Tone.GainToAudio();
	            //connections
	            this.pan.chain(this._scalePan, this._panner.pan);
	        } else {
	            /**
				 *  the dry/wet knob
				 *  @type {Tone.CrossFade}
				 *  @private
				 */
	            this._crossFade = new Tone.CrossFade();
	            /**
				 *  @type {Tone.Merge}
				 *  @private
				 */
	            this._merger = this.output = new Tone.Merge();
	            /**
				 *  @type {Tone.Split}
				 *  @private
				 */
	            this._splitter = this.input = new Tone.Split();
	            /**
				 *  The pan control. 0 = hard left, 1 = hard right. 
				 *  @type {NormalRange}
				 *  @signal
				 */
	            this.pan = this._crossFade.fade;
	            //CONNECTIONS:
	            //left channel is a, right channel is b
	            this._splitter.connect(this._crossFade, 0, 0);
	            this._splitter.connect(this._crossFade, 1, 1);
	            //merge it back together
	            this._crossFade.a.connect(this._merger, 0, 0);
	            this._crossFade.b.connect(this._merger, 0, 1);
	        }
	        //initial value
	        this.pan.value = this.defaultArg(initialPan, 0.5);
	        this._readOnly('pan');
	    };
	    Tone.extend(Tone.Panner);
	    /**
		 *  Clean up.
		 *  @returns {Tone.Panner} this
		 */
	    Tone.Panner.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._writable('pan');
	        if (this._hasStereoPanner) {
	            this._panner.disconnect();
	            this._panner = null;
	            this.pan.dispose();
	            this.pan = null;
	            this._scalePan.dispose();
	            this._scalePan = null;
	        } else {
	            this._crossFade.dispose();
	            this._crossFade = null;
	            this._splitter.dispose();
	            this._splitter = null;
	            this._merger.dispose();
	            this._merger = null;
	            this.pan = null;
	        }
	        return this;
	    };
	    return Tone.Panner;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.PanVol is a Tone.Panner and Tone.Volume in one.
		 *
		 *  @extends {Tone}
		 *  @constructor
		 *  @param {NormalRange} pan the initial pan
		 *  @param {number} volume The output volume. 
		 *  @example
		 * //pan the incoming signal left and drop the volume
		 * var panVol = new Tone.PanVol(0.25, -12);
		 */
	    Tone.PanVol = function () {
	        var options = this.optionsObject(arguments, [
	            'pan',
	            'volume'
	        ], Tone.PanVol.defaults);
	        /**
			 *  The panning node
			 *  @type {Tone.Panner}
			 *  @private
			 */
	        this._panner = this.input = new Tone.Panner(options.pan);
	        /**
			 *  The L/R panning control.
			 *  @type {NormalRange}
			 *  @signal
			 */
	        this.pan = this._panner.pan;
	        /**
			 * The volume object. 
			 * @type {Tone.Volume}
			 * @signal
			 * @private
			 */
	        this._volume = this.output = new Tone.Volume(options.volume);
	        /**
			 *  The volume control in decibels. 
			 *  @type {Decibels}
			 *  @signal
			 */
	        this.volume = this._volume.volume;
	        //connections
	        this._panner.connect(this._volume);
	        this._readOnly([
	            'pan',
	            'volume'
	        ]);
	    };
	    Tone.extend(Tone.PanVol);
	    /**
		 *  The defaults
		 *  @type  {Object}
		 *  @const
		 *  @static
		 */
	    Tone.PanVol.defaults = {
	        'pan': 0.5,
	        'volume': 0
	    };
	    /**
		 *  clean up
		 *  @returns {Tone.PanVol} this
		 */
	    Tone.PanVol.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._writable([
	            'pan',
	            'volume'
	        ]);
	        this._panner.dispose();
	        this._panner = null;
	        this._volume.dispose();
	        this._volume = null;
	        this.pan = null;
	        this.volume = null;
	        return this;
	    };
	    return Tone.PanVol;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.ScaledEnvelop is an envelope which can be scaled 
		 *         to any range. It's useful for applying an envelope 
		 *         to a frequency or any other non-NormalRange signal 
		 *         parameter. 
		 *
		 *  @extends {Tone.Envelope}
		 *  @constructor
		 *  @param {Time|Object} [attack]	the attack time in seconds
		 *  @param {Time} [decay]	the decay time in seconds
		 *  @param {number} [sustain] 	a percentage (0-1) of the full amplitude
		 *  @param {Time} [release]	the release time in seconds
		 *  @example
		 *  var scaledEnv = new Tone.ScaledEnvelope({
		 *  	"attack" : 0.2,
		 *  	"min" : 200,
		 *  	"max" : 2000
		 *  });
		 *  scaledEnv.connect(oscillator.frequency);
		 */
	    Tone.ScaledEnvelope = function () {
	        //get all of the defaults
	        var options = this.optionsObject(arguments, [
	            'attack',
	            'decay',
	            'sustain',
	            'release'
	        ], Tone.Envelope.defaults);
	        Tone.Envelope.call(this, options);
	        options = this.defaultArg(options, Tone.ScaledEnvelope.defaults);
	        /** 
			 *  scale the incoming signal by an exponent
			 *  @type {Tone.Pow}
			 *  @private
			 */
	        this._exp = this.output = new Tone.Pow(options.exponent);
	        /**
			 *  scale the signal to the desired range
			 *  @type {Tone.Multiply}
			 *  @private
			 */
	        this._scale = this.output = new Tone.Scale(options.min, options.max);
	        this._sig.chain(this._exp, this._scale);
	    };
	    Tone.extend(Tone.ScaledEnvelope, Tone.Envelope);
	    /**
		 *  the default parameters
		 *  @static
		 */
	    Tone.ScaledEnvelope.defaults = {
	        'min': 0,
	        'max': 1,
	        'exponent': 1
	    };
	    /**
		 * The envelope's min output value. This is the value which it
		 * starts at. 
		 * @memberOf Tone.ScaledEnvelope#
		 * @type {number}
		 * @name min
		 */
	    Object.defineProperty(Tone.ScaledEnvelope.prototype, 'min', {
	        get: function () {
	            return this._scale.min;
	        },
	        set: function (min) {
	            this._scale.min = min;
	        }
	    });
	    /**
		 * The envelope's max output value. In other words, the value
		 * at the peak of the attack portion of the envelope. 
		 * @memberOf Tone.ScaledEnvelope#
		 * @type {number}
		 * @name max
		 */
	    Object.defineProperty(Tone.ScaledEnvelope.prototype, 'max', {
	        get: function () {
	            return this._scale.max;
	        },
	        set: function (max) {
	            this._scale.max = max;
	        }
	    });
	    /**
		 * The envelope's exponent value. 
		 * @memberOf Tone.ScaledEnvelope#
		 * @type {number}
		 * @name exponent
		 */
	    Object.defineProperty(Tone.ScaledEnvelope.prototype, 'exponent', {
	        get: function () {
	            return this._exp.value;
	        },
	        set: function (exp) {
	            this._exp.value = exp;
	        }
	    });
	    /**
		 *  clean up
		 *  @returns {Tone.ScaledEnvelope} this
		 */
	    Tone.ScaledEnvelope.prototype.dispose = function () {
	        Tone.Envelope.prototype.dispose.call(this);
	        this._scale.dispose();
	        this._scale = null;
	        this._exp.dispose();
	        this._exp = null;
	        return this;
	    };
	    return Tone.ScaledEnvelope;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Buffer loading and storage. Tone.Buffer is used internally by all 
		 *          classes that make requests for audio files such as Tone.Player,
		 *          Tone.Sampler and Tone.Convolver.
		 *          <br><br>
		 *          Aside from load callbacks from individual buffers, Tone.Buffer 
		 *  		provides static methods which keep track of the loading progress 
		 *  		of all of the buffers. These methods are Tone.Buffer.onload, Tone.Buffer.onprogress,
		 *  		and Tone.Buffer.onerror. 
		 *
		 *  @constructor 
		 *  @extends {Tone}
		 *  @param {AudioBuffer|string} url The url to load, or the audio buffer to set. 
		 *  @param {function=} onload A callback which is invoked after the buffer is loaded. 
		 *                            It's recommended to use Tone.Buffer.onload instead 
		 *                            since it will give you a callback when ALL buffers are loaded.
		 *  @example
		 * var buffer = new Tone.Buffer("path/to/sound.mp3", function(){
		 * 	//the buffer is now available.
		 * 	var buff = buffer.get();
		 * });
		 */
	    Tone.Buffer = function (url) {
	        var options = this.optionsObject(arguments, [
	            'url',
	            'onload'
	        ], Tone.Buffer.defaults);
	        /**
			 *  stores the loaded AudioBuffer
			 *  @type {AudioBuffer}
			 *  @private
			 */
	        this._buffer = null;
	        /**
			 *  indicates if the buffer should be reversed or not
			 *  @type {boolean}
			 *  @private
			 */
	        this._reversed = options.reverse;
	        /**
			 *  The url of the buffer. <code>undefined</code> if it was 
			 *  constructed with a buffer
			 *  @type {string}
			 *  @readOnly
			 */
	        this.url = undefined;
	        /**
			 *  Indicates if the buffer is loaded or not. 
			 *  @type {boolean}
			 *  @readOnly
			 */
	        this.loaded = false;
	        /**
			 *  The callback to invoke when everything is loaded. 
			 *  @type {function}
			 */
	        this.onload = options.onload.bind(this, this);
	        if (url instanceof AudioBuffer || url instanceof Tone.Buffer) {
	            this.set(url);
	            this.onload(this);
	        } else if (typeof options.url === 'string') {
	            this.url = options.url;
	            Tone.Buffer._addToQueue(options.url, this);
	        }
	    };
	    Tone.extend(Tone.Buffer);
	    /**
		 *  the default parameters
		 *  @type {Object}
		 */
	    Tone.Buffer.defaults = {
	        'url': undefined,
	        'onload': Tone.noOp,
	        'reverse': false
	    };
	    /**
		 *  Pass in an AudioBuffer or Tone.Buffer to set the value
		 *  of this buffer.
		 *  @param {AudioBuffer|Tone.Buffer} buffer the buffer
		 *  @returns {Tone.Buffer} this
		 */
	    Tone.Buffer.prototype.set = function (buffer) {
	        if (buffer instanceof Tone.Buffer) {
	            this._buffer = buffer.get();
	        } else {
	            this._buffer = buffer;
	        }
	        this.loaded = true;
	        return this;
	    };
	    /**
		 *  @return {AudioBuffer} The audio buffer stored in the object.
		 */
	    Tone.Buffer.prototype.get = function () {
	        return this._buffer;
	    };
	    /**
		 *  Load url into the buffer. 
		 *  @param {String} url The url to load
		 *  @param {Function=} callback The callback to invoke on load. 
		 *                              don't need to set if `onload` is
		 *                              already set.
		 *  @returns {Tone.Buffer} this
		 */
	    Tone.Buffer.prototype.load = function (url, callback) {
	        this.url = url;
	        this.onload = this.defaultArg(callback, this.onload);
	        Tone.Buffer._addToQueue(url, this);
	        return this;
	    };
	    /**
		 *  dispose and disconnect
		 *  @returns {Tone.Buffer} this
		 */
	    Tone.Buffer.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        Tone.Buffer._removeFromQueue(this);
	        this._buffer = null;
	        this.onload = Tone.Buffer.defaults.onload;
	        return this;
	    };
	    /**
		 * The duration of the buffer. 
		 * @memberOf Tone.Buffer#
		 * @type {number}
		 * @name duration
		 * @readOnly
		 */
	    Object.defineProperty(Tone.Buffer.prototype, 'duration', {
	        get: function () {
	            if (this._buffer) {
	                return this._buffer.duration;
	            } else {
	                return 0;
	            }
	        }
	    });
	    /**
		 *  Reverse the buffer.
		 *  @private
		 *  @return {Tone.Buffer} this
		 */
	    Tone.Buffer.prototype._reverse = function () {
	        if (this.loaded) {
	            for (var i = 0; i < this._buffer.numberOfChannels; i++) {
	                Array.prototype.reverse.call(this._buffer.getChannelData(i));
	            }
	        }
	        return this;
	    };
	    /**
		 * Reverse the buffer.
		 * @memberOf Tone.Buffer#
		 * @type {boolean}
		 * @name reverse
		 */
	    Object.defineProperty(Tone.Buffer.prototype, 'reverse', {
	        get: function () {
	            return this._reversed;
	        },
	        set: function (rev) {
	            if (this._reversed !== rev) {
	                this._reversed = rev;
	                this._reverse();
	            }
	        }
	    });
	    ///////////////////////////////////////////////////////////////////////////
	    // STATIC METHODS
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *  the static queue for all of the xhr requests
		 *  @type {Array}
		 *  @private
		 */
	    Tone.Buffer._queue = [];
	    /**
		 *  the array of current downloads
		 *  @type {Array}
		 *  @private
		 */
	    Tone.Buffer._currentDownloads = [];
	    /**
		 *  the total number of downloads
		 *  @type {number}
		 *  @private
		 */
	    Tone.Buffer._totalDownloads = 0;
	    /**
		 *  the maximum number of simultaneous downloads
		 *  @static
		 *  @type {number}
		 */
	    Tone.Buffer.MAX_SIMULTANEOUS_DOWNLOADS = 6;
	    /**
		 *  Adds a file to be loaded to the loading queue
		 *  @param   {string}   url      the url to load
		 *  @param   {function} callback the callback to invoke once it's loaded
		 *  @private
		 */
	    Tone.Buffer._addToQueue = function (url, buffer) {
	        Tone.Buffer._queue.push({
	            url: url,
	            Buffer: buffer,
	            progress: 0,
	            xhr: null
	        });
	        this._totalDownloads++;
	        Tone.Buffer._next();
	    };
	    /**
		 *  Remove an object from the queue's (if it's still there)
		 *  Abort the XHR if it's in progress
		 *  @param {Tone.Buffer} buffer the buffer to remove
		 *  @private
		 */
	    Tone.Buffer._removeFromQueue = function (buffer) {
	        var i;
	        for (i = 0; i < Tone.Buffer._queue.length; i++) {
	            var q = Tone.Buffer._queue[i];
	            if (q.Buffer === buffer) {
	                Tone.Buffer._queue.splice(i, 1);
	            }
	        }
	        for (i = 0; i < Tone.Buffer._currentDownloads.length; i++) {
	            var dl = Tone.Buffer._currentDownloads[i];
	            if (dl.Buffer === buffer) {
	                Tone.Buffer._currentDownloads.splice(i, 1);
	                dl.xhr.abort();
	                dl.xhr.onprogress = null;
	                dl.xhr.onload = null;
	                dl.xhr.onerror = null;
	            }
	        }
	    };
	    /**
		 *  load the next buffer in the queue
		 *  @private
		 */
	    Tone.Buffer._next = function () {
	        if (Tone.Buffer._queue.length > 0) {
	            if (Tone.Buffer._currentDownloads.length < Tone.Buffer.MAX_SIMULTANEOUS_DOWNLOADS) {
	                var next = Tone.Buffer._queue.shift();
	                Tone.Buffer._currentDownloads.push(next);
	                next.xhr = Tone.Buffer.load(next.url, function (buffer) {
	                    //remove this one from the queue
	                    var index = Tone.Buffer._currentDownloads.indexOf(next);
	                    Tone.Buffer._currentDownloads.splice(index, 1);
	                    next.Buffer.set(buffer);
	                    if (next.Buffer._reversed) {
	                        next.Buffer._reverse();
	                    }
	                    next.Buffer.onload(next.Buffer);
	                    Tone.Buffer._onprogress();
	                    Tone.Buffer._next();
	                });
	                next.xhr.onprogress = function (event) {
	                    next.progress = event.loaded / event.total;
	                    Tone.Buffer._onprogress();
	                };
	                next.xhr.onerror = Tone.Buffer.onerror;
	            }
	        } else if (Tone.Buffer._currentDownloads.length === 0) {
	            Tone.Buffer.onload();
	            //reset the downloads
	            Tone.Buffer._totalDownloads = 0;
	        }
	    };
	    /**
		 *  internal progress event handler
		 *  @private
		 */
	    Tone.Buffer._onprogress = function () {
	        var curretDownloadsProgress = 0;
	        var currentDLLen = Tone.Buffer._currentDownloads.length;
	        var inprogress = 0;
	        if (currentDLLen > 0) {
	            for (var i = 0; i < currentDLLen; i++) {
	                var dl = Tone.Buffer._currentDownloads[i];
	                curretDownloadsProgress += dl.progress;
	            }
	            inprogress = curretDownloadsProgress;
	        }
	        var currentDownloadProgress = currentDLLen - inprogress;
	        var completed = Tone.Buffer._totalDownloads - Tone.Buffer._queue.length - currentDownloadProgress;
	        Tone.Buffer.onprogress(completed / Tone.Buffer._totalDownloads);
	    };
	    /**
		 *  Makes an xhr reqest for the selected url then decodes
		 *  the file as an audio buffer. Invokes
		 *  the callback once the audio buffer loads.
		 *  @param {string} url The url of the buffer to load.
		 *                      filetype support depends on the
		 *                      browser.
		 *  @param {function} callback The function to invoke when the url is loaded. 
		 *  @returns {XMLHttpRequest} returns the XHR
		 */
	    Tone.Buffer.load = function (url, callback) {
	        var request = new XMLHttpRequest();
	        request.open('GET', url, true);
	        request.responseType = 'arraybuffer';
	        // decode asynchronously
	        request.onload = function () {
	            Tone.context.decodeAudioData(request.response, function (buff) {
	                if (!buff) {
	                    throw new Error('could not decode audio data:' + url);
	                }
	                callback(buff);
	            });
	        };
	        //send the request
	        request.send();
	        return request;
	    };
	    /**
		 *  Callback when all of the buffers in the queue have loaded
		 *  @static
		 *  @function
		 *  @example
		 * //invoked when all of the queued samples are done loading
		 * Tone.Buffer.onload = function(){
		 * 	console.log("everything is loaded");
		 * };
		 */
	    Tone.Buffer.onload = Tone.noOp;
	    /**
		 *  Callback function is invoked with the progress of all of the loads in the queue. 
		 *  The value passed to the callback is between 0-1.
		 *  @static
		 *  @param {Number} percent The progress between 0 and 1. 
		 *  @function
		 *  @example
		 * Tone.Buffer.onprogress = function(percent){
		 * 	console.log("progress:" + (percent * 100).toFixed(1) + "%");
		 * };
		 */
	    Tone.Buffer.onprogress = Tone.noOp;
	    /**
		 *  Callback if one of the buffers in the queue encounters an error. The error
		 *  is passed in as the argument. 
		 *  @static
		 *  @param {Error} err
		 *  @function
		 *  @example
		 * Tone.Buffer.onerror = function(e){
		 * 	console.log("there was an error while loading the buffers: "+e);
		 * }
		 */
	    Tone.Buffer.onerror = Tone.noOp;
	    return Tone.Buffer;
	});
	Module(function (Tone) {
	    
	    /**
		 *  buses are another way of routing audio
		 *
		 *  augments Tone.prototype to include send and recieve
		 */
	    /**
		  *  All of the routes
		  *  
		  *  @type {Object}
		  *  @static
		  *  @private
		  */
	    var Buses = {};
	    /**
		 *  Send this signal to the channel name. 
		 *  @param  {string} channelName A named channel to send the signal to.
		 *  @param  {Decibels} amount The amount of the source to send to the bus. 
		 *  @return {GainNode} The gain node which connects this node to the desired channel. 
		 *                     Can be used to adjust the levels of the send.
		 *  @example
		 * source.send("reverb", -12);
		 */
	    Tone.prototype.send = function (channelName, amount) {
	        if (!Buses.hasOwnProperty(channelName)) {
	            Buses[channelName] = this.context.createGain();
	        }
	        var sendKnob = this.context.createGain();
	        sendKnob.gain.value = this.dbToGain(this.defaultArg(amount, 1));
	        this.output.chain(sendKnob, Buses[channelName]);
	        return sendKnob;
	    };
	    /**
		 *  Recieve the input from the desired channelName to the input
		 *
		 *  @param  {string} channelName A named channel to send the signal to.
		 *  @param {AudioNode} [input] If no input is selected, the
		 *                                         input of the current node is
		 *                                         chosen. 
		 *  @returns {Tone} this
		 *  @example
		 * reverbEffect.receive("reverb");
		 */
	    Tone.prototype.receive = function (channelName, input) {
	        if (!Buses.hasOwnProperty(channelName)) {
	            Buses[channelName] = this.context.createGain();
	        }
	        if (this.isUndef(input)) {
	            input = this.input;
	        }
	        Buses[channelName].connect(input);
	        return this;
	    };
	    return Tone;
	});
	Module(function (Tone) {
	    /**
		 *  @class Wrapper around Web Audio's native [DelayNode](http://webaudio.github.io/web-audio-api/#the-delaynode-interface). 
		 *  @extends {Tone}
		 *  @param {Number=} delayTime The delay applied to the incoming signal.
		 *  @param {Number=} maxDelay The maximum delay time. 
		 */
	    Tone.Delay = function () {
	        var options = this.optionsObject(arguments, [
	            'delayTime',
	            'maxDelay'
	        ], Tone.Delay.defaults);
	        /**
			 *  The native delay node
			 *  @type {DelayNode}
			 *  @private
			 */
	        this._delayNode = this.input = this.output = this.context.createDelay(options.maxDelay);
	        /**
			 *  The amount of time the incoming signal is
			 *  delayed. 
			 *  @type {Positive}
			 *  @signal
			 */
	        this.delayTime = this._delayNode.delayTime;
	        this._readOnly('delayTime');
	        this.delayTime.value = options.delayTime;
	    };
	    Tone.extend(Tone.Delay);
	    /**
		 *  The defaults
		 *  @const
		 *  @type  {Object}
		 */
	    Tone.Delay.defaults = {
	        'maxDelay': 1,
	        'delayTime': 0
	    };
	    /**
		 *  Clean up.
		 *  @return  {Tone.Delay}  this
		 */
	    Tone.Delay.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._delayNode.disconnect();
	        this._delayNode = null;
	        this._writable('delayTime');
	        this.delayTime = null;
	        return this;
	    };
	    return Tone.Delay;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  A timed note. Creating a note will register a callback 
		 *          which will be invoked on the channel at the time with
		 *          whatever value was specified. 
		 *
		 *  @constructor
		 *  @param {number|string} channel the channel name of the note
		 *  @param {Time} time the time when the note will occur
		 *  @param {string|number|Object|Array} value the value of the note
		 */
	    Tone.Note = function (channel, time, value) {
	        /**
			 *  the value of the note. This value is returned
			 *  when the channel callback is invoked.
			 *  
			 *  @type {string|number|Object}
			 */
	        this.value = value;
	        /**
			 *  the channel name or number
			 *  
			 *  @type {string|number}
			 *  @private
			 */
	        this._channel = channel;
	        /**
			 *  an internal reference to the id of the timeline
			 *  callback which is set. 
			 *  
			 *  @type {number}
			 *  @private
			 */
	        this._timelineID = Tone.Transport.setTimeline(this._trigger.bind(this), time);
	    };
	    /**
		 *  invoked by the timeline
		 *  @private
		 *  @param {number} time the time at which the note should play
		 */
	    Tone.Note.prototype._trigger = function (time) {
	        //invoke the callback
	        channelCallbacks(this._channel, time, this.value);
	    };
	    /**
		 *  clean up
		 *  @returns {Tone.Note} this
		 */
	    Tone.Note.prototype.dispose = function () {
	        Tone.Transport.clearTimeline(this._timelineID);
	        this.value = null;
	        return this;
	    };
	    /**
		 *  @private
		 *  @static
		 *  @type {Object}
		 */
	    var NoteChannels = {};
	    /**
		 *  invoke all of the callbacks on a specific channel
		 *  @private
		 */
	    function channelCallbacks(channel, time, value) {
	        if (NoteChannels.hasOwnProperty(channel)) {
	            var callbacks = NoteChannels[channel];
	            for (var i = 0, len = callbacks.length; i < len; i++) {
	                var callback = callbacks[i];
	                if (Array.isArray(value)) {
	                    callback.apply(window, [time].concat(value));
	                } else {
	                    callback(time, value);
	                }
	            }
	        }
	    }
	    /**
		 *  listen to a specific channel, get all of the note callbacks
		 *  @static
		 *  @param {string|number} channel the channel to route note events from
		 *  @param {function(*)} callback callback to be invoked when a note will occur
		 *                                        on the specified channel
		 */
	    Tone.Note.route = function (channel, callback) {
	        if (NoteChannels.hasOwnProperty(channel)) {
	            NoteChannels[channel].push(callback);
	        } else {
	            NoteChannels[channel] = [callback];
	        }
	    };
	    /**
		 *  Remove a previously routed callback from a channel. 
		 *  @static
		 *  @param {string|number} channel The channel to unroute note events from
		 *  @param {function(*)} callback Callback which was registered to the channel.
		 */
	    Tone.Note.unroute = function (channel, callback) {
	        if (NoteChannels.hasOwnProperty(channel)) {
	            var channelCallback = NoteChannels[channel];
	            var index = channelCallback.indexOf(callback);
	            if (index !== -1) {
	                NoteChannels[channel].splice(index, 1);
	            }
	        }
	    };
	    /**
		 *  Parses a score and registers all of the notes along the timeline. 
		 *  <br><br>
		 *  Scores are a JSON object with instruments at the top level
		 *  and an array of time and values. The value of a note can be 0 or more 
		 *  parameters. 
		 *  <br><br>
		 *  The only requirement for the score format is that the time is the first (or only)
		 *  value in the array. All other values are optional and will be passed into the callback
		 *  function registered using `Note.route(channelName, callback)`.
		 *  <br><br>
		 *  To convert MIDI files to score notation, take a look at utils/MidiToScore.js
		 *
		 *  @example
		 * //an example JSON score which sets up events on channels
		 * var score = { 
		 * 	"synth"  : [["0", "C3"], ["0:1", "D3"], ["0:2", "E3"], ... ],
		 * 	"bass"  : [["0", "C2"], ["1:0", "A2"], ["2:0", "C2"], ["3:0", "A2"], ... ],
		 * 	"kick"  : ["0", "0:2", "1:0", "1:2", "2:0", ... ],
		 * 	//...
		 * };
		 * //parse the score into Notes
		 * Tone.Note.parseScore(score);
		 * //route all notes on the "synth" channel
		 * Tone.Note.route("synth", function(time, note){
		 * 	//trigger synth
		 * });
		 *  @static
		 *  @param {Object} score
		 *  @return {Array} an array of all of the notes that were created
		 */
	    Tone.Note.parseScore = function (score) {
	        var notes = [];
	        for (var inst in score) {
	            var part = score[inst];
	            if (inst === 'tempo') {
	                Tone.Transport.bpm.value = part;
	            } else if (inst === 'timeSignature') {
	                Tone.Transport.timeSignature = part[0] / (part[1] / 4);
	            } else if (Array.isArray(part)) {
	                for (var i = 0; i < part.length; i++) {
	                    var noteDescription = part[i];
	                    var note;
	                    if (Array.isArray(noteDescription)) {
	                        var time = noteDescription[0];
	                        var value = noteDescription.slice(1);
	                        note = new Tone.Note(inst, time, value);
	                    } else if (typeof noteDescription === 'object') {
	                        note = new Tone.Note(inst, noteDescription.time, noteDescription);
	                    } else {
	                        note = new Tone.Note(inst, noteDescription);
	                    }
	                    notes.push(note);
	                }
	            } else {
	                throw new TypeError('score parts must be Arrays');
	            }
	        }
	        return notes;
	    };
	    return Tone.Note;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.PulseOscillator is a pulse oscillator with control over pulse width,
		 *         also known as the duty cycle. At 50% duty cycle (width = 0.5) the wave is 
		 *         a square and only odd-numbered harmonics are present. At all other widths 
		 *         even-numbered harmonics are present. Read more 
		 *         [here](https://wigglewave.wordpress.com/2014/08/16/pulse-waveforms-and-harmonics/).
		 *
		 *  @constructor
		 *  @extends {Tone.Oscillator}
		 *  @param {Frequency} [frequency] The frequency of the oscillator
		 *  @param {NormalRange} [width] The width of the pulse
		 *  @example
		 * var pulse = new Tone.PulseOscillator("E5", 0.4).toMaster().start();
		 */
	    Tone.PulseOscillator = function () {
	        var options = this.optionsObject(arguments, [
	            'frequency',
	            'width'
	        ], Tone.Oscillator.defaults);
	        Tone.Source.call(this, options);
	        /**
			 *  The width of the pulse. 
			 *  @type {NormalRange}
			 *  @signal
			 */
	        this.width = new Tone.Signal(options.width, Tone.Type.NormalRange);
	        /**
			 *  gate the width amount
			 *  @type {GainNode}
			 *  @private
			 */
	        this._widthGate = this.context.createGain();
	        /**
			 *  the sawtooth oscillator
			 *  @type {Tone.Oscillator}
			 *  @private
			 */
	        this._sawtooth = new Tone.Oscillator({
	            frequency: options.frequency,
	            detune: options.detune,
	            type: 'sawtooth',
	            phase: options.phase
	        });
	        /**
			 *  The frequency control.
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.frequency = this._sawtooth.frequency;
	        /**
			 *  The detune in cents. 
			 *  @type {Cents}
			 *  @signal
			 */
	        this.detune = this._sawtooth.detune;
	        /**
			 *  Threshold the signal to turn it into a square
			 *  @type {Tone.WaveShaper}
			 *  @private
			 */
	        this._thresh = new Tone.WaveShaper(function (val) {
	            if (val < 0) {
	                return -1;
	            } else {
	                return 1;
	            }
	        });
	        //connections
	        this._sawtooth.chain(this._thresh, this.output);
	        this.width.chain(this._widthGate, this._thresh);
	        this._readOnly([
	            'width',
	            'frequency',
	            'detune'
	        ]);
	    };
	    Tone.extend(Tone.PulseOscillator, Tone.Oscillator);
	    /**
		 *  The default parameters.
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
	    Tone.PulseOscillator.defaults = {
	        'frequency': 440,
	        'detune': 0,
	        'phase': 0,
	        'width': 0.2
	    };
	    /**
		 *  start the oscillator
		 *  @param  {Time} time 
		 *  @private
		 */
	    Tone.PulseOscillator.prototype._start = function (time) {
	        time = this.toSeconds(time);
	        this._sawtooth.start(time);
	        this._widthGate.gain.setValueAtTime(1, time);
	    };
	    /**
		 *  stop the oscillator
		 *  @param  {Time} time 
		 *  @private
		 */
	    Tone.PulseOscillator.prototype._stop = function (time) {
	        time = this.toSeconds(time);
	        this._sawtooth.stop(time);
	        //the width is still connected to the output. 
	        //that needs to be stopped also
	        this._widthGate.gain.setValueAtTime(0, time);
	    };
	    /**
		 * The phase of the oscillator in degrees.
		 * @memberOf Tone.PulseOscillator#
		 * @type {Degrees}
		 * @name phase
		 */
	    Object.defineProperty(Tone.PulseOscillator.prototype, 'phase', {
	        get: function () {
	            return this._sawtooth.phase;
	        },
	        set: function (phase) {
	            this._sawtooth.phase = phase;
	        }
	    });
	    /**
		 * The type of the oscillator. Always returns "pulse".
		 * @readOnly
		 * @memberOf Tone.PulseOscillator#
		 * @type {string}
		 * @name type
		 */
	    Object.defineProperty(Tone.PulseOscillator.prototype, 'type', {
	        get: function () {
	            return 'pulse';
	        }
	    });
	    /**
		 *  Clean up method.
		 *  @return {Tone.PulseOscillator} this
		 */
	    Tone.PulseOscillator.prototype.dispose = function () {
	        Tone.Source.prototype.dispose.call(this);
	        this._sawtooth.dispose();
	        this._sawtooth = null;
	        this._writable([
	            'width',
	            'frequency',
	            'detune'
	        ]);
	        this.width.dispose();
	        this.width = null;
	        this._widthGate.disconnect();
	        this._widthGate = null;
	        this._widthGate = null;
	        this._thresh.disconnect();
	        this._thresh = null;
	        this.frequency = null;
	        this.detune = null;
	        return this;
	    };
	    return Tone.PulseOscillator;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.PWMOscillator modulates the width of a Tone.PulseOscillator 
		 *         at the modulationFrequency. This has the effect of continuously
		 *         changing the timbre of the oscillator by altering the harmonics 
		 *         generated.
		 *
		 *  @extends {Tone.Oscillator}
		 *  @constructor
		 *  @param {Frequency} frequency The starting frequency of the oscillator. 
		 *  @param {Frequency} modulationFrequency The modulation frequency of the width of the pulse. 
		 *  @example
		 *  var pwm = new Tone.PWMOscillator("Ab3", 0.3).toMaster().start();
		 */
	    Tone.PWMOscillator = function () {
	        var options = this.optionsObject(arguments, [
	            'frequency',
	            'modulationFrequency'
	        ], Tone.PWMOscillator.defaults);
	        Tone.Source.call(this, options);
	        /**
			 *  the pulse oscillator
			 *  @type {Tone.PulseOscillator}
			 *  @private
			 */
	        this._pulse = new Tone.PulseOscillator(options.modulationFrequency);
	        //change the pulse oscillator type
	        this._pulse._sawtooth.type = 'sine';
	        /**
			 *  the modulator
			 *  @type {Tone.Oscillator}
			 *  @private
			 */
	        this._modulator = new Tone.Oscillator({
	            'frequency': options.frequency,
	            'detune': options.detune,
	            'phase': options.phase
	        });
	        /**
			 *  Scale the oscillator so it doesn't go silent 
			 *  at the extreme values.
			 *  @type {Tone.Multiply}
			 *  @private
			 */
	        this._scale = new Tone.Multiply(1.01);
	        /**
			 *  The frequency control.
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.frequency = this._modulator.frequency;
	        /**
			 *  The detune of the oscillator.
			 *  @type {Cents}
			 *  @signal
			 */
	        this.detune = this._modulator.detune;
	        /**
			 *  The modulation rate of the oscillator. 
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.modulationFrequency = this._pulse.frequency;
	        //connections
	        this._modulator.chain(this._scale, this._pulse.width);
	        this._pulse.connect(this.output);
	        this._readOnly([
	            'modulationFrequency',
	            'frequency',
	            'detune'
	        ]);
	    };
	    Tone.extend(Tone.PWMOscillator, Tone.Oscillator);
	    /**
		 *  default values
		 *  @static
		 *  @type {Object}
		 *  @const
		 */
	    Tone.PWMOscillator.defaults = {
	        'frequency': 440,
	        'detune': 0,
	        'phase': 0,
	        'modulationFrequency': 0.4
	    };
	    /**
		 *  start the oscillator
		 *  @param  {Time} [time=now]
		 *  @private
		 */
	    Tone.PWMOscillator.prototype._start = function (time) {
	        time = this.toSeconds(time);
	        this._modulator.start(time);
	        this._pulse.start(time);
	    };
	    /**
		 *  stop the oscillator
		 *  @param  {Time} time (optional) timing parameter
		 *  @private
		 */
	    Tone.PWMOscillator.prototype._stop = function (time) {
	        time = this.toSeconds(time);
	        this._modulator.stop(time);
	        this._pulse.stop(time);
	    };
	    /**
		 * The type of the oscillator. Always returns "pwm".
		 * @readOnly
		 * @memberOf Tone.PWMOscillator#
		 * @type {string}
		 * @name type
		 */
	    Object.defineProperty(Tone.PWMOscillator.prototype, 'type', {
	        get: function () {
	            return 'pwm';
	        }
	    });
	    /**
		 * The phase of the oscillator in degrees.
		 * @memberOf Tone.PWMOscillator#
		 * @type {number}
		 * @name phase
		 */
	    Object.defineProperty(Tone.PWMOscillator.prototype, 'phase', {
	        get: function () {
	            return this._modulator.phase;
	        },
	        set: function (phase) {
	            this._modulator.phase = phase;
	        }
	    });
	    /**
		 *  Clean up.
		 *  @return {Tone.PWMOscillator} this
		 */
	    Tone.PWMOscillator.prototype.dispose = function () {
	        Tone.Source.prototype.dispose.call(this);
	        this._pulse.dispose();
	        this._pulse = null;
	        this._scale.dispose();
	        this._scale = null;
	        this._modulator.dispose();
	        this._modulator = null;
	        this._writable([
	            'modulationFrequency',
	            'frequency',
	            'detune'
	        ]);
	        this.frequency = null;
	        this.detune = null;
	        this.modulationFrequency = null;
	        return this;
	    };
	    return Tone.PWMOscillator;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.OmniOscillator aggregates Tone.Oscillator, Tone.PulseOscillator,
		 *         and Tone.PWMOscillator into one class, allowing it to have the 
		 *         types: sine, square, triangle, sawtooth, pulse or pwm. Additionally,
		 *         OmniOscillator is capable of setting the first x number of partials 
		 *         of the oscillator. For example: "sine4" would set be the first 4 
		 *         partials of the sine wave and "triangle8" would set the first 
		 *         8 partials of the triangle wave. 
		 *
		 *  @extends {Tone.Oscillator}
		 *  @constructor
		 *  @param {Frequency} frequency The initial frequency of the oscillator.
		 *  @param {string} type The type of the oscillator.
		 *  @example
		 *  var omniOsc = new Tone.OmniOscillator("C#4", "pwm");
		 */
	    Tone.OmniOscillator = function () {
	        var options = this.optionsObject(arguments, [
	            'frequency',
	            'type'
	        ], Tone.OmniOscillator.defaults);
	        Tone.Source.call(this, options);
	        /**
			 *  The frequency control.
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.frequency = new Tone.Signal(options.frequency, Tone.Type.Frequency);
	        /**
			 *  The detune control
			 *  @type {Cents}
			 *  @signal
			 */
	        this.detune = new Tone.Signal(options.detune, Tone.Type.Cents);
	        /**
			 *  the type of the oscillator source
			 *  @type {string}
			 *  @private
			 */
	        this._sourceType = undefined;
	        /**
			 *  the oscillator
			 *  @type {Tone.Oscillator|Tone.PWMOscillator|Tone.PulseOscillator}
			 *  @private
			 */
	        this._oscillator = null;
	        //set the oscillator
	        this.type = options.type;
	        this.phase = options.phase;
	        this._readOnly([
	            'frequency',
	            'detune'
	        ]);
	    };
	    Tone.extend(Tone.OmniOscillator, Tone.Oscillator);
	    /**
		 *  default values
		 *  @static
		 *  @type {Object}
		 *  @const
		 */
	    Tone.OmniOscillator.defaults = {
	        'frequency': 440,
	        'detune': 0,
	        'type': 'sine',
	        'phase': 0,
	        'width': 0.4,
	        //only applies if the oscillator is set to "pulse",
	        'modulationFrequency': 0.4
	    };
	    /**
		 *  @enum {string}
		 *  @private
		 */
	    var OmniOscType = {
	        PulseOscillator: 'PulseOscillator',
	        PWMOscillator: 'PWMOscillator',
	        Oscillator: 'Oscillator'
	    };
	    /**
		 *  start the oscillator
		 *  @param {Time} [time=now] the time to start the oscillator
		 *  @private
		 */
	    Tone.OmniOscillator.prototype._start = function (time) {
	        this._oscillator.start(time);
	    };
	    /**
		 *  start the oscillator
		 *  @param {Time} [time=now] the time to start the oscillator
		 *  @private
		 */
	    Tone.OmniOscillator.prototype._stop = function (time) {
	        this._oscillator.stop(time);
	    };
	    /**
		 * The type of the oscillator. sine, square, triangle, sawtooth, pwm, or pulse. 
		 * @memberOf Tone.OmniOscillator#
		 * @type {string}
		 * @name type
		 */
	    Object.defineProperty(Tone.OmniOscillator.prototype, 'type', {
	        get: function () {
	            return this._oscillator.type;
	        },
	        set: function (type) {
	            if (type.indexOf('sine') === 0 || type.indexOf('square') === 0 || type.indexOf('triangle') === 0 || type.indexOf('sawtooth') === 0) {
	                if (this._sourceType !== OmniOscType.Oscillator) {
	                    this._sourceType = OmniOscType.Oscillator;
	                    this._createNewOscillator(Tone.Oscillator);
	                }
	                this._oscillator.type = type;
	            } else if (type === 'pwm') {
	                if (this._sourceType !== OmniOscType.PWMOscillator) {
	                    this._sourceType = OmniOscType.PWMOscillator;
	                    this._createNewOscillator(Tone.PWMOscillator);
	                }
	            } else if (type === 'pulse') {
	                if (this._sourceType !== OmniOscType.PulseOscillator) {
	                    this._sourceType = OmniOscType.PulseOscillator;
	                    this._createNewOscillator(Tone.PulseOscillator);
	                }
	            } else {
	                throw new Error('Tone.OmniOscillator does not support type ' + type);
	            }
	        }
	    });
	    /**
		 *  connect the oscillator to the frequency and detune signals
		 *  @private
		 */
	    Tone.OmniOscillator.prototype._createNewOscillator = function (OscillatorConstructor) {
	        //short delay to avoid clicks on the change
	        var now = this.now() + this.blockTime;
	        if (this._oscillator !== null) {
	            var oldOsc = this._oscillator;
	            oldOsc.stop(now);
	            //dispose the old one
	            setTimeout(function () {
	                oldOsc.dispose();
	                oldOsc = null;
	            }, this.blockTime * 1000);
	        }
	        this._oscillator = new OscillatorConstructor();
	        this.frequency.connect(this._oscillator.frequency);
	        this.detune.connect(this._oscillator.detune);
	        this._oscillator.connect(this.output);
	        if (this.state === Tone.State.Started) {
	            this._oscillator.start(now);
	        }
	    };
	    /**
		 * The phase of the oscillator in degrees. 
		 * @memberOf Tone.OmniOscillator#
		 * @type {Degrees}
		 * @name phase
		 */
	    Object.defineProperty(Tone.OmniOscillator.prototype, 'phase', {
	        get: function () {
	            return this._oscillator.phase;
	        },
	        set: function (phase) {
	            this._oscillator.phase = phase;
	        }
	    });
	    /**
		 * The width of the oscillator (only if the oscillator is set to pulse)
		 * @memberOf Tone.OmniOscillator#
		 * @type {NormalRange}
		 * @signal
		 * @name width
		 * @example
		 * var omniOsc = new Tone.OmniOscillator(440, "pulse");
		 * //can access the width attribute only if type === "pulse"
		 * omniOsc.width.value = 0.2; 
		 */
	    Object.defineProperty(Tone.OmniOscillator.prototype, 'width', {
	        get: function () {
	            if (this._sourceType === OmniOscType.PulseOscillator) {
	                return this._oscillator.width;
	            }
	        }
	    });
	    /**
		 * The modulationFrequency Signal of the oscillator 
		 * (only if the oscillator type is set to pwm).
		 * @memberOf Tone.OmniOscillator#
		 * @type {Frequency}
		 * @signal
		 * @name modulationFrequency
		 * @example
		 * var omniOsc = new Tone.OmniOscillator(440, "pwm");
		 * //can access the modulationFrequency attribute only if type === "pwm"
		 * omniOsc.modulationFrequency.value = 0.2; 
		 */
	    Object.defineProperty(Tone.OmniOscillator.prototype, 'modulationFrequency', {
	        get: function () {
	            if (this._sourceType === OmniOscType.PWMOscillator) {
	                return this._oscillator.modulationFrequency;
	            }
	        }
	    });
	    /**
		 *  Clean up.
		 *  @return {Tone.OmniOscillator} this
		 */
	    Tone.OmniOscillator.prototype.dispose = function () {
	        Tone.Source.prototype.dispose.call(this);
	        this._writable([
	            'frequency',
	            'detune'
	        ]);
	        this.detune.dispose();
	        this.detune = null;
	        this.frequency.dispose();
	        this.frequency = null;
	        this._oscillator.dispose();
	        this._oscillator = null;
	        this._sourceType = null;
	        return this;
	    };
	    return Tone.OmniOscillator;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Base-class for all instruments
		 *  
		 *  @constructor
		 *  @extends {Tone}
		 */
	    Tone.Instrument = function (options) {
	        //get the defaults
	        options = this.defaultArg(options, Tone.Instrument.defaults);
	        /**
			 *  The volume node. 
			 *  @type  {Tone.Volume}
			 *  @private
			 */
	        this._volume = this.output = new Tone.Volume(options.volume);
	        /**
			 * The volume of the output in decibels.
			 * @type {Decibels}
			 * @signal
			 * @example
			 * source.volume.value = -6;
			 */
	        this.volume = this._volume.volume;
	        this._readOnly('volume');
	    };
	    Tone.extend(Tone.Instrument);
	    /**
		 *  the default attributes
		 *  @type {object}
		 */
	    Tone.Instrument.defaults = {
	        /** the volume of the output in decibels */
	        'volume': 0
	    };
	    /**
		 *  @abstract
		 *  @param {string|number} note the note to trigger
		 *  @param {Time} [time=now] the time to trigger the ntoe
		 *  @param {number} [velocity=1] the velocity to trigger the note
		 */
	    Tone.Instrument.prototype.triggerAttack = Tone.noOp;
	    /**
		 *  @abstract
		 *  @param {Time} [time=now] when to trigger the release
		 */
	    Tone.Instrument.prototype.triggerRelease = Tone.noOp;
	    /**
		 *  Trigger the attack and then the release after the duration. 
		 *  @param  {Frequency} note     The note to trigger.
		 *  @param  {Time} duration How long the note should be held for before
		 *                          triggering the release.
		 *  @param {Time} [time=now]  When the note should be triggered.
		 *  @param  {NormalRange} [velocity=1] The velocity the note should be triggered at.
		 *  @returns {Tone.Instrument} this
		 *  @example
		 * //trigger "C4" for the duration of an 8th note
		 * synth.triggerAttackRelease("C4", "8n");
		 */
	    Tone.Instrument.prototype.triggerAttackRelease = function (note, duration, time, velocity) {
	        time = this.toSeconds(time);
	        duration = this.toSeconds(duration);
	        this.triggerAttack(note, time, velocity);
	        this.triggerRelease(time + duration);
	        return this;
	    };
	    /**
		 *  clean up
		 *  @returns {Tone.Instrument} this
		 */
	    Tone.Instrument.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._volume.dispose();
	        this._volume = null;
	        this._writable(['volume']);
	        this.volume = null;
	        return this;
	    };
	    return Tone.Instrument;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  This is a base class for monophonic instruments. 
		 *
		 *  @constructor
		 *  @abstract
		 *  @extends {Tone.Instrument}
		 */
	    Tone.Monophonic = function (options) {
	        //get the defaults
	        options = this.defaultArg(options, Tone.Monophonic.defaults);
	        Tone.Instrument.call(this, options);
	        /**
			 *  The glide time between notes. 
			 *  @type {Time}
			 */
	        this.portamento = options.portamento;
	    };
	    Tone.extend(Tone.Monophonic, Tone.Instrument);
	    /**
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
	    Tone.Monophonic.defaults = { 'portamento': 0 };
	    /**
		 *  Trigger the attack of the note optionally with a given velocity. 
		 *  
		 *  
		 *  @param  {Frequency} note     The note to trigger.
		 *  @param  {Time} [time=now]     When the note should start.
		 *  @param  {number} [velocity=1] velocity The velocity scaler 
		 *                                determines how "loud" the note 
		 *                                will be triggered.
		 *  @returns {Tone.Monophonic} this
		 *  @example
		 * synth.triggerAttack("C4");
		 *  @example
		 * //trigger the note a half second from now at half velocity
		 * synth.triggerAttack("C4", "+0.5", 0.5);
		 */
	    Tone.Monophonic.prototype.triggerAttack = function (note, time, velocity) {
	        time = this.toSeconds(time);
	        this._triggerEnvelopeAttack(time, velocity);
	        this.setNote(note, time);
	        return this;
	    };
	    /**
		 *  Trigger the release portion of the envelope
		 *  @param  {Time} [time=now] If no time is given, the release happens immediatly
		 *  @returns {Tone.Monophonic} this
		 *  @example
		 * synth.triggerRelease();
		 */
	    Tone.Monophonic.prototype.triggerRelease = function (time) {
	        this._triggerEnvelopeRelease(time);
	        return this;
	    };
	    /**
		 *  override this method with the actual method
		 *  @abstract
		 *  @private
		 */
	    Tone.Monophonic.prototype._triggerEnvelopeAttack = function () {
	    };
	    /**
		 *  override this method with the actual method
		 *  @abstract
		 *  @private
		 */
	    Tone.Monophonic.prototype._triggerEnvelopeRelease = function () {
	    };
	    /**
		 *  Set the note at the given time. If no time is given, the note
		 *  will set immediately. 
		 *  @param {Frequency} note The note to change to.
		 *  @param  {Time} [time=now] The time when the note should be set. 
		 *  @returns {Tone.Monophonic} this
		 * @example
		 * //change to F#6 in one quarter note from now.
		 * synth.setNote("F#6", "+4n");
		 * @example
		 * //change to Bb4 right now
		 * synth.setNote("Bb4");
		 */
	    Tone.Monophonic.prototype.setNote = function (note, time) {
	        time = this.toSeconds(time);
	        if (this.portamento > 0) {
	            var currentNote = this.frequency.value;
	            this.frequency.setValueAtTime(currentNote, time);
	            var portTime = this.toSeconds(this.portamento);
	            this.frequency.exponentialRampToValueAtTime(note, time + portTime);
	        } else {
	            this.frequency.setValueAtTime(note, time);
	        }
	        return this;
	    };
	    return Tone.Monophonic;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.MonoSynth is composed of one oscillator, one filter, and two envelopes.
		 *          The amplitude of the Tone.Oscillator and the cutoff frequency of the 
		 *          Tone.Filter are controlled by Tone.Envelopes. 
		 *          <img src="https://docs.google.com/drawings/d/1gaY1DF9_Hzkodqf8JI1Cg2VZfwSElpFQfI94IQwad38/pub?w=924&h=240">
		 *          
		 *  @constructor
		 *  @extends {Tone.Monophonic}
		 *  @param {Object} [options] the options available for the synth 
		 *                          see defaults below
		 *  @example
		 * var synth = new Tone.MonoSynth({
		 * 	"oscillator" : {
		 * 		"type" : "square"
		 *  },
		 *  "envelope" : {
		 *  	"attack" : 0.1
		 *  }
		 * }).toMaster();
		 * synth.triggerAttackRelease("C4", "8n");
		 */
	    Tone.MonoSynth = function (options) {
	        //get the defaults
	        options = this.defaultArg(options, Tone.MonoSynth.defaults);
	        Tone.Monophonic.call(this, options);
	        /**
			 *  The oscillator.
			 *  @type {Tone.OmniOscillator}
			 */
	        this.oscillator = new Tone.OmniOscillator(options.oscillator);
	        /**
			 *  The frequency control.
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.frequency = this.oscillator.frequency;
	        /**
			 *  The detune control.
			 *  @type {Cents}
			 *  @signal
			 */
	        this.detune = this.oscillator.detune;
	        /**
			 *  The filter.
			 *  @type {Tone.Filter}
			 */
	        this.filter = new Tone.Filter(options.filter);
	        /**
			 *  The filter envelope.
			 *  @type {Tone.ScaledEnvelope}
			 */
	        this.filterEnvelope = new Tone.ScaledEnvelope(options.filterEnvelope);
	        /**
			 *  The amplitude envelope.
			 *  @type {Tone.AmplitudeEnvelope}
			 */
	        this.envelope = new Tone.AmplitudeEnvelope(options.envelope);
	        //connect the oscillators to the output
	        this.oscillator.chain(this.filter, this.envelope, this.output);
	        //start the oscillators
	        this.oscillator.start();
	        //connect the filter envelope
	        this.filterEnvelope.connect(this.filter.frequency);
	        this._readOnly([
	            'oscillator',
	            'frequency',
	            'detune',
	            'filter',
	            'filterEnvelope',
	            'envelope'
	        ]);
	    };
	    Tone.extend(Tone.MonoSynth, Tone.Monophonic);
	    /**
		 *  @const
		 *  @static
		 *  @type {Object}
		 */
	    Tone.MonoSynth.defaults = {
	        'frequency': 'C4',
	        'detune': 0,
	        'oscillator': { 'type': 'square' },
	        'filter': {
	            'Q': 6,
	            'type': 'lowpass',
	            'rolloff': -24
	        },
	        'envelope': {
	            'attack': 0.005,
	            'decay': 0.1,
	            'sustain': 0.9,
	            'release': 1
	        },
	        'filterEnvelope': {
	            'attack': 0.06,
	            'decay': 0.2,
	            'sustain': 0.5,
	            'release': 2,
	            'min': 20,
	            'max': 4000,
	            'exponent': 2
	        }
	    };
	    /**
		 *  start the attack portion of the envelope
		 *  @param {Time} [time=now] the time the attack should start
		 *  @param {NormalRange} [velocity=1] the velocity of the note (0-1)
		 *  @returns {Tone.MonoSynth} this
		 *  @private
		 */
	    Tone.MonoSynth.prototype._triggerEnvelopeAttack = function (time, velocity) {
	        //the envelopes
	        this.envelope.triggerAttack(time, velocity);
	        this.filterEnvelope.triggerAttack(time);
	        return this;
	    };
	    /**
		 *  start the release portion of the envelope
		 *  @param {Time} [time=now] the time the release should start
		 *  @returns {Tone.MonoSynth} this
		 *  @private
		 */
	    Tone.MonoSynth.prototype._triggerEnvelopeRelease = function (time) {
	        this.envelope.triggerRelease(time);
	        this.filterEnvelope.triggerRelease(time);
	        return this;
	    };
	    /**
		 *  clean up
		 *  @returns {Tone.MonoSynth} this
		 */
	    Tone.MonoSynth.prototype.dispose = function () {
	        Tone.Monophonic.prototype.dispose.call(this);
	        this._writable([
	            'oscillator',
	            'frequency',
	            'detune',
	            'filter',
	            'filterEnvelope',
	            'envelope'
	        ]);
	        this.oscillator.dispose();
	        this.oscillator = null;
	        this.envelope.dispose();
	        this.envelope = null;
	        this.filterEnvelope.dispose();
	        this.filterEnvelope = null;
	        this.filter.dispose();
	        this.filter = null;
	        this.frequency = null;
	        this.detune = null;
	        return this;
	    };
	    return Tone.MonoSynth;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  AMSynth uses the output of one Tone.MonoSynth to modulate the
		 *          amplitude of another Tone.MonoSynth. The harmonicity (the ratio between
		 *          the two signals) affects the timbre of the output signal the most.
		 *          Read more about Amplitude Modulation Synthesis on 
		 *          [SoundOnSound](http://www.soundonsound.com/sos/mar00/articles/synthsecrets.htm).
		 *          <img src="https://docs.google.com/drawings/d/1TQu8Ed4iFr1YTLKpB3U1_hur-UwBrh5gdBXc8BxfGKw/pub?w=1009&h=457">
		 *
		 *  @constructor
		 *  @extends {Tone.Monophonic}
		 *  @param {Object} [options] the options available for the synth 
		 *                            see defaults below
		 *  @example
		 * var synth = new Tone.AMSynth().toMaster();
		 * synth.triggerAttackRelease("C4", "4n");
		 */
	    Tone.AMSynth = function (options) {
	        options = this.defaultArg(options, Tone.AMSynth.defaults);
	        Tone.Monophonic.call(this, options);
	        /**
			 *  The carrier voice. 
			 *  @type {Tone.MonoSynth}
			 */
	        this.carrier = new Tone.MonoSynth(options.carrier);
	        this.carrier.volume.value = -10;
	        /**
			 *  The modulator voice. 
			 *  @type {Tone.MonoSynth}
			 */
	        this.modulator = new Tone.MonoSynth(options.modulator);
	        this.modulator.volume.value = -10;
	        /**
			 *  The frequency.
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.frequency = new Tone.Signal(440, Tone.Type.Frequency);
	        /**
			 *  Harmonicity is the ratio between the two voices. A harmonicity of
			 *  1 is no change. Harmonicity = 2 means a change of an octave. 
			 *  @type {Positive}
			 *  @signal
			 *  @example
			 * //pitch voice1 an octave below voice0
			 * synth.harmonicity.value = 0.5;
			 */
	        this.harmonicity = new Tone.Multiply(options.harmonicity);
	        this.harmonicity.units = Tone.Type.Positive;
	        /**
			 *  convert the -1,1 output to 0,1
			 *  @type {Tone.AudioToGain}
			 *  @private
			 */
	        this._modulationScale = new Tone.AudioToGain();
	        /**
			 *  the node where the modulation happens
			 *  @type {GainNode}
			 *  @private
			 */
	        this._modulationNode = this.context.createGain();
	        //control the two voices frequency
	        this.frequency.connect(this.carrier.frequency);
	        this.frequency.chain(this.harmonicity, this.modulator.frequency);
	        this.modulator.chain(this._modulationScale, this._modulationNode.gain);
	        this.carrier.chain(this._modulationNode, this.output);
	        this._readOnly([
	            'carrier',
	            'modulator',
	            'frequency',
	            'harmonicity'
	        ]);
	    };
	    Tone.extend(Tone.AMSynth, Tone.Monophonic);
	    /**
		 *  @static
		 *  @type {Object}
		 */
	    Tone.AMSynth.defaults = {
	        'harmonicity': 3,
	        'carrier': {
	            'volume': -10,
	            'oscillator': { 'type': 'sine' },
	            'envelope': {
	                'attack': 0.01,
	                'decay': 0.01,
	                'sustain': 1,
	                'release': 0.5
	            },
	            'filterEnvelope': {
	                'attack': 0.01,
	                'decay': 0,
	                'sustain': 1,
	                'release': 0.5,
	                'min': 20000,
	                'max': 20000
	            },
	            'filter': {
	                'Q': 6,
	                'type': 'lowpass',
	                'rolloff': -24
	            }
	        },
	        'modulator': {
	            'volume': -10,
	            'oscillator': { 'type': 'square' },
	            'envelope': {
	                'attack': 2,
	                'decay': 0,
	                'sustain': 1,
	                'release': 0.5
	            },
	            'filterEnvelope': {
	                'attack': 4,
	                'decay': 0.2,
	                'sustain': 0.5,
	                'release': 0.5,
	                'min': 20,
	                'max': 1500
	            },
	            'filter': {
	                'Q': 6,
	                'type': 'lowpass',
	                'rolloff': -24
	            }
	        }
	    };
	    /**
		 *  trigger the attack portion of the note
		 *  
		 *  @param  {Time} [time=now] the time the note will occur
		 *  @param {NormalRange} [velocity=1] the velocity of the note
		 *  @private
		 *  @returns {Tone.AMSynth} this
		 */
	    Tone.AMSynth.prototype._triggerEnvelopeAttack = function (time, velocity) {
	        //the port glide
	        time = this.toSeconds(time);
	        //the envelopes
	        this.carrier.envelope.triggerAttack(time, velocity);
	        this.modulator.envelope.triggerAttack(time);
	        this.carrier.filterEnvelope.triggerAttack(time);
	        this.modulator.filterEnvelope.triggerAttack(time);
	        return this;
	    };
	    /**
		 *  trigger the release portion of the note
		 *  
		 *  @param  {Time} [time=now] the time the note will release
		 *  @private
		 *  @returns {Tone.AMSynth} this
		 */
	    Tone.AMSynth.prototype._triggerEnvelopeRelease = function (time) {
	        this.carrier.triggerRelease(time);
	        this.modulator.triggerRelease(time);
	        return this;
	    };
	    /**
		 *  clean up
		 *  @returns {Tone.AMSynth} this
		 */
	    Tone.AMSynth.prototype.dispose = function () {
	        Tone.Monophonic.prototype.dispose.call(this);
	        this._writable([
	            'carrier',
	            'modulator',
	            'frequency',
	            'harmonicity'
	        ]);
	        this.carrier.dispose();
	        this.carrier = null;
	        this.modulator.dispose();
	        this.modulator = null;
	        this.frequency.dispose();
	        this.frequency = null;
	        this.harmonicity.dispose();
	        this.harmonicity = null;
	        this._modulationScale.dispose();
	        this._modulationScale = null;
	        this._modulationNode.disconnect();
	        this._modulationNode = null;
	        return this;
	    };
	    return Tone.AMSynth;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.DrumSynth makes kick and tom sounds using a single oscillator
		 *          with an amplitude envelope and frequency ramp. A Tone.Oscillator
		 *          is routed through a Tone.AmplitudeEnvelope to the output. The drum
		 *          quality of the sound comes from the frequency envelope applied
		 *          during during Tone.DrumSynth.triggerAttack(note). The frequency
		 *          envelope starts at <code>note * .octaves</code> and ramps to 
		 *          <code>note</code> over the duration of <code>.pitchDecay</code>. 
		 *
		 *  @constructor
		 *  @extends {Tone.Instrument}
		 *  @param {Object} [options] the options available for the synth 
		 *                          see defaults below
		 *  @example
		 * var synth = new Tone.DrumSynth().toMaster();
		 * synth.triggerAttackRelease("C2", "8n");
		 */
	    Tone.DrumSynth = function (options) {
	        options = this.defaultArg(options, Tone.DrumSynth.defaults);
	        Tone.Instrument.call(this, options);
	        /**
			 *  The oscillator.
			 *  @type {Tone.Oscillator}
			 */
	        this.oscillator = new Tone.Oscillator(options.oscillator).start();
	        /**
			 *  The amplitude envelope.
			 *  @type {Tone.AmplitudeEnvelope}
			 */
	        this.envelope = new Tone.AmplitudeEnvelope(options.envelope);
	        /**
			 *  The number of octaves the pitch envelope ramps.
			 *  @type {Positive}
			 */
	        this.octaves = options.octaves;
	        /**
			 *  The amount of time the frequency envelope takes. 
			 *  @type {Time}
			 */
	        this.pitchDecay = options.pitchDecay;
	        this.oscillator.chain(this.envelope, this.output);
	        this._readOnly([
	            'oscillator',
	            'envelope'
	        ]);
	    };
	    Tone.extend(Tone.DrumSynth, Tone.Instrument);
	    /**
		 *  @static
		 *  @type {Object}
		 */
	    Tone.DrumSynth.defaults = {
	        'pitchDecay': 0.05,
	        'octaves': 10,
	        'oscillator': { 'type': 'sine' },
	        'envelope': {
	            'attack': 0.001,
	            'decay': 0.4,
	            'sustain': 0.01,
	            'release': 1.4,
	            'attackCurve': 'exponential'
	        }
	    };
	    /**
		 *  Trigger the note at the given time with the given velocity. 
		 *  
		 *  @param  {Frequency} note     the note
		 *  @param  {Time} [time=now]     the time, if not given is now
		 *  @param  {number} [velocity=1] velocity defaults to 1
		 *  @returns {Tone.DrumSynth} this
		 *  @example
		 *  kick.triggerAttack(60);
		 */
	    Tone.DrumSynth.prototype.triggerAttack = function (note, time, velocity) {
	        time = this.toSeconds(time);
	        note = this.toFrequency(note);
	        var maxNote = note * this.octaves;
	        this.oscillator.frequency.setValueAtTime(maxNote, time);
	        this.oscillator.frequency.exponentialRampToValueAtTime(note, time + this.toSeconds(this.pitchDecay));
	        this.envelope.triggerAttack(time, velocity);
	        return this;
	    };
	    /**
		 *  Trigger the release portion of the note.
		 *  
		 *  @param  {Time} [time=now] the time the note will release
		 *  @returns {Tone.DrumSynth} this
		 */
	    Tone.DrumSynth.prototype.triggerRelease = function (time) {
	        this.envelope.triggerRelease(time);
	        return this;
	    };
	    /**
		 *  Clean up.
		 *  @returns {Tone.DrumSynth} this
		 */
	    Tone.DrumSynth.prototype.dispose = function () {
	        Tone.Instrument.prototype.dispose.call(this);
	        this._writable([
	            'oscillator',
	            'envelope'
	        ]);
	        this.oscillator.dispose();
	        this.oscillator = null;
	        this.envelope.dispose();
	        this.envelope = null;
	        return this;
	    };
	    return Tone.DrumSynth;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.DuoSynth is a monophonic synth composed of two 
		 *          MonoSynths run in parallel with control over the 
		 *          frequency ratio between the two voices and vibrato effect.
		 *          <img src="https://docs.google.com/drawings/d/1bL4GXvfRMMlqS7XyBm9CjL9KJPSUKbcdBNpqOlkFLxk/pub?w=1012&h=448">
		 *
		 *  @constructor
		 *  @extends {Tone.Monophonic}
		 *  @param {Object} [options] the options available for the synth 
		 *                          see defaults below
		 *  @example
		 * var duoSynth = new Tone.DuoSynth().toMaster();
		 * duoSynth.triggerAttackRelease("C4", "2n");
		 */
	    Tone.DuoSynth = function (options) {
	        options = this.defaultArg(options, Tone.DuoSynth.defaults);
	        Tone.Monophonic.call(this, options);
	        /**
			 *  the first voice
			 *  @type {Tone.MonoSynth}
			 */
	        this.voice0 = new Tone.MonoSynth(options.voice0);
	        this.voice0.volume.value = -10;
	        /**
			 *  the second voice
			 *  @type {Tone.MonoSynth}
			 */
	        this.voice1 = new Tone.MonoSynth(options.voice1);
	        this.voice1.volume.value = -10;
	        /**
			 *  The vibrato LFO. 
			 *  @type {Tone.LFO}
			 *  @private
			 */
	        this._vibrato = new Tone.LFO(options.vibratoRate, -50, 50);
	        this._vibrato.start();
	        /**
			 * the vibrato frequency
			 * @type {Frequency}
			 * @signal
			 */
	        this.vibratoRate = this._vibrato.frequency;
	        /**
			 *  the vibrato gain
			 *  @type {GainNode}
			 *  @private
			 */
	        this._vibratoGain = this.context.createGain();
	        /**
			 * The amount of vibrato
			 * @type {Gain}
			 * @signal
			 */
	        this.vibratoAmount = new Tone.Signal(this._vibratoGain.gain, Tone.Type.Gain);
	        this.vibratoAmount.value = options.vibratoAmount;
	        /**
			 *  the delay before the vibrato starts
			 *  @type {number}
			 *  @private
			 */
	        this._vibratoDelay = this.toSeconds(options.vibratoDelay);
	        /**
			 *  the frequency control
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.frequency = new Tone.Signal(440, Tone.Type.Frequency);
	        /**
			 *  Harmonicity is the ratio between the two voices. A harmonicity of
			 *  1 is no change. Harmonicity = 2 means a change of an octave. 
			 *  @type {Positive}
			 *  @signal
			 *  @example
			 * //pitch voice1 an octave below voice0
			 * duoSynth.harmonicity.value = 0.5;
			 */
	        this.harmonicity = new Tone.Multiply(options.harmonicity);
	        this.harmonicity.units = Tone.Type.Positive;
	        //control the two voices frequency
	        this.frequency.connect(this.voice0.frequency);
	        this.frequency.chain(this.harmonicity, this.voice1.frequency);
	        this._vibrato.connect(this._vibratoGain);
	        this._vibratoGain.fan(this.voice0.detune, this.voice1.detune);
	        this.voice0.connect(this.output);
	        this.voice1.connect(this.output);
	        this._readOnly([
	            'voice0',
	            'voice1',
	            'frequency',
	            'vibratoAmount',
	            'vibratoRate'
	        ]);
	    };
	    Tone.extend(Tone.DuoSynth, Tone.Monophonic);
	    /**
		 *  @static
		 *  @type {Object}
		 */
	    Tone.DuoSynth.defaults = {
	        'vibratoAmount': 0.5,
	        'vibratoRate': 5,
	        'vibratoDelay': 1,
	        'harmonicity': 1.5,
	        'voice0': {
	            'volume': -10,
	            'portamento': 0,
	            'oscillator': { 'type': 'sine' },
	            'filterEnvelope': {
	                'attack': 0.01,
	                'decay': 0,
	                'sustain': 1,
	                'release': 0.5
	            },
	            'envelope': {
	                'attack': 0.01,
	                'decay': 0,
	                'sustain': 1,
	                'release': 0.5
	            }
	        },
	        'voice1': {
	            'volume': -10,
	            'portamento': 0,
	            'oscillator': { 'type': 'sine' },
	            'filterEnvelope': {
	                'attack': 0.01,
	                'decay': 0,
	                'sustain': 1,
	                'release': 0.5
	            },
	            'envelope': {
	                'attack': 0.01,
	                'decay': 0,
	                'sustain': 1,
	                'release': 0.5
	            }
	        }
	    };
	    /**
		 *  start the attack portion of the envelopes
		 *  
		 *  @param {Time} [time=now] the time the attack should start
		 *  @param {NormalRange} [velocity=1] the velocity of the note (0-1)
		 *  @returns {Tone.DuoSynth} this
		 *  @private
		 */
	    Tone.DuoSynth.prototype._triggerEnvelopeAttack = function (time, velocity) {
	        time = this.toSeconds(time);
	        this.voice0.envelope.triggerAttack(time, velocity);
	        this.voice1.envelope.triggerAttack(time, velocity);
	        this.voice0.filterEnvelope.triggerAttack(time);
	        this.voice1.filterEnvelope.triggerAttack(time);
	        return this;
	    };
	    /**
		 *  start the release portion of the envelopes
		 *  
		 *  @param {Time} [time=now] the time the release should start
		 *  @returns {Tone.DuoSynth} this
		 *  @private
		 */
	    Tone.DuoSynth.prototype._triggerEnvelopeRelease = function (time) {
	        this.voice0.triggerRelease(time);
	        this.voice1.triggerRelease(time);
	        return this;
	    };
	    /**
		 *  clean up
		 *  @returns {Tone.DuoSynth} this
		 */
	    Tone.DuoSynth.prototype.dispose = function () {
	        Tone.Monophonic.prototype.dispose.call(this);
	        this._writable([
	            'voice0',
	            'voice1',
	            'frequency',
	            'vibratoAmount',
	            'vibratoRate'
	        ]);
	        this.voice0.dispose();
	        this.voice0 = null;
	        this.voice1.dispose();
	        this.voice1 = null;
	        this.frequency.dispose();
	        this.frequency = null;
	        this._vibrato.dispose();
	        this._vibrato = null;
	        this._vibratoGain.disconnect();
	        this._vibratoGain = null;
	        this.harmonicity.dispose();
	        this.harmonicity = null;
	        this.vibratoAmount.dispose();
	        this.vibratoAmount = null;
	        this.vibratoRate = null;
	        return this;
	    };
	    return Tone.DuoSynth;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  FMSynth is composed of two Tone.MonoSynths where one Tone.MonoSynth modulates
		 *          the frequency of a second Tone.MonoSynth. A lot of spectral content 
		 *          can be explored using the modulationIndex parameter. Read more about
		 *          frequency modulation synthesis on [SoundOnSound](http://www.soundonsound.com/sos/apr00/articles/synthsecrets.htm).
		 *          <img src="https://docs.google.com/drawings/d/1h0PUDZXPgi4Ikx6bVT6oncrYPLluFKy7lj53puxj-DM/pub?w=902&h=462">
		 *
		 *  @constructor
		 *  @extends {Tone.Monophonic}
		 *  @param {Object} [options] the options available for the synth 
		 *                          see defaults below
		 *  @example
		 * var fmSynth = new Tone.FMSynth().toMaster();
		 * fmSynth.triggerAttackRelease("C5", "4n");
		 */
	    Tone.FMSynth = function (options) {
	        options = this.defaultArg(options, Tone.FMSynth.defaults);
	        Tone.Monophonic.call(this, options);
	        /**
			 *  The carrier voice.
			 *  @type {Tone.MonoSynth}
			 */
	        this.carrier = new Tone.MonoSynth(options.carrier);
	        this.carrier.volume.value = -10;
	        /**
			 *  The modulator voice.
			 *  @type {Tone.MonoSynth}
			 */
	        this.modulator = new Tone.MonoSynth(options.modulator);
	        this.modulator.volume.value = -10;
	        /**
			 *  The frequency control.
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.frequency = new Tone.Signal(440, Tone.Type.Frequency);
	        /**
			 *  Harmonicity is the ratio between the two voices. A harmonicity of
			 *  1 is no change. Harmonicity = 2 means a change of an octave. 
			 *  @type {Positive}
			 *  @signal
			 *  @example
			 * //pitch voice1 an octave below voice0
			 * synth.harmonicity.value = 0.5;
			 */
	        this.harmonicity = new Tone.Multiply(options.harmonicity);
	        this.harmonicity.units = Tone.Type.Positive;
	        /**
			 *  The modulation index which essentially the depth or amount of the modulation. It is the 
			 *  ratio of the frequency of the modulating signal (mf) to the amplitude of the 
			 *  modulating signal (ma) -- as in ma/mf. 
			 *	@type {Positive}
			 *	@signal
			 */
	        this.modulationIndex = new Tone.Multiply(options.modulationIndex);
	        this.modulationIndex.units = Tone.Type.Positive;
	        /**
			 *  the node where the modulation happens
			 *  @type {GainNode}
			 *  @private
			 */
	        this._modulationNode = this.context.createGain();
	        //control the two voices frequency
	        this.frequency.connect(this.carrier.frequency);
	        this.frequency.chain(this.harmonicity, this.modulator.frequency);
	        this.frequency.chain(this.modulationIndex, this._modulationNode);
	        this.modulator.connect(this._modulationNode.gain);
	        this._modulationNode.gain.value = 0;
	        this._modulationNode.connect(this.carrier.frequency);
	        this.carrier.connect(this.output);
	        this._readOnly([
	            'carrier',
	            'modulator',
	            'frequency',
	            'harmonicity',
	            'modulationIndex'
	        ]);
	    };
	    Tone.extend(Tone.FMSynth, Tone.Monophonic);
	    /**
		 *  @static
		 *  @type {Object}
		 */
	    Tone.FMSynth.defaults = {
	        'harmonicity': 3,
	        'modulationIndex': 10,
	        'carrier': {
	            'volume': -10,
	            'portamento': 0,
	            'oscillator': { 'type': 'sine' },
	            'envelope': {
	                'attack': 0.01,
	                'decay': 0,
	                'sustain': 1,
	                'release': 0.5
	            },
	            'filterEnvelope': {
	                'attack': 0.01,
	                'decay': 0,
	                'sustain': 1,
	                'release': 0.5,
	                'min': 20000,
	                'max': 20000
	            }
	        },
	        'modulator': {
	            'volume': -10,
	            'portamento': 0,
	            'oscillator': { 'type': 'triangle' },
	            'envelope': {
	                'attack': 0.01,
	                'decay': 0,
	                'sustain': 1,
	                'release': 0.5
	            },
	            'filterEnvelope': {
	                'attack': 0.01,
	                'decay': 0,
	                'sustain': 1,
	                'release': 0.5,
	                'min': 20000,
	                'max': 20000
	            }
	        }
	    };
	    /**
		 * 	trigger the attack portion of the note
		 *  
		 *  @param  {Time} [time=now] the time the note will occur
		 *  @param {number} [velocity=1] the velocity of the note
		 *  @returns {Tone.FMSynth} this
		 *  @private
		 */
	    Tone.FMSynth.prototype._triggerEnvelopeAttack = function (time, velocity) {
	        //the port glide
	        time = this.toSeconds(time);
	        //the envelopes
	        this.carrier.envelope.triggerAttack(time, velocity);
	        this.modulator.envelope.triggerAttack(time);
	        this.carrier.filterEnvelope.triggerAttack(time);
	        this.modulator.filterEnvelope.triggerAttack(time);
	        return this;
	    };
	    /**
		 *  trigger the release portion of the note
		 *  
		 *  @param  {Time} [time=now] the time the note will release
		 *  @returns {Tone.FMSynth} this
		 *  @private
		 */
	    Tone.FMSynth.prototype._triggerEnvelopeRelease = function (time) {
	        this.carrier.triggerRelease(time);
	        this.modulator.triggerRelease(time);
	        return this;
	    };
	    /**
		 *  clean up
		 *  @returns {Tone.FMSynth} this
		 */
	    Tone.FMSynth.prototype.dispose = function () {
	        Tone.Monophonic.prototype.dispose.call(this);
	        this._writable([
	            'carrier',
	            'modulator',
	            'frequency',
	            'harmonicity',
	            'modulationIndex'
	        ]);
	        this.carrier.dispose();
	        this.carrier = null;
	        this.modulator.dispose();
	        this.modulator = null;
	        this.frequency.dispose();
	        this.frequency = null;
	        this.modulationIndex.dispose();
	        this.modulationIndex = null;
	        this.harmonicity.dispose();
	        this.harmonicity = null;
	        this._modulationNode.disconnect();
	        this._modulationNode = null;
	        return this;
	    };
	    return Tone.FMSynth;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.Noise is a noise generator. It uses looped noise buffers to save on performance.
		 *          Tone.Noise supports the noise types: "pink", "white", and "brown". Read more about
		 *          colors of noise on [Wikipedia](https://en.wikipedia.org/wiki/Colors_of_noise).
		 *
		 *  @constructor
		 *  @extends {Tone.Source}
		 *  @param {string} type the noise type (white|pink|brown)
		 *  @example
		 * //initialize the noise and start
		 * var noise = new Tone.Noise("pink").start();
		 * 
		 * //make an autofilter to shape the noise
		 * var autoFilter = new Tone.AutoFilter({
		 * 	"frequency" : "8m", 
		 * 	"min" : 800, 
		 * 	"max" : 15000
		 * }).connect(Tone.Master);
		 * 
		 * //connect the noise
		 * noise.connect(autoFilter);
		 * //start the autofilter LFO
		 * autoFilter.start()
		 */
	    Tone.Noise = function () {
	        var options = this.optionsObject(arguments, ['type'], Tone.Noise.defaults);
	        Tone.Source.call(this, options);
	        /**
			 *  @private
			 *  @type {AudioBufferSourceNode}
			 */
	        this._source = null;
	        /**
			 *  the buffer
			 *  @private
			 *  @type {AudioBuffer}
			 */
	        this._buffer = null;
	        this.type = options.type;
	    };
	    Tone.extend(Tone.Noise, Tone.Source);
	    /**
		 *  the default parameters
		 *
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
	    Tone.Noise.defaults = { 'type': 'white' };
	    /**
		 * The type of the noise. Can be "white", "brown", or "pink". 
		 * @memberOf Tone.Noise#
		 * @type {string}
		 * @name type
		 * @example
		 * noise.type = "white";
		 */
	    Object.defineProperty(Tone.Noise.prototype, 'type', {
	        get: function () {
	            if (this._buffer === _whiteNoise) {
	                return 'white';
	            } else if (this._buffer === _brownNoise) {
	                return 'brown';
	            } else if (this._buffer === _pinkNoise) {
	                return 'pink';
	            }
	        },
	        set: function (type) {
	            if (this.type !== type) {
	                switch (type) {
	                case 'white':
	                    this._buffer = _whiteNoise;
	                    break;
	                case 'pink':
	                    this._buffer = _pinkNoise;
	                    break;
	                case 'brown':
	                    this._buffer = _brownNoise;
	                    break;
	                default:
	                    throw new Error('invalid noise type: ' + type);
	                }
	                //if it's playing, stop and restart it
	                if (this.state === Tone.State.Started) {
	                    var now = this.now() + this.blockTime;
	                    //remove the listener
	                    this._source.onended = undefined;
	                    this._stop(now);
	                    this._start(now);
	                }
	            }
	        }
	    });
	    /**
		 *  internal start method
		 *
		 *  @param {Time} time
		 *  @private
		 */
	    Tone.Noise.prototype._start = function (time) {
	        this._source = this.context.createBufferSource();
	        this._source.buffer = this._buffer;
	        this._source.loop = true;
	        this._source.connect(this.output);
	        this._source.start(this.toSeconds(time));
	        this._source.onended = this.onended;
	    };
	    /**
		 *  internal stop method
		 *
		 *  @param {Time} time
		 *  @private
		 */
	    Tone.Noise.prototype._stop = function (time) {
	        if (this._source) {
	            this._source.stop(this.toSeconds(time));
	        }
	    };
	    /**
		 *  Clean up.
		 *  @returns {Tone.Noise} this
		 */
	    Tone.Noise.prototype.dispose = function () {
	        Tone.Source.prototype.dispose.call(this);
	        if (this._source !== null) {
	            this._source.disconnect();
	            this._source = null;
	        }
	        this._buffer = null;
	        return this;
	    };
	    ///////////////////////////////////////////////////////////////////////////
	    // THE BUFFERS
	    // borrowed heavily from http://noisehack.com/generate-noise-web-audio-api/
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 *	static noise buffers
		 *
		 *  @static
		 *  @private
		 *  @type {AudioBuffer}
		 */
	    var _pinkNoise = null, _brownNoise = null, _whiteNoise = null;
	    Tone._initAudioContext(function (audioContext) {
	        var sampleRate = audioContext.sampleRate;
	        //four seconds per buffer
	        var bufferLength = sampleRate * 4;
	        //fill the buffers
	        _pinkNoise = function () {
	            var buffer = audioContext.createBuffer(2, bufferLength, sampleRate);
	            for (var channelNum = 0; channelNum < buffer.numberOfChannels; channelNum++) {
	                var channel = buffer.getChannelData(channelNum);
	                var b0, b1, b2, b3, b4, b5, b6;
	                b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0;
	                for (var i = 0; i < bufferLength; i++) {
	                    var white = Math.random() * 2 - 1;
	                    b0 = 0.99886 * b0 + white * 0.0555179;
	                    b1 = 0.99332 * b1 + white * 0.0750759;
	                    b2 = 0.969 * b2 + white * 0.153852;
	                    b3 = 0.8665 * b3 + white * 0.3104856;
	                    b4 = 0.55 * b4 + white * 0.5329522;
	                    b5 = -0.7616 * b5 - white * 0.016898;
	                    channel[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
	                    channel[i] *= 0.11;
	                    // (roughly) compensate for gain
	                    b6 = white * 0.115926;
	                }
	            }
	            return buffer;
	        }();
	        _brownNoise = function () {
	            var buffer = audioContext.createBuffer(2, bufferLength, sampleRate);
	            for (var channelNum = 0; channelNum < buffer.numberOfChannels; channelNum++) {
	                var channel = buffer.getChannelData(channelNum);
	                var lastOut = 0;
	                for (var i = 0; i < bufferLength; i++) {
	                    var white = Math.random() * 2 - 1;
	                    channel[i] = (lastOut + 0.02 * white) / 1.02;
	                    lastOut = channel[i];
	                    channel[i] *= 3.5;    // (roughly) compensate for gain
	                }
	            }
	            return buffer;
	        }();
	        _whiteNoise = function () {
	            var buffer = audioContext.createBuffer(2, bufferLength, sampleRate);
	            for (var channelNum = 0; channelNum < buffer.numberOfChannels; channelNum++) {
	                var channel = buffer.getChannelData(channelNum);
	                for (var i = 0; i < bufferLength; i++) {
	                    channel[i] = Math.random() * 2 - 1;
	                }
	            }
	            return buffer;
	        }();
	    });
	    return Tone.Noise;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.NoiseSynth is composed of a noise generator (Tone.Noise), one filter (Tone.Filter), 
		 *          and two envelopes (Tone.Envelop). One envelope controls the amplitude
		 *          of the noise and the other is controls the cutoff frequency of the filter. 
		 *          <img src="https://docs.google.com/drawings/d/1rqzuX9rBlhT50MRvD2TKml9bnZhcZmzXF1rf_o7vdnE/pub?w=918&h=242">
		 *
		 *  @constructor
		 *  @extends {Tone.Instrument}
		 *  @param {Object} [options] the options available for the synth 
		 *                          see defaults below
		 * @example
		 * var noiseSynth = new Tone.NoiseSynth().toMaster();
		 * noiseSynth.triggerAttackRelease("8n");
		 */
	    Tone.NoiseSynth = function (options) {
	        //get the defaults
	        options = this.defaultArg(options, Tone.NoiseSynth.defaults);
	        Tone.Instrument.call(this, options);
	        /**
			 *  The noise source.
			 *  @type {Tone.Noise}
			 *  @example
			 * noiseSynth.set("noise.type", "brown");
			 */
	        this.noise = new Tone.Noise();
	        /**
			 *  The filter. 
			 *  @type {Tone.Filter}
			 */
	        this.filter = new Tone.Filter(options.filter);
	        /**
			 *  The filter envelope. 
			 *  @type {Tone.ScaledEnvelope}
			 */
	        this.filterEnvelope = new Tone.ScaledEnvelope(options.filterEnvelope);
	        /**
			 *  The amplitude envelope. 
			 *  @type {Tone.AmplitudeEnvelope}
			 */
	        this.envelope = new Tone.AmplitudeEnvelope(options.envelope);
	        //connect the noise to the output
	        this.noise.chain(this.filter, this.envelope, this.output);
	        //start the noise
	        this.noise.start();
	        //connect the filter envelope
	        this.filterEnvelope.connect(this.filter.frequency);
	        this._readOnly([
	            'noise',
	            'filter',
	            'filterEnvelope',
	            'envelope'
	        ]);
	    };
	    Tone.extend(Tone.NoiseSynth, Tone.Instrument);
	    /**
		 *  @const
		 *  @static
		 *  @type {Object}
		 */
	    Tone.NoiseSynth.defaults = {
	        'noise': { 'type': 'white' },
	        'filter': {
	            'Q': 6,
	            'type': 'highpass',
	            'rolloff': -24
	        },
	        'envelope': {
	            'attack': 0.005,
	            'decay': 0.1,
	            'sustain': 0
	        },
	        'filterEnvelope': {
	            'attack': 0.06,
	            'decay': 0.2,
	            'sustain': 0,
	            'release': 2,
	            'min': 20,
	            'max': 4000,
	            'exponent': 2
	        }
	    };
	    /**
		 *  Start the attack portion of the envelopes. Unlike other 
		 *  instruments, Tone.NoiseSynth doesn't have a note. 
		 *  @param {Time} [time=now] the time the attack should start
		 *  @param {number} [velocity=1] the velocity of the note (0-1)
		 *  @returns {Tone.NoiseSynth} this
		 *  @example
		 * noiseSynth.triggerAttack();
		 */
	    Tone.NoiseSynth.prototype.triggerAttack = function (time, velocity) {
	        //the envelopes
	        this.envelope.triggerAttack(time, velocity);
	        this.filterEnvelope.triggerAttack(time);
	        return this;
	    };
	    /**
		 *  Start the release portion of the envelopes.
		 *  @param {Time} [time=now] the time the release should start
		 *  @returns {Tone.NoiseSynth} this
		 */
	    Tone.NoiseSynth.prototype.triggerRelease = function (time) {
	        this.envelope.triggerRelease(time);
	        this.filterEnvelope.triggerRelease(time);
	        return this;
	    };
	    /**
		 *  Trigger the attack and then the release. 
		 *  @param  {Time} duration the duration of the note
		 *  @param  {Time} [time=now]     the time of the attack
		 *  @param  {number} [velocity=1] the velocity
		 *  @returns {Tone.NoiseSynth} this
		 */
	    Tone.NoiseSynth.prototype.triggerAttackRelease = function (duration, time, velocity) {
	        time = this.toSeconds(time);
	        duration = this.toSeconds(duration);
	        this.triggerAttack(time, velocity);
	        this.triggerRelease(time + duration);
	        return this;
	    };
	    /**
		 *  Clean up. 
		 *  @returns {Tone.NoiseSynth} this
		 */
	    Tone.NoiseSynth.prototype.dispose = function () {
	        Tone.Instrument.prototype.dispose.call(this);
	        this._writable([
	            'noise',
	            'filter',
	            'filterEnvelope',
	            'envelope'
	        ]);
	        this.noise.dispose();
	        this.noise = null;
	        this.envelope.dispose();
	        this.envelope = null;
	        this.filterEnvelope.dispose();
	        this.filterEnvelope = null;
	        this.filter.dispose();
	        this.filter = null;
	        return this;
	    };
	    return Tone.NoiseSynth;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Karplus-String string synthesis. Often out of tune. 
		 *         Will change when the AudioWorkerNode is available across
		 *         browsers. 
		 *  
		 *  @constructor
		 *  @extends {Tone.Instrument}
		 *  @param {Object} [options] see the defaults
		 *  @example
		 * var plucky = new Tone.PluckSynth().toMaster();
		 * plucky.triggerAttack("C4");
		 */
	    Tone.PluckSynth = function (options) {
	        options = this.defaultArg(options, Tone.PluckSynth.defaults);
	        Tone.Instrument.call(this, options);
	        /**
			 *  @type {Tone.Noise}
			 *  @private
			 */
	        this._noise = new Tone.Noise('pink');
	        /**
			 *  The amount of noise at the attack. 
			 *  Nominal range of [0.1, 20]
			 *  @type {number}
			 */
	        this.attackNoise = 1;
	        /**
			 *  the LFCF
			 *  @type {Tone.LowpassCombFilter}
			 *  @private
			 */
	        this._lfcf = new Tone.LowpassCombFilter({
	            'resonance': options.resonance,
	            'dampening': options.dampening
	        });
	        /**
			 *  The resonance control. 
			 *  @type {NormalRange}
			 *  @signal
			 */
	        this.resonance = this._lfcf.resonance;
	        /**
			 *  The dampening control. i.e. the lowpass filter frequency of the comb filter
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.dampening = this._lfcf.dampening;
	        //connections
	        this._noise.connect(this._lfcf);
	        this._lfcf.connect(this.output);
	        this._readOnly([
	            'resonance',
	            'dampening'
	        ]);
	    };
	    Tone.extend(Tone.PluckSynth, Tone.Instrument);
	    /**
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
	    Tone.PluckSynth.defaults = {
	        'attackNoise': 1,
	        'dampening': 4000,
	        'resonance': 0.9
	    };
	    /**
		 *  Trigger the note. 
		 *  @param {Frequency} note The note to trigger.
		 *  @param {Time} [time=now] When the note should be triggered.
		 *  @returns {Tone.PluckSynth} this
		 */
	    Tone.PluckSynth.prototype.triggerAttack = function (note, time) {
	        note = this.toFrequency(note);
	        time = this.toSeconds(time);
	        var delayAmount = 1 / note;
	        this._lfcf.delayTime.setValueAtTime(delayAmount, time);
	        this._noise.start(time);
	        this._noise.stop(time + delayAmount * this.attackNoise);
	        return this;
	    };
	    /**
		 *  Clean up. 
		 *  @returns {Tone.PluckSynth} this
		 */
	    Tone.PluckSynth.prototype.dispose = function () {
	        Tone.Instrument.prototype.dispose.call(this);
	        this._noise.dispose();
	        this._lfcf.dispose();
	        this._noise = null;
	        this._lfcf = null;
	        this._writable([
	            'resonance',
	            'dampening'
	        ]);
	        this.dampening = null;
	        this.resonance = null;
	        return this;
	    };
	    return Tone.PluckSynth;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.PolySynth handles voice creation and allocation for any
		 *          instruments passed in as the second paramter. PolySynth is 
		 *          not a synthesizer by itself, it merely manages voices of 
		 *          one of the other types of synths, allowing any of the 
		 *          monophonic synthesizers to be polyphonic. 
		 *
		 *  @constructor
		 *  @extends {Tone.Instrument}
		 *  @param {number|Object} [polyphony=4] The number of voices to create
		 *  @param {function} [voice=Tone.MonoSynth] The constructor of the voices
		 *                                            uses Tone.MonoSynth by default. 
		 *  @example
		 * //a polysynth composed of 6 Voices of MonoSynth
		 * var synth = new Tone.PolySynth(6, Tone.MonoSynth).toMaster();
		 * //set the attributes using the set interface
		 * synth.set("detune", -1200);
		 * //play a chord
		 * synth.triggerAttackRelease(["C4", "E4", "A4"], "4n");
		 */
	    Tone.PolySynth = function () {
	        Tone.Instrument.call(this);
	        var options = this.optionsObject(arguments, [
	            'polyphony',
	            'voice'
	        ], Tone.PolySynth.defaults);
	        /**
			 *  the array of voices
			 *  @type {Array}
			 */
	        this.voices = new Array(options.polyphony);
	        /**
			 *  If there are no more voices available,
			 *  should an active voice be stolen to play the new note?
			 *  @type {Boolean}
			 */
	        this.stealVoices = true;
	        /**
			 *  the queue of free voices
			 *  @private
			 *  @type {Array}
			 */
	        this._freeVoices = [];
	        /**
			 *  keeps track of which notes are down
			 *  @private
			 *  @type {Object}
			 */
	        this._activeVoices = {};
	        //create the voices
	        for (var i = 0; i < options.polyphony; i++) {
	            var v = new options.voice(arguments[2], arguments[3]);
	            this.voices[i] = v;
	            v.connect(this.output);
	        }
	        //make a copy of the voices
	        this._freeVoices = this.voices.slice(0);    //get the prototypes and properties
	    };
	    Tone.extend(Tone.PolySynth, Tone.Instrument);
	    /**
		 *  the defaults
		 *  @const
		 *  @static
		 *  @type {Object}
		 */
	    Tone.PolySynth.defaults = {
	        'polyphony': 4,
	        'voice': Tone.MonoSynth
	    };
	    /**
		 *  Trigger the attack portion of the note
		 *  @param  {Frequency|Array} notes The notes to play. Accepts a single
		 *                                  Frequency or an array of frequencies.
		 *  @param  {Time} [time=now]  The start time of the note.
		 *  @param {number} [velocity=1] The velocity of the note.
		 *  @returns {Tone.PolySynth} this
		 *  @example
		 * //trigger a chord immediately with a velocity of 0.2
		 * poly.triggerAttack(["Ab3", "C4", "F5"], undefined, 0.2);
		 */
	    Tone.PolySynth.prototype.triggerAttack = function (notes, time, velocity) {
	        if (!Array.isArray(notes)) {
	            notes = [notes];
	        }
	        for (var i = 0; i < notes.length; i++) {
	            var val = notes[i];
	            var stringified = JSON.stringify(val);
	            //retrigger the same note if possible
	            if (this._activeVoices.hasOwnProperty(stringified)) {
	                this._activeVoices[stringified].triggerAttack(val, time, velocity);
	            } else if (this._freeVoices.length > 0) {
	                var voice = this._freeVoices.shift();
	                voice.triggerAttack(val, time, velocity);
	                this._activeVoices[stringified] = voice;
	            } else if (this.stealVoices) {
	                //steal a voice				
	                //take the first voice
	                for (var voiceName in this._activeVoices) {
	                    this._activeVoices[voiceName].triggerAttack(val, time, velocity);
	                    break;
	                }
	            }
	        }
	        return this;
	    };
	    /**
		 *  Trigger the attack and release after the specified duration
		 *  
		 *  @param  {Frequency|Array} notes The notes to play. Accepts a single
		 *                                  Frequency or an array of frequencies.
		 *  @param  {Time} duration the duration of the note
		 *  @param  {Time} [time=now]     if no time is given, defaults to now
		 *  @param  {number} [velocity=1] the velocity of the attack (0-1)
		 *  @returns {Tone.PolySynth} this
		 *  @example
		 * //trigger a chord for a duration of a half note 
		 * poly.triggerAttackRelease(["Eb3", "G4", "C5"], "2n");
		 */
	    Tone.PolySynth.prototype.triggerAttackRelease = function (notes, duration, time, velocity) {
	        time = this.toSeconds(time);
	        this.triggerAttack(notes, time, velocity);
	        this.triggerRelease(notes, time + this.toSeconds(duration));
	        return this;
	    };
	    /**
		 *  Trigger the release of the note. Unlike monophonic instruments, 
		 *  a note (or array of notes) needs to be passed in as the first argument.
		 *  @param  {Frequency|Array} notes The notes to play. Accepts a single
		 *                                  Frequency or an array of frequencies.
		 *  @param  {Time} [time=now]  When the release will be triggered. 
		 *  @returns {Tone.PolySynth} this
		 *  @example
		 * poly.triggerRelease(["Ab3", "C4", "F5"], "+2n");
		 */
	    Tone.PolySynth.prototype.triggerRelease = function (notes, time) {
	        if (!Array.isArray(notes)) {
	            notes = [notes];
	        }
	        for (var i = 0; i < notes.length; i++) {
	            //get the voice
	            var stringified = JSON.stringify(notes[i]);
	            var voice = this._activeVoices[stringified];
	            if (voice) {
	                voice.triggerRelease(time);
	                this._freeVoices.push(voice);
	                delete this._activeVoices[stringified];
	                voice = null;
	            }
	        }
	        return this;
	    };
	    /**
		 *  Set a member/attribute of the voices. 
		 *  @param {Object|string} params
		 *  @param {number=} value
		 *  @param {Time=} rampTime
		 *  @returns {Tone.PolySynth} this
		 *  @example
		 * poly.set({
		 * 	"filter" : {
		 * 		"type" : "highpass"
		 * 	},
		 * 	"envelope" : {
		 * 		"attack" : 0.25
		 * 	}
		 * });
		 */
	    Tone.PolySynth.prototype.set = function (params, value, rampTime) {
	        for (var i = 0; i < this.voices.length; i++) {
	            this.voices[i].set(params, value, rampTime);
	        }
	        return this;
	    };
	    /**
		 *  Get the synth's attributes. Given no arguments get
		 *  will return all available object properties and their corresponding
		 *  values. Pass in a single attribute to retrieve or an array
		 *  of attributes. The attribute strings can also include a "."
		 *  to access deeper properties.
		 *  @param {Array=} params the parameters to get, otherwise will return 
		 *  					   all available.
		 */
	    Tone.PolySynth.prototype.get = function (params) {
	        return this.voices[0].get(params);
	    };
	    /**
		 *  @param {string} presetName the preset name
		 *  @returns {Tone.PolySynth} this
		 *  @private
		 */
	    Tone.PolySynth.prototype.setPreset = function (presetName) {
	        for (var i = 0; i < this.voices.length; i++) {
	            this.voices[i].setPreset(presetName);
	        }
	        return this;
	    };
	    /**
		 *  Trigger the release portion of all the currently active voices.
		 *  @param {Time} [time=now] When the notes should be released.
		 *  @return {Tone.PolySynth} this
		 */
	    Tone.PolySynth.prototype.releaseAll = function (time) {
	        for (var i = 0; i < this.voices.length; i++) {
	            this.voices[i].triggerRelease(time);
	        }
	        return this;
	    };
	    /**
		 *  Clean up.
		 *  @returns {Tone.PolySynth} this
		 */
	    Tone.PolySynth.prototype.dispose = function () {
	        Tone.Instrument.prototype.dispose.call(this);
	        for (var i = 0; i < this.voices.length; i++) {
	            this.voices[i].dispose();
	            this.voices[i] = null;
	        }
	        this.voices = null;
	        this._activeVoices = null;
	        this._freeVoices = null;
	        return this;
	    };
	    return Tone.PolySynth;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.Player is an audio file player with start, loop, and stop functions.
		 *  
		 *  @constructor
		 *  @extends {Tone.Source} 
		 *  @param {string|AudioBuffer} url Either the AudioBuffer or the url from
		 *                                  which to load the AudioBuffer
		 *  @param {function=} onload The function to invoke when the buffer is loaded. 
		 *                            Recommended to use Tone.Buffer.onload instead.
		 *  @example
		 * var player = new Tone.Player("./path/to/sample.mp3").toMaster();
		 * Tone.Buffer.onload = function(){
		 * 	player.start();
		 * }
		 */
	    Tone.Player = function (url) {
	        var options;
	        if (url instanceof Tone.Buffer) {
	            url = url.get();
	            options = Tone.Player.defaults;
	        } else {
	            options = this.optionsObject(arguments, [
	                'url',
	                'onload'
	            ], Tone.Player.defaults);
	        }
	        Tone.Source.call(this, options);
	        /**
			 *  @private
			 *  @type {AudioBufferSourceNode}
			 */
	        this._source = null;
	        /**
			 *  If the file should play as soon
			 *  as the buffer is loaded. 
			 *  @type {boolean}
			 *  @example
			 * //will play as soon as it's loaded
			 * var player = new Tone.Player({
			 * 	"url" : "./path/to/sample.mp3",
			 * 	"autostart" : true,
			 * }).toMaster();
			 */
	        this.autostart = options.autostart;
	        /**
			 *  the buffer
			 *  @private
			 *  @type {Tone.Buffer}
			 */
	        this._buffer = new Tone.Buffer({
	            'url': options.url,
	            'onload': this._onload.bind(this, options.onload),
	            'reverse': options.reverse
	        });
	        if (url instanceof AudioBuffer) {
	            this._buffer.set(url);
	        }
	        /**
			 *  if the buffer should loop once it's over
			 *  @type {boolean}
			 *  @private
			 */
	        this._loop = options.loop;
	        /**
			 *  if 'loop' is true, the loop will start at this position
			 *  @type {Time}
			 *  @private
			 */
	        this._loopStart = options.loopStart;
	        /**
			 *  if 'loop' is true, the loop will end at this position
			 *  @type {Time}
			 *  @private
			 */
	        this._loopEnd = options.loopEnd;
	        /**
			 *  the playback rate
			 *  @private
			 *  @type {number}
			 */
	        this._playbackRate = options.playbackRate;
	        /**
			 *  Enabling retrigger will allow a player to be restarted
			 *  before the the previous 'start' is done playing. Otherwise, 
			 *  successive calls to Tone.Player.start will only start
			 *  the sample if it had played all the way through. 
			 *  @type {boolean}
			 */
	        this.retrigger = options.retrigger;
	    };
	    Tone.extend(Tone.Player, Tone.Source);
	    /**
		 *  the default parameters
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
	    Tone.Player.defaults = {
	        'onload': Tone.noOp,
	        'playbackRate': 1,
	        'loop': false,
	        'autostart': false,
	        'loopStart': 0,
	        'loopEnd': 0,
	        'retrigger': false,
	        'reverse': false
	    };
	    /**
		 *  Load the audio file as an audio buffer.
		 *  Decodes the audio asynchronously and invokes
		 *  the callback once the audio buffer loads. 
		 *  Note: this does not need to be called if a url
		 *  was passed in to the constructor. Only use this
		 *  if you want to manually load a new url. 
		 * @param {string} url The url of the buffer to load.
		 *                     Filetype support depends on the
		 *                     browser.
		 *  @param  {function=} callback The function to invoke once
		 *                               the sample is loaded.
		 *  @returns {Tone.Player} this
		 */
	    Tone.Player.prototype.load = function (url, callback) {
	        this._buffer.load(url, this._onload.bind(this, callback));
	        return this;
	    };
	    /**
		 * Internal callback when the buffer is loaded.
		 * @private
		 */
	    Tone.Player.prototype._onload = function (callback) {
	        callback(this);
	        if (this.autostart) {
	            this.start();
	        }
	    };
	    /**
		 *  play the buffer between the desired positions
		 *  
		 *  @private
		 *  @param  {Time} [startTime=now] when the player should start.
		 *  @param  {Time} [offset=0] the offset from the beginning of the sample
		 *                                 to start at. 
		 *  @param  {Time=} duration how long the sample should play. If no duration
		 *                                is given, it will default to the full length 
		 *                                of the sample (minus any offset)
		 *  @returns {Tone.Player} this
		 */
	    Tone.Player.prototype._start = function (startTime, offset, duration) {
	        if (this._buffer.loaded) {
	            //if it's a loop the default offset is the loopstart point
	            if (this._loop) {
	                offset = this.defaultArg(offset, this._loopStart);
	            } else {
	                //otherwise the default offset is 0
	                offset = this.defaultArg(offset, 0);
	            }
	            offset = this.toSeconds(offset);
	            duration = this.defaultArg(duration, this._buffer.duration - offset);
	            //the values in seconds
	            startTime = this.toSeconds(startTime);
	            duration = this.toSeconds(duration);
	            //make the source
	            this._source = this.context.createBufferSource();
	            this._source.buffer = this._buffer.get();
	            //set the looping properties
	            if (this._loop) {
	                this._source.loop = this._loop;
	                this._source.loopStart = this.toSeconds(this._loopStart);
	                this._source.loopEnd = this.toSeconds(this._loopEnd);
	            } else {
	                //if it's not looping, set the state change at the end of the sample
	                this._state.setStateAtTime(Tone.State.Stopped, startTime + duration);
	            }
	            //and other properties
	            this._source.playbackRate.value = this._playbackRate;
	            this._source.connect(this.output);
	            //start it
	            if (this._loop) {
	                this._source.start(startTime, offset);
	            } else {
	                this._source.start(startTime, offset, duration);
	            }
	        } else {
	            throw Error('tried to start Player before the buffer was loaded');
	        }
	        return this;
	    };
	    /**
		 *  Stop playback.
		 *  @private
		 *  @param  {Time} [time=now]
		 *  @returns {Tone.Player} this
		 */
	    Tone.Player.prototype._stop = function (time) {
	        if (this._source) {
	            this._source.stop(this.toSeconds(time));
	            this._source = null;
	        }
	        return this;
	    };
	    /**
		 *  Set the loop start and end. Will only loop if loop is 
		 *  set to true. 
		 *  @param {Time} loopStart The loop end time
		 *  @param {Time} loopEnd The loop end time
		 *  @returns {Tone.Player} this
		 *  @example
		 * //loop 0.1 seconds of the file. 
		 * player.setLoopPoints(0.2, 0.3);
		 * player.loop = true;
		 */
	    Tone.Player.prototype.setLoopPoints = function (loopStart, loopEnd) {
	        this.loopStart = loopStart;
	        this.loopEnd = loopEnd;
	        return this;
	    };
	    /**
		 * If loop is true, the loop will start at this position. 
		 * @memberOf Tone.Player#
		 * @type {Time}
		 * @name loopStart
		 */
	    Object.defineProperty(Tone.Player.prototype, 'loopStart', {
	        get: function () {
	            return this._loopStart;
	        },
	        set: function (loopStart) {
	            this._loopStart = loopStart;
	            if (this._source) {
	                this._source.loopStart = this.toSeconds(loopStart);
	            }
	        }
	    });
	    /**
		 * If loop is true, the loop will end at this position.
		 * @memberOf Tone.Player#
		 * @type {Time}
		 * @name loopEnd
		 */
	    Object.defineProperty(Tone.Player.prototype, 'loopEnd', {
	        get: function () {
	            return this._loopEnd;
	        },
	        set: function (loopEnd) {
	            this._loopEnd = loopEnd;
	            if (this._source) {
	                this._source.loopEnd = this.toSeconds(loopEnd);
	            }
	        }
	    });
	    /**
		 * The audio buffer belonging to the player. 
		 * @memberOf Tone.Player#
		 * @type {Tone.Buffer}
		 * @name buffer
		 */
	    Object.defineProperty(Tone.Player.prototype, 'buffer', {
	        get: function () {
	            return this._buffer;
	        },
	        set: function (buffer) {
	            this._buffer.set(buffer);
	        }
	    });
	    /**
		 * If the buffer should loop once it's over. 
		 * @memberOf Tone.Player#
		 * @type {boolean}
		 * @name loop
		 */
	    Object.defineProperty(Tone.Player.prototype, 'loop', {
	        get: function () {
	            return this._loop;
	        },
	        set: function (loop) {
	            this._loop = loop;
	            if (this._source) {
	                this._source.loop = loop;
	            }
	        }
	    });
	    /**
		 * The playback speed. 1 is normal speed. 
		 * Note that this is not a Tone.Signal because of a bug in Blink. 
		 * Please star [this issue](https://code.google.com/p/chromium/issues/detail?id=311284)
		 * if this an important thing to you.
		 * @memberOf Tone.Player#
		 * @type {number}
		 * @name playbackRate
		 */
	    Object.defineProperty(Tone.Player.prototype, 'playbackRate', {
	        get: function () {
	            return this._playbackRate;
	        },
	        set: function (rate) {
	            this._playbackRate = rate;
	            if (this._source) {
	                this._source.playbackRate.value = rate;
	            }
	        }
	    });
	    /**
		 * The direction the buffer should play in
		 * @memberOf Tone.Player#
		 * @type {boolean}
		 * @name reverse
		 */
	    Object.defineProperty(Tone.Player.prototype, 'reverse', {
	        get: function () {
	            return this._buffer.reverse;
	        },
	        set: function (rev) {
	            this._buffer.reverse = rev;
	        }
	    });
	    /**
		 *  Dispose and disconnect.
		 *  @return {Tone.Player} this
		 */
	    Tone.Player.prototype.dispose = function () {
	        Tone.Source.prototype.dispose.call(this);
	        if (this._source !== null) {
	            this._source.disconnect();
	            this._source = null;
	        }
	        this._buffer.dispose();
	        this._buffer = null;
	        return this;
	    };
	    return Tone.Player;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class A sampler instrument which plays an audio buffer 
		 *         through an amplitude envelope and a filter envelope. The sampler takes
		 *         an Object in the constructor which maps a sample name to the URL 
		 *         of the sample. Nested Objects will be flattened and can be accessed using
		 *         a dot notation (see the example).
		 *         <img src="https://docs.google.com/drawings/d/1UK-gi_hxzKDz9Dh4ByyOptuagMOQxv52WxN12HwvtW8/pub?w=931&h=241">
		 *
		 *  @constructor
		 *  @extends {Tone.Instrument}
		 *  @param {Object|string} urls the urls of the audio file
		 *  @param {Object} [options] the options object for the synth
		 *  @example
		 * var sampler = new Sampler({
		 * 	A : {
		 * 		1 : "./audio/casio/A1.mp3",
		 * 		2 : "./audio/casio/A2.mp3",
		 * 	},
		 * 	"B.1" : "./audio/casio/B1.mp3",
		 * }).toMaster();
		 * 
		 * //listen for when all the samples have loaded
		 * Tone.Buffer.onload = function(){
		 * 	sampler.triggerAttack("A.1", time, velocity);
		 * };
		 */
	    Tone.Sampler = function (urls, options) {
	        options = this.defaultArg(options, Tone.Sampler.defaults);
	        Tone.Instrument.call(this, options);
	        /**
			 *  The sample player.
			 *  @type {Tone.Player}
			 */
	        this.player = new Tone.Player(options.player);
	        this.player.retrigger = true;
	        /**
			 *  the buffers
			 *  @type {Object}
			 *  @private
			 */
	        this._buffers = {};
	        /**
			 *  The amplitude envelope. 
			 *  @type {Tone.AmplitudeEnvelope}
			 */
	        this.envelope = new Tone.AmplitudeEnvelope(options.envelope);
	        /**
			 *  The filter envelope. 
			 *  @type {Tone.ScaledEnvelope}
			 */
	        this.filterEnvelope = new Tone.ScaledEnvelope(options.filterEnvelope);
	        /**
			 *  The name of the current sample. 
			 *  @type {string}
			 *  @private
			 */
	        this._sample = options.sample;
	        /**
			 * the private reference to the pitch
			 * @type {number}
			 * @private
			 */
	        this._pitch = options.pitch;
	        /**
			 *  The filter.
			 *  @type {Tone.Filter}
			 */
	        this.filter = new Tone.Filter(options.filter);
	        //connections / setup
	        this._loadBuffers(urls);
	        this.pitch = options.pitch;
	        this.player.chain(this.filter, this.envelope, this.output);
	        this.filterEnvelope.connect(this.filter.frequency);
	        this._readOnly([
	            'player',
	            'filterEnvelope',
	            'envelope',
	            'filter'
	        ]);
	    };
	    Tone.extend(Tone.Sampler, Tone.Instrument);
	    /**
		 *  the default parameters
		 *  @static
		 */
	    Tone.Sampler.defaults = {
	        'sample': 0,
	        'pitch': 0,
	        'player': { 'loop': false },
	        'envelope': {
	            'attack': 0.001,
	            'decay': 0,
	            'sustain': 1,
	            'release': 0.1
	        },
	        'filterEnvelope': {
	            'attack': 0.001,
	            'decay': 0.001,
	            'sustain': 1,
	            'release': 0.5,
	            'min': 20,
	            'max': 20000,
	            'exponent': 2
	        },
	        'filter': { 'type': 'lowpass' }
	    };
	    /**
		 *  load the buffers
		 *  @param   {Object} urls   the urls
		 *  @private
		 */
	    Tone.Sampler.prototype._loadBuffers = function (urls) {
	        if (typeof urls === 'string') {
	            this._buffers['0'] = new Tone.Buffer(urls, function () {
	                this.sample = '0';
	            }.bind(this));
	        } else {
	            urls = this._flattenUrls(urls);
	            for (var buffName in urls) {
	                this._sample = buffName;
	                var urlString = urls[buffName];
	                this._buffers[buffName] = new Tone.Buffer(urlString);
	            }
	        }
	    };
	    /**
		 *  Flatten an object into a single depth object. 
		 *  thanks to https://gist.github.com/penguinboy/762197
		 *  @param   {Object} ob 	
		 *  @return  {Object}    
		 *  @private
		 */
	    Tone.Sampler.prototype._flattenUrls = function (ob) {
	        var toReturn = {};
	        for (var i in ob) {
	            if (!ob.hasOwnProperty(i))
	                continue;
	            if (typeof ob[i] == 'object') {
	                var flatObject = this._flattenUrls(ob[i]);
	                for (var x in flatObject) {
	                    if (!flatObject.hasOwnProperty(x))
	                        continue;
	                    toReturn[i + '.' + x] = flatObject[x];
	                }
	            } else {
	                toReturn[i] = ob[i];
	            }
	        }
	        return toReturn;
	    };
	    /**
		 *  Start the sample and simultaneously trigger the envelopes. 
		 *  @param {string=} sample The name of the sample to trigger, defaults to
		 *                          the last sample used. 
		 *  @param {Time} [time=now] The time when the sample should start
		 *  @param {number} [velocity=1] The velocity of the note
		 *  @returns {Tone.Sampler} this
		 *  @example
		 * sampler.triggerAttack("B.1");
		 */
	    Tone.Sampler.prototype.triggerAttack = function (name, time, velocity) {
	        time = this.toSeconds(time);
	        if (name) {
	            this.sample = name;
	        }
	        this.player.start(time);
	        this.envelope.triggerAttack(time, velocity);
	        this.filterEnvelope.triggerAttack(time);
	        return this;
	    };
	    /**
		 *  Start the release portion of the sample. Will stop the sample once the 
		 *  envelope has fully released. 
		 *  
		 *  @param {Time} [time=now] The time when the note should release
		 *  @returns {Tone.Sampler} this
		 *  @example
		 * sampler.triggerRelease();
		 */
	    Tone.Sampler.prototype.triggerRelease = function (time) {
	        time = this.toSeconds(time);
	        this.filterEnvelope.triggerRelease(time);
	        this.envelope.triggerRelease(time);
	        this.player.stop(this.toSeconds(this.envelope.release) + time);
	        return this;
	    };
	    /**
		 * The name of the sample to trigger.
		 * @memberOf Tone.Sampler#
		 * @type {number|string}
		 * @name sample
		 * @example
		 * //set the sample to "A.2" for next time the sample is triggered
		 * sampler.sample = "A.2";
		 */
	    Object.defineProperty(Tone.Sampler.prototype, 'sample', {
	        get: function () {
	            return this._sample;
	        },
	        set: function (name) {
	            if (this._buffers.hasOwnProperty(name)) {
	                this._sample = name;
	                this.player.buffer = this._buffers[name];
	            } else {
	                throw new Error('Sampler does not have a sample named ' + name);
	            }
	        }
	    });
	    /**
		 * The direction the buffer should play in
		 * @memberOf Tone.Sampler#
		 * @type {boolean}
		 * @name reverse
		 */
	    Object.defineProperty(Tone.Sampler.prototype, 'reverse', {
	        get: function () {
	            for (var i in this._buffers) {
	                return this._buffers[i].reverse;
	            }
	        },
	        set: function (rev) {
	            for (var i in this._buffers) {
	                this._buffers[i].reverse = rev;
	            }
	        }
	    });
	    /**
		 * Repitch the sampled note by some interval (measured
		 * in semi-tones). 
		 * @memberOf Tone.Sampler#
		 * @type {Interval}
		 * @name pitch
		 * @example
		 * sampler.pitch = -12; //down one octave
		 * sampler.pitch = 7; //up a fifth
		 */
	    Object.defineProperty(Tone.Sampler.prototype, 'pitch', {
	        get: function () {
	            return this._pitch;
	        },
	        set: function (interval) {
	            this._pitch = interval;
	            this.player.playbackRate = this.intervalToFrequencyRatio(interval);
	        }
	    });
	    /**
		 *  Clean up.
		 *  @returns {Tone.Sampler} this
		 */
	    Tone.Sampler.prototype.dispose = function () {
	        Tone.Instrument.prototype.dispose.call(this);
	        this._writable([
	            'player',
	            'filterEnvelope',
	            'envelope',
	            'filter'
	        ]);
	        this.player.dispose();
	        this.filterEnvelope.dispose();
	        this.envelope.dispose();
	        this.filter.dispose();
	        this.player = null;
	        this.filterEnvelope = null;
	        this.envelope = null;
	        this.filter = null;
	        for (var sample in this._buffers) {
	            this._buffers[sample].dispose();
	            this._buffers[sample] = null;
	        }
	        this._buffers = null;
	        return this;
	    };
	    return Tone.Sampler;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.SimpleSynth is composed simply of a Tone.OmniOscillator
		 *          routed through a Tone.AmplitudeEnvelope. 
		 *          <img src="https://docs.google.com/drawings/d/1-1_0YW2Z1J2EPI36P8fNCMcZG7N1w1GZluPs4og4evo/pub?w=1163&h=231">
		 *
		 *  @constructor
		 *  @extends {Tone.Monophonic}
		 *  @param {Object} [options] the options available for the synth 
		 *                          see defaults below
		 *  @example
		 * var synth = new Tone.SimpleSynth().toMaster();
		 * synth.triggerAttackRelease("C4", "8n");
		 */
	    Tone.SimpleSynth = function (options) {
	        //get the defaults
	        options = this.defaultArg(options, Tone.SimpleSynth.defaults);
	        Tone.Monophonic.call(this, options);
	        /**
			 *  The oscillator.
			 *  @type {Tone.OmniOscillator}
			 */
	        this.oscillator = new Tone.OmniOscillator(options.oscillator);
	        /**
			 *  The frequency control.
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.frequency = this.oscillator.frequency;
	        /**
			 *  The detune control.
			 *  @type {Cents}
			 *  @signal
			 */
	        this.detune = this.oscillator.detune;
	        /**
			 *  The amplitude envelope.
			 *  @type {Tone.AmplitudeEnvelope}
			 */
	        this.envelope = new Tone.AmplitudeEnvelope(options.envelope);
	        //connect the oscillators to the output
	        this.oscillator.chain(this.envelope, this.output);
	        //start the oscillators
	        this.oscillator.start();
	        this._readOnly([
	            'oscillator',
	            'frequency',
	            'detune',
	            'envelope'
	        ]);
	    };
	    Tone.extend(Tone.SimpleSynth, Tone.Monophonic);
	    /**
		 *  @const
		 *  @static
		 *  @type {Object}
		 */
	    Tone.SimpleSynth.defaults = {
	        'oscillator': { 'type': 'triangle' },
	        'envelope': {
	            'attack': 0.005,
	            'decay': 0.1,
	            'sustain': 0.3,
	            'release': 1
	        }
	    };
	    /**
		 *  start the attack portion of the envelope
		 *  @param {Time} [time=now] the time the attack should start
		 *  @param {number} [velocity=1] the velocity of the note (0-1)
		 *  @returns {Tone.SimpleSynth} this
		 *  @private
		 */
	    Tone.SimpleSynth.prototype._triggerEnvelopeAttack = function (time, velocity) {
	        //the envelopes
	        this.envelope.triggerAttack(time, velocity);
	        return this;
	    };
	    /**
		 *  start the release portion of the envelope
		 *  @param {Time} [time=now] the time the release should start
		 *  @returns {Tone.SimpleSynth} this
		 *  @private
		 */
	    Tone.SimpleSynth.prototype._triggerEnvelopeRelease = function (time) {
	        this.envelope.triggerRelease(time);
	        return this;
	    };
	    /**
		 *  clean up
		 *  @returns {Tone.SimpleSynth} this
		 */
	    Tone.SimpleSynth.prototype.dispose = function () {
	        Tone.Monophonic.prototype.dispose.call(this);
	        this._writable([
	            'oscillator',
	            'frequency',
	            'detune',
	            'envelope'
	        ]);
	        this.oscillator.dispose();
	        this.oscillator = null;
	        this.envelope.dispose();
	        this.envelope = null;
	        this.frequency = null;
	        this.detune = null;
	        return this;
	    };
	    return Tone.SimpleSynth;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class   AMSynth uses the output of one Tone.SimpleSynth to modulate the
		 *          amplitude of another Tone.SimpleSynth. The harmonicity (the ratio between
		 *          the two signals) affects the timbre of the output signal the most.
		 *          Read more about Amplitude Modulation Synthesis on [SoundOnSound](http://www.soundonsound.com/sos/mar00/articles/synthsecrets.htm).
		 *          <img src="https://docs.google.com/drawings/d/1p_os_As-N1bpnK8u55gXlgVw3U7BfquLX0Wj57kSZXY/pub?w=1009&h=457">
		 *
		 *  @constructor
		 *  @extends {Tone.Monophonic}
		 *  @param {Object} [options] the options available for the synth 
		 *                          see defaults below
		 *  @example
		 * var synth = new Tone.SimpleAM().toMaster();
		 * synth.triggerAttackRelease("C4", "8n");
		 */
	    Tone.SimpleAM = function (options) {
	        options = this.defaultArg(options, Tone.SimpleAM.defaults);
	        Tone.Monophonic.call(this, options);
	        /**
			 *  The carrier voice. 
			 *  @type {Tone.SimpleSynth}
			 */
	        this.carrier = new Tone.SimpleSynth(options.carrier);
	        /**
			 *  The modulator voice. 
			 *  @type {Tone.SimpleSynth}
			 */
	        this.modulator = new Tone.SimpleSynth(options.modulator);
	        /**
			 *  the frequency control
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.frequency = new Tone.Signal(440, Tone.Type.Frequency);
	        /**
			 *  The ratio between the carrier and the modulator frequencies. A value of 1
			 *  makes both voices in unison, a value of 0.5 puts the modulator an octave below
			 *  the carrier.
			 *  @type {Positive}
			 *  @signal
			 *  @example
			 * //set the modulator an octave above the carrier frequency
			 * simpleAM.harmonicity.value = 2;
			 */
	        this.harmonicity = new Tone.Multiply(options.harmonicity);
	        this.harmonicity.units = Tone.Type.Positive;
	        /**
			 *  convert the -1,1 output to 0,1
			 *  @type {Tone.AudioToGain}
			 *  @private
			 */
	        this._modulationScale = new Tone.AudioToGain();
	        /**
			 *  the node where the modulation happens
			 *  @type {GainNode}
			 *  @private
			 */
	        this._modulationNode = this.context.createGain();
	        //control the two voices frequency
	        this.frequency.connect(this.carrier.frequency);
	        this.frequency.chain(this.harmonicity, this.modulator.frequency);
	        this.modulator.chain(this._modulationScale, this._modulationNode.gain);
	        this.carrier.chain(this._modulationNode, this.output);
	        this._readOnly([
	            'carrier',
	            'modulator',
	            'frequency',
	            'harmonicity'
	        ]);
	    };
	    Tone.extend(Tone.SimpleAM, Tone.Monophonic);
	    /**
		 *  @static
		 *  @type {Object}
		 */
	    Tone.SimpleAM.defaults = {
	        'harmonicity': 3,
	        'carrier': {
	            'volume': -10,
	            'portamento': 0,
	            'oscillator': { 'type': 'sine' },
	            'envelope': {
	                'attack': 0.01,
	                'decay': 0.01,
	                'sustain': 1,
	                'release': 0.5
	            }
	        },
	        'modulator': {
	            'volume': -10,
	            'portamento': 0,
	            'oscillator': { 'type': 'sine' },
	            'envelope': {
	                'attack': 0.5,
	                'decay': 0.1,
	                'sustain': 1,
	                'release': 0.5
	            }
	        }
	    };
	    /**
		 *  trigger the attack portion of the note
		 *  
		 *  @param  {Time} [time=now] the time the note will occur
		 *  @param {number} [velocity=1] the velocity of the note
		 *  @returns {Tone.SimpleAM} this
		 *  @private
		 */
	    Tone.SimpleAM.prototype._triggerEnvelopeAttack = function (time, velocity) {
	        //the port glide
	        time = this.toSeconds(time);
	        //the envelopes
	        this.carrier.envelope.triggerAttack(time, velocity);
	        this.modulator.envelope.triggerAttack(time);
	        return this;
	    };
	    /**
		 *  trigger the release portion of the note
		 *  
		 *  @param  {Time} [time=now] the time the note will release
		 *  @returns {Tone.SimpleAM} this
		 *  @private
		 */
	    Tone.SimpleAM.prototype._triggerEnvelopeRelease = function (time) {
	        this.carrier.triggerRelease(time);
	        this.modulator.triggerRelease(time);
	        return this;
	    };
	    /**
		 *  clean up
		 *  @returns {Tone.SimpleAM} this
		 */
	    Tone.SimpleAM.prototype.dispose = function () {
	        Tone.Monophonic.prototype.dispose.call(this);
	        this._writable([
	            'carrier',
	            'modulator',
	            'frequency',
	            'harmonicity'
	        ]);
	        this.carrier.dispose();
	        this.carrier = null;
	        this.modulator.dispose();
	        this.modulator = null;
	        this.frequency.dispose();
	        this.frequency = null;
	        this.harmonicity.dispose();
	        this.harmonicity = null;
	        this._modulationScale.dispose();
	        this._modulationScale = null;
	        this._modulationNode.disconnect();
	        this._modulationNode = null;
	        return this;
	    };
	    return Tone.SimpleAM;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  SimpleFM is composed of two Tone.SimpleSynths where one Tone.SimpleSynth modulates
		 *          the frequency of a second Tone.SimpleSynth. A lot of spectral content 
		 *          can be explored using the Tone.FMSynth.modulationIndex parameter. Read more about
		 *          frequency modulation synthesis on [SoundOnSound](http://www.soundonsound.com/sos/apr00/articles/synthsecrets.htm).
		 *          <img src="https://docs.google.com/drawings/d/1hSU25lLjDk_WJ59DSitQm6iCRpcMWVEAYqBjwmqtRVw/pub?w=902&h=462">
		 *
		 *  @constructor
		 *  @extends {Tone.Monophonic}
		 *  @param {Object} [options] the options available for the synth 
		 *                          see defaults below
		 *  @example
		 * var fmSynth = new Tone.SimpleFM().toMaster();
		 * fmSynth.triggerAttackRelease("C4", "8n");
		 */
	    Tone.SimpleFM = function (options) {
	        options = this.defaultArg(options, Tone.SimpleFM.defaults);
	        Tone.Monophonic.call(this, options);
	        /**
			 *  The carrier voice. 
			 *  @type {Tone.SimpleSynth}
			 */
	        this.carrier = new Tone.SimpleSynth(options.carrier);
	        this.carrier.volume.value = -10;
	        /**
			 *  The modulator voice. 
			 *  @type {Tone.SimpleSynth}
			 */
	        this.modulator = new Tone.SimpleSynth(options.modulator);
	        this.modulator.volume.value = -10;
	        /**
			 *  the frequency control
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.frequency = new Tone.Signal(440, Tone.Type.Frequency);
	        /**
			 *  Harmonicity is the ratio between the two voices. A harmonicity of
			 *  1 is no change. Harmonicity = 2 means a change of an octave. 
			 *  @type {Positive}
			 *  @signal
			 *  @example
			 * //pitch voice1 an octave below voice0
			 * synth.harmonicity.value = 0.5;
			 */
	        this.harmonicity = new Tone.Multiply(options.harmonicity);
	        this.harmonicity.units = Tone.Type.Positive;
	        /**
			 *  The modulation index which is in essence the depth or amount of the modulation. In other terms it is the 
			 *  ratio of the frequency of the modulating signal (mf) to the amplitude of the 
			 *  modulating signal (ma) -- as in ma/mf. 
			 *	@type {Positive}
			 *	@signal
			 */
	        this.modulationIndex = new Tone.Multiply(options.modulationIndex);
	        this.modulationIndex.units = Tone.Type.Positive;
	        /**
			 *  the node where the modulation happens
			 *  @type {GainNode}
			 *  @private
			 */
	        this._modulationNode = this.context.createGain();
	        //control the two voices frequency
	        this.frequency.connect(this.carrier.frequency);
	        this.frequency.chain(this.harmonicity, this.modulator.frequency);
	        this.frequency.chain(this.modulationIndex, this._modulationNode);
	        this.modulator.connect(this._modulationNode.gain);
	        this._modulationNode.gain.value = 0;
	        this._modulationNode.connect(this.carrier.frequency);
	        this.carrier.connect(this.output);
	        this._readOnly([
	            'carrier',
	            'modulator',
	            'frequency',
	            'harmonicity',
	            'modulationIndex'
	        ]);
	        ;
	    };
	    Tone.extend(Tone.SimpleFM, Tone.Monophonic);
	    /**
		 *  @static
		 *  @type {Object}
		 */
	    Tone.SimpleFM.defaults = {
	        'harmonicity': 3,
	        'modulationIndex': 10,
	        'carrier': {
	            'volume': -10,
	            'portamento': 0,
	            'oscillator': { 'type': 'sine' },
	            'envelope': {
	                'attack': 0.01,
	                'decay': 0,
	                'sustain': 1,
	                'release': 0.5
	            }
	        },
	        'modulator': {
	            'volume': -10,
	            'portamento': 0,
	            'oscillator': { 'type': 'triangle' },
	            'envelope': {
	                'attack': 0.01,
	                'decay': 0,
	                'sustain': 1,
	                'release': 0.5
	            }
	        }
	    };
	    /**
		 *  trigger the attack portion of the note
		 *  
		 *  @param  {Time} [time=now] the time the note will occur
		 *  @param {number} [velocity=1] the velocity of the note
		 *  @returns {Tone.SimpleFM} this
		 *  @private
		 */
	    Tone.SimpleFM.prototype._triggerEnvelopeAttack = function (time, velocity) {
	        //the port glide
	        time = this.toSeconds(time);
	        //the envelopes
	        this.carrier.envelope.triggerAttack(time, velocity);
	        this.modulator.envelope.triggerAttack(time);
	        return this;
	    };
	    /**
		 *  trigger the release portion of the note
		 *  
		 *  @param  {Time} [time=now] the time the note will release
		 *  @returns {Tone.SimpleFM} this
		 *  @private
		 */
	    Tone.SimpleFM.prototype._triggerEnvelopeRelease = function (time) {
	        this.carrier.triggerRelease(time);
	        this.modulator.triggerRelease(time);
	        return this;
	    };
	    /**
		 *  clean up
		 *  @returns {Tone.SimpleFM} this
		 */
	    Tone.SimpleFM.prototype.dispose = function () {
	        Tone.Monophonic.prototype.dispose.call(this);
	        this._writable([
	            'carrier',
	            'modulator',
	            'frequency',
	            'harmonicity',
	            'modulationIndex'
	        ]);
	        this.carrier.dispose();
	        this.carrier = null;
	        this.modulator.dispose();
	        this.modulator = null;
	        this.frequency.dispose();
	        this.frequency = null;
	        this.modulationIndex.dispose();
	        this.modulationIndex = null;
	        this.harmonicity.dispose();
	        this.harmonicity = null;
	        this._modulationNode.disconnect();
	        this._modulationNode = null;
	        return this;
	    };
	    return Tone.SimpleFM;
	});
	Module(function (Tone) {
	    
	    /**
		 * 	@class  Tone.Effect is the base class for effects. Connect the effect between
		 * 	        the effectSend and effectReturn GainNodes, then control the amount of
		 * 	        effect which goes to the output using the wet control.
		 *
		 *  @constructor
		 *  @extends {Tone}
		 *  @param {NormalRange|Object} [wet] The starting wet value. 
		 */
	    Tone.Effect = function () {
	        Tone.call(this);
	        //get all of the defaults
	        var options = this.optionsObject(arguments, ['wet'], Tone.Effect.defaults);
	        /**
			 *  the drywet knob to control the amount of effect
			 *  @type {Tone.CrossFade}
			 *  @private
			 */
	        this._dryWet = new Tone.CrossFade(options.wet);
	        /**
			 *  The wet control is how much of the effected
			 *  will pass through to the output. 1 = 100% effected
			 *  signal, 0 = 100% dry signal. 
			 *  @type {NormalRange}
			 *  @signal
			 */
	        this.wet = this._dryWet.fade;
	        /**
			 *  connect the effectSend to the input of hte effect
			 *  @type {GainNode}
			 *  @private
			 */
	        this.effectSend = this.context.createGain();
	        /**
			 *  connect the output of the effect to the effectReturn
			 *  @type {GainNode}
			 *  @private
			 */
	        this.effectReturn = this.context.createGain();
	        //connections
	        this.input.connect(this._dryWet.a);
	        this.input.connect(this.effectSend);
	        this.effectReturn.connect(this._dryWet.b);
	        this._dryWet.connect(this.output);
	        this._readOnly(['wet']);
	    };
	    Tone.extend(Tone.Effect);
	    /**
		 *  @static
		 *  @type {Object}
		 */
	    Tone.Effect.defaults = { 'wet': 1 };
	    /**
		 *  chains the effect in between the effectSend and effectReturn
		 *  @param  {Tone} effect
		 *  @private
		 *  @returns {Tone.Effect} this
		 */
	    Tone.Effect.prototype.connectEffect = function (effect) {
	        this.effectSend.chain(effect, this.effectReturn);
	        return this;
	    };
	    /**
		 *  Clean up. 
		 *  @returns {Tone.Effect} this
		 */
	    Tone.Effect.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._dryWet.dispose();
	        this._dryWet = null;
	        this.effectSend.disconnect();
	        this.effectSend = null;
	        this.effectReturn.disconnect();
	        this.effectReturn = null;
	        this._writable(['wet']);
	        this.wet = null;
	        return this;
	    };
	    return Tone.Effect;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.AutoFilter is a Tone.Filter with a Tone.LFO connected to the filter cutoff frequency.
		 *         Setting the LFO rate and depth allows for control over the filter modulation rate 
		 *         and depth.
		 *
		 *  @constructor
		 *  @extends {Tone.Effect}
		 *  @param {Time|Object} [frequency] The rate of the LFO.
		 *  @param {Frequency} [min] The lower value of the LFOs oscillation
	 	 *  @param {Frequency} [max] The upper value of the LFOs oscillation. 
		 *  @example
		 * //create an autofilter and start it's LFO
		 * var autoFilter = new Tone.AutoFilter("4n").toMaster().start();
		 * //route an oscillator through the filter and start it
		 * var oscillator = new Tone.Oscillator().connect(autoFilter).start();
		 */
	    Tone.AutoFilter = function () {
	        var options = this.optionsObject(arguments, [
	            'frequency',
	            'min',
	            'max'
	        ], Tone.AutoFilter.defaults);
	        Tone.Effect.call(this, options);
	        /**
			 *  the lfo which drives the filter cutoff
			 *  @type {Tone.LFO}
			 *  @private
			 */
	        this._lfo = new Tone.LFO({
	            'frequency': options.frequency,
	            'amplitude': options.depth,
	            'min': options.min,
	            'max': options.max
	        });
	        /**
			 * The range of the filter modulating between the min and max frequency. 
			 * 0 = no modulation. 1 = full modulation.
			 * @type {NormalRange}
			 * @signal
			 */
	        this.depth = this._lfo.amplitude;
	        /**
			 * How fast the filter modulates between min and max. 
			 * @type {Frequency}
			 * @signal
			 */
	        this.frequency = this._lfo.frequency;
	        /**
			 *  The filter node
			 *  @type {Tone.Filter}
			 */
	        this.filter = new Tone.Filter(options.filter);
	        //connections
	        this.connectEffect(this.filter);
	        this._lfo.connect(this.filter.frequency);
	        this.type = options.type;
	        this._readOnly([
	            'frequency',
	            'depth'
	        ]);
	    };
	    //extend Effect
	    Tone.extend(Tone.AutoFilter, Tone.Effect);
	    /**
		 *  defaults
		 *  @static
		 *  @type {Object}
		 */
	    Tone.AutoFilter.defaults = {
	        'frequency': 1,
	        'type': 'sine',
	        'depth': 1,
	        'min': 200,
	        'max': 1200,
	        'filter': {
	            'type': 'lowpass',
	            'rolloff': -12,
	            'Q': 1
	        }
	    };
	    /**
		 * Start the effect.
		 * @param {Time} [time=now] When the LFO will start. 
		 * @returns {Tone.AutoFilter} this
		 */
	    Tone.AutoFilter.prototype.start = function (time) {
	        this._lfo.start(time);
	        return this;
	    };
	    /**
		 * Stop the effect.
		 * @param {Time} [time=now] When the LFO will stop. 
		 * @returns {Tone.AutoFilter} this
		 */
	    Tone.AutoFilter.prototype.stop = function (time) {
	        this._lfo.stop(time);
	        return this;
	    };
	    /**
		 * Sync the filter to the transport.
		 * @param {Time} [delay=0] Delay time before starting the effect after the
		 *                               Transport has started. 
		 * @returns {Tone.AutoFilter} this
		 */
	    Tone.AutoFilter.prototype.sync = function (delay) {
	        this._lfo.sync(delay);
	        return this;
	    };
	    /**
		 * Unsync the filter from the transport.
		 * @returns {Tone.AutoFilter} this
		 */
	    Tone.AutoFilter.prototype.unsync = function () {
	        this._lfo.unsync();
	        return this;
	    };
	    /**
		 * Type of oscillator attached to the AutoFilter. 
		 * Possible values: "sine", "square", "triangle", "sawtooth".
		 * @memberOf Tone.AutoFilter#
		 * @type {string}
		 * @name type
		 */
	    Object.defineProperty(Tone.AutoFilter.prototype, 'type', {
	        get: function () {
	            return this._lfo.type;
	        },
	        set: function (type) {
	            this._lfo.type = type;
	        }
	    });
	    /**
		 * The minimum value of the LFO attached to the cutoff frequency of the filter.
		 * @memberOf Tone.AutoFilter#
		 * @type {Frequency}
		 * @name min
		 */
	    Object.defineProperty(Tone.AutoFilter.prototype, 'min', {
	        get: function () {
	            return this._lfo.min;
	        },
	        set: function (min) {
	            this._lfo.min = min;
	        }
	    });
	    /**
		 * The minimum value of the LFO attached to the cutoff frequency of the filter.
		 * @memberOf Tone.AutoFilter#
		 * @type {Frequency}
		 * @name max
		 */
	    Object.defineProperty(Tone.AutoFilter.prototype, 'max', {
	        get: function () {
	            return this._lfo.max;
	        },
	        set: function (max) {
	            this._lfo.max = max;
	        }
	    });
	    /**
		 *  Clean up. 
		 *  @returns {Tone.AutoFilter} this
		 */
	    Tone.AutoFilter.prototype.dispose = function () {
	        Tone.Effect.prototype.dispose.call(this);
	        this._lfo.dispose();
	        this._lfo = null;
	        this.filter.dispose();
	        this.filter = null;
	        this._writable([
	            'frequency',
	            'depth'
	        ]);
	        this.frequency = null;
	        this.depth = null;
	        return this;
	    };
	    return Tone.AutoFilter;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.AutoPanner is a Tone.Panner with an LFO connected to the pan amount. 
		 *         More on using autopanners [here](https://www.ableton.com/en/blog/autopan-chopper-effect-and-more-liveschool/).
		 *
		 *  @constructor
		 *  @extends {Tone.Effect}
		 *  @param {Frequency|Object} [frequency] Rate of left-right oscillation. 
		 *  @example
		 * //create an autopanner and start it's LFO
		 * var autoPanner = new Tone.AutoPanner("4n").toMaster().start();
		 * //route an oscillator through the panner and start it
		 * var oscillator = new Tone.Oscillator().connect(autoPanner).start();
		 */
	    Tone.AutoPanner = function () {
	        var options = this.optionsObject(arguments, ['frequency'], Tone.AutoPanner.defaults);
	        Tone.Effect.call(this, options);
	        /**
			 *  the lfo which drives the panning
			 *  @type {Tone.LFO}
			 *  @private
			 */
	        this._lfo = new Tone.LFO({
	            'frequency': options.frequency,
	            'amplitude': options.depth,
	            'min': 0,
	            'max': 1
	        });
	        /**
			 * The amount of panning between left and right. 
			 * 0 = always center. 1 = full range between left and right. 
			 * @type {NormalRange}
			 * @signal
			 */
	        this.depth = this._lfo.amplitude;
	        /**
			 *  the panner node which does the panning
			 *  @type {Tone.Panner}
			 *  @private
			 */
	        this._panner = new Tone.Panner();
	        /**
			 * How fast the panner modulates between left and right. 
			 * @type {Frequency}
			 * @signal
			 */
	        this.frequency = this._lfo.frequency;
	        //connections
	        this.connectEffect(this._panner);
	        this._lfo.connect(this._panner.pan);
	        this.type = options.type;
	        this._readOnly([
	            'depth',
	            'frequency'
	        ]);
	    };
	    //extend Effect
	    Tone.extend(Tone.AutoPanner, Tone.Effect);
	    /**
		 *  defaults
		 *  @static
		 *  @type {Object}
		 */
	    Tone.AutoPanner.defaults = {
	        'frequency': 1,
	        'type': 'sine',
	        'depth': 1
	    };
	    /**
		 * Start the effect.
		 * @param {Time} [time=now] When the LFO will start. 
		 * @returns {Tone.AutoPanner} this
		 */
	    Tone.AutoPanner.prototype.start = function (time) {
	        this._lfo.start(time);
	        return this;
	    };
	    /**
		 * Stop the effect.
		 * @param {Time} [time=now] When the LFO will stop. 
		 * @returns {Tone.AutoPanner} this
		 */
	    Tone.AutoPanner.prototype.stop = function (time) {
	        this._lfo.stop(time);
	        return this;
	    };
	    /**
		 * Sync the panner to the transport.
		 * @param {Time} [delay=0] Delay time before starting the effect after the
		 *                               Transport has started. 
		 * @returns {Tone.AutoPanner} this
		 */
	    Tone.AutoPanner.prototype.sync = function (delay) {
	        this._lfo.sync(delay);
	        return this;
	    };
	    /**
		 * Unsync the panner from the transport
		 * @returns {Tone.AutoPanner} this
		 */
	    Tone.AutoPanner.prototype.unsync = function () {
	        this._lfo.unsync();
	        return this;
	    };
	    /**
		 * Type of oscillator attached to the AutoFilter. 
		 * Possible values: "sine", "square", "triangle", "sawtooth".
		 * @memberOf Tone.AutoFilter#
		 * @type {string}
		 * @name type
		 */
	    Object.defineProperty(Tone.AutoPanner.prototype, 'type', {
	        get: function () {
	            return this._lfo.type;
	        },
	        set: function (type) {
	            this._lfo.type = type;
	        }
	    });
	    /**
		 *  clean up
		 *  @returns {Tone.AutoPanner} this
		 */
	    Tone.AutoPanner.prototype.dispose = function () {
	        Tone.Effect.prototype.dispose.call(this);
	        this._lfo.dispose();
	        this._lfo = null;
	        this._panner.dispose();
	        this._panner = null;
	        this._writable([
	            'depth',
	            'frequency'
	        ]);
	        this.frequency = null;
	        this.depth = null;
	        return this;
	    };
	    return Tone.AutoPanner;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.AutoWah connects a Tone.Follower to a bandpass filter (Tone.Filter).
		 *          The frequency of the filter is adjusted proportionally to the 
		 *          incoming signal's amplitude. Inspiration from [Tuna.js](https://github.com/Dinahmoe/tuna).
		 *
		 *  @constructor
		 *  @extends {Tone.Effect}
		 *  @param {Frequency|Object} [baseFrequency] The frequency the filter is set 
		 *                                            to at the low point of the wah
		 *  @param {Positive} [octaves] The number of octaves above the baseFrequency
		 *                                the filter will sweep to when fully open
		 *  @param {Decibels} [sensitivity] The decibel threshold sensitivity for 
		 *                                   the incoming signal. Normal range of -40 to 0. 
		 *  @example
		 * var autoWah = new Tone.AutoWah(50, 6, -30).toMaster();
		 * //initialize the synth and connect to autowah
		 * var synth = new SimpleSynth.connect(autoWah);
		 * //Q value influences the effect of the wah - default is 2
		 * autoWah.Q.value = 6;
		 * //more audible on higher notes
		 * synth.triggerAttackRelease("C4", "8n")
		 */
	    Tone.AutoWah = function () {
	        var options = this.optionsObject(arguments, [
	            'baseFrequency',
	            'octaves',
	            'sensitivity'
	        ], Tone.AutoWah.defaults);
	        Tone.Effect.call(this, options);
	        /**
			 *  The envelope follower. Set the attack/release
			 *  timing to adjust how the envelope is followed. 
			 *  @type {Tone.Follower}
			 *  @private
			 */
	        this.follower = new Tone.Follower(options.follower);
	        /**
			 *  scales the follower value to the frequency domain
			 *  @type {Tone}
			 *  @private
			 */
	        this._sweepRange = new Tone.ScaleExp(0, 1, 0.5);
	        /**
			 *  @type {number}
			 *  @private
			 */
	        this._baseFrequency = options.baseFrequency;
	        /**
			 *  @type {number}
			 *  @private
			 */
	        this._octaves = options.octaves;
	        /**
			 *  the input gain to adjust the sensitivity
			 *  @type {GainNode}
			 *  @private
			 */
	        this._inputBoost = this.context.createGain();
	        /**
			 *  @type {BiquadFilterNode}
			 *  @private
			 */
	        this._bandpass = new Tone.Filter({
	            'rolloff': -48,
	            'frequency': 0,
	            'Q': options.Q
	        });
	        /**
			 *  @type {Tone.Filter}
			 *  @private
			 */
	        this._peaking = new Tone.Filter(0, 'peaking');
	        this._peaking.gain.value = options.gain;
	        /**
			 * The gain of the filter.
			 * @type {Gain}
			 * @signal
			 */
	        this.gain = this._peaking.gain;
	        /**
			 * The quality of the filter.
			 * @type {Positive}
			 * @signal
			 */
	        this.Q = this._bandpass.Q;
	        //the control signal path
	        this.effectSend.chain(this._inputBoost, this.follower, this._sweepRange);
	        this._sweepRange.connect(this._bandpass.frequency);
	        this._sweepRange.connect(this._peaking.frequency);
	        //the filtered path
	        this.effectSend.chain(this._bandpass, this._peaking, this.effectReturn);
	        //set the initial value
	        this._setSweepRange();
	        this.sensitivity = options.sensitivity;
	        this._readOnly([
	            'gain',
	            'Q'
	        ]);
	    };
	    Tone.extend(Tone.AutoWah, Tone.Effect);
	    /**
		 *  @static
		 *  @type {Object}
		 */
	    Tone.AutoWah.defaults = {
	        'baseFrequency': 100,
	        'octaves': 6,
	        'sensitivity': 0,
	        'Q': 2,
	        'gain': 2,
	        'follower': {
	            'attack': 0.3,
	            'release': 0.5
	        }
	    };
	    /**
		 * The number of octaves that the filter will sweep above the 
		 * baseFrequency. 
		 * @memberOf Tone.AutoWah#
		 * @type {Number}
		 * @name octaves
		 */
	    Object.defineProperty(Tone.AutoWah.prototype, 'octaves', {
	        get: function () {
	            return this._octaves;
	        },
	        set: function (octaves) {
	            this._octaves = octaves;
	            this._setSweepRange();
	        }
	    });
	    /**
		 * The base frequency from which the sweep will start from.
		 * @memberOf Tone.AutoWah#
		 * @type {Frequency}
		 * @name baseFrequency
		 */
	    Object.defineProperty(Tone.AutoWah.prototype, 'baseFrequency', {
	        get: function () {
	            return this._baseFrequency;
	        },
	        set: function (baseFreq) {
	            this._baseFrequency = baseFreq;
	            this._setSweepRange();
	        }
	    });
	    /**
		 * The sensitivity to control how responsive to the input signal the filter is. 
		 * @memberOf Tone.AutoWah#
		 * @type {Decibels}
		 * @name sensitivity
		 */
	    Object.defineProperty(Tone.AutoWah.prototype, 'sensitivity', {
	        get: function () {
	            return this.gainToDb(1 / this._inputBoost.gain.value);
	        },
	        set: function (sensitivy) {
	            this._inputBoost.gain.value = 1 / this.dbToGain(sensitivy);
	        }
	    });
	    /**
		 *  sets the sweep range of the scaler
		 *  @private
		 */
	    Tone.AutoWah.prototype._setSweepRange = function () {
	        this._sweepRange.min = this._baseFrequency;
	        this._sweepRange.max = Math.min(this._baseFrequency * Math.pow(2, this._octaves), this.context.sampleRate / 2);
	    };
	    /**
		 *  Clean up.
		 *  @returns {Tone.AutoWah} this
		 */
	    Tone.AutoWah.prototype.dispose = function () {
	        Tone.Effect.prototype.dispose.call(this);
	        this.follower.dispose();
	        this.follower = null;
	        this._sweepRange.dispose();
	        this._sweepRange = null;
	        this._bandpass.dispose();
	        this._bandpass = null;
	        this._peaking.dispose();
	        this._peaking = null;
	        this._inputBoost.disconnect();
	        this._inputBoost = null;
	        this._writable([
	            'gain',
	            'Q'
	        ]);
	        this.gain = null;
	        this.Q = null;
	        return this;
	    };
	    return Tone.AutoWah;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.Bitcrusher downsamples the incoming signal to a different bitdepth. 
		 *         Lowering the bitdepth of the signal creates distortion. Read more about Bitcrushing
		 *         on [Wikipedia](https://en.wikipedia.org/wiki/Bitcrusher).
		 *
		 *  @constructor
		 *  @extends {Tone.Effect}
		 *  @param {Number} bits The number of bits to downsample the signal. Nominal range
		 *                       of 1 to 8. 
		 *  @example
		 * //initialize crusher and route a synth through it
		 * var crusher = new Tone.BitCrusher(4).toMaster();
		 * var synth = new Tone.MonoSynth().connect(crusher);
		 */
	    Tone.BitCrusher = function () {
	        var options = this.optionsObject(arguments, ['bits'], Tone.BitCrusher.defaults);
	        Tone.Effect.call(this, options);
	        var invStepSize = 1 / Math.pow(2, options.bits - 1);
	        /**
			 *  Subtract the input signal and the modulus of the input signal
			 *  @type {Tone.Subtract}
			 *  @private
			 */
	        this._subtract = new Tone.Subtract();
	        /**
			 *  The mod function
			 *  @type  {Tone.Modulo}
			 *  @private
			 */
	        this._modulo = new Tone.Modulo(invStepSize);
	        /**
			 *  keeps track of the bits
			 *  @type {number}
			 *  @private
			 */
	        this._bits = options.bits;
	        //connect it up
	        this.effectSend.fan(this._subtract, this._modulo);
	        this._modulo.connect(this._subtract, 0, 1);
	        this._subtract.connect(this.effectReturn);
	    };
	    Tone.extend(Tone.BitCrusher, Tone.Effect);
	    /**
		 *  the default values
		 *  @static
		 *  @type {Object}
		 */
	    Tone.BitCrusher.defaults = { 'bits': 4 };
	    /**
		 * The bit depth of the effect. Nominal range of 1-8. 
		 * @memberOf Tone.BitCrusher#
		 * @type {number}
		 * @name bits
		 */
	    Object.defineProperty(Tone.BitCrusher.prototype, 'bits', {
	        get: function () {
	            return this._bits;
	        },
	        set: function (bits) {
	            this._bits = bits;
	            var invStepSize = 1 / Math.pow(2, bits - 1);
	            this._modulo.value = invStepSize;
	        }
	    });
	    /**
		 *  Clean up. 
		 *  @returns {Tone.BitCrusher} this
		 */
	    Tone.BitCrusher.prototype.dispose = function () {
	        Tone.Effect.prototype.dispose.call(this);
	        this._subtract.dispose();
	        this._subtract = null;
	        this._modulo.dispose();
	        this._modulo = null;
	        return this;
	    };
	    return Tone.BitCrusher;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.ChebyShev is a Chebyshev waveshaper, an effect which is good 
		 *         for making different types of distortion sounds.
		 *         Note that odd orders sound very different from even ones, 
		 *         and order = 1 is no change. 
		 *         Read more at [music.columbia.edu](http://music.columbia.edu/cmc/musicandcomputers/chapter4/04_06.php).
		 *
		 *  @extends {Tone.Effect}
		 *  @constructor
		 *  @param {Positive|Object} [order] The order of the chebyshev polynomial. Normal range between 1-100. 
		 *  @example
		 * //create a new cheby
		 * var cheby = new Tone.Chebyshev(50);
		 * //create a monosynth connected to our cheby
		 * synth = new Tone.MonoSynth().connect(cheby);
		 */
	    Tone.Chebyshev = function () {
	        var options = this.optionsObject(arguments, ['order'], Tone.Chebyshev.defaults);
	        Tone.Effect.call(this, options);
	        /**
			 *  @type {WaveShaperNode}
			 *  @private
			 */
	        this._shaper = new Tone.WaveShaper(4096);
	        /**
			 * holds onto the order of the filter
			 * @type {number}
			 * @private
			 */
	        this._order = options.order;
	        this.connectEffect(this._shaper);
	        this.order = options.order;
	        this.oversample = options.oversample;
	    };
	    Tone.extend(Tone.Chebyshev, Tone.Effect);
	    /**
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
	    Tone.Chebyshev.defaults = {
	        'order': 1,
	        'oversample': 'none'
	    };
	    /**
		 *  get the coefficient for that degree
		 *  @param {number} x the x value
		 *  @param   {number} degree 
		 *  @param {Object} memo memoize the computed value. 
		 *                       this speeds up computation greatly. 
		 *  @return  {number}       the coefficient 
		 *  @private
		 */
	    Tone.Chebyshev.prototype._getCoefficient = function (x, degree, memo) {
	        if (memo.hasOwnProperty(degree)) {
	            return memo[degree];
	        } else if (degree === 0) {
	            memo[degree] = 0;
	        } else if (degree === 1) {
	            memo[degree] = x;
	        } else {
	            memo[degree] = 2 * x * this._getCoefficient(x, degree - 1, memo) - this._getCoefficient(x, degree - 2, memo);
	        }
	        return memo[degree];
	    };
	    /**
		 * The order of the Chebyshev polynomial which creates
		 * the equation which is applied to the incoming 
		 * signal through a Tone.WaveShaper. The equations
		 * are in the form:<br>
		 * order 2: 2x^2 + 1<br>
		 * order 3: 4x^3 + 3x <br>
		 * @memberOf Tone.Chebyshev#
		 * @type {Positive}
		 * @name order
		 */
	    Object.defineProperty(Tone.Chebyshev.prototype, 'order', {
	        get: function () {
	            return this._order;
	        },
	        set: function (order) {
	            this._order = order;
	            var curve = new Array(4096);
	            var len = curve.length;
	            for (var i = 0; i < len; ++i) {
	                var x = i * 2 / len - 1;
	                if (x === 0) {
	                    //should output 0 when input is 0
	                    curve[i] = 0;
	                } else {
	                    curve[i] = this._getCoefficient(x, order, {});
	                }
	            }
	            this._shaper.curve = curve;
	        }
	    });
	    /**
		 * The oversampling of the effect. Can either be "none", "2x" or "4x".
		 * @memberOf Tone.Chebyshev#
		 * @type {string}
		 * @name oversample
		 */
	    Object.defineProperty(Tone.Chebyshev.prototype, 'oversample', {
	        get: function () {
	            return this._shaper.oversample;
	        },
	        set: function (oversampling) {
	            this._shaper.oversample = oversampling;
	        }
	    });
	    /**
		 *  Clean up. 
		 *  @returns {Tone.Chebyshev} this
		 */
	    Tone.Chebyshev.prototype.dispose = function () {
	        Tone.Effect.prototype.dispose.call(this);
	        this._shaper.dispose();
	        this._shaper = null;
	        return this;
	    };
	    return Tone.Chebyshev;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Base class for Stereo effects. Provides effectSendL/R and effectReturnL/R. 
		 *
		 *	@constructor
		 *	@extends {Tone.Effect}
		 */
	    Tone.StereoEffect = function () {
	        Tone.call(this);
	        //get the defaults
	        var options = this.optionsObject(arguments, ['wet'], Tone.Effect.defaults);
	        /**
			 *  the drywet knob to control the amount of effect
			 *  @type {Tone.CrossFade}
			 *  @private
			 */
	        this._dryWet = new Tone.CrossFade(options.wet);
	        /**
			 *  The wet control, i.e. how much of the effected
			 *  will pass through to the output. 
			 *  @type {NormalRange}
			 *  @signal
			 */
	        this.wet = this._dryWet.fade;
	        /**
			 *  then split it
			 *  @type {Tone.Split}
			 *  @private
			 */
	        this._split = new Tone.Split();
	        /**
			 *  the effects send LEFT
			 *  @type {GainNode}
			 *  @private
			 */
	        this.effectSendL = this._split.left;
	        /**
			 *  the effects send RIGHT
			 *  @type {GainNode}
			 *  @private
			 */
	        this.effectSendR = this._split.right;
	        /**
			 *  the stereo effect merger
			 *  @type {Tone.Merge}
			 *  @private
			 */
	        this._merge = new Tone.Merge();
	        /**
			 *  the effect return LEFT
			 *  @type {GainNode}
			 *  @private
			 */
	        this.effectReturnL = this._merge.left;
	        /**
			 *  the effect return RIGHT
			 *  @type {GainNode}
			 *  @private
			 */
	        this.effectReturnR = this._merge.right;
	        //connections
	        this.input.connect(this._split);
	        //dry wet connections
	        this.input.connect(this._dryWet, 0, 0);
	        this._merge.connect(this._dryWet, 0, 1);
	        this._dryWet.connect(this.output);
	        this._readOnly(['wet']);
	    };
	    Tone.extend(Tone.StereoEffect, Tone.Effect);
	    /**
		 *  Clean up. 
		 *  @returns {Tone.StereoEffect} this
		 */
	    Tone.StereoEffect.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._dryWet.dispose();
	        this._dryWet = null;
	        this._split.dispose();
	        this._split = null;
	        this._merge.dispose();
	        this._merge = null;
	        this.effectSendL = null;
	        this.effectSendR = null;
	        this.effectReturnL = null;
	        this.effectReturnR = null;
	        this._writable(['wet']);
	        this.wet = null;
	        return this;
	    };
	    return Tone.StereoEffect;
	});
	Module(function (Tone) {
	    
	    /**
		 * 	@class  Tone.FeedbackEffect provides a loop between an 
		 * 	        audio source and its own output. This is a base-class
		 * 	        for feedback effects. 
		 *
		 *  @constructor
		 *  @extends {Tone.Effect}
		 *  @param {NormalRange|Object} [feedback] The initial feedback value.
		 */
	    Tone.FeedbackEffect = function () {
	        var options = this.optionsObject(arguments, ['feedback']);
	        options = this.defaultArg(options, Tone.FeedbackEffect.defaults);
	        Tone.Effect.call(this, options);
	        /**
			 *  The amount of signal which is fed back into the effect input. 
			 *  @type {NormalRange}
			 *  @signal
			 */
	        this.feedback = new Tone.Signal(options.feedback, Tone.Type.NormalRange);
	        /**
			 *  the gain which controls the feedback
			 *  @type {GainNode}
			 *  @private
			 */
	        this._feedbackGain = this.context.createGain();
	        //the feedback loop
	        this.effectReturn.chain(this._feedbackGain, this.effectSend);
	        this.feedback.connect(this._feedbackGain.gain);
	        this._readOnly(['feedback']);
	    };
	    Tone.extend(Tone.FeedbackEffect, Tone.Effect);
	    /**
		 *  @static
		 *  @type {Object}
		 */
	    Tone.FeedbackEffect.defaults = { 'feedback': 0.125 };
	    /**
		 *  Clean up. 
		 *  @returns {Tone.FeedbackEffect} this
		 */
	    Tone.FeedbackEffect.prototype.dispose = function () {
	        Tone.Effect.prototype.dispose.call(this);
	        this._writable(['feedback']);
	        this.feedback.dispose();
	        this.feedback = null;
	        this._feedbackGain.disconnect();
	        this._feedbackGain = null;
	        return this;
	    };
	    return Tone.FeedbackEffect;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Just like a stereo feedback effect, but the feedback is routed from left to right
		 *         and right to left instead of on the same channel.
		 *
		 *	@constructor
		 *	@extends {Tone.FeedbackEffect}
		 */
	    Tone.StereoXFeedbackEffect = function () {
	        var options = this.optionsObject(arguments, ['feedback'], Tone.FeedbackEffect.defaults);
	        Tone.StereoEffect.call(this, options);
	        /**
			 *  The amount of feedback from the output
			 *  back into the input of the effect (routed
			 *  across left and right channels).
			 *  @type {NormalRange}
			 *  @signal
			 */
	        this.feedback = new Tone.Signal(options.feedback, Tone.Type.NormalRange);
	        /**
			 *  the left side feeback
			 *  @type {GainNode}
			 *  @private
			 */
	        this._feedbackLR = this.context.createGain();
	        /**
			 *  the right side feeback
			 *  @type {GainNode}
			 *  @private
			 */
	        this._feedbackRL = this.context.createGain();
	        //connect it up
	        this.effectReturnL.chain(this._feedbackLR, this.effectSendR);
	        this.effectReturnR.chain(this._feedbackRL, this.effectSendL);
	        this.feedback.fan(this._feedbackLR.gain, this._feedbackRL.gain);
	        this._readOnly(['feedback']);
	    };
	    Tone.extend(Tone.StereoXFeedbackEffect, Tone.FeedbackEffect);
	    /**
		 *  clean up
		 *  @returns {Tone.StereoXFeedbackEffect} this
		 */
	    Tone.StereoXFeedbackEffect.prototype.dispose = function () {
	        Tone.StereoEffect.prototype.dispose.call(this);
	        this._writable(['feedback']);
	        this.feedback.dispose();
	        this.feedback = null;
	        this._feedbackLR.disconnect();
	        this._feedbackLR = null;
	        this._feedbackRL.disconnect();
	        this._feedbackRL = null;
	        return this;
	    };
	    return Tone.StereoXFeedbackEffect;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.Chorus is a stereo chorus effect with feedback composed of 
		 *         a left and right delay with a Tone.LFO applied to the delayTime of each channel. 
		 *         Inspiration from [Tuna.js](https://github.com/Dinahmoe/tuna/blob/master/tuna.js).
		 *         Read more on the chorus effect on [SoundOnSound](http://www.soundonsound.com/sos/jun04/articles/synthsecrets.htm).
		 *
		 *	@constructor
		 *	@extends {Tone.StereoXFeedbackEffect}
		 *	@param {Frequency|Object} [frequency] The frequency of the LFO.
		 *	@param {Milliseconds} [delayTime] The delay of the chorus effect in ms. 
		 *	@param {NormalRange} [depth] The depth of the chorus.
		 *	@example
		 * var chorus = new Tone.Chorus(4, 2.5, 0.5);
		 * var synth = new Tone.PolySynth(4, Tone.MonoSynth).connect(chorus);
		 * synth.triggerAttackRelease(["C3","E3","G3"], "8n");
		 */
	    Tone.Chorus = function () {
	        var options = this.optionsObject(arguments, [
	            'frequency',
	            'delayTime',
	            'depth'
	        ], Tone.Chorus.defaults);
	        Tone.StereoXFeedbackEffect.call(this, options);
	        /**
			 *  the depth of the chorus
			 *  @type {number}
			 *  @private
			 */
	        this._depth = options.depth;
	        /**
			 *  the delayTime
			 *  @type {number}
			 *  @private
			 */
	        this._delayTime = options.delayTime / 1000;
	        /**
			 *  the lfo which controls the delayTime
			 *  @type {Tone.LFO}
			 *  @private
			 */
	        this._lfoL = new Tone.LFO({
	            'frequency': options.frequency,
	            'min': 0,
	            'max': 1
	        });
	        /**
			 *  another LFO for the right side with a 180 degree phase diff
			 *  @type {Tone.LFO}
			 *  @private
			 */
	        this._lfoR = new Tone.LFO({
	            'frequency': options.frequency,
	            'min': 0,
	            'max': 1,
	            'phase': 180
	        });
	        /**
			 *  delay for left
			 *  @type {DelayNode}
			 *  @private
			 */
	        this._delayNodeL = this.context.createDelay();
	        /**
			 *  delay for right
			 *  @type {DelayNode}
			 *  @private
			 */
	        this._delayNodeR = this.context.createDelay();
	        /**
			 * The frequency of the LFO which modulates the delayTime. 
			 * @type {Frequency}
			 * @signal
			 */
	        this.frequency = this._lfoL.frequency;
	        //connections
	        this.effectSendL.chain(this._delayNodeL, this.effectReturnL);
	        this.effectSendR.chain(this._delayNodeR, this.effectReturnR);
	        //and pass through to make the detune apparent
	        this.effectSendL.connect(this.effectReturnL);
	        this.effectSendR.connect(this.effectReturnR);
	        //lfo setup
	        this._lfoL.connect(this._delayNodeL.delayTime);
	        this._lfoR.connect(this._delayNodeR.delayTime);
	        //start the lfo
	        this._lfoL.start();
	        this._lfoR.start();
	        //have one LFO frequency control the other
	        this._lfoL.frequency.connect(this._lfoR.frequency);
	        //set the initial values
	        this.depth = this._depth;
	        this.frequency.value = options.frequency;
	        this.type = options.type;
	        this._readOnly(['frequency']);
	    };
	    Tone.extend(Tone.Chorus, Tone.StereoXFeedbackEffect);
	    /**
		 *  @static
		 *  @type {Object}
		 */
	    Tone.Chorus.defaults = {
	        'frequency': 1.5,
	        'delayTime': 3.5,
	        'depth': 0.7,
	        'feedback': 0.1,
	        'type': 'sine'
	    };
	    /**
		 * The depth of the effect. A depth of 1 makes the delayTime
		 * modulate between 0 and 2*delayTime (centered around the delayTime). 
		 * @memberOf Tone.Chorus#
		 * @type {NormalRange}
		 * @name depth
		 */
	    Object.defineProperty(Tone.Chorus.prototype, 'depth', {
	        get: function () {
	            return this._depth;
	        },
	        set: function (depth) {
	            this._depth = depth;
	            var deviation = this._delayTime * depth;
	            this._lfoL.min = Math.max(this._delayTime - deviation, 0);
	            this._lfoL.max = this._delayTime + deviation;
	            this._lfoR.min = Math.max(this._delayTime - deviation, 0);
	            this._lfoR.max = this._delayTime + deviation;
	        }
	    });
	    /**
		 * The delayTime in milliseconds of the chorus. A larger delayTime
		 * will give a more pronounced effect. Nominal range a delayTime
		 * is between 2 and 20ms. 
		 * @memberOf Tone.Chorus#
		 * @type {Milliseconds}
		 * @name delayTime
		 */
	    Object.defineProperty(Tone.Chorus.prototype, 'delayTime', {
	        get: function () {
	            return this._delayTime * 1000;
	        },
	        set: function (delayTime) {
	            this._delayTime = delayTime / 1000;
	            this.depth = this._depth;
	        }
	    });
	    /**
		 * The oscillator type of the LFO. 
		 * @memberOf Tone.Chorus#
		 * @type {string}
		 * @name type
		 */
	    Object.defineProperty(Tone.Chorus.prototype, 'type', {
	        get: function () {
	            return this._lfoL.type;
	        },
	        set: function (type) {
	            this._lfoL.type = type;
	            this._lfoR.type = type;
	        }
	    });
	    /**
		 *  Clean up. 
		 *  @returns {Tone.Chorus} this
		 */
	    Tone.Chorus.prototype.dispose = function () {
	        Tone.StereoXFeedbackEffect.prototype.dispose.call(this);
	        this._lfoL.dispose();
	        this._lfoL = null;
	        this._lfoR.dispose();
	        this._lfoR = null;
	        this._delayNodeL.disconnect();
	        this._delayNodeL = null;
	        this._delayNodeR.disconnect();
	        this._delayNodeR = null;
	        this._writable('frequency');
	        this.frequency = null;
	        return this;
	    };
	    return Tone.Chorus;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.Convolver is a wrapper around the Native Web Audio 
		 *          [ConvolverNode](http://webaudio.github.io/web-audio-api/#the-convolvernode-interface).
		 *          Convolution is useful for reverb and filter emulation. Read more about convolution reverb on
		 *          [Wikipedia](https://en.wikipedia.org/wiki/Convolution_reverb).
		 *  
		 *  @constructor
		 *  @extends {Tone.Effect}
		 *  @param {string|Tone.Buffer|Object} [url] The URL of the impulse response or the Tone.Buffer
		 *                                           contianing the impulse response. 
		 *  @example
		 * //initializing the convolver with an impulse response
		 * var convolver = new Tone.Convolver("./path/to/ir.wav");
		 * convolver.toMaster();
		 * //after the buffer has loaded
		 * Tone.Buffer.onload = function(){
		 * 	//testing out convolution with a noise burst
		 * 	var burst = new Tone.NoiseSynth().connect(convolver);
		 * 	burst.triggerAttackRelease("16n");
		 * };
		 */
	    Tone.Convolver = function () {
	        var options = this.optionsObject(arguments, ['url'], Tone.Convolver.defaults);
	        Tone.Effect.call(this, options);
	        /**
			 *  convolver node
			 *  @type {ConvolverNode}
			 *  @private
			 */
	        this._convolver = this.context.createConvolver();
	        /**
			 *  the convolution buffer
			 *  @type {Tone.Buffer}
			 *  @private
			 */
	        this._buffer = new Tone.Buffer(options.url, function (buffer) {
	            this.buffer = buffer;
	            options.onload();
	        }.bind(this));
	        this.connectEffect(this._convolver);
	    };
	    Tone.extend(Tone.Convolver, Tone.Effect);
	    /**
		 *  @static
		 *  @const
		 *  @type  {Object}
		 */
	    Tone.Convolver.defaults = {
	        'url': '',
	        'onload': Tone.noOp
	    };
	    /**
		 *  The convolver's buffer
		 *  @memberOf Tone.Convolver#
		 *  @type {AudioBuffer}
		 *  @name buffer
		 */
	    Object.defineProperty(Tone.Convolver.prototype, 'buffer', {
	        get: function () {
	            return this._buffer.get();
	        },
	        set: function (buffer) {
	            this._buffer.set(buffer);
	            this._convolver.buffer = this._buffer.get();
	        }
	    });
	    /**
		 *  Load an impulse response url as an audio buffer.
		 *  Decodes the audio asynchronously and invokes
		 *  the callback once the audio buffer loads.
		 *  @param {string} url The url of the buffer to load.
		 *                      filetype support depends on the
		 *                      browser.
		 *  @param  {function=} callback
		 *  @returns {Tone.Convolver} this
		 */
	    Tone.Convolver.prototype.load = function (url, callback) {
	        this._buffer.load(url, function (buff) {
	            this.buffer = buff;
	            if (callback) {
	                callback();
	            }
	        }.bind(this));
	        return this;
	    };
	    /**
		 *  Clean up. 
		 *  @returns {Tone.Convolver} this
		 */
	    Tone.Convolver.prototype.dispose = function () {
	        Tone.Effect.prototype.dispose.call(this);
	        this._convolver.disconnect();
	        this._convolver = null;
	        this._buffer.dispose();
	        this._buffer = null;
	        return this;
	    };
	    return Tone.Convolver;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.Distortion is a simple distortion effect using Tone.WaveShaper.
		 *         Algorithm from [a stackoverflow answer](http://stackoverflow.com/a/22313408).
		 *
		 *  @extends {Tone.Effect}
		 *  @constructor
		 *  @param {Number|Object} [distortion] The amount of distortion (nominal range of 0-1)
		 *  @example
		 * var dist = new Tone.Distortion(0.8).toMaster();
		 * var fm = new Tone.SimpleFM().connect(dist);
		 * //this sounds good on bass notes
		 * fm.triggerAttackRelease("A1", "8n");
		 */
	    Tone.Distortion = function () {
	        var options = this.optionsObject(arguments, ['distortion'], Tone.Distortion.defaults);
	        Tone.Effect.call(this, options);
	        /**
			 *  @type {Tone.WaveShaper}
			 *  @private
			 */
	        this._shaper = new Tone.WaveShaper(4096);
	        /**
			 * holds the distortion amount
			 * @type {number}
			 * @private
			 */
	        this._distortion = options.distortion;
	        this.connectEffect(this._shaper);
	        this.distortion = options.distortion;
	        this.oversample = options.oversample;
	    };
	    Tone.extend(Tone.Distortion, Tone.Effect);
	    /**
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
	    Tone.Distortion.defaults = {
	        'distortion': 0.4,
	        'oversample': 'none'
	    };
	    /**
		 * The amount of distortion.
		 * @memberOf Tone.Distortion#
		 * @type {NormalRange}
		 * @name distortion
		 */
	    Object.defineProperty(Tone.Distortion.prototype, 'distortion', {
	        get: function () {
	            return this._distortion;
	        },
	        set: function (amount) {
	            this._distortion = amount;
	            var k = amount * 100;
	            var deg = Math.PI / 180;
	            this._shaper.setMap(function (x) {
	                if (Math.abs(x) < 0.001) {
	                    //should output 0 when input is 0
	                    return 0;
	                } else {
	                    return (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
	                }
	            });
	        }
	    });
	    /**
		 * The oversampling of the effect. Can either be "none", "2x" or "4x".
		 * @memberOf Tone.Distortion#
		 * @type {string}
		 * @name oversample
		 */
	    Object.defineProperty(Tone.Distortion.prototype, 'oversample', {
	        get: function () {
	            return this._shaper.oversample;
	        },
	        set: function (oversampling) {
	            this._shaper.oversample = oversampling;
	        }
	    });
	    /**
		 *  Clean up. 
		 *  @returns {Tone.Distortion} this
		 */
	    Tone.Distortion.prototype.dispose = function () {
	        Tone.Effect.prototype.dispose.call(this);
	        this._shaper.dispose();
	        this._shaper = null;
	        return this;
	    };
	    return Tone.Distortion;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.FeedbackDelay is a DelayNode in which part of output
		 *          signal is fed back into the delay. 
		 *
		 *  @constructor
		 *  @extends {Tone.FeedbackEffect}
		 *  @param {Time|Object} [delayTime] The delay applied to the incoming signal. 
		 *  @param {NormalRange=} feedback The amount of the effected signal which 
		 *                            is fed back through the delay.
		 *  @example
		 * var feedbackDelay = new Tone.FeedbackDelay("8n", 0.5).toMaster();
		 * var tom = new Tone.DrumSynth({
		 * 	"octaves" : 4,
		 * 	"pitchDecay" : 0.1
		 * }).connect(feedbackDelay);
		 * tom.triggerAttackRelease("A2","32n");
		 */
	    Tone.FeedbackDelay = function () {
	        var options = this.optionsObject(arguments, [
	            'delayTime',
	            'feedback'
	        ], Tone.FeedbackDelay.defaults);
	        Tone.FeedbackEffect.call(this, options);
	        /**
			 *  The delayTime of the DelayNode. 
			 *  @type {Time}
			 *  @signal
			 */
	        this.delayTime = new Tone.Signal(options.delayTime, Tone.Type.Time);
	        /**
			 *  the delay node
			 *  @type {DelayNode}
			 *  @private
			 */
	        this._delayNode = this.context.createDelay(4);
	        // connect it up
	        this.connectEffect(this._delayNode);
	        this.delayTime.connect(this._delayNode.delayTime);
	        this._readOnly(['delayTime']);
	    };
	    Tone.extend(Tone.FeedbackDelay, Tone.FeedbackEffect);
	    /**
		 *  The default values. 
		 *  @const
		 *  @static
		 *  @type {Object}
		 */
	    Tone.FeedbackDelay.defaults = { 'delayTime': 0.25 };
	    /**
		 *  clean up
		 *  @returns {Tone.FeedbackDelay} this
		 */
	    Tone.FeedbackDelay.prototype.dispose = function () {
	        Tone.FeedbackEffect.prototype.dispose.call(this);
	        this.delayTime.dispose();
	        this._delayNode.disconnect();
	        this._delayNode = null;
	        this._writable(['delayTime']);
	        this.delayTime = null;
	        return this;
	    };
	    return Tone.FeedbackDelay;
	});
	Module(function (Tone) {
	    
	    /**
		 *  an array of comb filter delay values from Freeverb implementation
		 *  @static
		 *  @private
		 *  @type {Array}
		 */
	    var combFilterTunings = [
	        1557 / 44100,
	        1617 / 44100,
	        1491 / 44100,
	        1422 / 44100,
	        1277 / 44100,
	        1356 / 44100,
	        1188 / 44100,
	        1116 / 44100
	    ];
	    /**
		 *  an array of allpass filter frequency values from Freeverb implementation
		 *  @private
		 *  @static
		 *  @type {Array}
		 */
	    var allpassFilterFrequencies = [
	        225,
	        556,
	        441,
	        341
	    ];
	    /**
		 *  @class Tone.Freeverb is a reverb based on [Freeverb](https://ccrma.stanford.edu/~jos/pasp/Freeverb.html).
		 *         Read more on reverb on [SoundOnSound](http://www.soundonsound.com/sos/may00/articles/reverb.htm).
		 *
		 *  @extends {Tone.Effect}
		 *  @constructor
		 *  @param {NormalRange|Object} [roomSize] Correlated to the decay time. 
		 *  @param {Frequency} [dampening] The cutoff frequency of a lowpass filter as part 
		 *                                 of the reverb. 
		 *  @example
		 * var freeverb = new Tone.Freeverb().toMaster();
		 * freeverb.dampening.value = 1000;
		 * //routing synth through the reverb
		 * var synth = new Tone.AMSynth().connect(freeverb);
		 */
	    Tone.Freeverb = function () {
	        var options = this.optionsObject(arguments, [
	            'roomSize',
	            'dampening'
	        ], Tone.Freeverb.defaults);
	        Tone.StereoEffect.call(this, options);
	        /**
			 *  The roomSize value between. A larger roomSize
			 *  will result in a longer decay. 
			 *  @type {NormalRange}
			 *  @signal
			 */
	        this.roomSize = new Tone.Signal(options.roomSize, Tone.Type.NormalRange);
	        /**
			 *  The amount of dampening of the reverberant signal. 
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.dampening = new Tone.Signal(options.dampening, Tone.Type.Frequency);
	        /**
			 *  the comb filters
			 *  @type {Array}
			 *  @private
			 */
	        this._combFilters = [];
	        /**
			 *  the allpass filters on the left
			 *  @type {Array}
			 *  @private
			 */
	        this._allpassFiltersL = [];
	        /**
			 *  the allpass filters on the right
			 *  @type {Array}
			 *  @private
			 */
	        this._allpassFiltersR = [];
	        //make the allpass filters on teh right
	        for (var l = 0; l < allpassFilterFrequencies.length; l++) {
	            var allpassL = this.context.createBiquadFilter();
	            allpassL.type = 'allpass';
	            allpassL.frequency.value = allpassFilterFrequencies[l];
	            this._allpassFiltersL.push(allpassL);
	        }
	        //make the allpass filters on the left
	        for (var r = 0; r < allpassFilterFrequencies.length; r++) {
	            var allpassR = this.context.createBiquadFilter();
	            allpassR.type = 'allpass';
	            allpassR.frequency.value = allpassFilterFrequencies[r];
	            this._allpassFiltersR.push(allpassR);
	        }
	        //make the comb filters
	        for (var c = 0; c < combFilterTunings.length; c++) {
	            var lfpf = new Tone.LowpassCombFilter(combFilterTunings[c]);
	            if (c < combFilterTunings.length / 2) {
	                this.effectSendL.chain(lfpf, this._allpassFiltersL[0]);
	            } else {
	                this.effectSendR.chain(lfpf, this._allpassFiltersR[0]);
	            }
	            this.roomSize.connect(lfpf.resonance);
	            this.dampening.connect(lfpf.dampening);
	            this._combFilters.push(lfpf);
	        }
	        //chain the allpass filters togetehr
	        this.connectSeries.apply(this, this._allpassFiltersL);
	        this.connectSeries.apply(this, this._allpassFiltersR);
	        this._allpassFiltersL[this._allpassFiltersL.length - 1].connect(this.effectReturnL);
	        this._allpassFiltersR[this._allpassFiltersR.length - 1].connect(this.effectReturnR);
	        this._readOnly([
	            'roomSize',
	            'dampening'
	        ]);
	    };
	    Tone.extend(Tone.Freeverb, Tone.StereoEffect);
	    /**
		 *  @static
		 *  @type {Object}
		 */
	    Tone.Freeverb.defaults = {
	        'roomSize': 0.7,
	        'dampening': 3000
	    };
	    /**
		 *  Clean up. 
		 *  @returns {Tone.Freeverb} this
		 */
	    Tone.Freeverb.prototype.dispose = function () {
	        Tone.StereoEffect.prototype.dispose.call(this);
	        for (var al = 0; al < this._allpassFiltersL.length; al++) {
	            this._allpassFiltersL[al].disconnect();
	            this._allpassFiltersL[al] = null;
	        }
	        this._allpassFiltersL = null;
	        for (var ar = 0; ar < this._allpassFiltersR.length; ar++) {
	            this._allpassFiltersR[ar].disconnect();
	            this._allpassFiltersR[ar] = null;
	        }
	        this._allpassFiltersR = null;
	        for (var cf = 0; cf < this._combFilters.length; cf++) {
	            this._combFilters[cf].dispose();
	            this._combFilters[cf] = null;
	        }
	        this._combFilters = null;
	        this._writable([
	            'roomSize',
	            'dampening'
	        ]);
	        this.roomSize.dispose();
	        this.roomSize = null;
	        this.dampening.dispose();
	        this.dampening = null;
	        return this;
	    };
	    return Tone.Freeverb;
	});
	Module(function (Tone) {
	    
	    /**
		 *  an array of the comb filter delay time values
		 *  @private
		 *  @static
		 *  @type {Array}
		 */
	    var combFilterDelayTimes = [
	        1687 / 25000,
	        1601 / 25000,
	        2053 / 25000,
	        2251 / 25000
	    ];
	    /**
		 *  the resonances of each of the comb filters
		 *  @private
		 *  @static
		 *  @type {Array}
		 */
	    var combFilterResonances = [
	        0.773,
	        0.802,
	        0.753,
	        0.733
	    ];
	    /**
		 *  the allpass filter frequencies
		 *  @private
		 *  @static
		 *  @type {Array}
		 */
	    var allpassFilterFreqs = [
	        347,
	        113,
	        37
	    ];
	    /**
		 *  @class Tone.JCReverb is a simple [Schroeder Reverberator](https://ccrma.stanford.edu/~jos/pasp/Schroeder_Reverberators.html)
		 *         tuned by John Chowning in 1970.
		 *         It is made up of three allpass filters and four Tone.FeedbackCombFilter. 
		 *         
		 *
		 *  @extends {Tone.Effect}
		 *  @constructor
		 *  @param {NormalRange|Object} [roomSize] Coorelates to the decay time.
		 *  @example
		 * var reverb = new Tone.JCReverb(0.4).connect(Tone.Master);
		 * var delay = new Tone.FeedbackDelay(0.5); 
		 * //connecting the synth to reverb through delay
		 * var synth = new Tone.DuoSynth().chain(delay, reverb);
		 * synth.triggerAttackRelease("A4","8n");
		 */
	    Tone.JCReverb = function () {
	        var options = this.optionsObject(arguments, ['roomSize'], Tone.JCReverb.defaults);
	        Tone.StereoEffect.call(this, options);
	        /**
			 *  room size control values between [0,1]
			 *  @type {NormalRange}
			 *  @signal
			 */
	        this.roomSize = new Tone.Signal(options.roomSize, Tone.Type.NormalRange);
	        /**
			 *  scale the room size
			 *  @type {Tone.Scale}
			 *  @private
			 */
	        this._scaleRoomSize = new Tone.Scale(-0.733, 0.197);
	        /**
			 *  a series of allpass filters
			 *  @type {Array}
			 *  @private
			 */
	        this._allpassFilters = [];
	        /**
			 *  parallel feedback comb filters
			 *  @type {Array}
			 *  @private
			 */
	        this._feedbackCombFilters = [];
	        //make the allpass filters
	        for (var af = 0; af < allpassFilterFreqs.length; af++) {
	            var allpass = this.context.createBiquadFilter();
	            allpass.type = 'allpass';
	            allpass.frequency.value = allpassFilterFreqs[af];
	            this._allpassFilters.push(allpass);
	        }
	        //and the comb filters
	        for (var cf = 0; cf < combFilterDelayTimes.length; cf++) {
	            var fbcf = new Tone.FeedbackCombFilter(combFilterDelayTimes[cf], 0.1);
	            this._scaleRoomSize.connect(fbcf.resonance);
	            fbcf.resonance.value = combFilterResonances[cf];
	            this._allpassFilters[this._allpassFilters.length - 1].connect(fbcf);
	            if (cf < combFilterDelayTimes.length / 2) {
	                fbcf.connect(this.effectReturnL);
	            } else {
	                fbcf.connect(this.effectReturnR);
	            }
	            this._feedbackCombFilters.push(fbcf);
	        }
	        //chain the allpass filters together
	        this.roomSize.connect(this._scaleRoomSize);
	        this.connectSeries.apply(this, this._allpassFilters);
	        this.effectSendL.connect(this._allpassFilters[0]);
	        this.effectSendR.connect(this._allpassFilters[0]);
	        this._readOnly(['roomSize']);
	    };
	    Tone.extend(Tone.JCReverb, Tone.StereoEffect);
	    /**
		 *  the default values
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
	    Tone.JCReverb.defaults = { 'roomSize': 0.5 };
	    /**
		 *  Clean up. 
		 *  @returns {Tone.JCReverb} this
		 */
	    Tone.JCReverb.prototype.dispose = function () {
	        Tone.StereoEffect.prototype.dispose.call(this);
	        for (var apf = 0; apf < this._allpassFilters.length; apf++) {
	            this._allpassFilters[apf].disconnect();
	            this._allpassFilters[apf] = null;
	        }
	        this._allpassFilters = null;
	        for (var fbcf = 0; fbcf < this._feedbackCombFilters.length; fbcf++) {
	            this._feedbackCombFilters[fbcf].dispose();
	            this._feedbackCombFilters[fbcf] = null;
	        }
	        this._feedbackCombFilters = null;
	        this._writable(['roomSize']);
	        this.roomSize.dispose();
	        this.roomSize = null;
	        this._scaleRoomSize.dispose();
	        this._scaleRoomSize = null;
	        return this;
	    };
	    return Tone.JCReverb;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Mid/Side processing separates the the 'mid' signal 
		 *         (which comes out of both the left and the right channel) 
		 *         and the 'side' (which only comes out of the the side channels) 
		 *         and effects them separately before being recombined.
		 *         Applies a Mid/Side seperation and recombination.
		 *         Algorithm found in [kvraudio forums](http://www.kvraudio.com/forum/viewtopic.php?t=212587).
		 *         <br><br>
		 *         This is a base-class for Mid/Side Effects. 
		 *
		 *  @extends {Tone.Effect}
		 *  @constructor
		 */
	    Tone.MidSideEffect = function () {
	        Tone.Effect.apply(this, arguments);
	        /**
			 *  The mid/side split
			 *  @type  {Tone.MidSideSplit}
			 *  @private
			 */
	        this._midSideSplit = new Tone.MidSideSplit();
	        /**
			 *  The mid/side merge
			 *  @type  {Tone.MidSideMerge}
			 *  @private
			 */
	        this._midSideMerge = new Tone.MidSideMerge();
	        /**
			 *  The mid send. Connect to mid processing
			 *  @type {Tone.Expr}
			 *  @private
			 */
	        this.midSend = this._midSideSplit.mid;
	        /**
			 *  The side send. Connect to side processing
			 *  @type {Tone.Expr}
			 *  @private
			 */
	        this.sideSend = this._midSideSplit.side;
	        /**
			 *  The mid return connection
			 *  @type {GainNode}
			 *  @private
			 */
	        this.midReturn = this._midSideMerge.mid;
	        /**
			 *  The side return connection
			 *  @type {GainNode}
			 *  @private
			 */
	        this.sideReturn = this._midSideMerge.side;
	        //the connections
	        this.effectSend.connect(this._midSideSplit);
	        this._midSideMerge.connect(this.effectReturn);
	    };
	    Tone.extend(Tone.MidSideEffect, Tone.Effect);
	    /**
		 *  Clean up. 
		 *  @returns {Tone.MidSideEffect} this
		 */
	    Tone.MidSideEffect.prototype.dispose = function () {
	        Tone.Effect.prototype.dispose.call(this);
	        this._midSideSplit.dispose();
	        this._midSideSplit = null;
	        this._midSideMerge.dispose();
	        this._midSideMerge = null;
	        this.midSend = null;
	        this.sideSend = null;
	        this.midReturn = null;
	        this.sideReturn = null;
	        return this;
	    };
	    return Tone.MidSideEffect;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.Phaser is a phaser effect. Phasers work by changing the phase
		 *         of different frequency components of an incoming signal. Read more on 
		 *         [Wikipedia](https://en.wikipedia.org/wiki/Phaser_(effect)). 
		 *         Inspiration for this phaser comes from [Tuna.js](https://github.com/Dinahmoe/tuna/).
		 *
		 *	@extends {Tone.StereoEffect}
		 *	@constructor
		 *	@param {Frequency|Object} [frequency] The speed of the phasing. 
		 *	@param {number} [depth] The depth of the effect. 
		 *	@param {Frequency} [baseFrequency] The base frequency of the filters. 
		 *	@example
		 * var phaser = new Tone.Phaser({
		 * 	"frequency" : 15, 
		 * 	"depth" : 5, 
		 * 	"baseFrequency" : 1000
		 * }).toMaster();
		 * var synth = new Tone.FMSynth().connect(phaser);
		 * synth.triggerAttackRelease("E3", "2n");
		 */
	    Tone.Phaser = function () {
	        //set the defaults
	        var options = this.optionsObject(arguments, [
	            'frequency',
	            'depth',
	            'baseFrequency'
	        ], Tone.Phaser.defaults);
	        Tone.StereoEffect.call(this, options);
	        /**
			 *  the lfo which controls the frequency on the left side
			 *  @type {Tone.LFO}
			 *  @private
			 */
	        this._lfoL = new Tone.LFO(options.frequency, 0, 1);
	        /**
			 *  the lfo which controls the frequency on the right side
			 *  @type {Tone.LFO}
			 *  @private
			 */
	        this._lfoR = new Tone.LFO(options.frequency, 0, 1);
	        this._lfoR.phase = 180;
	        /**
			 *  the base modulation frequency
			 *  @type {number}
			 *  @private
			 */
	        this._baseFrequency = options.baseFrequency;
	        /**
			 *  the depth of the phasing
			 *  @type {number}
			 *  @private
			 */
	        this._depth = options.depth;
	        /**
			 *  The quality factor of the filters
			 *  @type {Positive}
			 *  @signal
			 */
	        this.Q = new Tone.Signal(options.Q, Tone.Type.Positive);
	        /**
			 *  the array of filters for the left side
			 *  @type {Array}
			 *  @private
			 */
	        this._filtersL = this._makeFilters(options.stages, this._lfoL, this.Q);
	        /**
			 *  the array of filters for the left side
			 *  @type {Array}
			 *  @private
			 */
	        this._filtersR = this._makeFilters(options.stages, this._lfoR, this.Q);
	        /**
			 * the frequency of the effect
			 * @type {Tone.Signal}
			 */
	        this.frequency = this._lfoL.frequency;
	        this.frequency.value = options.frequency;
	        //connect them up
	        this.effectSendL.connect(this._filtersL[0]);
	        this.effectSendR.connect(this._filtersR[0]);
	        this._filtersL[options.stages - 1].connect(this.effectReturnL);
	        this._filtersR[options.stages - 1].connect(this.effectReturnR);
	        //control the frequency with one LFO
	        this._lfoL.frequency.connect(this._lfoR.frequency);
	        //set the options
	        this.baseFrequency = options.baseFrequency;
	        this.depth = options.depth;
	        //start the lfo
	        this._lfoL.start();
	        this._lfoR.start();
	        this._readOnly([
	            'frequency',
	            'Q'
	        ]);
	    };
	    Tone.extend(Tone.Phaser, Tone.StereoEffect);
	    /**
		 *  defaults
		 *  @static
		 *  @type {object}
		 */
	    Tone.Phaser.defaults = {
	        'frequency': 0.5,
	        'depth': 10,
	        'stages': 10,
	        'Q': 10,
	        'baseFrequency': 350
	    };
	    /**
		 *  @param {number} stages
		 *  @returns {Array} the number of filters all connected together
		 *  @private
		 */
	    Tone.Phaser.prototype._makeFilters = function (stages, connectToFreq, Q) {
	        var filters = new Array(stages);
	        //make all the filters
	        for (var i = 0; i < stages; i++) {
	            var filter = this.context.createBiquadFilter();
	            filter.type = 'allpass';
	            Q.connect(filter.Q);
	            connectToFreq.connect(filter.frequency);
	            filters[i] = filter;
	        }
	        this.connectSeries.apply(this, filters);
	        return filters;
	    };
	    /**
		 * The depth of the effect. 
		 * @memberOf Tone.Phaser#
		 * @type {number}
		 * @name depth
		 */
	    Object.defineProperty(Tone.Phaser.prototype, 'depth', {
	        get: function () {
	            return this._depth;
	        },
	        set: function (depth) {
	            this._depth = depth;
	            var max = this._baseFrequency + this._baseFrequency * depth;
	            this._lfoL.max = max;
	            this._lfoR.max = max;
	        }
	    });
	    /**
		 * The the base frequency of the filters. 
		 * @memberOf Tone.Phaser#
		 * @type {number}
		 * @name baseFrequency
		 */
	    Object.defineProperty(Tone.Phaser.prototype, 'baseFrequency', {
	        get: function () {
	            return this._baseFrequency;
	        },
	        set: function (freq) {
	            this._baseFrequency = freq;
	            this._lfoL.min = freq;
	            this._lfoR.min = freq;
	            this.depth = this._depth;
	        }
	    });
	    /**
		 *  clean up
		 *  @returns {Tone.Phaser} this
		 */
	    Tone.Phaser.prototype.dispose = function () {
	        Tone.StereoEffect.prototype.dispose.call(this);
	        this._writable([
	            'frequency',
	            'Q'
	        ]);
	        this.Q.dispose();
	        this.Q = null;
	        this._lfoL.dispose();
	        this._lfoL = null;
	        this._lfoR.dispose();
	        this._lfoR = null;
	        for (var i = 0; i < this._filtersL.length; i++) {
	            this._filtersL[i].disconnect();
	            this._filtersL[i] = null;
	        }
	        this._filtersL = null;
	        for (var j = 0; j < this._filtersR.length; j++) {
	            this._filtersR[j].disconnect();
	            this._filtersR[j] = null;
	        }
	        this._filtersR = null;
	        this.frequency = null;
	        return this;
	    };
	    return Tone.Phaser;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.PingPongDelay is a feedback delay effect where the echo is heard
		 *          first in one channel and next in the opposite channel. In a stereo
		 *          system these are the right and left channels.
		 *          PingPongDelay in more simplified terms is two Tone.FeedbackDelays 
		 *          with independent delay values. Each delay is routed to one channel
		 *          (left or right), and the channel triggered second will always 
		 *          trigger at the same interval after the first.
		 *
		 * 	@constructor
		 * 	@extends {Tone.StereoXFeedbackEffect}
		 *  @param {Time|Object} [delayTime] The delayTime between consecutive echos.
		 *  @param {NormalRange=} feedback The amount of the effected signal which 
		 *                                 is fed back through the delay.
		 *  @example
		 * var pingPong = new Tone.PingPongDelay("4n", 0.2).toMaster();
		 * var drum = new Tone.DrumSynth().connect(pingPong);
		 * drum.triggerAttackRelease("C4", "32n");
		 */
	    Tone.PingPongDelay = function () {
	        var options = this.optionsObject(arguments, [
	            'delayTime',
	            'feedback'
	        ], Tone.PingPongDelay.defaults);
	        Tone.StereoXFeedbackEffect.call(this, options);
	        /**
			 *  the delay node on the left side
			 *  @type {DelayNode}
			 *  @private
			 */
	        this._leftDelay = this.context.createDelay(options.maxDelayTime);
	        /**
			 *  the delay node on the right side
			 *  @type {DelayNode}
			 *  @private
			 */
	        this._rightDelay = this.context.createDelay(options.maxDelayTime);
	        /**
			 *  the predelay on the right side
			 *  @type {DelayNode}
			 *  @private
			 */
	        this._rightPreDelay = this.context.createDelay(options.maxDelayTime);
	        /**
			 *  the delay time signal
			 *  @type {Time}
			 *  @signal
			 */
	        this.delayTime = new Tone.Signal(options.delayTime, Tone.Type.Time);
	        //connect it up
	        this.effectSendL.chain(this._leftDelay, this.effectReturnL);
	        this.effectSendR.chain(this._rightPreDelay, this._rightDelay, this.effectReturnR);
	        this.delayTime.fan(this._leftDelay.delayTime, this._rightDelay.delayTime, this._rightPreDelay.delayTime);
	        //rearranged the feedback to be after the rightPreDelay
	        this._feedbackLR.disconnect();
	        this._feedbackLR.connect(this._rightDelay);
	        this._readOnly(['delayTime']);
	    };
	    Tone.extend(Tone.PingPongDelay, Tone.StereoXFeedbackEffect);
	    /**
		 *  @static
		 *  @type {Object}
		 */
	    Tone.PingPongDelay.defaults = {
	        'delayTime': 0.25,
	        'maxDelayTime': 1
	    };
	    /**
		 *  Clean up. 
		 *  @returns {Tone.PingPongDelay} this
		 */
	    Tone.PingPongDelay.prototype.dispose = function () {
	        Tone.StereoXFeedbackEffect.prototype.dispose.call(this);
	        this._leftDelay.disconnect();
	        this._leftDelay = null;
	        this._rightDelay.disconnect();
	        this._rightDelay = null;
	        this._rightPreDelay.disconnect();
	        this._rightPreDelay = null;
	        this._writable(['delayTime']);
	        this.delayTime.dispose();
	        this.delayTime = null;
	        return this;
	    };
	    return Tone.PingPongDelay;
	});
	Module(function (Tone) {
	    /**
		 *  @class Tone.PitchShift does near-realtime pitch shifting to the incoming signal. 
		 *         The effect is achieved by speeding up or slowing down the delayTime
		 *         of a DelayNode using a sawtooth wave. 
		 *         Algorithm found in [this pdf](http://dsp-book.narod.ru/soundproc.pdf).
		 *         Additional reference by [Miller Pucket](http://msp.ucsd.edu/techniques/v0.11/book-html/node115.html).
		 *         
		 *  @extends {Tone.Effect}
		 *  @param {Interval=} pitch The interval to transpose the incoming signal by. 
		 */
	    Tone.PitchShift = function () {
	        var options = this.optionsObject(arguments, ['pitch'], Tone.PitchShift.defaults);
	        Tone.Effect.call(this, options);
	        /**
			 *  The pitch signal
			 *  @type  {Tone.Signal}
			 *  @private
			 */
	        this._frequency = new Tone.Signal(0);
	        /**
			 *  Uses two DelayNodes to cover up the jump in
			 *  the sawtooth wave. 
			 *  @type  {DelayNode}
			 *  @private
			 */
	        this._delayA = this.context.createDelay(1);
	        /**
			 *  The first LFO.
			 *  @type  {Tone.LFO}
			 *  @private
			 */
	        this._lfoA = new Tone.LFO({
	            'min': 0,
	            'max': 0.1,
	            'type': 'sawtooth'
	        }).connect(this._delayA.delayTime);
	        /**
			 *  The second DelayNode
			 *  @type  {DelayNode}
			 *  @private
			 */
	        this._delayB = this.context.createDelay(1);
	        /**
			 *  The first LFO.
			 *  @type  {Tone.LFO}
			 *  @private
			 */
	        this._lfoB = new Tone.LFO({
	            'min': 0,
	            'max': 0.1,
	            'type': 'sawtooth',
	            'phase': 180
	        }).connect(this._delayB.delayTime);
	        /**
			 *  Crossfade quickly between the two delay lines
			 *  to cover up the jump in the sawtooth wave
			 *  @type  {Tone.CrossFade}
			 *  @private
			 */
	        this._crossFade = new Tone.CrossFade().connect(this.effectReturn);
	        /**
			 *  LFO which alternates between the two
			 *  delay lines to cover up the disparity in the
			 *  sawtooth wave. 
			 *  @type  {Tone.LFO}
			 */
	        this._crossFadeLFO = new Tone.LFO({
	            'min': 0,
	            'max': 1,
	            'type': 'triangle',
	            'phase': 90
	        }).connect(this._crossFade.fade);
	        /**
			 *  Hold the current pitch
			 *  @type {Number}
			 *  @private
			 */
	        this._pitch = options.pitch;
	        /**
			 *  Hold the current windowSize
			 *  @type {Number}
			 *  @private
			 */
	        this._windowSize = options.windowSize;
	        //connect the two delay lines up
	        this._delayA.connect(this._crossFade.a);
	        this._delayB.connect(this._crossFade.b);
	        //connect the frequency
	        this._frequency.fan(this._lfoA.frequency, this._lfoB.frequency, this._crossFadeLFO.frequency);
	        //route the input
	        this.effectSend.fan(this._delayA, this._delayB);
	        //start the LFOs at the same time
	        var now = this.now();
	        this._lfoA.start(now);
	        this._lfoB.start(now);
	        this._crossFadeLFO.start(now);
	        //set the initial value
	        this.windowSize = this._windowSize;
	    };
	    Tone.extend(Tone.PitchShift, Tone.Effect);
	    /**
		 *  default values
		 *  @static
		 *  @type {Object}
		 *  @const
		 */
	    Tone.PitchShift.defaults = {
	        'pitch': 0,
	        'windowSize': 0.1
	    };
	    /**
		 * Repitch the incoming signal by some interval (measured
		 * in semi-tones). 
		 * @memberOf Tone.PitchShift#
		 * @type {Interval}
		 * @name pitch
		 * @example
		 * pitchShift.pitch = -12; //down one octave
		 * pitchShift.pitch = 7; //up a fifth
		 */
	    Object.defineProperty(Tone.PitchShift.prototype, 'pitch', {
	        get: function () {
	            return this._pitch;
	        },
	        set: function (interval) {
	            this._pitch = interval;
	            var factor = 0;
	            if (interval < 0) {
	                this._lfoA.min = 0;
	                this._lfoA.max = this._windowSize;
	                this._lfoB.min = 0;
	                this._lfoB.max = this._windowSize;
	                factor = this.intervalToFrequencyRatio(interval - 1) + 1;
	            } else {
	                this._lfoA.min = this._windowSize;
	                this._lfoA.max = 0;
	                this._lfoB.min = this._windowSize;
	                this._lfoB.max = 0;
	                factor = this.intervalToFrequencyRatio(interval) - 1;
	            }
	            this._frequency.value = factor * (1.2 / this._windowSize);
	        }
	    });
	    /**
		 * The window size corresponds roughly to the sample length in a looping sampler. 
		 * Smaller values are desirable for a less noticeable delay time of the pitch shifted
		 * signal, but larger values will result in smoother pitch shifting for larger intervals. 
		 * A nominal range of 0.03 to 0.1 is recommended. 
		 * @memberOf Tone.PitchShift#
		 * @type {Time}
		 * @name windowSize
		 * @example
		 * pitchShift.windowSize = 0.1;
		 */
	    Object.defineProperty(Tone.PitchShift.prototype, 'windowSize', {
	        get: function () {
	            return this._windowSize;
	        },
	        set: function (size) {
	            this._windowSize = this.toSeconds(size);
	            this.pitch = this._pitch;
	        }
	    });
	    /**
		 *  Clean up.
		 *  @return  {Tone.PitchShift}  this
		 */
	    Tone.PitchShift.prototype.dispose = function () {
	        Tone.Effect.prototype.dispose.call(this);
	        this._frequency.dispose();
	        this._frequency = null;
	        this._delayA.disconnect();
	        this._delayA = null;
	        this._delayB.disconnect();
	        this._delayB = null;
	        this._lfoA.dispose();
	        this._lfoA = null;
	        this._lfoB.dispose();
	        this._lfoB = null;
	        this._crossFade.dispose();
	        this._crossFade = null;
	        this._crossFadeLFO.dispose();
	        this._crossFadeLFO = null;
	        return this;
	    };
	    return Tone.PitchShift;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Base class for stereo feedback effects where the effectReturn
		 *         is fed back into the same channel. 
		 *
		 *	@constructor
		 *	@extends {Tone.FeedbackEffect}
		 */
	    Tone.StereoFeedbackEffect = function () {
	        var options = this.optionsObject(arguments, ['feedback'], Tone.FeedbackEffect.defaults);
	        Tone.StereoEffect.call(this, options);
	        /**
			 *  controls the amount of feedback
			 *  @type {NormalRange}
			 *  @signal
			 */
	        this.feedback = new Tone.Signal(options.feedback, Tone.Type.NormalRange);
	        /**
			 *  the left side feeback
			 *  @type {GainNode}
			 *  @private
			 */
	        this._feedbackL = this.context.createGain();
	        /**
			 *  the right side feeback
			 *  @type {GainNode}
			 *  @private
			 */
	        this._feedbackR = this.context.createGain();
	        //connect it up
	        this.effectReturnL.chain(this._feedbackL, this.effectSendL);
	        this.effectReturnR.chain(this._feedbackR, this.effectSendR);
	        this.feedback.fan(this._feedbackL.gain, this._feedbackR.gain);
	        this._readOnly(['feedback']);
	    };
	    Tone.extend(Tone.StereoFeedbackEffect, Tone.FeedbackEffect);
	    /**
		 *  clean up
		 *  @returns {Tone.StereoFeedbackEffect} this
		 */
	    Tone.StereoFeedbackEffect.prototype.dispose = function () {
	        Tone.StereoEffect.prototype.dispose.call(this);
	        this._writable(['feedback']);
	        this.feedback.dispose();
	        this.feedback = null;
	        this._feedbackL.disconnect();
	        this._feedbackL = null;
	        this._feedbackR.disconnect();
	        this._feedbackR = null;
	        return this;
	    };
	    return Tone.StereoFeedbackEffect;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Applies a width factor to the mid/side seperation. 
		 *         0 is all mid and 1 is all side.
		 *         Algorithm found in [kvraudio forums](http://www.kvraudio.com/forum/viewtopic.php?t=212587).
		 *         <br><br>
		 *         <code>
		 *         Mid *= 2*(1-width)<br>
		 *         Side *= 2*width
		 *         </code>
		 *
		 *  @extends {Tone.MidSideEffect}
		 *  @constructor
		 *  @param {NormalRange|Object} [width] The stereo width. A width of 0 is mono and 1 is stereo. 0.5 is no change.
		 */
	    Tone.StereoWidener = function () {
	        var options = this.optionsObject(arguments, ['width'], Tone.StereoWidener.defaults);
	        Tone.MidSideEffect.call(this, options);
	        /**
			 *  The width control. 0 = 100% mid. 1 = 100% side. 0.5 = no change. 
			 *  @type {NormalRange}
			 *  @signal
			 */
	        this.width = new Tone.Signal(options.width, Tone.Type.NormalRange);
	        /**
			 *  Mid multiplier
			 *  @type {Tone.Expr}
			 *  @private
			 */
	        this._midMult = new Tone.Expr('$0 * ($1 * (1 - $2))');
	        /**
			 *  Side multiplier
			 *  @type {Tone.Expr}
			 *  @private
			 */
	        this._sideMult = new Tone.Expr('$0 * ($1 * $2)');
	        /**
			 *  constant output of 2
			 *  @type {Tone}
			 *  @private
			 */
	        this._two = new Tone.Signal(2);
	        //the mid chain
	        this._two.connect(this._midMult, 0, 1);
	        this.width.connect(this._midMult, 0, 2);
	        //the side chain
	        this._two.connect(this._sideMult, 0, 1);
	        this.width.connect(this._sideMult, 0, 2);
	        //connect it to the effect send/return
	        this.midSend.chain(this._midMult, this.midReturn);
	        this.sideSend.chain(this._sideMult, this.sideReturn);
	        this._readOnly(['width']);
	    };
	    Tone.extend(Tone.StereoWidener, Tone.MidSideEffect);
	    /**
		 *  the default values
		 *  @static
		 *  @type {Object}
		 */
	    Tone.StereoWidener.defaults = { 'width': 0.5 };
	    /**
		 *  Clean up. 
		 *  @returns {Tone.StereoWidener} this
		 */
	    Tone.StereoWidener.prototype.dispose = function () {
	        Tone.MidSideEffect.prototype.dispose.call(this);
	        this._writable(['width']);
	        this.width.dispose();
	        this.width = null;
	        this._midMult.dispose();
	        this._midMult = null;
	        this._sideMult.dispose();
	        this._sideMult = null;
	        this._two.dispose();
	        this._two = null;
	        return this;
	    };
	    return Tone.StereoWidener;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.Tremelo modulates the amplitude of an incoming signal using a Tone.LFO. 
		 *         The type, frequency, and depth of the LFO is controllable. 
		 *
		 *  @extends {Tone.Effect}
		 *  @constructor
		 *  @param {Frequency|Object} [frequency] The rate of the effect. 
		 *  @param {NormalRange} [depth] The depth of the wavering.
		 *  @example
		 * //create an tremolo and start it's LFO
		 * var tremolo = new Tone.Tremolo(9, 0.75).toMaster().start();
		 * //route an oscillator through the tremolo and start it
		 * var oscillator = new Tone.Oscillator().connect(tremolo).start();
		 */
	    Tone.Tremolo = function () {
	        var options = this.optionsObject(arguments, [
	            'frequency',
	            'depth'
	        ], Tone.Tremolo.defaults);
	        Tone.Effect.call(this, options);
	        /**
			 *  The tremelo LFO
			 *  @type  {Tone.LFO}
			 *  @private
			 */
	        this._lfo = new Tone.LFO({
	            'frequency': options.frequency,
	            'amplitude': options.depth,
	            'min': 1,
	            'max': 0
	        });
	        /**
			 *  Where the gain is multiplied
			 *  @type  {GainNode}
			 *  @private
			 */
	        this._amplitude = this.context.createGain();
	        /**
			 *  The frequency of the tremolo.	
			 *  @type  {Frequency}
			 *  @signal
			 */
	        this.frequency = this._lfo.frequency;
	        /**
			 *  The depth of the effect. A depth of 0, has no effect
			 *  on the amplitude, and a depth of 1 makes the amplitude
			 *  modulate fully between 0 and 1. 
			 *  @type  {NormalRange}
			 *  @signal
			 */
	        this.depth = this._lfo.amplitude;
	        this._readOnly([
	            'frequency',
	            'depth'
	        ]);
	        this.connectEffect(this._amplitude);
	        this._lfo.connect(this._amplitude.gain);
	        this.type = options.type;
	    };
	    Tone.extend(Tone.Tremolo, Tone.Effect);
	    /**
		 *  @static
		 *  @const
		 *  @type {Object}
		 */
	    Tone.Tremolo.defaults = {
	        'frequency': 10,
	        'type': 'sine',
	        'depth': 0.5
	    };
	    /**
		 * Start the tremolo.
		 * @param {Time} [time=now] When the tremolo begins.
		 * @returns {Tone.Tremolo} this
		 */
	    Tone.Tremolo.prototype.start = function (time) {
	        this._lfo.start(time);
	        return this;
	    };
	    /**
		 * Stop the tremolo.
		 * @param {Time} [time=now] When the tremolo stops.
		 * @returns {Tone.Tremolo} this
		 */
	    Tone.Tremolo.prototype.stop = function (time) {
	        this._lfo.stop(time);
	        return this;
	    };
	    /**
		 * Sync the effect to the transport.
		 * @param {Time} [delay=0] Delay time before starting the effect after the
		 *                              Transport has started. 
		 * @returns {Tone.AutoFilter} this
		 */
	    Tone.Tremolo.prototype.sync = function (delay) {
	        this._lfo.sync(delay);
	        return this;
	    };
	    /**
		 * Unsync the filter from the transport
		 * @returns {Tone.Tremolo} this
		 */
	    Tone.Tremolo.prototype.unsync = function () {
	        this._lfo.unsync();
	        return this;
	    };
	    /**
		 * Type of oscillator attached to the Tremolo.
		 * @memberOf Tone.Tremolo#
		 * @type {string}
		 * @name type
		 */
	    Object.defineProperty(Tone.Tremolo.prototype, 'type', {
	        get: function () {
	            return this._lfo.type;
	        },
	        set: function (type) {
	            this._lfo.type = type;
	        }
	    });
	    /**
		 *  clean up
		 *  @returns {Tone.Tremolo} this
		 */
	    Tone.Tremolo.prototype.dispose = function () {
	        Tone.Effect.prototype.dispose.call(this);
	        this._writable([
	            'frequency',
	            'depth'
	        ]);
	        this._lfo.dispose();
	        this._lfo = null;
	        this._amplitude.disconnect();
	        this._amplitude = null;
	        this.frequency = null;
	        this.depth = null;
	        return this;
	    };
	    return Tone.Tremolo;
	});
	Module(function (Tone) {
	    /**
		 *  @class A Vibrato effect composed of a Tone.Delay and a Tone.LFO. The LFO
		 *         modulates the delayTime of the delay, causing the pitch to rise
		 *         and fall. 
		 *  @extends {Tone.Effect}
		 *  @param {Frequency} frequency The frequency of the vibrato.
		 *  @param {NormalRange} depth The amount the pitch is modulated.
		 */
	    Tone.Vibrato = function () {
	        var options = this.optionsObject(arguments, [
	            'frequency',
	            'depth'
	        ], Tone.Vibrato.defaults);
	        Tone.Effect.call(this, options);
	        /**
			 *  The delay node used for the vibrato effect
			 *  @type {Tone.Delay}
			 *  @private
			 */
	        this._delayNode = new Tone.Delay(options.maxDelay);
	        /**
			 *  The LFO used to control the vibrato
			 *  @type {Tone.LFO}
			 *  @private
			 */
	        this._lfo = new Tone.LFO({
	            'type': options.type,
	            'min': 0,
	            'max': options.maxDelay,
	            'frequency': options.frequency,
	            'phase': -90    //offse the phase so the resting position is in the center
	        }).start().connect(this._delayNode.delayTime);
	        /**
			 *  The frequency of the vibrato
			 *  @type {Frequency}
			 *  @signal
			 */
	        this.frequency = this._lfo.frequency;
	        /**
			 *  The depth of the vibrato. 
			 *  @type {NormalRange}
			 *  @signal
			 */
	        this.depth = this._lfo.amplitude;
	        this.depth.value = options.depth;
	        this._readOnly([
	            'frequency',
	            'depth'
	        ]);
	        this.effectSend.chain(this._delayNode, this.effectReturn);
	    };
	    Tone.extend(Tone.Vibrato, Tone.Effect);
	    /**
		 *  The defaults
		 *  @type  {Object}
		 *  @const
		 */
	    Tone.Vibrato.defaults = {
	        'maxDelay': 0.005,
	        'frequency': 5,
	        'depth': 0.1,
	        'type': 'sine'
	    };
	    /**
		 * Type of oscillator attached to the Vibrato.
		 * @memberOf Tone.Vibrato#
		 * @type {string}
		 * @name type
		 */
	    Object.defineProperty(Tone.Vibrato.prototype, 'type', {
	        get: function () {
	            return this._lfo.type;
	        },
	        set: function (type) {
	            this._lfo.type = type;
	        }
	    });
	    /**
		 *  Clean up.
		 *  @returns {Tone.Vibrato} this
		 */
	    Tone.Vibrato.prototype.dispose = function () {
	        Tone.Effect.prototype.dispose.call(this);
	        this._delayNode.dispose();
	        this._delayNode = null;
	        this._lfo.dispose();
	        this._lfo = null;
	        this._writable([
	            'frequency',
	            'depth'
	        ]);
	        this.frequency = null;
	        this.depth = null;
	    };
	    return Tone.Vibrato;
	});
	Module(function (Tone) {
	    
	    /**
		 * 	@class  Clip the incoming signal so that the output is always between min and max.
		 * 	
		 *  @constructor
		 *  @extends {Tone.SignalBase}
		 *  @param {number} min the minimum value of the outgoing signal
		 *  @param {number} max the maximum value of the outgoing signal
		 *  @example
		 * var clip = new Tone.Clip(0.5, 1);
		 * var osc = new Tone.Oscillator().connect(clip);
		 * //clips the output of the oscillator to between 0.5 and 1.
		 */
	    Tone.Clip = function (min, max) {
	        //make sure the args are in the right order
	        if (min > max) {
	            var tmp = min;
	            min = max;
	            max = tmp;
	        }
	        /**
			 *  The min clip value
			 *  @type {Number}
			 *  @signal
			 */
	        this.min = this.input = new Tone.Min(max);
	        this._readOnly('min');
	        /**
			 *  The max clip value
			 *  @type {Number}
			 *  @signal
			 */
	        this.max = this.output = new Tone.Max(min);
	        this._readOnly('max');
	        this.min.connect(this.max);
	    };
	    Tone.extend(Tone.Clip, Tone.SignalBase);
	    /**
		 *  clean up
		 *  @returns {Tone.Clip} this
		 */
	    Tone.Clip.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._writable('min');
	        this.min.dispose();
	        this.min = null;
	        this._writable('max');
	        this.max.dispose();
	        this.max = null;
	        return this;
	    };
	    return Tone.Clip;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Normalize takes an input min and max and maps it linearly to NormalRange [0,1]
		 *
		 *  @extends {Tone.SignalBase}
		 *  @constructor
		 *  @param {number} inputMin the min input value
		 *  @param {number} inputMax the max input value
		 *  @example
		 * var norm = new Tone.Normalize(2, 4);
		 * var sig = new Tone.Signal(3).connect(norm);
		 * //output of norm is 0.5. 
		 */
	    Tone.Normalize = function (inputMin, inputMax) {
	        /**
			 *  the min input value
			 *  @type {number}
			 *  @private
			 */
	        this._inputMin = this.defaultArg(inputMin, 0);
	        /**
			 *  the max input value
			 *  @type {number}
			 *  @private
			 */
	        this._inputMax = this.defaultArg(inputMax, 1);
	        /**
			 *  subtract the min from the input
			 *  @type {Tone.Add}
			 *  @private
			 */
	        this._sub = this.input = new Tone.Add(0);
	        /**
			 *  divide by the difference between the input and output
			 *  @type {Tone.Multiply}
			 *  @private
			 */
	        this._div = this.output = new Tone.Multiply(1);
	        this._sub.connect(this._div);
	        this._setRange();
	    };
	    Tone.extend(Tone.Normalize, Tone.SignalBase);
	    /**
		 * The minimum value the input signal will reach.
		 * @memberOf Tone.Normalize#
		 * @type {number}
		 * @name min
		 */
	    Object.defineProperty(Tone.Normalize.prototype, 'min', {
	        get: function () {
	            return this._inputMin;
	        },
	        set: function (min) {
	            this._inputMin = min;
	            this._setRange();
	        }
	    });
	    /**
		 * The maximum value the input signal will reach.
		 * @memberOf Tone.Normalize#
		 * @type {number}
		 * @name max
		 */
	    Object.defineProperty(Tone.Normalize.prototype, 'max', {
	        get: function () {
	            return this._inputMax;
	        },
	        set: function (max) {
	            this._inputMax = max;
	            this._setRange();
	        }
	    });
	    /**
		 *  set the values
		 *  @private
		 */
	    Tone.Normalize.prototype._setRange = function () {
	        this._sub.value = -this._inputMin;
	        this._div.value = 1 / (this._inputMax - this._inputMin);
	    };
	    /**
		 *  clean up
		 *  @returns {Tone.Normalize} this
		 */
	    Tone.Normalize.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._sub.dispose();
	        this._sub = null;
	        this._div.dispose();
	        this._div = null;
	        return this;
	    };
	    return Tone.Normalize;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Route a single input to the specified output. 
		 *
		 *  @constructor
		 *  @extends {Tone.SignalBase}
		 *  @param {number} [outputCount=2] the number of inputs the switch accepts
		 *  @example
		 * var route = new Tone.Route(4);
		 * var signal = new Tone.Signal(3).connect(route);
		 * route.select(0);
		 * //signal is routed through output 0
		 * route.select(3);
		 * //signal is now routed through output 3
		 */
	    Tone.Route = function (outputCount) {
	        outputCount = this.defaultArg(outputCount, 2);
	        Tone.call(this, 1, outputCount);
	        /**
			 *  The control signal.
			 *  @type {Number}
			 *  @signal
			 */
	        this.gate = new Tone.Signal(0);
	        this._readOnly('gate');
	        //make all the inputs and connect them
	        for (var i = 0; i < outputCount; i++) {
	            var routeGate = new RouteGate(i);
	            this.output[i] = routeGate;
	            this.gate.connect(routeGate.selecter);
	            this.input.connect(routeGate);
	        }
	    };
	    Tone.extend(Tone.Route, Tone.SignalBase);
	    /**
		 *  Routes the signal to one of the outputs and close the others.
		 *  @param {number} [which=0] Open one of the gates (closes the other).
		 *  @param {Time} [time=now] The time when the switch will open.
		 *  @returns {Tone.Route} this
		 */
	    Tone.Route.prototype.select = function (which, time) {
	        //make sure it's an integer
	        which = Math.floor(which);
	        this.gate.setValueAtTime(which, this.toSeconds(time));
	        return this;
	    };
	    /**
		 *  Clean up.
		 *  @returns {Tone.Route} this
		 */
	    Tone.Route.prototype.dispose = function () {
	        this._writable('gate');
	        this.gate.dispose();
	        this.gate = null;
	        for (var i = 0; i < this.output.length; i++) {
	            this.output[i].dispose();
	            this.output[i] = null;
	        }
	        Tone.prototype.dispose.call(this);
	        return this;
	    };
	    ////////////START HELPER////////////
	    /**
		 *  helper class for Tone.Route representing a single gate
		 *  @constructor
		 *  @extends {Tone}
		 *  @private
		 */
	    var RouteGate = function (num) {
	        /**
			 *  the selector
			 *  @type {Tone.Equal}
			 */
	        this.selecter = new Tone.Equal(num);
	        /**
			 *  the gate
			 *  @type {GainNode}
			 */
	        this.gate = this.input = this.output = this.context.createGain();
	        //connect the selecter to the gate gain
	        this.selecter.connect(this.gate.gain);
	    };
	    Tone.extend(RouteGate);
	    /**
		 *  clean up
		 *  @private
		 */
	    RouteGate.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this.selecter.dispose();
	        this.selecter = null;
	        this.gate.disconnect();
	        this.gate = null;
	    };
	    ////////////END HELPER////////////
	    //return Tone.Route
	    return Tone.Route;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  When the gate is set to 0, the input signal does not pass through to the output. 
		 *          If the gate is set to 1, the input signal passes through.
		 *          the gate is initially closed.
		 *
		 *  @constructor
		 *  @extends {Tone.SignalBase}
		 *  @param {Boolean} [open=false] If the gate is initially open or closed.
		 *  @example
		 * var sigSwitch = new Tone.Switch();
		 * var signal = new Tone.Signal(2).connect(sigSwitch);
		 * //initially no output from sigSwitch
		 * sigSwitch.gate.value = 1;
		 * //open the switch and allow the signal through
		 * //the output of sigSwitch is now 2. 
		 */
	    Tone.Switch = function (open) {
	        open = this.defaultArg(open, false);
	        Tone.call(this);
	        /**
			 *  The control signal for the switch.
			 *  When this value is 0, the input signal will NOT pass through,
			 *  when it is high (1), the input signal will pass through.
			 *  
			 *  @type {Number}
			 *  @signal
			 */
	        this.gate = new Tone.Signal(0);
	        this._readOnly('gate');
	        /**
			 *  thresh the control signal to either 0 or 1
			 *  @type {Tone.GreaterThan}
			 *  @private
			 */
	        this._thresh = new Tone.GreaterThan(0.5);
	        this.input.connect(this.output);
	        this.gate.chain(this._thresh, this.output.gain);
	        //initially open
	        if (open) {
	            this.open();
	        }
	    };
	    Tone.extend(Tone.Switch, Tone.SignalBase);
	    /**
		 *  Open the switch at a specific time. 
		 *
		 *  @param {Time} [time=now] The time when the switch will be open. 
		 *  @returns {Tone.Switch} this
		 *  @example
		 *  //open the switch to let the signal through
		 *  sigSwitch.open();
		 */
	    Tone.Switch.prototype.open = function (time) {
	        this.gate.setValueAtTime(1, this.toSeconds(time));
	        return this;
	    };
	    /**
		 *  Close the switch at a specific time. 
		 *
		 *  @param {Time} [time=now] The time when the switch will be closed.
		 *  @returns {Tone.Switch} this
		 *  @example
		 *  //close the switch a half second from now
		 *  sigSwitch.close("+0.5");
		 */
	    Tone.Switch.prototype.close = function (time) {
	        this.gate.setValueAtTime(0, this.toSeconds(time));
	        return this;
	    };
	    /**
		 *  Clean up.
		 *  @returns {Tone.Switch} this
		 */
	    Tone.Switch.prototype.dispose = function () {
	        Tone.prototype.dispose.call(this);
	        this._writable('gate');
	        this.gate.dispose();
	        this.gate = null;
	        this._thresh.dispose();
	        this._thresh = null;
	        return this;
	    };
	    return Tone.Switch;
	});
	Module(function (Tone) {
	    
	    //polyfill for getUserMedia
	    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
	    /**
		 *  @class  Tone.ExternalInput is a WebRTC Audio Input. Check 
		 *          [Media Stream API Support](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_API)
		 *          to see which browsers are supported. As of
		 *          writing this, Chrome, Firefox, and Opera 
		 *          support Media Stream. Chrome allows enumeration 
		 *          of the sources, and access to device name over a 
		 *          secure (HTTPS) connection. See [https://simpl.info](https://simpl.info/getusermedia/sources/index.html) 
		 *          vs [http://simple.info](https://simpl.info/getusermedia/sources/index.html) 
		 *          on a Chrome browser for the difference.
		 *         
		 *  @constructor
		 *  @extends {Tone.Source}
		 *  @param {number} [inputNum=0] If multiple inputs are present, select the input number. Chrome only.
		 *  @example
		 *  var motu = new Tone.ExternalInput(3);
		 *  
		 *  motu.open(function(){
		 *  	motu.start(10);
		 *  });
		 */
	    Tone.ExternalInput = function () {
	        var options = this.optionsObject(arguments, ['inputNum'], Tone.ExternalInput.defaults);
	        Tone.Source.call(this, options);
	        /**
			 *  The MediaStreamNode 
			 *  @type {MediaStreamAudioSourceNode}
			 *  @private
			 */
	        this._mediaStream = null;
	        /**
			 *  The media stream created by getUserMedia.
			 *  @type {LocalMediaStream}
			 *  @private
			 */
	        this._stream = null;
	        /**
			 *  The constraints argument for getUserMedia
			 *  @type {Object}
			 *  @private
			 */
	        this._constraints = { 'audio': true };
	        /**
			 *  The input source position in Tone.ExternalInput.sources. 
			 *  Set before ExternalInput.open().
			 *  @type {Number}
			 *  @private
			 */
	        this._inputNum = options.inputNum;
	        /**
			 *  Gates the input signal for start/stop. 
			 *  Initially closed.
			 *  @type {GainNode}
			 *  @private
			 */
	        this._gate = new Tone.Gain(0).connect(this.output);
	    };
	    Tone.extend(Tone.ExternalInput, Tone.Source);
	    /**
		 * the default parameters
		 * @type {Object}
		 */
	    Tone.ExternalInput.defaults = { 'inputNum': 0 };
	    /**
		 * wrapper for getUserMedia function
		 * @param {function} callback
		 * @private
		 */
	    Tone.ExternalInput.prototype._getUserMedia = function (callback) {
	        if (!Tone.ExternalInput.canGetUserMedia) {
	            throw new Error('browser does not support \'getUserMedia\'');
	        }
	        if (Tone.ExternalInput.sources[this._inputNum]) {
	            this._constraints = { audio: { optional: [{ sourceId: Tone.ExternalInput.sources[this._inputNum].id }] } };
	        }
	        navigator.getUserMedia(this._constraints, function (stream) {
	            this._onStream(stream);
	            callback();
	        }.bind(this), function (err) {
	            callback(err);
	        });
	    };
	    /**
		 * called when the stream is successfully setup
		 * @param  {LocalMediaStream} stream
		 * @private
		 */
	    Tone.ExternalInput.prototype._onStream = function (stream) {
	        if (!this.isFunction(this.context.createMediaStreamSource)) {
	            throw new Error('browser does not support the \'MediaStreamSourceNode\'');
	        }
	        //can only start a new source if the previous one is closed
	        if (!this._stream) {
	            this._stream = stream;
	            //Wrap a MediaStreamSourceNode around the live input stream.
	            this._mediaStream = this.context.createMediaStreamSource(stream);
	            //Connect the MediaStreamSourceNode to a gate gain node
	            this._mediaStream.connect(this._gate);
	        }
	    };
	    /**
		 *  Open the media stream 
		 *  @param  {function=} callback The callback function to 
		 *                       execute when the stream is open
		 *  @return {Tone.ExternalInput} this
		 */
	    Tone.ExternalInput.prototype.open = function (callback) {
	        callback = this.defaultArg(callback, Tone.noOp);
	        Tone.ExternalInput.getSources(function () {
	            this._getUserMedia(callback);
	        }.bind(this));
	        return this;
	    };
	    /**
		 *  Close the media stream
		 *  @return {Tone.ExternalInput} this
		 */
	    Tone.ExternalInput.prototype.close = function () {
	        if (this._stream) {
	            this._stream.stop();
	            this._stream = null;
	        }
	        return this;
	    };
	    /**
		 *  Start the stream
		 *  @private
		 */
	    Tone.ExternalInput.prototype._start = function (time) {
	        time = this.toSeconds(time);
	        this._gate.gain.setValueAtTime(1, time);
	        return this;
	    };
	    /**
		 *  Stops the stream.
		 *  @private
		 */
	    Tone.ExternalInput.prototype._stop = function (time) {
	        time = this.toSeconds(time);
	        this._gate.gain.setValueAtTime(0, time);
	        return this;
	    };
	    /**
		 * Clean up.
		 * @return {Tone.ExternalInput} this
		 */
	    Tone.ExternalInput.prototype.dispose = function () {
	        Tone.Source.prototype.dispose.call(this);
	        this.close();
	        if (this._mediaStream) {
	            this._mediaStream.disconnect();
	            this._mediaStream = null;
	        }
	        this._constraints = null;
	        this._gate.dispose();
	        this._gate = null;
	        return this;
	    };
	    ///////////////////////////////////////////////////////////////////////////
	    // STATIC METHODS
	    ///////////////////////////////////////////////////////////////////////////
	    /**
		 * The array of available sources, different depending on whether connection is secure
		 * @type {Array}
		 * @static
		 */
	    Tone.ExternalInput.sources = [];
	    /**
		 * indicates whether browser supports MediaStreamTrack.getSources (i.e. Chrome vs Firefox)
		 * @type {Boolean}
		 * @private
		 */
	    Tone.ExternalInput._canGetSources = !Tone.prototype.isUndef(window.MediaStreamTrack) && Tone.prototype.isFunction(MediaStreamTrack.getSources);
	    /**
		 *  Indicates if the browser supports 'getUserMedia'
		 *  @type {Boolean}
		 *  @static
		 */
	    Tone.ExternalInput.canGetUserMedia = Tone.prototype.isFunction(navigator.getUserMedia);
	    /**
		 *  Populates the source list. Invokes the callback with an array of 
		 *  possible audio sources.
		 *  @param  {function=} callback Callback to be executed after populating list 
		 *  @return {Tone.ExternalInput} this
		 *  @static
		 *  @example
		 * var soundflower = new Tone.ExternalInput();
		 * Tone.ExternalInput.getSources(selectSoundflower);
		 *
		 * function selectSoundflower(sources){
		 * 	for(var i = 0; i < sources.length; i++){
		 * 		if(sources[i].label === "soundflower"){
		 * 			soundflower.inputNum = i;
		 * 			soundflower.open(function(){
		 * 				soundflower.start();
		 * 			});
		 * 			break;
		 * 		}
		 * 	}
		 * };
		 */
	    Tone.ExternalInput.getSources = function (callback) {
	        if (Tone.ExternalInput.sources.length === 0 && Tone.ExternalInput._canGetSources) {
	            MediaStreamTrack.getSources(function (media_sources) {
	                for (var i = 0; i < media_sources.length; i++) {
	                    if (media_sources[i].kind === 'audio') {
	                        Tone.ExternalInput.sources[i] = media_sources[i];
	                    }
	                }
	                callback(Tone.ExternalInput.sources);
	            });
	        } else {
	            callback(Tone.ExternalInput.sources);
	        }
	        return this;
	    };
	    return Tone.ExternalInput;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Opens up the default source (typically the microphone).
		 *
		 *  @constructor
		 *  @extends {Tone.ExternalInput}
		 *  @example
		 *  //mic will feedback if played through master
		 *  var mic = new Tone.Microphone();
		 *  mic.open(function(){
		 *  	//start the mic at ten seconds
		 *  	mic.start(10);
		 *  });
		 *  //stop the mic
		 *  mic.stop(20);
		 */
	    Tone.Microphone = function () {
	        Tone.ExternalInput.call(this, 0);
	    };
	    Tone.extend(Tone.Microphone, Tone.ExternalInput);
	    /**
		 *  If getUserMedia is supported by the browser.
		 *  @type  {Boolean}
		 *  @static
		 */
	    Tone.Microphone.canGetUserMedia = Tone.ExternalInput.canGetUserMedia;
	    return Tone.Microphone;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class  Tone.Note provides a callback for a single, repeatable
		 *          event along the timeline. 
		 *
		 *  @param {function} callback The callback to invoke at the time. 
		 *  @param {*...=} value The value or values which should be passed to
		 *                      the callback function on invocation.  
		 *  @example
		 * var chord = new Tone.Note(function(time, chord){
		 * 	//the chord as well as the exact time of the event
		 * 	//are passed in as arguments to the callback function
		 * }, "Dm");
		 * //start the chord at the beginning of the transport timeline
		 * chord.start();
		 * //loop it every measure for 8 measures
		 * chord.loop = 8;
		 * chord.loopEnd = "1m";
		 */
	    Tone.Note = function () {
	        var options = this.optionsObject(arguments, [
	            'callback',
	            'value'
	        ], Tone.Note.defaults);
	        /**
			 *  Loop value
			 *  @type  {Boolean|Positive}
			 *  @private
			 */
	        this._loop = options.loop;
	        /**
			 *  The callback to invoke. 
			 *  @type  {Function}
			 *  @private
			 */
	        this._callback = options.callback;
	        /**
			 *  The value which is passed to the
			 *  callback function.
			 *  @type  {*}
			 *  @private
			 */
	        this.value = options.value;
	        /**
			 *  When the note is scheduled to start.
			 *  @type  {Number}
			 *  @private
			 */
	        this._loopStart = 0;
	        /**
			 *  When the note is scheduled to start.
			 *  @type  {Number}
			 *  @private
			 */
	        this._loopEnd = 0;
	        /**
			 *  Tracks the scheduled events
			 *  @type {Tone.TimelineState}
			 *  @private
			 */
	        this._events = new Tone.TimelineState(Tone.State.Stopped);
	        /**
			 *  The playback speed of the note. A speed of 1
			 *  is no change. 
			 *  @private
			 *  @type {Positive}
			 */
	        this._playbackRate = 1;
	        /**
			 *  The probability that the callback will be invoked
			 *  at the scheduled time. 
			 *  @type {NormalRange}
			 */
	        this.probability = options.probability;
	        /**
			 *  If the part is inactive and does 
			 *  not invoke the callback function.
			 *  @type {Boolean}
			 */
	        this.mute = options.mute;
	        //set the initial values
	        this.loopStart = options.loopStart;
	        this.loopEnd = options.loopEnd;
	        this.playbackRate = options.playbackRate;
	        //if an object was used in the constructor, the value is all the extra parameters
	        if (arguments.length === 1 && typeof arguments[0] === 'object' && this.isUndef(this.value)) {
	            var valueObj = {};
	            for (var param in arguments[0]) {
	                if (!Tone.Note.defaults.hasOwnProperty(param)) {
	                    valueObj[param] = arguments[0][param];
	                }
	            }
	            this.value = valueObj;
	        }
	    };
	    Tone.extend(Tone.Note);
	    /**
		 *  The default values
		 *  @type  {Object}
		 *  @const
		 */
	    Tone.Note.defaults = {
	        'callback': Tone.noOp,
	        'loop': false,
	        'loopEnd': '1m',
	        'loopStart': 0,
	        'playbackRate': 1,
	        'probability': 1,
	        'mute': false
	    };
	    /**
		 *  Reschedule all of the events along the timeline
		 *  with the updated values.
		 *  @param {Time} after Only reschedules events after the given time.
		 *  @return  {Tone.Note}  this
		 *  @private
		 */
	    Tone.Note.prototype._rescheduleEvents = function (after) {
	        //if no argument is given, schedules all of the events
	        after = this.defaultArg(after, -1);
	        this._events.forEachAfter(after, function (event) {
	            var duration;
	            if (event.state === Tone.State.Started) {
	                if (!this.isUndef(event.id)) {
	                    Tone.Transport.clear(event.id);
	                }
	                if (this._loop) {
	                    duration = Infinity;
	                    if (typeof this._loop === 'number') {
	                        duration = (this._loop - 1) * this._getLoopDuration();
	                    }
	                    var nextEvent = this._events.getEventAfter(event.time);
	                    if (nextEvent !== null) {
	                        duration = Math.min(duration, nextEvent.time - event.time);
	                    }
	                    event.id = Tone.Transport.scheduleRepeat(this._tick.bind(this), this._getLoopDuration().toString() + 'i', event.time + 'i', duration + 'i');
	                } else {
	                    event.id = Tone.Transport.schedule(this._tick.bind(this), event.time + 'i');
	                }
	            }
	        }.bind(this));
	        return this;
	    };
	    /**
		 *  Returns the playback state of the note, either "started" or "stopped".
		 *  @type {String}
		 *  @readOnly
		 *  @memberOf Tone.Note#
		 *  @name state
		 */
	    Object.defineProperty(Tone.Note.prototype, 'state', {
	        get: function () {
	            return this._events.getStateAtTime(Tone.Transport.ticks);
	        }
	    });
	    /**
		 *  Start the note at the given time. 
		 *  @param  {Time}  time  When the note should start.
		 *  @return  {Tone.Note}  this
		 */
	    Tone.Note.prototype.start = function (time) {
	        time = this.toTicks(time);
	        if (this._events.getStateAtTime(time) === Tone.State.Stopped) {
	            this._events.addEvent({
	                'state': Tone.State.Started,
	                'time': time,
	                'id': undefined
	            });
	            this._rescheduleEvents(time - 0.001);
	        }
	        return this;
	    };
	    /**
		 *  Stop the Note at the given time.
		 *  @param  {Time}  time  When the note should stop.
		 *  @return  {Tone.Note}  this
		 */
	    Tone.Note.prototype.stop = function (time) {
	        time = this.toTicks(time);
	        if (this._events.getStateAtTime(time) === Tone.State.Started) {
	            this._events.setStateAtTime(Tone.State.Stopped, time);
	            var previousEvent = this._events.getEventBefore(time);
	            var reschedulTime = time;
	            if (previousEvent !== null) {
	                reschedulTime = previousEvent.time;
	            }
	            this._rescheduleEvents(reschedulTime - 0.001);
	        }
	        return this;
	    };
	    /**
		 *  Cancel all scheduled events greater than or equal to the given time
		 *  @param  {Time}  [time=0]  The time after which events will be cancel.
		 *  @return  {Tone.Note}  this
		 */
	    Tone.Note.prototype.cancel = function (time) {
	        time = this.defaultArg(time, -Infinity);
	        time = this.toTicks(time);
	        this._events.forEachAfter(time - 0.001, function (event) {
	            Tone.Transport.clear(event.id);
	        });
	        this._events.cancel(time);
	        return this;
	    };
	    /**
		 *  The callback function invoker. Also 
		 *  checks if the Note is done playing
		 *  @param  {Number}  time  The time of the event in seconds
		 *  @private
		 */
	    Tone.Note.prototype._tick = function (time) {
	        if (!this.mute && this._events.getStateAtTime(Tone.Transport.ticks) === Tone.State.Started) {
	            if (this.probability < 1) {
	                if (Math.random() <= this.probability) {
	                    this._callback(time, this.value);
	                }
	            } else {
	                this._callback(time, this.value);
	            }
	        }
	    };
	    /**
		 *  Get the duration of the loop.
		 *  @return  {Number}
		 *  @private
		 */
	    Tone.Note.prototype._getLoopDuration = function () {
	        return Math.round((this._loopEnd - this._loopStart) / this._playbackRate);
	    };
	    /**
		 *  If the note should loop or not
		 *  between Tone.Note.loopStart and 
		 *  Tone.Note.loopEnd. An integer
		 *  value corresponds to the number of
		 *  loops the Note does after it starts.
		 *  @memberOf Tone.Note#
		 *  @type {Boolean|Positive}
		 *  @name loop
		 */
	    Object.defineProperty(Tone.Note.prototype, 'loop', {
	        get: function () {
	            return this._loop;
	        },
	        set: function (loop) {
	            this._loop = loop;
	            this._rescheduleEvents();
	        }
	    });
	    /**
		 * 	The playback rate of the note. Defaults to 1.
		 *  @memberOf Tone.Note#
		 *  @type {Positive}
		 *  @name playbackRate
		 *  @example
		 * note.loop = true;
		 * //repeat the note twice as fast
		 * note.playbackRate = 2;
		 */
	    Object.defineProperty(Tone.Note.prototype, 'playbackRate', {
	        get: function () {
	            return this._playbackRate;
	        },
	        set: function (rate) {
	            this._playbackRate = rate;
	            if (this._loop) {
	                this._rescheduleEvents();
	            }
	        }
	    });
	    /**
		 *  The loopEnd point determines when it will 
		 *  loop if Tone.Note.loop is true.
		 *  @memberOf Tone.Note#
		 *  @type {Boolean|Positive}
		 *  @name loopEnd
		 */
	    Object.defineProperty(Tone.Note.prototype, 'loopEnd', {
	        get: function () {
	            return this.toNotation(this._loopEnd + 'i');
	        },
	        set: function (loopEnd) {
	            this._loopEnd = this.toTicks(loopEnd);
	            if (this._loop) {
	                this._rescheduleEvents();
	            }
	        }
	    });
	    /**
		 *  The loopStart point determines when it will 
		 *  loop if Tone.Note.loop is true.
		 *  @memberOf Tone.Note#
		 *  @type {Boolean|Positive}
		 *  @name loopStart
		 */
	    Object.defineProperty(Tone.Note.prototype, 'loopStart', {
	        get: function () {
	            return this.toNotation(this._loopStart + 'i');
	        },
	        set: function (loopStart) {
	            this._loopStart = this.toTicks(loopStart);
	            if (this._loop) {
	                this._rescheduleEvents();
	            }
	        }
	    });
	    /**
		 *  The current progress of the loop interval.
		 *  Returns 0 if the atom is not started yet or the 
		 *  atom is not set to loop.
		 *  @memberOf Tone.Note#
		 *  @type {NormalRange}
		 *  @name progress
		 *  @readOnly
		 */
	    Object.defineProperty(Tone.Note.prototype, 'progress', {
	        get: function () {
	            if (this._loop) {
	                var ticks = Tone.Transport.ticks;
	                var lastEvent = this._events.getEvent(ticks);
	                if (lastEvent !== null && lastEvent.state === Tone.State.Started) {
	                    var loopDuration = this._getLoopDuration();
	                    if (typeof this._loop === 'number') {
	                        var endTime = loopDuration * this._loop + lastEvent.time;
	                        if (ticks > endTime) {
	                            return 0;
	                        }
	                    }
	                    var progress = (ticks - lastEvent.time) % loopDuration;
	                    return progress / loopDuration;
	                } else {
	                    return 0;
	                }
	            } else {
	                return 0;
	            }
	        }
	    });
	    /**
		 *  Clean up
		 *  @return  {Tone.Note}  this
		 */
	    Tone.Note.prototype.dispose = function () {
	        this.cancel();
	        this._events.dispose();
	        this._events = null;
	        this._callback = null;
	        this.value = null;
	    };
	    return Tone.Note;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class Tone.Part is a collection Tone.Notes which can be
		 *         started/stoped and looped as a single unit.
		 *
		 *  @extends {Tone.Note}
		 *  @example
		 * var part = new Tone.Part(function(time, note){
		 * 	synth.triggerAttackRelease(note, "8n", time);
		 * }, [[0, "C2"], ["0:2", "C3"], ["0:3:2", "G2"]]).start();
		 *  @example
		 * //use JSON as long as the object has a "time" attribute
		 * var part = new Tone.Part(function(time, value){
		 * 	synth.triggerAttackRelease(value.note, "8n", time, value.velocity);
		 * }, [{"time" : 0, "note" : "C3", "velocity": 0.9}, 
		 * 	   {"time" : "0:2", "note" : "C4", "velocity": 0.5}
		 * ]).start();
		 */
	    Tone.Part = function () {
	        var options = this.optionsObject(arguments, [
	            'callback',
	            'notes'
	        ], Tone.Part.defaults);
	        /**
			 *  If the part is looping or not
			 *  @type  {Boolean|Positive}
			 *  @private
			 */
	        this._loop = options.loop;
	        /**
			 *  When the note is scheduled to start.
			 *  @type  {Number}
			 *  @private
			 */
	        this._loopStart = 0;
	        /**
			 *  When the note is scheduled to start.
			 *  @type  {Number}
			 *  @private
			 */
	        this._loopEnd = 0;
	        /**
			 *  The playback rate of the part
			 *  @type  {Positive}
			 *  @private
			 */
	        this._playbackRate = 1;
	        /**
			 *  Keeps track of the current state
			 *  @type {Tone.TimelineState}
			 *  @private
			 */
	        this._events = new Tone.TimelineState(Tone.State.Stopped);
	        /**
			 *  An array of Objects. Each one
			 *  contains a note object and the relative
			 *  start time of the note.
			 *  @type  {Array}
			 *  @private
			 */
	        this._notes = [];
	        /**
			 *  The callback to invoke on every note
			 *  @type {Function}
			 *  @private
			 */
	        this._callback = options.callback;
	        /**
			 * 	If the part invokes the callback
			 *  @type {Boolean}
			 */
	        this.mute = options.mute;
	        //setup
	        this.loopEnd = options.loopEnd;
	        this.loopStart = options.loopStart;
	        this.playbackRate = options.playbackRate;
	        this.mute = options.mute;
	        //add the notes
	        var notes = this.defaultArg(options.notes, []);
	        for (var i = 0; i < notes.length; i++) {
	            if (Array.isArray(notes[i])) {
	                this.add(notes[i][0], notes[i][1]);
	            } else {
	                this.add(notes[i]);
	            }
	        }
	    };
	    Tone.extend(Tone.Part, Tone.Note);
	    /**
		 *  The default values
		 *  @type  {Object}
		 *  @const
		 */
	    Tone.Part.defaults = {
	        'callback': Tone.noOp,
	        'loop': false,
	        'loopEnd': '1m',
	        'loopStart': 0,
	        'playbackRate': 1,
	        'mute': false
	    };
	    /**
		 *  Start the part at the given time. Optionally
		 *  set an offset time.
		 *  @param  {Time}  time    When to start the part.
		 *  @param  {Time=}  offset  The offset from the start of the part
		 *                           to begin playing at.
		 *  @return  {Tone.Part}  this
		 */
	    Tone.Part.prototype.start = function (time, offset) {
	        var ticks = this.toTicks(time);
	        if (this._events.getStateAtTime(ticks) !== Tone.State.Started) {
	            this._events.setStateAtTime(Tone.State.Started, ticks);
	            offset = this.defaultArg(offset, 0);
	            offset = this.toTicks(offset);
	            this._forEach(function (event) {
	                var startTick;
	                if (this._loop) {
	                    if (event.time >= this._loopStart && event.time < this._loopEnd) {
	                        startTick = event.time - offset - this._loopStart;
	                        event.note.start(Math.round(startTick / this.playbackRate + ticks) + 'i');
	                    }
	                } else {
	                    startTick = event.time - offset;
	                    event.note.start(Math.round(startTick / this.playbackRate + ticks) + 'i');
	                }
	            }.bind(this));
	        }
	        return this;
	    };
	    /**
		 *  Stop the part at the given time.
		 *  @param  {Time}  time  When to stop the part.
		 *  @return  {Tone.Part}  this
		 */
	    Tone.Part.prototype.stop = function (time) {
	        var ticks = this.toTicks(time);
	        if (this._events.getStateAtTime(ticks) === Tone.State.Started) {
	            this._events.setStateAtTime(Tone.State.Stopped, ticks);
	            this._forEach(function (event) {
	                event.note.stop(time);
	            });
	        }
	        return this;
	    };
	    /**
		 *  Get/Set a note by time. If there is no item
		 *  at the given time, it will create one
		 *  @return {*} the value at the given time
		 */
	    Tone.Part.prototype.at = function (time, value) {
	        time = this.toTicks(time);
	        for (var i = 0; i < this._notes.length; i++) {
	            var note = this._notes[i];
	            if (Math.abs(time - note.time) < 0.001) {
	                if (this.isUndef(value)) {
	                    if (this.isUndef(note.note.value)) {
	                        return note.note;
	                    } else {
	                        return note.note.value;
	                    }
	                } else {
	                    note.note.value = value;
	                    return value;
	                }
	            }
	        }
	        if (!this.isUndef(value)) {
	            this._notes.push({
	                'time': time,
	                'note': new Tone.Note(this._tick.bind(this), value)
	            });
	        } else {
	            return null;
	        }
	    };
	    /**
		 *  Add a note or part to the part. 
		 *  @param {Time} time The time the note should start.
		 *                            If an object is passed in, it should
		 *                            have a 'time' attribute and the rest
		 *                            of the object will be used as the 'value'.
		 *  @param  {Tone.Note|*}  value 
		 *  @example
		 * part.add("1m", "C#+11");
		 */
	    Tone.Part.prototype.add = function (time, value) {
	        //extract the parameters
	        if (typeof time === 'object' && time.hasOwnProperty('time')) {
	            value = time;
	            time = value.time;
	        }
	        time = this.toTicks(time);
	        var note;
	        if (value instanceof Tone.Note || value instanceof Tone.Part) {
	            note = value;
	            note._callback = this._tick.bind(this);
	        } else {
	            note = new Tone.Note(this._tick.bind(this), value);
	        }
	        //initialize the stuff
	        note.playbackRate *= this._playbackRate;
	        note.loopStart = 0;
	        note.loopEnd = this.loopEnd;
	        note.loop = this.loop;
	        //add it to the notes
	        this._notes.push({
	            'time': time,
	            'note': note
	        });
	        return this;
	    };
	    /**
		 *  Remove a note from the part. 
		 */
	    Tone.Part.prototype.remove = function (time, value) {
	        //extract the parameters
	        if (typeof time === 'object' && time.hasOwnProperty('time')) {
	            value = time;
	            time = value.time;
	        }
	        this._forEach(function (event, index) {
	            if (event.time === time) {
	                if (this.isUndef(value) || !this.isUndef && event.note.value === value) {
	                    this._notes.splice(index, 1);
	                    event.note.dispose();
	                }
	            }
	        });
	        return this;
	    };
	    /**
		 *  Remove all of the notes from the group. 
		 *  @return  {Tone.Part}  this
		 */
	    Tone.Part.prototype.removeAll = function () {
	        this._forEach(function (event) {
	            event.note.dispose();
	        });
	        this._notes = [];
	        return this;
	    };
	    /**
		 *  Cancel scheduled state change events: i.e. "start" and "stop".
		 *  @param {Time} after The time after which to cancel the scheduled events.
		 *  @return  {Tone.Part}  this
		 */
	    Tone.Part.prototype.cancel = function (after) {
	        this._forEach(function (event) {
	            event.note.cancel(after);
	        });
	        this._events.cancel(after);
	        return this;
	    };
	    /**
		 *  Iterate over all of the notes
		 *  @param {Function} callback
		 *  @private
		 */
	    Tone.Part.prototype._forEach = function (callback) {
	        for (var i = this._notes.length - 1; i >= 0; i--) {
	            callback(this._notes[i], i);
	        }
	        return this;
	    };
	    /**
		 *  Internal tick method
		 *  @param  {Number}  time  The time of the event in seconds
		 *  @private
		 */
	    Tone.Part.prototype._tick = function (time, value) {
	        if (!this.mute && this._events.getStateAtTime(Tone.Transport.ticks) === Tone.State.Started) {
	            this._callback(time, value);
	        }
	    };
	    /**
		 *  If the note should loop or not
		 *  between Tone.Part.loopStart and 
		 *  Tone.Part.loopEnd. An integer
		 *  value corresponds to the number of
		 *  loops the Part does after it starts.
		 *  @memberOf Tone.Part#
		 *  @type {Boolean|Positive}
		 *  @name loop
		 */
	    Object.defineProperty(Tone.Part.prototype, 'loop', {
	        get: function () {
	            return this._loop;
	        },
	        set: function (loop) {
	            this._loop = loop;
	            this._forEach(function (event) {
	                event.note.loop = loop;
	            });
	            this.loopEnd = this._loopEnd + 'i';
	            this.loopStart = this._loopStart + 'i';
	        }
	    });
	    /**
		 *  The loopEnd point determines when it will 
		 *  loop if Tone.Part.loop is true.
		 *  @memberOf Tone.Part#
		 *  @type {Boolean|Positive}
		 *  @name loopEnd
		 */
	    Object.defineProperty(Tone.Part.prototype, 'loopEnd', {
	        get: function () {
	            return this.toNotation(this._loopEnd + 'i');
	        },
	        set: function (loopEnd) {
	            this._loopEnd = this.toTicks(loopEnd);
	            if (this._loop) {
	                this._forEach(function (event) {
	                    event.note.loopEnd = this._loopEnd - this._loopStart + 'i';
	                    if (event.note.time > this._loopEnd) {
	                        event.note.cancel();
	                    }
	                }.bind(this));
	            }
	        }
	    });
	    /**
		 *  The loopStart point determines when it will 
		 *  loop if Tone.Part.loop is true.
		 *  @memberOf Tone.Part#
		 *  @type {Boolean|Positive}
		 *  @name loopStart
		 */
	    Object.defineProperty(Tone.Part.prototype, 'loopStart', {
	        get: function () {
	            return this.toNotation(this._loopStart + 'i');
	        },
	        set: function (loopStart) {
	            this._loopStart = this.toTicks(loopStart);
	            if (this._loop) {
	                this._forEach(function (event) {
	                    event.note.loopEnd = this._loopEnd - this._loopStart + 'i';
	                    if (event.note.time <= this._loopStart) {
	                        event.note.cancel();
	                    }
	                }.bind(this));
	            }
	        }
	    });
	    /**
		 * 	The playback rate of the part
		 *  @memberOf Tone.Part#
		 *  @type {Positive}
		 *  @name playbackRate
		 */
	    Object.defineProperty(Tone.Part.prototype, 'playbackRate', {
	        get: function () {
	            return this._playbackRate;
	        },
	        set: function (rate) {
	            this._forEach(function (event) {
	                var ratio = event.note.playbackRate / this._playbackRate;
	                event.note.playbackRate = rate * ratio;
	            }.bind(this));
	            this._playbackRate = rate;
	        }
	    });
	    /**
		 * 	The number of scheduled notes in the part. 
		 *  @memberOf Tone.Part#
		 *  @type {Positive}
		 *  @name length
		 *  @readOnly
		 */
	    Object.defineProperty(Tone.Part.prototype, 'length', {
	        get: function () {
	            return this._notes.length;
	        }
	    });
	    /**
		 *  Clean up
		 *  @return  {Tone.Part}  this
		 */
	    Tone.Part.prototype.dispose = function () {
	        this._callback = null;
	        this.removeAll();
	        this._notes = null;
	        return this;
	    };
	    return Tone.Part;
	});
	Module(function (Tone) {
	    /**
		 *  @class Tone.Pattern arpeggiates between the given notes
		 *         in a number of patterns.
		 *  @extends {Tone}
		 *  @param {Function} callback The callback to invoke with the
		 *                             event.
		 *  @param {Array} notes The notes to arpeggiate over.
		 */
	    Tone.Pattern = function (callback, notes) {
	        /**
			 *  Called back with the current event
			 *  @private
			 *  @type {Function}
			 */
	        this._callback = callback;
	        /**
			 *  The notes to arpeggiate
			 *  @type {Array}
			 */
	        this.notes = notes;
	        /**
			 *  The event index
			 *  @type {Array}
			 *  @private
			 */
	        this._eventIndex = -1;
	        /**
			 *  The note which schedules the notes
			 *  @type {Tone.Note}
			 *  @private
			 */
	        this._note = new Tone.Note(this._tick.bind(this));
	        this._note.loop = true;
	        this._note.loopEnd = '4n';
	        /**
			 *  The stepping direction of the notes
			 *  @type  {Number}
			 *  @private
			 */
	        this._arpDirection = 1;
	    };
	    Tone.extend(Tone.Pattern);
	    /**
		 *  Start the arpeggio at the given time.
		 *  @param  {Time=}  time  When to start the Arpeggio
		 *  @return  {Tone.Pattern}  this
		 */
	    Tone.Pattern.prototype.start = function (time) {
	        this._note.start(time);
	        return this;
	    };
	    /**
		 *  Stop the arpeggio at the given time.
		 *  @param  {Time=}  time  When to stop the Arpeggio
		 *  @return  {Tone.Pattern}  this
		 */
	    Tone.Pattern.prototype.stop = function (time) {
	        this._note.stop(time);
	        return this;
	    };
	    /**
		 *  Internal function called when the notes should be called
		 *  @param  {Number}  time  The time the event occurs
		 *  @private
		 */
	    Tone.Pattern.prototype._tick = function (time) {
	        if (this._pattern === Tone.Pattern.Type.Random) {
	            this._eventIndex = Math.floor(Math.random() * this.notes.length);
	        } else {
	            this._eventIndex += this._arpDirection;
	            if (this._pattern === Tone.Pattern.Type.Alternate) {
	                if (this._eventIndex === 0) {
	                    this._arpDirection = 1;
	                } else if (this._eventIndex === this.notes.length - 1) {
	                    this._arpDirection = -1;
	                }
	            } else if (this._eventIndex < 0) {
	                this._eventIndex = this.notes.length - 1;
	            } else if (this._eventIndex >= this.notes.length) {
	                this._eventIndex = 0;
	            }
	        }
	        this._callback(time, this.notes[this._eventIndex]);
	    };
	    /**
		 *  The interval of the notes
		 *  @memberOf Tone.Pattern#
		 *  @type {Time}
		 *  @name interval
		 */
	    Object.defineProperty(Tone.Pattern.prototype, 'interval', {
	        get: function () {
	            return this._note.loopEnd;
	        },
	        set: function (interval) {
	            this._note.loopEnd = interval;
	        }
	    });
	    /**
		 *  @memberOf Tone.Pattern#
		 *  @type {Time}
		 *  @name pattern
		 */
	    Object.defineProperty(Tone.Pattern.prototype, 'pattern', {
	        get: function () {
	            return this._pattern;
	        },
	        set: function (pattern) {
	            switch (pattern) {
	            case Tone.Pattern.Type.Forward:
	                this._arpDirection = 1;
	                break;
	            case Tone.Pattern.Type.Reverse:
	                this._arpDirection = -1;
	                break;
	            }
	            var hasType = false;
	            for (var pattr in Tone.Pattern.Type) {
	                if (pattern === Tone.Pattern.Type[pattr]) {
	                    hasType = true;
	                    break;
	                }
	            }
	            if (!hasType) {
	                throw new Error('Invalid pattern: ' + pattern);
	            }
	            this._pattern = pattern;
	        }
	    });
	    /**
		 *  The arpeggiation patterns
		 *  @type  {Object}
		 *  @enum {String}
		 */
	    Tone.Pattern.Type = {
	        Forward: 'forward',
	        Reverse: 'reverse',
	        Alternate: 'alternate',
	        Drunk: 'drunk',
	        Converge: 'converge',
	        Diverge: 'diverge',
	        RandomOnce: 'randomOnce',
	        Random: 'random'
	    };
	    return Tone.Pattern;
	});
	Module(function (Tone) {
	    /**
		 *  @class Tone.Score allows you to start and stop multiple sections
		 *         with precise timing and synchronization.
		 *
		 *  @example
		 * var score = new Tone.Score({
		 * 	"keyboard" : [0, "0:1", "0:3"]
		 * }).on("keyboard", function(time){
		 * 	//play the keyboard note
		 * });
		 *
		 * score.solo("keyboard");
		 *
		 * score.unsolo();
		 */
	    Tone.Score = function (score) {
	        Tone.EventEmitter.call(this);
	        /**
			 *  All of the parts by name.
			 *  @type  {Object}
			 */
	        this.parts = {};
	        this._readOnly(['parts']);
	    };
	    Tone.extend(Tone.Score, Tone.EventEmitter);
	    /**
		 *  Mute all other parts except the given
		 *  one.
		 *  @param  {String|Array}  section  The section name
		 *  @return  {Tone.Score}  this
		 */
	    Tone.Score.prototype.solo = function (part) {
	        this.mute = true;
	        if (Array.isArray(part)) {
	            part.forEach(function (p) {
	                if (this.parts.hasOwnProperty(p)) {
	                    this.parts[p].mute = false;
	                }
	            }.bind(this));
	        } else if (this.parts.hasOwnProperty(part)) {
	            this.parts[part].mute = false;
	        }
	    };
	    /**
		 *  Unsolo the given part(s). If no arguments are passed
		 *  in, will unsolo everything. 
		 *  @param  {String|Array}  section  The section name
		 *  @return  {Tone.Score}  this
		 */
	    Tone.Score.prototype.unsolo = function () {
	    };
	    /**
		 *  Mute all of the parts in the score.
		 */
	    Object.defineProperty(Tone.Score.prototype, 'mute', {
	        get: function () {
	        },
	        set: function (mute) {
	            this._forEach(function (part) {
	                part.mute = mute;
	            });
	        }
	    });
	    return Tone.Score;
	});
	Module(function (Tone) {
	    
	    /**
		 *  @class A sequence is an alternate notation of a part. Instead
		 *         of passing in an array of [time, event] pairs, pass
		 *         in an array of events which will be parsed
		 *         as quarter note events. Subdivisions are given
		 *         as sub arrays. Sequence notation inspiration from [Tidal](http://yaxu.org/tidal/)
		 *  @param  {Function}  callback  The callback to invoke with every note
		 *  @param  {Array}    sequence  The sequence
		 *  @extends {Tone.Part}
		 *  @example
		 * //straight quater notes
		 * var seq = new Tone.Sequence(function(time, note){
		 * 	console.log(note);
		 * }, ["C4", "E4", "G4", "A4"]);
		 *  @example
		 * //subdivisions are given as subarrays
		 * var seq = new Tone.Sequence(function(time, note){
		 * 	console.log(note);
		 * }, ["C4", "E4", "G4", ["A4", "G4"]]);
		 * @example
		 * //A sequence with objects which are converted into Atoms
		 * var seq = new Tone.Sequence(function(time, val){
		 * 
		 * }, [{"note" : "C4", "probability" : 1}, 
		 * 	   {"note" : "E4", "probability" : 0.8}, 
		 * 	   {"note" : "G4", "probability" : 0.6}, 
		 * 	   [{"note" : "A4", "probability" : 0.8}, 
		 * 	   	{"note" : "G4", "probability" : 0.1}
		 * 	   ]
		 * 	  ]);
		 */
	    Tone.Sequence = function (callback, sequence, subdivision) {
	        var options = this.optionsObject(arguments, [
	            'callback',
	            'sequence',
	            'subdivision'
	        ], Tone.Sequence.defaults);
	        Tone.Part.call(this, callback);
	        /**
			 *  The subdivison of each note
			 *  @type  {String}
			 */
	        this._subdivision = this.toTicks(subdivision);
	        if (Array.isArray(sequence)) {
	            for (var i = 0; i < sequence.length; i++) {
	                var subdivider = this._subdivision;
	                if (Array.isArray(sequence[i])) {
	                    subdivider = sequence[i].length;
	                }
	                var subSeq = new Tone.Sequence(this._tick.bind(this), sequence[i], Math.floor(this._subdivision / subdivider) + 'i');
	                this.add(this._subdivision * i + 'i', subSeq);
	            }
	        } else if (sequence) {
	            this.add(0, sequence);
	        }
	    };
	    Tone.extend(Tone.Sequence, Tone.Part);
	    /**
		 *  The default values.
		 *  @type  {Object}
		 */
	    Tone.Sequence.defaults = { 'subdivision': '4n' };
	    /**
		 *  Parse an array into [time, value] pairs
		 *  @param  {Array}  seq  The sequence to parse
		 *  @param  {Ticks}  subdiv  The current subdivision at that tick level
		 *  @param  {Ticks}  offset  The offset from the 
		 *  @private
		 */
	    Tone.Sequence.prototype._parseSequence = function (seq, subdiv, offset) {
	        if (Array.isArray(seq)) {
	            for (var i = 0; i < seq.length; i++) {
	                var subSeq = new Tone.Sequence(this._tick.bind(this), seq[i], subdiv / 2 + 'i');
	                this.add(this._subdivision + ' * ' + i, subSeq);
	            }
	        } else if (seq) {
	            this.add(subdiv * offset + 'i', seq);
	        }
	    };
	    /**
		 *  Get/Set an index of the sequence
		 *  @example
		 * var sequence = new Tone.Sequence(playNote, ["E4", "C4", "F#4", "A4"])
		 * sequence.at(0)// => returns "E4"
		 * //set a value
		 * sequence.at(0, "G3");
		 */
	    Tone.Sequence.prototype.at = function (index, value) {
	        //call the parent's method
	        return Tone.Part.prototype.at.call(this, '4n * ' + index, value);
	    };
	    /**
		 *  Clean up.
		 *  @return {Tone.Sequence} this
		 */
	    Tone.Sequence.prototype.dispose = function () {
	        Tone.Part.prototype.dispose.call(this);
	        this._sequence = null;
	        return this;
	    };
	    return Tone.Sequence;
	});

	//UMD
	if ( typeof define === "function" && define.amd ) {
		define( "Tone", [], function() {
			return Tone;
		});
	} else if (typeof module === "object") {
		module.exports = Tone;
 	} else {
		root.Tone = Tone;
	}
} (this));