$(document).ready(function() {
	var pathname = window.location.pathname.split( '/' );

	if (pathname.length == 3) {
		console.log(pathname[2]);
		var current_name = '#' + pathname[2];
		$(current_name).addClass("current");
	}
});

function logOut(event) {
	$.post('/logout', function(res){
        if (res == "success") {
        	window.location.href = '/';
        }
    });
}