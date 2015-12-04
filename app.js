var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var http = require('http');
var S = require('string');

var app = express();
//app.use(express.bodyParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use("/images", express.static(__dirname + '/images'));

var endpoint = "http://52.11.127.220";
var trendendpoint = "https://52.11.102.172";
var shortDomain = "http://54.193.121.101/";

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

var pageTrend = function(req, res, state){
    var body = fs.readFileSync('./trend.html');
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    
    var msg = "";
    if (state == "no-url"){
        getTopTen(function(result){
            if (result.length == 0 ){
                msg = '<p align="center">No Data can be found at the moment.</p>';
            }
            else {
                msg += '<p align="center">Here are our top ten short URLs!</p>';
                msg += '<tr><th>Long URL</th><th>Short URL</th><th>Total Visit</th></tr>';
                for (var i=0; i < result.length; i++) {
                    //console.log(result[i]);
                    msg += '<tr>';
                    msg += '<td align="center">' + result[i].longurl + '</td>';
                    msg += '<td align="center">' + shortDomain+result[i].shorturl + '</td>';
                    msg += '<td align="center">' + result[i].totalcount.toString() + '</td>';
                    msg += '</tr>';
                }
            }
            var html_body = "" + body;
            html_body = html_body.replace("{message}", msg);
            res.end(html_body);
        });
    } else if(state == "has-url"){
        var shorturl = req.body.shorturl;
        // getting rid of the domain
        shorturl = S(shorturl).chompLeft(shortDomain).s;
        getShortInfo(shorturl, function(result){
            console.log("URL: " +shorturl);
            msg += '<p align=center>Short URL: ' + req.body.shorturl + "</p>";
            if (result.status == "not found"){
                msg += '<p align="center"';
                msg += "We don't have any data on the Short URL you have provided.<br>";
                msg += "Please make sure you have visit the Short URL yourself or<br>you have input the correct Short URL</p>";
            } else {
                result.users.sort(function(a, b){return b.count - a.count;})
                msg += '<p align="center">Here is some information about the provided URL:</p>';
                msg += '<tr><th>User IP</th><th>Total Visit</th></tr>';
                for (var i=0; i<result.users.length; i++){
                    msg += '<tr>';
                    msg += '<td align="center">' + result.users[i].IP + '</td>';
                    msg += '<td align="center">' + result.users[i].count + '</td>';
                    msg += '</tr>';
                }
            }
            var html_body = "" + body;
            html_body = html_body.replace("{message}", msg);
            res.end(html_body);
        });
    }
}

var getTopTen = function(callback) {
    request({
        url : trendendpoint,
        method : "POST",
        json: true,
        body : {
            "action" : "read"
        }
    }, function(error, response, body){
        if(error){
            console.log(error);
            callback(null);
        } else {
            //console.log(body);
            callback(body);
        }
    });
}

var getShortInfo = function(shorturl, callback){
    request({
        url : trendendpoint,
        method : "POST",
        json: true,
        body : {
            "action" : "read",
            "shorturl": shorturl
        }
    }, function(error, response, body){
        if(error){
            console.log(error);
            callback(null);
        } else {
            //console.log(body);
            callback(body);
        }
    });
};

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

var handle_getTrend = function (req, res) {
    console.log( "Get Trend: ..." ) ;
    pageTrend(req, res, "no-url");
}

var handle_postTrend = function (req, res) {
    console.log( "Get Trend: ..." ) ;
    var shorturl = "" + req.body.shorturl;
    if (shorturl.trim() != ""){
        pageTrend(req, res, "has-url");
    }
    else
        pageTrend(req, res, "no-url");
}

app.set('port', (process.env.PORT || 80));

app.post("/", handle_post );
app.get( "/", handle_get ) ;
app.get("/trend", handle_getTrend);
app.post("/trend", handle_postTrend);

//accepting self signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
