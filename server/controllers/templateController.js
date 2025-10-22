import File from "../models/File.js";
import Project from "../models/Project.js";
import { uploadToS3, getFromS3 } from "../utils/s3Operations.js";

// @desc    Initialize or fix project template files
// @route   POST /api/templates/initialize/:projectId
// @access  Private
export const initializeProjectTemplate = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify project exists and user owns it
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      throw new Error("Project not found");
    }

    if (project.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized");
    }

    // Get existing files
    const existingFiles = await File.find({ projectId, type: "file" });

    // Define the correct template structure
    const templates = {
      "index.html": {
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${project.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.js"></script>
  </body>
</html>`,
        language: "html",
      },
      "index.js": {
        content: `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)`,
        language: "javascript",
      },
      "App.js": {
        content: `export default function App() {
  return (
    <div className="App">
      <h1>Welcome to ${project.name}!</h1>
      <p>Start editing to see changes!</p>
    </div>
  );
}`,
        language: "javascript",
      },
      "styles.css": {
        content: `.App {
  font-family: sans-serif;
  text-align: center;
  padding: 20px;
}

h1 {
  color: #333;
}

p {
  color: #666;
}`,
        language: "css",
      },
      "package.json": {
        content: JSON.stringify(
          {
            name: project.name.toLowerCase().replace(/\s+/g, "-"),
            version: "1.0.0",
            type: "module",
            dependencies: {
              react: "^18.2.0",
              "react-dom": "^18.2.0",
            },
          },
          null,
          2
        ),
        language: "json",
      },
    };

    const createdFiles = [];
    const updatedFiles = [];

    // Create or update each template file
    for (const [fileName, fileData] of Object.entries(templates)) {
      const existingFile = existingFiles.find((f) => f.name === fileName);

      if (existingFile) {
        // Update existing file
        const s3Key =
          existingFile.s3Key ||
          `projects/${projectId}/files/${Date.now()}-${fileName}`;
        await uploadToS3(fileData.content, s3Key, "text/plain");

        existingFile.s3Key = s3Key;
        existingFile.language = fileData.language;
        existingFile.sizeInBytes = Buffer.byteLength(fileData.content, "utf8");
        await existingFile.save();

        updatedFiles.push(fileName);
      } else {
        // Create new file
        const s3Key = `projects/${projectId}/files/${Date.now()}-${fileName}`;
        await uploadToS3(fileData.content, s3Key, "text/plain");

        await File.create({
          projectId,
          parentId: null, // Root level
          name: fileName,
          type: "file",
          s3Key,
          language: fileData.language,
          sizeInBytes: Buffer.byteLength(fileData.content, "utf8"),
        });

        createdFiles.push(fileName);
      }
    }

    res.json({
      message: "Template initialized successfully",
      created: createdFiles,
      updated: updatedFiles,
    });
  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};
