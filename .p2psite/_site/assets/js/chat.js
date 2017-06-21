navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

navigator.getUserMedia({
        audio: true,
        video: true
    },
    function(stream) {
        // Set your video displays
        $('#video-internal').prop('src', URL.createObjectURL(stream));
        window.localStream = stream;
    },
    function() {
        console.log("Erro ao acessar video");
    });

// var peerNode = new Date().valueOf();
var peerNode = Math.floor((Math.random() * 100) + 1);;

var peer = new Peer(peerNode, {
    host: 'peerjsserver222.herokuapp.com',
    port: 443,
    secure: true,
    config: {
        'iceServers': [{
            url: 'stun:stun01.sipphone.com'
        }, {
            url: 'stun:stun.ekiga.net'
        }, {
            url: 'stun:stunserver.org'
        }, {
            url: 'stun:stun.softjoys.com'
        }, {
            url: 'stun:stun.voiparound.com'
        }, {
            url: 'stun:stun.voipbuster.com'
        }, {
            url: 'stun:stun.voipstunt.com'
        }, {
            url: 'stun:stun.voxgratia.org'
        }, {
            url: 'stun:stun.xten.com'
        }, {
            url: 'turn:192.158.29.39:3478?transport=udp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808'
        }, {
            url: 'turn:192.158.29.39:3478?transport=tcp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808'
        }]
    },
    debug: 3
});

/* Ao conectar com o servidor */
peer.on('open', function() {
    console.log("Conectado como " + peer.id);
});

//##Quando receber uma chamda
peer.on('call', function(call) {
    // Answer the call automatically (instead of prompting user) for demo purposes
    call.answer(window.localStream);

    call.on('stream', function(stream) {
        $('#video-external').prop('src', URL.createObjectURL(stream));
    });
});

$('#make-call').on('click', function() {

    var peer_number = $('#ipt-call-to').val();

    var call = peer.call(peer_number, window.localStream);

    if (window.existingCall) {
        window.existingCall.close();
    }

    call.on('stream', function(stream) {
        $('#video-external').prop('src', URL.createObjectURL(stream));
    });

    window.existingCall = call;

    var conn = peer.connect(peer_number);

    conn.on('open', function() {
        // Receive messages
        conn.on('data', function(data) {
            console.log('Received', data);
        });

        console.log("")
            // Send messages
        conn.send('Hello!');

        $('#send-msg').on('click', function() {
            // Send messages
            conn.send('Hello! 1');
        });

    });

});

peer.on('connection', function(conn) {

    console.log("ok1");
    console.log(conn);
    console.log("ok2");

    conn.on('data', function(data) {
        console.log('Received', data);
    });

    $('#send-msg').on('click', function() {
        // Send messages
        conn.send('Hello! 2');
    });
});