import requestPromise from "request-promise-native";
import { DEEPL_API_KEY } from "./helper.js";

class DeeplTransAgent {
  static async translateTo(original, target_lang) {
    return requestPromise({
      method: "POST",
      uri: "https://api-free.deepl.com/v2/translate",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "auth_key=" + DEEPL_API_KEY + "&text=" + original + "&target_lang=" + target_lang,
      json: true,
      resolveWithFullResponse: true,
      simple: false,
    });
  }
}

export default DeeplTransAgent;
