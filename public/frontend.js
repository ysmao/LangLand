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
	$('#step_one').addClass("current_step");
	$('#step_two').removeClass("current_step");
}

function displaySignupTwo() {
	$('#signup_pt_two').css('display', 'inline-flex');
	$('#signup_pt_one').hide();

	$('#step_two').addClass("current_step");
	$('#step_one').removeClass("current_step");
}

$(document).ready(function() {
	$('.friend').click(function(event) {
		var username = $(this).attr('id');
		$('.friend').removeClass("current_friend");
		$(this).addClass("current_friend");
		$.post('/load-profile', {username}, function(res){
	        //you might want to add callback function that is executed post request success
	        if (res == "success") {
	        	console.log("congration you done it");
	        }
	    });
	});

	$('.chat').click(function(event) {
		var username = $(this).attr('id');
		$('.chat').removeClass("current_chat");
		$(this).addClass("current_chat");
		$.post('/load-chat', {username}, function(res){
	        //you might want to add callback function that is executed post request success
	        if (res == "success") {
	        	console.log("congration ya done did it");
	        }
	    });
	});
});