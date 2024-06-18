// Example filename: index.js

const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
const connection = deepgram.listen.live({
  model: "nova-2",
  language: "en-US",
  smart_format: true,
  encoding: "linear16",
  sample_rate:44100,
  // punctuate: 'sentence',
});


connection.on(LiveTranscriptionEvents.Open, () => {
  console.log('connection opened')
  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log("Connection closed.");
  });

  connection.on(LiveTranscriptionEvents.Transcript, (data) => {
    console.log(data.channel.alternatives[0].transcript);
    console.log(data)
  });

  connection.on(LiveTranscriptionEvents.Metadata, (data) => {
    console.log(data);
  });

  connection.on(LiveTranscriptionEvents.Error, (err) => {
    console.error(err);
  });

  // STEP 4: Fetch the audio stream and send it to the live transcription connection
  // fetch(url)
  //   .then((r) => r.body)
  //   .then((res) => {
  //     res.on("readable", () => {
  //       connection.send(res.read());
  //     });
  //   });
});

module.exports = connection;