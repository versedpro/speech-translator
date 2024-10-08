import { TextToSpeechClient } from "@google-cloud/text-to-speech";
// import { GOOGLE_CREDENTIALS } from "./helper.js";

class T2SAgent {
  constructor(target_lang = "es") {
    this.target_lang = target_lang;
    this.clientSynthesize = new TextToSpeechClient();
  }

  async generateAudio(text, lang_to = "es") {
    // Construct the request
    const request = {
      input: { text: text },
      // Select the language and SSML voice gender (optional)
      voice: { languageCode: lang_to, ssmlGender: "NEUTRAL" },
      enableTimePointing: [],
      // select the type of audio encoding
      audioConfig: {
        audioEncoding: "MP3",
        sampleRateHertz: 24000,
      },
    };

    // Performs the text-to-speech request
    const response = await this.clientSynthesize.synthesizeSpeech(request);
    return response;
  }
}

export default T2SAgent;
