(function(exports, typeOfInc){

    if (!typeOfInc)
        this.Constants = require('./constants').Constants;

    /*
     *
     * Player
     *
     * Distinguished from curPlayer; these are non playable characters, controlled by other people.
     */

    exports.Player = function(x, y, ID, color, isClient){
        this.x=x;
        this.y=y;
        this.ID=ID;
        this.color=color;

        if (typeof exports.Player.all == 'undefined') { //Static variable hack
            exports.Player.all = [];
        }

        if (!isClient) { 
            exports.Player.all.push(this);
        }
    }

    exports.Player.prototype = {
        draw : function(context) { 
            context.fillStyle = this.color;
            context.fillRect(this.x*W, this.y*W, W, W);
        },
    };




})(typeof exports === 'undefined'? this: exports, typeof exports === 'undefined');
