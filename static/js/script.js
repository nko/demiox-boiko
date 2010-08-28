$(function() {
    io.setPath('/client/');
    socket = new io.Socket(null, { 
        port: 80,
        transports: ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling']
    });
    socket.connect();
    
    $('#sender').live('click', function() {
        socket.send("Message Sent on " + new Date());
    });
    
    socket.on('message', function(data){
        $('#reciever').append('<li>' + data + '</li>');  
    });
});