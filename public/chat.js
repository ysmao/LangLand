var socket = io.connect();
var editing = false;
// var anyDB = require('./server.js');
// var conn = anyDB.createConnection('sqlite3://langland.db');


$(document).ready(function() {
	editing = false;
	var me = $('#message_sender').val();
	var pathname = window.location.pathname.split( '/' );
	var otherPerson = pathname[2];

    $('#message_box').focus();

	socket.emit("join", me, function(something) {
		console.log(something);
	});

	socket.on("message", function(val) {
		if (val.sender == me) {
			addMyMessage(val);
		} else if (val.receiver == otherPerson) {
			addYourMessage(val);
		}
		console.log(val.message);
	});

	socket.on("correction", function(val) {

	});

	$('.edit_button').click(function(event) {
		editing =true;
		console.log($(this).attr('id'));
		var m_id = $(this).attr('id');

		$('#new_message').submit(function(event) {
			var pathname = window.location.pathname.split( '/' );

			var message = $('#message_box').val();
			var time = new Date().getTime();
			var sender = $('#message_sender').val();
			var receiver = pathname[2];
			console.log(666);

			$('#new_message')[0].reset();
    		// $.post('/chats/edit', {message:message, time:time, sender:sender, receiver:receiver, m_id:m_id}, function(res){
      //   	//you might want to add callback function that is executed post request success
      //   		console.log('edited msg sent');
    		// });

    		socket.emit('correction', {message:message, time:time, sender:sender, receiver:receiver, m_id:m_id}, function(val) {
    			console.log(val);
    		});

    		$('#message_box').focus();
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
			
			$('#new_message')[0].reset(); //go back to default
	    	// $.post('/chats/save', {message:message, time:time, sender:sender, receiver:receiver}, function(res){
	     //    	//you might want to add callback function that is executed post request success
	     //    	console.log('msg sent');
	    	// });

			socket.emit('message', {message:message, time:time, sender:sender, receiver:receiver}, function(val) {
				console.log(val);
			});

    		$('#message_box').focus();
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

	var chat = document.getElementById("chat_display");
	chat.scrollTop = chat.scrollHeight - chat.clientHeight;
});

function addMyMessage(val) {
	var chat = document.getElementById("chat_display");
	var isScrolledToBottom = chat.scrollHeight - chat.clientHeight <= chat.scrollTop + 1;

	var first_li = '<li class="message my_message">';
	var msg_content = '<div class="message_content">' + val.message + '</div>';

	var rendered_message = first_li + msg_content + '</li>';

	$('#messages_list').append(rendered_message);

	if(isScrolledToBottom) {
	    chat.scrollTop = chat.scrollHeight - chat.clientHeight;
	}
}

function addYourMessage(val) {
	var chat = document.getElementById("chat_display");
	var isScrolledToBottom = chat.scrollHeight - chat.clientHeight <= chat.scrollTop + 1;

	var first_li = '<li class="message your_message">';
	var img = '<img src="/placeholder.png" alt="' + val.sender + '" class="avatar">';
	var msg_content = '<div class="message_content">' + val.message + '</div>';
	var edit_button = '<button class="edit_button"> \
		<img src="/edit_icon.png" width="17" height="17" alt="edit message"> \
		</button>';

	var rendered_message = first_li + img + msg_content + edit_button + '</li>';

	$('#messages_list').append(rendered_message);

	if(isScrolledToBottom) {
	    chat.scrollTop = chat.scrollHeight - chat.clientHeight;
	}
}
