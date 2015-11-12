var fs = require('fs');
var express = require('express');
var Client = require('node-rest-client').Client;

var app = express();
app.use(express.bodyParser());
app.use("/images", express.static(__dirname + '/images'));

var page = function( req, res, state ) {
    body = fs.readFileSync('./urlShortener.html');
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);

    msg = "This is the current state of this app: " + state + "<br>";
    if (state == "has-url"){
        msg = msg + "The URL you entered is " + req.body.longurl;
    }
    var html_body = "" + body;
    html_body = html_body.replace("{message}", msg);
    res.end(html_body);
}

var handle_post = function (req, res) {
    console.log( "Post: " + "Submitted URL: " +  req.body.longurl + "\n" ) ;
    var longurl = "" + req.body.longurl ;
    //VALIDATE LONG URL
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

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
