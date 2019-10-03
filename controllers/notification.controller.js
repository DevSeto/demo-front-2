
const Helper = require("../helper"),
    Draft = require("./draft.controller"),
    PushNot = require("./pushNotification.controller"),
    TicketController = require("./ticket.controller"),
    TrafficCopController = require("./trafficCop.controller");

class NotificationController {

    constructor(io)
    {
        this.io = io;

        this.pushNot = new PushNot();
        this.io.on('connection',(socket) =>
        {

            socket.on( 'connection', (data) =>
            {
                // console.log(data.user_id);
		        const room = Helper.getSubdomain(socket.handshake.headers.origin);
		        socket.join(room + '' +data. user_id);
                //this.socketOn(socket, data.user_id);
            });
             this.socketOn(socket)
            // this.socketOn(socket)
        });

    }

    socketOn(socket )
    {
        const room = Helper.getSubdomain(socket.handshake.headers.origin);

        if ( room )
        {
            socket.join(room);
 //           socket.join(room + '' + user_id);
            this.socket = socket;
            this.draft = new Draft({
                io: this.io,
                socket: this.socket,
                room
            });
            this.pushNot.setConnection({
                io: this.io,
                socket: this.socket,
                room
            })


            this.ticketController = new TicketController({
                io: this.io,
                socket: this.socket,
                room
            });

           this.trafficCopController = new TrafficCopController({
               io: this.io,
               socket: this.socket,
               room
           });
        }

        this.changeTicketStatus(socket);
        this.addLabel(socket);
        this.mergeLabels(socket);
        this.updateCompanyData(socket);
        this.removeLabel(socket);
        this.addSnooze(socket);
        this.changeTicket(socket);
        this.updateCannedReplies(socket);
        this.updateChangeMailboxData(socket);
        this.updateTicketAssignUser(socket);
        this.clientMergeTickets(socket);
        this.changeUsersData(socket);

    }

    updateChangeMailboxData(socket)
    {
        socket.on("updateChangeMailboxData", (data) =>
        {
            socket.to(data.room).emit("changeMailboxData", data);
        })
    }



    updateCannedReplies(socket)
    {
        socket.on("updateCannedReplies", (data) =>
        {
            socket.to(data.room).emit("changeCannedReplies", data);
        })
    }

    changeTicketStatus(socket)
    {
        socket.on("changeStatus", (data) =>
        {
            socket.to(data.room).emit("updateStatus", data);
        })
    }






    addLabel(socket){
        socket.on("sentNewLabels", (data) =>
        {
            socket.to(data.room).emit("addLabels", data);
        })
    }

    removeLabel(socket){
        socket.on("removeLabel", (data) =>
        {
            socket.to(data.room).emit("removeLabelInTicket", data.data);
        })
    }



    mergeLabels(socket)
    {
        socket.on("sentMergeLabels", (data) =>
        {
            socket.to(data.room).emit("applyLabelsToTicket", data);
        })
    }


    updateTicketAssignUser(socket)
    {
        socket.on("changeAssigne", (data) =>
        {
            socket.to(data.room).emit("updateTicketAssignUser", data);
        })
    }


    changeTicket(socket)
    {
        socket.on("clientChangeTicket", (data) =>
        {

            this.io.in(data.room).emit("changeTicket", data);
        })
    }


    addSnooze(socket)
    {
        socket.on("addSnooze", (data) =>
        {

            socket.to(data.room).emit("setSnooze", data);
        })
    }



    seen(data)
    {
        this.io.in(data.user_room).emit('seenEvent', data);
    }


    changeUsersData(socket)
    {
        socket.on("changeUsersData", (data) =>
        {

            socket.to(data.room).emit("updateUsers", data);
        })
    }


    clientMergeTickets(socket)
    {
        socket.on("clientMergeTickets", (data) =>
        {

            socket.to(data.room).emit("mergeTickets", data);
        })
    }



    updateCompanyData(socket)
    {
        socket.on("changeCompany", (data) =>
        {

            socket.to(data.room).emit("updateCompanyData", data);
        })
    }


    newTicket(ticket)
    {
        if(ticket.users.length)
        {
            ticket.users.forEach( ( user) =>
            {
		        // console.log('user',user);

                ticket.data_notification.message = user.message;
                if(user.notify){
                    ticket.data_notification.send_by = "ticket";

                    this.pushNot.sendPushNotification(user.user_id,ticket.room,ticket.data_notification);
                    ticket['userData'] = user;
                }
                this.io.in(ticket.room + '' + user.user_id).emit('newTicket', {data:ticket.data_notification});


            })
        }
    }


    newReplies(replise)
    {
        if(replise.users.length)
        {
            replise.users.forEach( ( user) =>
            {
		        // console.log('user',user);
                replise.data_notification.message = user.message;
                if(user.notify){
                    replise.data_notification.send_by = "replise";
                    this.pushNot.sendPushNotification(user.user_id,replise.room,replise.data_notification);
                    replise['userData'] = user;
                }
                this.io.in(replise.room + '' + user.user_id).emit('newReplies', {data:replise.data_notification});

            })
        }
    }


    checkForwarding(data)
    {
        if(this.io.in(data.room + '' + data.user_id))
        {
            this.io.in(data.room + '' + data.user_id).emit('checkForwarding',  {success: true, data: data});
        }
    }

    newNote(note)
    {
        if(note.users.length)
        {
            note.users.forEach( ( user) =>
            {
                note.data_notification.message = user.message;
                if(user.notify){
                    note.data_notification.send_by = "note";
                    this.pushNot.sendPushNotification(user.user_id,note.room,note.data_notification);
                    note['userData'] = user;
                }
                this.io.in(note.room + '' + user.user_id).emit('newNote', {data:note.data_notification});

            })
        }
    }



    ticketAssign(assignData)
    {
        if(assignData.users.length)
        {
            assignData.users.forEach( ( user) =>
            {
                assignData.data_notification.message = user.message;

                if(user.notify){
                    assignData.data_notification.send_by = "ticketAssign";
                    this.pushNot.sendPushNotification(user.user_id,assignData.room,assignData.data_notification);
                    assignData['userData'] = user;
                }
                this.io.in(assignData.room + '' + user.user_id).emit('ticketAssign', {data:assignData.data_notification});

            })
        }
    }


    ticketComment( comment, room )
    {
        this.io.in(room).emit('ticketComment', comment);
    }


    step_first_email(data)
    {
        this.io.in(data.room + '' + data.user_id).emit('stepFirstEmail', {data});
    }
    addHistory(historyData)
    {
        this.io.in(historyData.room).emit("addHistory", historyData);
    }
}
module.exports = NotificationController;
