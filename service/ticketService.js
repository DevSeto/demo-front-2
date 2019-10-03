
const rp = require('request-promise'),
    ENV = require('../config');

const redis = require("redis"),
    util = require('util');

require('util.promisify').shim();

const promisify = util.promisify,
    ticketComment = 'ticketComment';

class TicketService {



    constructor()
    {
        this.backendUrl = ENV.backendUrl;
        this.ticketUrl =  this.backendUrl  +'/api/tickets/';
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

    /**
     * custom autoincrement
     * @param draftId
     * @param callback
     * @returns {*}
     */
    getAutoIncrement(draftId, callback)
    {
        if ( ! draftId )
        {
            return this.getAsync('commentId').then((id) =>
            {
                id = +id;
                id += 1;
                this.redisClient.set('commentId', id);
                return callback(id);
            });
        }

        return callback(draftId);
    }


    /**
     * set confirmed drafts
     * @param key
     * @param draftId
     * @param data
     * @returns {*}
     */

    addCommentToReds(room, userId, commentId, data)
    {
        return this.getAutoIncrement(commentId, (id) =>
        {
            data.draft_id = id;
            const key = `${ticketComment}:${room}:${userId}:${data.ticket_id}`;
            // return this.hsetAsync(key, id, JSON.stringify(data)).then(() => data);
            data.data.commentId = id;
            data.data.key = key;
            return this.hsetAsync(key, id, JSON.stringify(data)).then(() => {
                // return this.hgetAsync(key,id).then((response) =>
                // {
                return {key:key,commentId:id,data:data.data};
                // });
            });
        });
    }


    removeCommentInDraft(key, id ){
        return  this.hdelAsync(key, id).then((respons) => {
            console.log('removeCommentInDraft',respons);
            return !!respons;
        });
    }


    getTicketTemporaryTimeline(room, userId, ticketId)
    {
        const key = `${ticketComment}:${room}:${userId}:${ticketId}`;
        return this.hvalsAsync(key).then((data) => data);
    }

    createTicket(authorization, requestData, originUrl )
    {
        // var options = {
        //     "method": "POST",
        //     "url": this.ticketUrl +'comment',
        //     body: JSON.toString(requestData) ,
        //     "headers": {
        //         "authorization": authorization,
        //         "origin": ENV.protocol + originUrl + ENV.clientDomain,
        //         "cache-control": "no-cache",
        //         'Postman-Token': 'f01cb87e-3f0a-4641-8301-358933bcc7b6'
        //     }
        // };
        console.log(typeof  requestData)

        var options = { method: 'POST',
            url: 'http://nltestapi.birdtest.nl/api/tickets/comment',
            "headers": {
                "authorization": authorization,
                "origin": ENV.protocol + originUrl + ENV.clientDomain,
                "cache-control": "no-cache",
                'Postman-Token': 'f01cb87e-3f0a-4641-8301-358933bcc7b6'
            },
            body:requestData,
            json: true };

        return rp(options);

    }


    createNote(authorization, requestData, originUrl,ticketId )
    {

        var options = {
            "method": "POST",
            "url": this.ticketUrl  + requestData.ticket_id_hash + '/notes',
            body: requestData,
            json: true,
            "headers": {
                "authorization": authorization,
                "origin": ENV.protocol + originUrl + ENV.clientDomain,
                "cache-control": "no-cache",
                'Postman-Token': 'f01cb87e-3f0a-4641-8301-358933bcc7b6'
            }
        };

        console.log('note',options)
        return rp(options);

    }
}


module.exports = new TicketService();