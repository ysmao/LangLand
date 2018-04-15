var socket = io.connect();

$(document).ready(function(){
	// handle incoming messages
	socket.on('message', function(val) {
		displayMessages(val);
	});

	// handle room membership changes
	socket.on('membershipChanged', function(members) {
		displayMembers(members);
	});

	// get nickname
	var nickname = setNickname();

	// join room
	socket.emit('join', meta('roomName'), nickname, function(messages) {
		displayMessages(messages);
	});

    var messageForm = $('#messageForm').submit(sendMessage);
    $('#changeNameButton').click(changeNickname);
});

var prevMsgs = [];

function setNickname() {
	var nickname = prompt('Enter a nickname:');
	$('#nicknameField').val(nickname);
	return nickname;
}

function changeNickname() {
	var newname = setNickname();

	socket.emit('nickname', newname);
}

function displayMembers(members) {
	// empties user list and recreates it
	var ul = $("#users");
	ul.html('');
	$.each(members, function(index, val) {
		var li = $('<li class="user"></li>');
		li.html(val.nickname);
		ul.append(li);
	});
}

function displayMessages(data) {
	var ul = $("#messages");
	$.each(data, function(index, val) {
		// build the message and add it to the list
		var li = $("<li></li>");
		li.html('<h3 class="username">' + val.nickname + '</h3>' + 
			'<p class="message">' + val.body + '</p>');
		ul.append(li);
	});
}

function meta(name) {
    var tag = document.querySelector('meta[name=' + name + ']');
    if (tag != null)
        return tag.content;
    return '';
}

function sendMessage(event) {
    // prevent the page from redirecting
    event.preventDefault();

    // get the parameters
    var nickname = $('#nicknameField').val();
    var message = $('#messageField').val();
    var time = Date.now();

    // send to server
    socket.emit('message', {'nickname': nickname, 'body': message, 'time': time});
    $('#messageField').val("");
    $('#messageField').focus();
}
