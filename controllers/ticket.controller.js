
const TicketService = require('../service/ticketService'),
    ViewingService = require('../service/viewingService'),
    ENV = require('../config');

class TicketController {

    constructor(connection)
    {
        this.conn = connection;
        this.viewingService = ViewingService;
        this.ticketService = TicketService;
        this.getTicketTemporaryTimeline(this.conn.socket);
        this.removeTicketTemporaryTimeline(this.conn.socket);
        this.setCommentData(this.conn.socket);
    }


    setCommentData(socket)
    {

        socket.on("setCommentData", (data) =>
        {
            this.ticketService.addCommentToReds(data.room,data.userId,null,data).then((result)=>{
                this.conn.io.to(socket.id).emit('unshiftComments', {data:result.data});
                this.sentCommentAfterTimeOut(result,socket.id,data.authToken,data.room,data.criptData,data);

            })
            // this.draftService.getDraftByTicketId(...data).then((draftData) =>
            // {
            //     this.conn.io.to(socket.id).emit('checkIndividualTicketDraftClient', {data:draftData});
            // })
        })
    }


    getTicketTemporaryTimeline(socket)
    {
        socket.on("getTicketTemporaryTimeline", (data) =>
        {
            this.viewingService.addView(data.room,data.userId,data.ticket_id,socket.id,data.user).then(()=>{
                this.viewingService.getViews(data.room,data.userId,data.ticket_id).then((res) =>
                {
                    socket.in(data.room).emit('viewUsers', res);

                    if(res.result && res.result[data.userId]){
                        delete res.result[data.userId];
                        // console.log(res)

                        this.conn.io.to(socket.id).emit('viewUsers', res);
                    }
                });
            });

            this.ticketService.getTicketTemporaryTimeline(data.room,data.userId,data.ticket_id).then((result)=>
            {
                this.conn.io.to(socket.id).emit('setDomTicketTemporaryTimeline', {data:result});
            })
        })
    }

    removeTicketTemporaryTimeline(socket)
    {
        socket.on("removeTicketTemporaryTimeline", (data) =>
        {
            this.ticketService.removeCommentInDraft(data.key,data.commentId);
        })
    }

    sentCommentAfterTimeOut(commentData,socketId,authToken,room,criptData,req)
    {


        setTimeout(()=>{
            // this.conn.io.to(socketId).emit('moveComments', {data:commentData});
            this.ticketService.removeCommentInDraft(commentData.key,commentData.commentId).then( (res ) =>
            {
                if(res){
                    switch (commentData.data.type) {
                        case 'comment':
                            this.ticketService.createTicket(authToken,criptData,room)
                                .then((res) => {
                                    console.log("adsaww",res)
                                    this.conn.io.to(socketId).emit('moveComments', {data:commentData,mailboxId:req.mailboxId,res:res,ticket:req.ticket});
                                    // Process html...
                                })
                                .catch( (err) =>
                                {
                                    this.conn.io.to(socketId).emit('errorComments', err);
                                    console.log('err',err);
                                    // Crawling failed...
                                });
                            break;
                        case 'note':
                            // console.log(authToken,criptData,room,req.ticket_id)
                            this.ticketService.createNote(authToken,criptData,room,req.ticket_id)
                                .then((res) => {
                                    this.conn.io.to(socketId).emit('moveComments', {data:commentData,mailboxId:req.mailboxId,res:res,ticket:req.ticket});
                                    // Process html...
                                })
                                .catch( (err) =>
                                {
                                    this.conn.io.to(socketId).emit('errorComments', err);
                                    console.log('err',err);
                                    // Crawling failed...
                                });
                            break;
                    }
                }

            })

        },3000)
    }



}

module.exports = TicketController;