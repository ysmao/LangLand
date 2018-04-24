

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

function toggleChatsTab() {
	$('#chats_tab_content').show();
	$('#friends_tab_content').hide();

	$('#chats_tab').addClass("selected");
	$('#chats_tab_content').addClass("selected");

	$('#friends_tab').removeClass("selected");
	$('#friends_tab_content').removeClass("selected");

	$('#chat_content').show();
	$('#user_profile').hide();
}

function toggleFriendsTab() {
	$('#chats_tab_content').hide();
	$('#friends_tab_content').show();

	$('#friends_tab').addClass("selected");
	$('#friends_tab_content').addClass("selected");

	$('#chats_tab').removeClass("selected");
	$('#chats_tab_content').removeClass("selected");

	$('#chat_content').hide();
	$('#user_profile').css('display', 'flex');
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
	$('#step_one').addClass("current");
	$('#step_two').removeClass("current");
}

function displaySignupTwo() {
	$('#signup_pt_two').css('display', 'inline-flex');
	$('#signup_pt_one').hide();

	$('#step_two').addClass("current");
	$('#step_one').removeClass("current");
}