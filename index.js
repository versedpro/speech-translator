// Imports the Google Cloud client library
const StreamingServer = require("./httpStreamingServer");
const RtpServer = require("./rtpServer");
const Translator = require("./translator");

const streamPort = 5004;

const streamingServer = new StreamingServer(4000);

const translations = {};

const server = new RtpServer();
server.eventEmitter.on("connect", (ssrc) => {
    console.log("Connected new SSRC: ", ssrc);
    translations[""+ssrc] = new Translator(ssrc);
    translations[""+ssrc].eventEmitter.on("translation", (obj) => {
        streamingServer.sendToAll(ssrc, obj);
    });
});
server.eventEmitter.on("data", (buff, ssrc) => {
    if (
        streamingServer.pipes[ssrc] != undefined && 
        Object.keys(streamingServer.pipes[ssrc]).length > 0
    ) {
        translations[""+ssrc].send(buff);
    } else {
        translations[""+ssrc].endStream()
    }
});
server.eventEmitter.on("disconnect", (ssrc) => {
    console.log("Disconnected SSRC: ", ssrc);
    delete translations[""+ssrc];
});
server.start(streamPort);

console.log('Listening, press Ctrl+C to stop.');