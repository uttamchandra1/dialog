import React, { useState } from "react";
import gptConverterService from "../services/gptConverterService";

const TextToJSONConverter = () => {
  const [inputText, setInputText] = useState("");
  const [currentScene, setCurrentScene] = useState("SCENE_01");
  const [outputJSON, setOutputJSON] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConvert = async () => {
    if (!inputText.trim()) {
      setError("Please enter some text to convert");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await gptConverterService.convertToJSON(
        inputText,
        currentScene
      );
      setOutputJSON(JSON.stringify(result, null, 2));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Text to JSON Converter
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Scene
            </label>
            <select
              value={currentScene}
              onChange={(e) => setCurrentScene(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 8 }, (_, i) => `SCENE_0${i + 1}`).map(
                (scene) => (
                  <option key={scene} value={scene}>
                    {scene}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input Text
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter your text here... (e.g., Frame 7: Choice: How does Watson react to the letter? • She outplayed you. • You admire her, don't you? • Say nothing.)"
              className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            onClick={handleConvert}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "Converting..." : "Convert to JSON"}
          </button>
        </div>

        {/* Output Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            JSON Output
          </label>
          <pre className="w-full h-96 bg-gray-100 p-4 rounded-md overflow-auto text-sm border">
            {error ? (
              <span className="text-red-600">{error}</span>
            ) : outputJSON ? (
              outputJSON
            ) : (
              <span className="text-gray-500">
                JSON output will appear here...
              </span>
            )}
          </pre>
        </div>
      </div>

      {/* Example Section */}
      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h3 className="text-lg font-semibold mb-3">Example Inputs:</h3>
        <div className="space-y-2 text-sm">
          <div>
            <strong>Choice:</strong> Frame 7: Choice: How does Watson react to
            the letter? • She outplayed you. • You admire her, don't you? • Say
            nothing.
          </div>
          <div>
            <strong>Dialogue:</strong> Holmes: "The game is afoot, Watson."
          </div>
          <div>
            <strong>Narration:</strong> The fog rolled in from the Thames,
            obscuring the gas lamps.
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToJSONConverter;
