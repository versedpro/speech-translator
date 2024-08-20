import { SpeechClient } from "@google-cloud/speech";
import EventEmitter from "events";
// import { GOOGLE_CREDENTIALS } from "./helper.js";

const EVENTS = {
  SPEECH_RECOGNIZED: "SPEECH_RECOGNIZED",
};

class S2TAgent {
  constructor(target_lang = "es") {
    this.client = new SpeechClient();
    this.target_lang = target_lang;
    this.eventEmitter = new EventEmitter();
    this.resetRecognizeStream();
  }

  resetRecognizeStream() {
    console.log("Reset Recognize Stream");
    let lastTranslation;
    if (this.bufferedData == null) this.bufferedData = [];

    const encoding = "LINEAR16"; // Encoding of the audio file
    const sampleRateHertz = 24000;
    const languageCode = "en-US"; // BCP-47 language code

    const request = {
      config: {
        encoding: encoding,
        sampleRateHertz: sampleRateHertz,
        languageCode: languageCode,
      },
      interimResults: false, // If you want interim results, set this to true
    };

    // Detects speech in the audio file
    this.recognizeStream = this.client
      .streamingRecognize(request)
      .on("error", (err) => {
        console.error(err);
        this.recognizeStream = null;
        this.resetRecognizeStream();
      })
      .on("data", (data) => {
        if (data.speechEventType !== "SPEECH_EVENT_UNSPECIFIED") {
          lastTranslation = null;
          this.recognizeStream.end();
          this.resetRecognizeStream();
          console.log(data.speechEventType);
          return;
        }

        if (data.results[0].isFinal || data.results[0].stability > 0.8) {
          // console.log(JSON.stringify(data));
          if (data.results[0] && data.results[0].isFinal && data.results[0].alternatives[0]) {
            // console.log("Transcription: ", data.results[0].alternatives[0].transcript);
            this.eventEmitter.emit(EVENTS.SPEECH_RECOGNIZED, { text: data.results[0].alternatives[0].transcript });
            // this.recognized(data.results[0].alternatives[0].transcript, true, context);
            /*lastTranslation = null;
	                    recognizeStream.end();
	                    resetRecognizeStream();*/
          } else {
            if (lastTranslation !== data.results[0].alternatives[0].transcript) {
              //recognized(data.results[0].alternatives[0].transcript, false, context);
              //lastTranslation = data.results[0].alternatives[0].transcript
            }
          }
        }
      });

    if (this.bufferedData.length > 0) {
      this.recognizeStream.write(Buffer.concat(this.bufferedData));
      this.bufferedData = [];
    }
  }

  endStream() {
    this.recognizeStream.end();
  }

  send(buff) {
    if (this.recognizeStream != null) {
      this.recognizeStream.write(buff);
    } else {
      this.bufferedData.push(buff);
    }
  }
}

export default S2TAgent;
