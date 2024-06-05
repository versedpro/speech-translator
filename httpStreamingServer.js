const express = require('express');

const ws = require('ws');

class StreamingServer {

    constructor(port) {
        this.pipes = [];
        const app = express();

        let i = 0;

        app.get('/', function (req, res) {
            res.send('Hello World')
        });
        
        app.use(express.static('public'))

        const server = app.listen(port);

        const wsServer = new ws.Server({ noServer: true });
        wsServer.on('connection', (socket, request) => {
            socket.on('message', message => {
            });

            const arr = request.url.split("/");
            let ssrc = 0;
            if(arr.length>0) ssrc = parseInt(arr[arr.length-1]);

            console.log("WS conencted fror SSRC: ", ssrc);

            const currI = i;
            socket.on("close", () => {
                console.log("Socket closed");
                delete this.pipes[""+ssrc][""+currI];
            });

            if(this.pipes[""+ssrc]==null) {
                this.pipes[""+ssrc] = {};
            }
            this.pipes[""+ssrc][""+i] = socket;
            i++;
        });

        server.on('upgrade', (request, socket, head) => {
            wsServer.handleUpgrade(request, socket, head, socket => {
                wsServer.emit('connection', socket, request);
            });
        });
    }

    sendToAll(ssrc, obj) {
        for(let pipeId in this.pipes[""+ssrc]) {
            this.pipes[""+ssrc][pipeId].send(JSON.stringify(obj));
        }
    }

}

module.exports = StreamingServer;