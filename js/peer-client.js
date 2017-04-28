peerapp = (function() {
    'use strict';

    console.log("Peer client started");

    var PEER_SERVER = 'my-peer.herokuapp.com';
    var PORT = 443;
    var connectedPeers = {};
    var myPeerID = generateRandomID(4);
    var peer;

    // Compatibility shim
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    // Connect to server
    function connectToServer() {
        peer = new Peer(myPeerID, { host: PEER_SERVER, port: PORT, path: '/', secure: true });  
        peerCallbacks(peer);
    }    
    // var peer = new Peer({ host: 'my-peer.herokuapp.com', port: '443', path: '/', secure: true });
    connectToServer();
    console.log(peer)

    initializeLocalMedia({'audio' : true});

    // Generate random ID
    function generateRandomID(length) {
        var chars = '123456789abcdefghijklmnopqrstuvwxyz'
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
        return result;
    }

    // Data channel
    // Handle a connection object.
    function connect(c) {
        console.log(c)
        // Handle a chat connection.
        if (c.label === 'chat') {
            // c.peer
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
            connectedPeers[c.peer] = c;
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
            console.log(new Date());
            myapp.setPeerId(id);
        });

        peer.on('connection', connect);

        peer.on('call', function(call) {
            console.log("Receiving a call")
            console.log(call)
            // New call requests from users
            // TODO - Ask Confirm before accepting call
            
            var metadata = call.options.metadata;
            console.log(metadata);

            initializeLocalMedia(metadata, function() {
                call.answer(window.localStream);
                myapp.showVideoCall(metadata);
                callConnect(call)
            });
        });

        peer.on('close', function(conn) {
            // New connection requests from users
            console.log("Peer connection closed");
        });

        peer.on('disconnected', function(conn) {
            console.log("Peer connection disconnected");
            console.log(new Date());
            setTimeout(function () {
                connectToServer();  
            }, 3000);
            
            // peer.reconnect()
        });

        peer.on('error', function(err) {
            console.log(new Date());
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
    }

    function sendMessage(peerId, msgText) {
        
        if(connectedPeers[peerId]) {
            var conn = connectedPeers[peerId]
            conn.send(msgText)
        }
    }

    function initializeLocalMedia(options, callback) {

        if(options) {
            options['audio'] = true;
            if(options['video'])
                options['video'] = true;
        } else {
            options['audio'] = true;
            options['video'] = false;
        }

        // Get audio/video stream
        navigator.getUserMedia(options, function(stream) {
            // Set your video displays
            window.localStream = stream;
            myapp.setMyVideo(stream)
            if(callback)
                callback();
        }, function(err) {
            console.log("The following error occurred: " + err.name);
            alert('Unable to call ' + err.name)
        });
    }

    function makeCall(callerID, isVideoCall) {
        console.log("Calling..." +  callerID)
        
        var options = {audio: true};
        if(isVideoCall)
            options['video'] = true;

        initializeLocalMedia(options, function() {
            myapp.showVideoCall(options)
            var call = peer.call(callerID, window.localStream, { 'metadata' : options });
            callConnect(call)
        });
    }

    function endCall() {
        if(window.existingCall)
            window.existingCall.close();
    }

    function closeConnection(id) {
        var conns = peer.connections[peerId];
        if(connectedPeers[peerId]) {
            var conn = connectedPeers[peerId]
            conn.send(msgText)
        }
    }


    // Make sure things clean up properly.
    window.onunload = window.onbeforeunload = function(e) {
        if (!!peer && !peer.destroyed) {
            peer.destroy();
        }
    };

    return {
        makeCall : makeCall,
        endCall : endCall,
        sendMessage : sendMessage,
        connectToId : connectToId
    }
})();
