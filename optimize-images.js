const fs = require('fs');
const path = require('path');

// Copy original images back from public to src
const sourceDir = path.join(__dirname, 'public', 'assets', 'slugs');
const targetDir = path.join(__dirname, 'src', 'core', 'assets', 'slugs');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Get all PNG files in the source directory
const pngFiles = fs.readdirSync(sourceDir).filter(file => file.endsWith('.png'));

// Copy each PNG file
pngFiles.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);
  
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Restored ${file} to original size`);
});
