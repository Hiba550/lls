const fs = require('fs');
const path = require('path');

// Function to fix assembly ID retrieval in RSM HTML files
function fixAssemblyIdRetrieval(filePath) {
    console.log(`\n🔧 Processing ${path.basename(filePath)}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changes = 0;
    
    // Fix completeAssembly function to get assembly ID dynamically
    const completeAssemblyPattern = /async function completeAssembly\(\) \{[\s\S]*?if \(!(?:assemblyId|window\.assemblyId).*?\) \{[\s\S]*?return false;[\s\S]*?\}/;
    
    if (content.match(completeAssemblyPattern)) {
        // Replace the assembly ID validation logic in completeAssembly
        content = content.replace(
            /(async function completeAssembly\(\) \{[\s\S]*?)if \(!(?:assemblyId|window\.assemblyId).*?\) \{[\s\S]*?return false;[\s\S]*?\}/,
            (match, beforeValidation) => {
                changes++;
                console.log(`  ✅ Fixed completeAssembly assembly ID validation`);
                return `${beforeValidation}// Get assembly ID dynamically
        const currentAssemblyId = getUrlParameter("id") || getUrlParameter("assemblyId") || window.assemblyId;
        if (!currentAssemblyId) {
            showNotification('Error: No assembly ID found', 'error');
            if (typeof completeButton !== 'undefined') completeButton.disabled = false;
            return false;
        }
        
        // Use currentAssemblyId for all operations
        const assemblyId = currentAssemblyId;`
            }
        );
    }
    
    // Also fix any other functions that check assembly ID
    const otherFunctionPattern = /if \(!(?:assemblyId|window\.assemblyId)(?:\s*&&\s*!getUrlParameter\("assemblyId"\))?\) \{[\s\S]*?showNotification\('Error: No assembly ID found'[\s\S]*?\}/g;
    content = content.replace(otherFunctionPattern, (match) => {
        changes++;
        console.log(`  ✅ Fixed assembly ID validation in other function`);
        return `// Get assembly ID dynamically
        const currentAssemblyId = getUrlParameter("id") || getUrlParameter("assemblyId") || window.assemblyId;
        if (!currentAssemblyId) {
            showNotification('Error: No assembly ID found', 'error');
            return false;
        }`;
    });
    
    // Fix any hardcoded assemblyId references in API calls within completeAssembly
    const apiCallPattern = /(\$\{API_URL\}\/assembly-process\/)\$\{assemblyId\}/g;
    content = content.replace(apiCallPattern, (match, prefix) => {
        changes++;
        console.log(`  ✅ Fixed API call to use currentAssemblyId`);
        return `${prefix}\${currentAssemblyId}`;
    });
    
    if (changes > 0) {
        fs.writeFileSync(filePath, content);
        console.log(`  💾 Saved ${changes} changes to ${path.basename(filePath)}`);
    } else {
        console.log(`  ℹ️  No changes needed for ${path.basename(filePath)}`);
    }
    
    return changes;
}

// Get RSM HTML files
const rsmDir = path.join(__dirname, 'frontend', 'src', 'pages', 'RSM');
const files = fs.readdirSync(rsmDir).filter(file => file.endsWith('.html') && !file.includes('default'));

console.log('🚀 Starting fix for RSM assembly ID retrieval issues...');
console.log(`📁 Processing ${files.length} RSM HTML files...`);

let totalChanges = 0;
files.forEach(file => {
    const filePath = path.join(rsmDir, file);
    totalChanges += fixAssemblyIdRetrieval(filePath);
});

console.log(`\n✨ Complete! Made ${totalChanges} total changes across ${files.length} files.`);
