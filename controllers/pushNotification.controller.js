
const    ENV = require('../config'),
 webpush = require('web-push');

class PushNotificationController {

    constructor()
    {
        this.senderServerData = {};

    }

    setConnection(data)
    {
        this.conn = data;
        this.setPushNotificationData(this.conn.socket);
        this.logout(this.conn.socket);
    }



    logout(socket)
    {
        socket.on("logoutUser", (data) =>
        {
          console.log(data);
            if(this.senderServerData[data.room] && this.senderServerData[data.room][data.userId+ data.authToken]){
                delete  this.senderServerData[data.room][data.userId+ data.authToken];
            }
        })
    }


    setPushNotificationData(socket)
    {
        socket.on("setPushNotificationData", (data) =>{
            // this.clieantId = data.clieantId;
            // //this.createAdapter(this.server);
            // this.userRoom = data.userRoom; //subdomain
            //
            if(!this.senderServerData[data.userRoom]){
                this.senderServerData[data.userRoom] = {};
            }

            this.senderServerData[data.userRoom][data.clieantId+ data.authToken] = {
                userRoom:data.userRoom,
                senderBrowserData:data.senderBrowserData,
                authToken:data.authToken,
                clieantId:data.clieantId
            };
            // console.log(this.senderServerData    );

        });
    }

    /**
     * (add check user logged)
     * @param userId
     * @param room
     * @param data
     */



     sendPushNotification( userId,room, data )
     {
         webpush.setVapidDetails(
             'mailto:'+room+'@'+ENV.clientDomainTw,
             'BE8PyI95I_jBIfb_LTS_nkUJnOwjLP2zAaGBSFEi3jmFJ3l5ox7-NtNqrVuyPL4Qmt4UxDI-YgwYI1sEMIpoU90',
             'Rs4ALPgHaAgjaOUrihdpNCaSWtUTPu5ZyU-oHBetX0E'
         );
        if(this.senderServerData[room] && Object.keys(this.senderServerData[room]).length){
            Object.keys(this.senderServerData[room]).forEach( ( key ) =>
            {
                let item = this.senderServerData[room][key];
                // console.log(userId,room,item);
                console.log(userId,item)
                if(userId == item.clieantId){
                    const notification = JSON.stringify(data);
                    webpush.sendNotification(item.senderBrowserData, notification);
                }

            })
        }

    }


}

module.exports = PushNotificationController;