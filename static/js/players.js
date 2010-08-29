(function(exports, typeOfInc){

    if (!typeOfInc) {
        this.Constants = require('./constants').Constants;
        this.Player = require('./players').Player;

    }

    /*
     *
     * Player
     *
     * Distinguished from curPlayer; these are non playable characters, controlled by other people.
     */

    var Player = function(x, y, ID, color, HP, kills, deaths, isClient){
        this.x=x;
        this.y=y;
        this.HP=HP;
        this.maxHP=10;
        this.kills=kills;
        this.deaths=deaths;

        this.ID=ID;
        this.name="";
        this.message="";
        this.color=color;
        this.lastUpdate=0;

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

            if (this.HP == 0) { //TODO change to ==
                var obj = Constants.utils.findObjectWithID(Player.all, bullet.creator);
                obj.kills++;
                this.deaths++;
                console.log ( "kills", obj.kills);
                console.log ( "deathd", this.deaths);
            }
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
