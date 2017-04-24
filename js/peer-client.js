
console.log("Peer client started");

var peer = new Peer('someid', { host: 'my-peer.herokuapp.com', port: 80, path: '/' });
console.log(peer)

peer.on('open', function(id) {
  console.log('My peer ID is: ' + id);
});
