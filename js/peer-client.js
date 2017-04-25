// (function() {
    'use strict';

    console.log("Peer client started");

    var PEER_SERVER = 'my-peer.herokuapp.com';
    var PORT = 443;
    var connectedPeers = {};

    // Compatibility shim
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    // Connect to server
    var peer = new Peer(generateRandomID(), { host: PEER_SERVER, port: PORT, path: '/', secure: true });
    // var peer = new Peer({ host: 'my-peer.herokuapp.com', port: '443', path: '/', secure: true });
    console.log(peer)

    peerCallbacks(peer);
    // initializeLocalVideo();

    // Generate random ID
    function generateRandomID() {
        // return Math.random().toString(36).substring(2);
        return Math.random().toString(36).substring(8);
    }

    // Data channel
    // Handle a connection object.
    function connect(c) {
    	console.log(c)
        // Handle a chat connection.
        if (c.label === 'chat') {
        	// c.peer
        	// TODO Create chat box
        	myapp.createChatWindow(c.peer)

            c.on('data', function(data) {
                console.log(c.peer + ' : ' + data);
                // Append data to chat history
            	myapp.appendHistory(c.peer, data)   
            });

            c.on('close', function() {
                delete connectedPeers[c.peer];
                myapp.closeChatWindow(c.peer)
            });
        } else if (c.label === 'file') {
            c.on('data', function(data) {
                // If we're getting a file, create a URL for it.
                if (data.constructor === ArrayBuffer) {
                    var dataView = new Uint8Array(data);
                    var dataBlob = new Blob([dataView]);
                    var url = window.URL.createObjectURL(dataBlob);
                    // $('#' + c.peer).find('.messages').append('<div><span class="file">' +
                    //     c.peer + ' has sent you a <a target="_blank" href="' + url + '">file</a>.</span></div>');
                }
            });
        }
        connectedPeers[c.peer] = 1;
    }

    function callConnect(call) {
    	
        // Hang up on an existing call if present
	    if (window.existingCall) {
	        window.existingCall.close();
	    }

	    // Wait for stream on the call, then set peer video display
	    call.on('stream', function(stream) {
	        myapp.setTheirVideo(stream)
	    });

	    // UI stuff
	    window.existingCall = call;
	    call.on('close', function() {
	    	myapp.closeVideoCall()
	    });
    }

    function peerCallbacks(peer) {
        peer.on('open', function(id) {
            console.log('My peer ID is: ' + id);
            myapp.setPeerId(id);
        });

        peer.on('connection', connect);

        peer.on('call', function(call) {
            // New call requests from users
            // TODO - Confirm before accepting call
            call.answer(window.localStream);

            callConnect(call)
        });

        peer.on('close', function(conn) {
            // New connection requests from users
            console.log("Peer connection closed");
        });

        peer.on('disconnected', function(conn) {
        	console.log("Peer connection disconnected");
        	// peer.reconnect()
        });

        peer.on('error', function(err) {
            console.log("Peer connection error:")
            console.log(err)
        });
    };

    function connectToId(id) {
    	if(!id || peer.disconnected)
    		return;
    	var requestedPeer = id;
        if (!connectedPeers[requestedPeer]) {
            // Create 2 connections, one labelled chat and another labelled file.
            var c = peer.connect(requestedPeer, {
                label: 'chat',
                serialization: 'none',
                metadata: { message: 'hi i want to chat with you!' }
            });
            c.on('open', function() {
                connect(c);
            });
            c.on('error', function(err) { alert(err); });

            // File Sharing
            var f = peer.connect(requestedPeer, { label: 'file', reliable: true });
            f.on('open', function() {
                connect(f);
            });
            f.on('error', function(err) { alert(err); });
        }
        connectedPeers[requestedPeer] = 1;
    }

    function sendMessage(peerId, msgText) {
    	var conns = peer.connections[peerId];
        for (var i = 0, ii = conns.length; i < ii; i += 1) {
            var conn = conns[i];
            if(conn.peer == peerId) {
            	conn.send(msgText)
            	break;
            }
        }
    }

    function initializeLocalVideo() {
		// Get audio/video stream
		navigator.getUserMedia({audio: true, video: true}, function(stream) {
			// Set your video displays
			window.localStream = stream;
		}, function(err) {
			console.log("The following error occurred: " + err.name);
		});
    }

    function makeCall(callerID) {
    	console.log("Calling..." +  callerID)
    	if(!window.localStream) {
    		console.log("Video permission not granted")
    	}
    	var call = peer.call(callerID, window.localStream);
    	callConnect(call)
    }

    function endCall() {
    	if(window.existingCall)
    		window.existingCall.close();
    }

    function closeConnection(id) {
		var conns = peer.connections[peerId];
        for (var i = 0, ii = conns.length; i < ii; i += 1) {
            var conn = conns[i];
            if(conn.peer == id) {
            	conn.close();
            	break;
            }
        }
    }


    // Make sure things clean up properly.
    window.onunload = window.onbeforeunload = function(e) {
        if (!!peer && !peer.destroyed) {
            peer.destroy();
        }
    };
// })();
