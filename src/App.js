import React, { useState } from "react";
import DialogueConverter from "./components/DialogueConverter";
import DialogueManager from "./components/DialogueManager";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("converter");

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-800">
                Dialogue Studio
              </h1>
              <span className="text-sm text-gray-500">
                Professional Dialogue Management
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">v1.0.0</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("converter")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "converter"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Dialogue Converter
            </button>
            <button
              onClick={() => setActiveTab("manager")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "manager"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Dialogue Manager
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-6">
        {activeTab === "converter" ? (
          <DialogueConverter />
        ) : (
          <DialogueManager />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="text-center text-sm text-gray-500">
            <p>Dialogue Studio </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
