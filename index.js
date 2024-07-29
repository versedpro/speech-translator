// Imports the Google Cloud client library
const dotenv = require("dotenv");
dotenv.config();

const axios = require('axios')
const {StreamingServer, EVENTS: StreamServerEvents} = require("./httpStreamingServer");
const RtpServer = require("./rtpServer");
const Translator = require("./translator");
// const DeepgramConnection = require("./deepgramagent")
const {RickyAgency, EVENTS: RickyAgencyEvents} = require("./RickyAgency");

const streamPort = 5005;

const streamingServer = new StreamingServer(4001);

const translations = {};
const s2t_agents = {};

const server = new RtpServer();
console.log('service-responder: ', process.env.SERVICE_RESPONDER_URL)
server.eventEmitter.on("connect", (ssrc) => {
    // check if coming ssrc is registered on service responder
    console.log('coming ssrc: ', ssrc)
    if (process.env.IS_SERVICE_RESPONDER_ACTIVE == 1) {
        axios.post(`${process.env.SERVICE_RESPONDER_URL}/api/service/check-ssrc`, {
            "ssrc": ssrc
        }).then(res => {
            composeAgencyForSSRC(ssrc)
        }).catch(err => {
            console.log('failed with: ', err.code)
            console.log(err)
        })
    } else {
        composeAgencyForSSRC(ssrc)
    }
});

const composeAgencyForSSRC = (ssrc) => {
    s2t_agents[ssrc.toString()] = new RickyAgency(ssrc)
    s2t_agents[ssrc.toString()].eventEmitter.on(RickyAgencyEvents.PROCESS_COMPLETED, (lang, obj) => {
        // streamingServer.sendToAll(ssrc, obj);
        streamingServer.sendToSameLanguageListner(ssrc, lang, obj)
    })
    console.log("Connected new SSRC: ", ssrc);
}

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
        if (s2t_agents[ssrc.toString()]) {
            s2t_agents[ssrc.toString()].sendSpeechData(buff)    
        }
    } catch (error) {
        console.log('error: ', error)   
    }
});
server.eventEmitter.on("disconnect", (ssrc) => {
    console.log("Disconnected SSRC: ", ssrc);
    delete translations[""+ssrc];
});
server.start(streamPort);

// add event handlers for streamingServer
streamingServer.eventEmitter.on(StreamServerEvents.LISTENER_CONNECTED, (data) => {
    try {
        s2t_agents[data.ssrc.toString()].addListner(data.listener_lang)
    } catch (error) {
        console.log('RickyAgent: add listner error: ', error)
    }
})

streamingServer.eventEmitter.on(StreamServerEvents.LISTENER_DISCONNECTED, (data) => {
    try {
        s2t_agents[data.ssrc.toString()].removeListner(data.listener_lang)
    } catch (error) {
        
    }
})

console.log('Listening, press Ctrl+C to stop.');