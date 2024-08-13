import EventEmitter from "events";
import { queue } from "async";
import DeepgramAgent from "./deepgramagent.js";
import S2TAgent from "./S2TAgent.js";
import DeeplTransAgent from "./DeeplTransAgent.js";
import TranslationAgent from "./TranslateAgent.js";
import T2SAgent from "./T2SAgent.js";
import { S2T_EVENTS, RICKYAGENCY_EVENTS, INPUT_STREAM_PORT } from "./helper.js";

const EVENTS = RICKYAGENCY_EVENTS;

/**
 * Manage interaction between S2T, Translation, T2S services
 * for given SSRC
 */
class RickyAgency {
  constructor(ssrc, port) {
    this.ssrc = ssrc;
    this.port = port;
    this.eventEmitter = new EventEmitter();
    this.s2tAgent = port == INPUT_STREAM_PORT ? new DeepgramAgent() : new S2TAgent(); // in case of port 5005, use deepgram, else use google
    this.googleTranslateAgent = new TranslationAgent();
    this.t2sAgent = new T2SAgent();

    this.listenerStatic = {}; // lang - num key pair of listners
    this.process_queues = {}; // lang - async task queue key pair

    // connect events
    this.s2tAgent.eventEmitter.on(S2T_EVENTS.SPEECH_RECOGNIZED, (data) => {
      // add a task to all existing queues for different lang
      for (const lang in this.process_queues) {
        console.log("lang: ", lang);

        // Add new task to queue
        this.process_queues[lang].t2t.push({ text: data.text }, (err, obj) => {
          if (err == null) {
            console.log("Translation completed");
          } else {
            console.log("t2t", err);
          }
        });
      }
    });
  }

  addListner(listners_lang) {
    if (this.listenerStatic.hasOwnProperty(listners_lang)) {
      this.listenerStatic[listners_lang] += 1;
    } else {
      this.listenerStatic[listners_lang] = 0;
      this.process_queues[listners_lang] = {};
      this.process_queues[listners_lang].t2t = queue((task, t2tCompleted) => {
        try {
          let s = task.text.trim();
          if (s == "") {
            throw new Error("Empty String");
          }

          // if port is 5005, use deepl, else use google
          const translation =
            this.port == INPUT_STREAM_PORT
              ? DeeplTransAgent.translateTo(s, listners_lang)
              : this.googleTranslateAgent.translateText(s, listners_lang);

          translation.then((res) => {
            if (res.statusCode !== 200) {
              throw new Error("Trans failed");
            }

            const text = this.port == INPUT_STREAM_PORT ? res.body.translations[0].text : res.body.translations[0];

            t2tCompleted(null, { translatedTxt: text });

            this.process_queues[listners_lang].t2s.push({ original: s, text: text }, (err, obj) => {
              if (err == null) {
                console.log("original: ", obj.original);
                console.log("trans: ", obj.text);

                this.eventEmitter.emit(EVENTS.PROCESS_COMPLETED, listners_lang, obj);
              } else {
                console.log("t2s ", err);
              }
            });
          });
        } catch (error) {
          console.log("catch worked");
          t2tCompleted(error, null);
        }
      }, 1);

      this.process_queues[listners_lang].t2s = queue((task, t2sCompleted) => {
        try {
          if (task.text == "") {
            throw new Error("Empty String");
          }

          this.t2sAgent
            .generateAudio(task.text, listners_lang)
            .then((res) => {
              if (!res[0].audioContent) {
                throw new Error("T2S failed");
              }
              const obj = {
                original: task.original,
                text: task.text,
                sound: res[0].audioContent.toString("base64"),
              };
              t2sCompleted(null, obj);
            })
            .catch((err) => {
              t2sCompleted(err, null);
            });
        } catch (error) {
          t2sCompleted(error, null);
        }
      }, 1);
    }
  }

  removeListner(listners_lang) {
    if (this.listenerStatic.hasOwnProperty(listners_lang)) {
      this.listenerStatic[listners_lang] -= 1;

      // if all listeners for a specific lang were removed,
      // then kill the task queue
      if (this.listenerStatic[listners_lang] < 1) {
        this.process_queues[listners_lang].kill();
        delete this.process_queues[listners_lang];
        delete this.listenerStatic[listners_lang];
      }
    }
  }

  sendSpeechData(buff) {
    // check if there is any listener
    if (this.hasAnyListener()) {
      this.s2tAgent.send(buff);
    }
    // console.log('s2t_state: ', this.s2tAgent.isConnectionOpen)
  }

  hasAnyListener() {
    return Object.keys(this.listenerStatic).length > 0;
  }
}

export default RickyAgency;
