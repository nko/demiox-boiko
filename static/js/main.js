//Globals
var canv, context;
var W     = 10; //Width of tiles
var walls = "#"; //Can't walk on these


// This is actually faster.
var sqrt = Math.sqrt,
    floor = Math.floor,
    round = Math.round,
    min = Math.min,
    max = Math.max,
    abs = Math.abs,
    random = Math.random;
/*
 * Static objects
 */
var gameState = {
    keys : new Array(255),
    mouseX : 0,
    mouseY : 0,
    mouseDown : false,
    socket : undefined,
    newState : {},  //This is what we send to the server every loop
    bullets : [],
//    monsters : [],
    players : [],
};

/*
 * Utility functions
 */
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


/*
 * Dynamic objects
 */

function Rect(x1, y1, x2, y2) {
    this.x1=x1;
    this.y1=y1;
    this.x2=x2;
    this.y2=y2;
}

function Point(x, y) {
    this.x=x;
    this.y=y;
}

/*
 * Current character 
 */
var curPlayer = {
    x : 10,
    ID : getUniqueID(),
    y : 10,
    HP : 10,
    maxHP : 10,
    name : "",
    message : "",
    hit : function(bullet) {
        this.HP -= bullet.DMG;
    },
    update : function() {
        var dx = (gameState.keys[68]||gameState.keys[39]) - (gameState.keys[65]||gameState.keys[37]);
        var dy = (gameState.keys[83]||gameState.keys[40]) - (gameState.keys[87]||gameState.keys[38]);

        gameState.newState[curPlayer.ID] = {};
        
        gameState.newState[curPlayer.ID].type = "player";
        if (!this.checkCollisions(dx, dy)) {
            this.x += dx;
            this.y += dy;
            gameState.newState[curPlayer.ID].x = curPlayer.x
            gameState.newState[curPlayer.ID].y = curPlayer.y
        }

        if (gameState.keys[13]){//send message
            //<span id="txtlabel">What's your name?</span><input type="text" id="inputtext" /> Enter to send.
            if (this.name == ""){
                this.name = $("#inputtext").val();
                $("label").text("Now, spam the other players! :");
                curPlayer.name = this.name;
            } else {
                this.message = ($("#inputtext").val() == "" ? this.message : $("#inputtext").val());
            }
            $("#inputtext").val("");
        }
        gameState.newState[curPlayer.ID].name = curPlayer.name;
        gameState.newState[curPlayer.ID].message = curPlayer.message;

        this.rect = new Rect(this.x*W, this.y*W, this.x*W + W, this.y*W + W);
    },
    draw : function() { 
        context.fillStyle = "5555ff";
        context.fillRect(curPlayer.x*W, curPlayer.y*W, W, W);

        var text = curPlayer.name + (curPlayer.name != "" ? ":" : "") + curPlayer.message;
        context.fillText(text, this.x*W, this.y*W-5);

        context.fillText(this.HP + " HP", this.x*W, this.y*W+18);
    },
    destroy : function() {
        //TODO send message to server
        //
        //TODO prompt player to restart
    },
    checkCollisions : function(dx, dy) {
        var x = this.x + dx;
        var y = this.y + dy;
        if (x < 0 || y < 0 || x >= this.map.length || y >= this.map[0].length)
            return true;
        return utils.isWall(map[this.x + dx][this.y + dy]);
    },
}


/*
 * This is the main draw function.
 */
function draw() {
    drawMap();
    drawBullets();
//    drawMonsters();

    curPlayer.draw();
    drawOtherCharacters();
    //drawFogOfWar(); //Laggy??? -- TODO need to check into this to be sure
}

