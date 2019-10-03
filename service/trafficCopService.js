
const rp = require('request-promise'),
    ENV = require('../config');

const redis = require("redis"),
    util = require('util');

require('util.promisify').shim();

const promisify = util.promisify,
    trCop = 'trCop';

class TrafficCopService {
    
    constructor()
    {
        console.log("traggick")
        this.redisClient = redis.createClient({host : 'localhost', port : 6379});
        this.multi = this.redisClient.multi();
        this.hsetAsync = promisify(this.redisClient.hset).bind(this.redisClient);
        this.hdelAsync = promisify(this.redisClient.hdel).bind(this.redisClient);
        this.delAsync = promisify(this.redisClient.del).bind(this.redisClient);
        this.hvalsAsync = promisify(this.redisClient.hvals).bind(this.redisClient);
        this.hgetAsync = promisify(this.redisClient.hget).bind(this.redisClient);
        this.getAsync = promisify(this.redisClient.get).bind(this.redisClient);
    }

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

    addTrCopDataToRedis(room, userId, commentId, data, mailboxId)
    {
        return this.getAutoIncrement(commentId, (id) =>
        {
            const key = `${trCop}:${room}:${userId}:${mailboxId}`;
            data.cop_id = id;
            data.opened_count = 1;
            console.log('addTrCopDataToRedis',key)
            return this.hsetAsync(key, id, JSON.stringify(data)).then(() => {});
        });
    }

    getTrCopData(room, userId, mailboxId)
    {

        const key = `${trCop}:${room}:${userId}:${mailboxId}`;

        return this.hvalsAsync(key).then((data) => data);
    }

    getIndivTrCopData(room, userId, mailboxId, trCopId)
    {
        const key = `${trCop}:${room}:${userId}:${mailboxId}`;
        console.log("getIndivTrCopData",`${key}`, trCopId)
        if(!trCopId){
            trCopId = 0;
        }
        return this.hgetAsync(`${key}`, trCopId)
            .then((copId) => {
                if(copId)
                   return {individualTrCopDraft:JSON.parse(copId)};
                
                return false;
            })
    }

    deleteTrafficCopData(room, userId, mailBoxId, cop_Id)
    {
        const key = `${trCop}:${room}:${userId}:${mailBoxId}`;

        return this.hdelAsync(key, cop_Id).then(() => !!1);
    }
}

module.exports = new TrafficCopService();