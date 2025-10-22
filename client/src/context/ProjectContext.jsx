import React, { createContext, useState, useContext, useCallback } from "react";
import * as apiService from "../services/apiService";

const ProjectContext = createContext();

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within ProjectProvider");
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [projectFiles, setProjectFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch all user projects
  const fetchUserProjects = useCallback(async (userId) => {
    try {
      setLoading(true);
      const data = await apiService.getUserProjects(userId);
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new project
  const createNewProject = useCallback(async (projectData) => {
    try {
      setLoading(true);
      const data = await apiService.createProject(projectData);
      setProjects((prev) => [data, ...prev]);
      return data;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load project
  const loadProject = useCallback(async (projectId) => {
    try {
      setLoading(true);
      const projectData = await apiService.getProjectById(projectId);
      const filesData = await apiService.getProjectFiles(projectId);

      setCurrentProject(projectData);
      setProjectFiles(filesData);

      return { project: projectData, files: filesData };
    } catch (error) {
      console.error("Error loading project:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create file or folder
  const createFileOrFolder = useCallback(async (fileData) => {
    try {
      const data = await apiService.createFile(fileData);
      setProjectFiles((prev) => [...prev, data]);
      return data;
    } catch (error) {
      console.error("Error creating file/folder:", error);
      throw error;
    }
  }, []);

  // Load file content
  const loadFile = useCallback(async (fileId) => {
    try {
      const data = await apiService.getFileById(fileId);
      setCurrentFile(data);
      return data;
    } catch (error) {
      console.error("Error loading file:", error);
      throw error;
    }
  }, []);

  // Update file
  const updateFileContent = useCallback(
    async (fileId, fileData) => {
      try {
        const data = await apiService.updateFile(fileId, fileData);

        // Update local state immediately for instant UI updates
        // This is especially important for rename operations
        setProjectFiles((prev) =>
          prev.map((file) =>
            file._id === fileId
              ? {
                  ...file,
                  ...data,
                  // Preserve content if it wasn't updated (for rename-only operations)
                  content:
                    fileData.content !== undefined
                      ? data.content
                      : file.content,
                }
              : file
          )
        );

        // Update the current project's updatedAt timestamp in projects list
        if (currentProject) {
          setProjects((prev) =>
            prev
              .map((project) =>
                project._id === currentProject._id
                  ? { ...project, updatedAt: new Date().toISOString() }
                  : project
              )
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          );

          // Also update currentProject's updatedAt
          setCurrentProject((prev) => ({
            ...prev,
            updatedAt: new Date().toISOString(),
          }));
        }

        return data;
      } catch (error) {
        console.error("Error updating file:", error);
        throw error;
      }
    },
    [currentProject]
  );

  // Move file or folder to a new parent
  const moveFileOrFolder = useCallback(async (fileId, newParentId) => {
    try {
      // Update the file's parentId on the backend
      const data = await apiService.updateFile(fileId, {
        parentId: newParentId,
      });

      // Update local state to reflect the move
      setProjectFiles((prev) =>
        prev.map((file) =>
          file._id === fileId ? { ...file, parentId: newParentId } : file
        )
      );

      return data;
    } catch (error) {
      console.error("Error moving file/folder:", error);
      throw error;
    }
  }, []);

  // Delete file or folder
  const deleteFileOrFolder = useCallback(
    async (fileId) => {
      try {
        await apiService.deleteFile(fileId);
        setProjectFiles((prev) => prev.filter((file) => file._id !== fileId));

        if (currentFile && currentFile._id === fileId) {
          setCurrentFile(null);
        }
      } catch (error) {
        console.error("Error deleting file/folder:", error);
        throw error;
      }
    },
    [currentFile]
  );

  // Delete project
  const deleteProjectById = useCallback(
    async (projectId) => {
      try {
        await apiService.deleteProject(projectId);
        setProjects((prev) =>
          prev.filter((project) => project._id !== projectId)
        );

        if (currentProject && currentProject._id === projectId) {
          setCurrentProject(null);
          setProjectFiles([]);
          setCurrentFile(null);
        }
      } catch (error) {
        console.error("Error deleting project:", error);
        throw error;
      }
    },
    [currentProject]
  );

  const value = {
    projects,
    currentProject,
    projectFiles,
    currentFile,
    loading,
    fetchUserProjects,
    createNewProject,
    loadProject,
    createFileOrFolder,
    loadFile,
    updateFileContent,
    moveFileOrFolder,
    deleteFileOrFolder,
    deleteProjectById,
    setCurrentFile,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};
