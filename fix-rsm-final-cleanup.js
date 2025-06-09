const fs = require('fs');
const path = require('path');

// Files that need to be fixed
const filesToFix = [
    'frontend/src/pages/RSM/5RS011028.html',
    'frontend/src/pages/RSM/5RS011076.html',
    'frontend/src/pages/RSM/5RS011112.html'
];

function fixDuplicateVariables(content) {
    // Fix multiple declarations of allScanned
    const lines = content.split('\n');
    const fixedLines = [];
    const seenVariables = new Set();
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Check for duplicate variable declarations
        if (line.includes('const allScanned =') || line.includes('let allScanned =')) {
            if (seenVariables.has('allScanned')) {
                // Replace with assignment instead of declaration
                line = line.replace('const allScanned =', 'allScanned =').replace('let allScanned =', 'allScanned =');
            } else {
                seenVariables.add('allScanned');
            }
        }
        
        if (line.includes('const assemblyEntry =') || line.includes('let assemblyEntry =')) {
            if (seenVariables.has('assemblyEntry')) {
                // Replace with assignment instead of declaration
                line = line.replace('const assemblyEntry =', 'assemblyEntry =').replace('let assemblyEntry =', 'assemblyEntry =');
            } else {
                seenVariables.add('assemblyEntry');
            }
        }
        
        fixedLines.push(line);
    }
    
    return fixedLines.join('\n');
}

function fixMalformedCode(content) {
    // Remove malformed lines that start with }: 
    content = content.replace(/^\s*\}: \$\{.*?\}\$\{.*?\} units completed.*$/gm, '');
    
    // Fix duplicate code blocks
    content = content.replace(/(\s*} else \{\s*\n\s*\/\/ Fully completed[\s\S]*?localStorage\.setItem.*?\n\s*}\s*\n\s*} else \{\s*\n\s*\/\/ Single unit order[\s\S]*?localStorage\.setItem.*?\n\s*}\s*\n\s*} else \{\s*\n\s*console\.warn[\s\S]*?\n\s*}\s*\n\s*} catch \(error\) \{[\s\S]*?\n\s*}\s*\n\s*} else \{)/g, '$1');
    
    // Fix broken function structures
    content = content.replace(/(\s*} catch \(error\) \{[^}]*}\s*\n\s*} else \{)/g, '$1');
    
    return content;
}

function fixAssemblyIdLogic(content) {
    // Ensure assemblyId retrieval logic is correct
    const assemblyIdFunction = `
    // Helper function to get assembly ID with debug logging
    function getAssemblyId() {
        // First try from URL parameters (id or assemblyId)
        const urlId = getUrlParameter("id") || getUrlParameter("assemblyId");
        if (urlId) {
            console.log(\`[DEBUG] Assembly ID retrieved from URL: \${urlId}\`);
            localStorage.setItem('currentRSMAssemblyId', urlId);
            window.assemblyId = urlId;
            return urlId;
        }
        
        // Fallback to window object or localStorage
        const fallbackId = window.assemblyId || localStorage.getItem('currentRSMAssemblyId');
        console.log(\`[DEBUG] Assembly ID retrieved from fallback: \${fallbackId}\`);
        return fallbackId;
    }`;
    
    // Replace old assemblyId function
    content = content.replace(
        /\/\/ Helper function to get assembly ID[\s\S]*?function getAssemblyId\(\) \{[\s\S]*?\n\s*\}/g,
        assemblyIdFunction
    );
    
    return content;
}

function fixHelperFunctions(content) {
    // Ensure helper functions are present
    const helperFunctions = `
    // Helper function to get cookie value
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Helper function to show messages
    function showMessage(message, type = 'info') {
        console.log(\`[\${type.toUpperCase()}] \${message}\`);
        addLogEntry(message, type);
        showNotification(message, type);
    }`;
    
    // Add helper functions if not present
    if (!content.includes('function getCookie(name)')) {
        content = content.replace(
            /(\/\/ Helper function to get work order ID[\s\S]*?\n\s*)/, 
            '$1' + helperFunctions + '\n\n'
        );
    }
    
    return content;
}

function processFile(filePath) {
    try {
        console.log(`Processing ${filePath}...`);
        
        if (!fs.existsSync(filePath)) {
            console.log(`File not found: ${filePath}`);
            return;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Apply fixes
        content = fixDuplicateVariables(content);
        content = fixMalformedCode(content);
        content = fixAssemblyIdLogic(content);
        content = fixHelperFunctions(content);
        
        // Write back to file
        fs.writeFileSync(filePath, content);
        console.log(`✓ Fixed ${filePath}`);
        
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
    }
}

// Process all files
console.log('=== RSM Files Final Cleanup ===');
filesToFix.forEach(processFile);
console.log('=== Cleanup Complete ===');
