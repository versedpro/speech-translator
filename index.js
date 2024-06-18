// Imports the Google Cloud client library
const dotenv = require("dotenv");
dotenv.config();

const StreamingServer = require("./httpStreamingServer");
const RtpServer = require("./rtpServer");
const Translator = require("./translator");
const DEEPGRAM_AGENT = require("./deepgramagent")

const streamPort = 5005;

const streamingServer = new StreamingServer(4001);

const translations = {};

const server = new RtpServer();
server.eventEmitter.on("connect", (ssrc) => {
    console.log("Connected new SSRC: ", ssrc);
    translations[""+ssrc] = new Translator(ssrc);
    translations[""+ssrc].eventEmitter.on('audioDictated', (dictatedText) => {
        const targetLangs = streamingServer.getAllLangesForSSRC(ssrc)
        for (const lang of targetLangs) {
            translations[""+ssrc].translateInTargetLang(dictatedText, lang)
        }
        console.log('target langs: ', targetLangs)
    })
    translations[""+ssrc].eventEmitter.on("translation", (targetLang, obj) => {
        streamingServer.sendToSameLanguageListner(ssrc, targetLang, obj);
    });
});
server.eventEmitter.on("data", (buff, ssrc) => {
    // if (
    //     streamingServer.pipes[ssrc] != undefined && 
    //     Object.keys(streamingServer.pipes[ssrc]).length > 0
    // ) {
    //     translations[""+ssrc].send(buff);
    // } else {
    //     translations[""+ssrc].endStream()
    // }
    try {
        DEEPGRAM_AGENT.send(buff)    
    } catch (error) {
        // console.log('error: ', error)   
    }
});
server.eventEmitter.on("disconnect", (ssrc) => {
    console.log("Disconnected SSRC: ", ssrc);
    delete translations[""+ssrc];
});
server.start(streamPort);

console.log('Listening, press Ctrl+C to stop.');