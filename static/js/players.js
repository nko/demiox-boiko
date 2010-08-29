(function(exports, typeOfInc){

    if (!typeOfInc)
        this.Constants = require('./constants').Constants;

    /*
     *
     * Player
     *
     * Distinguished from curPlayer; these are non playable characters, controlled by other people.
     */

    var Player = function(x, y, ID, color, HP, isClient){
        this.x=x;
        this.y=y;
        this.HP=HP;
        this.ID=ID;
        this.name="";
        this.message="";
        this.color=color;

        this.rect = Constants.Rect(this.x*10, this.y*10, this.x*10+10, this.y*10+10);

        if (typeof Player.all == 'undefined') { //Static variable hack
            Player.all = [];
        }

        if (!isClient) { 
            Player.all.push(this);
        }
    }

    Player.prototype = {
        move : function(x, y){
            this.x=x;
            this.y=y;
            this.rect = Constants.Rect(this.x*10, this.y*10, this.x*10+10, this.y*10+10);
        },
        draw : function(context) { 
            context.fillStyle = this.color;
            context.fillRect(this.x*W, this.y*W, W, W);
        },
        hit : function(bullet){
            this.HP -= bullet.DMG;
        },
        destroy :
            function() {
                for (x in Player.all) { 
                    if (Player.all[x].ID == this.ID) { 
                        Player.all.splice(x, 1);
                        break;
                    }
                }
            }
    };
    
    exports.Player = Player;


})(typeof exports === 'undefined'? this: exports, typeof exports === 'undefined');