function drawFogOfWar() {
    var r = 150, x = curPlayer.x*10 + 5, y = curPlayer.y*10 + 5;
    context.fillStyle = "rgb(51, 51, 51)";
    context.fillRect(0, 0, Constants.widthPX, y - r);
    context.fillRect(0, 0, x - r, Constants.heightPX);
    context.fillRect(x + r, 0, Constants.widthPX - x, Constants.heightPX);
    context.fillRect(0, y + r, Constants.widthPX, Constants.heightPX - y);
    var fog = context.createRadialGradient(x, y, 0, x, y, r);
    fog.addColorStop(0.6, "rgba(51,51,51,0)");
    fog.addColorStop(0.65, "rgba(51,51,51,.05)");
    fog.addColorStop(0.8, "rgba(51,51,51,.3)");
    fog.addColorStop(1, "rgba(51,51,51,1)");
    context.fillStyle = fog;
    context.rect(x - r, y - r, r*2, r*2);
    context.fill();
}

function drawOtherCharacters() {
    for (c in gameState.players) {
        var cPlayer = gameState.players[c];
        cPlayer.draw(context);
        context.fillText(cPlayer.name + (cPlayer.name != "" ? ":" : "") + cPlayer.message, cPlayer.x*W, cPlayer.y*W-5);
        context.fillText(cPlayer.HP + " HP", cPlayer.x*W, cPlayer.y*W+18);
    }
}

function drawBullets() {
    for (b in gameState.bullets) {
        gameState.bullets[b].draw();
    }
}

function drawMonsters() {
    for (m in gameState.monsters) {
        gameState.monsters[m].draw();
    }
}

function shootBullet() {
    var ID = getUniqueID();

    var d = utils.normalizeVect(gameState.mouseX - curPlayer.x*W, gameState.mouseY - curPlayer.y*W);
    
    gameState.newState[ID] = {"ID":ID, "creator":curPlayer.ID, "type":"bullet", x:curPlayer.x*W, y:curPlayer.y*W, dx:d[0], dy:d[1] } ;
}

function updateLocal() {
    if (gameState.mouseDown)
        shootBullet();
}

function cacheMap() {
    for (var i=0;i<Constants.tilesAcross;i++) {
        for (var j=0;j<Constants.tilesUp;j++) {
            if (map[i][j] == ".")
                context.fillStyle = "#55ff55";
            else if (map[i][j] == "#")
                context.fillStyle = "#333333";
            else
                context.fillStyle = "#" + floor(random() * 999999);
            context.fillRect(i*W,j*W,W,W);
        }
    }
    cacheMap.img = context.getImageData(0, 0, Constants.widthPX, Constants.heightPX);
}
cacheMap.img = undefined;

function drawMap() {
    if (cacheMap.img) {
        context.putImageData(cacheMap.img, 0, 0);
    }
}

/*
 * This is a puzzler.
 *
 * Eventually, could replace this with asking the server. 
 *
 * Even better solution: the server allocates IDs to each 
 * client ahead of time, and we just use those IDs and flag 
 * when we're nearly done.
 *
 */
function getUniqueID() {
    return floor(random()*1e20); //Mathematically sound
}
/*
 * Currently, we update everything client side because there is no server.
 */
function getUpdatesFromServer() {
    for (m in gameState.monsters) {
        gameState.monsters[m].update();
    }
}

/*
 * Sent on initial signin
 *
 *
 * Grabs generated map from server, might grab more later.
 *
 */
function login(json){
    map = json.map;

    cacheMap();

    while (map[curPlayer.x][curPlayer.y] == "#"){
        curPlayer.x = Math.floor ( Math.random() * 50); 
        curPlayer.y = Math.floor ( Math.random() * 50); 
    }
}

