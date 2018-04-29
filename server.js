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
			if (lang.native === 1) {
				bar += 'class="native">'
			} else {
				bar += 'class="learning">'
			}
			return new handlebars.SafeString(bar += lang.language + '</span></li>');
		},
		chat_message: function(message, me) {
			console.log("hi " + me);
			var c = 'class="message ';
			if (message.sender == me) {
				c += 'my_message"';
			} else {
				c += 'your_message"';
			}
			var first_li = '<li ' + c + '>'
			var message_content = '<div class="message_content">' + message.body + '</div>';
			if (message.sender == me) {
				return new handlebars.SafeString(first_li + message_content + '</li>');
			} else {
				var img = '<img src="/placeholder.png" alt="' + message.sender + '" class="avatar">';
				var edit_button = '<button class="edit_button"> \
				<img src="/edit_icon.png" width="17" height="17" alt="edit message"> \
				</button>';
				return new handlebars.SafeString(first_li + img + message_content + edit_button + '</li>');
			}
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
	sender TEXT, \
	receiver TEXT, \
	body TEXT, \
	time INTEGER, \
	FOREIGN KEY(sender) REFERENCES users(username) \
		ON DELETE CASCADE ON UPDATE CASCADE, \
	FOREIGN KEY(receiver) REFERENCES users(username) \
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
	user1 TEXT, \
	user2 TEXT, \
	newest_msg INTEGER, \
	FOREIGN KEY(user1) REFERENCES users(username) \
		ON DELETE CASCADE ON UPDATE CASCADE, \
	FOREIGN KEY(user2) REFERENCES users(username) \
		ON DELETE CASCADE ON UPDATE CASCADE, \
	FOREIGN KEY(newest_msg) REFERENCES messages(message_id) \
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

app.get('/friends', function(req, res) {
	var me = req.session.username;
	var query = 'SELECT user1,user2 FROM chats WHERE user1=$1 OR user2=$1';
	conn.query(query, [me], function(err, data) {
		if (err) {
			console.error(err);
		} else {
			var data = {
				"myUsername": me,
				"friends": getChats(me, data.rows)
			};
			res.render('friends', data);
		}
	});
});

app.get('/friends/:user', function(req, res, next) {
	var friend = req.params.user;
	var me = req.session.username;
	var query = 'SELECT user1,user2 FROM chats WHERE user1=$1 OR user2=$1';
	conn.query(query, [me], function(err, data) {
		if (err) {
			console.error(err);
		} else {
			var render_data = {
				"myUsername": me,
				"friends": getChats(me, data.rows)
			};
			getUserInfo(req, res, next, friend, render_data);
		}
	});
});

function getUserInfo(req, res, next, user, render_data) {
	var query = 'SELECT users.username, \
	users.birthdate, \
	users.gender, \
	languages.language, \
	languages.proficiency, \
	languages.native \
	FROM users INNER JOIN languages ON users.username=languages.username WHERE users.username=$1';
	conn.query(query, [user], function(err, data) {
		if (err) {
			console.error(err);
		} else {
			var userinfo = data.rows[0];
			var nativelang;
			var learninglang;
			if (data.rows[0].native === 1) {
				nativelang = data.rows[0];
				learninglang = data.rows[1];
			} else {
				nativelang = data.rows[1];
				learninglang = data.rows[0];
			}

			var user = {
				"username": userinfo.username,
				"age": getAge(userinfo.birthdate),
				"gender": userinfo.gender
			}

			delete nativelang.username;
			delete nativelang.birthdate;
			delete nativelang.gender;

			delete learninglang.username;
			delete learninglang.birthdate;
			delete learninglang.gender;

			user.languages = [nativelang, learninglang];
			render_data.profile = user;
			res.render('friends', render_data);
		}
	});
}

app.get('/chats', function(req, res, next) {
	var me = req.session.username;
	var query = 'SELECT user1,user2 FROM chats WHERE user1=$1 OR user2=$1';
	conn.query(query, [me], function(err, data) {
		if (err) {
			console.error(err);
		} else {
			var data = {
				"myUsername": me,
				"chats": getChats(me, data.rows)
			};
			res.render('chats', data);
		}
	});
});

function getChats(me, chats) {
	chats.forEach(function(chat, index, array) {
		if (me === chat.user1) {
			chat.username = chat.user2;
		} else {
			chat.username = chat.user1;
		}

		delete chat.user1;
		delete chat.user2;
	});
	return chats;
}

app.get('/chats/:user', function(req, res, next) {
	var me = req.session.username;
	var them = req.params.user;
	var query = 'SELECT user1,user2 FROM chats WHERE user1=$1 OR user2=$1';
	conn.query(query, [me], function(err, data) {
		if (err) {
			console.error(err);
		} else {
			var data = {
				"myUsername": me,
				"chats": getChats(me, data.rows)
			};
			getChat(req, res, next, me, them, data);
		}
	});
});

function getChat(req, res, next, user1, user2, data) {
	if (chatExists(user2, data.chats)) {
		getMessages(req, res, next, user1, user2, data);
	} else {
		addChat(req, res, next, user1, user2, data);
	}
}

function chatExists(name, chats) {
    var i;
    for (i = 0; i < chats.length; i++) {
        if (chats[i].username === name) {
            return true;
        }
    }

    return false;
}

function addChat(req, res, next, user1, user2, render_data) {
	var query = 'INSERT INTO chats (user1, user2, newest_msg) VALUES($1, $2, $3)';
	conn.query(query, [user1, user2, -1], function(err, data) { 
		if (err) {
			console.log(err);
		} else {
			render_data.chats.push({username: user2});
			render_data.messages = [];
			res.render('chats', render_data);
		}
	});
}

function getMessages(req, res, next, user1, user2, render_data) {
	var query = 'SELECT * FROM messages WHERE (sender=$1 AND receiver=$2) OR (sender=$2 AND receiver=$1)';
	conn.query(query, [user1, user2], function(err, data) {
		if (err) {
			console.error(err);
		} else {
			render_data.messages = data.rows;
			res.render('chats', render_data);
		}
	});
}

// app.get('/addmessages', function(req, res, next) {
// 	var query = 'INSERT INTO messages (sender, receiver, body, time) VALUES($1, $2, $3, $4)';
// 	conn.query(query, ["rding", "chip", "hellooooo", 100], function(err, data) {
// 		if (err) {
// 			console.error(err);
// 		} else {
// 			conn.query(query, ["chip", "rding", "hi there!", 200], function(err, data) {
// 				if (err) {
// 					console.error(err);
// 				} else {
// 					res.send('yay');
// 				}
// 			});
// 		}
// 	});
// });

app.get('/search', getAllUsers);

app.get('/landing', function(request, response) {
	response.render('landing');
});

app.get('/', function(req, res, next) {
	var username = req.session.username;
	if (username) {
		res.redirect('/chats');
	} else {
		res.render('landing');
	}
});

// signup
app.post('/signup', saveUser);

// login
app.post('/login', loginUser);

// load user profile
app.post('/load-profile', loadProfile);

// load chat
app.post('/load-chat', loadChat);


function getAllUsers(req, res, next) {
	var query = 'SELECT username, birthdate, gender FROM users';
	conn.query(query, function(err, data) {
		if (err) {
			res.send("error");
			console.error(err);
		} else if (data.rows) {
			getUserLangInfo(req, res, next, getUserAges(data.rows));
		} else {
			console.log("uhh");
			res.send("failure");
		}
	});
}

function getUserAges(userData) {
	var today = Date.now();
	userData.forEach(function(user, index, array) {
		user.age = getAge(user.birthdate);
		delete user.birthdate;
	});
	return userData;
}

function getAge(bday) {
	var birthdate = new Date(bday).getTime();
	var ageDifMs = Date.now(); - birthdate;
	var ageDate = new Date(ageDifMs);
	return ageDate.getUTCFullYear() - 1970;
}

function getUserLangInfo(req, res, next, userData) {
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
					var data = { "results" : array };
					res.render('search', data);
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
			} 
		});
		conn.query(query, [username, learning, learning_proficiency, 0], function(err, data) {
			if (err) {
				console.error(err);
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

function loadProfile(req, res, next) {
	var username = req.body.username;

	// request the user's information

	// built user object with the returned info

	// reload the whole damn page w the new info i guess
	res.send("success");
}

function loadChat(req, res, next) {
	var username = req.body.username;

	// request the user's information

	// built user object with the returned info

	// reload the whole damn page w the new info i guess
	res.send("success");
}


// will need this function?
function saveMessage(chat, username, message, time) {
	// below is old code for realtime
	conn.query('INSERT INTO messages (room, nickname, body, time) VALUES($1, $2, $3, $4)', [roomName, nickname, message, time], function(error, data) {
		if (error) {
			console.error('ERROR: could not add message to table');
		}
	});
}

// discarded. moved to sockets
// function joinChatrooms(username, rooms){
// 	for(var i = 0; i < rooms.length; i++) {
//     var room = rooms[i];
//     socket.join(room, () => {
//     let alljoinedrooms = Object.keys(socket.rooms);
//     console.log(alljoinedrooms);
//   	});

//     console.log(room.id);
// }
// }

//server join
function joinChatroom(socket, roomdata, callback) {

    if (!roomdata.chat_id) {
        console.log('err id');
        return false;
    }
    
    if (!roomdata.user1) {
        console.log('err user1');
        return false;
    }

    if (!roomdata.user2) {
        console.log('err user2');
        return false;
    }
    
    socket.join(roomdata.roomname);
    socket.chat_id = roomdata.chat_id;
    socket.user1 = roomdata.user1;
    socket.user2 = roomdata.user2;
    //callback response...

}

//client emit. not sure where to put this function yet.
function joinChatroom1(roomname, nickname) {
    var data = {roomname: roomname, username: nickname};
    socket.emit('join', data, function(response) {
        console.log(response);
        if (response.status === 200) {

        }
    });
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

console.log(100);
io.sockets.on('connection', function(socket) {
	console.log(111);
	socket.on('join', function(roomName, nickname, callback) {
		//socket.join(roomName);
		socket.nickname = nickname;
		socket.roomName = roomName;
		conn.query('SELECT * FROM chats WHERE user1=$1 OR user2=$1', [nickname], function(error, data) {
			if (error) {
				console.error(error);
			} else {
				for(var i = 0; i < rooms.length; i++) {
    				var room = rooms[i];
    				socket.join(room, () => {
    					let alljoinedrooms = Object.keys(socket.rooms);
    					console.log(alljoinedrooms);
  					});
    				joinChatroom(socket, room, callback);
    				console.log(room.id);
				}
			}
		});

		conn.query('SELECT * from messages WHERE (sender=$1 OR receiver=$1) AND time<>$2', [roomName, 0], function(error, data) {
	    	var messages = data.rows;
	    	if (error) {
	    		console.error(error);
	    	}
			callback(messages);
	    });
	});

	socket.on('message', function(val) {
		var roomName = socket.roomName;
		var nickname = val.nickname;
		var message = val.body;
		var time = val.time;
		saveMessage(roomName, nickname, message, time);
		console.log(val.body);
		io.sockets.in(roomName).emit('message', [val]);
	});


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
