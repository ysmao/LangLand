var socket = io.connect();


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


	$("#users_search").keypress(function (event) {
	    if(event.which == 13 && !event.shiftKey) {        
	        event.preventDefault();	

			var username = $('#users_search').val();
			var min_age = $('#min_age').val();
			var max_age = $('#max_age').val();
			var native_lang = $('#language_filter').val();

			var min_proficiency = Math.round($('#proficiency_slider')[0].noUiSlider.get()[0]);
			var max_proficiency = Math.round($('#proficiency_slider')[0].noUiSlider.get()[1]);
			console.log(min_proficiency);
			console.log(max_proficiency);

			if(!min_age){
				console.log(2333);
				min_age=-1;
			}
			if(!max_age){
				console.log(3444);
				max_age=300;
			}
			window.location.href='http://localhost:8080/s/?prefix='+username+'&min_age='+min_age+'&max_age='+max_age+'&native_lang='+native_lang+'&min_proficiency='+min_proficiency+'&max_proficiency='+max_proficiency;
			console.log(min_age);
			console.log(max_age);
			console.log(native_lang);
			
			
			//$('#users_search').reset(); //go back to default
	    	// $.post('/search/result', {username:username,min_age:min_age,max_age:max_age,native_lang:native_lang}, function(res){
	     //    	//you might want to add callback function that is executed post request success
	     //    	console.log('search request sent');
	    	// });
			// socket.emit('search_users', {username:username}, function(val) {
			// 	console.log(val);
			// });

    		$('#users_search').focus();
	        // event.preventDefault();
	        return false;
	    }
	});});