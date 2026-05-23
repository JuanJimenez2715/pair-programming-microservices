const fs = require('fs');
const path = require('path');

const dirs = [
  'api-gateway',
  'ms-auth/src',
  'ms-pairing/src',
  'ms-editor/src',
  'ms-ai/app',
  'ms-evaluation',
  'ms-exercises',
  'ms-metrics',
  'ms-notifications',
  'ms-reports',
  'docs',
  'frontend'
];

dirs.forEach(d => fs.mkdirSync(path.join(__dirname, d), { recursive: true }));

const files = {
  '.env.example': '# Global Environment Variables\n',
  '.editorconfig': 'root = true\n\n[*]\nindent_style = space\nindent_size = 2\nend_of_line = lf\ncharset = utf-8\ntrim_trailing_whitespace = true\ninsert_final_newline = true\n',
  'docs/architecture.md': '# Architecture Document\n',
  'api-gateway/kong.yml': '_format_version: "3.0"\nservices:\n',
  'api-gateway/Dockerfile': 'FROM kong:latest\n',
  'ms-ai/requirements.txt': 'fastapi\nuvicorn\n',
  'ms-ai/Dockerfile': 'FROM python:3.11-slim\n',
  'ms-ai/app/main.py': 'from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/health")\ndef health():\n    return {"status": "ok"}\n'
};

const nodeServices = [
  'ms-auth', 'ms-pairing', 'ms-editor', 'ms-evaluation', 
  'ms-exercises', 'ms-metrics', 'ms-notifications', 'ms-reports'
];

nodeServices.forEach(svc => {
  files[`${svc}/package.json`] = JSON.stringify({
    name: svc,
    version: "1.0.0",
    description: `Microservice for ${svc}`,
    main: "src/app.js",
    scripts: {
      "start": "node src/app.js"
    },
    dependencies: {
      "express": "^4.18.2"
    }
  }, null, 2);
  files[`${svc}/Dockerfile`] = 'FROM node:20-alpine\nWORKDIR /usr/src/app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nCMD ["npm", "start"]\n';
  
  // Basic app.js for some services to start with
  if (!fs.existsSync(path.join(__dirname, svc, 'src'))) {
    fs.mkdirSync(path.join(__dirname, svc, 'src'), { recursive: true });
  }
  files[`${svc}/src/app.js`] = `const express = require('express');\nconst app = express();\n\napp.get('/health', (req, res) => res.json({ status: 'ok', service: '${svc}' }));\n\nconst PORT = process.env.PORT || 3000;\napp.listen(PORT, () => console.log(\`${svc} running on port \${PORT}\`));\n`;
});

files['ms-auth/.env.example'] = 'PORT=3001\nDB_URL=\nJWT_SECRET=\n';

Object.entries(files).forEach(([f, content]) => {
  fs.writeFileSync(path.join(__dirname, f), content);
});

// Update gitignore
const gitignorePath = path.join(__dirname, '.gitignore');
let gitignoreContent = '';
if (fs.existsSync(gitignorePath)) {
  gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
}
if (!gitignoreContent.includes('node_modules')) {
  gitignoreContent += '\n# Dependencies\nnode_modules/\n';
}
if (!gitignoreContent.includes('__pycache__')) {
  gitignoreContent += '\n# Python\n__pycache__/\n*.pyc\n.venv/\n';
}
fs.writeFileSync(gitignorePath, gitignoreContent);

console.log("Scaffolding complete");
