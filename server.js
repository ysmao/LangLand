var colors = require('colors');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var anyDB = require('any-db');
var engines = require('consolidate');
var conn = anyDB.createConnection('sqlite3://chatroom.db');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.engine('html', engines.hogan);
app.set('views', __dirname + '/templates');
app.set('view engine', 'html');

app.use(express.static(__dirname + '/templates'));
app.use(express.static(__dirname + '/public'));

// create tables
conn.query('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, room TEXT, nickname TEXT, body TEXT, time INTEGER)', function(error, data) {
	if (error) {
		console.log(error);
	}
});
conn.query('DROP TABLE IF EXISTS users', function(error, data) {
	if (error) {
		console.log(error);
	}
});
conn.query('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, nickname TEXT, room TEXT)', function(error, data) {
	if (error) {
		console.log(error);
	}
});


// keeps track of all the rooms
var rooms = [];
conn.query('SELECT * FROM messages WHERE time=$1', [0], function(error, data) {
	data.rows.forEach(function(element) {
		rooms.push(element.room);
	});
});


// creates a new room
app.get('/new', function(request, response) {
	var roomID;
	do {
		roomID = generateRoomIdentifier();
	} while (rooms.includes(roomID));

	// uses time=0 to differentiate the room creation from messages
	conn.query('INSERT INTO messages (room, nickname, body, time) VALUES($1, $2, $3, $4)', [roomID, "", "", 0], function(error, data) {
		if (error) {
			console.error(error);
		}
	});
	response.redirect('/' + roomID);
});

// index
app.get('', function(request, response) {
	response.render('index.html');
});

// chatroom
app.get('/:roomName', function(request, response) {
	conn.query('SELECT * FROM messages WHERE room=$1', [request.params.roomName], function(error, data) {
		if (data.rows.length > 0) {
			response.render('room.html', {roomName: request.params.roomName});
		} else {
			response.render('error.html');
		}
	});
});

// 404
app.get('*', function(request, response) {
	response.render('error.html');
});


function saveMessage(roomName, nickname, message, time) {
	conn.query('INSERT INTO messages (room, nickname, body, time) VALUES($1, $2, $3, $4)', [roomName, nickname, message, time], function(error, data) {
		if (error) {
			console.error('ERROR: could not add message to table');
		}
	});
}

function generateRoomIdentifier() {
	// make a list of legal characters
	// we're intentionally excluding 0, O, I, and 1 for readability
	var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

	var result = '';
	for (var i = 0; i < 6; i++)
	result += chars.charAt(Math.floor(Math.random() * chars.length));

	return result;
}


io.sockets.on('connection', function(socket) {
	// clients emit this when they join new rooms
	socket.on('join', function(roomName, nickname, callback) {
		socket.join(roomName);
		socket.nickname = nickname;
		socket.roomName = roomName;

		// update the user list
		conn.query('INSERT INTO users (nickname, room) VALUES($1, $2)', [nickname, roomName], function(error, data) {
			if (error) {
				console.error(error);
			} else {
				conn.query('SELECT * from users WHERE room=$1', [roomName], function(error, data) {
					if (error) {
						console.log(error);
					} else {
						io.sockets.in(roomName).emit('membershipChanged', data.rows);
					}
				});
			}
		});

		// send messages to user
		conn.query('SELECT * from messages WHERE room=$1 AND time<>$2', [roomName, 0], function(error, data) {
	    	var messages = data.rows;
	    	if (error) {
	    		console.error(error);
	    	}
			callback(messages);
	    });
	});

	// this gets emitted if a user changes their nickname
	socket.on('nickname', function(nickname) {
		var oldname = socket.nickname;
		var roomName = socket.roomName;
		socket.nickname = nickname;

		// update user list
		conn.query('UPDATE users SET nickname=$1 WHERE nickname=$2 AND room=$3', [nickname, oldname, roomName], function(error, data) {
			if (error) {
				console.log(error);
			} else {
				conn.query('SELECT * from users WHERE room=$1', [roomName], function(error, data) {
					if (error) {
						console.log(error);
					} else {
						io.sockets.in(roomName).emit('membershipChanged', data.rows);
					}
				});
			}
		});
	});

	// clients emit this when they want to send a message
	socket.on('message', function(val) {
		var roomName = socket.roomName;
		var nickname = val.nickname;
		var message = val.body;
		var time = val.time;

		saveMessage(roomName, nickname, message, time);

		io.sockets.in(roomName).emit('message', [val]);
	});

	// client disconnected
	socket.on('disconnect', function() {
		var nickname = socket.nickname;
		var roomName = socket.roomName;

		// delete user and update list
		conn.query('DELETE FROM users WHERE nickname=$1 AND room=$2', [nickname, roomName], function(error, data) {
			if (error) {
				console.log(error);
			} else {
				conn.query('SELECT * from users WHERE room=$1', [roomName], function(error, data) {
					if (error) {
						console.log(error);
					} else {
						io.sockets.in(roomName).emit('membershipChanged', data.rows);
					}
				});
			}
		});
	});

	// error
	socket.on('error', function() {
		console.log('ERROR: socket error');
	});
});


server.listen(8080, function(){
	console.log('- Server listening on port 8080'.grey);
});

process.on('SIGINT', function() {
    // close database connection
    conn.end();
    process.exit(0);
});
