
# CipherStudio IDE

Welcome to CipherStudio IDE, a full-stack web application developed as part of the CipherSchools assignment round. This project provides an online code editor powered by Sandpack, featuring user authentication, file storage using AWS S3 or Cloudflare R2, autosave, code templates, and much more. The backend is built with Node.js and MongoDB, creating a complete development environment in the browser.

## Features

- 🧑‍💻 Code Editor: Real-time code editing with syntax highlighting.
- 🔐 Authentication: Secure login and registration system.
- ☁️ File Storage: Upload and manage files with Cloudflare R2 or AWS S3.
- 🧠 JWT Authentication: Secure token-based user authentication.
- 🧩 Modular Backend: Scalable server architecture with MongoDB integration.



## 🛠️Tech Stack

**Frontend:** React, Vite, TailwindCSS

**Backend:** Node, Express

**Database:** MongoDB

**Authentication:** JWT

**Storage:** AWS S3 / Clouflare R2




## ⚙️Environment Variables Configuration

This section describes all the environment variables required to run the CipherStudio application.

## 📁 File Locations

### Server Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/cipherstudio

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d

# Storage Configuration
STORAGE_PROVIDER=cloudflare-r2

# AWS S3 Configuration (use if STORAGE_PROVIDER=aws-s3)
# AWS_ACCESS_KEY_ID=your_aws_access_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret_key
# AWS_REGION=us-east-1
# S3_BUCKET_NAME=cipherstudio-files

# Cloudflare R2 Configuration (use if STORAGE_PROVIDER=cloudflare-r2)
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=cipherstudio-files
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com

# CORS Configuration
CLIENT_URL=http://localhost:5173
```

### Client Environment Variables

Create a `.env` file in the `client/` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
```

---

## 🔧 Server Configuration

| Variable   |   Type   |    Default    | Description                                    |
| :--------- | :------: | :-----------: | :--------------------------------------------- |
| `PORT`     | `number` |    `5000`     | Port number for the server to listen on        |
| `NODE_ENV` | `string` | `development` | Environment mode (`development`, `production`) |

**Example:**

```env
PORT=5000
NODE_ENV=development
```

---

## 🌐 Client Configuration

| Variable       |   Type   |           Default           | Description                        |
| :------------- | :------: | :-------------------------: | :--------------------------------- |
| `VITE_API_URL` | `string` | `http://localhost:5000/api` | **Required**. Backend API base URL |

**Example:**

```env
# Development
VITE_API_URL=http://localhost:5000/api

# Production
VITE_API_URL=https://your-api-domain.com/api
```

> **📝 Note:** In Vite, only variables prefixed with `VITE_` are exposed to the client-side code. This is a security feature to prevent accidentally exposing sensitive server-side variables.

---

## 🗄️ Database Configuration

| Variable      |   Type   | Default | Description                             |
| :------------ | :------: | :-----: | :-------------------------------------- |
| `MONGODB_URI` | `string` |    -    | **Required**. MongoDB connection string |

**Example:**

```env
# For MongoDB Atlas (recommended for production)
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/cipherstudio
```

---

## 🔐 JWT Configuration

| Variable     |   Type   | Default | Description                                    |
| :----------- | :------: | :-----: | :--------------------------------------------- |
| `JWT_SECRET` | `string` |    -    | **Required**. Secret key for JWT token signing |
| `JWT_EXPIRE` | `string` |  `7d`   | JWT token expiration time                      |

**Example:**

```env
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=7d
```

> **⚠️ Security Warning:** Never commit your actual JWT secret to version control. Use a strong, random string in production.

---

## 💾 Storage Configuration

### Storage Provider Selection

| Variable           |   Type   | Default  | Description                                    |
| :----------------- | :------: | :------: | :--------------------------------------------- |
| `STORAGE_PROVIDER` | `string` | `aws-s3` | Storage provider (`aws-s3` or `cloudflare-r2`) |

**Example:**

```env
STORAGE_PROVIDER=cloudflare-r2
```

### AWS S3 Configuration (if using AWS S3)

| Variable                |   Type   |   Default   | Description                         |
| :---------------------- | :------: | :---------: | :---------------------------------- |
| `AWS_ACCESS_KEY_ID`     | `string` |      -      | **Required**. AWS access key ID     |
| `AWS_SECRET_ACCESS_KEY` | `string` |      -      | **Required**. AWS secret access key |
| `AWS_REGION`            | `string` | `us-east-1` | AWS region for S3 bucket            |
| `S3_BUCKET_NAME`        | `string` |      -      | **Required**. S3 bucket name        |

**Example:**

```env
AWS_ACCESS_KEY_ID=Your_Aws_Access_Key
AWS_SECRET_ACCESS_KEY=Your_Aws_Secret_Key
AWS_REGION=us-east-1
S3_BUCKET_NAME=cipherstudio-files
```

