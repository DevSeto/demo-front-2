
const DraftService = require('../service/draftService'),
    ViewingService = require('../service/viewingService'),
    ENV = require('../config');

class DraftController {

    constructor(connection)
    {
        this.viewingService = ViewingService;
        this.draftService = DraftService;
        this.conn = connection;
        this.newTicketDraft(this.conn.socket);
        this.getIndividualTicketDrafts(this.conn.socket);
        // this.sendNewTicketDraftData(this.conn.socket);
        this.sendNewTicketEvent(this.conn.socket);
        this.setindividualdraftData(this.conn.socket);
        this.createDraftIndividual(this.conn.socket);
        this.deleteDraftByTicketId(this.conn.socket);
        this.deleteDraftTicket(this.conn.socket);
        this.getDrafts(this.conn.socket);
    }


    //--------------  INDIVIDUAL PART ----------------------------//

    /**
     * send data after key up in individual textarea
     */

    setindividualdraftData(socket)
    {
        socket.on("setindividualdraftData", (data) =>
        {

            let user_id  = data.user_id;
            let mailbox_id = data.ticket.mailbox_id;
            let room = data.room;
            let draft_id = data.ticket.draft_id;
            // console.log('setindividualdraftData1',     room,
            //     user_id,
            //     mailbox_id,
            //     data.ticket.ticketDraft)

            if(
                data.ticket.ticketDraft
                && !data.ticket.ticketDraft.reply
                && !data.ticket.ticketDraft.comment_files.length
                && !data.ticket.ticketDraft.note_files.length
                && !data.ticket.ticketDraft.forward_files.length
                && !data.ticket.ticketDraft.note
                && !data.ticket.ticketDraft.forwarding_emails.length
                && !data.ticket.ticketDraft.forward
            ) {

                if (data.ticket.ticketDraft) {
                    this.draftService.removeDraft(
                        room,
                        user_id,
                        mailbox_id,
                        draft_id,
                        socket.id,
                        data.ticket.id
                    ).then((res) => {
                        if(res){
                            this.conn.io.to(socket.id).emit('deleteIndividualTicketDraft',
                                {
                                    success: true,
                                    data: {
                                        mailbox_id: mailbox_id,
                                    }
                                });
                        }
                    })
                }
            }else
            {

                if(!data.ticket.isDraft){
                    data.ticket.isDraft = !!0;
                }
                this.draftService.addDraft(
                    room,
                    user_id,
                    mailbox_id,
                    draft_id,
                    data.ticket,
                    socket.id
                )
                    .then( (htmlString) =>  {
                        this.conn.io.to(socket.id).emit('sendIndividualTicketDraftClient', {data:htmlString});
                    }).catch(function (err) {
                    // Crawling failed...
                });
            }
        })
    }


    getIndividualTicketDrafts(socket)
    {

        socket.on("getIndividualTicketDrafts", (data) =>
        {

            this.draftService.getDraftByTicketId(...data).then((draftData) =>
            {
                this.conn.io.to(socket.id).emit('checkIndividualTicketDraftClient', {data:draftData});
            })
        })
    }


    /**
     * sent data to redis
     */

    createDraftIndividual(socket)
    {

        socket.on("setIndividualDraftToRedis", (data) =>
        {
            console.log('setindividualdraftData2')
            this.setIndividualDraftToRedis(socket.id);
            this.viewingService.removeView(socket.id).then((res)=>{
                // console.log('viewUsers', res)
                if(!res.result){
                    res['result'] = {};
                }
                socket.to(res.room).emit('viewUsers', res);

            });
        });

        socket.on("disconnect", (data) =>
        {
            this.viewingService.removeView(socket.id).then((res)=>{
                if(!res.result){
                    res['result'] = {};
                }
                socket.to(res.room).emit('viewUsers', res);
            });

            this.setIndividualDraftToRedis(socket.id);
        });
    }

    /**
     * after destroy component or after disconnect events sent draft data to db
     */

    setIndividualDraftToRedis(socketId)
    {

        this.draftService.getNotReadyDrafts(socketId).then((individualTicketDrafts)=>
        {
            if(individualTicketDrafts && individualTicketDrafts.dataDraft.length){
                individualTicketDrafts.dataDraft.forEach( ( res) =>
                {
                    res = JSON.parse(res);
                    res.isDraft = !!1;
                    this.draftService.setDraftData(individualTicketDrafts.key,res.draft_id,res).then((drafts)=>{
                        this.conn.io.to(socketId).emit('mailboxDraftData', {drafts:drafts.drafts,mailbox_id:drafts.mailbox_id});
                    })


                });
            }
        })
    }


