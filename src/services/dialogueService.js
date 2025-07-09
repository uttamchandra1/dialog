class DialogueService {
  static validateDialogueText(text) {
    const lines = text.split("\n").filter((line) => line.trim());
    const errors = [];

    if (lines.length === 0) {
      errors.push("No dialogue text provided");
      return errors;
    }

    let hasValidDialogue = false;
    let inChoiceBlock = false;
    let choiceOptions = 0;
    let choiceTargets = 0;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Check for choice block start
      if (trimmedLine.startsWith("CHOICE:")) {
        inChoiceBlock = true;
        hasValidDialogue = true;
        choiceOptions = 0;
        choiceTargets = 0;
        return;
      }

      // Check for choice block end
      if (inChoiceBlock && trimmedLine.startsWith("END_CHOICE")) {
        inChoiceBlock = false;
        if (choiceOptions === 0) {
          errors.push(
            `Line ${index + 1}: Choice block must have at least one option`
          );
        }
        if (choiceTargets === 0) {
          errors.push(
            `Line ${
              index + 1
            }: Choice block must have at least one target sequence`
          );
        }
        return;
      }

      // Handle choice block content
      if (inChoiceBlock) {
        if (trimmedLine.startsWith("OPTION:")) {
          choiceOptions++;
        } else if (trimmedLine.startsWith("TARGET:")) {
          choiceTargets++;
        }
        return;
      }

      // Check for narration
      if (trimmedLine.startsWith("NARRATION:")) {
        hasValidDialogue = true;
        const narrationText = trimmedLine.substring(10).trim();
        if (!narrationText) {
          errors.push(`Line ${index + 1}: Empty narration text`);
        }
        return;
      }

      // Check for character dialogue
      if (trimmedLine.includes(":") && !trimmedLine.startsWith("Dialogue")) {
        hasValidDialogue = true;
        const colonIndex = trimmedLine.indexOf(":");
        const speaker = trimmedLine.substring(0, colonIndex).trim();
        const text = trimmedLine.substring(colonIndex + 1).trim();

        if (!speaker) {
          errors.push(`Line ${index + 1}: Empty speaker name`);
        }
        if (!text) {
          errors.push(`Line ${index + 1}: Empty dialogue text`);
        }
      } else if (trimmedLine && !trimmedLine.startsWith("Dialogue")) {
        errors.push(
          `Line ${
            index + 1
          }: Invalid format. Use NARRATION:, CHARACTER:, or CHOICE: format`
        );
      }
    });

    if (!hasValidDialogue) {
      errors.push(
        "No valid dialogue found. Use NARRATION:, CHARACTER:, or CHOICE: format."
      );
    }

    return errors;
  }

  static generateFolderStructure(scene, sequence) {
    return {
      basePath: "Dialogues",
      scenePath: `Dialogues/SCENE_${scene.padStart(2, "0")}`,
      sequencePath: `Dialogues/SCENE_${scene.padStart(
        2,
        "0"
      )}/SEQUENCE_${sequence.padStart(2, "0")}`,
      filePath: `Dialogues/SCENE_${scene.padStart(
        2,
        "0"
      )}/SEQUENCE_${sequence.padStart(2, "0")}/dialogue.json`,
    };
  }

  static createDialogueJson(dialogues, metadata) {
    return {
      metadata: {
        ...metadata,
        version: "1.0.0",
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
      dialogues: dialogues.map((dialogue) => ({
        ...dialogue,
        id: this.generateId(),
        timestamp: new Date().toISOString(),
      })),
    };
  }

  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static exportToFileSystem(jsonData, fileName) {
    // This would integrate with a backend service in a real application
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // New methods for batch processing
  static convertTextToDialogues(text) {
    const lines = text.split("\n").filter((line) => line.trim());
    const dialogues = [];
    let currentSpeaker = "";
    let currentText = "";
    let inChoiceBlock = false;
    let currentChoice = null;

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Handle choice block start
      if (trimmedLine.startsWith("CHOICE:")) {
        // Save previous dialogue if exists
        if (currentSpeaker && currentText) {
          dialogues.push({
            type: "character",
            speaker: currentSpeaker,
            text: `"${currentText.trim()}"`,
          });
          currentSpeaker = "";
          currentText = "";
        }

        inChoiceBlock = true;
        const question = trimmedLine.substring(7).trim();
        currentChoice = {
          type: "choice",
          question: question,
          options: [],
          targetSequences: [],
        };
        return;
      }

      // Handle choice block end
      if (inChoiceBlock && trimmedLine.startsWith("END_CHOICE")) {
        inChoiceBlock = false;
        if (currentChoice && currentChoice.options.length > 0) {
          dialogues.push(currentChoice);
        }
        currentChoice = null;
        return;
      }

      // Handle choice options
      if (inChoiceBlock && trimmedLine.startsWith("OPTION:")) {
        const option = trimmedLine.substring(7).trim();
        if (currentChoice) {
          currentChoice.options.push(`"${option}"`);
        }
        return;
      }

      // Handle choice targets
      if (inChoiceBlock && trimmedLine.startsWith("TARGET:")) {
        const target = trimmedLine.substring(7).trim();
        if (currentChoice) {
          currentChoice.targetSequences.push(target);
        }
        return;
      }

      // Handle narration
      if (trimmedLine.startsWith("NARRATION:")) {
        // Save previous dialogue if exists
        if (currentSpeaker && currentText) {
          dialogues.push({
            type: "character",
            speaker: currentSpeaker,
            text: `"${currentText.trim()}"`,
          });
          currentSpeaker = "";
          currentText = "";
        }

        const narrationText = trimmedLine.substring(10).trim();
        dialogues.push({
          type: "narration",
          text: narrationText,
        });
        return;
      }

      // Handle character dialogue
      if (trimmedLine.includes(":") && !trimmedLine.startsWith("Dialogue")) {
        // Save previous dialogue if exists
        if (currentSpeaker && currentText) {
          dialogues.push({
            type: "character",
            speaker: currentSpeaker,
            text: `"${currentText.trim()}"`,
          });
        }

        const colonIndex = trimmedLine.indexOf(":");
        currentSpeaker = trimmedLine.substring(0, colonIndex).trim();
        currentText = trimmedLine.substring(colonIndex + 1).trim();
      } else if (trimmedLine && currentSpeaker) {
        // Continue text for current speaker
        currentText += (currentText ? " " : "") + trimmedLine;
      }
    });

    // Add the last dialogue
    if (currentSpeaker && currentText) {
      dialogues.push({
        type: "character",
        speaker: currentSpeaker,
        text: `"${currentText.trim()}"`,
      });
    }

    return dialogues;
  }

  static createBatchDialogueData(text, scene, sequence, title) {
    const dialogues = this.convertTextToDialogues(text);

    return {
      metadata: {
        scene: `SCENE_${scene.padStart(2, "0")}`,
        sequence: `SEQUENCE_${sequence.padStart(2, "0")}`,
        title: title || `Dialogue ${scene}-${sequence}`,
        timestamp: new Date().toISOString(),
        totalDialogues: dialogues.length,
      },
      dialogues: dialogues,
    };
  }

  static createExportStructure(dialogueData) {
    // Create the JSON structure matching your existing format - just the dialogues array
    return {
      dialogues: dialogueData.dialogues.map((d) => {
        if (d.type === "narration") {
          return {
            type: "narration",
            text: d.text,
          };
        } else if (d.type === "character") {
          return {
            type: "character",
            speaker: d.speaker,
            text: d.text,
          };
        } else if (d.type === "choice") {
          return {
            type: "choice",
            question: d.question,
            options: d.options,
            targetSequences: d.targetSequences,
          };
        }
        return d;
      }),
    };
  }

  static generateZipFileStructure(batchDialogues) {
    const structure = {};

    batchDialogues.forEach((dialogue) => {
      const { metadata } = dialogue;
      const scenePath = metadata.scene;
      const sequencePath = `${scenePath}/${metadata.sequence}`;
      const filePath = `${sequencePath}/dialogue.json`;

      // Only export the clean dialogues structure, no metadata
      structure[filePath] = {
        dialogues: dialogue.dialogues.map((d) => {
          if (d.type === "narration") {
            return {
              type: "narration",
              text: d.text,
            };
          } else if (d.type === "character") {
            return {
              type: "character",
              speaker: d.speaker,
              text: d.text,
            };
          } else if (d.type === "choice") {
            return {
              type: "choice",
              question: d.question,
              options: d.options,
              targetSequences: d.targetSequences,
            };
          }
          return d;
        }),
      };
    });

    return structure;
  }

  // Method to scan existing Dialogues folder structure
  static async scanExistingDialogues() {
    try {
      // In a real application, this would be an API call to the backend
      // For now, we'll simulate the structure based on your existing folders
      const mockStructure = [
        {
          scene: "SCENE_01",
          sequences: [
            {
              sequence: "SEQUENCE_01",
              title: "Holmes and Watson Conversation",
              dialogueCount: 4,
            },
            {
              sequence: "SEQUENCE_02",
              title: "Client Arrival",
              dialogueCount: 3,
            },
            {
              sequence: "SEQUENCE_03",
              title: "Investigation Begins",
              dialogueCount: 5,
            },
            {
              sequence: "SEQUENCE_04",
              title: "Evidence Collection",
              dialogueCount: 6,
            },
            { sequence: "SEQUENCE_05", title: "First Clue", dialogueCount: 4 },
            {
              sequence: "SEQUENCE_05A",
              title: "Alternative Path A",
              dialogueCount: 3,
            },
            {
              sequence: "SEQUENCE_05B",
              title: "Alternative Path B",
              dialogueCount: 3,
            },
            {
              sequence: "SEQUENCE_05C",
              title: "Alternative Path C",
              dialogueCount: 3,
            },
            {
              sequence: "SEQUENCE_06",
              title: "Suspect Interview",
              dialogueCount: 7,
            },
            {
              sequence: "SEQUENCE_07",
              title: "New Evidence",
              dialogueCount: 5,
            },
            {
              sequence: "SEQUENCE_08",
              title: "Breakthrough",
              dialogueCount: 6,
            },
            {
              sequence: "SEQUENCE_08A",
              title: "Alternative Breakthrough A",
              dialogueCount: 4,
            },
            {
              sequence: "SEQUENCE_08B",
              title: "Alternative Breakthrough B",
              dialogueCount: 4,
            },
            {
              sequence: "SEQUENCE_08C",
              title: "Alternative Breakthrough C",
              dialogueCount: 4,
            },
            { sequence: "SEQUENCE_09", title: "Resolution", dialogueCount: 8 },
          ],
        },
        {
          scene: "SCENE_02",
          sequences: [
            {
              sequence: "SEQUENCE_01",
              title: "Station Interior",
              dialogueCount: 3,
            },
            {
              sequence: "SEQUENCE_02",
              title: "Security Check",
              dialogueCount: 4,
            },
            {
              sequence: "SEQUENCE_03",
              title: "Meeting Point",
              dialogueCount: 5,
            },
            {
              sequence: "SEQUENCE_04",
              title: "Information Exchange",
              dialogueCount: 6,
            },
            {
              sequence: "SEQUENCE_05",
              title: "Plan Discussion",
              dialogueCount: 7,
            },
            { sequence: "SEQUENCE_06", title: "Preparation", dialogueCount: 4 },
            {
              sequence: "SEQUENCE_06A",
              title: "Alternative Prep A",
              dialogueCount: 3,
            },
            {
              sequence: "SEQUENCE_06B",
              title: "Alternative Prep B",
              dialogueCount: 3,
            },
            {
              sequence: "SEQUENCE_06C",
              title: "Alternative Prep C",
              dialogueCount: 3,
            },
            {
              sequence: "SEQUENCE_06D",
              title: "Alternative Prep D",
              dialogueCount: 3,
            },
            { sequence: "SEQUENCE_07", title: "Execution", dialogueCount: 8 },
            {
              sequence: "SEQUENCE_08",
              title: "Complications",
              dialogueCount: 6,
            },
            {
              sequence: "SEQUENCE_08A",
              title: "Alternative Complication A",
              dialogueCount: 4,
            },
            {
              sequence: "SEQUENCE_08B",
              title: "Alternative Complication B",
              dialogueCount: 4,
            },
            {
              sequence: "SEQUENCE_08C",
              title: "Alternative Complication C",
              dialogueCount: 4,
            },
            {
              sequence: "SEQUENCE_08D",
              title: "Alternative Complication D",
              dialogueCount: 4,
            },
            { sequence: "SEQUENCE_09", title: "Adaptation", dialogueCount: 7 },
            { sequence: "SEQUENCE_10", title: "Success", dialogueCount: 5 },
          ],
        },
      ];

      return mockStructure;
    } catch (error) {
      console.error("Error scanning dialogues:", error);
      return [];
    }
  }

  // Method to get dialogue content for a specific scene/sequence
  static async getDialogueContent(scene, sequence) {
    try {
      // In a real application, this would fetch the actual JSON file
      // For now, we'll return a mock structure
      const mockContent = {
        dialogues: [
          {
            type: "narration",
            text: `Location: ${scene} - ${sequence}`,
          },
          {
            type: "character",
            speaker: "Holmes",
            text: '"Elementary, my dear Watson."',
          },
          {
            type: "character",
            speaker: "Watson",
            text: '"I see you\'ve been busy with your chemistry experiments again."',
          },
          {
            type: "choice",
            question: "How do you want to proceed with the investigation?",
            options: [
              '"Let\'s examine the crime scene more closely."',
              '"We should interview the witnesses first."',
              '"I think we need to check the victim\'s background."',
            ],
            targetSequences: [
              "SCENE_02/SEQUENCE_05A",
              "SCENE_02/SEQUENCE_05B",
              "SCENE_02/SEQUENCE_05C",
            ],
          },
        ],
      };

      return mockContent;
    } catch (error) {
      console.error("Error getting dialogue content:", error);
      return null;
    }
  }
}

export default DialogueService;
