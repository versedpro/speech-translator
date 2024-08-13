// Imports the Google Cloud client library
import { config } from "dotenv";
config();

import axios from "axios";
import StreamingServer from "./httpStreamingServer.js";
import RtpServer from "./rtpServer.js";
// import Translator from "./translator";
// const DeepgramConnection = require("./deepgramagent")
import RickyAgency from "./RickyAgency.js";
import {
  INPUT_STREAM_PORT,
  INPUT_STREAM_PORT_FOR_GOOGLE,
  OUTPUT_STEREAM_PORT,
  RICKYAGENCY_EVENTS,
  STREAMING_EVENTS,
} from "./helper.js";

// ports for input/output sterams
const streamPort = INPUT_STREAM_PORT;
const googleSteamPort = INPUT_STREAM_PORT_FOR_GOOGLE;
const streamingServer = new StreamingServer(OUTPUT_STEREAM_PORT);

const translations = {};
const s2t_agents = {};

const server = new RtpServer();
console.log("service-responder: ", process.env.SERVICE_RESPONDER_URL);

server.eventEmitter.on("connect", (ssrc, port) => {
  // check if coming ssrc is registered on service responder
  console.log(`coming ssrc: ${ssrc} port: ${port}`);
  if (process.env.IS_SERVICE_RESPONDER_ACTIVE == 1) {
    axios
      .post(`${process.env.SERVICE_RESPONDER_URL}/api/service/check-ssrc`, {
        ssrc: ssrc,
      })
      .then((res) => {
        composeAgencyForSSRC(ssrc, port);
      })
      .catch((err) => {
        console.log("failed with: ", err.code);
        console.log(err);
      });
  } else {
    composeAgencyForSSRC(ssrc, port);
  }
});

const composeAgencyForSSRC = (ssrc, port) => {
  s2t_agents[ssrc.toString()] = new RickyAgency(ssrc, port);
  s2t_agents[ssrc.toString()].eventEmitter.on(RICKYAGENCY_EVENTS.PROCESS_COMPLETED, (lang, obj) => {
    // streamingServer.sendToAll(ssrc, obj);
    streamingServer.sendToSameLanguageListner(ssrc, lang, obj);
  });
  console.log("Connected new SSRC: ", ssrc);
};

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
      s2t_agents[ssrc.toString()].sendSpeechData(buff);
    }
  } catch (error) {
    console.log("error: ", error);
  }
});
server.eventEmitter.on("disconnect", (ssrc) => {
  console.log("Disconnected SSRC: ", ssrc);
  delete translations["" + ssrc];
});
server.start(streamPort);
server.start(googleSteamPort);

// add event handlers for streamingServer
streamingServer.eventEmitter.on(STREAMING_EVENTS.LISTENER_CONNECTED, (data) => {
  try {
    s2t_agents[data.ssrc.toString()].addListner(data.listener_lang);
  } catch (error) {
    console.log("RickyAgent: add listner error: ", error);
  }
});

streamingServer.eventEmitter.on(STREAMING_EVENTS.LISTENER_DISCONNECTED, (data) => {
  try {
    s2t_agents[data.ssrc.toString()].removeListner(data.listener_lang);
  } catch (error) {}
});

console.log("Listening, press Ctrl+C to stop.");
