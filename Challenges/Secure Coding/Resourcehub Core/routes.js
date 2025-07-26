// patched routes/routes.js

const express = require('express');
const router = express.Router();
const { formidable } = require('formidable');
const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');

const resourcesDir = path.join(__dirname, '../resources');
const uploadsDir   = path.join(__dirname, '../uploads');

// Serve everything under /static
router.use(express.static('static'));

// ---- PATCHED UPLOAD HANDLER ----
router.post('/api/upload-resource', (req, res) => {
  const form = formidable({
    uploadDir: uploadsDir,
    keepExtensions: true
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Upload failed',
        details: err.message
      });
    }

    // Support both single-file and array
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    try {
      // 1. Determine extension (or default to .txt)
      const ext = path.extname(file.originalFilename) || '.txt';

      // 2. Generate a cryptographically‑random filename
      const safeName = randomBytes(8).toString('hex') + ext;

      // 3. Build the absolute target path
      const targetPath = path.join(resourcesDir, safeName);

      // 4. Canonicalize & verify it stays within resourcesDir
      const normalized = path.normalize(targetPath);
      if (!normalized.startsWith(resourcesDir + path.sep)) {
        throw new Error('Path traversal attempt detected');
      }

      // 5. Move the temp file into place
      fs.renameSync(file.filepath, normalized);

      // 6. Respond with the safe filename & metadata
      res.json({
        success:  true,
        message:  'Resource uploaded successfully',
        category: fields.category,
        priority: fields.priority,
        filename: safeName,
        path:     normalized
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Resource upload failed',
        details: error.message
      });
    }
  });
});

// ---- EXISTING LIST & INDEX ROUTES ----
router.get('/api/resources', (req, res) => {
  try {
    const files = fs.readdirSync(resourcesDir);
    const resources = files.map(filename => ({
      name:         filename,
      path:         `/resources/${filename}`,
      size:         fs.statSync(path.join(resourcesDir, filename)).size,
      lastModified: fs.statSync(path.join(resourcesDir, filename)).mtime
    }));

    res.json({
      success:   true,
      resources: resources
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to list resources',
      details: error.message
    });
  }
});

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});

module.exports = router;