    //---------------------- END PART --------------------//




    //---------------------- NEW TICKET PART --------------//


    /***
     * send data after key up all input in create ticket form
     * @param socket
     */

    newTicketDraft(socket)
    {
        socket.on("newTicketDraft", (data) =>
        {
            if(
                data.ticket
                && !data.ticket.body
                && !data.ticket.customer_name
                && !data.ticket.customer_email
                && !data.ticket.attachments.length
                && !data.ticket.subject
            ) {
                if (data.ticket.ticketDraft) {
                    this.draftService.removeDraft(
                        data.room,
                        data.user_id,
                        data.ticket.mailbox_id,
                        data.draft_id,
                        socket.id,
                        data.ticket.id
                    )
                        .then((res) => {
                            if(res){
                                this.conn.io.to(socket.id).emit('deleteIndividualTicketDraft',
                                    {
                                        success: true,
                                        data: {
                                            mailbox_id:data.ticket.mailbox_id,
                                            draft_id:data.draft_id,
                                        }
                                    });
                            }
                        })
                }
            }else
            {
                if(data.ticket.mailbox_id){
                    this.draftService.addDraft(
                        data.room,
                        data.user_id,
                        data.ticket.mailbox_id,
                        data.ticket.draft_id,
                        data.ticket,
                        socket.id
                    ).then((htmlString) =>
                    {
                        this.conn.io.to(socket.id).emit('sendCreateTicketDraftClient', {data:htmlString});
                    })
                }
                if(data.mailboxes.length > 1){
                    data.mailboxes.forEach(( mailbox, index ) => {
                        if(mailbox.id != data.ticket.mailbox_id){
                            this.draftService.removeDraftAfterChangeMailbox(
                                data.room,
                                data.user_id,
                                mailbox.id,
                                data.draft_id,
                                socket.id,
                                data.ticket.id
                            )
                                .then((res) => {
                                    if(res){
                                        this.conn.io.to(socket.id).emit('deleteIndividualTicketDraft',
                                            {
                                                success: true,
                                                data: {
                                                    mailbox_id:mailbox.id,
                                                    draft_id:data.draft_id,
                                                }
                                            });
                                    }
                                })
                        }
                    });
                }
                // console.log('add dr',  data.room,
                //     data.user_id,
                //     data.ticket.mailbox_id,
                //     data.ticket.draft_id,
                //     socket.id)

            }

        });
    }

    sendNewTicketEvent(socket)
    {
        socket.on("sendNewTicketDraftData", (data) => {

            this.setIndividualDraftToRedis(socket.id);

        })
    }




    deleteDraftTicket(socket)
    {
        socket.on("deleteDraftTicket", (data) =>
        {

            if(data.ticketIds){
                data.ticketIds.forEach( ( id) => {
                    // console.log('ata.ticketIds',id)

                    this.draftService.deleteDrafts(
                        data.room,
                        data.user_id,
                        data.mailbox_id,
                        id
                    )
                })
            }
            // this.setIndividualDraftData(socket.id);

        })
    }



    deleteDraftByTicketId(socket)
    {
        socket.on("deleteDraftByTicketId", (data) =>
        {

            if(data.ticketIds){
                data.ticketIds.forEach( ( id) => {
                    // console.log('ata.ticketIds',id)

                    this.draftService.deleteDraftByTicketId(
                        data.room,
                        data.user_id,
                        data.mailbox_id,
                        id
                    )
                });
                this.conn.io.to(socket.id).emit('deleteIndividualTicketDraft',
                    {
                        success: true,
                        data: {
                            mailbox_id:  data.mailbox_id,
                            count:data.ticketIds.length
                        }
                    });
            }
            // this.setIndividualDraftData(socket.id);

        })
    }


    /**
     * get Draft list
     * @param socket
     */

    getDrafts(socket)
    {
        socket.on("getDrafts", (data) => {

            this.draftService.getDrafts(data.room, data.userId, data.mailBoxId).then((drafts) =>{
                this.conn.io.to(socket.id).emit('mailboxDraftData', {drafts:drafts,mailbox_id:data.mailBoxId});
            });

        })
    }


}

module.exports = DraftController;