### Cloudflare R2 Configuration (if using Cloudflare R2)

| Variable               |   Type   | Default | Description                         |
| :--------------------- | :------: | :-----: | :---------------------------------- |
| `R2_ACCOUNT_ID`        | `string` |    -    | **Required**. Cloudflare account ID |
| `R2_ACCESS_KEY_ID`     | `string` |    -    | **Required**. R2 access key ID      |
| `R2_SECRET_ACCESS_KEY` | `string` |    -    | **Required**. R2 secret access key  |
| `R2_BUCKET_NAME`       | `string` |    -    | **Required**. R2 bucket name        |
| `R2_ENDPOINT`          | `string` |    -    | **Required**. R2 endpoint URL       |

**Example:**

```env
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=cipherstudio-files
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
```

> **💡 Tip:** Get R2 credentials from Cloudflare Dashboard → R2 → Manage R2 API Tokens

---

## 🌐 CORS Configuration

| Variable     |   Type   |         Default         | Description                       |
| :----------- | :------: | :---------------------: | :-------------------------------- |
| `CLIENT_URL` | `string` | `http://localhost:5173` | Frontend application URL for CORS |

**Example:**

```env
# Development
CLIENT_URL=http://localhost:5173

# Production
CLIENT_URL=https://yourdomain.com
```

---

### Client .env Template (client/.env)

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Setup Instructions

1. **Create server .env file**: Copy the server template above to `server/.env`
2. **Create client .env file**: Copy the client template above to `client/.env`
3. **Fill in your actual values** for required variables
4. **Never commit** `.env` files to version control
5. **Use different values** for development and production environments

### Required Variables Checklist

#### Server Variables

- [ ] `MONGODB_URI` - Database connection string
- [ ] `JWT_SECRET` - Strong secret key for JWT
- [ ] Storage credentials (either AWS S3 or Cloudflare R2)
- [ ] `CLIENT_URL` - Your frontend URL

#### Client Variables

- [ ] `VITE_API_URL` - Backend API URL

### Optional Variables

- [ ] `PORT` - Defaults to 5000
- [ ] `NODE_ENV` - Defaults to development
- [ ] `JWT_EXPIRE` - Defaults to 7d
- [ ] `AWS_REGION` - Defaults to us-east-1 (for AWS S3)

---

## 🔒 Security Best Practices

### Server-Side Security

1. **Use strong secrets** - Generate random strings for JWT secrets
2. **Separate environments** - Use different `.env` files for dev/staging/production
3. **Never commit secrets** - Add `.env` to `.gitignore`
4. **Rotate credentials** regularly in production
5. **Use environment-specific values** - Don't use production credentials in development

### Client-Side Security

1. **Only expose necessary variables** - Use `VITE_` prefix for client-accessible variables
2. **Never expose sensitive data** - JWT secrets, database credentials, etc. should never be client-accessible
3. **Validate API URLs** - Ensure `VITE_API_URL` points to trusted domains only
4. **Use HTTPS in production** - Always use secure connections for API calls

## 🐛 Troubleshooting

### Common Issues:

**"MongoDB connection failed"**

- Check `MONGODB_URI` format and credentials
- Ensure MongoDB server is running (for local) or Atlas cluster is accessible

**"JWT token invalid"**

- Verify `JWT_SECRET` is set and matches between requests
- Check token expiration with `JWT_EXPIRE`

**"Storage upload failed"**

- Verify storage credentials are correct
- Check bucket permissions and region settings
- Ensure bucket exists and is accessible

**"CORS error"**

- Verify `CLIENT_URL` matches your frontend domain
- Include protocol (http/https) in the URL

### Client Issues:

**"API calls failing"**

- Check `VITE_API_URL` is correctly set to your backend URL
- Ensure backend server is running and accessible
- Verify the URL includes the `/api` path if required

**"Environment variables not working"**

- Remember: Only `VITE_` prefixed variables are available in client code
- Restart the development server after changing `.env` files
- Check browser console for any environment variable errors
## CipherStudio API Reference




### Register User

```http
POST /api/users
```

Creates a new user account.

**Request Body:**

| Parameter   | Type     | Description                |
| :---------- | :------- | :------------------------- |
| `firstName` | `string` | **Required**. User's first name |
| `lastName`  | `string` | **Required**. User's last name |
| `email`     | `string` | **Required**. User's email address |
| `password`  | `string` | **Required**. User's password |
| `mobile`    | `string` | **Optional**. User's mobile number |

**Response:** User object with JWT token

### Login User

```http
POST /api/users/login
```

Authenticates a user and returns a JWT token.

**Request Body:**

