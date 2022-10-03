const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
app.use(express.static('public'))
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

//cookie prase
const cookieParser = require("cookie-parser");


//pocketbase config
const PocketBase = require('pocketbase/cjs');
const client = new PocketBase('http://127.0.0.1:8090');



app.use(async (req, res, next) => {
    // attach the PocketBase client to the request object
    req.pbClient = new PocketBase("http://127.0.0.1:8090");

    // load the store data from the request cookie string
    req.pbClient.authStore.loadFromCookie(req.headers.cookie || '');

    // on AuthStore change update the response cookie header
    req.pbClient.authStore.onChange(() => {
        res.setHeader("Set-Cookie", req.pbClient.authStore.exportToCookie({ httpOnly: false }));
    });

    try {
        // get an up-to-date auth state by refreshing the loaded auth model (if any)
        if (req.pbClient.authStore.isValid) {
            await req.pbClient.users.refresh();
        }
    } catch (_) {
        // clear the auth store on failed refresh
        req.pbClient.authStore.clear();
    }

    next();
})

app.get("/app", async function (req, res) {
    if (!req.pbClient.authStore.isValid) {
        return res.redirect('http://localhost:3000/index.html');
    }

    res.sendFile(__dirname + '/public/app.html');
});


app.get("/login", async function (req, res) {
    if (!req.pbClient.authStore.isValid) {
        return res.sendFile(__dirname + '/public/login.html');
    }

    res.redirect('http://localhost:3000/app');
});


app.get("/register", async function (req, res) {
return res.sendFile(__dirname + '/public/register.html');

});




server.listen(3000, () => {
    console.log('listening on *:3000');
});