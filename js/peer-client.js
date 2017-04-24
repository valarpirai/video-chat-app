(function() {
    'use strict';
    
    console.log("Peer client started");

    var PEER_SERVER = 'my-peer.herokuapp.com';
    var PORT = 443;
    var connectedPeers = {};

    // Connect to server
    var peer = new Peer(generateRandomID(), { host: PEER_SERVER, port: PORT, path: '/', secure: true });
    console.log(peer)

    peerCallbacks(peer);

    // Generate random ID
    function generateRandomID() {
        return Math.random().toString(36).substring(2);
    }

    // Data channel
    // Handle a connection object.
    function connect(c) {
    	console.log(c)
        // Handle a chat connection.
        if (c.label === 'chat') {
        	// c.peer

            c.on('data', function(data) {
                console.log(c.peer + ' : ' + data);
            });

            c.on('close', function() {
                delete connectedPeers[c.peer];
            });
        } else if (c.label === 'file') {
            c.on('data', function(data) {
                // If we're getting a file, create a URL for it.
                if (data.constructor === ArrayBuffer) {
                    var dataView = new Uint8Array(data);
                    var dataBlob = new Blob([dataView]);
                    var url = window.URL.createObjectURL(dataBlob);
                    $('#' + c.peer).find('.messages').append('<div><span class="file">' +
                        c.peer + ' has sent you a <a target="_blank" href="' + url + '">file</a>.</span></div>');
                }
            });
        }
        connectedPeers[c.peer] = 1;
    }

    function call(peer_id) {
        var conn = peer.call(peer_id);
    }

    function peerCallbacks(peer) {
        peer.on('open', function(id) {
            console.log('My peer ID is: ' + id);
        });

        peer.on('connection', connect);

        peer.on('call', function(conn) {
            // New call requests from users
        });

        peer.on('close', function(conn) {
            // New connection requests from users
        });

        peer.on('disconnected', function(conn) {});

        peer.on('error', function(err) {
            console.log("Peer connection error:")
            console.log(err)
        });

    }

    // Make sure things clean up properly.

    window.onunload = window.onbeforeunload = function(e) {
        if (!!peer && !peer.destroyed) {
            peer.destroy();
        }
    };
})();
