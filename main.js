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
        tilesAcross : 25,
        tilesUp : 25,
        widthPX : 25 * W,
        heightPX : 25 * W,
    };

    var gameState = {
        keys : new Array(255),
        mouseX : 0,
        mouseY : 0,
        mouseDown : false,
        bullets : [],
    };

    var curPlayer = {
        x : 10,
        y : 10,
        HP : 10,
        maxHP : 10,
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
    function Bullet(x, y, speed, dx, dy){
        this.x = x;
        this.y = y;
        this.W = 4;
        this.id = getUniqueID();
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
            var destroy = false;
            this.x += this.dx;
            this.y += this.dy;
            //Out of bounds?
            if (this.x > Constants.widthPX || this.x < 0 || this.y > Constants.heightPX || this.y < 0){
                destroy = true;
            }

            //TODO check collisions



            if (destroy){
                this.destroy();
            }
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
     * This is the main draw function.
     */
    function draw(){
        drawMap();
        drawBullets();
        drawCurPlayer();
        /*
        drawOtherCharacters();
        */
    }

    function drawBullets(){
        for (b in gameState.bullets){
            var cBul = gameState.bullets[b];
            context.fillStyle = "#000000";
            context.fillRect(cBul.x-cBul.W/2, cBul.y-cBul.W/2, cBul.W, cBul.W);
            cBul.update();
        }
    }

    function movePlayer(){
        curPlayer.y += gameState.keys[83] - gameState.keys[87];
        curPlayer.x += gameState.keys[68] - gameState.keys[65];
        //TODO collision detection =)

    }
    function shootBullet(){
        var b = new Bullet(curPlayer.x*W, curPlayer.y*W, 12);
        console.log(gameState.bullets.length);
    }
    function updateLocal(){
        movePlayer();
        shootBullet();
    }

    function drawCurPlayer(){
        context.fillStyle = "5555ff";
        context.fillRect(curPlayer.x*W, curPlayer.y*W, W, W);
    }
    function drawMap(){
        for (var i=0;i<Constants.tilesAcross;i++){
            for (var j=0;j<Constants.tilesUp;j++){
                if (map[i][j] == ".")
                    context.fillStyle = "#55ff55";
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

    function getUpdatesFromServer(){

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
        for (var i=0;i<255;i++){
            gameState.keys[i]=false;
        }
        setInterval(gameLoop, 100);
    }
    initialize();
});
