var express = require('express');
var app = express();
var http = require('https').Server(app);
var io = require('socket.io')(8080);

var ExpressPeerServer = require('peer').ExpressPeerServer;
var cookieParser = require('cookie-parser')
var md5 = require('md5');

app.use(cookieParser())
app.use('/cdn', express.static('public'));

var Twig = require("twig"),
    express = require('express'),
    app = express();

var mysql = require('mysql');

var connection = mysql.createConnection({
    host: '0.0.0.0',
    user: 'evandrozanatta',
    password: '',
    database: 'p2pchat'
});

function parseCookies(request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function(cookie) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

app.get('/', function(req, res) {

    var cookies = parseCookies(req);
    // console.log("cookies", cookies);
    // res.cookie('cookie_name' , 'cookie_value')

    res.render('index.twig', {
        message: "Hello World"
    });
});

app.get('/login/', function(req, res) {
    var varFB = {};
    varFB.token = req.query.token;
    varFB.id = req.query.user;
    varFB.p2pid_user = '';

    function createSession() {

        var token = md5(varFB.id + Math.floor((Math.random() * 100) + 1));

        connection.query("INSERT INTO `sessions` (`id`, `id_user`, `token`) VALUES (NULL, '" + varFB.p2pid_user + "', '" + token + "');", function(err, rows, fields) {
            if (err) throw err;
        });

        res.cookie('p2p_token', token);
        res.redirect(302, '/chats/');
    }

    function updateUser() {

        connection.query("UPDATE `users` SET  `name` =  '" + varFB.name + "', `email` =  '" + varFB.email + "' WHERE `id_facebook` = " + varFB.id + ";", function(err, rows, fields) {
            if (err) throw err;
            createSession();
        });


    }

    function insertUser() {

        connection.query("INSERT INTO `users` (`id`, `name`, `email`, `image`, `id_facebook`) VALUES (NULL, '" + varFB.name + "', '" + varFB.email + "', '', '" + varFB.id + "');", function(err, rows, fields) {
            if (err) throw err;
            varFB.p2pid_user = rows.insertId;
            createSession();
        });

    }

    function makeLogin() {

        connection.query("SELECT id, COUNT( id ) as has_user FROM  `users` WHERE  `id_facebook` =  '" + varFB.id + "';", function(err, rows, fields) {
            if (err) throw err;

            if (rows[0].has_user > 0) {
                varFB.p2pid_user = rows[0].id;
                updateUser();
            }
            else {
                insertUser();
            }

        });
    }

    var options = {
        "method": "GET",
        "hostname": "graph.facebook.com",
        "port": null,
        "path": "/v2.8/" + varFB.id + "?access_token=" + varFB.token + "&callback=&fields=email,name",
        "headers": {
            "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
        }
    };

    var http_ajax = require('https')


    var req2 = http_ajax.request(options, function(res) {
        var chunks = [];

        res.on("data", function(chunk) {
            chunks.push(chunk);
        });

        res.on("end", function() {
            var body = Buffer.concat(chunks);
            var response = JSON.parse(body.toString());
            varFB.id = response.id;
            varFB.name = response.name;
            varFB.email = response.email;
            makeLogin();
        });
    });

    req2.end();
});

app.use(cookieParser());

app.get('/chats/', function(req, res) {

    var users, user_logged_id = [];

    var user_token = req.cookies['p2p_token'];

    console.log(user_token);

    function showView() {

        res.render('chats.twig', {
            users: users,
            user_logged: user_logged_id
        });
    }

    function loadUserLogged() {
        connection.query("SELECT usr.id AS id, usr.name AS name FROM `users` as usr INNER JOIN `sessions` as ses ON usr.id = ses.id_user WHERE ses.token= '" + user_token + "';", function(err, rows, fields) {
            if (err) throw err;

            user_logged_id['id'] = rows[0]['id'];
            user_logged_id['name'] = rows[0]['name'];

            showView();
        });
    }


    loadUserLogged();

});

app.use(cookieParser());

app.get('/chat/', function(req, res) {

    var user_id;

    function showView() {
        res.render('chat.twig', {
            user_id: user_id
        });
    }

    connection.query("SELECT id_user FROM `sessions` WHERE `token` = '" + req.cookies['p2p_token'] + "';", function(err, rows, fields) {
        if (err) throw err;
        user_id = rows[0].id_user;
        showView();
    });
});
/* io's socket.io */

function showDataUser() {
    connection.query("SELECT id, user_id, user_name FROM `online`;", function(err, rows, fields) {
        if (err) throw err;
        console.log(rows);
    });
}

io.on('connection', function(socket) {

    // console.log('a user connected');

    var user_connected;
    
    function refreshListUsers(){
        connection.query("SELECT user_id, user_name FROM `online`;", function(err, rows, fields) {
            if (err) throw err;
            io.emit('loaded users', rows);
        });
    }

    socket.on('chat message', function(msg) {

        connection.query("INSERT IGNORE INTO `online` (`id`, `user_id`, `user_name`) VALUES (NULL, '" + msg['id'] + "', '" + msg['name'] + "');", function(err, rows, fields) {
            if (err) throw err;
            user_connected = msg['id'];
            
            refreshListUsers();
            showDataUser();
        });
        

    });

    socket.on('disconnect', function() {
        connection.query("DELETE FROM `online` WHERE `user_id` = '" + user_connected + "';", function(err, rows, fields) {
            if (err) throw err;
            
            refreshListUsers();
            showDataUser();
        });
    });

});

/* webserver config */

var server = app.listen(8081);

var options = {
    debug: true
}

/* peerserver configs */

app.use('/api', ExpressPeerServer(server, options));

// OR

var server = require('http').createServer(app);

app.use('/peerjs', ExpressPeerServer(server, options));

server.listen(9000);