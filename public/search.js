$(document).ready(function() {
	var slider = document.getElementById('proficiency_slider');
	noUiSlider.create(slider, {
		start: [1, 5],
		connect: true,
		step: 1,
		range: {
			"min": [1],
			"max": [5]
		},
		pips: {
			mode: 'steps',
			density: 20
		}
	});
});