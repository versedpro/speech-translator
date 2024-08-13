import { config } from "dotenv";
config();
import { createRequire } from "module";
const GOOGLE_CRENDENTIALS = createRequire(import.meta.url)("./google_service_credential.json");

// import GOOGLE_CRENDENTIALS from "./google_service_credential.json" assert { type: "json" };
export const GOOGLE_CREDENTIALS = GOOGLE_CRENDENTIALS;

export const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
export const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

export const RICKYAGENCY_EVENTS = {
  PROCESS_COMPLETED: "PROCESS_COMPLETED", // a part of speech recognized, translated, new speech generated
};

export const S2T_EVENTS = {
  SPEECH_RECOGNIZED: "SPEECH_RECOGNIZED",
};

export const STREAMING_EVENTS = {
  LISTENER_CONNECTED: "LISTENER_CONNECTED",
  LISTENER_DISCONNECTED: "LISTENER_DISCONNECTED",
};

// Configurations
export const NO_DATA_TIMEOUT = 10000;
export const OUTPUT_STEREAM_PORT = 4001;
export const INPUT_STREAM_PORT = 5004;
export const INPUT_STREAM_PORT_FOR_GOOGLE = 5006;
