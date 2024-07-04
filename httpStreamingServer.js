const EventEmitter = require("events");
const express = require('express');
const url = require('url');
const ws = require('ws');

const EVENTS = {
    'LISTENER_CONNECTED': 'LISTENER_CONNECTED',
    'LISTENER_DISCONNECTED': 'LISTENER_DISCONNECTED',
}

class StreamingServer {

    constructor(port) {
        this.eventEmitter = new EventEmitter()
        this.pipes = [];
        this.listenerStatics = {}; // store how many listners are live for ssrc/lang pair
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

            const parameters = url.parse(request.url, true).query;

            const arr = request.url.split("/");
            let ssrc = 0;
            ssrc = parameters.ssrc;
            const language = parameters.language;
            console.log("WS conencted fror SSRC: ", ssrc);
            console.log('language: ', language)
            this.onListnerConnect(ssrc, language)
            this.eventEmitter.emit(EVENTS.LISTENER_CONNECTED, {
                ssrc,
                listener_lang: language, 
            });

            console.log('statistic: ', this.listenerStatics)
            const currI = i;
            socket.on("close", () => {
                console.log("Socket closed");
                this.onListenerDisconnect(ssrc, language)
                this.eventEmitter.emit(EVENTS.LISTENER_DISCONNECTED, {
                    ssrc,
                    listener_lang: language, 
                });
                console.log('statistic: ', this.listenerStatics)
                delete this.pipes[""+ssrc][""+currI];
            });

            if(this.pipes[""+ssrc]==null) {
                this.pipes[""+ssrc] = {};
            }
            this.pipes[""+ssrc][""+i] = {
                socket: socket,
                targetLang: language,
            };
            i++;
        });

        server.on('upgrade', (request, socket, head) => {
            wsServer.handleUpgrade(request, socket, head, socket => {
                wsServer.emit('connection', socket, request);
            });
        });
    }

    onListnerConnect(ssrc, lang) {
        if(this.listenerStatics['' + ssrc] == null) {
            this.listenerStatics['' + ssrc] = {}
        }
        if (this.listenerStatics['' + ssrc][lang] == null) {
            this.listenerStatics['' + ssrc][lang] = 0
        }
        this.listenerStatics['' + ssrc][lang] ++; 
    }

    onListenerDisconnect(ssrc, lang) {
        if(this.listenerStatics['' + ssrc] == null || this.listenerStatics['' + ssrc][lang] == null) return
        this.listenerStatics['' + ssrc][lang] --;
        if (this.listenerStatics['' + ssrc][lang] == 0 ) delete this.listenerStatics['' + ssrc][lang]; 
    }

    getAllLangesForSSRC(ssrc) {
        /** return list of language code of listeners connected to the ssrc */
        if (this.listenerStatics['' + ssrc] == null) return []
        return Object.keys(this.listenerStatics['' + ssrc])
    }

    sendToAll(ssrc, obj) {
        for(let pipeId in this.pipes[""+ssrc]) {
            this.pipes[""+ssrc][pipeId].socket.send(JSON.stringify(obj));
        }
    }

    sendToSameLanguageListner(ssrc, lang, obj) {
        for(let pipeId in this.pipes[""+ssrc]) {
            if(this.pipes[""+ssrc][pipeId].targetLang == lang) {
                this.pipes[""+ssrc][pipeId].socket.send(JSON.stringify(obj));
            }
        }
    }

}

module.exports = {
    StreamingServer,
    EVENTS,
};