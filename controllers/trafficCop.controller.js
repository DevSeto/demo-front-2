
const TrafficCopService = require('../service/trafficCopService'),
    ENV = require('../config');

class TrafficCopController {

    constructor(connection)
    {
        this.conn = connection;
        this.trafficCopService = TrafficCopService;
        this.setTrCopData(this.conn.socket);
        this.getTrCopData(this.conn.socket);
        this.getIndividualTrCop(this.conn.socket);
        this.deleteTrafficCopByTicketId(this.conn.socket);
    }

    setTrCopData(socket)
    {

        socket.on("setTrCopData", (data) =>
        {
            this.trafficCopService.addTrCopDataToRedis(data.room, data.userId, data.ticket_id, data.ticket, data.mailboxId)
                .then((result)=>{
                    this.trafficCopService.getTrCopData(data.room, data.userId, data.mailboxId)
                        .then((drafts) =>{
                            this.conn.io.to(socket.id).emit('trCopCount', {count: drafts.length, status: 'attention', mailbox_id: data.mailboxId});
                        });
                })
        })
    }

    getTrCopData(socket)
    {
        socket.on("getTrCopData", (data) => {

            this.trafficCopService.getTrCopData(data.room, data.userId, data.mailBoxId)
                .then((drafts) =>{
                    console.log("draftsgetTrCopData",drafts)
                    this.conn.io.to(socket.id).emit('trCopDraftData', {drafts: drafts, mailbox_id: data.mailBoxId});
                });
        })
    }

    getIndividualTrCop(socket)
    {
        socket.on("getIndividualTrCopData", (data) =>
        {
            this.trafficCopService.getIndivTrCopData(...data)
                .then((trCopData) => {
                    if (trCopData){
                        trCopData.individualTrCopDraft.isDraft = true;
                        console.log(trCopData)

                        this.conn.io.to(socket.id).emit('indivTrCopData', {data: trCopData});
                    }
                })
        })
    }

    deleteTrafficCopByTicketId(socket)
    {
        socket.on("deleteTrafficCopByTicketId", (data) =>
        {
            if (data.howDelete) {
                let delCount = 0;

                if(data.ticketIds.length){
                    data.ticketIds.forEach((ticketId) => {
                        this.trafficCopService.getTrCopData(data.room, data.user_id, data.mailbox_id)
                            .then((drafts) =>{
                                drafts.forEach((trCop) => {
                                    trCop = JSON.parse(trCop);
                                    if (trCop.id == ticketId) {
                                        delCount++;
                                        this.trafficCopService.deleteTrafficCopData(
                                            data.room,
                                            data.user_id,
                                            data.mailbox_id,
                                            trCop.id
                                        )
                                    }
                                });
                            });
                    });
                    setTimeout(() => {
                        this.conn.io.to(socket.id).emit('deleteTrafficCopTicket',
                            {
                                success: true,
                                data: {
                                    mailbox_id: data.mailbox_id,
                                    count: delCount
                                }
                            });
                    }, 0)
                }
            } else {
                if(data.ticketIds.length){
                    data.ticketIds.forEach((cop_id) => {
                        this.trafficCopService.deleteTrafficCopData(
                            data.room,
                            data.user_id,
                            data.mailbox_id,
                            cop_id
                        )
                    });
                    this.conn.io.to(socket.id).emit('deleteTrafficCopTicket',
                        {
                            success: true,
                            data: {
                                mailbox_id: data.mailbox_id,
                                count: data.ticketIds.length
                            }
                        });
                }
            }
        })
    }
}

module.exports = TrafficCopController;