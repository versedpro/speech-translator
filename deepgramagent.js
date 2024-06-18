// Example filename: index.js

const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");

class DeepgramConnection {
  constructor(apiKey = process.env.DEEPGRAM_API_KEY) {
    this.deepgramClient = createClient(apiKey);
    this.isConnectionOpen = false;
    this.connection = null;
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
        console.log(data.channel.alternatives[0].transcript);
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

module.exports = DeepgramConnection;