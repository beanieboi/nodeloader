var util = require('util'),
    express = require('express'),
    app = express.createServer();
    path = require('path'),
    http = require('http'),
    helper = require("helper"),
    zipstream = require('zipstream'),
    http = require('http');

app.use(express.bodyParser());

app.post("/hashes", function (request, response) {

    if (helper.authorizeRequest(true) == false) {
        response.send("Forbidden", 403);
        return;
    }

    hashes = request.body.hashes.replace(/ /g,"").split(",");

    var zip = zipstream.createZip({ level: 0 });
    zip.pipe(response);

    response.attachment('photos.zip');
    response.contentType('application/zip');

    var download = function() {
        if (hashes.length == 0) {
            zip.finalize(function(written) { console.log(written/1024 + ' total Kbytes written'); });
        } else {
            var hash = hashes.pop();

            var url = helper.generateRequestUrl('myS3Bucket', helper.filePath(hash));
            var client = http.createClient(80, 's3.amazonaws.com');
            var request = client.request('GET', url, {'host': 's3.amazonaws.com'});
            request.end();

            request.on('response', function (response) {
                if(response.statusCode == '200'){
                    zip.addFile(response, { name: hash + ".jpg" }, function() {
                        download();
                    });
                } else {
                    console.log("error responseCode for file: " + hash + response.statusCode);
                    download();
                }
            });
        }
    };

    download();
});

app.get("/", function (request, response) {
    response.send(util.inspect(process.memoryUsage()));
});

app.listen(8085, '0.0.0.0');
