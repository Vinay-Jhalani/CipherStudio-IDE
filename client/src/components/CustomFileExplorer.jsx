import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useProject } from "../context/ProjectContext";
import {
  FiFolder,
  FiFolderPlus,
  FiFile,
  FiFilePlus,
  FiChevronRight,
  FiChevronDown,
  FiEdit2,
  FiTrash2,
  FiMinimize2,
  FiX,
  FiCheck,
} from "react-icons/fi";
import { VscFolderOpened } from "react-icons/vsc";
import {
  SiJavascript,
  SiTypescript,
  SiReact,
  SiHtml5,
  SiCss3,
  SiJson,
  SiMarkdown,
  SiPython,
  SiPhp,
  SiRuby,
  SiGo,
  SiRust,
  SiSwift,
  SiKotlin,
  SiCplusplus,
  SiVuedotjs,
  SiSvelte,
  SiAngular,
  SiSass,
  SiGraphql,
  SiDocker,
  SiGit,
  SiYarn,
  SiNodedotjs,
} from "react-icons/si";
import {
  AiOutlineFileImage,
  AiOutlineFilePdf,
  AiOutlineFileZip,
} from "react-icons/ai";

/**
 * Get appropriate icon for file based on extension
 */
const getFileIcon = (fileName) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const name = fileName.toLowerCase();

  // Special files by name
  if (name === "package.json") return { icon: SiNodedotjs, color: "#68A063" };
  if (name === "package-lock.json")
    return { icon: SiNodedotjs, color: "#68A063" };
  if (name === "yarn.lock") return { icon: SiYarn, color: "#2C8EBB" };
  if (name === "dockerfile") return { icon: SiDocker, color: "#2496ED" };
  if (name === ".gitignore") return { icon: SiGit, color: "#F05032" };
  if (name === "tsconfig.json") return { icon: SiTypescript, color: "#3178C6" };

  // By extension
  switch (ext) {
    // JavaScript/TypeScript
    case "js":
    case "mjs":
    case "cjs":
      return { icon: SiJavascript, color: "#F7DF1E" };
    case "jsx":
      return { icon: SiReact, color: "#61DAFB" };
    case "ts":
      return { icon: SiTypescript, color: "#3178C6" };
    case "tsx":
      return { icon: SiReact, color: "#61DAFB" };

    // Markup/Styling
    case "html":
    case "htm":
      return { icon: SiHtml5, color: "#E34F26" };
    case "css":
      return { icon: SiCss3, color: "#1572B6" };
    case "scss":
    case "sass":
      return { icon: SiSass, color: "#CC6699" };

    // Data
    case "json":
    case "jsonc":
      return { icon: SiJson, color: "#5A5A5A" };
    case "md":
    case "markdown":
      return { icon: SiMarkdown, color: "#FFFFFF" };
    case "xml":
    case "svg":
      return { icon: AiOutlineFileImage, color: "#FFB13B" };

    // Frameworks
    case "vue":
      return { icon: SiVuedotjs, color: "#4FC08D" };
    case "svelte":
      return { icon: SiSvelte, color: "#FF3E00" };
    case "graphql":
    case "gql":
      return { icon: SiGraphql, color: "#E10098" };

    // Backend Languages
    case "py":
      return { icon: SiPython, color: "#3776AB" };
    case "php":
      return { icon: SiPhp, color: "#777BB4" };
    case "rb":
      return { icon: SiRuby, color: "#CC342D" };
    case "go":
      return { icon: SiGo, color: "#00ADD8" };
    case "rs":
      return { icon: SiRust, color: "#CE422B" };
    case "java":
      return { icon: FiFile, color: "#007396" };
    case "kt":
    case "kts":
      return { icon: SiKotlin, color: "#7F52FF" };
    case "swift":
      return { icon: SiSwift, color: "#FA7343" };
    case "cpp":
    case "cc":
    case "cxx":
      return { icon: SiCplusplus, color: "#00599C" };
    case "cs":
      return { icon: FiFile, color: "#239120" }; // C# - using generic icon with C# green color

    // Images
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
    case "ico":
    case "bmp":
      return { icon: AiOutlineFileImage, color: "#FFB13B" };

    // Documents
    case "pdf":
      return { icon: AiOutlineFilePdf, color: "#FF0000" };

    // Archives
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return { icon: AiOutlineFileZip, color: "#FFA500" };

    // Default
    default:
      return { icon: FiFile, color: "#9CA3AF" };
  }
};

