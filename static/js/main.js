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
    random = Math.random;

var map = dungen(25, 25, 3, 6, 10);
/*
var map = [ ".........................",
            ".........................",
            ".......#####.............",
            ".........................",
            ".........................",
            ".........................",
            ".........................",
            ".........................",
            ".........................",
            ".........................",
            ".........................",
            ".........................",
            ".........................",
            ".........................",
            ".........................",
            ".........................",
            ".........................",
            ".........................",
            ".........................",
            ".........................",
            "..........#..............",
            ".........................",
            ".........................",
            ".........................",
            ".........................",
            ".........................",
            ".........................",
            ".........................",
            "................#........",
            ".........................", ];
*/
/*
 * Random dungeon generator.
 * Transfer to server-side eventually.
 * (width, height) = size of dungeon.
 * (minSize, maxSize) = room sizes.
 */
function dungen(width, height, minSize, maxSize, numRooms) {
    // initialize map
    var map = [], room;
    for (var y=0; y<height; y++) {
        var a = [];
        for (var x=0; x<width; x++) {
            a.push('#');
        }
        map.push(a);
    }
    // generate rooms
    var rooms = [];
    for (var i=0; i<numRooms; i++) {
        var w = floor(random()*(maxSize-minSize+1)) + minSize;
        var h = floor(random()*(maxSize-minSize+1)) + minSize;
        var x = floor(random()*(width - w));
        var y = floor(random()*(height - h));
        rooms.push({ x: x, y: y, w: w, h: h});
    }
    // slap rooms onto map like a can of paint
    for (var i=0; i<numRooms; i++) {
        var r = rooms[i];
        for (var y=r.y; y<r.y+r.h; y++) {
            for (var x=r.x; x<r.x+r.w; x++) {
                map[y][x] = '.';
            }
        }
    }
    // connect rooms with hallways
    var room = rooms.pop();
    while (rooms.length) {
        var r = rooms.pop(), x=r.x, y=r.y;
        while (x != room.x) {
            x += (room.x - x > 0) ? 1 : -1;
            map[y][x] = '.';
        }
        while (y != room.y) {
            y += (room.y - y > 0) ? 1 : -1;
            map[y][x] = '.';
        }
    }
    return map;
}

/*
 * Static objects
 */
