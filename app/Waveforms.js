define(function () {

	return function(bufferLength){

		var sine = new Array(bufferLength);
		var square = new Array(bufferLength);
		var sawtooth = new Array(bufferLength);
		var triangle = new Array(bufferLength);

		var choices = [sine, sawtooth, triangle, square];


		var i;
		for (i = 0; i < bufferLength; i++){
			sine[i] = (Math.sin(Math.PI * 2 * i / 255) + 1) * 128;
		}

		for (i = 0; i < bufferLength; i++){
			sawtooth[i] = ((i + bufferLength/2) % bufferLength) / bufferLength * 255;
		}

		for (i = 0; i < bufferLength; i++){
			if (i < bufferLength/4){
				triangle[i] = i/(bufferLength/4) * 127 + 128;
			} else if (i < bufferLength * 0.75){
				triangle[i] = (1 - (i - bufferLength/4)/(bufferLength/2)) * 255;
			} else {
				triangle[i] = (i - bufferLength * 0.75)/(bufferLength/4) * 127;
			}
		}

		for (i = 0; i < bufferLength; i++){
			var margin = bufferLength/16;
			if (i < margin){
				square[i] = 0;
			} else if (i < bufferLength/2){
				square[i] = 255;
			} else if (i < (bufferLength - margin)){
				square[i] = 0;
			} else {
				square[i] = 255;
			}
		}

		var random = choices[Math.floor(Math.random()*choices.length)];

		return {
			sawtooth : sawtooth,
			sine : sine,
			triangle : triangle,
			square : square,
			random : random
		};
	};
});