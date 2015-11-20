var fs = require('fs');
var express = require('express');
var request = require('request');
var http = require('http');
var S = require('string');

var app = express();
app.use(express.bodyParser());
app.use("/images", express.static(__dirname + '/images'));

var endpoint = "http://52.11.127.220";//"https://cpserver-dev.elasticbeanstalk.com/"


var page = function( req, res, state ) {
    var body = fs.readFileSync('./urlShortener.html');
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    
    //var msg = "This is the current state of this app: " + state + "<br>";
    var msg = "";
    if (state == "has-url"){
        var longurl = req.body.longurl;
        var shorturl;
        getShortUrl(longurl, function(shorturl, publicIP){
        msg = msg + "Your Long URL: " + longurl + "<br>";
        msg = msg + "Your Short URL: " + shorturl + "<br>";
        msg = msg + "Host IP Converting this URL: " + publicIP + "<br>";
        var html_body = "" + body;
        html_body = html_body.replace("{message}", msg);
        res.end(html_body);
        });
    }else {
        var html_body = "" + body;
        html_body = html_body.replace("{message}", msg);
        res.end(html_body);
    }
}

var getShortUrl = function( longurl, callback) {
    request({
        url : endpoint,
        method : "POST",
        json: true,
        body : {
            "longurl" : longurl
        }
    }, function(error, response, body){
        if(error){
            console.log(error);
            callback(null);
        } else {
            console.log(JSON.stringify(body));
            callback(body.shorturl, body.publicIP);
        }
    }
    )
}

var handle_post = function (req, res) {
    console.log( "Post: " + "Submitted URL: " +  req.body.longurl + "\n" ) ;
    var longurl = "" + req.body.longurl ;
    //NEED TO VALIDATE LONG URL
    if ( ! (S(longurl).startsWith("http://") || S(longurl).startsWith("https://"))){
        req.body.longurl = "http://" + longurl;
    }
    console.log("longurl: "+ req.body.longurl);

    if (longurl.trim() == "") {
        page( req, res, "no-url" ) ;
    }
    else{
        page(req, res, "has-url") ;
    }
}

var handle_get = function (req, res) {
    console.log( "Get: ..." ) ;
    page( req, res, "no-url" ) ;
    
}

app.set('port', (process.env.PORT || 5000));

app.post("*", handle_post );
app.get( "*", handle_get ) ;

//accepting self signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
