const EventEmitter = require("events");
const asyncModule = require('async');
const {DeepgramAgent, EVENTS: DeepgramAgentEvents} = require("./deepgramagent")
const DeeplTransAgent = require("./DeeplTransAgent")
const T2SAgent = require("./T2SAgent")

const EVENTS = {
  'PROCESS_COMPLETED': 'PROCESS_COMPLETED', // a part of speech recognized, translated, new speech generated
}

/**
 * Manage interaction between S2T, Translation, T2S services
 * for given SSRC
 */
class RickyAgency {
  constructor(ssrc) {
    this.ssrc = ssrc
    this.eventEmitter = new EventEmitter()
    this.s2t_agent = new DeepgramAgent()
    // this.sentence_queue = [] // array of recognized sentences
    this.is_running = true
    this.t2s_agent = new T2SAgent()

    // queue for transaction & T2S
    this.process_queue = asyncModule.queue((task, completed) => {
      try {
        let s = task.text.trim()
        if (s == "") {throw new Error('Empty String')}
        
        
        DeeplTransAgent.translateTo(s, 'es')
          .then(res => {
            if (res.statusCode!==200) {
              throw new Error('Trans failed')
            }
            return res.body.translations[0].text;
          })
          .then(translatedTxt => {
            return this.t2s_agent.generateAudio(translatedTxt)
              .then(res => ({ translatedTxt, audio: res[0].audioContent.toString("base64") }));
          })
          .then(({ translatedTxt, audio }) => {
            const obj = {
              original: s,
              text: translatedTxt,
              sound: audio
            };
            completed(null, obj);
          })
          .catch(err => {
            completed(err, null);
          })
      } catch (error) {
        console.log('catch worked')
        completed(error, null);
      }
      
    }, 1);

    // connect events
    this.s2t_agent.eventEmitter.on(DeepgramAgentEvents.SPEECH_RECOGNIZED, (data) => {
      this.process_queue.push({text: data.text}, (err, obj) => {
        if (err == null) {
          console.log('original: ', obj.original)
          console.log('trans: ', obj.text)
          this.eventEmitter.emit(EVENTS.PROCESS_COMPLETED, obj);
        }
        else {
          console.log('process err:', err)
        }
      })
    })
  }

  sendSpeechData(buff) {
    this.s2t_agent.send(buff)
  }
}

module.exports = {
  RickyAgency,
  EVENTS,
};