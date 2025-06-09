#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Fix RSM HTML files to load rsm_backend.js before rsm.js
 * This ensures the RSMBackendManager is available when rsm.js initializes
 */

const rsmDir = './frontend/src/pages/RSM';

console.log('🔧 Fixing RSM HTML files to load rsm_backend.js...');

if (!fs.existsSync(rsmDir)) {
    console.error('❌ RSM directory not found:', rsmDir);
    process.exit(1);
}

const htmlFiles = fs.readdirSync(rsmDir).filter(file => file.endsWith('.html'));

if (htmlFiles.length === 0) {
    console.log('ℹ️ No HTML files found in RSM directory');
    process.exit(0);
}

let filesFixed = 0;
let filesSkipped = 0;

htmlFiles.forEach(filename => {
    const filePath = path.join(rsmDir, filename);
    console.log(`\n📄 Processing: ${filename}`);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if rsm_backend.js is already loaded
        if (content.includes('rsm_backend.js')) {
            console.log('  ✅ Already has rsm_backend.js - skipping');
            filesSkipped++;
            return;
        }
        
        // Find the rsm.js script tag and add rsm_backend.js before it
        const rsmScriptRegex = /(<script src="\/src\/js\/rsm\.js"><\/script>)/;
        
        if (!rsmScriptRegex.test(content)) {
            console.log('  ⚠️ No rsm.js script tag found - skipping');
            filesSkipped++;
            return;
        }
        
        // Replace the rsm.js script tag with both scripts
        const newContent = content.replace(
            rsmScriptRegex,
            '<script src="/src/js/rsm_backend.js"></script>\n$1'
        );
        
        if (newContent === content) {
            console.log('  ⚠️ No changes made - skipping');
            filesSkipped++;
            return;
        }
        
        // Write the updated content
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('  ✅ Added rsm_backend.js script tag');
        filesFixed++;
        
    } catch (error) {
        console.error(`  ❌ Error processing ${filename}:`, error.message);
    }
});

console.log('\n🎉 RSM HTML files script loading fix completed!');
console.log(`📊 Files processed: ${htmlFiles.length}`);
console.log(`✅ Files fixed: ${filesFixed}`);
console.log(`⏭️ Files skipped: ${filesSkipped}`);

if (filesFixed > 0) {
    console.log('\n📋 Summary of changes:');
    console.log('- Added <script src="/src/js/rsm_backend.js"></script> before rsm.js in all RSM HTML files');
    console.log('- This ensures RSMBackendManager is available when rsm.js initializes');
    console.log('- RSM system should now use backend manager instead of frontend-only mode');
    
    console.log('\n🧪 Next steps:');
    console.log('1. Test an RSM assembly to confirm backend manager is loaded');
    console.log('2. Check browser console for "RSMBackendManager initialized" message');
    console.log('3. Verify no "frontend-only mode" warnings appear');
    console.log('4. Test assembly completion and rework scenarios');
}
