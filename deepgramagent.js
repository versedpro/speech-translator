// Example filename: index.js

const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const EventEmitter = require("events");

const EVENTS = {
  'SPEECH_RECOGNIZED': 'SPEECH_RECOGNIZED',
}

class DeepgramAgent {
  constructor(apiKey = process.env.DEEPGRAM_API_KEY) {
    this.deepgramClient = createClient(apiKey);
    this.isConnectionOpen = false;
    this.connection = null;
    this.eventEmitter = new EventEmitter();
    this.temp = null;   // store previous result if it is not speech_final
    this.createConnection()
  }

  createConnection() {
    this.connection = this.deepgramClient.listen.live({
      model: "nova-2",
      language: "en-US",
      smart_format: true,
      encoding: "linear16",
      sample_rate: 44100,
    });

    this.connection.on(LiveTranscriptionEvents.Open, () => {
      console.log('Connection opened.');
      this.isConnectionOpen = true;
      this.connection.on(LiveTranscriptionEvents.Close, () => {
        this.isConnectionOpen = false;
      });
  
      this.connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        // console.log('deepgram: ', data.speech_final, data.channel.alternatives[0].transcript)
        // if (data.speech_final == true) {
        //   if (this.temp == null) this.eventEmitter.emit(EVENTS.SPEECH_RECOGNIZED, {'text': data.channel.alternatives[0].transcript})
        //   else {
        //     this.eventEmitter.emit(EVENTS.SPEECH_RECOGNIZED, {'text': `${this.temp} ${data.channel.alternatives[0].transcript}`})
        //     this.temp = null
        //   }
        // } else {
        //   if (this.temp == null) this.temp = data.channel.alternatives[0].transcript
        //   else this.temp = `${this.temp} ${data.channel.alternatives[0].transcript}`
        // }
        this.eventEmitter.emit(EVENTS.SPEECH_RECOGNIZED, {'text': data.channel.alternatives[0].transcript})
      });
  
      this.connection.on(LiveTranscriptionEvents.Metadata, (data) => {
        console.log(data);
      });
  
      this.connection.on(LiveTranscriptionEvents.Error, (err) => {
        console.error(err);
      });
    });
  }

  checkConnectionStatus() {
    return this.isConnectionOpen;
  }

  send(buff) {
    if(this.isConnectionOpen) {
      this.connection.send(buff)
    }
  }
}

module.exports = {
  DeepgramAgent,
  EVENTS,
}