/**
 * CustomFileExplorer - A fully custom file explorer that tracks both files and folders
 * This gives us complete control over the file system structure for MongoDB persistence
 */
const CustomFileExplorer = ({ onFileSelect, selectedFilePath }) => {
  const {
    currentProject,
    projectFiles,
    createFileOrFolder,
    deleteFileOrFolder,
    updateFileContent,
  } = useProject();

  // UI State
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [contextMenu, setContextMenu] = useState(null);
  const [creatingItem, setCreatingItem] = useState(null); // { parentId, type: 'file' | 'folder' }
  const [renamingItem, setRenamingItem] = useState(null); // { id, currentName }
  const [inputValue, setInputValue] = useState("");
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  // Build tree structure from flat projectFiles array
  const fileTree = useMemo(() => {
    if (!projectFiles || projectFiles.length === 0) return [];

    // DEDUPLICATION: Remove duplicate entries (same _id)
    const uniqueFiles = Array.from(
      new Map(projectFiles.map((file) => [file._id, file])).values()
    );

    // Create a map of all items by ID
    const itemMap = new Map();
    uniqueFiles.forEach((item) => {
      itemMap.set(item._id, { ...item, children: [] });
    });

    // Build the tree structure
    const tree = [];
    uniqueFiles.forEach((item) => {
      const node = itemMap.get(item._id);
      if (item.parentId && itemMap.has(item.parentId)) {
        // Add to parent's children
        itemMap.get(item.parentId).children.push(node);
      } else {
        // Root level item
        tree.push(node);
      }
    });

    // Sort: folders first, then alphabetically
    const sortItems = (items) => {
      return items.sort((a, b) => {
        if (a.type === "folder" && b.type === "file") return -1;
        if (a.type === "file" && b.type === "folder") return 1;
        return a.name.localeCompare(b.name);
      });
    };

    // Recursively sort all levels
    const sortTree = (items) => {
      sortItems(items);
      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          sortTree(item.children);
        }
      });
      return items;
    };

    return sortTree(tree);
  }, [projectFiles]);

  // Auto-expand folders when files are added
  useEffect(() => {
    if (projectFiles && projectFiles.length > 0) {
      const folderIds = projectFiles
        .filter((f) => f.type === "folder")
        .map((f) => f._id);
      setExpandedFolders(new Set(folderIds));
    }
  }, [projectFiles]);

  // Toggle folder expansion
  const toggleFolder = useCallback((folderId) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  // Collapse all folders
  const collapseAll = useCallback(() => {
    setExpandedFolders(new Set());
  }, []);

  // Handle file/folder creation
  const handleCreate = useCallback(async (parentId, type) => {
    setCreatingItem({ parentId, type });
    setInputValue(type === "folder" ? "New Folder" : "newfile.js");
    setContextMenu(null);
  }, []);

  const confirmCreate = useCallback(
    async (e) => {
      e?.preventDefault();

      // If input is empty or not changed from default, treat as cancel
      if (!inputValue.trim()) {
        setCreatingItem(null);
        setInputValue("");
        return;
      }

      try {
        const newItem = await createFileOrFolder({
          projectId: currentProject._id,
          parentId: creatingItem.parentId,
          name: inputValue.trim(),
          type: creatingItem.type,
          content: creatingItem.type === "file" ? "" : undefined,
        });

        // If it's a folder, auto-expand it
        if (newItem.type === "folder") {
          setExpandedFolders((prev) => new Set([...prev, newItem._id]));
        }

        // If it's a file, select it
        if (newItem.type === "file" && onFileSelect) {
          onFileSelect(newItem);
        }

        setCreatingItem(null);
        setInputValue("");
      } catch (error) {
        console.error("❌ Error creating item:", error);
        alert("Failed to create: " + error.message);
      }
    },
    [inputValue, creatingItem, createFileOrFolder, currentProject, onFileSelect]
  );

  const cancelCreate = useCallback(() => {
    setCreatingItem(null);
    setInputValue("");
  }, []);

  // Handle rename
  const handleRename = useCallback((item) => {
    setRenamingItem({ id: item._id, currentName: item.name });
    setInputValue(item.name);
    setContextMenu(null);
  }, []);

  const confirmRename = useCallback(
    async (e) => {
      e?.preventDefault();
      if (!inputValue.trim() || inputValue === renamingItem.currentName) {
        setRenamingItem(null);
        return;
      }

      try {
        await updateFileContent(renamingItem.id, { name: inputValue.trim() });
        setRenamingItem(null);
        setInputValue("");
      } catch (error) {
        console.error("❌ Error renaming:", error);
        alert("Failed to rename: " + error.message);
      }
    },
    [inputValue, renamingItem, updateFileContent]
  );

  const cancelRename = useCallback(() => {
    setRenamingItem(null);
    setInputValue("");
  }, []);

  // Handle delete
  const handleDelete = useCallback(
    async (item) => {
      const confirmMsg =
        item.type === "folder"
          ? `Delete folder "${item.name}" and all its contents?`
          : `Delete file "${item.name}"?`;

      if (!window.confirm(confirmMsg)) return;

      try {
        // If it's a folder, delete all children recursively
        const deleteRecursive = async (folderId) => {
          const children = projectFiles.filter((f) => f.parentId === folderId);
          for (const child of children) {
            if (child.type === "folder") {
              await deleteRecursive(child._id);
            }
            await deleteFileOrFolder(child._id);
          }
        };

        if (item.type === "folder") {
          await deleteRecursive(item._id);
        }

        await deleteFileOrFolder(item._id);
        setContextMenu(null);
      } catch (error) {
        console.error("❌ Error deleting:", error);
        alert("Failed to delete: " + error.message);
      }
    },
    [projectFiles, deleteFileOrFolder]
  );

  // Drag and Drop handlers
  const handleDragStart = useCallback((e, item) => {
    e.stopPropagation();
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item._id);
  }, []);

  const handleDragOver = useCallback((e, item) => {
    e.preventDefault();
    e.stopPropagation();

    // Allow dropping into folders
    if (!item || item.type === "folder") {
      e.dataTransfer.dropEffect = "move";
      setDropTarget(item?._id ?? null); // Use null for root level
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  }, []);

  const handleDragEnter = useCallback((e, item) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item || item.type === "folder") {
      setDropTarget(item?._id || null);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Clear drop target when leaving
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    // Only clear if mouse is actually outside the element
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDropTarget(null);
    }
  }, []);

  const handleDrop = useCallback(
    async (e, targetItem) => {
      e.preventDefault();
      e.stopPropagation();

      // Always clear drop target immediately
      setDropTarget(null);

      if (!draggedItem) return;

      const newParentId = targetItem?.type === "folder" ? targetItem._id : null;

      // Don't drop if it's the same location
      if (draggedItem.parentId === newParentId) {
        setDraggedItem(null);
        return;
      }

      // Don't drop a folder into itself or its children
      if (draggedItem.type === "folder" && targetItem) {
        let current = targetItem;
        while (current) {
          if (current._id === draggedItem._id) {
            alert("Cannot move a folder into itself");
            setDraggedItem(null);
            return;
          }
          current = projectFiles.find((f) => f._id === current.parentId);
        }
      }

      try {
        await updateFileContent(draggedItem._id, { parentId: newParentId });

        // Auto-expand target folder
        if (newParentId) {
          setExpandedFolders((prev) => new Set([...prev, newParentId]));
        }
      } catch (error) {
        console.error("❌ Error moving item:", error);
        alert("Failed to move: " + error.message);
      } finally {
        setDraggedItem(null);
      }
    },
    [draggedItem, projectFiles, updateFileContent]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDropTarget(null);
  }, []);

  // Context menu
  const showContextMenu = useCallback((e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
    });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Click outside to close context menu
  useEffect(() => {
    const handleClick = () => hideContextMenu();
    if (contextMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu, hideContextMenu]);

  // Get file path for display and selection
  const getFilePath = useCallback(
    (fileId) => {
      const buildPath = (id, parts = []) => {
        const item = projectFiles.find((f) => f._id === id);
        if (!item) return parts;
        parts.unshift(item.name);
        if (item.parentId) {
          return buildPath(item.parentId, parts);
        }
        return parts;
      };
      return "/" + buildPath(fileId).join("/");
    },
    [projectFiles]
  );

  // Render a single tree item (file or folder)
  const renderTreeItem = useCallback(
    (item, depth = 0) => {
      const isExpanded = expandedFolders.has(item._id);
      const isFolder = item.type === "folder";
      const isRenaming = renamingItem?.id === item._id;
      const filePath = getFilePath(item._id);
      const isSelected = selectedFilePath === filePath;
      const isDraggedOver = dropTarget === item._id;
      const isBeingDragged = draggedItem?._id === item._id;

      // Get file icon and color based on extension
      const fileIconData = !isFolder ? getFileIcon(item.name) : null;
      const FileIconComponent = fileIconData?.icon;
      const fileIconColor = fileIconData?.color;

      return (
        <div key={item._id}>
          {/* Item Row */}
          <div
            className={`flex items-center gap-2 px-2 py-1.5 hover:bg-[#2a2a2a] cursor-pointer group ${
              isSelected ? "bg-[#37373d]" : ""
            } ${isBeingDragged ? "opacity-50" : ""} ${
              isDraggedOver && isFolder
                ? "bg-indigo-900/30 border-l-2 border-indigo-500"
                : ""
            }`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            draggable={!isRenaming}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragOver={(e) =>
              isFolder ? handleDragOver(e, item) : e.preventDefault()
            }
            onDragEnter={(e) => (isFolder ? handleDragEnter(e, item) : null)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => {
              if (isFolder) {
                handleDrop(e, item);
              } else {
                e.preventDefault();
              }
            }}
            onDragEnd={handleDragEnd}
            onClick={() => {
              if (isFolder) {
                toggleFolder(item._id);
              } else {
                onFileSelect && onFileSelect(item);
              }
            }}
            onContextMenu={(e) => showContextMenu(e, item)}
          >
            {/* Folder chevron */}
            {isFolder && (
              <span className="text-gray-400 flex-shrink-0">
                {isExpanded ? (
                  <FiChevronDown size={14} />
                ) : (
                  <FiChevronRight size={14} />
                )}
              </span>
            )}

            {/* Icon */}
            <span
              className="flex-shrink-0"
              style={{ color: isFolder ? "#9CA3AF" : fileIconColor }}
            >
              {isFolder ? (
                isExpanded ? (
                  <VscFolderOpened size={16} />
                ) : (
                  <FiFolder size={16} />
                )
              ) : (
                <FileIconComponent size={16} />
              )}
            </span>

            {/* Name or Input */}
            {isRenaming ? (
              <form onSubmit={confirmRename} className="flex-1 flex gap-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={confirmRename}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      cancelRename();
                    }
                  }}
                  autoFocus
                  className="flex-1 bg-[#3c3c3c] text-white px-2 py-0.5 text-sm rounded border border-indigo-500 focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="submit"
                  className="text-green-500 hover:text-green-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmRename(e);
                  }}
                >
                  <FiCheck size={14} />
                </button>
                <button
                  type="button"
                  className="text-red-500 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelRename();
                  }}
                >
                  <FiX size={14} />
                </button>
              </form>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-300 truncate">
                  {item.name}
                </span>
                {/* Actions - Show directly on hover */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                  {isFolder && (
                    <>
                      <button
                        className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#3c3c3c]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreate(item._id, "file");
                        }}
                        title="New File"
                      >
                        <FiFilePlus size={14} />
                      </button>
                      <button
                        className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#3c3c3c]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreate(item._id, "folder");
                        }}
                        title="New Folder"
                      >
                        <FiFolderPlus size={14} />
                      </button>
                    </>
                  )}
                  <button
                    className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#3c3c3c]"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRename(item);
                    }}
                    title="Rename"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    className="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-[#3c3c3c]"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                    title="Delete"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Children (if folder and expanded) */}
          {isFolder && isExpanded && item.children && (
            <div>
              {item.children.map((child) => renderTreeItem(child, depth + 1))}
            </div>
          )}

          {/* Creating new item under this folder */}
          {creatingItem?.parentId === item._id && isExpanded && (
            <div
              className="flex items-center gap-2 px-2 py-1.5 bg-[#2a2a2a]"
              style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
            >
              <span className="flex-shrink-0 text-gray-400">
                {creatingItem.type === "folder" ? (
                  <FiFolder size={16} />
                ) : (
                  <FiFile size={16} />
                )}
              </span>
              <form onSubmit={confirmCreate} className="flex-1 flex gap-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      cancelCreate();
                    }
                  }}
                  autoFocus
                  className="flex-1 bg-[#3c3c3c] text-white px-2 py-0.5 text-sm rounded border border-indigo-500 focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="submit"
                  className="text-green-500 hover:text-green-400"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <FiCheck size={14} />
                </button>
                <button
                  type="button"
                  className="text-red-500 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelCreate();
                  }}
                >
                  <FiX size={14} />
                </button>
              </form>
            </div>
          )}
        </div>
      );
    },
    [
      expandedFolders,
      renamingItem,
      creatingItem,
      inputValue,
      selectedFilePath,
      getFilePath,
      toggleFolder,
      onFileSelect,
      showContextMenu,
      confirmRename,
      cancelRename,
      confirmCreate,
      cancelCreate,
      handleCreate,
      handleRename,
      handleDelete,
      draggedItem,
      dropTarget,
      handleDragStart,
      handleDragOver,
      handleDragEnter,
      handleDragLeave,
      handleDrop,
      handleDragEnd,
    ]
  );

  return (
    <div className="h-full flex flex-col bg-[#151515] text-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <span className="text-sm font-semibold text-gray-400 uppercase">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleCreate(null, "file")}
            className="p-1.5 hover:bg-[#2a2a2a] rounded text-gray-400 hover:text-white"
            title="New File"
          >
            <FiFilePlus size={16} />
          </button>
          <button
            onClick={() => handleCreate(null, "folder")}
            className="p-1.5 hover:bg-[#2a2a2a] rounded text-gray-400 hover:text-white"
            title="New Folder"
          >
            <FiFolderPlus size={16} />
          </button>
          <button
            onClick={collapseAll}
            className="p-1.5 hover:bg-[#2a2a2a] rounded text-gray-400 hover:text-white"
            title="Collapse All"
          >
            <FiMinimize2 size={16} />
          </button>
        </div>
      </div>

      {/* Creating item at root level */}
      {creatingItem?.parentId === null && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-[#2a2a2a]">
          <span className="flex-shrink-0 text-gray-400">
            {creatingItem.type === "folder" ? (
              <FiFolder size={16} />
            ) : (
              <FiFile size={16} />
            )}
          </span>
          <form onSubmit={confirmCreate} className="flex-1 flex gap-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancelCreate();
                }
              }}
              autoFocus
              className="flex-1 bg-[#3c3c3c] text-white px-2 py-0.5 text-sm rounded border border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              className="text-green-500 hover:text-green-400"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <FiCheck size={14} />
            </button>
            <button
              type="button"
              className="text-red-500 hover:text-red-400"
              onClick={(e) => {
                e.stopPropagation();
                cancelCreate();
              }}
            >
              <FiX size={14} />
            </button>
          </form>
        </div>
      )}

      {/* File Tree */}
      <div
        className={`flex-1 overflow-y-auto overflow-x-hidden relative ${
          dropTarget === null && draggedItem ? "bg-indigo-900/10" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Allow dropping at root level
          if (draggedItem) {
            e.dataTransfer.dropEffect = "move";
            setDropTarget(null); // null means root level
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Set root as drop target when entering the container
          if (draggedItem && !e.target.closest('[draggable="true"]')) {
            setDropTarget(null);
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Only clear if leaving the entire container
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX;
          const y = e.clientY;

          if (
            x < rect.left ||
            x >= rect.right ||
            y < rect.top ||
            y >= rect.bottom
          ) {
            setDropTarget(undefined); // undefined means no target
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Internal drag, drop at root level
          handleDrop(e, null);
        }}
      >
        {fileTree.length === 0 ? (
          <div
            className="px-4 py-8 text-center text-gray-500 text-sm"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDropTarget(null);
            }}
          >
            <p>No files yet</p>
            <p className="mt-2">Click + to create files or folders</p>
          </div>
        ) : (
          <>
            <div className="py-1">
              {fileTree.map((item) => renderTreeItem(item))}
            </div>
            {/* Drop zone for root level when tree has items */}
            {draggedItem && (
              <div
                className={`px-4 py-4 text-center text-sm transition-colors ${
                  dropTarget === null
                    ? "bg-indigo-900/30 text-indigo-300"
                    : "text-gray-600"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = "move";
                  setDropTarget(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDrop(e, null);
                }}
              >
                Drop here to move to root directory
              </div>
            )}
          </>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-[#2a2a2a] border border-gray-600 rounded shadow-lg py-1 z-50"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            minWidth: "180px",
          }}
        >
          {contextMenu.item.type === "folder" && (
            <>
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-[#3c3c3c] flex items-center gap-2"
                onClick={() => handleCreate(contextMenu.item._id, "file")}
              >
                <FiFilePlus size={14} />
                New File
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-[#3c3c3c] flex items-center gap-2"
                onClick={() => handleCreate(contextMenu.item._id, "folder")}
              >
                <FiFolderPlus size={14} />
                New Folder
              </button>
              <div className="border-t border-gray-600 my-1"></div>
            </>
          )}
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-[#3c3c3c] flex items-center gap-2"
            onClick={() => handleRename(contextMenu.item)}
          >
            <FiEdit2 size={14} />
            Rename
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-[#3c3c3c] flex items-center gap-2 text-red-400"
            onClick={() => handleDelete(contextMenu.item)}
          >
            <FiTrash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomFileExplorer;
