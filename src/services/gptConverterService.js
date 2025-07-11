// GPT-based text to JSON converter service
class GPTConverterService {
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    this.baseURL = "https://api.openai.com/v1/chat/completions";
  }

  async convertToJSON(
    inputText,
    currentScene = "SCENE_01",
    currentSequence = "SEQUENCE_01"
  ) {
    const prompt = this.buildPrompt(inputText, currentScene, currentSequence);

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
  "question": "Question text?", // Only include if a question is present in the input. If not, omit this field.
  "options": ["option1", "option2", "option3"],
  "targetSequences": ["SCENE_X/SEQUENCE_YA", "SCENE_X/SEQUENCE_YB", "SCENE_X/SEQUENCE_YC"]
}

IMPORTANT RULES:
- Ignore frame numbers (like "FRAME 6", "Frame 7", etc.) - these are just reference labels, not content
- Ignore section headers like "Dialogue:", "Choice:", "Narration:" - these are just organizational labels
- Only convert actual content (character speech, narrative descriptions, choice questions/options)
- For character dialogue, extract the speaker name intelligently
- For dialogue text, remove the surrounding quotes from the original text - do not include quotes in the JSON text field
- For choices, generate target sequences based on the current scene and sequence:
  * If current scene is SCENE_01 and sequence is SEQUENCE_01 with 3 options, use: ["SCENE_01/SEQUENCE_01A", "SCENE_01/SEQUENCE_01B", "SCENE_01/SEQUENCE_01C"]
  * If current scene is SCENE_02 and sequence is SEQUENCE_05 with 4 options, use: ["SCENE_02/SEQUENCE_05A", "SCENE_02/SEQUENCE_05B", "SCENE_02/SEQUENCE_05C", "SCENE_02/SEQUENCE_05D"]
  * The number of target sequences must match the number of options exactly
- For choices: Only include the "question" field if a question is present in the input. If not, omit the "question" field.
- Return ONLY valid JSON object with a "dialogues" key containing the array, no explanations.
- The response should be wrapped as { "dialogues": [ ... ] }.
- The response should start with { and end with }.
- ALWAYS wrap your response in a "dialogues" object.
`,
            },
            {
              role: "user",
              content:
                'Convert this: Holmes: "The game is afoot." Watson: "Indeed."',
            },
            {
              role: "assistant",
              content: `[
  {
    "type": "character",
    "speaker": "Holmes",
    "text": "The game is afoot."
  },
  {
    "type": "character",
    "speaker": "Watson",
    "text": "Indeed."
  }
]`,
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
      let parsed = JSON.parse(cleanedJson);

      // No need to unwrap, just check for the correct structure
      if (!parsed || !Array.isArray(parsed.dialogues)) {
        console.error(
          "API response is not in the expected { dialogues: [...] } format:",
          parsed
        );
        return { dialogues: [] }; // Return an empty array to avoid runtime errors
      }

      // Clean up any escaped quotes in text fields
      parsed.dialogues.forEach((item) => {
        if (item.text) {
          item.text = item.text.replace(/\\"/g, '"');
        }
        if (item.question) {
          item.question = item.question.replace(/\\"/g, '"');
        }
      });

      return parsed;
    } catch (error) {
      console.error("Error converting text to JSON:", error);
      throw new Error("Failed to convert text to JSON");
    }
  }

  buildPrompt(inputText, currentScene, currentSequence) {
    return `Convert this text to JSON format. Current scene: ${currentScene}, Current sequence: ${currentSequence}

Input text:
${inputText}

Please analyze the text and convert it to the appropriate JSON format. If it's a choice, generate target sequences based on the current scene and sequence (e.g., if SCENE_01/SEQUENCE_01 with 3 options, use ["SCENE_01/SEQUENCE_01A", "SCENE_01/SEQUENCE_01B", "SCENE_01/SEQUENCE_01C"]).`;
  }
}

export default new GPTConverterService();
