'use strict';

var dns = require('native-dns'),
	async = require('async'),
	server = dns.createServer(),
	authority = {
		address: '8.8.8.8',
		port: 53,
		type: 'udp'
	};
var entries = [
  	{
		domain: "([\\w\\d\\-]+)\\\.ntmobiledev\\\.local",
    	records: [
      		{ type: "A", address: "127.0.0.1", ttl: 1800 }
    	]
  	}
];

module.exports = server;

server.on('listening', function() {
	console.log('server listening on', server.address())
});
server.on('close', function() {
	console.log('server closed', server.address())
});
server.on('error', function(err, buff, req, res) {
	console.error(err.stack)
});
server.on('socketError', function(err, socket) {
	console.error(err)
});

server.serve(53);

function proxy(question, response, cb) {
  console.log('proxying', question.name);

  var request = dns.Request({
    question: question, // forwarding the question
    server: authority,  // this is the DNS server we are asking
    timeout: 1000
  });

  // when we get answers, append them to the response
  request.on('message', (err, msg) => {
    msg.answer.forEach(a => response.answer.push(a));
  });

  request.on('end', cb);
  request.send();
}

function handleRequest(request, response) {
	console.log('request from', request.address.address, 'for', request.question[0].name);

    var f = [];

    request.question.forEach(function(question) {
      var entry = entries.filter(function(r) {
		  return new RegExp(r.domain, 'i').exec(question.name)
	  });
      if (entry.length) {
        entry[0].records.forEach(function(record) {
          record.name = question.name;
          record.ttl = record.ttl || 1800;
          response.answer.push(dns[record.type](record));
        });
      } else {
        f.push(cb => proxy(question, response, cb));
      }
    });

    async.parallel(f, function() { response.send(); });
}

server.on('request', handleRequest);
