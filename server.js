const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 10000;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// Serve main HTML page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// List files in directory endpoint
app.get('/api/files/*', (req, res) => {
  try {
    let dirPath = req.params[0];
    
    // Add leading slash if not present (since the route strips it)
    if (!dirPath.startsWith('/')) {
      dirPath = '/' + dirPath;
    }
    
    if (!dirPath) {
      return res.status(400).json({ error: 'Directory path is required' });
    }
    
    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      return res.status(404).json({ error: 'Directory not found' });
    }
    
    // Check if it's actually a directory
    if (!fs.statSync(dirPath).isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }
    
    // Read directory contents
    const files = fs.readdirSync(dirPath).map(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        isDirectory: stats.isDirectory(),
        size: stats.size,
        modified: stats.mtime
      };
    });
    
    res.json({
      directory: dirPath,
      files: files
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to read directory',
      message: error.message 
    });
  }
});

// Recursive search endpoint
app.get('/api/search/*', (req, res) => {
  try {
    let searchDir = req.params[0];
    const query = req.query.q;
    const isRegexMode = req.query.regex === 'true';
    const maxDepth = parseInt(req.query.maxDepth) || 5;
    
    if (!searchDir.startsWith('/')) {
      searchDir = '/' + searchDir;
    }
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    if (!fs.existsSync(searchDir)) {
      return res.status(404).json({ error: 'Search directory not found' });
    }
    
    if (!fs.statSync(searchDir).isDirectory()) {
      return res.status(400).json({ error: 'Search path is not a directory' });
    }
    
    const results = [];
    const searchTerm = query.toLowerCase();
    
    // Set up regex matcher if in regex mode
    let regexMatcher = null;
    if (isRegexMode) {
      try {
        // Auto-detect /pattern/ format and extract pattern
        const isSlashFormat = query.startsWith('/') && query.endsWith('/');
        const pattern = isSlashFormat ? query.slice(1, -1) : query;
        regexMatcher = new RegExp(pattern, 'i'); // Case insensitive by default
      } catch (error) {
        return res.status(400).json({ 
          error: 'Invalid regex pattern',
          message: error.message 
        });
      }
    }
    
    function searchRecursively(dir, currentDepth = 0) {
      if (currentDepth > maxDepth || results.length >= 100) return;
      
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          if (results.length >= 100) break;
          
          const itemPath = path.join(dir, item);
          const stats = fs.statSync(itemPath);
          const relativePath = path.relative(searchDir, path.dirname(itemPath));
          
          // Use appropriate matching logic
          let isMatch = false;
          if (regexMatcher) {
            isMatch = regexMatcher.test(item);
          } else {
            isMatch = item.toLowerCase().includes(searchTerm);
          }
          
          if (isMatch) {
            results.push({
              name: item,
              path: itemPath,
              relativePath: relativePath || '.',
              isDirectory: stats.isDirectory(),
              size: stats.size,
              modified: stats.mtime
            });
          }
          
          if (stats.isDirectory() && currentDepth < maxDepth) {
            searchRecursively(itemPath, currentDepth + 1);
          }
        }
      } catch (err) {
        // Skip directories we can't read
      }
    }
    
    searchRecursively(searchDir);
    
    res.json({
      searchDirectory: searchDir,
      query: query,
      isRegex: isRegexMode,
      results: results,
      totalFound: results.length
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Search failed',
      message: error.message 
    });
  }
});

// File content endpoint
app.get('/api/file/*', (req, res) => {
  try {
    let filePath = req.params[0];
    
    if (!filePath.startsWith('/')) {
      filePath = '/' + filePath;
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is a directory, not a file' });
    }
    
    // Check file size (5MB limit for text, 10MB for images)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (stats.size > maxSize) {
      return res.json({
        type: 'binary',
        name: path.basename(filePath),
        size: stats.size,
        modified: stats.mtime,
        path: filePath,
        error: 'File too large to preview'
      });
    }
    
    const ext = path.extname(filePath).toLowerCase().substring(1);
    const fileName = path.basename(filePath);
    
    // Define file type categories
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'];
    const codeTypes = ['js', 'html', 'css', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs', 'ts', 'jsx', 'tsx'];
    const textTypes = ['txt', 'md', 'json', 'xml', 'yaml', 'yml', 'csv', 'log', 'ini', 'conf'];
    
    // Handle images - serve directly
    if (imageTypes.includes(ext)) {
      const mimeTypes = {
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
        'gif': 'image/gif', 'svg': 'image/svg+xml', 'webp': 'image/webp', 'bmp': 'image/bmp'
      };
      res.setHeader('Content-Type', mimeTypes[ext] || 'image/jpeg');
      return res.sendFile(filePath);
    }
    
    // Handle text/code files
    if (codeTypes.includes(ext) || textTypes.includes(ext)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if it's actually text (look for null bytes)
      if (content.includes('\0')) {
        return res.json({
          type: 'binary',
          name: fileName,
          size: stats.size,
          modified: stats.mtime,
          path: filePath,
          message: 'Binary file detected'
        });
      }
      
      return res.json({
        type: codeTypes.includes(ext) ? 'code' : 'text',
        name: fileName,
        content: content,
        size: stats.size,
        modified: stats.mtime,
        path: filePath,
        extension: ext
      });
    }
    
    // Default to binary
    res.json({
      type: 'binary',
      name: fileName,
      size: stats.size,
      modified: stats.mtime,
      path: filePath,
      extension: ext
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to read file',
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;