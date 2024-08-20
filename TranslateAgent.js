import gooogleTranslate from "@google-cloud/translate";
// import { GOOGLE_CREDENTIALS } from "./helper.js";

class TranslationAgent {
  constructor() {
    this.client = new gooogleTranslate.v2.Translate();
  }

  async translateText(original, target_lang) {
    let [translations] = await this.client.translate(original, target_lang);
    translations = Array.isArray(translations) ? translations : [translations];
    return { statusCode: 200, body: { translations } };
  }
}

export default TranslationAgent;
