/**
 * Test YBS Item Code Discrepancy Detection
 * Tests for discrepancies between static configuration and backend mapping
 */

console.log('🔍 Testing YBS Item Code Discrepancies\n');

// Static configuration from ybs.js (simplified)
const staticConfig = {
    '5YB011057': {
        components: {
            'left_pcb': { itemCode: '4YB013250' },
            'master_pcb': { itemCode: '4YB013248' },
            'right_pcb': { itemCode: '4YB013251' },
            'b2b_left_master': { itemCode: '4YB013258' },
            'b2b_master_right': { itemCode: '4YB013258' },
            'pc_cable': { itemCode: '4YB013254' } // <-- This is what's in ybs.js
        }
    }
};

// Backend mapping from ybs_backend.js
const backendMapping = {
    '5YB011057': {
        components: ['4YB013250', '4YB013248', '4YB013251', '4YB013258', '4YB013258', '4YB013255'] // <-- 6th component is 4YB013255, not 4YB013254
    }
};

// Component order (matches the array indices)
const componentOrder = ['left_pcb', 'master_pcb', 'right_pcb', 'b2b_left_master', 'b2b_master_right', 'pc_cable'];

console.log('📋 Checking YBS 5YB011057 Item Code Consistency:\n');

console.log('Static Configuration (ybs.js):');
Object.entries(staticConfig['5YB011057'].components).forEach(([key, component], index) => {
    console.log(`  ${index + 1}. ${key}: ${component.itemCode}`);
});

console.log('\nBackend Mapping (ybs_backend.js):');
backendMapping['5YB011057'].components.forEach((itemCode, index) => {
    const componentKey = componentOrder[index];
    console.log(`  ${index + 1}. ${componentKey}: ${itemCode}`);
});

console.log('\n🔍 Discrepancy Analysis:');
let discrepancies = 0;

componentOrder.forEach((componentKey, index) => {
    const staticItemCode = staticConfig['5YB011057'].components[componentKey].itemCode;
    const backendItemCode = backendMapping['5YB011057'].components[index];
    
    if (staticItemCode !== backendItemCode) {
        console.log(`❌ DISCREPANCY FOUND:`);
        console.log(`   Component: ${componentKey} (position ${index + 1})`);
        console.log(`   Static Config: ${staticItemCode}`);
        console.log(`   Backend Mapping: ${backendItemCode}`);
        console.log(`   Impact: Barcode validation will fail when API data is used`);
        console.log('');
        discrepancies++;
    } else {
        console.log(`✅ ${componentKey}: ${staticItemCode} (consistent)`);
    }
});

console.log('\n' + '='.repeat(80));

if (discrepancies > 0) {
    console.log(`⚠️  CRITICAL ISSUE: ${discrepancies} discrepancy(ies) found!`);
    console.log('\n🔧 SOLUTION NEEDED:');
    console.log('1. The static configuration in ybs.js should match the backend mapping');
    console.log('2. OR the backend mapping should match the static configuration');
    console.log('3. Verify with the user which item codes are correct for YBS 5YB011057');
    console.log('\n💡 IMMEDIATE FIX:');
    console.log('Update the static configuration in ybs.js to match the backend mapping,');
    console.log('OR update the backend mapping to match the static configuration.');
} else {
    console.log('✅ No discrepancies found - all item codes are consistent');
}

// Test other YBS types for completeness
console.log('\n📊 Quick check of other YBS types...');

const otherBackendMappings = {
    '5YB011056': {
        components: ['4YB013250', '4YB013248', '4YB013251', '4YB013258', '4YB013258', '4YB013254']
    },
    '5YB011059': {
        components: ['4YB013250', '4YB013249', '4YB013251', '4YB013258', '4YB013258', '4YB013256']
    }
};

// Static config would be the same for components with same names, except master_pcb and pc_cable vary
const variantExpectedItems = {
    '5YB011056': { master_pcb: '4YB013248', pc_cable: '4YB013254' },
    '5YB011057': { master_pcb: '4YB013248', pc_cable: '4YB013255' }, // This is the corrected expectation
    '5YB011059': { master_pcb: '4YB013249', pc_cable: '4YB013256' }
};

Object.entries(otherBackendMappings).forEach(([ybsType, mapping]) => {
    const expectedMaster = variantExpectedItems[ybsType].master_pcb;
    const expectedCable = variantExpectedItems[ybsType].pc_cable;
    const actualMaster = mapping.components[1]; // master_pcb position
    const actualCable = mapping.components[5]; // pc_cable position
    
    console.log(`${ybsType}:`);
    console.log(`  Master PCB: Expected ${expectedMaster}, Got ${actualMaster} ${expectedMaster === actualMaster ? '✅' : '❌'}`);
    console.log(`  PC Cable: Expected ${expectedCable}, Got ${actualCable} ${expectedCable === actualCable ? '✅' : '❌'}`);
});
