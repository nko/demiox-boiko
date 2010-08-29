(function(exports, typeOfInc){

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


    /*
     * The client should only use the creation method.
     *
     * The server should use the rest.
     */

    if (!typeOfInc){ //If we are including from node...
        this.Constants = require('./constants').Constants;
        this.Player = require('./players').Player;

    }

    exports.Bullet = function(x, y, color, speed, ID, creator, dx, dy, map, isClient) {
        //this.Constants = Constants;
        this.x = x;
        this.y = y;
        this.point = Constants.Point(x,y);
        this.color = color;
        this.creator = creator;
        this.ID = ID;

        this.speed=speed;
        this.init = function() {
            if (dx != undefined) {
                this.dx=dx;
                this.dy=dy;
            } else {
                var dxfar = gameState.mouseX - this.x;
                var dyfar = gameState.mouseY - this.y;
                var hyp = sqrt(dxfar * dxfar + dyfar * dyfar);
                if (hyp !== 0) {
                    this.dx = (dxfar / hyp)*speed;
                    this.dy = (dyfar / hyp)*speed;
                }
            }
            if (typeof exports.Bullet.all == 'undefined') { //Static variable hack
                exports.Bullet.all = [];
            }
            if (!isClient) { 
                exports.Bullet.all.push(this);
            }
            //gameState.bullets.push(this);
        }
        this.init();
    }
    exports.Bullet.prototype = {
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
                //Don't just check at the new position - check everywhere along that line, in increments of 1
                var startX = this.x;
                var startY = this.y;
                var big = Math.abs(Math.max(this.dx *this.speed, this.dy *this.speed));
                for (var i=0;i<=big;i++) { 
                    this.x = startX + this.dx * (i+1) * this.speed / big;
                    this.y = startY + this.dy * (i+1) * this.speed / big;
                    this.point = Constants.Point(this.x, this.y);

                    //TODO special handling collision code?
                    if (this.checkHarmlessCollision()) {
                        return true;
                    }
                    //TODO : i think this should be moved to the server...
                    if (this.checkHitObjects()) {
                        return true;
                    }

                }
                //if (this.startX == this.x && this.startY = this.y) this.destroy();
            },
        checkHitObjects :
            function() {
                /*for (m in gameState.monsters) {
                    if (utils.pointIntersectRect(this.point, gameState.monsters[m].rect) && gameState.monsters[m] != this.creator) {
                        gameState.monsters[m].hit(this);
                        return true;
                    }
                }

                */

                for (p in Player.all) { 
                    if (Constants.utils.pointIntersectRect(this.point, Player.all[p].rect) && Player.all[p].ID != this.creator) {
                        Player.all[p].hit(this);
                        return true;
                    }
                }


                return false
            },
        checkHarmlessCollision :
            function() {
                //Out of bounds?
                if (this.x > Constants.widthPX || this.x < 0 || this.y > Constants.heightPX || this.y < 0) {
                    return true;
                }

                this.mapX = Math.floor(this.x / 10);
                this.mapY = Math.floor(this.y / 10);

                //Intersection with wall?
                if (isNaN(this.mapX) || isNaN(this.mapY) || Constants.utils.isWall(Constants.map[this.mapX][this.mapY])) {
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
                for (x in exports.Bullet.all) { 
                    if (exports.Bullet.all[x].ID == this.ID) { 
                        exports.Bullet.all.splice(x, 1);
                        break;
                    }
                }
            }
    };

})(typeof exports === 'undefined'? this: exports, typeof exports === 'undefined');
