$(function(){
    //Globals
    var W=10; //Width of tiles
    var walls = "#"; //Can't walk on these
    var keys = new Array(255);

    var mouseX=0, mouseY=0;
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



    $(document).keydown(function(e){ 
        console.log(e.which);
        keys[e.which] = true;
    });
    $(document).keyup(function(e){ 
        keys[e.which] = false;
    });
    $(document).mousemove(function(e){
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    $(document).mousedown(function(e){

    });

    /*
     * Static objects
     */

    var curPlayer = {
        x : 10,
        y : 10,
        HP : 10,
        maxHP : 10,
    };
    
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
    function Bullet(x, y, dx, dy, speed){
        this.x = x;
        this.y = y;
        if (dx != undefined){
            this.dx=dx;
            this.dy=dy;
            this.speed=speed;
        } else {
            var dxfar = this.x - mouseX;
            var dyfar = this.y - mouseY;

            if (dxfar == 0) dxfar = .1;
            if (dyfar == 0) dyfar = .1; //Prevent div by 0 or other awkward things from happening

            var hyp = Math.sqrt(dxfar * dxfar + dyfar * dyfar);

            this.dx = this.dxfar / hyp;
            this.dy = this.dyfar / hyp;
        }

        this.update = function(){
            this.x += this.dx;
            this.y += this.dy;
        }


    }



    /*
     * This is the main draw function.
     */
    function draw(){
        drawMap();
        drawCurPlayer();
        /*
        drawOtherCharacters();
        */
    }
    function movePlayer(){
        curPlayer.y += keys[83] - keys[87];
        curPlayer.x += keys[68] - keys[65];
    }
    function updateLocal(){
        movePlayer();
    }

    function drawCurPlayer(){
        context.fillStyle = "5555ff";
        context.fillRect(curPlayer.x*W, curPlayer.y*W, W, W);
    }
    function drawMap(){
        for (var i=0;i<25;i++){
            for (var j=0;j<25;j++){
                if (map[i][j] == ".")
                    context.fillStyle = "#55ff55";
                else
                    context.fillStyle = "#" + ~~(Math.random() * 999999);
                context.fillRect(i*W,j*W,W,W);
            }
        }

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
            keys[i]=false;
        }
        setInterval(gameLoop, 100);
    }
    initialize();
});
