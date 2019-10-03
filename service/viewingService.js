
const rp = require('request-promise'),
    ENV = require('../config');

const redis = require("redis"),
    util = require('util');

require('util.promisify').shim();

const promisify = util.promisify,
    relationShip = 'RelationShipOnlineUser';
    onlineUser = 'onlineUser';

class ViewingService {



    constructor()
    {
        this.redisClient = redis.createClient();
        this.multi = this.redisClient.multi();
        this.hsetAsync = promisify(this.redisClient.hset).bind(this.redisClient);
        this.hdelAsync = promisify(this.redisClient.hdel).bind(this.redisClient);
        this.delAsync = promisify(this.redisClient.del).bind(this.redisClient);
        this.hvalsAsync = promisify(this.redisClient.hvals).bind(this.redisClient);
        this.hgetAsync = promisify(this.redisClient.hget).bind(this.redisClient);
        this.getAsync = promisify(this.redisClient.get).bind(this.redisClient);
        // this.redisClient.set('commentId',0);

    }

    getViews (room, userId, ticket_id)
    {

        const key = `${onlineUser}:${room}`;
        return this.hgetAsync(key,ticket_id).then((data) =>
        {
            data = JSON.parse(data);
            // if(data && data[userId]){
            //    delete data[userId];
            //
            // }

            if(data && Object.keys(data).length){
                return {result:data,ticketId:ticket_id};
            }
           return false;
        })

    }


    addView (room, userId, ticket_id, socketId,user)
    {

        const key = `${onlineUser}:${room}`;

        this.hsetAsync(relationShip, socketId ,
            JSON.stringify({
                room:room,
                key:key,
                ticketId:ticket_id,
                userId:userId
            })
        )

        return this.hgetAsync(key,ticket_id).then((data) =>
            {

                if(!data ){

                    data = Object.create(null,{});

                }else{
                    data = JSON.parse(data);
                }
                // return true;

                // if(!data[userId]){
                    data[userId] = user;
                // }
                // console.log('addView',key,data,ticket_id)

                return this.hsetAsync(key, ticket_id ,JSON.stringify(data ));
            }
        );

    }
    removeView(socketId){
        // console.log('delete',relationShip, socketId);
        return this.hgetAsync(relationShip,socketId).then((relationShipData) =>
        {
            relationShipData = JSON.parse(relationShipData);
            this.hdelAsync(relationShip, socketId).then((res) => {

                // console.log(res)
            });

            if(relationShipData){
               return this.hgetAsync(relationShipData.key,relationShipData.ticketId).then((data) =>
                {
                    data = JSON.parse(data);


                    if(data && data[relationShipData.userId] != -1){
                        delete data[relationShipData.userId];
                    }

                    if(data && Object.keys(data).length){
                        this.hsetAsync(relationShipData.key,relationShipData.ticketId ,JSON.stringify(data ));
                    }else{
                        this.hdelAsync(relationShipData.key,relationShipData.ticketId)
                    }
                    // console.log(JSON.parse(results))

                    return {ticketId:relationShipData.ticketId,room:relationShipData.room,result:data};


                })
            }else{
                return {};
            }



        })
    }

}


module.exports = new ViewingService();