//setup Dependencies


require(__dirname + "/lib/setup").ext(__dirname + "/lib").ext(__dirname + "/lib/express/support");
var connect = require('connect')
    , express = require('express')
    , sys = require('sys')
    , io = require('Socket.IO-node')
    //,
    , Bullet = require('./static/js/bullets').Bullet
    //, Monsters  = require('./static/js/monsters')
    , port = 80;

//Setup Express
var server = express.createServer();
server.configure(function(){
    server.set('views', __dirname + '/views');
    server.use(connect.bodyDecoder());
    server.use(connect.staticProvider(__dirname + '/static'));
    server.use(server.router);
});

//setup the errors
server.error(function(err, req, res, next){
    if (err instanceof NotFound) {
        res.render('404.ejs', { locals: { 
                  header: '#Header#'
                 ,footer: '#Footer#'
                 ,title : '404 - Not Found'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX' 
                } });
    } else {
        res.render('500.ejs', { locals: { 
                  header: '#Header#'
                 ,footer: '#Footer#'
                 ,title : 'The Server Encountered an Error'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX'
                 ,error: err 
                } });
    }
});
server.listen(port);

//Setup Socket.IO
//

var W = 10;
//var Constants = Constants;
/* = {
    port : 80,
    tileSize : W,
    tilesAcross : 25,
    tilesUp : 25,
    widthPX : 25 * W,
    heightPX : 25 * W,
    refreshRate : 45,
    distanceFrom00 : 5, //TODO make general
}; */

/*
function Bullet(x, y, creator, ID, dx, dy) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.speed = 8; //TODO
    this.ID = ID;

}
Bullet.prototype = {
    move : function(x, y){
        this.x=x;
        this.y=y;
    },
    update : function(){
        if (this.x > Constants.widthPX || this.x < 0 || this.y > Constants.heightPX || this.y < 0) {
            this.destroy();
        }
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;
    },
    destroy :
        function() {
            for (x in gameState.bullets) { 
                if (gameState.bullets[x].ID == this.ID) { 
                    gameState.bullets.splice(x, 1);
                    break;
                }
            }
        }
};
*/

//ACTUAL SERVER STUFF GOES HERE

var ticks = 0;
var updateTime = 50; //Overly optimistic? nahhh
var updates = {};

var gameState = {
    bullets : [],
    monsters : [],
    players : [],
};


var utils = {
    isWall : 
        function(x) {
            return walls.indexOf(x) != -1;
        },

    //Returns true if the point at pX, pY intersects the rect with top left rX1, rY1 and bottom right rX2, rY2
    pointIntersectRect : 
        function (point, rect) {
            return  (point.x >= rect.x1 && point.x <= rect.x2 &&
                     point.y >= rect.y1 && point.y <= rect.y2 );
        },
    //Returns an array [x,y] of the normalized vector.
    normalizeVect :
        function (x, y) {
            var hyp = sqrt(x*x + y*y);
            if (hyp === 0)
                return [0, 0];
            return [x/hyp, y/hyp];
        },
    send :
        function (msg) { 
            gameState.socket.send(msg);     
        },
    /*
     * Finds an object with specified ID in list list. Returns false if
     * no such object exists.
     */
    findObjectWithID : 
        function (list, ID){
            for (var i=0;i<list.length;i++){
                if (list[i].ID == ID){
                    return list[i];
                }
            }
            return false;
        },
    isNumeric:
       function (sText) {
           var ValidChars = "0123456789.";
           var IsNumber=true;
           var Char;
         
           for (i = 0; i < sText.length && IsNumber == true; i++) { 
              Char = sText.charAt(i); 
              if (ValidChars.indexOf(Char) == -1){
                     IsNumber = false;
                 }
              }
           return IsNumber;
       }, 

};




function updateServer(){
    for (var b in gameState.bullets){
        var cBul = gameState.bullets[b];
        cBul.update();
    }
}

function generateUpdateMessage(){
    var update ={}
    update.tick =  ++ticks; 

    for (var b in gameState.bullets){
        var cBul = gameState.bullets[b];
        update[cBul.ID] = {};
        update[cBul.ID].x = cBul.x;
        update[cBul.ID].y = cBul.y;
        update[cBul.ID].dx = cBul.dx;
        update[cBul.ID].dy = cBul.dy;
        update[cBul.ID].type = "bullet";
    }

    return update;
}


var sock = io.listen(server);

sock.on('connection', function(client) {

    //Ask clients what is up every 50 ms
    setInterval(function(){
        updateServer();
        console.log("Pinging all clients");

        var update = generateUpdateMessage();
        var message = JSON.stringify(update);
        client.broadcast(message);
        client.send(message);

        //console.log("received new info");
        //console.log(updates);
        //Updates - all updates received in the last 50ms
        for (ID in updates){
            if (utils.isNumeric(ID)){ 
                var curUpdate = updates[ID];
                if (curUpdate.type == "bullet") { 

                    //exports.Bullet = function(x, y, color, speed, ID, creator, dx, dy) {
                    var b = new Bullet(curUpdate.x, curUpdate.y, "000000", 6, ID, undefined, curUpdate.dx, curUpdate.dy);
                    gameState.bullets.push(b);
                } /* else if (curUpdate.type == "player") { 


                } */
            }
        }
        updates = {}; //Clear updates for the new updates to come in.
    }, updateTime);

    /*
     *
     * Every time a client sends back information, put it in the update []
     */
	client.on('message', function(json) {
        //console.log(json + " received.");

        var update = JSON.parse(json);
        for (ID in update){
            updates[ID] = update[ID]; //Copy changes from this update to the big update.
        }
	});
	client.on('disconnect', function() {
		console.log('Client Disconnected.');
	});
});


///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/////// ADD ALL YOUR ROUTES HERE  /////////
/*
server.get('/', function(req,res) {
  res.render('index.ejs', {
    locals : { 
              header: '#Header#'
             ,footer: '#Footer#'
             ,title : 'Page Title'
             ,description: 'Page Description'
             ,author: 'Your Name'
             ,analyticssiteid: 'XXXXXXX' 
            }
  });
    res.render('woot.html', {
        locals : { 
                    header          : 'This is a header.'
                   ,footer          : 'This is a footer?'
                   ,title           : 'gunpixel'
                   ,description     : 'an awesome game'
                   ,author          : 'sarenji && johnfn'
                   ,analyticssiteid : 'XXXXXXX' 
                 }
    });
});


//A Route for Creating a 500 Error (Useful to keep around)
server.get('/500', function(req, res) {
    throw new Error('This is a 500 Error');
});

//The 404 Route (ALWAYS Keep this as the last route)
server.get('/*', function(req, res) {
    throw new NotFound;
});

function NotFound(msg) {
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}
*/
console.log('Listening on http://0.0.0.0:' + port );
