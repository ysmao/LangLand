$(document).ready(function() {
	$('#signup_form').submit(function(event) {
		event.preventDefault();

		var username = $('#signup_username').val();
	    var password = $('#signup_password').val();
	    var email = $('#signup_email').val();
	    var birthdate = $('#signup_birthdate').val();
	    var gender = $('#signup_gender').val();
	    var native = $('#signup_native').val();
	    var native_proficiency = $('input[name=native_lang]:checked').val();
	    var learning = $('#signup_learning').val();
	    var learning_proficiency = $('input[name=learning_lang]:checked').val();

		$.post('/signup', {username, password, email, birthdate, gender, native, native_proficiency, learning, learning_proficiency}, function(res){
	        //you might want to add callback function that is executed post request success
	        if (res == "success") {
	        	window.location.href = '/';
	        }
	    });
	});

	$('#login_container').submit(function(event) {
		event.preventDefault();

		var username = $('#login_username').val();
	    var password = $('#login_password').val();

		$.post('/login', {username, password}, function(res){
	        //you might want to add callback function that is executed post request success
	        if (res == "success") {
	        	window.location.href = '/chatlist';
	        }
	    });
	});
});
