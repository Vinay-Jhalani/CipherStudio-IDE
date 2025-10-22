import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackConsole,
  useSandpack,
} from "@codesandbox/sandpack-react";
import CustomFileExplorer from "./CustomFileExplorer";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { useProject } from "../context/ProjectContext";
import * as apiService from "../services/apiService";
import prettier from "prettier/standalone";
import parserBabel from "prettier/plugins/babel";
import parserEstree from "prettier/plugins/estree";
import parserTypescript from "prettier/plugins/typescript";
import parserHtml from "prettier/plugins/html";
import parserPostcss from "prettier/plugins/postcss";

// Inner component that has access to Sandpack context
const SandpackContent = ({ onFilesChange, onSaveRequest, onInitialSync }) => {
  const { sandpack } = useSandpack();
  const { projectFiles, loadFile } = useProject();
  const prevFilesRef = useRef(sandpack.files);
  const [showConsole, setShowConsole] = useState(false);
  const [openedFiles, setOpenedFiles] = useState([]);
  const hasInitialSyncedRef = useRef(false);

  // Build file path from file object
  const getFilePath = useCallback(
    (file) => {
      const buildPath = (f, parts = []) => {
        parts.unshift(f.name);
        if (f.parentId) {
          const parent = projectFiles.find((pf) => pf._id === f.parentId);
          if (parent) {
            return buildPath(parent, parts);
          }
        }
        return parts;
      };
      return "/" + buildPath(file).join("/");
    },
    [projectFiles]
  );

  // Handle file selection from CustomFileExplorer
  const handleFileSelect = useCallback(
    async (file) => {
      if (file.type !== "file") return;

      const filePath = getFilePath(file);

      // Check if file exists in Sandpack
      if (sandpack.files[filePath]) {
        // File already loaded in Sandpack
        sandpack.openFile(filePath);
        setOpenedFiles((prev) => {
          if (!prev.includes(filePath)) {
            return [...prev, filePath];
          }
          return prev;
        });
      } else {
        // File not in Sandpack yet - need to load content from backend or add new file
        try {
          // Load file content from S3/backend using context method
          const fileWithContent = await loadFile(file._id);

          // Add to Sandpack with content (empty string for new files)
          const content = fileWithContent.content || "";
          sandpack.updateFile(filePath, content);
          sandpack.openFile(filePath);

          setOpenedFiles((prev) => {
            if (!prev.includes(filePath)) {
              return [...prev, filePath];
            }
            return prev;
          });
        } catch (error) {
          console.error("❌ Error loading file content:", error);
          alert("Failed to load file content: " + error.message);
        }
      }
    },
    [sandpack, getFilePath, loadFile]
  );

  // Function to open preview in new tab using CodeSandbox
  const openInNewTab = useCallback(async () => {
    try {
      // Use Sandpack's API to create a CodeSandbox and open the preview URL
      const response = await fetch(
        "https://codesandbox.io/api/v1/sandboxes/define?json=1",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            files: Object.entries(sandpack.files).reduce(
              (acc, [path, file]) => {
                acc[path.replace(/^\//, "")] = {
                  content: file.code,
                };
                return acc;
              },
              {}
            ),
          }),
        }
      );

      const data = await response.json();
      const sandboxId = data.sandbox_id;

      if (sandboxId) {
        // Add cache-busting timestamp to force fresh load
        const timestamp = Date.now();
        const previewUrl = `https://${sandboxId}.csb.app?t=${timestamp}`;

        // Open in a new window with proper cache control
        const newWindow = window.open(
          previewUrl,
          "_blank",
          "noopener,noreferrer"
        );

        // Force reload after a short delay to ensure fresh content
        if (newWindow) {
          setTimeout(() => {
            try {
              newWindow.location.reload(true); // Hard reload
            } catch {
              // Cross-origin restriction, ignore
            }
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Failed to create CodeSandbox:", error);
      // Fallback: try to open the local preview in a popup
      const previewWindow = window.open("", "_blank", "width=1200,height=800");
      if (previewWindow) {
        // Create a simple HTML page with the preview content
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Preview</title>
              <style>
                body { margin: 0; padding: 20px; font-family: system-ui, sans-serif; }
                .error { color: #d32f2f; background: #ffebee; padding: 16px; border-radius: 4px; }
              </style>
            </head>
            <body>
              <div class="error">
                <h3>Preview Unavailable</h3>
                <p>The preview cannot be opened in a new tab because it runs in a sandboxed environment.</p>
                <p>Use the built-in preview panel to view your application.</p>
              </div>
            </body>
          </html>
        `;
        previewWindow.document.write(html);
        previewWindow.document.close();
      }
    }
  }, [sandpack]);

  // Format document function using imported Prettier (npm package)
  const formatDocument = useCallback(async () => {
    if (!sandpack.activeFile) {
      return;
    }

    try {
      const currentFile = sandpack.files[sandpack.activeFile];
      if (!currentFile || !currentFile.code) {
        return;
      }

      const code = currentFile.code;
      const filePath = sandpack.activeFile;

      // Determine parser based on file extension
      let parser = "babel"; // default for JS/JSX/React

      if (filePath.endsWith(".js") || filePath.endsWith(".jsx")) {
        parser = "babel";
      } else if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
        parser = "typescript";
      } else if (
        filePath.endsWith(".vue") ||
        filePath.endsWith(".html") ||
        filePath.endsWith(".svelte")
      ) {
        parser = "html";
      } else if (
        filePath.endsWith(".css") ||
        filePath.endsWith(".scss") ||
        filePath.endsWith(".sass")
      ) {
        parser = "css";
      } else if (filePath.endsWith(".json")) {
        parser = "json";
      }

      // Build plugins array - estree is required for babel parser
      const plugins = [
        parserBabel,
        parserEstree,
        parserTypescript,
        parserHtml,
        parserPostcss,
      ];

      // Format using the imported prettier package (async in Prettier 3)
      const formatted = await prettier.format(code, {
        parser,
        plugins,
        semi: true,
        singleQuote: false,
        tabWidth: 2,
        trailingComma: "es5",
        printWidth: 80,
        arrowParens: "always",
        bracketSpacing: true,
      });

      // Update the file with formatted code
      sandpack.updateFile(sandpack.activeFile, formatted);
    } catch (error) {
      console.error("❌ Format failed:", error);
      alert(`Format failed: ${error.message}`);
    }
  }, [sandpack]);

  // Add keyboard shortcut for format document (Shift+Alt+F)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.shiftKey && event.altKey && event.key === "F") {
        event.preventDefault();
        formatDocument();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [formatDocument]);

  // Auto-sync template files to MongoDB on initial load (for new projects)
  useEffect(() => {
    // Only run once on mount
    if (hasInitialSyncedRef.current) return;

    // Check if this is a new project (no files in database)
    if (projectFiles.length === 0 && Object.keys(sandpack.files).length > 0) {
      hasInitialSyncedRef.current = true;

      // Delay slightly to ensure Sandpack has fully initialized
      setTimeout(() => {
        onInitialSync(sandpack.files);
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  useEffect(() => {
    // Monitor for file changes
    const currentFiles = sandpack.files;

    // Check if files have actually changed
    const filesChanged =
      JSON.stringify(currentFiles) !== JSON.stringify(prevFilesRef.current);

    if (filesChanged) {
      onFilesChange(currentFiles);
      prevFilesRef.current = currentFiles;
    }
  }, [sandpack.files, onFilesChange]);

  // Mark initial mount complete after a short delay to prevent auto-save on load
  useEffect(() => {
    // Give Sandpack time to initialize before we start tracking changes
    const timer = setTimeout(() => {
      onFilesChange(sandpack.files);
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Expose save function that gets current Sandpack files directly
  useImperativeHandle(onSaveRequest, () => ({
    getCurrentFiles: () => sandpack.files,
  }));

  // Custom tab component with close functionality
  const CustomTabs = () => {
    const { sandpack } = useSandpack();

    const handleTabClick = (filePath) => {
      sandpack.openFile(filePath);
    };

    const handleTabClose = (filePath, event) => {
      event.stopPropagation(); // Prevent triggering tab click

      // Use Sandpack's closeFile method to properly close the tab
      sandpack.closeFile(filePath);

      // Remove from our opened files list
      setOpenedFiles((prev) => prev.filter((path) => path !== filePath));
    };

    // Update opened files when active file changes (when files are opened from explorer)
    useEffect(() => {
      if (sandpack.activeFile && !openedFiles.includes(sandpack.activeFile)) {
        setOpenedFiles((prev) => {
          // Double-check to prevent duplicates
          if (!prev.includes(sandpack.activeFile)) {
            return [...prev, sandpack.activeFile];
          }
          return prev;
        });
      }
    }, [sandpack.activeFile]);

    // Initialize opened files when component mounts or files change
    useEffect(() => {
      if (Object.keys(sandpack.files).length > 0 && openedFiles.length === 0) {
        // If there's no active file, open the first one
        if (!sandpack.activeFile) {
          const allFiles = Object.keys(sandpack.files);
          const fileToOpen = allFiles[0];
          if (fileToOpen) {
            sandpack.openFile(fileToOpen);
          }
        }
        // If there's already an active file, the tracking useEffect will add it to openedFiles
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sandpack.files]);

    return (
      <div className="flex items-center bg-[#151515] border-b border-gray-700 overflow-x-auto min-h-10">
        {openedFiles && openedFiles.length > 0 ? (
          openedFiles.map((filePath) => {
            const isActive = sandpack.activeFile === filePath;
            const fileName = filePath.split("/").pop();

            return (
              <div
                key={filePath}
                onClick={() => handleTabClick(filePath)}
                className={`flex items-center px-3 py-2 cursor-pointer border-r border-gray-700 hover:bg-gray-700 transition-colors ${
                  isActive
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <span className="text-sm truncate max-w-32">{fileName}</span>
                {openedFiles && openedFiles.length > 1 && (
                  <button
                    onClick={(e) => handleTabClose(filePath, e)}
                    className="ml-2 p-1 rounded hover:bg-gray-600 transition-colors opacity-60 hover:opacity-100"
                    title="Close tab"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 4L4 8M4 4L8 8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="px-3 py-2 text-gray-500 text-sm">No files open</div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <SandpackLayout style={{ height: "100%", width: "100%" }}>
          <Allotment>
            <Allotment.Pane minSize={200} maxSize={400}>
              {/* Custom File Explorer with full folder/file tracking */}
              <CustomFileExplorer
                onFileSelect={handleFileSelect}
                selectedFilePath={sandpack.activeFile}
              />
            </Allotment.Pane>
            <Allotment.Pane minSize={300}>
              <Allotment vertical>
                <Allotment.Pane minSize={200}>
                  <Allotment>
                    <Allotment.Pane minSize={300}>
                      <div className="h-full flex flex-col">
                        <CustomTabs />
                        <SandpackCodeEditor
                          showTabs={false} // Disable default tabs since we have custom ones
                          showLineNumbers
                          showInlineErrors
                          wrapContent
                          style={{ height: "100%", flex: 1 }}
                        />
                      </div>
                    </Allotment.Pane>
                    <Allotment.Pane minSize={300}>
                      <SandpackPreview
                        showOpenInCodeSandbox={false}
                        showRefreshButton={true}
                        style={{ height: "100%" }}
                      />
                    </Allotment.Pane>
                  </Allotment>
                </Allotment.Pane>
                {showConsole && (
                  <Allotment.Pane minSize={150} preferredSize={200}>
                    <SandpackConsole style={{ height: "100%" }} />
                  </Allotment.Pane>
                )}
              </Allotment>
            </Allotment.Pane>
          </Allotment>
        </SandpackLayout>
      </div>

      {/* Status Bar with Console Toggle */}
      <div className="h-6 bg-[#151515] border-t border-gray-700 flex items-center justify-between px-2 text-white text-xs flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Left side - you can add more status items here */}
        </div>
        <div className="flex items-center gap-2">
          {/* Right side - Format, Open in Tab, and Console buttons */}
          <button
            onClick={formatDocument}
            className="flex items-center gap-1 px-2 py-0.5 hover:bg-white/10 transition-colors cursor-pointer"
            title="Format Document (Shift+Alt+F)"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M3 1H13V3H3V1Z" fill="currentColor" />
              <path d="M1 5H15V7H1V5Z" fill="currentColor" />
              <path d="M3 9H13V11H3V9Z" fill="currentColor" />
              <path d="M1 13H15V15H1V13Z" fill="currentColor" />
            </svg>
            <span>Format</span>
          </button>
          <button
            onClick={openInNewTab}
            className="flex items-center gap-1 px-2 py-0.5 hover:bg-white/10 transition-colors cursor-pointer"
            title="Open Preview in New Tab"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14 9V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H7M11 2H14M14 2V5M14 2L7 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Open Preview (New Tab)</span>
          </button>
          <button
            onClick={() => setShowConsole(!showConsole)}
            className="flex items-center gap-1 px-2 py-0.5 hover:bg-white/10 transition-colors cursor-pointer"
            title={showConsole ? "Hide Console" : "Show Console"}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 3.5L5.5 8L1 12.5M6 12.5H15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{showConsole ? "Hide Console" : "Console"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const CodeEditorPanel = forwardRef((props, ref) => {
  const {
    projectFiles,
    currentProject,
    updateFileContent,
    createFileOrFolder,
    deleteFileOrFolder,
    moveFileOrFolder,
  } = useProject();
  const [files, setFiles] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingFiles, setIsGeneratingFiles] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const sandpackContentRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const isSaveOperationRef = useRef(false);
  const lastSaveTimeRef = useRef(null);
  const hasInitialSyncedRef = useRef(false); // Track if initial template sync has happened
  const [sandpackKey, setSandpackKey] = useState(0);
  const autoSaveTimerRef = useRef(null);
  const filesChangedRef = useRef(false);

  // Destructure props to avoid dependency issues
  const { autoSaveEnabled, onLastSavedChange, onAutoSavingChange } = props;

  // Pass lastSaved to parent via callback if provided
  useEffect(() => {
    if (onLastSavedChange && lastSaved) {
      onLastSavedChange(lastSaved);
    }
  }, [lastSaved, onLastSavedChange]);

  // (Removed relative time functions - moved to Editor component)

  // Expose manual save function to parent component
  useImperativeHandle(ref, () => ({
    saveNow: async () => {
      // Get current files directly from Sandpack
      const currentFiles = sandpackContentRef.current?.getCurrentFiles();

      if (currentFiles && Object.keys(currentFiles).length > 0) {
        return saveFilesToBackend(currentFiles);
      } else {
        return Promise.resolve();
      }
    },
  }));

  // Save all current Sandpack files to backend (only called manually)
  const saveFilesToBackend = useCallback(
    async (sandpackFiles, isAutoSave = false) => {
      if (!currentProject) {
        return;
      }

      // Validate that we have valid file data before saving
      const hasValidFiles = Object.values(sandpackFiles).some(
        (fileData) => fileData && typeof fileData.code !== "undefined"
      );

      if (!hasValidFiles) {
        if (!isAutoSave) {
          alert(
            "Unable to save: Files are not ready yet. Please wait a moment and try again."
          );
        }
        return;
      }

      try {
        // Only show UI indicators for manual saves, not auto-saves
        if (!isAutoSave) {
          setIsSaving(true);
        }
        isSaveOperationRef.current = true;

        // Helper function to build file path from projectFiles
        const buildFilePath = (file) => {
          if (!file.parentId) return file.name;
          const parent = projectFiles.find((pf) => pf._id === file.parentId);
          if (!parent) return file.name;
          const parentPath = buildFilePath(parent);
          return parentPath ? `${parentPath}/${file.name}` : file.name;
        };

        // Step 1: Build a map for quick lookup: content fingerprint -> backend file
        // This helps detect renames and moves BEFORE we delete anything
        const backendFilesByContent = new Map();
        const backendFilesByPath = new Map();

        projectFiles.forEach((f) => {
          if (f.type === "file") {
            const backendPath = buildFilePath(f);
            backendFilesByPath.set(backendPath, f);

            if (f.content) {
              // Use first 200 chars as fingerprint (enough to identify unique files)
              const fingerprint = f.content.substring(0, 200);
              if (!backendFilesByContent.has(fingerprint)) {
                backendFilesByContent.set(fingerprint, []);
              }
              backendFilesByContent.get(fingerprint).push(f);
            }
          }
        });

        // Step 3: Match Sandpack files with backend files
        // Track which backend files are still in use (matched by path OR content)
        const backendFilesInUse = new Set();

        // First pass: Match all Sandpack files to find which backend files are still needed
        for (const [filePath, fileData] of Object.entries(sandpackFiles)) {
          if (!fileData || typeof fileData.code === "undefined") continue;

          const normalizedPath = filePath.replace(/^\//, "");

          // Skip .tempdata files - these are temporary placeholders for empty folders
          if (normalizedPath.endsWith(".tempdata")) {
            continue;
          }

          const currentCode = fileData.code;

          // Skip Sandpack folder markers in matching phase too
          if (
            currentCode === "//#folder#//" ||
            currentCode.trim() === "//#folder#//"
          ) {
            continue;
          }

          const fingerprint = currentCode.substring(0, 200);

          // Try exact path match first
          let matchedFile = backendFilesByPath.get(normalizedPath);

          // If not found by path, try content fingerprint match (renamed/moved file)
          if (!matchedFile) {
            const matchingFiles = backendFilesByContent.get(fingerprint) || [];
            matchedFile = matchingFiles.find(
              (f) => !backendFilesInUse.has(f._id)
            );
          }

          if (matchedFile) {
            backendFilesInUse.add(matchedFile._id);
          }
        }

        // Step 4: Delete files that are NOT in use (truly deleted files)
        // Also delete any .tempdata files that might have been saved previously
        const filesToDelete = projectFiles.filter((f) => {
          if (f.type !== "file") return false;
          // Delete if not in use OR if it's a .tempdata file
          return !backendFilesInUse.has(f._id) || f.name === ".tempdata";
        });

        for (const file of filesToDelete) {
          await deleteFileOrFolder(file._id);
        }

        // Step 5: Process each Sandpack file (create/update/move/rename)
        const processedFileIds = new Set(); // Track which backend files we've updated

        for (const [filePath, fileData] of Object.entries(sandpackFiles)) {
          const normalizedPath = filePath.replace(/^\//, ""); // Remove leading slash

          // Skip if fileData is invalid or code is undefined
          if (!fileData || typeof fileData.code === "undefined") {
            continue;
          }

          // Skip .tempdata files - these are temporary placeholders for empty folders
          if (normalizedPath.endsWith(".tempdata")) {
            continue;
          }

          const currentCode = fileData.code;

          // IMPORTANT: Sandpack represents folders as files with special marker content
          // Skip these folder markers - folders are created automatically when files are saved
          if (
            currentCode === "//#folder#//" ||
            currentCode.trim() === "//#folder#//"
          ) {
            continue;
          }

          // Split path into folder and filename
          const pathParts = normalizedPath.split("/");
          const fileName = pathParts[pathParts.length - 1];
          const folderPath = pathParts.slice(0, -1).join("/");

          // Find existing file by EXACT path match first
          let existingFile = backendFilesByPath.get(normalizedPath);

          // If not found by path, try to find by content (file was moved/renamed)
          if (!existingFile) {
            const fingerprint = currentCode.substring(0, 200);
            const matchingFiles = backendFilesByContent.get(fingerprint) || [];

            // Find a file that hasn't been processed yet (to avoid duplicate matches)
            existingFile = matchingFiles.find(
              (f) => !processedFileIds.has(f._id)
            );
          }

          if (existingFile) {
            processedFileIds.add(existingFile._id);

            // Check if file was MOVED or RENAMED
            const oldPath = buildFilePath(existingFile);
            const wasMoved = oldPath !== normalizedPath;

            if (wasMoved) {
              // Update file name if changed
              if (existingFile.name !== fileName) {
                await apiService.updateFile(existingFile._id, {
                  name: fileName,
                });
                existingFile.name = fileName; // Update local copy
              }

              // Find or create the new parent folder
              let newParentId = null;
              if (folderPath) {
                const folderParts = folderPath.split("/");
                let currentParentId = null;

                for (const folderName of folderParts) {
                  let folder = projectFiles.find(
                    (f) =>
                      f.type === "folder" &&
                      f.name === folderName &&
                      f.parentId === currentParentId
                  );

                  if (!folder) {
                    folder = await createFileOrFolder({
                      projectId: currentProject._id,
                      name: folderName,
                      type: "folder",
                      parentId: currentParentId,
                    });
                    projectFiles.push(folder);
                  }

                  currentParentId = folder._id;
                }

                newParentId = currentParentId;
              }

              // Update parentId if it changed
              if (existingFile.parentId !== newParentId) {
                await moveFileOrFolder(existingFile._id, newParentId);
              }
            }

            // Safety check: Don't overwrite existing file with empty content
            if (
              currentCode === "" &&
              existingFile.content &&
              existingFile.content.length > 0
            ) {
              continue;
            }

            // Update file content
            await updateFileContent(existingFile._id, { content: currentCode });
          } else {
            // Create new file with proper folder structure

            // Find or create parent folder if needed
            let parentId = null;
            if (folderPath) {
              const folderParts = folderPath.split("/");
              let currentParentId = null;

              for (const folderName of folderParts) {
                let folder = projectFiles.find(
                  (f) =>
                    f.type === "folder" &&
                    f.name === folderName &&
                    f.parentId === currentParentId
                );

                if (!folder) {
                  // Create folder
                  folder = await createFileOrFolder({
                    projectId: currentProject._id,
                    name: folderName,
                    type: "folder",
                    parentId: currentParentId,
                  });
                  projectFiles.push(folder); // Add to local array
                }

                currentParentId = folder._id;
              }

              parentId = currentParentId;
            }

            const newFile = await createFileOrFolder({
              projectId: currentProject._id,
              name: fileName,
              type: "file",
              content: currentCode,
              parentId: parentId,
            });
            processedFileIds.add(newFile._id);
          }
        }

        setLastSaved(new Date());

        // Only show success message for manual saves
        if (!isAutoSave) {
          setShowSaveSuccess(true);

          // Auto-hide success message after 3 seconds
          setTimeout(() => {
            setShowSaveSuccess(false);
          }, 3000);
        }

        lastSaveTimeRef.current = Date.now(); // Track save time to prevent immediate reloads
      } catch (error) {
        console.error("❌ Error saving files:", error);
        throw error; // Re-throw so the caller knows it failed
      } finally {
        // Only hide UI indicators for manual saves
        if (!isAutoSave) {
          setIsSaving(false);
        }
        isSaveOperationRef.current = false;
      }
    },
    [
      currentProject,
      projectFiles,
      updateFileContent,
      createFileOrFolder,
      deleteFileOrFolder,
      moveFileOrFolder,
    ]
  );

  // Handle file changes from Sandpack (trigger auto-save if enabled)
  const handleFilesChange = useCallback(() => {
    // Don't trigger auto-save during initial load
    if (isInitialLoadRef.current) {
      return;
    }

    // Only auto-save if enabled
    if (!autoSaveEnabled) {
      return;
    }

    // Mark that files have changed
    filesChangedRef.current = true;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for auto-save (3 seconds after last change)
    autoSaveTimerRef.current = setTimeout(async () => {
      if (
        filesChangedRef.current &&
        !isSaveOperationRef.current &&
        autoSaveEnabled
      ) {
        const currentFiles = sandpackContentRef.current?.getCurrentFiles();

        if (currentFiles && Object.keys(currentFiles).length > 0) {
          try {
            // Show auto-saving indicator
            if (onAutoSavingChange) {
              onAutoSavingChange(true);
            }

            await saveFilesToBackend(currentFiles, true); // Pass true to indicate auto-save
            filesChangedRef.current = false;

            // Hide auto-saving indicator after 2 seconds
            setTimeout(() => {
              if (onAutoSavingChange) {
                onAutoSavingChange(false);
              }
            }, 2000);
          } catch (error) {
            console.error("Auto-save failed:", error);
            // Hide indicator on error too
            if (onAutoSavingChange) {
              onAutoSavingChange(false);
            }
          }
        }
      }
    }, 3000); // Auto-save 3 seconds after last change
  }, [autoSaveEnabled, onAutoSavingChange, saveFilesToBackend]);

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Handle initial sync of template files to MongoDB (for new projects)
  const handleInitialSync = useCallback(
    async (sandpackFiles) => {
      if (!currentProject) return;

      // CRITICAL: Prevent duplicate sync - check parent ref that persists across remounts
      if (hasInitialSyncedRef.current) {
        return;
      }

      hasInitialSyncedRef.current = true; // Mark as synced immediately to prevent race conditions

      // Set loading state
      setIsGeneratingFiles(true);

      try {
        // Use the same saveFilesToBackend function that the Save button uses
        // This ensures files are properly uploaded to S3 with content
        await saveFilesToBackend(sandpackFiles);

        // Update last saved time
        setLastSaved(new Date());

        // Hide loading after a short delay to show success
        setTimeout(() => {
          setIsGeneratingFiles(false);
        }, 500);
      } catch (error) {
        console.error("❌ Error syncing template files:", error);
        setIsGeneratingFiles(false);
        // Reset flag on error so user can retry
        hasInitialSyncedRef.current = false;
      }
    },
    [currentProject, saveFilesToBackend]
  );

  // Memoize getFilePath to avoid dependency warnings
  const getFilePath = useCallback(
    (file) => {
      // Build file path based on parent hierarchy
      const buildPath = (f) => {
        if (!f.parentId) return `/${f.name}`;
        const parent = projectFiles.find((pf) => pf._id === f.parentId);
        if (!parent) return `/${f.name}`;
        return `${buildPath(parent)}/${f.name}`;
      };
      return buildPath(file);
    },
    [projectFiles]
  );

  useEffect(() => {
    // Skip resetting files during save operations to prevent losing unsaved changes
    if (isSaveOperationRef.current) {
      return;
    }

    // Skip if this update is happening right after a save (within 2 seconds)
    // This prevents the backend refetch from resetting Sandpack
    if (
      lastSaveTimeRef.current &&
      Date.now() - lastSaveTimeRef.current < 2000
    ) {
      return;
    }

    // CRITICAL FIX: Only run on initial load to prevent duplicates and content loss
    // After initial load, new files are added via handleFileSelect when user clicks them
    if (!isInitialLoadRef.current) {
      return;
    }

    // Convert project files to Sandpack format
    const sandpackFiles = {};

    projectFiles.forEach((file) => {
      if (file.type === "file") {
        const path = getFilePath(file);

        // Special handling for package.json - validate JSON
        if (file.name === "package.json") {
          try {
            // Try to parse to ensure it's valid JSON
            JSON.parse(file.content || "{}");
            sandpackFiles[path] = {
              code: file.content || "{}",
            };
          } catch {
            // Use default valid package.json
            sandpackFiles["/package.json"] = {
              code: JSON.stringify(
                {
                  name:
                    currentProject?.name?.toLowerCase().replace(/\s+/g, "-") ||
                    "project",
                  version: "1.0.0",
                  dependencies: {
                    react: "^18.2.0",
                    "react-dom": "^18.2.0",
                  },
                },
                null,
                2
              ),
            };
          }
        } else {
          sandpackFiles[path] = {
            code: file.content || "",
          };
        }
      } else if (file.type === "folder") {
        // Check if folder is empty (has no children)
        const hasChildren = projectFiles.some((f) => f.parentId === file._id);

        if (!hasChildren) {
          // Create a .tempdata placeholder for empty folders
          const folderPath = getFilePath(file);
          const tempdataPath = `${folderPath}/.tempdata`;
          sandpackFiles[tempdataPath] = {
            code: "# This is a temporary placeholder file\n# It exists only to make empty folders visible in the editor\n# This file will NOT be saved to your project\n# You can safely ignore or delete this file after adding content to the folder\n",
            hidden: true, // Mark as hidden
          };
        }
      }
    });

    // If no files from database, leave sandpackFiles empty
    // Sandpack will use its template defaults automatically

    setFiles(sandpackFiles);

    // Only increment sandpack key if we're loading files from backend (not empty template)
    // This prevents remounting during initial template sync which would trigger duplicate saves
    if (projectFiles.length > 0) {
      setSandpackKey((prev) => prev + 1);
    }

    // Mark initial load as complete after a delay to prevent auto-save on initial mount
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 1000); // Wait 1 second after files are loaded before enabling auto-save
  }, [projectFiles, currentProject, getFilePath]);

  return (
    <div className="h-full w-full flex flex-col relative">
      {/* Save status indicator - only show when actively saving or just saved */}
      {isSaving && (
        <div className="bg-blue-600 text-white text-xs px-4 py-1 flex items-center gap-2">
          <svg
            className="animate-spin h-3 w-3"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Your changes are being saved...
        </div>
      )}
      {!isSaving && showSaveSuccess && lastSaved && (
        <div className="bg-green-600 text-white text-xs px-4 py-1 flex items-center gap-2 animate-fade-in">
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.5 4L6 11.5L2.5 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Saved successfully at {lastSaved.toLocaleTimeString()}
        </div>
      )}

      <div className="flex-1">
        {/* Always render SandpackProvider - if no files, Sandpack uses template defaults */}
        {/* Key prop forces remount when files change from backend to ensure preview updates */}
        <SandpackProvider
          key={sandpackKey}
          template={currentProject?.settings?.template || "react"}
          {...(Object.keys(files).length > 0 ? { files } : {})}
          theme="dark"
          options={{
            autorun: true,
            autoReload: true,
            recompileMode: "immediate",
            recompileDelay: 0,
            ...(Object.keys(files).length > 0
              ? { activeFile: Object.keys(files)[0] }
              : {}),
          }}
          style={{ height: "100%", width: "100%" }}
        >
          <SandpackContent
            onFilesChange={handleFilesChange}
            onSaveRequest={sandpackContentRef}
            onInitialSync={handleInitialSync}
          />
        </SandpackProvider>
      </div>

      {/* Loading overlay for generating files */}
      {isGeneratingFiles && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1e1e1e] border border-gray-700 rounded-lg p-8 shadow-2xl max-w-md">
            <div className="flex flex-col items-center gap-6">
              {/* Animated spinner */}
              <div className="relative">
                <svg
                  className="animate-spin h-16 w-16 text-indigo-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="h-8 w-8 text-indigo-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>

              {/* Loading text */}
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Generating Project Files
                </h3>
                <p className="text-gray-400 text-sm">
                  Setting up your{" "}
                  {currentProject?.settings?.template || "React"} template...
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

CodeEditorPanel.displayName = "CodeEditorPanel";

export default CodeEditorPanel;
