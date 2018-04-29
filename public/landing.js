$(document).ready(function() {
	jQuery.validator.setDefaults({
		debug: true,
		success: "valid"
	});

	$('#signup_next').on('click', function(event) {
		console.log("next");
		var form = $('#signup_form');
		form.validate({
			rules: {
				signup_username: {
					required: true
				},
				signup_password: {
					required: true
				},
				signup_conf_password: {
					required: true,
					equalTo: '#signup_password'
				},
				signup_native: {
					required: true
				},
				native_lang: {
					required: true
				},
				signup_learning: {
					required: true
				},
				learning_lang: {
					required: true
				},
				errorPlacement: function(error, element) {
		            if ( element.is(":radio") ) 
		            {
		                error.appendTo( element.parents('.container') );
		            }
		            else 
		            { // This is the default behavior 
		                error.insertAfter( element );
		            }
		         }
			},
			messages: {
				signup_username: {
					required: "Please enter a username"
				},
				signup_password: {
					required: "Please enter a password"
				},
				signup_conf_password: {
					required: "Please retype password",
					equalTo: "Passwords must match"
				},
				signup_native: {
					required: "Please select a language"
				},
				native_lang: {
					requried: "Please select a proficiency"
				},
				signup_learning: {
					required: "Please select a language"
				},
				learning_lang: {
					requried: "Please select a proficiency"
				}
			},
			errorPlacement: function(label, element) {
		        label.addClass('error_message');
		        label.insertAfter(element);
	    	}
		});
		if (form.valid()) {
			$('#signup_pt_two').css('display', 'inline-flex');
			$('#signup_pt_one').hide();

			$('#step_two').addClass("current_step");
			$('#step_one').removeClass("current_step");
		}
	});

	$('#signup_form').submit(function(event) {
		event.preventDefault();

		if ($('#signup_form').valid()) {
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
		        if (res === "success") {
		        	window.location.href = '/';
		        }
		    });
		}


	});

	$('#login_container').submit(function(event) {
		event.preventDefault();

		var username = $('#login_username').val();
	    var password = $('#login_password').val();

		$.post('/login', {username, password}, function(res){
	        //you might want to add callback function that is executed post request success
	        if (res == "success") {
	        	window.location.href = '/chats';
	        }
	    });
	});
});

function displayLogin() {
	$('#login_container').css('display', 'inline-flex');
	$('#landing_buttons').hide();
}

function displaySignupOne() {
	$('#signup_pt_one').css('display', 'inline-flex');
	$('#landing_buttons').hide();
	$('#signup_pt_two').hide();

	$('#steps').show();
	$('#step_one').addClass("current_step");
	$('#step_two').removeClass("current_step");
}

function displaySignupTwo() {
	$('#signup_pt_two').css('display', 'inline-flex');
	$('#signup_pt_one').hide();

	$('#step_two').addClass("current_step");
	$('#step_one').removeClass("current_step");
}