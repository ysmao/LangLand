

// var anyDB = require('./server.js');
// var conn = anyDB.createConnection('sqlite3://langland.db');


$(document).ready(function() {
	$('.edit_button').click(function(event) {
		console.log($(this).attr('id'));
	});

	$('#new_message').submit(function(event) {
		event.preventDefault();

		var message = $('#message_box').val();
		var time = new Date().getTime();
		var sender = $('#message_sender').val();
		var receiver = $('#receiver').val();

		console.log(message);
		//$('#new_message')[0].reset(); //go back to default
    	$.post('/chats/save', {message:message, time:time, sender:sender, receiver:receiver}, function(res){
        	//you might want to add callback function that is executed post request success
        	console.log('msg sent');
    	});


	});

	$('.correct').click(function(event){
		var message = $('#message_box').val();
    	$.post('/chats/correct', {message:message}, function(res){
        	//you might want to add callback function that is executed post request success
        	console.log('msg sent');
    	});
	});

	$('.trans').click(function(event){
		var message = $('#message_box').val();
    	$.post('/chats/trans', {message:message}, function(res){
        	//you might want to add callback function that is executed post request success
        	console.log('msg sent');
    	});
	});

	// $('.friend').click(function(event) {
	// 	var username = $(this).attr('id');
	// 	$.post('/load-profile', {username}, function(res){
	//         //you might want to add callback function that is executed post request success
	//         if (res == "success") {
	//         	console.log("congration you done it");
	//         }
	//     });
	// });
});