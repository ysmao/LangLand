function toggleChatsTab() {
	window.location = '/chats';
}

function toggleFriendsTab() {
	// should eventually have a get request to load the friend's page
	// w the current user's profile
	window.location = '/friends';
}

$(document).ready(function() {
	console.log("here");
	var pathname = window.location.pathname.split( '/' );

	if (pathname.length == 3) {
		console.log(pathname[2]);
		var current_name = '#' + pathname[2];
		$(current_name).addClass("current");
	}
});