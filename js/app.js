// UI Manager for the Chat app
function myjsapp() {
    var chatHistory = {};
    var chatPanel = {};

    function EventListeners() {
        $('#connect-btn').click(function (event) {
            var id = $('#inputPeerUserId').val().trim();
            if(id) {
                connectToId(id)
                $('#inputPeerUserId').val('')
            }
        });
    }

    EventListeners();

    return {
        setPeerId : function (id) {
            $('#peer-id').text(id);
        },

        createChatWindow: function(id) {
            var panel = $('<div class="panel panel-primary chat-div"><div class="panel-heading"></div>' +
                '<div class="panel-body"></div><div class="panel-footer">' +
                '<form class="form-inline"><div class="form-group">' +
                '</div></form></div></div>')

            var title = $('<span class="panel-title"></span>').text(id)
            var history = $('<ul class="chatHistory"></ul>').append('<li>You can now start chatting</li>')
            var message = $('<input type="text" class="form-control" placeholder="Enter Message">')
            var sendBtn = $('<button type="button" class="btn btn-outline-primary">Send</button>')

            chatHistory[id] = history
            chatPanel[id] = panel

            $('.panel-heading', panel).append(title)
            $('.panel-body', panel).append(history)
            $('.form-group', panel).append(message).append(sendBtn)

            $('.chat-container > div').append(panel);

            // TODO - Hide panels if more than 3
        },

        appendHistory : function (id, message) {
            if(chatHistory[id]) {
                var hist = chatHistory[id];
                var msg = $('<li></li>').append('<span>' + message + '</span')
                hist.append(msg)
            }
        },

        closeChatWindow : function (id) {
            if(chatPanel[id]) {
                chatPanel[id].remove()
                delete chatPanel[id]
                delete chatHistory[id]
            }
        }
    };
}

var myapp
$(document).ready(function () {
    myapp = myjsapp();
});
