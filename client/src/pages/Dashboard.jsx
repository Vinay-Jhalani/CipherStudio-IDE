import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProject } from "../context/ProjectContext";
import LoadingAnimation from "../components/LoadingAnimation";
import { FiPlus, FiFolder, FiTrash2, FiLogOut } from "react-icons/fi";
import {
  SiReact,
  SiTypescript,
  SiJavascript,
  SiAngular,
  SiVuedotjs,
  SiSvelte,
  SiHtml5,
} from "react-icons/si";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const {
    projects,
    fetchUserProjects,
    createNewProject,
    deleteProjectById,
    loading,
  } = useProject();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("react");

  const templates = [
    {
      id: "react",
      name: "React",
      description: "React with JavaScript",
    },
    {
      id: "react-ts",
      name: "React + TypeScript",
      description: "React with TypeScript",
    },
    {
      id: "vanilla",
      name: "Vanilla",
      description: "HTML, CSS, JavaScript",
    },
    {
      id: "angular",
      name: "Angular",
      description: "Angular framework",
    },
    { id: "vue", name: "Vue", description: "Vue.js framework" },
    {
      id: "svelte",
      name: "Svelte",
      description: "Svelte framework",
    },
  ];

  useEffect(() => {
    if (user) {
      fetchUserProjects(user._id);
    }
  }, [user, fetchUserProjects]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const projectSlug =
        projectName.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
      const projectData = {
        name: projectName,
        description: projectDescription,
        projectSlug,
        template: selectedTemplate,
      };
      await createNewProject(projectData);
      setProjectName("");
      setProjectDescription("");
      setSelectedTemplate("react");
      setShowCreateModal(false);
    } catch (error) {
      alert("Failed to create project");
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (window.confirm(`Are you sure you want to delete "${projectName}"?`)) {
      try {
        await deleteProjectById(projectId);
      } catch (error) {
        alert("Failed to delete project");
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Get icon component based on project template
  const getProjectIcon = (template) => {
    switch (template) {
      case "react":
        return (
          <div className="relative inline-block">
            <SiReact className="text-5xl text-[#61DAFB]" />
            <div className="absolute -bottom-1 -right-1 bg-[#1e1e1e] rounded-full p-1">
              <SiJavascript className="text-[#F7DF1E] text-s" />
            </div>
          </div>
        );
      case "react-ts":
        return (
          <div className="relative inline-block">
            <SiReact className="text-5xl text-[#61DAFB]" />
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
              <SiTypescript className="text-[#3178C6] text-s" />
            </div>
          </div>
        );
      case "vanilla":
        return (
          <div className="relative inline-block">
            <SiHtml5 className="text-5xl text-[#E34F26]" />
            <div className="absolute -bottom-1 -right-1 bg-[#1e1e1e] rounded-full p-1">
              <SiJavascript className="text-[#F7DF1E] text-s" />
            </div>
          </div>
        );
      case "angular":
        return <SiAngular className="text-5xl text-[#DD0031]" />;
      case "vue":
        return <SiVuedotjs className="text-5xl text-[#42B883]" />;
      case "svelte":
        return <SiSvelte className="text-5xl text-[#FF3E00]" />;
      default:
        return <FiFolder className="text-5xl text-indigo-500" />;
    }
  };

  // Get template icon for selection
  const getTemplateIcon = (templateId) => {
    switch (templateId) {
      case "react":
        return <SiReact className="text-2xl text-[#61DAFB]" />;
      case "react-ts":
        return <SiReact className="text-2xl text-[#61DAFB]" />;
      case "vanilla":
        return <SiJavascript className="text-2xl text-[#F7DF1E]" />;
      case "angular":
        return <SiAngular className="text-2xl text-[#DD0031]" />;
      case "vue":
        return <SiVuedotjs className="text-2xl text-[#42B883]" />;
      case "svelte":
        return <SiSvelte className="text-2xl text-[#FF3E00]" />;
      default:
        return <FiFolder className="text-2xl text-indigo-500" />;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#151515" }}>
      {/* Header */}
      <header className="bg-[#1e1e1e] shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/Logo.png" alt="CipherStudio Logo" className="h-8" />
            <h1 className="text-2xl font-bold text-white">CipherStudio</h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-400">
              Welcome, {user?.firstName} {user?.lastName}
            </p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition"
            >
              <FiLogOut />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">My Projects</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            <FiPlus />
            New Project
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <LoadingAnimation message="Loading projects..." size={150} />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-[#1e1e1e] rounded-lg shadow-lg border border-gray-700">
            <FiFolder className="mx-auto text-gray-500 text-5xl mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No projects yet
            </h3>
            <p className="text-gray-400 mb-4">
              Get started by creating your first project
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              <FiPlus />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              return (
                <div
                  key={project._id}
                  className="bg-[#1e1e1e] rounded-lg shadow-lg hover:shadow-xl transition p-6 cursor-pointer border border-gray-700 hover:border-gray-600"
                >
                  <div onClick={() => navigate(`/editor/${project._id}`)}>
                    <div className="flex items-start justify-between mb-4">
                      {getProjectIcon(
                        project.settings?.template ||
                          project.template ||
                          "react"
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project._id, project.name);
                        }}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      {project.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Updated:{" "}
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-indigo-400 font-medium">
                        {(() => {
                          const template =
                            project.settings?.template ||
                            project.template ||
                            "react";
                          return template === "react-ts"
                            ? "React + TS"
                            : template === "react"
                            ? "React"
                            : template === "vanilla"
                            ? "Vanilla"
                            : template === "angular"
                            ? "Angular"
                            : template === "vue"
                            ? "Vue"
                            : template === "svelte"
                            ? "Svelte"
                            : template;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.93)] flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">
              Create New Project
            </h2>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="My Awesome Project"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="3"
                  placeholder="What's this project about?"
                />
              </div>

              {/* Template Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Select Template
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() =>
                        !template.disabled && setSelectedTemplate(template.id)
                      }
                      disabled={template.disabled}
                      className={`p-4 border-2 rounded-lg text-left transition ${
                        template.disabled
                          ? "border-gray-700 bg-[#2a2a2a] opacity-50 cursor-not-allowed"
                          : selectedTemplate === template.id
                          ? "border-indigo-500 bg-indigo-900/30"
                          : "border-gray-600 hover:border-gray-500 bg-[#2a2a2a]"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getTemplateIcon(template.id)}
                        <span className="font-semibold text-white">
                          {template.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {template.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setProjectName("");
                    setProjectDescription("");
                    setSelectedTemplate("react");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
