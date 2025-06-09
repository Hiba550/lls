const fs = require('fs');
const path = require('path');

// Helper function to process RSM HTML files
function processRSMDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    console.log(`Found ${htmlFiles.length} RSM HTML files`);
    
    htmlFiles.forEach(file => {
        const filePath = path.join(dirPath, file);
        console.log(`\nProcessing: ${file}`);
        
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;
            
            // Fix duplicate assemblyId declarations
            if (content.includes('let assemblyId') && content.includes('const assemblyId')) {
                // Remove the duplicate const declaration that's added by our script
                content = content.replace(/\s*const assemblyId = getUrlParameter\("assemblyId"\) \|\| window\.assemblyId;/g, '');
                modified = true;
                console.log('  ✓ Removed duplicate assemblyId declaration');
            }
            
            // Fix missing getUrlParameter function definition
            if (!content.includes('function getUrlParameter(name)') && content.includes('getUrlParameter(')) {
                // Add the getUrlParameter function at the beginning of script section
                const scriptStartPattern = /<script[^>]*>/;
                const scriptStartMatch = content.match(scriptStartPattern);
                
                if (scriptStartMatch) {
                    const getUrlParamFunction = `
        // Helper function to get URL parameters
        function getUrlParameter(name) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name);
        }`;
                    
                    content = content.replace(scriptStartPattern, `${scriptStartMatch[0]}${getUrlParamFunction}`);
                    modified = true;
                    console.log('  ✓ Added getUrlParameter function');
                }
            }
            
            // Fix assemblyId initialization to use URL parameter properly
            const assemblyIdInitPattern = /let assemblyId = null;/;
            if (assemblyIdInitPattern.test(content)) {
                content = content.replace(assemblyIdInitPattern, 'let assemblyId = getUrlParameter("id") || getUrlParameter("assemblyId") || window.assemblyId;');
                modified = true;
                console.log('  ✓ Fixed assemblyId initialization');
            }
            
            // Fix API endpoint for completed assemblies (403 error)
            const badApiPattern = /POST.*\/api\/completed-assemblies\//g;
            if (content.includes('/api/completed-assemblies/')) {
                content = content.replace(/\/api\/completed-assemblies\//g, '/api/assembly-process/');
                modified = true;
                console.log('  ✓ Fixed completed assemblies API endpoint');
            }
            
            // Fix getUrlParameter calls that might be undefined
            const getUrlParamCalls = content.match(/getUrlParameter\([^)]+\)/g);
            if (getUrlParamCalls && !content.includes('function getUrlParameter')) {
                // This means we found calls but no function definition - already handled above
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

// Process RSM files
const rsmPath = path.join(__dirname, 'frontend', 'src', 'pages', 'RSM');
if (fs.existsSync(rsmPath)) {
    console.log('=== Processing RSM HTML files ===');
    processRSMDirectory(rsmPath);
} else {
    console.log('RSM directory not found');
}

console.log('\n=== RSM JavaScript fixes complete ===');
