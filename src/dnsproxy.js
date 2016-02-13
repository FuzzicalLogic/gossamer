'use strict';
module.exports = (function(DNS, ASYNC) {
	var ddnsserver = DNS.createServer(),
		authority = {
			address: '8.8.8.8',
			port: 53,
			type: 'udp'
		};

	var entries = [];

	ddnsserver.on('listening', function() {
		console.log('ddnsserver listening on', ddnsserver.address());
		console.log('starting http configuration');
	});
	ddnsserver.on('socketError', function(err, socket) {
		console.error(err);
	});
	ddnsserver.on('error', function(err, buff, req, res) {
		console.error(err.stack);
	});
	ddnsserver.on('request', handleRequest);
	ddnsserver.on('close', function() {
		console.log('ddnsserver closed', ddnsserver.address());
	});

	return {
		start: function(computer, ip) {
			entries.push({
				domain: '^ddns\\.' + computer + '\\.local$',
				records:[
					{ type: 'A', address: ip }
				]
			});
			console.log(entries[0].domain, entries[0].records);
			ddnsserver.serve(53, ip);
		},
		close: function() {
			ddnsserver.close();
		},
		entries: function() {
			return entries;
		}
	};

	function handleRequest(request, response) {
		console.log('request from', request.address.address, 'for', request.question[0].name);

	    var f = [];

	    request.question.forEach((question) => {
	    	var entry = entries.filter((r) => {
				return new RegExp(r.domain, 'i').exec(question.name)
			});
	    	if (entry.length) {
	        	entry[0].records.forEach((record) => {
	        		record.name = question.name;
	        		record.ttl = record.ttl || 1800;
	        		response.answer.push(DNS[record.type](record));
				});
	    	}
			else {
	        	f.push((cb) => {
					proxyRequest(question, response, cb);
				});
	    	}
	    });

	    ASYNC.parallel(f, function() { response.send(); });
	}

	function proxyRequest(question, response, cb) {
		var request = DNS.Request({
			question: question, // forwarding the question
	    	server: authority,  // this is the DNS server we are asking
	    	timeout: 1000
		});

	  // when we get answers, append them to the response
		request.on('message', (err, msg) => {
	    	msg.answer.forEach((a) => {
				response.answer.push(a);
			});
		});

		request.on('end', cb);
		request.send();
	}

}) (require('native-dns'), require('async'));
