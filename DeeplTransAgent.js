const requestPromise = require("request-promise-native");
const DEEPL_API_KEY = "59dd4334-9380-84b1-76cf-e3424c16e433:fx"; 

class DeeplTransAgent {
  static async translateTo(original, target_lang) {
    return requestPromise({
      method: 'POST',
      uri: "https://api-free.deepl.com/v2/translate",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "auth_key="+DEEPL_API_KEY+"&text="+original+"&target_lang="+target_lang,
      json: true,
      resolveWithFullResponse: true,
      simple: false
    });
  }
}

module.exports = DeeplTransAgent