function serverUpdate(json){
    var update = JSON.parse(json);
    if (update["map"]){
        login(update);
        return;
    }
    gameState.bullets = [];
    gameState.players = [];

    //Update all modified objects
    for (ID in update){
        if (!utils.isNumeric(ID)) continue;

        var updatedObject = update[ID];
        /*
         * Load updated bullets from server.
         */
        if (updatedObject.type == "bullet"){

            var b = new Bullet(updatedObject.x, updatedObject.y, "000000", 8, Math.random()*99999999, undefined, updatedObject.dx, updatedObject.dy, true);
            b.ID = ID;
            gameState.bullets.push(b);
        }
        /*
         * and players
         */
        if (updatedObject.type == "player"){
            if (ID == curPlayer.ID) {
                //Update HP
                curPlayer.HP = updatedObject.HP;
            } else { 
                //Update position

                var obj = utils.findObjectWithID(gameState.players, ID);
                if (!obj){
                    var obj = new Player(updatedObject.x, updatedObject.y, ID, "ff5555", 10, true);
                    obj.x = updatedObject.x;
                    obj.y = updatedObject.y;
                    obj.name = updatedObject.name;
                    obj.message = updatedObject.message;
                    obj.HP = updatedObject.HP;
                    gameState.players.push(obj);
                }
            }
        }
    }
    /*
    if (update.ID != curPlayer.ID){
        var obj = utils.findObjectWithID(gameState.players, update.ID);
        if (!obj){
            //Not found, so add him. New player! TODO more fanfare
            gameState.players.push(new Player(update.x, update.y, update.ID, "#ff5555"));
        } else {
            obj.x = update.x;
            obj.y = update.y;
        }
        
    } */

    sendUpdatesToServer();
}

function sendUpdatesToServer() {
    utils.send(JSON.stringify(gameState.newState));
}
/* Handle all game actions. This is called several times a second */
function gameLoop() {
    gameState.newState = { };
    curPlayer.update();

    if (curPlayer.HP <= 0) {
        gameState.newState[curPlayer.ID].type = "playerdie";
        utils.send(JSON.stringify(gameState.newState));


        curPlayer.HP = curPlayer.maxHP;
        do {  
            curPlayer.x = Math.floor ( Math.random() * 50); 
            curPlayer.y = Math.floor ( Math.random() * 50); 
        } while (map[curPlayer.x][curPlayer.y] == "#");
    }
    //gameState.newState[curPlayer.ID] ;
    getUpdatesFromServer();
    updateLocal();
    draw();
}

function initialize() {
    io.setPath('/client/');
    gameState.socket = new io.Socket(null, { 
        port: Constants.port,
        transports: ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling']
    });
    gameState.socket.connect();
    
    gameState.socket.on('message', serverUpdate);

    //var m = new Monster(5, 5, "ff5555");
    for (var i=0;i<255;i++) {
        gameState.keys[i]=false;
    }
    setInterval(gameLoop, Constants.refreshRate); //TODO NO!!
}

$(function() {
    canv    = $('#main')[0];
    context = canv.getContext('2d');
    /*
     * Handlers
     */
    var takefocus = false;
    $(document).keydown(function(e) {
        if (takefocus){
            //console.log(e.which);
            gameState.keys[e.which] = true;
        }
    }).keyup(function(e) { 
        if (takefocus){
            
        }
        gameState.keys[e.which] = false;
    });
    $("canvas").mouseover(function(e) {
        takefocus = true;
    }).mouseout(function(e) {
        gameState.mouseDown = false;
        for (var i=0;i<255;i++) {
            gameState.keys[i] = false;
        }
        takefocus = false;
    }).mousemove(function(e) {
        if (takefocus){
            var o = $(this).offset();
            gameState.mouseX = e.clientX - o.left;
            gameState.mouseY = e.clientY - o.top;
        }
    }).mousedown(function(e) {
        if (takefocus){
            gameState.mouseDown = true;
        }
    }).mouseup(function(e) {
        if (takefocus){
            gameState.mouseDown = false;
        }
    });
    
    window.onbeforeunload = function(){
        //alert server we are leaving
        gameState.newState[curPlayer.ID].type = "playerleave";
        utils.send(JSON.stringify(gameState.newState));
    };


    initialize();
});