var Constants = {
    port : 80,
    tileSize : W,
    tilesAcross : 25,
    tilesUp : 25,
    widthPX : 25 * W,
    heightPX : 25 * W,
    refreshRate : 45,
    distanceFrom00 : 5, //TODO make general
};
var gameState = {
    keys : new Array(255),
    mouseX : 0,
    mouseY : 0,
    mouseDown : false,
    bullets : [],
    monsters : [],
    socket : undefined,
    newState : {},  //This is what we send to the server every loop
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
 *
 * Player
 *
 * Distinguished from curPlayer; these are non playable characters, controlled by other people.
 */

function Player(x, y, ID, color){
    this.x=x;
    this.y=y;
    this.ID=ID;
    this.color=color;
}
Player.prototype = {
    move : function(x, y){
        this.x=x;
        this.y=y;
    },
    draw : function() { 
        context.fillStyle = this.color;
        context.fillRect(this.x*W, this.y*W, W, W);
    },
};


/*
 * Bullet
 *
 * Initialize with x and y and optional dx, dy, speed.
 *
 * If we don't pass in dx/dy, then we assume that the bullet was shot by the current player,
 * so we compute it.
 *
 * dx/dy should be normalized (squared they should add to 1).
 */
function Bullet(x, y, color, speed, creator, dx, dy) {
    this.x = x;
    this.y = y;
    this.point = new Point(x,y);
    this.color = color;
    this.creator = creator;
    this.ID = getUniqueID();
    this.init = function() {
        if (dx != undefined) {
            this.dx=dx;
            this.dy=dy;
            this.speed=speed;
        } else {
            var dxfar = gameState.mouseX - this.x;
            var dyfar = gameState.mouseY - this.y;
            var hyp = sqrt(dxfar * dxfar + dyfar * dyfar);
            if (hyp !== 0) {
                this.dx = (dxfar / hyp)*speed;
                this.dy = (dyfar / hyp)*speed;
            }
        }
        gameState.bullets.push(this);
    }
    this.init();
}
Bullet.prototype = {
    DMG : 1,
    W : 4,
    update :
        function() {
            if (this.checkCollision()) {
                this.destroy();
            }
        },
    checkCollision :
        function() {
            var destroy = false;
            //Don't just check at the new position - check everywhere along that line, in increments of 1
            var startX = this.x;
            var startY = this.y;
            var big = max(this.x, this.y);
            for (var i=0;i<=big;i++) { 
                this.x = startX + this.dx * i / big;
                this.y = startY + this.dy * i / big;
                this.point = new Point(this.x, this.y);

                //TODO special handling collision code?
                if (this.checkHarmlessCollision()) {
                    return true;
                }
                //TODO : i think this should be moved to the server...
                if (this.checkHitObjects()) {
                    return true;
                }

                //TODO and when i do this, remove this entirely.
                if (utils.pointIntersectRect(this.point, curPlayer.rect) && curPlayer != this.creator) {
                    console.log("Ouch.");
                    return true;
                }
            }
        },
    checkHitObjects :
        function() {
            for (m in gameState.monsters) {
                if (utils.pointIntersectRect(this.point, gameState.monsters[m].rect) && gameState.monsters[m] != this.creator) {
                    gameState.monsters[m].hit(this);
                    return true;
                }
            }

            //TODO should be replaced with all players
            if (utils.pointIntersectRect(this.point, curPlayer.rect) && curPlayer != this.creator) {
                curPlayer.hit(this);
                return true;
            }


            return false
        },
    checkHarmlessCollision :
        function() {
            //Out of bounds?
            if (this.x > Constants.widthPX || this.x < 0 || this.y > Constants.heightPX || this.y < 0) {
                return true;
            }

            this.mapX = floor(this.x / W);
            this.mapY = floor(this.y / W);

            //Intersection with wall?
            if (utils.isWall(map[this.mapX][this.mapY])) {
                return true;
            }

            return false;
        },
    draw :
        function() {
            context.fillStyle = this.color;
            context.fillRect(this.x-this.W/2, this.y-this.W/2, this.W, this.W);
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
/*
 * Monster.
 *
 * Initializes with an x and y position.
 *
 * TODO monster update code should be on server, not client!
 */
function Monster(x, y, color) {
    this.x = x*Constants.tileSize;
    this.y = y*Constants.tileSize;
    this.color = color;
    this.ID = getUniqueID();
    this.rect = new Rect(this.x, this.y, this.x + this.W, this.y + this.W);
    this.init();
}

Monster.prototype = {
    W : 8,
    HP : 25,
    maxHP : 25,
    update :
        function() {
            //this.move();
            this.rect = new Rect(this.x, this.y, this.x + this.W, this.y + this.W);
            this.renderHP();
            if (random()>.8)
                this.fireBullet();
        },
    renderHP :
        function() {
            context.fillText(this.HP + " HP", this.x, this.y-5);
        },
    draw :
        function() {
            context.fillStyle = this.color;
            context.fillRect(this.x-this.W/2, this.y-this.W/2, this.W, this.W);
            this.renderHP();
        },
    //TODO this should go onto the server :]
    fireBullet :
        function(seeking) {
            //If seeking - fire in the direction of a player.
            //
            //Otherwise, fire in a random direction.

            if (seeking) {

            } else {
                //Choose a random direction to go in.
                var v = utils.normalizeVect(floor(random()*3)-1, floor(random()*3)-1);

                new Bullet(this.x, this.y, "ff5555", 3, this, v[0], v[1], this);
            }

        },
    hit :
        function(bullet) {
            this.HP -= bullet.DMG;

            if (this.HP <= 0) {
                this.destroy();
            }
        },
    destroy :
        function() {
            for (x in gameState.monsters) { 
                if (gameState.monsters[x].ID == this.ID) { 
                    gameState.monsters.splice(x, 1)
                    break;
                }
            }
        },
    move :
        function() {
            var dx, dy;
            dx = floor(random()*4 - 2)*Constants.tileSize;
            dy = floor(random()*4 - 2)*Constants.tileSize;

            this.x += dx;
            this.y += dy;
            if (this.checkCollision()) {
                this.x -= dx;
                this.y -= dy;
            }
        },
    checkCollision :
        function() {
            if (utils.isWall(map[floor(this.x/W)][floor(this.y/W)])) {
                return true;
            }

            //TODO remove this once on server
            if (this.x == curPlayer.x && this.y == curPlayer.y) {
                return true;
            }

            if (this.x < 0 || this.y < 0 || this.x > Constants.widthPX || this.y > Constants.heightPX) {
                return true;
            }

            return false;

            //TODO check collision against all players, also.
        },
    init :
        function() {
            gameState.monsters.push(this);
        }
};

/*
 * Current character 
 */
var curPlayer = {
    x : 10,
    ID : getUniqueID(),
    y : 10,
    HP : 10,
    maxHP : 10,
    hit : function(bullet) {
        this.HP -= bullet.DMG;
        console.log(this.HP);
    },
    update : function() {
        var dx = (gameState.keys[68]||gameState.keys[39]) - (gameState.keys[65]||gameState.keys[37]);
        var dy = (gameState.keys[83]||gameState.keys[40]) - (gameState.keys[87]||gameState.keys[38]);
        if (!this.checkCollisions(dx, dy)) {
            this.x += dx;
            this.y += dy;
            gameState.newState.x = curPlayer.x;
            gameState.newState.y = curPlayer.y;
        }

        this.rect = new Rect(this.x*W, this.y*W, this.x*W + W, this.y*W + W);
    },
    draw : function() { 
        context.fillStyle = "5555ff";
        context.fillRect(curPlayer.x*W, curPlayer.y*W, W, W);
        this.writeStatus();
    },
    destroy : function() {
        //TODO send message to server
        //
        //TODO prompt player to restart
    },
    writeStatus : function() {
        $("#status").html("HP: " + this.HP + "/" + this.maxHP);
    }, 
    checkCollisions : function(dx, dy) {
        return utils.isWall(map[this.x + dx][this.y + dy]);
    },
}


/*
 * This is the main draw function.
 */
function draw() {
    drawMap();
    drawBullets();
    drawMonsters();

    curPlayer.draw();
    drawOtherCharacters();
}
function drawOtherCharacters(){
    for (c in gameState.players) {
        gameState.players[c].draw();
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
    var b = new Bullet(curPlayer.x*W + W/2, curPlayer.y*W + W/2, "#000000", 12, curPlayer); //TODO curplayer->ID
}

function updateLocal() {
    curPlayer.update();
    shootBullet();
}

function drawMap() {
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
 * Server should send back info like so.
 *
 * { player_id : { position_x, position_y } , ... (of all players that moved), 
 *     item_id : { item_x, item_y, picked_up } , ... (of all items that moved),
 *   bullet_id : { bullet_x, bullet_y, destroyed}, ... (of all bullets),
 *
 *   }
 */

/*
 * Currently, we update everything client side because there is no server.
 */
function getUpdatesFromServer() {
    for (b in gameState.bullets) {
        gameState.bullets[b].update();
    }
    for (m in gameState.monsters) {
        gameState.monsters[m].update();
    }
}

function serverUpdate(json){
    var update = JSON.parse(json);
    if (update.ID != curPlayer.ID){
        var obj = utils.findObjectWithID(gameState.players, update.ID);
        if (!obj){
            //Not found, so add him. New player! TODO more fanfare
            gameState.players.push(new Player(update.x, update.y, update.ID, "#ff5555"));
        } else {
            obj.x = update.x;
            obj.y = update.y;
        }
        
    }
    //console.log(obj);
}

/* 
 * Send information to the server like so.
 *
 *  { player_id : {position_x, position_y} ,
 *  new_bullets : {theta} //theta is the angle that the bullet is travelling in. 
 *                        //Assume it starts the same place as the player.
 *  picked_up : {item_x, item_y} ...
 *  dropped   :    "        "
 */ 
function sendUpdatesToServer() {
    utils.send(JSON.stringify(gameState.newState));
}
/* Handle all game actions. This is called several times a second */
function gameLoop() {
    gameState.newState = {};
    gameState.newState.ID = curPlayer.ID;
    getUpdatesFromServer();
    updateLocal();
    draw();
    sendUpdatesToServer();
}

function initialize() {
    io.setPath('/client/');
    gameState.socket = new io.Socket(null, { 
        port: Constants.port,
        transports: ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling']
    });
    gameState.socket.connect();
    
    gameState.socket.on('message', serverUpdate);

    var m = new Monster(5, 5, "ff5555");
    for (var i=0;i<255;i++) {
        gameState.keys[i]=false;
    }
    setInterval(gameLoop, Constants.refreshRate);
}

$(function() {
    canv    = $('#main')[0];
    context = canv.getContext('2d');
    /*
     * Handlers
     */
    $(document).keydown(function(e) { 
        console.log(e.which);
        gameState.keys[e.which] = true;
    }).keyup(function(e) { 
        gameState.keys[e.which] = false;
    }).mousemove(function(e) {
        gameState.mouseX = e.clientX;
        gameState.mouseY = e.clientY;
    }).mousedown(function(e) {
        gameState.mouseDown = true;
    }).mouseup(function(e) {
        gameState.mouseDown = false;
    });
    
    initialize();
});
