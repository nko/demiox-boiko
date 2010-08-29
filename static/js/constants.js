(function(exports){
    var exports = exports || {}; //A hack so this code is accessible both client & serverside
    exports.W = 10;
    exports.Constants = {
        port : 80,
        tileSize : exports.W,
        tilesAcross : 90,
        tilesUp : 75,
        widthPX : 90 * exports.W,
        heightPX : 75 * exports.W,
        refreshRate : 45,
        distanceFrom00 : 5, //TODO make general
        Rect : function(x1, y1, x2, y2) {
            this.x1=x1;
            this.y1=y1;
            this.x2=x2;
            this.y2=y2;
        },
        Point : function(x, y) {
            var p = {};
            p.x=x;
            p.y=y;
            return p;
        },

        utils : {
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

    },

    };




})(typeof exports === 'undefined'? this: exports);
