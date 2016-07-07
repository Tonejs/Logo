define(["Analyser", "waveform.scss"], function (Analyser, waveformStyle) {

	document.addEventListener("DOMContentLoaded", function(event) {

		var analyser = new Analyser(document.body);

		window.addEventListener("resize", function(){
			analyser.resize();
		});
	});

});