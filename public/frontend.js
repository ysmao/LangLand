function toggleChatsTab() {
	window.location = '/chats';
}

function toggleFriendsTab() {
	// should eventually have a get request to load the friend's page
	// w the current user's profile
	window.location = '/friends';
}

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

console.log(window.location.href);