// TODO: organize this better (use security lab server as example)
// TODO: move database stuff out of this file like how security lab is setup

var colors = require('colors');
var http = require('http');
var express = require('express');
var exphbs = require('express-handlebars');
var handlebars = require('handlebars');
var session = require('express-session');
var bodyParser = require('body-parser');
var anyDB = require('any-db');
var engines = require('consolidate');

var conn = anyDB.createConnection('sqlite3://langland.db');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(session({
	secret: 'langland-secret-token',
	cookie: {
		maxAge: 600000
	},
	resave: false,
	saveUninitialized: false
}));

var hbs = exphbs.create({
	defaultLayout: 'main',
	handlebars: handlebars,
    // Specify helpers which are only registered on this instance.
    helpers: {
        language_bar: function(lang) {
        	var bar = '<li class="language">';
        	bar += '<span>' + lang.name + ':</span>';
			bar += '<span class="proficiency_bar">'
			for (i = 1; i <= 5; i++) {
				var c = 'class="prog_segment ';
				if (i <= lang.proficiency) {
					if (lang.native) {
						c += ' native';
					} else {
						c += ' learning';
					}
				}
				bar += '<span ' + c + '"></span>';
			}
			return new handlebars.SafeString(bar += '</span></li>');
		},
		result_language: function(lang) {
			var bar = '<li class="lang_result"><span ';
			if (lang.native) {
				bar += 'class="native">'
			} else {
				bar += 'class="learning">'
			}
			return new handlebars.SafeString(bar += lang.name + '</span></li>');
		}
    }
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/image_resources'));

function language(lang) {

}

var hbs = exphbs.create({
    // Specify helpers which are only registered on this instance.
    helpers: {language_bar: function(){return "Hello";}}
});

// create tables
conn.query('CREATE TABLE IF NOT EXISTS messages ( \
	message_id INTEGER PRIMARY KEY AUTOINCREMENT, \
	chat_id INTEGER, \
	username TEXT, \
	body TEXT, \
	time INTEGER, \
	FOREIGN KEY(chat_id) REFERENCES chats(chat_id) \
		ON DELETE CASCADE ON UPDATE CASCADE, \
	FOREIGN KEY(username) REFERENCES users(username) \
		ON DELETE CASCADE ON UPDATE CASCADE)', 
	function(error, data) {
	if (error) {
		console.log("messages: " + error);
	}
});
conn.query('CREATE TABLE IF NOT EXISTS users ( \
	username TEXT PRIMARY KEY, \
	password TEXT, \
	email TEXT, \
	birthdate TEXT, \
	gender TEXT)', 
	function(error, data) {
	if (error) {
		console.log("users: " + error);
	}
});
conn.query('CREATE TABLE IF NOT EXISTS languages ( \
	language_id INTEGER PRIMARY KEY AUTOINCREMENT, \
	username TEXT, \
	language TEXT, \
	proficiency INTEGER, \
	native INTEGER, \
	FOREIGN KEY(username) REFERENCES users(username) \
		ON DELETE CASCADE ON UPDATE CASCADE)', 
	function(error, data) {
	if (error) {
		console.log("languages: " + error);
	}
});
conn.query('CREATE TABLE IF NOT EXISTS chats ( \
	chat_id INTEGER PRIMARY KEY AUTOINCREMENT, \
	sender TEXT, \
	receiver TEXT, \
	new_msg_count INTEGER, \
	FOREIGN KEY(sender) REFERENCES users(username) \
		ON DELETE CASCADE ON UPDATE CASCADE, \
	FOREIGN KEY(receiver) REFERENCES users(username) \
		ON DELETE CASCADE ON UPDATE CASCADE)', 
	function(error, data) {
	if (error) {
		console.log("chats: " + error);
	}
});


// keeps track of all the rooms
// var rooms = [];
// conn.query('SELECT * FROM messages WHERE time=$1', [0], function(error, data) {
// 	data.rows.forEach(function(element) {
// 		rooms.push(element.room);
// 	});
// });

app.get('/search', function(request, response) {

	var data = {"results": [
		{
			"userName": "Send Help",
			"age": 200,
			"gender": "mystery",
			"languages": [
				{"name": "English", "native": true, "proficiency": 4},
				{"name": "Chinese", "native": false, "proficiency": 2}
			]
		},
		{
			"userName": "Another User",
			"age": 200,
			"gender": "mystery",
			"languages": [
				{"name": "Chinese", "native": true, "proficiency": 1},
				{"name": "English", "native": false, "proficiency": 5}
			]
		}
	]};
	response.render('search', data);
});

app.get('/chats', function(request, response) {
	var data = {
		"chats": ["Rita", "Beatriz", "Yunshu"],
		"friends": ["Bob", "Alice"],
		"user": {
			"userName": "Send Help",
			"age": 200,
			"gender": "mystery",
			"languages": [
				{"name": "English", "native": true, "proficiency": 4},
				{"name": "Chinese", "native": false, "proficiency": 2}
			]
		}
	};
	response.render('chats_friends', data);
});

app.get('/chatlist', function(req, res, next) {
	var data = {
		"chats": ["Rita", "Beatriz", "Yunshu"],
		"friends": ["Bob", "Alice"],
		"user": {
			"userName": "Send Help",
			"age": 200,
			"gender": "mystery"
		}
	};
	res.send(data);
});

app.get('/searchresults', getAllUsers);

app.get('/landing', function(request, response) {
	response.render('landing');
});

app.get('/', function(req, res, next) {
	var username = req.session.username;
	if (username) {
		res.redirect('/chatlist');
	} else {
		res.render('landing');
	}
});

// signup
app.post('/signup', saveUser);

// login
app.post('/login', loginUser);


function getAllUsers(req, res, next) {
	var query = 'SELECT username, birthdate, gender FROM users';
	conn.query(query, function(err, data) {
		if (err) {
			res.send("error");
			console.error(err);
		} else if (data.rows) {
			// res.send(data.rows);
			getAllUserLangInfo(req, res, next, data.rows);
		} else {
			console.log("uhh");
			res.send("failure");
		}
	});
}

function getAllUserLangInfo(req, res, next, userData) {
	var query = 'SELECT * FROM languages WHERE username=$1';
	var usersFinished = 0;
	userData.forEach(function(user, index, array) {
		conn.query(query, [user.username], function(err, data) {
			usersFinished++;
			if (err) {
				console.error(err);
			} else {
				user.languages = data.rows;
				if (usersFinished === array.length) {
					res.send(array);
				}
			}
		});
	});
}

function saveUser(req, res, next) {
	var username = req.body.username;
	var password = req.body.password;
	var email = req.body.email;
	var birthdate = req.body.birthdate;
    var gender = req.body.gender;

    var query = 'INSERT INTO users (username, password, email, birthdate, gender) VALUES($1, $2, $3, $4, $5)';
	conn.query(query, [username, password, email, birthdate, gender], function(err, data) {
		saveUser1(req, res, next, err, data);
	});
}

function saveUser1(req, res, next, err, data) {
	if (err) {
		console.error(err);
		res.send("error");
	} else {
		var username = req.body.username;
	    var native = req.body.native;
	    var native_proficiency = req.body.native_proficiency;
	    var learning = req.body.learning;
	    var learning_proficiency = req.body.learning_proficiency;

		var query = 'INSERT INTO languages (username, language, proficiency, native) VALUES($1, $2, $3, $4)';
		conn.query(query, [username, native, native_proficiency, 1], function(err, data) {
			if (err) {
				console.error(err);
			} else {
				console.log('added native language for ' + username);
			}
		});
		conn.query(query, [username, learning, learning_proficiency, 0], function(err, data) {
			if (err) {
				console.error(err);
			} else {
				console.log('added learning language for ' + username);
			}
		});

		res.send("success");
	}
}

function loginUser(req, res, next) {
	var username = req.body.username;
	var password = req.body.password;

	conn.query('SELECT * FROM users WHERE username=$1 AND password=$2', [username, password], function(err, data) {
		if (err) {
			res.send("error");
			console.error(err);
		} else if (data.rows) {
			var sessData = req.session;
			sessData.username = username;
			res.send("success");
		} else {
			console.log("uhh");
			res.send("failure");
		}
	});
}

function saveMessage(chat, username, message, time) {
	// below is old code for realtime
	// conn.query('INSERT INTO messages (room, nickname, body, time) VALUES($1, $2, $3, $4)', [roomName, nickname, message, time], function(error, data) {
	// 	if (error) {
	// 		console.error('ERROR: could not add message to table');
	// 	}
	// });
}

// function generateRoomIdentifier() {
// 	// make a list of legal characters
// 	// we're intentionally excluding 0, O, I, and 1 for readability
// 	var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// 	var result = '';
// 	for (var i = 0; i < 6; i++)
// 	result += chars.charAt(Math.floor(Math.random() * chars.length));

// 	return result;
// }


io.sockets.on('connection', function(socket) {
	// // clients emit this when they join new rooms
	// socket.on('join', function(roomName, nickname, callback) {
	// 	socket.join(roomName);
	// 	socket.nickname = nickname;
	// 	socket.roomName = roomName;

	// 	// update the user list
	// 	conn.query('INSERT INTO users (nickname, room) VALUES($1, $2)', [nickname, roomName], function(error, data) {
	// 		if (error) {
	// 			console.error(error);
	// 		} else {
	// 			conn.query('SELECT * from users WHERE room=$1', [roomName], function(error, data) {
	// 				if (error) {
	// 					console.log(error);
	// 				} else {
	// 					io.sockets.in(roomName).emit('membershipChanged', data.rows);
	// 				}
	// 			});
	// 		}
	// 	});

	// 	// send messages to user
	// 	conn.query('SELECT * from messages WHERE room=$1 AND time<>$2', [roomName, 0], function(error, data) {
	//     	var messages = data.rows;
	//     	if (error) {
	//     		console.error(error);
	//     	}
	// 		callback(messages);
	//     });
	// });

	// // this gets emitted if a user changes their nickname
	// socket.on('nickname', function(nickname) {
	// 	var oldname = socket.nickname;
	// 	var roomName = socket.roomName;
	// 	socket.nickname = nickname;

	// 	// update user list
	// 	conn.query('UPDATE users SET nickname=$1 WHERE nickname=$2 AND room=$3', [nickname, oldname, roomName], function(error, data) {
	// 		if (error) {
	// 			console.log(error);
	// 		} else {
	// 			conn.query('SELECT * from users WHERE room=$1', [roomName], function(error, data) {
	// 				if (error) {
	// 					console.log(error);
	// 				} else {
	// 					io.sockets.in(roomName).emit('membershipChanged', data.rows);
	// 				}
	// 			});
	// 		}
	// 	});
	// });

	// // clients emit this when they want to send a message
	// socket.on('message', function(val) {
	// 	var roomName = socket.roomName;
	// 	var nickname = val.nickname;
	// 	var message = val.body;
	// 	var time = val.time;

	// 	saveMessage(roomName, nickname, message, time);

	// 	io.sockets.in(roomName).emit('message', [val]);
	// });

	// // client disconnected
	// socket.on('disconnect', function() {
	// 	var nickname = socket.nickname;
	// 	var roomName = socket.roomName;

	// 	// delete user and update list
	// 	conn.query('DELETE FROM users WHERE nickname=$1 AND room=$2', [nickname, roomName], function(error, data) {
	// 		if (error) {
	// 			console.log(error);
	// 		} else {
	// 			conn.query('SELECT * from users WHERE room=$1', [roomName], function(error, data) {
	// 				if (error) {
	// 					console.log(error);
	// 				} else {
	// 					io.sockets.in(roomName).emit('membershipChanged', data.rows);
	// 				}
	// 			});
	// 		}
	// 	});
	// });

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
