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

// const url = require('url');  
// const querystring = require('querystring');

var conn = anyDB.createConnection('sqlite3://langland.db');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(session({
	secret: 'langland-secret-token',
	cookie: {
		maxAge: 3600000 // in milliseconds
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
        	bar += '<span>' + lang.language + ':</span>';
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
			var c = 'class="message ';
			if (message.sender == me) {
				c += 'my_message"';
			} else {
				c += 'your_message"';
			}
			var first_li = '<li ' + c + '>'

			var msg_txt = ""
			if (message.correction != "") {
				var original_msg = '<span class="original_msg">' + message.body + '</span>';
				var corrected_msg = '<span class="corrected_msg">' + message.correction + '</span>';
				msg_txt = original_msg + corrected_msg;
			} else {
				msg_txt = message.body;
			}

			var msg_content = '<div class="message_content" id="message_' + message.message_id + '">' + msg_txt + '</div>';

			if (message.sender == me) {
				return new handlebars.SafeString(first_li + msg_content + '</li>');
			} else {
				var img = '<img src="/placeholder.png" alt="' + message.sender + '" class="avatar">';
			 	var edit_button = '<button class="edit_button" id="' + message.message_id + '"> \
			 	<img src="/edit_icon.png" width="17" height="17" alt="edit message"> \
			 	</button>';
			 	if (message.correction != "") {
			 		return new handlebars.SafeString(first_li + img + msg_content + '</li>');
			 	} else {
			 		return new handlebars.SafeString(first_li + img + msg_content + edit_button + '</li>');
			 	}
			}
		}
    }
});

handlebars.registerHelper("equal", require("handlebars-helper-equal"));

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/image_resources'));

// create tables
conn.query('CREATE TABLE IF NOT EXISTS messages ( \
	message_id INTEGER PRIMARY KEY AUTOINCREMENT, \
	sender TEXT, \
	receiver TEXT, \
	body TEXT, \
	time INTEGER, \
	correction TEXT, \
	translation TEXT, \
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
	if (me) {
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
	} else {
		res.redirect('/');
	}
});

app.get('/friends/:user', function(req, res, next) {
	var me = req.session.username;
	if (me) {
		var friend = req.params.user;
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
	} else {
		res.redirect('/');
	}
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
	if (me) {
		var query = 'SELECT chats.user1, chats.user2, messages.body, messages.time \
					 FROM chats \
					 LEFT JOIN messages \
					 ON chats.newest_msg = messages.message_id \
					 WHERE (chats.newest_msg<>$1) \
					 AND (chats.user1=$2 OR chats.user2=$2) \
					 ORDER BY messages.time DESC';
		conn.query(query, [-1, me], function(err, data) {
			if (err) {
				console.error(err);
			} else {
				var render_data = {
					"myUsername": me,
					"chats": getChatTimes(getChats(me, data.rows))
				};
				// console.log(data.rows);
				res.render('chats', render_data);
			}
		});
	} else {
		res.redirect('/');
	}
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
	if (me) {
		var them = req.params.user;
		var query = 'SELECT chats.chat_id, chats.user1, chats.user2, messages.body, messages.time \
					 FROM chats \
					 LEFT JOIN messages \
					 ON chats.newest_msg = messages.message_id \
					 WHERE (chats.newest_msg<>$1) \
					 AND (chats.user1=$2 OR chats.user2=$2) \
					 ORDER BY messages.time DESC';
		conn.query(query, [-1, me], function(err, data) {
			if (err) {
				console.error(err);
			} else {
				var render_data = {
					"myUsername": me,
					"theirUsername": them,
					"chats": getChatTimes(getChats(me, data.rows))
				};
				console.log(data.rows);
				getChat(req, res, next, me, them, data.rows, render_data);
			}
		});
	} else {
		res.redirect('/');
	}
});

function getChat(req, res, next, user1, user2, data, render_data) {
    var query = 'SELECT chat_id FROM chats WHERE (user1=$1 AND user2=$2) OR (user1=$2 AND user2=$1)';
    conn.query(query, [user1, user2], function(err, data) {
    	if (err) {
    		console.error(err);
    	} else {
    		if (data.length === 0) {
    			addChat(req, res, next, user1, user2, render_data);
    		} else {
    			render_data.chat_id = data.rows[0].chat_id;
				getMessages(req, res, next, user1, user2, render_data);
    		}
    	}
    });
}

function getChatTimes(chats) {
	chats.forEach(function(chat, index, array) {
		var time = new Date(chat.time);
		var timestamp = time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
		chat.timestamp = timestamp;
	});
	return chats;
}

