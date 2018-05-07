var socket = io.connect();
var editing = false;

var edit_id = 0;
var translate = false;
var correct = false;
var me;
var otherPerson;
// var anyDB = require('./server.js');
// var conn = anyDB.createConnection('sqlite3://langland.db');


$(document).ready(function() {
	editing = false;
	me = $('#message_sender').val();
	var pathname = window.location.pathname.split( '/' );
	otherPerson = pathname[2];

    $('#message_box').focus();

	socket.emit("join", me, function(something) {
		console.log(something);
	});

	socket.on("message", function(val) {
		if (val.sender == me && val.receiver == otherPerson) {
			addMyMessage(val);
		} else if (val.sender == otherPerson && val.receiver == me) {
			addYourMessage(val);
		}
	});

	socket.on("correction", function(val) {
		if (val.sender == me && val.receiver == otherPerson) {
			addMyCorrectedMessage(val);
		} else if (val.sender == otherPerson && val.receiver == me) {
			addYourCorrectedMessage(val);
		}
	});

	$('.edit_button').click(function(event) {
		editing = true;

		edit_id = ($(this).attr('id'));

		msg_content_id = '#message_' + edit_id;
		console.log(msg_content_id);
		console.log($(msg_content_id).html());

		$("#edit_modal_content").css({top: event.pageY, left: event.pageX});

		$('#edit_modal').show();

	});

	setSubmit();

	$("#message_box").keypress(function (event) {
	    if(event.which == 13 && !event.shiftKey) {        
	        $('#new_message').submit();
	        event.preventDefault();
	        return false;
	    }
	});

	// $('.correct').click(function(event){
	// 	var message = $('#message_box').val();
 //    	$.post('/chats/correct', {message:message}, function(res){
 //        	//you might want to add callback function that is executed post request success
 //        	console.log('msg sent');
 //    	});
	// });

	// $('.trans').click(function(event){
	// 	var message = $('#message_box').val();
 //    	$.post('/chats/trans', {message:message}, function(res){
 //        	//you might want to add callback function that is executed post request success
 //        	console.log('msg sent');
 //    	});
	// });


	window.onclick = function(event) {
        if (event.target == document.getElementById('edit_modal')) {
            event.target.style.display = "none";
        }
    }

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

function setSubmit() {
	$('#new_message').submit(function(event) {
		if (!editing) {
			event.preventDefault();

			var pathname = window.location.pathname.split( '/' );

			var message = $('#message_box').val();
			var time = new Date().getTime();
			var sender = $('#message_sender').val();
			var receiver = pathname[2];
			
			$('#new_message')[0].reset(); //go back to default

			socket.emit('message', {message:message, time:time, sender:sender, receiver:receiver}, function(val) {
				console.log(val);
			});

    		$('#message_box').focus();
		} else {
			event.preventDefault();

			var message = $('#message_box').val();
			var time = new Date().getTime();
			var sender = $('#message_sender').val();
			var receiver = otherPerson;

			$('#new_message')[0].reset();
			
			socket.emit('correction', {message:message, time:time, sender:sender, receiver:receiver, m_id:edit_id}, function(val) {
				console.log(val);
			});

			console.log("submitted edit");
			$('#message_box').focus();
			editing = false;
			translate = false;
			correct = false;
		}
	});
}

function addMyMessage(val) {
	var chat = document.getElementById("chat_display");
	var isScrolledToBottom = chat.scrollHeight - chat.clientHeight <= chat.scrollTop + 1;

	var first_li = '<li class="message my_message">';
	var first_msg_content = '<div class="message_content" id="message_' + val.m_id + '">'
	var msg_content = first_msg_content + val.message + '</div>';

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
	var first_msg_content = '<div class="message_content" id="message_' + val.m_id + '">'
	var msg_content = first_msg_content + val.message + '</div>';

	var edit_button = '<button class="edit_button" id="' + val.m_id + '" onclick="editClick(event)"> \
		<img src="/edit_icon.png" width="17" height="17" alt="edit message"></button>';

	var rendered_message = first_li + img + msg_content + edit_button + '</li>';

	$('#messages_list').append(rendered_message);

	if(isScrolledToBottom) {
	    chat.scrollTop = chat.scrollHeight - chat.clientHeight;
	}
}

function addMyCorrectedMessage(val) {
	var chat = document.getElementById("chat_display");
	var isScrolledToBottom = chat.scrollHeight - chat.clientHeight <= chat.scrollTop + 1;
	console.log(val);
	var first_li = '<li class="message my_message">';

	var first_msg_content = '<div class="message_content" id="message_' + val.m_id + '">';
	var original_msg = '<span class="original_msg">' + val.orig_msg + '</span>';
	var corrected_msg = '<span class="corrected_msg">' + val.correction + '</span>';
	var msg_content = first_msg_content + original_msg + corrected_msg + '</div>';

	var rendered_message = first_li + msg_content + '</li>';

	$('#messages_list').append(rendered_message);

	if(isScrolledToBottom) {
	    chat.scrollTop = chat.scrollHeight - chat.clientHeight;
	}
}

function addYourCorrectedMessage(val) {
	var chat = document.getElementById("chat_display");
	var isScrolledToBottom = chat.scrollHeight - chat.clientHeight <= chat.scrollTop + 1;

	var first_li = '<li class="message your_message">';
	var img = '<img src="/placeholder.png" alt="' + val.sender + '" class="avatar">';
	var first_msg_content = '<div class="message_content" id="message_' + val.m_id + '">';
	var original_msg = '<span class="original_msg">' + val.orig_msg + '</span>';
	var corrected_msg = '<span class="corrected_msg">' + val.correction + '</span>';
	var msg_content = first_msg_content + original_msg + corrected_msg + '</div>';

	var rendered_message = first_li + img + msg_content + '</li>';

	$('#messages_list').append(rendered_message);

	if(isScrolledToBottom) {
	    chat.scrollTop = chat.scrollHeight - chat.clientHeight;
	}
}

function correctMessage() {
	correct = true;
	translate = false;

	msg_content_id = '#message_' + edit_id;
	$('#message_box').val( $(msg_content_id).html());

	$('#edit_modal').hide();
}

function translateMessage() {
	translate = true;
	correct = false;

	$('#edit_modal').hide();
}

function editClick(event) {
		editing =true;

		edit_id = ($(this).attr('id'));

		msg_content_id = '#message_' + edit_id;
		console.log(msg_content_id);
		console.log($(msg_content_id).html());

		$("#edit_modal_content").css({top: event.pageY, left: event.pageX});

		$('#edit_modal').show();

		$('#new_message').submit(function(event) {
			event.preventDefault();

			var message = $('#message_box').val();
			var time = new Date().getTime();
			var sender = $('#message_sender').val();
			var receiver = otherPerson;

			$('#new_message')[0].reset();
    		// $.post('/chats/edit', {message:message, time:time, sender:sender, receiver:receiver, m_id:m_id}, function(res){
      //   	//you might want to add callback function that is executed post request success
      //   		console.log('edited msg sent');
    		// });
    		
    		socket.emit('correction', {message:message, time:time, sender:sender, receiver:receiver, m_id:edit_id}, function(val) {
    			console.log(val);
    		});

    		$('#message_box').focus();
    	});
}