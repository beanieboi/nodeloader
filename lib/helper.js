var fs = require("fs"),
    path = require('path'),
    url = require('url'),
    crypto = require('crypto'),
    config = require('config'),
    querystring = require('querystring');

var parseParamsFrom = function(uri) {
    parsedUrl = url.parse(uri, true);
    auth = parsedUrl.query? parsedUrl.query.auth : 'undefined';

    params = parsedUrl.pathname.match(new RegExp("([0-9]+)/([0-9]+)/([a-zA-Z0-9]{2})/([a-zA-Z0-9]+).jpg"));
    return { width: params[1], height: params[2], first: params[3], second: params[4], sha1: params[3]+params[4], auth: auth };
};

var filePath = function (hash) {
    first = hash.substring(0, 2);
    second = hash.substring(2, 40);
    return path.join(first, second) + '.jpg';
};

var createAuthHash = function(params) {
    sha1 = crypto.createHash('sha1');
    sha1.update(params.sha1 + params.width + params.height + config.imageAuthSecret);
    return sha1.digest('hex');
};

var authorizeRequest = function(params) {
    correct_auth = createAuthHash(params);

    if (params.auth == 'undefined') {
      return false;
    } else if (correct_auth == params.auth){
      return true;
    } else {
      return false;
    }
};

var generateRequestUrl = function(bucket, filepath) {
    // DOOMSDAY expires Jan 18 2038
    date = 2147382000;
    resource = '/' + bucket + '/' + filepath;

    string_to_sign = 'GET\n\n\n' + date + '\n' + resource;
    hmac = crypto.createHmac('sha1', config.s3.secretAccessKey);
    hmac.update(string_to_sign);
    signature = hmac.digest('base64');

    s3Url = resource + '?AWSAccessKeyId=' + config.s3.accessKeyId + '&Expires=' + date + '&Signature=' + querystring.escape(signature);
    return s3Url;
};

var verifyDownloadFromS3 = function(params, callback) {
    utils.calculateSha1ForFile(filePathForOriginal(params), function(error, calculated_sha1){
        flag = (params.sha1 == calculated_sha1);
        callback(flag);
    });
};


exports.filePath = filePath;
exports.parseParamsFrom = parseParamsFrom;
exports.authorizeRequest = authorizeRequest;
exports.generateRequestUrl = generateRequestUrl;
exports.verifyDownloadFromS3 = verifyDownloadFromS3;
