$(document).ready(function() {
	console.log("here");
	var pathname = window.location.pathname.split( '/' );

	if (pathname.length == 3) {
		console.log(pathname[2]);
		var current_name = '#' + pathname[2];
		$(current_name).addClass("current");
	}
});