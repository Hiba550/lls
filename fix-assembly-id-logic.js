const fs = require('fs');
const path = require('path');

// Helper function to process files in a directory
function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    console.log(`Found ${htmlFiles.length} HTML files in ${dirPath}`);
    
    htmlFiles.forEach(file => {
        const filePath = path.join(dirPath, file);
        console.log(`\nProcessing: ${file}`);
        
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;
            
            // Fix assembly ID check logic - wrong OR should be AND
            const badPattern1 = /if\s*\(\s*!window\.assemblyId\s*\|\|\s*getUrlParameter\s*\(\s*["']assemblyId["']\s*\)\s*\)/g;
            if (badPattern1.test(content)) {
                content = content.replace(badPattern1, 'if (!window.assemblyId && !getUrlParameter("assemblyId"))');
                modified = true;
                console.log('  ✓ Fixed assembly ID check logic (OR to AND)');
            }
            
            // Fix missing assemblyId variable declarations
            const badPattern2 = /const\s+assemblyId\s*=\s*getAssemblyId\s*\(\s*\)\s*;/g;
            if (!content.includes('const assemblyId = getAssemblyId()') && content.includes('getAssemblyId()')) {
                // Add assemblyId declaration at the beginning of functions that use it
                const functionsNeedingAssemblyId = [
                    'saveCurrentScan',
                    'updateCurrentSensorIndex',
                    'moveWorkOrderToCompleted'
                ];
                
                functionsNeedingAssemblyId.forEach(funcName => {
                    const funcPattern = new RegExp(`(function\\s+${funcName}\\s*\\([^)]*\\)\\s*\\{)`, 'g');
                    if (funcPattern.test(content)) {
                        content = content.replace(funcPattern, `$1\n                const assemblyId = getUrlParameter("assemblyId") || window.assemblyId;`);
                        modified = true;
                        console.log(`  ✓ Added assemblyId declaration to ${funcName}`);
                    }
                });
            }
            
            // Fix assemblyId usage in fetch URLs
            const badPattern3 = /fetch\s*\(\s*[`'"]\$\{API_URL\}\/assembly-process\/\$\{assemblyId\}/g;
            if (badPattern3.test(content)) {
                content = content.replace(badPattern3, 'fetch(`${API_URL}/assembly-process/${assemblyId || getUrlParameter("assemblyId")}');
                modified = true;
                console.log('  ✓ Fixed assemblyId usage in fetch URLs');
            }
            
            // Add getAssemblyId helper function if missing
            if (!content.includes('function getAssemblyId()') && content.includes('assemblyId')) {
                const helperFunction = `
        // Helper function to get assembly ID
        function getAssemblyId() {
            return getUrlParameter("assemblyId") || window.assemblyId;
        }`;
                
                // Insert after other helper functions
                if (content.includes('function getUrlParameter(name)')) {
                    content = content.replace(
                        /(function getUrlParameter\(name\) \{[^}]+\})/,
                        `$1${helperFunction}`
                    );
                    modified = true;
                    console.log('  ✓ Added getAssemblyId helper function');
                }
            }
            
            if (modified) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`  ✅ Successfully updated ${file}`);
            } else {
                console.log(`  ⏭️  No changes needed for ${file}`);
            }
            
        } catch (error) {
            console.error(`  ❌ Error processing ${file}:`, error.message);
        }
    });
}

// Process YBS files
const ybsPath = path.join(__dirname, 'frontend', 'src', 'pages', 'YBS');
if (fs.existsSync(ybsPath)) {
    console.log('=== Processing YBS HTML files ===');
    processDirectory(ybsPath);
} else {
    console.log('YBS directory not found');
}

// Process RSM files
const rsmPath = path.join(__dirname, 'frontend', 'src', 'pages', 'RSM');
if (fs.existsSync(rsmPath)) {
    console.log('\n=== Processing RSM HTML files ===');
    processDirectory(rsmPath);
} else {
    console.log('RSM directory not found');
}

console.log('\n=== Assembly ID logic fix complete ===');
