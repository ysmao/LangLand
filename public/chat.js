var socket = io.connect();
var editing = false;
// var anyDB = require('./server.js');
// var conn = anyDB.createConnection('sqlite3://langland.db');


$(document).ready(function() {
	editing = false;
	var me = $('#message_sender').val();

	socket.emit("join", me, function(something) {
		console.log(something);
	});

	socket.on("message", function(val) {
		if (val.sender == me) {
			addMyMessage(val);
		} else {
			addYourMessage(val);
		}
		console.log(val.message);
	});

	$('.edit_button').click(function(event) {
		editing =true;
		console.log($(this).attr('id'));
		var mid = $(this).attr('id');

		$('#new_message').submit(function(event) {
			var pathname = window.location.pathname.split( '/' );

			var message = $('#message_box').val();
			var time = new Date().getTime();
			var sender = $('#message_sender').val();
			var receiver = pathname[2];
			console.log(666);

    		$.post('/chats/edit', {message:message, time:time, sender:sender, receiver:receiver, mid:mid}, function(res){
        	//you might want to add callback function that is executed post request success
        		console.log('edited msg sent');
    		});

    	});
	});

	$('#new_message').submit(function(event) {
		if(editing===false){
		event.preventDefault();

		var pathname = window.location.pathname.split( '/' );

		var message = $('#message_box').val();
		var time = new Date().getTime();
		var sender = $('#message_sender').val();
		var receiver = pathname[2];
		
		//$('#new_message')[0].reset(); //go back to default
    	// $.post('/chats/save', {message:message, time:time, sender:sender, receiver:receiver}, function(res){
     //    	//you might want to add callback function that is executed post request success
     //    	console.log('msg sent');
    	// });

		socket.emit('message', {message:message, time:time, sender:sender, receiver:receiver}, function(val) {
			console.log(val);
		});
}
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

function addMyMessage(val) {
	var first_li = '<li class="message my_message">';
	var msg_content = '<div class="message_content">' + val.message + '</div>';

	var rendered_message = first_li + msg_content + '</li>';

	$('#messages_list').append(rendered_message);
}

function addYourMessage(val) {
	var first_li = '<li class="message your_message">';
	var img = '<img src="/placeholder.png" alt="' + val.sender + '" class="avatar">';
	var msg_content = '<div class="message_content">' + val.message + '</div>';
	var edit_button = '<button class="edit_button"> \
		<img src="/edit_icon.png" width="17" height="17" alt="edit message"> \
		</button>';

	var rendered_message = first_li + img + msg_content + edit_button + '</li>';

	$('#messages_list').append(rendered_message);
}