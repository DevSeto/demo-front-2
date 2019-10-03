// var fs = require('fs');
// // var status = require('http-status');
// // var privateKey  = fs.readFileSync('/home/birddeskdev01/ssl/birddesk-wildcard-ssl.key', 'utf8');
// // var certificate = fs.readFileSync('/home/birddeskdev01/ssl/2_birddesk.com.crt', 'utf8');
// // var ca = fs.readFileSync('/home/birddeskdev01/ssl/1_root_bundle.crt', 'utf8');
// // var credentials = {key: privateKey, cert: certificate,ca: ca};
// //
// // let app = require('express')(),
// //     https = require('https').createServer(credentials, app),
// //     io = require('socket.io')(https.listen(3000)),
// //     bodyParser     =         require("body-parser"),
// //     NotificationController = require("./controllers/notification.controller");
// // https.setMaxListeners(100000);
// // app.use(bodyParser.urlencoded({ extended: false }));
// // app.use(bodyParser.json());
//
//
// let app = require('express')(),
//     https = require('http').createServer( app),
//     io = require('socket.io')(https.listen(3000)),
//     NotificationController = require("./controllers/notification.controller");
//
// var bodyParser     =         require("body-parser");
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());
//
//
//
//
//

var fs = require('fs');
var status = require('http-status');
var privateKey  = fs.readFileSync('/etc/nginx/ssl/newssl/private_birdtest.nlnew.key', 'utf8');
var certificate = fs.readFileSync('/etc/nginx/ssl/newssl/__birdtest_nl.crt', 'utf8');
var ca = fs.readFileSync('/etc/nginx/ssl/newssl/__birdtest_nl.ca-bundle', 'utf8');
var credentials = {key: privateKey, cert: certificate,ca: ca};

let app = require('express')(),
    https = require('https').createServer(credentials, app),
    io = require('socket.io')(https.listen(3000)),
    bodyParser     =         require("body-parser"),
    NotificationController = require("./controllers/notification.controller");
https.setMaxListeners(100000);
app.use(bodyParser.urlencoded({ extended: false ,limit: '50mb'}));
app.use(bodyParser.json());

NotificationController = new NotificationController(io);


app.get('/notification/ticket', (req, res) => {
//    NotificationController.newTicket(req, req.query.room);
    res.status(200).send({success:!!1});

    res.end();
});
app.post('/ticket_draft', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    console.log(req)
    NotificationController.draft.draftService.setDraftData(req.body.key,null,req.body.data);
    res.status(200).send({success:!!1});

    res.end();
});



app.post('/notification', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    console.log('/notification/hist');
    if(req.body.type == "step_first_email"){
        NotificationController.step_first_email(req.body);

    }else{

        NotificationController.addHistory(req.body);
    }
    res.status(200).send({success:!!1});
    res.end();
});

app.post('/notification/user_note', (req, res) => {
    // NotificationController.newTicket(req, req.query.room);
    res.status(200).send({success:!!1});
    res.end();
});

app.post('/notification/new_ticket', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    console.log('/notification/ticket',req.body);
    NotificationController.newTicket(req.body);
    res.status(200).send('ok');
    res.end();
});


/**
 * replies part
 */

app.post('/notification/customer_replies_to_unassigned_ticket', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    console.log('/notification/usrrp',req.body);
    NotificationController.newReplies(req.body);
    res.status(200).send({success:!!1});
    res.end();
    // NotificationController.newTicket(req, req.query.room);
    // res.end();
});

app.post('/notification/customer_replies_to_my_ticket', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    console.log('/notification/usrpunss',req.body);
    NotificationController.newReplies(req.body);
    res.status(200).send({success:!!1});
    res.end();
    // NotificationController.newTicket(req, req.query.room);
    // res.end();
});


app.post('/notification/user_replies_to_unassigned_ticket', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    console.log('/notification/csass',req.body);
    NotificationController.newReplies(req.body);
    res.status(200).send({success:!!1});
    res.end();
    // NotificationController.newTicket(req, req.query.room);
    // res.end();
});

