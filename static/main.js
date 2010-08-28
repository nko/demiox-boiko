$(function(){ 
    //Globals
    var W=10; //Width of tiles
    var walls = "#"; //Can't walk on these

    var state = {};
    var canv = document.getElementById('main');
    var context = canv.getContext('2d');

    var map = [ ".........................",
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
                ".........................",
                ".........................", ];


    /*
     * Static objects
     */

    var Constants = {
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
    };

        /*
         * Utility functions
         */
    var utils = {

        isWall : 
            function(x){
                return walls.indexOf(x) != -1;
            },

        //Returns true if the point at pX, pY intersects the rect with top left rX1, rY1 and bottom right rX2, rY2
        pointIntersectRect : 
            function (point, rect){
                return  (point.x >= rect.x1 && point.x <= rect.x2 &&
                         point.y >= rect.y1 && point.y <= rect.y2 );
            },
        //Returns an array [x,y] of the normalized vector.
        normalizeVect :
            function (x, y){
                if (x==0) x = .1;
                if (y==0) y = .1;
                var hyp = Math.sqrt(x*x + y*y);
                return [x/hyp, y/hyp];
            }
    };

    /*
     * Handlers
     */

    $(document).keydown(function(e){ 
        console.log(e.which);
        gameState.keys[e.which] = true;
    });

    $(document).keyup(function(e){ 
        gameState.keys[e.which] = false;
    });

    $(document).mousemove(function(e){
        gameState.mouseX = e.clientX;
        gameState.mouseY = e.clientY;
    });

    $(document).mousedown(function(e){
        gameState.mouseDown = false;
    });


    /*
     * Dynamic objects
     */

    function Rect(x1, y1, x2, y2){
        this.x1=x1;
        this.y1=y1;
        this.x2=x2;
        this.y2=y2;
    }

    function Point(x, y){
        this.x=x;
        this.y=y;
    }

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
    function Bullet(x, y, color, speed, creator, dx, dy){
        this.DMG = 1;
        this.x = x;
        this.y = y;
        this.point = new Point(x, y);
        this.W = 4;
        this.id = getUniqueID();
        this.color = color;
        this.creator = creator;
        this.init = function(){
            if (dx != undefined){
                this.dx=dx;
                this.dy=dy;
                this.speed=speed;
            } else {
                var dxfar = gameState.mouseX - this.x;
                var dyfar = gameState.mouseY - this.y;

                if (dxfar == 0) dxfar = .1;
                if (dyfar == 0) dyfar = .1; //Prevent div by 0 or other awkward things from happening

                var hyp = Math.sqrt(dxfar * dxfar + dyfar * dyfar);

                this.dx = (dxfar / hyp)*speed;
                this.dy = (dyfar / hyp)*speed;
            }
            gameState.bullets.push(this);
        }

        this.update = function(){
            if (this.checkCollision()){
                this.destroy();
            }
        }
        this.checkCollision = function(){
            var destroy = false;
            //Don't just check at the new position - check everywhere along that line, in increments of 1
            var startX = this.x;
            var startY = this.y;
            var big = Math.max(this.x, this.y);
            for (var i=0;i<=big;i++) { 
                this.x = startX + this.dx * i / big;
                this.y = startY + this.dy * i / big;
                this.point = new Point(this.x, this.y);

                //TODO special handling collision code?
                if (this.checkHarmlessCollision()){
                    return true;
                }
                //TODO : i think this should be moved to the server...
                if (this.checkHitObjects()){
                    return true;
                }

                //TODO and when i do this, remove this entirely.
                if (utils.pointIntersectRect(this.point, curPlayer.rect) && curPlayer != this.creator){
                    console.log("Ouch.");
                    return true;
                }
            }
        }

        this.checkHitObjects = function(){
            for (m in gameState.monsters){
                if (utils.pointIntersectRect(this.point, gameState.monsters[m].rect) && gameState.monsters[m] != this.creator){
                    gameState.monsters[m].hit(this);
                    return true;
                }
            }
            
            //TODO should be replaced with all players
            if (utils.pointIntersectRect(this.point, curPlayer.rect) && curPlayer != this.creator){
                curPlayer.hit(this);
                return true;
            }


            return false
        }

        this.checkHarmlessCollision = function(){
            //Out of bounds?
            if (this.x > Constants.widthPX || this.x < 0 || this.y > Constants.heightPX || this.y < 0){
                return true;
            }

            this.mapX = ~~(this.x / W);
            this.mapY = ~~(this.y / W);

            //Intersection with wall?
            if (utils.isWall(map[this.mapX][this.mapY])){
                return true;
            }

            return false;
        }

        this.draw = function(){
            context.fillStyle = this.color;
            context.fillRect(this.x-this.W/2, this.y-this.W/2, this.W, this.W);
        }

        this.destroy = function(){
            for (x in gameState.bullets) { 
                if (gameState.bullets[x].id == this.id) { 
                    gameState.bullets.splice(x, 1)
                    break;
                }
            }
        }

        this.init();
    }

    /*
     * Monster.
     *
     * Initializes with an x and y position.
     *
     * TODO monster update code should be on server, not client!
     */
    function Monster(x, y, color){
        this.x=x*Constants.tileSize;
        this.y=y*Constants.tileSize;
        this.id = getUniqueID();
        this.W=8;
        this.rect = new Rect(this.x, this.y, this.x + this.W, this.y + this.W);
        this.HP = 25;
        this.maxHP = 25;
        this.color = color;

        this.update = function(){
            //this.move();
            this.rect = new Rect(this.x, this.y, this.x + this.W, this.y + this.W);
            this.renderHP();
            if (Math.random()>.8)
                this.fireBullet();
        }

        this.renderHP = function(){
            context.fillText(this.HP + " HP", this.x, this.y-5);
        }

        this.draw = function(){
            context.fillStyle = this.color;
            context.fillRect(this.x-this.W/2, this.y-this.W/2, this.W, this.W);
            this.renderHP();
        }

        //TODO this should go onto the server :]
        this.fireBullet = function(seeking){
            //If seeking - fire in the direction of a player.
            //
            //Otherwise, fire in a random direction.

            if (seeking){

            } else {
                //Choose a random direction to go in.
                var v = utils.normalizeVect(~~(Math.random()*3)-1, ~~(Math.random()*3)-1);

                new Bullet(this.x, this.y, "ff5555", 3, this, v[0], v[1], this);
            }

        }

        this.hit = function(bullet){
            this.HP -= bullet.DMG;

            if (this.HP < 0){
                this.destroy();
            }
        }

        this.destroy = function(){
            for (x in gameState.monsters) { 
                if (gameState.monsters[x].id == this.id) { 
                    gameState.monsters.splice(x, 1)
                    break;
                }
            }
        }

        this.move = function(){
            var dx, dy;
            dx = ~~(Math.random()*4 - 2)*Constants.tileSize;
            dy = ~~(Math.random()*4 - 2)*Constants.tileSize;

            this.x += dx;
            this.y += dy;
            if (this.checkCollision()){
                this.x -= dx;
                this.y -= dy;
            }
        }

        this.checkCollision = function(){
            if (utils.isWall(map[~~(this.x/W)][~~(this.y/W)])){
                return true;
            }

            //TODO remove this once on server
            if (this.x == curPlayer.x && this.y == curPlayer.y){
                return true;
            }

            if (this.x < 0 || this.y < 0 || this.x > Constants.widthPX || this.y > Constants.heightPX){
                return true;
            }

            return false;

            //TODO check collision against all players, also.
        }

        this.init = function(){
            gameState.monsters.push(this);
        };

        this.init();

    }

    /*
     * Current character 
     */
    var curPlayer = {
        x : 10,
        y : 10,
        HP : 10,
        maxHP : 10,
        hit : function(bullet){
            this.HP -= bullet.DMG;
            console.log(this.HP);
        },
        update : function(){
            var dx = gameState.keys[68] - gameState.keys[65];
            var dy = gameState.keys[83] - gameState.keys[87];
            if (!this.checkCollisions(dx, dy)){
                this.x += dx;
                this.y += dy;
            }
            this.rect = new Rect(this.x*W, this.y*W, this.x*W + W, this.y*W + W);
        },
        draw : function(){ 
            context.fillStyle = "5555ff";
            context.fillRect(curPlayer.x*W, curPlayer.y*W, W, W);
            this.writeStatus();
        },
        destroy : function(){
            //TODO send message to server
            //
            //TODO prompt player to restart
        },
        writeStatus : function(){
            $("#status").html("HP: " + this.HP + "/" + this.maxHP);
        }, 
        checkCollisions : function(dx, dy){
            return utils.isWall(map[this.x + dx][this.y + dy]);
        },
    }


    /*
     * This is the main draw function.
     */
    function draw(){
        drawMap();
        drawBullets();
        drawMonsters();
        curPlayer.draw();
        /*
        drawOtherCharacters();
        */
    }

    function drawBullets(){
        for (b in gameState.bullets){
            gameState.bullets[b].draw();
        }
    }

    function drawMonsters(){
        for (m in gameState.monsters){
            gameState.monsters[m].draw();
        }
    }

    function shootBullet(){
        var b = new Bullet(curPlayer.x*W + W/2, curPlayer.y*W + W/2, "#000000", 12, curPlayer); //TODO curplayer->ID
    }

    function updateLocal(){
        curPlayer.update();
        shootBullet();
    }

    function drawMap(){
        for (var i=0;i<Constants.tilesAcross;i++){
            for (var j=0;j<Constants.tilesUp;j++){
                if (map[i][j] == ".")
                    context.fillStyle = "#55ff55";
                else if (map[i][j] == "#")
                    context.fillStyle = "#333333";
                else
                    context.fillStyle = "#" + ~~(Math.random() * 999999);
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
    function getUniqueID(){
        return ~~(Math.random()*1e20); //Mathematically sound
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
    function getUpdatesFromServer(){

        for (b in gameState.bullets){
            gameState.bullets[b].update();
        }
        for (m in gameState.monsters){
            gameState.monsters[m].update();
        }
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
    function sendUpdatesToServer(){

    }
    /* Handle all game actions. This is called several times a second */
    function gameLoop(){
        state = {};
        getUpdatesFromServer();
        updateLocal();
        draw();
        sendUpdatesToServer();
    }

    function initialize(){
        var m = new Monster(5, 5, "ff5555");
        for (var i=0;i<255;i++){
            gameState.keys[i]=false;
        }
        setInterval(gameLoop, Constants.refreshRate);
    }
    initialize();

});
