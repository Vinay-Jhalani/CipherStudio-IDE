import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProject } from "../context/ProjectContext";
import CodeEditorPanel from "../components/CodeEditorPanel";
import LoadingAnimation from "../components/LoadingAnimation";
import { FiArrowLeft, FiSave } from "react-icons/fi";

const Editor = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { currentProject, loadProject, loading } = useProject();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    const saved = localStorage.getItem("autoSaveEnabled");
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save auto-save preference to localStorage
  useEffect(() => {
    localStorage.setItem("autoSaveEnabled", JSON.stringify(autoSaveEnabled));
  }, [autoSaveEnabled]);
  const codeEditorRef = useRef(null);

  // Helper function to get relative time
  const getRelativeTime = useCallback((date) => {
    if (!date) return "";
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 30) return "just now";
    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleString();
  }, []);

  // Update relative time every 10 seconds
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!lastSaved) return;
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, [lastSaved]);

  const handleManualSave = useCallback(async () => {
    if (codeEditorRef.current) {
      setIsSaving(true);
      try {
        await codeEditorRef.current.saveNow();
        setTimeout(() => setIsSaving(false), 1000);
      } catch (error) {
        setIsSaving(false);
        alert("Failed to save files: " + error.message);
      }
    }
  }, []);

  useEffect(() => {
    if (user && projectId) {
      loadProject(projectId).catch(() => {
        alert("Failed to load project");
        navigate("/dashboard");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, user]);

  // Add keyboard shortcut for save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleManualSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleManualSave]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#151515" }}
      >
        <LoadingAnimation message="Loading project..." />
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: "#151515" }}
    >
      {/* Top Bar */}
      <div className="bg-[#1e1e1e] border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-gray-400 hover:text-white transition"
          >
            <FiArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3 border-r border-gray-700 pr-4">
            <img src="/Logo.png" alt="CipherStudio Logo" className="h-8" />
            <span className="text-white font-bold text-xl">CipherStudio</span>
          </div>
          <div>
            <h1 className="text-white font-semibold">{currentProject?.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-save toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition">
            <button
              onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                autoSaveEnabled ? "bg-indigo-600" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoSaveEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span>Auto-save</span>
          </label>

          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50"
          >
            <FiSave />
            {isSaving ? "Saving..." : "Save"}
          </button>

          {lastSaved && !isSaving && (
            <span className="text-xs text-gray-400">
              Last saved: {getRelativeTime(lastSaved)}
            </span>
          )}
        </div>
      </div>

      {/* Main Content - Full Width Code Editor with Sandpack File Explorer */}
      <div className="flex-1 overflow-hidden ">
        <CodeEditorPanel
          ref={codeEditorRef}
          onLastSavedChange={setLastSaved}
          autoSaveEnabled={autoSaveEnabled}
        />
      </div>
    </div>
  );
};

export default Editor;