function addChat(req, res, next, user1, user2, render_data) {
	var query = 'INSERT INTO chats (user1, user2, newest_msg) VALUES($1, $2, $3)';
	conn.query(query, [user1, user2, -1], function(err, data) { 
		if (err) {
			console.log(err);
		} else {
			query = 'SELECT chat_id FROM chats WHERE user1=$1 AND user2=$2';
			conn.query(query, [user1, user2], function(err, data) {
				if (err) {
					console.error(err);
				} else {
					render_data.chat_id = data.rows[0].chat_id;
					render_data.chats.push({username: user2});
					render_data.messages = [];
					res.render('chats', render_data);
				}
			});
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

app.get('/search', getAllUsers);

app.get('/s/', async function(req, res, next) {
	console.log("seaaaaaaaaaaaaaaaaaarch");

    let username = req.query.prefix + '%';
    let min_age = req.query.min_age;
    var max_age = req.query.max_age;
    var native_lang = req.query.native_lang;
	var query = 'SELECT username, birthdate, gender FROM users WHERE username LIKE $1';

	var list = [username];

	if (native_lang==="Chinese"||native_lang==="English"){
		console.log("native not null");
		query = 'SELECT users.username, birthdate, gender FROM users INNER JOIN languages ON users.username=languages.username WHERE users.username LIKE $1 AND languages.native=1 AND languages.language=$2';
		list=[username, native_lang];
	}

	conn.query(query, list, function(err, data) {
		if (err) {
			res.send("error");
			console.error(err);
		} else if (data.rows) {
			console.log(data.rows);
			getUserLangInfo(req, res, next, getUserAges(data.rows));
		} else {
			console.log("uhh");
			res.send("failure");
		}
	});
});

app.get('/', function(req, res, next) {
	var username = req.session.username;
	if (username) {
		res.redirect('/chats');
	} else {
		res.render('landing');
	}
});

app.get('*', function(req, res, next) {
	res.redirect('/');
});

// signup
app.post('/signup', saveUser);

// login
app.post('/login', loginUser);

app.post('/logout', logoutUser);

app.post('/search/result', getSelectedUsers);



// save message
// app.post('/chats/save', saveMessage);

// edit message
// app.post('/chats/edit', editMessage);

// correct message
// app.post('/chats/correct', correctMessage);

// translate message
// app.post('/chats/trans', transMessage);


function getAllUsers(req, res, next) {
	if (req.session.username) {
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
	} else {
		res.redirect('/');
	}
}


function getSelectedUsers(req, res, next) {
	console.log("guess where i am")
	var query = 'SELECT username, birthdate, gender FROM users WHERE username LIKE $1';
	var username = req.body.username+'%';
	console.log(username);
	var min_age = req.body.min_age;
	var max_age = req.body.max_age;
	var native_lang = req.body.native_lang;


	var list = [username];

	if (native_lang==="Chinese"||native_lang==="English"){
		console.log("native not null");
		query = 'SELECT users.username, birthdate, gender FROM users INNER JOIN languages ON users.username=languages.username WHERE users.username LIKE $1 AND languages.native=1 AND languages.language=$2';
		list=[username, native_lang];
	}

	conn.query(query, list, function(err, data) {
		if (err) {
			res.send("error");
			console.error(err);
		} else if (data.rows) {
			// var req=this.req;
			// var res=this.res;
			// var next=this.next;
			console.log(data.rows);
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
	var ageDifMs = Date.now() - birthdate;
	var ageDate = new Date(ageDifMs);
	var age = ageDate.getUTCFullYear() - 1970;
	return age;
}

function getUserLangInfo(req, res, next, userData) {
	if (userData.length == 0){
		var render_data = { 'results' : userData };
		res.render('search', render_data);
	} else {
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
		} else if (data.rows.length === 0) {
			console.log("uhh");
			res.send("login failed");
		} else {
			var sessData = req.session;
			sessData.username = username;
			res.send("success");
		}
	});
}

function logoutUser(req, res, next) {
	req.session.destroy(function(err) {
		if (err) {
			res.send("error");
			console.error(err);
		} else {
			res.send("success");
		}
	});
}

// function saveMessage(req, res, next) {
// 	console.log("saving");
// 	var message_body = req.body.message;
// 	var time = req.body.time;
// 	var sender = req.body.sender;
// 	var receiver = req.body.receiver;

// 	conn.query('INSERT INTO messages (sender, receiver, body, time, correction, translation) VALUES($1, $2, $3, $4, $5, $6)', [sender, receiver, message_body, time, "", ""], function(error, data) {
// 		if (error) {
// 			console.error('ERROR: could not add message to table');
// 		}
// 		console.log(345);
// 		console.log(message_body);
// 		console.log(sender);
// 	});
// }


function editMessage(val) {
	console.log("edit saving");
	var correction = val.message;
	var time = val.time;
	var sender = val.sender;
	var receiver = val.receiver;
	var id = val.m_id;

	conn.query('SELECT body FROM messages WHERE message_id=$1', [id], function(err, data) {
		if (err) {
			res.send("error");
			console.error(err);
		} else if (data.rows.length === 0) {
			console.log("cannot find this message");
			res.send("looking for original message failed");
		} else {
			editMessage1(val, data.rows[0].body);
		}
		//console.log(data);
	});
}

function editMessage1(val, orig_msg) {
	console.log("cai");
	var correction = val.message;
	var time = val.time;
	var sender = val.sender;
	var receiver = val.receiver;
	var id = val.m_id;
	//res.json(data.rows);
	console.log(orig_msg);
	console.log(correction);

	var q = 'INSERT INTO messages (sender, receiver, body, time, correction, translation) VALUES($1, $2, $3, $4, $5, $6)';
	conn.query(q, [sender, receiver, orig_msg, time, correction, ""], function(error, data) {
		if (error) {
			console.error('ERROR: could not add edited message to table');
		} else {
			val.correction = val.message;
			delete val.message;
			val.orig_msg = orig_msg;
			sendCorrection(val);
		}
	});
	// conn.query('UPDATE messages SET correction=$1 WHERE message_id=$2', [message_body, id], function(error, data) {
	// 	console.log(id);
	// 	console.log(message_body);
	// 	if (error) {
	// 		console.error('ERROR: could not add corrected message to table');
	// 	}

	// });
}

function saveMessage(val) {
	var message_body = val.message;
	var time = val.time;
	var sender = val.sender;
	var receiver = val.receiver;
	var m_id;
	var query = 'INSERT INTO messages (sender, receiver, body, time, correction, translation) VALUES($1, $2, $3, $4, $5, $6)';

	conn.query(query, [sender, receiver, message_body, time, "", ""], function(error, data) {
		if (error) {
			console.error('ERROR: could not add message to table');
		} else {
			query = 'SELECT message_id FROM messages WHERE body=$1';
			conn.query(query, [message_body], function(err, data) {
				if (err) {
					console.error('ERROR: counot find message ID ' + err);
				} else {
					m_id = data.rows[0].message_id;
					query = 'UPDATE chats SET newest_msg=$1 WHERE (user1=$2 AND user2=$3) OR (user1=$3 AND user2=$2)';
					conn.query(query, [m_id, sender, receiver], function(err, data) {
						if (err) {
							console.error('ERROR: could not update ' + err);
						}
					});
				}
			});
		}
	});
}

function sendMessage(val) {
	var query = 'SELECT chat_id FROM chats WHERE (user1=$1 AND user2=$2) OR (user1=$2 AND user2=$1)';
	conn.query(query, [val.sender, val.receiver], function(err, data) {
		if (err) {
			console.error(err);
		} else {
			var chat_id = data.rows[0].chat_id;
			query = 'SELECT message_id FROM messages WHERE body=$1';
			conn.query(query, [val.message], function(err, data) {
				if (err) {
					console.error(err);
				} else {
					val.m_id = data.rows[0].message_id;
					io.sockets.in("room" + chat_id).emit('message', val);
				}
			});
		}
	})
}

function sendCorrection(val) {
	console.log("sending correction");
	var query = 'SELECT chat_id FROM chats WHERE (user1=$1 AND user2=$2) OR (user1=$2 AND user2=$1)';
	conn.query(query, [val.sender, val.receiver], function(err, data) {
		if (err) {
			console.error(err);
		} else {
			var chat_id = data.rows[0].chat_id;
			query = 'SELECT message_id FROM messages WHERE correction=$1';
			conn.query(query, [val.correction], function(err, data) {
				if (err) {
					console.error(err);
				} else {
					val.m_id = data.rows[0].message_id;
					io.sockets.in("room" + chat_id).emit('correction', val);
				}
			});
		}
	});
}

// function correctMessage(req, res, next) {
// 	console.log("correct saving");
// 	var message_body = req.body.message;
// 	var id = req.body.id;
// 	var sender = req.body.sender;
// 	var receiver = req.body.receiver;

// 	conn.query('UPDATE messages SET correction=$1 WHERE message_id=$2', [message_body, id], function(error, data) {
// 		if (error) {
// 			console.error('ERROR: could not add corrected message to table');
// 		}

// 	});
// }

// function transMessage(req, res, next) {
// 	console.log("trans saving");
// 	var message_body = req.body.message;
// 	var id = req.body.id;
// 	var sender = req.body.sender;
// 	var receiver = req.body.receiver;

// 	conn.query('UPDATE messages SET translation=$1 WHERE message_id=$2', [message_body, id], function(error, data) {
// 		if (error) {
// 			console.error('ERROR: could not add translated message to table');
// 		}

// 	});
// }

console.log(100);
io.sockets.on('connection', function(socket) {
	socket.on('join', function(nickname, callback) {
		//socket.join(roomName);
		socket.nickname = nickname;
		conn.query('SELECT * FROM chats WHERE user1=$1 OR user2=$1', [nickname], function(error, data) {
			if (error) {
				console.error(error);
			} else {
				var rooms = data.rows;
				for(var i = 0; i < rooms.length; i++) {
    				var room = rooms[i];
    				socket.join("room" + room.chat_id);
				}
				callback("joined " + rooms.length + " rooms");
			}
		});
	});

	socket.on('message', function(val) {
		saveMessage(val);
		console.log("sending message");
		sendMessage(val);
	});
	socket.on('correction', function(val, callback) {
		editMessage(val); 	// takes care of sending it too
	});
	// socket.on('search_users', function(val) {
	// 	console.log("searching user");
	// 	getSelectedUsers(val);
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
