const fs = require('fs');
const path = require('path');

// Function to fix legacy completed-assemblies API calls
function fixLegacyEndpoints(filePath) {
    console.log(`\n🔧 Processing ${path.basename(filePath)}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changes = 0;
    
    // Fix POST calls to completed-assemblies (create endpoint)
    const postPattern = /await fetch\(`\$\{API_URL\}\/completed-assemblies\/`[,\s]*\{[^}]*method:\s*['"]POST['"][^}]*\}/g;
    content = content.replace(postPattern, (match) => {
        changes++;
        console.log(`  ✅ Fixed POST to completed-assemblies`);
        // Replace with PATCH to assembly-process
        return match
            .replace(/\/completed-assemblies\//, '/assembly-process/${assemblyId}/')
            .replace(/method:\s*['"]POST['"]/, "method: 'PATCH'");
    });
    
    // Fix PUT/PATCH calls to completed-assemblies/{id}/ 
    const putPatchPattern = /await fetch\(`\$\{API_URL\}\/completed-assemblies\/\$\{[^}]+\}\/`[,\s]*\{[^}]*method:\s*['"](?:PUT|PATCH)['"][^}]*\}/g;
    content = content.replace(putPatchPattern, (match) => {
        changes++;
        console.log(`  ✅ Fixed PUT/PATCH to completed-assemblies/{id}/`);
        // Replace with PATCH to assembly-process
        return match.replace(/\/completed-assemblies\//, '/assembly-process/');
    });
    
    // Also check for any hardcoded completed-assemblies URLs
    const hardcodedPattern = /['"]\/api\/completed-assemblies\/['"]/g;
    content = content.replace(hardcodedPattern, (match) => {
        changes++;
        console.log(`  ✅ Fixed hardcoded completed-assemblies URL`);
        return match.replace(/completed-assemblies/, 'assembly-process');
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
const files = fs.readdirSync(rsmDir).filter(file => file.endsWith('.html'));

console.log('🚀 Starting fix for legacy completed-assemblies endpoints...');
console.log(`📁 Processing ${files.length} RSM HTML files...`);

let totalChanges = 0;
files.forEach(file => {
    const filePath = path.join(rsmDir, file);
    totalChanges += fixLegacyEndpoints(filePath);
});

console.log(`\n✨ Complete! Made ${totalChanges} total changes across ${files.length} files.`);
