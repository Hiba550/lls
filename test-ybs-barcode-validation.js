/**
 * Test YBS Barcode Validation
 * Tests the barcode validation logic for YBS components
 */

const fs = require('fs');
const path = require('path');

// Mock the YBS component mapping for testing
const mockComponentMapping = {
    'left_pcb': {
        name: 'Left Slave PCB',
        itemCode: '4YB013250',
        scanningCode: 'V22CL0065',
        description: 'Left Slave PCB Component'
    },
    'master_pcb': {
        name: 'Master PCB',
        itemCode: '4YB013248',
        scanningCode: 'V22C80087',
        description: 'Master PCB Component'
    },
    'right_pcb': {
        name: 'Right Slave PCB',
        itemCode: '4YB013251',
        scanningCode: 'V22CR0129',
        description: 'Right Slave PCB Component'
    },
    'b2b_left_master': {
        name: 'Board-to-Board (Left to Master)',
        itemCode: '4YB013258',
        scanningCode: 'P22BV0584',
        description: 'Board-to-Board Left to Master'
    },
    'b2b_master_right': {
        name: 'Board-to-Board (Master to Right)',
        itemCode: '4YB013258',
        scanningCode: 'P22BV0476',
        description: 'Board-to-Board Master to Right'
    },
    'pc_cable': {
        name: 'Power & Communication Cable',
        itemCode: '4YB013254',
        scanningCode: 'P22AQ0131',
        description: 'Power & Communication Cable'
    }
};

// Mock the verification function from ybs.js
function verifyComponentBarcode(barcode, component) {
    // Use dynamic scanningCode from API, not static verificationCode
    if (!component.scanningCode) {
        // Fallback: accept if barcode matches itemCode (rare, but for legacy)
        return barcode === component.itemCode;
    }
    // Accept if barcode contains or equals the scanningCode (case-insensitive)
    return barcode.toUpperCase().includes(component.scanningCode.toUpperCase());
}

// Test cases with expected scanning codes
const testCases = [
    // Test 1: Exact matches
    { component: 'left_pcb', barcode: 'V22CL0065', expected: true, description: 'Left PCB - Exact match' },
    { component: 'master_pcb', barcode: 'V22C80087', expected: true, description: 'Master PCB - Exact match' },
    { component: 'right_pcb', barcode: 'V22CR0129', expected: true, description: 'Right PCB - Exact match' },
    { component: 'b2b_left_master', barcode: 'P22BV0584', expected: true, description: 'B2B Left-Master - Exact match' },
    { component: 'b2b_master_right', barcode: 'P22BV0476', expected: true, description: 'B2B Master-Right - Exact match' },
    { component: 'pc_cable', barcode: 'P22AQ0131', expected: true, description: 'PC Cable - Exact match' },
    
    // Test 2: Partial matches (barcode contains scanning code)
    { component: 'left_pcb', barcode: 'SOMEPREFIX-V22CL0065-SUFFIX', expected: true, description: 'Left PCB - Contains scanning code' },
    { component: 'master_pcb', barcode: 'ABC123-V22C80087-XYZ', expected: true, description: 'Master PCB - Contains scanning code' },
    
    // Test 3: Case insensitive
    { component: 'left_pcb', barcode: 'v22cl0065', expected: true, description: 'Left PCB - Lowercase' },
    { component: 'master_pcb', barcode: 'V22c80087', expected: true, description: 'Master PCB - Mixed case' },
    
    // Test 4: Wrong barcodes
    { component: 'left_pcb', barcode: 'V22CR0129', expected: false, description: 'Left PCB - Wrong barcode (Right PCB code)' },
    { component: 'master_pcb', barcode: 'P22BV0584', expected: false, description: 'Master PCB - Wrong barcode (B2B code)' },
    { component: 'pc_cable', barcode: 'WRONG123', expected: false, description: 'PC Cable - Completely wrong barcode' },
    
    // Test 5: Empty or null scanning code
    { component: 'test_component', barcode: '4YB013250', expected: true, description: 'Component without scanningCode - Falls back to itemCode' }
];

// Add a test component without scanning code
mockComponentMapping['test_component'] = {
    name: 'Test Component',
    itemCode: '4YB013250',
    scanningCode: null,
    description: 'Test Component for fallback'
};

console.log('🧪 Testing YBS Barcode Validation Logic\n');
console.log('📋 Component Mapping:');
Object.entries(mockComponentMapping).forEach(([key, component]) => {
    console.log(`  ${key}: ${component.name} (${component.itemCode}) -> Scanning Code: ${component.scanningCode || 'N/A'}`);
});
console.log('\n' + '='.repeat(80) + '\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
    const component = mockComponentMapping[testCase.component];
    if (!component) {
        console.log(`❌ Test ${index + 1}: Component '${testCase.component}' not found`);
        failed++;
        return;
    }
    
    const result = verifyComponentBarcode(testCase.barcode, component);
    const status = result === testCase.expected ? '✅ PASS' : '❌ FAIL';
    
    if (result === testCase.expected) {
        passed++;
    } else {
        failed++;
    }
    
    console.log(`${status} Test ${index + 1}: ${testCase.description}`);
    console.log(`    Component: ${component.name}`);
    console.log(`    Expected Scanning Code: ${component.scanningCode || 'N/A'}`);
    console.log(`    Scanned Barcode: ${testCase.barcode}`);
    console.log(`    Expected Result: ${testCase.expected}, Actual Result: ${result}`);
    console.log('');
});

console.log('='.repeat(80));
console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
console.log(`🎯 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed === 0) {
    console.log('🎉 All tests passed! YBS barcode validation logic is working correctly.');
} else {
    console.log('⚠️  Some tests failed. Please review the validation logic.');
}