app.post('/notification/user_replies_to_my_ticket', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    console.log('/notification/csass',req.body);
    NotificationController.newReplies(req.body);
    res.status(200).send({success:!!1});
    res.end();
    // NotificationController.newTicket(req, req.query.room);
    // res.end();
});

//--------------end replies part----------------//

//--------------note part ---------------------//

app.post('/notification/user_add_note_to_unassigned_ticket', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    NotificationController.newNote(req.body);
    console.log('/notification/usrrpnewNote',req.body);
    res.status(200).send({success:!!1});
    res.end();
    // NotificationController.newTicket(req, req.query.room);
    // res.end();
});

app.post('/notification/user_add_note_to_my_ticket', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    console.log('/notification/usrpunssnewNote',req.body);
    NotificationController.newNote(req.body);
    res.status(200).send({success:!!1});
    res.end();
    // NotificationController.newTicket(req, req.query.room);
    // res.end();
});


// app.post('/notification/customer_notes_to_unassigned_ticket', (req, res) => {
//     res.setHeader('Content-Type', 'application/json');
//     console.log('/notification/csassnewNote',req.body);
//     NotificationController.newNote(req.body);
//     res.status(200).send({success:!!1});
//     res.end();
//     // NotificationController.newTicket(req, req.query.room);
//     // res.end();
// });
//
// app.post('/notification/another_user_add_note_to_unassigned_ticket', (req, res) => {
//     res.setHeader('Content-Type', 'application/json');
//     console.log('/notification/csassnewNote',req.body);
//     NotificationController.newNote(req.body);
//     res.status(200).send({success:!!1});
//     res.end();
//     // NotificationController.newTicket(req, req.query.room);
//     // res.end();
// })
//
// app.post('/notification/another_user_add_note_to_my_ticket', (req, res) => {
//     res.setHeader('Content-Type', 'application/json');
//     console.log('/notification/usrpunssnewNote',req.body);
//     NotificationController.newNote(req.body);
//     res.status(200).send({success:!!1});
//     res.end();
//     // NotificationController.newTicket(req, req.query.room);
//     // res.end();
// });

//--------------end end part----------------//

//--------------ticket assign----------------//

app.post('/notification/mention_in_ticket', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    // NotificationController.seen(req.body);
    console.log('/notification/mention_in_ticket',req.body);
    res.status(200).send({success:!!1});
    res.end();
    // NotificationController.newTicket(req, req.query.room);
    // res.end();
});


app.post('/notification/seen', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    NotificationController.seen(req.body);
    console.log('/notification/seen',req.body);
    res.status(200).send({success:!!1});
    res.end();
    // NotificationController.newTicket(req, req.query.room);
    // res.end();
});


app.post('/notification/assigned_to_me', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    NotificationController.ticketAssign(req.body);
    console.log('/notification/csunss',req.body);
    res.status(200).send({success:!!1});
    res.end();
    // NotificationController.newTicket(req, req.query.room);
    // res.end();
});

app.post('/notification/assigned_to_someone_else', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    NotificationController.ticketAssign(req.body);
    console.log('/notification/csunss',req.body);
    res.status(200).send({success:!!1});
    res.end();
    // NotificationController.newTicket(req, req.query.room);
    // res.end();
});

//--------------end end part----------------//




app.post('/notification/customer_replies_to_team_assigned_ticket', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    NotificationController.newReplies(req.body);
    console.log('/notification/csunss',req.body);
    res.status(200).send({success:!!1});
    res.end();
    // NotificationController.newTicket(req, req.query.room);
    // res.end();
});

app.post('/notification/checkForwarding', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    NotificationController.checkForwarding(req.body);
    console.log('/notificationchekcff');
    res.status(200).send({success:!!1});
    res.end();
});


module.exports = app;