| Parameter  | Type     | Description                |
| :--------- | :------- | :------------------------- |
| `email`    | `string` | **Required**. User's email address |
| `password` | `string` | **Required**. User's password |

**Response:** User object with JWT token

### Get User Profile

```http
GET /api/users/profile
```

Retrieves the current user's profile information.

**Response:** User profile object

---

## Project Endpoints

### Create Project

```http
POST /api/projects
```

Creates a new project for the authenticated user.

**Request Body:**

| Parameter     | Type     | Description                |
| :------------ | :------- | :------------------------- |
| `name`        | `string` | **Required**. Project name |
| `description` | `string` | **Optional**. Project description |
| `projectSlug` | `string` | **Optional**. Unique project slug |
| `template`    | `string` | **Optional**. Template type (react, vue, angular, react-ts, vanilla, svelte) |
| `settings`    | `object` | **Optional**. Project settings |

**Response:** Created project objectd

### Get User Projects

```http
GET /api/projects/user/{userId}
```

Retrieves all projects for a specific user.

**Parameters:**

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `userId`  | `string` | **Required**. User ID |

**Response:** Array of project objects

### Get Project by ID

```http
GET /api/projects/{id}
```

Retrieves a specific project by its ID.

**Parameters:**

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id`      | `string` | **Required**. Project ID |

**Response:** Project object with populated user and root folder information

### Update Project

```http
PUT /api/projects/{id}
```

Updates a specific project.

**Parameters:**

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id`      | `string` | **Required**. Project ID |

**Request Body:**

| Parameter     | Type     | Description                |
| :------------ | :------- | :------------------------- |
| `name`        | `string` | **Optional**. Project name |
| `description` | `string` | **Optional**. Project description |
| `settings`    | `object` | **Optional**. Project settings |

**Response:** Updated project object

### Delete Project

```http
DELETE /api/projects/{id}
```

Deletes a specific project and all its associated files.

**Parameters:**

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id`      | `string` | **Required**. Project ID |

**Response:** Success message

---

## File Endpoints

### Create File/Folder

```http
POST /api/files
```

Creates a new file or folder in a project.

**Request Body:**

| Parameter   | Type     | Description                |
| :---------- | :------- | :------------------------- |
| `projectId` | `string` | **Required**. Project ID |
| `parentId`  | `string` | **Optional**. Parent folder ID |
| `name`      | `string` | **Required**. File/folder name |
| `type`      | `string` | **Required**. "file" or "folder" |
| `content`   | `string` | **Optional**. File content (for files only) |
| `language`  | `string` | **Optional**. Programming language |

**Response:** Created file/folder object

### Get File/Folder by ID

```http
GET /api/files/{id}
```

Retrieves a specific file or folder by its ID.

**Parameters:**

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id`      | `string` | **Required**. File/Folder ID |

**Response:** File/folder object (includes content for files)

### Get Project Files

```http
GET /api/files/project/{projectId}
```

Retrieves all files and folders for a specific project.

**Parameters:**

| Parameter   | Type     | Description                |
| :---------- | :------- | :------------------------- |
| `projectId` | `string` | **Required**. Project ID |

**Response:** Array of file/folder objects

### Get Folder Children

```http
GET /api/files/folder/{folderId}
```

Retrieves all children (files and folders) of a specific folder.

**Parameters:**

| Parameter  | Type     | Description                |
| :--------- | :------- | :------------------------- |
| `folderId` | `string` | **Required**. Folder ID |

**Response:** Array of file/folder objects

### Update File/Folder

```http
PUT /api/files/{id}
```

Updates a specific file or folder.

**Parameters:**

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id`      | `string` | **Required**. File/Folder ID |

**Request Body:**

| Parameter   | Type     | Description                |
| :---------- | :------- | :------------------------- |
| `name`      | `string` | **Optional**. New name |
| `parentId`  | `string` | **Optional**. New parent folder ID |
| `content`   | `string` | **Optional**. New content (for files only) |
| `language`  | `string` | **Optional**. Programming language |

**Response:** Updated file/folder object

### Delete File/Folder

```http
DELETE /api/files/{id}
```

Deletes a specific file or folder.

**Parameters:**

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id`      | `string` | **Required**. File/Folder ID |

**Response:** Success message

---

## Template Endpoints

### Initialize Project Template

```http
POST /api/templates/initialize/{projectId}
```

Initializes a project with template files based on the project's template setting.

**Parameters:**

| Parameter   | Type     | Description                |
| :---------- | :------- | :------------------------- |
| `projectId` | `string` | **Required**. Project ID |

**Response:** Success message

---

## Error Responses

All endpoints may return the following error responses:

- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User not authorized to access resource
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Error response format:
```json
{
  "message": "Error description"
}
```
