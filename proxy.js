var http = require('http');
var sys = require('sys');
var fs = require('fs');

function Filter (name, url_match, contents_match, replace_string) {
	this.name = name;
	this.url_match = new RegExp(url_match);
	this.contents_match = new RegExp(contents_match);
	this.replace_string = replace_string;

	this.process = function(url, body) {
		if (url_match.test(url)) {
			body = body.replace(contents_match, replace_string);
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
				var obj = JSON.parse(data);
				var filter = new Filter(obj.name, obj.url, obj.capture, obj.replace);

				filter_chain.push(filter);
				console.log('Loaded filter "' + obj.name + '"');
				//filter_chain[file] = filter;
			});
		}
	});
}

http.createServer(function (req, res) {
	console.log('  got a request for ' + req.url);
        var client = http.createClient(80, req.headers['host']);
        var request = client.request(req.method, req.url, req.headers);
        request.end();

        request.on('response', function (response) {
	//	var body = '';
	//	console.log(response.headers);
	//	var type = response.headers['content-type'];
	//	console.log(type);

                response.on('data', function (chunk) {
	//		if (/text/.test(type)) {
	//			console.log("chunking text");
	//			body += chunk.toString('utf-8');
	//		}

	//		else {
	//			console.log("writing bits");
                        	res.write(chunk);
	//		}
                });

		response.on('end', function () {
	//		if (/text/.test(type)) {
	//			console.log("finishing text");
	//			console.log(body);
	//			res.end(body);
	//		}

	//		else {
	//			console.log("finishing bits");
				res.end();
	//		}
		});

        	res.writeHead(response.statusCode, response.headers);
        });
}).listen(58008);
build_filter_chain ();
console.log('Server running at http://127.0.0.1:58008');
