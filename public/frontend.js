function toggleChatsTab() {
	window.location = '/chats';
}

function toggleFriendsTab() {
	// should eventually have a get request to load the friend's page
	// w the current user's profile
	window.location = '/friends';
}

console.log(window.location.href);