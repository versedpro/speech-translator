const EventEmitter = require("events");
const speech = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');
const {TranslationServiceClient} = require('@google-cloud/translate');
const requestPromise = require("request-promise-native");

const DEEPL_API_KEY = "59dd4334-9380-84b1-76cf-e3424c16e433:fx";
const LANGUAGE_TO = "es";
const REQUIRED_CONFIRMATIONS = 10;
const MIN_SAY_WORDS = 4;

const encoding = 'LINEAR16';
const sampleRateHertz = 44100;
const languageCode = 'en-US';
const channelCount = 1;

const projectId = 'barix-translator';
const location = 'global';

const request = {
    config: {
        encoding: encoding,
        sampleRateHertz: sampleRateHertz,
        languageCode: languageCode,
        audioChannelCount: channelCount,
        enableWordTimeOffsets: true,
        enableWordConfidence: true,
        enableAutomaticPunctuation: true
    },
    singleUtterance: true,
    interimResults: true, // If you want interim results, set this to true
};

class Translator {

	constructor(ssrc) {
		this.clientSynthesize = new textToSpeech.TextToSpeechClient();
		this.translationClient = new TranslationServiceClient();
		this.clientRecognize = new speech.SpeechClient();
		this.translateId = 0;
		this.eventEmitter = new EventEmitter();
		this.ssrc = ssrc;
		this.resetRecognizeStream();
	}

	async recognized(text, say, context) {

	    this.translateId++;

	    const requestTranslate = {
	        parent: `projects/${projectId}/locations/${location}`,
	        contents: [text],
	        mimeType: 'text/plain', // mime types: text/plain, text/html
	        sourceLanguageCode: 'en',
	        targetLanguageCode: LANGUAGE_TO,
	    };

	    const cpyTranslateId = this.translateId;
	    // Run request
	    //const [responseTranslate] = await this.translationClient.translateText(requestTranslate);

	    const responseTranslate = await requestPromise({
            method: 'POST',
            uri: "https://api-free.deepl.com/v2/translate",
            headers: {
            	"Content-Type": "application/x-www-form-urlencoded"
            },
            body: "auth_key="+DEEPL_API_KEY+"&text="+text+"&target_lang="+LANGUAGE_TO,
            json: true,
            resolveWithFullResponse: true,
            simple: false
	    });

	    if(cpyTranslateId!==this.translateId) return;

	    if(responseTranslate.statusCode!==200) {
	    	console.log(responseTranslate.body);
	    	return;
	    }

	    let translation = responseTranslate.body.translations[0].text;

	    /*if(responseTranslate.translations.length===0) {
	        console.error("Cannot translate");
	        return;
	    }

	    let translation = responseTranslate.translations[0].translatedText.toLowerCase();*/

	    console.log("Original text: ", text);
	    console.log("Original translation: ", translation);

	    let words = translation.split(" ");

	    if(context.offset!=null) {
	        words = words.slice(context.offset);
	    }

	    if(context.words==null) {
	        context.words = [];
	        for(let word of words) {
	            context.words.push({
	                word,
	                confirmations: 1
	            });
	        }
	    } else {
	        const newWords = [];
	        let pointer = 0;
	        for(let i=0;i<words.length;i++) {
	            if(context.words[i]==null || context.words[i].word!==words[i]) {
	                //Not good
	                break;
	            } else {
	                context.words[i].confirmations++;
	                pointer++;
	                newWords.push(context.words[i]);
	            }
	        }
	        for(let e=pointer;e<words.length;e++) {
	            newWords.push({
	                word: words[e],
	                confirmations: 1
	            });
	        }
	        context.words = newWords;
	    }

	    if(say) {
	        const sayWords = [];
	        for(let wordObj of context.words) {
	            sayWords.push(wordObj.word);
	        }
	        translation = sayWords.join(" ");
	    } else {
	        const sayWords = [];
	        for(let wordObj of context.words) {
	            if(wordObj.confirmations<REQUIRED_CONFIRMATIONS) {
	                break;
	            }
	            sayWords.push(wordObj.word);
	        }

	        if(sayWords.length>=MIN_SAY_WORDS) {
	            say = true;
	            translation = sayWords.join(" ");
	            if(context.offset==null) context.offset = 0;
	            context.offset += sayWords.length;
	            context.words = context.words.slice(sayWords.length);
	        }
	    }

	    console.log("Translation words: ", context.words);

	    if(!say) return;

	    console.log("Say text: ", translation);

	    // Construct the request
	    const request = {
	        input: {text: translation},
	        // Select the language and SSML voice gender (optional)
	        voice: {languageCode: LANGUAGE_TO, ssmlGender: 'NEUTRAL'},
	        enableTimePointing: [],
	        // select the type of audio encoding
	        audioConfig: {
	            audioEncoding: 'MP3',
	            sampleRateHertz: 24000
	        },
	    };

	    // Performs the text-to-speech request
	    const response = await this.clientSynthesize.synthesizeSpeech(request);
	    // Write the binary audio content to a local file

	    console.log("Audio content: ", response);

	    const obj = {
	        original: text,
	        text: translation,
	        sound: response[0].audioContent.toString("base64")
	    };

        this.eventEmitter.emit("translation", obj);
	}

	resetRecognizeStream() {
	    let lastTranslation;
	    const context = {};

	    if(this.bufferedData==null) this.bufferedData = [];

	    this.recognizeStream = this.clientRecognize
	        .streamingRecognize(request)
	        .on('error', (err) => {
	            console.error(err);
	            this.recognizeStream = null;
	            this.resetRecognizeStream();
	        })
	        .on('data', data => {

	            //console.log("Data: ", data);
	            if(data.speechEventType!=="SPEECH_EVENT_UNSPECIFIED") {
	                lastTranslation = null;
	                this.recognizeStream.end();
	                this.resetRecognizeStream();
	                console.log(data.speechEventType);
	                return;
	            }

	            if(data.results[0].isFinal || data.results[0].stability>0.8) {
	                /*console.log(JSON.stringify(data));
	                process.stdout.write(
	                    data.results[0] && data.results[0].alternatives[0]
	                        ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
	                        : '\n\nReached transcription time limit, press Ctrl+C\n'
	                )*/
	                if(data.results[0] && data.results[0].isFinal &&  data.results[0].alternatives[0]) {
	                    console.log("Translation data: ", data);
	                    this.recognized(data.results[0].alternatives[0].transcript, true, context);
	                    /*lastTranslation = null;
	                    recognizeStream.end();
	                    resetRecognizeStream();*/
	                } else {
	                    if(lastTranslation!==data.results[0].alternatives[0].transcript) {
	                        //recognized(data.results[0].alternatives[0].transcript, false, context);
	                        //lastTranslation = data.results[0].alternatives[0].transcript
	                    }
	                }
	            }
	        });

	    if(this.bufferedData.length>0) {
	        this.recognizeStream.write(Buffer.concat(this.bufferedData));
	        this.bufferedData = [];
	    }
	}

	endStream() {
		this.recognizeStream.end();
	}

	send(buff) {
	    if(this.recognizeStream!=null) {
	        this.recognizeStream.write(buff);
	    } else {
	        this.bufferedData.push(buff);
	    }
	}

}

module.exports = Translator;
