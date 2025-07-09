import React, { useState, useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import DialogueService from "../services/dialogueService";

const DialogueManager = () => {
  const [dialogues, setDialogues] = useState([]);
  const [selectedScene, setSelectedScene] = useState("");
  const [selectedSequence, setSelectedSequence] = useState("");
  const [newScene, setNewScene] = useState("");
  const [newSequence, setNewSequence] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDialogueContent, setSelectedDialogueContent] = useState(null);

  useEffect(() => {
    loadExistingDialogues();
  }, []);

  const loadExistingDialogues = async () => {
    setIsLoading(true);
    try {
      const existingDialogues = await DialogueService.scanExistingDialogues();
      setDialogues(existingDialogues);
    } catch (error) {
      console.error("Error loading dialogues:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddScene = () => {
    if (!newScene.trim()) return;
    if (dialogues.some((d) => d.scene === newScene)) return;
    setDialogues([...dialogues, { scene: newScene, sequences: [] }]);
    setNewScene("");
  };

  const handleAddSequence = () => {
    if (!selectedScene || !newSequence.trim()) return;
    setDialogues(
      dialogues.map((sceneObj) => {
        if (sceneObj.scene !== selectedScene) return sceneObj;
        if (sceneObj.sequences.some((seq) => seq.sequence === newSequence))
          return sceneObj;
        return {
          ...sceneObj,
          sequences: [
            ...sceneObj.sequences,
            {
              sequence: newSequence,
              title: "",
              timestamp: new Date().toISOString(),
              dialogueCount: 0,
              dialogues: [],
            },
          ],
        };
      })
    );
    setNewSequence("");
  };

  const getUniqueScenes = () => dialogues.map((d) => d.scene).sort();

  const getSequencesForScene = (scene) => {
    const found = dialogues.find((d) => d.scene === scene);
    return found
      ? found.sequences.sort((a, b) => a.sequence.localeCompare(b.sequence))
      : [];
  };

  const handleSceneSelect = (scene) => {
    setSelectedScene(scene);
    setSelectedSequence("");
    setSelectedDialogueContent(null);
  };

  const handleSequenceSelect = async (sequence) => {
    setSelectedSequence(sequence);

    // Load dialogue content for the selected sequence
    try {
      const content = await DialogueService.getDialogueContent(
        selectedScene,
        sequence
      );
      setSelectedDialogueContent(content);
    } catch (error) {
      console.error("Error loading dialogue content:", error);
      setSelectedDialogueContent(null);
    }
  };

  const handleExportZip = () => {
    const zip = new JSZip();
    dialogues.forEach((sceneObj) => {
      sceneObj.sequences.forEach((seq) => {
        zip.file(
          `Dialogues/${sceneObj.scene}/${seq.sequence}/dialogue.json`,
          JSON.stringify({ dialogues: seq.dialogues || [] }, null, 2)
        );
      });
    });
    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "Dialogues.zip");
    });
  };

  const handleExportSelectedSequence = () => {
    if (!selectedScene || !selectedSequence || !selectedDialogueContent) return;

    const zip = new JSZip();
    zip.file(
      `Dialogues/${selectedScene}/${selectedSequence}/dialogue.json`,
      JSON.stringify(selectedDialogueContent, null, 2)
    );

    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, `${selectedScene}_${selectedSequence}.zip`);
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading dialogues...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Dialogue Manager</h2>
          <button
            onClick={handleExportZip}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
          >
            Export All as ZIP
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Scene */}
          <div className="mb-4">
            <input
              type="text"
              value={newScene}
              onChange={(e) => setNewScene(e.target.value)}
              placeholder="New Scene Name"
              className="border p-2 rounded mr-2"
            />
            <button
              onClick={handleAddScene}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Add Scene
            </button>
          </div>

          {/* Add Sequence (only if a scene is selected) */}
          {selectedScene && (
            <div className="mb-4">
              <input
                type="text"
                value={newSequence}
                onChange={(e) => setNewSequence(e.target.value)}
                placeholder="New Sequence Name"
                className="border p-2 rounded mr-2"
              />
              <button
                onClick={handleAddSequence}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Add Sequence
              </button>
            </div>
          )}

          {/* Scene Selection */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Scenes</h3>
            <div className="space-y-2">
              {getUniqueScenes().map((scene) => (
                <button
                  key={scene}
                  onClick={() => handleSceneSelect(scene)}
                  className={`w-full text-left p-3 rounded-md transition-colors ${
                    selectedScene === scene
                      ? "bg-blue-100 text-blue-800 border-2 border-blue-300"
                      : "bg-white hover:bg-gray-100 border-2 border-transparent"
                  }`}
                >
                  <div className="font-medium">{scene}</div>
                  <div className="text-sm text-gray-600">
                    {getSequencesForScene(scene).length} sequences
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sequence Selection */}
          {selectedScene && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Sequences
              </h3>
              <div className="space-y-2">
                {getSequencesForScene(selectedScene).map((sequence) => (
                  <button
                    key={sequence.sequence}
                    onClick={() => handleSequenceSelect(sequence.sequence)}
                    className={`w-full text-left p-3 rounded-md transition-colors ${
                      selectedSequence === sequence.sequence
                        ? "bg-green-100 text-green-800 border-2 border-green-300"
                        : "bg-white hover:bg-gray-100 border-2 border-transparent"
                    }`}
                  >
                    <div className="font-medium">{sequence.sequence}</div>
                    <div className="text-sm text-gray-600">
                      {sequence.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {sequence.dialogueCount} dialogues
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dialogue Details */}
          {selectedSequence && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Details
              </h3>
              {(() => {
                const selectedDialogue = dialogues
                  .find((d) => d.scene === selectedScene)
                  ?.sequences.find((s) => s.sequence === selectedSequence);

                return selectedDialogue ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <p className="text-gray-900">{selectedDialogue.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Created
                      </label>
                      <p className="text-gray-900">
                        {selectedDialogue.timestamp
                          ? new Date(
                              selectedDialogue.timestamp
                            ).toLocaleDateString()
                          : "Unknown"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Dialogues
                      </label>
                      <p className="text-gray-900">
                        {selectedDialogue.dialogueCount}
                      </p>
                    </div>

                    {/* Dialogue Content Preview */}
                    {selectedDialogueContent && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preview
                        </label>
                        <div className="bg-white rounded border p-3 max-h-32 overflow-y-auto">
                          {selectedDialogueContent.dialogues
                            .slice(0, 3)
                            .map((dialogue, index) => (
                              <div key={index} className="text-sm mb-2">
                                {dialogue.type === "narration" ? (
                                  <span className="text-gray-600 italic">
                                    {dialogue.text}
                                  </span>
                                ) : dialogue.type === "character" ? (
                                  <span>
                                    <strong>{dialogue.speaker}:</strong>{" "}
                                    {dialogue.text}
                                  </span>
                                ) : dialogue.type === "choice" ? (
                                  <div className="border-l-2 border-blue-300 pl-2">
                                    <div className="font-medium text-blue-700">
                                      {dialogue.question}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      {dialogue.options.length} options
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-500">
                                    Unknown type: {dialogue.type}
                                  </span>
                                )}
                              </div>
                            ))}
                          {selectedDialogueContent.dialogues.length > 3 && (
                            <div className="text-xs text-gray-500">
                              ... and{" "}
                              {selectedDialogueContent.dialogues.length - 3}{" "}
                              more
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 space-y-2">
                      <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                        Edit Dialogue
                      </button>
                      <button
                        onClick={handleExportSelectedSequence}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Export JSON
                      </button>
                      <button className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No dialogue selected</p>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DialogueManager;
