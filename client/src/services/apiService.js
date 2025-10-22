import api from "../utils/api";

// User APIs
export const registerUser = async (userData) => {
  const response = await api.post("/users", userData);
  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data));
  }
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post("/users/login", credentials);
  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data));
  }
  return response.data;
};

export const getUserProfile = async () => {
  const response = await api.get("/users/profile");
  return response.data;
};

export const updateUserProfile = async (userData) => {
  const response = await api.put("/users/profile", userData);
  return response.data;
};

// Project APIs
export const createProject = async (projectData) => {
  const response = await api.post("/projects", projectData);
  return response.data;
};

export const getUserProjects = async (userId) => {
  const response = await api.get(`/projects/user/${userId}`);
  return response.data;
};

export const getProjectById = async (projectId) => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
};

export const updateProject = async (projectId, projectData) => {
  const response = await api.put(`/projects/${projectId}`, projectData);
  return response.data;
};

export const deleteProject = async (projectId) => {
  const response = await api.delete(`/projects/${projectId}`);
  return response.data;
};

// File APIs
export const createFile = async (fileData) => {
  const response = await api.post("/files", fileData);
  return response.data;
};

export const getFileById = async (fileId) => {
  const response = await api.get(`/files/${fileId}`);
  return response.data;
};

export const getProjectFiles = async (projectId) => {
  const response = await api.get(`/files/project/${projectId}`);
  return response.data;
};

export const getFolderChildren = async (folderId) => {
  const response = await api.get(`/files/folder/${folderId}`);
  return response.data;
};

export const updateFile = async (fileId, fileData) => {
  const response = await api.put(`/files/${fileId}`, fileData);
  return response.data;
};

export const deleteFile = async (fileId) => {
  const response = await api.delete(`/files/${fileId}`);
  return response.data;
};

// Template APIs
export const initializeProjectTemplate = async (projectId) => {
  const response = await api.post(`/templates/initialize/${projectId}`);
  return response.data;
};
