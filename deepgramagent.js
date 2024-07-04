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
    this.isConnecting = false; // indicate if DeepgramAgen is trying to connect
    // this.createConnection()
  }

  createConnection() {
    if (this.connection != null) delete this.connection
    this.isConnecting = true;
    this.connection = this.deepgramClient.listen.live({
      model: "nova-2",
      language: "en-US",
      smart_format: true,
      encoding: "mulaw",
      sample_rate: 24000,
    });

    this.connection.on(LiveTranscriptionEvents.Open, () => {
      console.log('Connection opened.');
      this.connection.on(LiveTranscriptionEvents.Close, () => {
        console.log('Connection closed.');
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

      this.isConnectionOpen = true;
      this.isConnecting = false;
    });
  }

  checkConnectionStatus() {
    return this.isConnectionOpen;
  }

  send(buff) {
    if(this.isConnectionOpen) {
      this.connection.send(buff)
    }
    if (!this.isConnecting && !this.isConnectionOpen) {
      this.createConnection()
    }
  }
}

module.exports = {
  DeepgramAgent,
  EVENTS,
}