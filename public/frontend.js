$(document).ready(function() {
	var pathname = window.location.pathname.split( '/' );

	if (pathname.length == 3) {
		console.log(pathname[2]);
		var current_name = '#' + pathname[2];
		$(current_name).addClass("current");
	}

	if (pathname[1] === "chats" || pathname[1] === "friends") {
		$('#chfr_link').addClass("current_link");
	} else if (pathname[1] === "search") {
		$('#search_link').addClass("current_link");
	}
});

function logOut(event) {
	$.post('/logout', function(res){
        if (res == "success") {
        	window.location.href = '/';
        }
    });
}