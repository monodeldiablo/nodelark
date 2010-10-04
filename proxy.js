var sys = require('sys');
var fs = require('fs');
var http = require('http');

function Filter (name, url_match, contents_match, replace_string) {
	this.name = name;
	this.url_match = new RegExp(url_match);
	this.contents_match = new RegExp(contents_match, "gm");
	this.replace_string = replace_string;

	this.url_match.compile(this.url_match);
	this.contents_match.compile(this.contents_match);

	this.process = function(url, body) {
		if (this.url_match.test(url)) {
			console.log("running filter '" + this.name + "' on " + url);
			body = body.replace(this.contents_match, replace_string);
		}
		return body;
	};
}

// FIXME: Add a filesystem watch to automatically reload a given filter if it
//        is changed.
function FilterChain () {
}

var filter_chain = new Array();
//var filter_chain = new FilterChain();

function build_filter_chain () {
	filter_chain = new Array();

	fs.readdir('filters', function (err, files) {
		for (i in files) {
			fs.readFile('filters/' + files[i], function (err, data) {
				try {
					var obj = JSON.parse(data);
					var filter = new Filter(obj.name, obj.url, obj.capture, obj.replace);

					filter_chain.push(filter);
					console.log('Loaded filter "' + obj.name + '"');
					//filter_chain[file] = filter;
				}
				catch (err) {
					console.log(err);
				}
			});
		}
	});
}

http.createServer(function (req, res) {
	try {
		console.log('  got a request for ' + req.url);
	        var client = http.createClient(80, req.headers['host']);
		var headers = req.headers;
		headers['accept-encoding'] = '';
	        var request = client.request(req.method, req.url, headers);
	        request.end();

	        request.on('response', function (response) {
			var body = '';
			var type = response.headers['content-type'];

	                response.on('data', function (chunk) {
				if (/text/.test(type)) {
					body += chunk;
				}

				else {
					res.write(chunk);
				}
	                });

			response.on('end', function () {
				if (/text/.test(type)) {
					for (i in filter_chain) {
						body = filter_chain[i].process(req.url, body);
					}
				}

				res.end(body);
			});

			res.writeHead(response.statusCode, response.headers);
		});
	}
	catch (err) {
		console.log(err);
	}
}).listen(58008);
build_filter_chain ();
console.log('Server running at http://127.0.0.1:58008');
