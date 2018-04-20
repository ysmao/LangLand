$(document).ready(function() {
	$('#signup_form').submit(function(event) {
		event.preventDefault();
		alert('signup submitted');

		var username = $('#signup_username').val();
	    var password = $('#signup_password').val();
	    var email = $('#signup_email').val();

		$.post('/signup', {username, password, email}, function(res){
	        //you might want to add callback function that is executed post request success
	    });
	});

	$('#login_container').submit(function(event) {
		event.preventDefault();
		alert('login submitted');

		var username = $('#login_username').val();
	    var password = $('#login_password').val();

		$.post('/login', {username, password}, function(res){
	        //you might want to add callback function that is executed post request success
	        if (res == "success") {
	        	window.location.href = '/friends';
	        }
	    });
	});
});