const redis = require("redis"),
    util = require('util');

require('util.promisify').shim();

const promisify = util.promisify,
    draftHashKey = 'draft',
    relationship = 'relationship',
    ticketDraftIds = 'ticketDraftIds',
    notReady = 'notReady';

class DraftService {

    constructor() {
        this.redisClient = redis.createClient({host : 'localhost', port : 6379});
        this.multi = this.redisClient.multi();
        this.hsetAsync = promisify(this.redisClient.hset).bind(this.redisClient);
        this.hdelAsync = promisify(this.redisClient.hdel).bind(this.redisClient);
        this.delAsync = promisify(this.redisClient.del).bind(this.redisClient);
        this.hvalsAsync = promisify(this.redisClient.hvals).bind(this.redisClient);
        this.hgetAsync = promisify(this.redisClient.hget).bind(this.redisClient);
        this.getAsync = promisify(this.redisClient.get).bind(this.redisClient);
        // this.redisClient.set('draft_ids',0);
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
            return this.getAsync('draft_ids').then((id) => {
                id = +id;
                id += 1;
                this.redisClient.set('draft_ids', id);
                return callback(id);
            });
        }

        return callback(draftId);
    }


    /**
     * add draft after key-pres(not confirmed)
     * @param room
     * @param userId
     * @param mailBoxId
     * @param draftId
     * @param data
     * @param socketId
     * @returns {*}
     */
    addDraft( room, userId, mailBoxId, draftId, data, socketId )
    {
        let key = `${draftHashKey}:${room}:${userId}:${mailBoxId}`;
        if(!data.isDraft){
            key = `${notReady}:${room}:${userId}:${mailBoxId}`;

            this.hsetAsync(relationship, socketId ,
                JSON.stringify({
                    notReady:key,
                    draft:`${draftHashKey}:${room}:${userId}:${mailBoxId}`

                })
            ).then(() => data);
        }
        return  this.setDraftData(key,draftId, data);

    }

    /**
     * set confirmed drafts
     * @param key
     * @param draftId
     * @param data
     * @returns {*}
     */

    setDraftData(key,draftId, data)
    {
        return this.getAutoIncrement(draftId, (id) =>
        {
            data.draft_id = id;
            if(data.isDraft && data.ticket_id_hash){
                this.hsetAsync(`${ticketDraftIds}:${key}`, data.id, id).then(() => data);
            }
            // return this.hsetAsync(key, id, JSON.stringify(data)).then(() => data);
            return this.hsetAsync(key, id, JSON.stringify(data)).then(() => {
                return this.hvalsAsync(key).then((dataDrafts) => {
                    return {individualDraft:data,drafts:dataDrafts,mailbox_id:data.mailbox_id};
                });
            });
        });
    }


    /**
     * remove drafts
     * @param room
     * @param userId
     * @param mailBoxId
     * @param draftHash
     * @param socketId
     * @param ticketId
     * @returns {PromiseLike<T | never> | Promise<T | never>}
     */

    removeDraft( room, userId, mailBoxId, draftHash,socketId, ticketId )
    {
        const key = `${draftHashKey}:${room}:${userId}:${mailBoxId}`;
        const ticketDraftIdsKey = `${ticketDraftIds}:${key}`;
        const notReadykey = `${notReady}:${room}:${userId}:${mailBoxId}`;
        if(ticketId){
            this.hdelAsync(ticketDraftIdsKey, ticketId).then(() => !!1);

        }
        if(!draftHash){
            draftHash = 0;
        }
        this.hdelAsync(relationship, socketId).then(() => !!1);
        this.hdelAsync(notReadykey, draftHash).then(() => !!1);
        return this.hdelAsync(key, draftHash).then((data) => data);

    }

    removeDraftAfterChangeMailbox( room, userId, mailBoxId, draftHash,socketId, ticketId )
    {
        const key = `${draftHashKey}:${room}:${userId}:${mailBoxId}`;
        const ticketDraftIdsKey = `${ticketDraftIds}:${key}`;
        const notReadykey = `${notReady}:${room}:${userId}:${mailBoxId}`;
        if(ticketId){
            this.hdelAsync(ticketDraftIdsKey, ticketId).then(() => !!1);

        }
        if(!draftHash){
            draftHash = 0;
        }
        this.hdelAsync(notReadykey, draftHash).then(() => !!1);

        return this.hdelAsync(key, draftHash).then((data) => data);

    }
    /**
     * get all draft from mailbox
     * @param room
     * @param userId
     * @param mailBoxId
     * @returns {PromiseLike<T | never> | Promise<T | never>}
     */
    getDrafts(room, userId, mailBoxId)
    {
        const key = `${draftHashKey}:${room}:${userId}:${mailBoxId}`;
        return this.hvalsAsync(key).then((data) => data);
    }


    /**
     * get not ready drafts by socket id
     * @param socketId
     * @returns {PromiseLike<T | never> | Promise<T | never>}
     */

    getNotReadyDrafts(socketId)
    {
        return this.hgetAsync(relationship,socketId).then((data) =>
        {
            this.hdelAsync(relationship, socketId).then(() => !!1);
            data = JSON.parse(data);
            if(data){
                return this.hvalsAsync(data.notReady).then((dataDraft) => {
                    this.delAsync(data.notReady).then(() => !!1);
                    return {dataDraft :dataDraft,key:data.draft};
                });
            }
            return false;

        });
    }


    deleteDrafts(room, userId, mailBoxId, draftId)
    {
        const key = `${draftHashKey}:${room}:${userId}:${mailBoxId}`;
        // console.log(key,draftId);
        return this.hdelAsync(key, draftId).then(() => !!1);
    }

    /**
     * get draft by ticket id (for individual ticket)
     * @param room
     * @param userId
     * @param mailBoxId
     * @param ticketId
     * @returns {PromiseLike<T | never> | Promise<T | never>}
     */
    getDraftByTicketId(room, userId, mailBoxId, ticketId)
    {
        let key = `${draftHashKey}:${room}:${userId}:${mailBoxId}`;
        return this.hgetAsync(`${ticketDraftIds}:${key}`,ticketId).then((draftId) =>
        {
            if(draftId){
                return this.hgetAsync(key,draftId).then((data) =>
                    {
                        if(data){
                            return {individualDraft:JSON.parse(data)};
                        }
                        return false;
                    }
                )

            }
            return false;
        })

    }


    deleteDraftByTicketId(room, userId, mailBoxId, ticketId)
    {
        let key = `${draftHashKey}:${room}:${userId}:${mailBoxId}`;
        return this.hgetAsync(`${ticketDraftIds}:${key}`,ticketId).then((draftId) =>
        {
            if(draftId){
                return  this.hdelAsync(key, draftId).then(() => !!1);

            }
            return false;
        })
    }


}

module.exports = new DraftService();


