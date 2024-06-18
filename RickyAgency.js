const EventEmitter = require("events");
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
    this.sentence_queue = [] // array of recognized sentences
    this.is_running = true
    this.t2s_agent = new T2SAgent()
    // connect events
    this.s2t_agent.eventEmitter.on(DeepgramAgentEvents.SPEECH_RECOGNIZED, (data) => {
      this.sentence_queue.push(data.text)
    })
    // start loop
    this._processQueue()
  }

  sendSpeechData(buff) {
    this.s2t_agent.send(buff)
  }

  async _processQueue() {
    while (this.is_running) {
      if (this.sentence_queue.length == 0){
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds
      }
      else {
        try {
          let s = this.sentence_queue.shift(); // pop queue
          s = s.trim()
          if (s == "") continue

          // TODO: Translate
          let responseTranslate = await DeeplTransAgent.translateTo(s, 'es')
          if(responseTranslate.statusCode!==200) {
            console.log(responseTranslate.body);
            continue;
          }
    
          let translation = responseTranslate.body.translations[0].text;
          console.log('original: ', s)
          console.log('trans: ', translation)
          console.log('\n')
          
          // TODO: Generate Audio
          let res = await this.t2s_agent.generateAudio(translation)

          const obj = {
            original: s,
            text: translation,
            sound: res[0].audioContent.toString("base64")
          };

          this.eventEmitter.emit(EVENTS.PROCESS_COMPLETED, obj);
        } catch (error) {
         console.log('process_queue: ', error) 
        }
      }
    }
  }
}

module.exports = {
  RickyAgency,
  EVENTS,
};