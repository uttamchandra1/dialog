// GPT-based text to JSON converter service
class GPTConverterService {
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    this.baseURL = "https://api.openai.com/v1/chat/completions";
  }

  async convertToJSON(inputText, currentScene = "SCENE_01") {
    const prompt = this.buildPrompt(inputText, currentScene);

    try {
      const response = await fetch(this.baseURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a dialogue system converter. Convert the given text into JSON format based on these templates:

Narration format:
{
  "type": "narration",
  "text": "..."
}

Dialogue format:
{
  "type": "character", 
  "speaker": "CharacterName",
  "text": "..."
}

Choice format:
{
  "type": "choice",
  "question": "Question text?",
  "options": ["option1", "option2", "option3"],
  "targetSequences": ["SCENE_X/SEQUENCE_YA", "SCENE_X/SEQUENCE_YB", "SCENE_X/SEQUENCE_YC"]
}

IMPORTANT RULES:
- Ignore frame numbers (like "FRAME 6", "Frame 7", etc.) - these are just reference labels, not content
- Ignore section headers like "Dialogue:", "Choice:", "Narration:" - these are just organizational labels
- Only convert actual content (character speech, narrative descriptions, choice questions/options)
- For character dialogue, extract the speaker name intelligently
- For dialogue text, remove the surrounding quotes from the original text - do not include quotes in the JSON text field
- For choices, generate appropriate target sequences based on the current scene
- Return ONLY valid JSON array, no explanations`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 500,
        }),
      });

      const data = await response.json();
      const jsonString = data.choices[0].message.content;

      // Clean up the response and parse JSON
      const cleanedJson = jsonString.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanedJson);

      // Clean up any escaped quotes in text fields
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (item.text) {
            item.text = item.text.replace(/\\"/g, '"');
          }
          if (item.question) {
            item.question = item.question.replace(/\\"/g, '"');
          }
        });
      }

      return parsed;
    } catch (error) {
      console.error("Error converting text to JSON:", error);
      throw new Error("Failed to convert text to JSON");
    }
  }

  buildPrompt(inputText, currentScene) {
    return `Convert this text to JSON format. Current scene: ${currentScene}

Input text:
${inputText}

Please analyze the text and convert it to the appropriate JSON format. If it's a choice, generate target sequences based on the current scene.`;
  }
}

export default new GPTConverterService();
