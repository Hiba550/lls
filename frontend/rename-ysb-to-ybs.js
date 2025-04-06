const fs = require('fs');
const path = require('path');

function renameInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Original content for comparison
    const originalContent = content;
    
    // Replace YSB with YBS, careful with different contexts
    content = content.replace(/\bYSB\b/g, 'YBS');
    content = content.replace(/\/ysb\//g, '/ybs/');
    content = content.replace(/\bysb\b/g, 'ybs');
    content = content.replace(/5YB/g, '5YB'); // Keep 5YB as is, don't change to 5YS
    
    // Write back only if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);
  }
}

function walkDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
      walkDirectory(filePath);
    } else if (stats.isFile() && 
              (filePath.endsWith('.js') || 
               filePath.endsWith('.jsx') || 
               filePath.endsWith('.html') || 
               filePath.endsWith('.css'))) {
      renameInFile(filePath);
    }
  });
}

walkDirectory('src');
console.log('Frontend renaming completed.');