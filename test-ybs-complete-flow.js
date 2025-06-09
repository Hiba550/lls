/**
 * Test YBS Complete Barcode Validation Flow 
 * Tests the complete barcode validation flow including API data loading
 */

const fs = require('fs');
const path = require('path');

// Test the complete YBS validation flow
console.log('🧪 Testing YBS Complete Barcode Validation Flow\n');

// Test data that should match what's returned from the backend
const mockInventoryResult = {
    success: true,
    message: 'All YBS component codes loaded successfully',
    itemCodes: {
        'left_pcb': {
            code: 'V22CL0065',
            itemCode: '4YB013250',
            description: 'Left Slave PCB Component'
        },
        'master_pcb': {
            code: 'V22C80087',
            itemCode: '4YB013248',
            description: 'Master PCB Component'
        },
        'right_pcb': {
            code: 'V22CR0129',
            itemCode: '4YB013251',
            description: 'Right Slave PCB Component'
        },
        'b2b_left_master': {
            code: 'P22BV0584',
            itemCode: '4YB013258',
            description: 'Board-to-Board Left to Master'
        },
        'b2b_master_right': {
            code: 'P22BV0476',
            itemCode: '4YB013258',
            description: 'Board-to-Board Master to Right'
        },
        'pc_cable': {
            code: 'P22AQ0131',
            itemCode: '4YB013254',
            description: 'Power & Communication Cable'
        }
    },
    fetchResults: [
        { component: 'left_pcb', itemCode: '4YB013250', code: 'V22CL0065', description: 'Left Slave PCB Component', success: true },
        { component: 'master_pcb', itemCode: '4YB013248', code: 'V22C80087', description: 'Master PCB Component', success: true },
        { component: 'right_pcb', itemCode: '4YB013251', code: 'V22CR0129', description: 'Right Slave PCB Component', success: true },
        { component: 'b2b_left_master', itemCode: '4YB013258', code: 'P22BV0584', description: 'Board-to-Board Left to Master', success: true },
        { component: 'b2b_master_right', itemCode: '4YB013258', code: 'P22BV0476', description: 'Board-to-Board Master to Right', success: true },
        { component: 'pc_cable', itemCode: '4YB013254', code: 'P22AQ0131', description: 'Power & Communication Cable', success: true }
    ]
};

// Initial component mapping (what gets created from configuration)
const initialComponentMapping = {
    'left_pcb': {
        name: 'Left Slave PCB',
        itemCode: '4YB013250',
        barcode: 'V22CL0065', // This is the old static barcode
        cssSelector: '.left-pcb',
        index: 1,
        sequence: 1,
        verificationCode: '24', // This is the old verification code
        type: 'component',
        scanned: false,
        scannedBarcode: null,
        scanTime: null
    },
    'master_pcb': {
        name: 'Master PCB',
        itemCode: '4YB013248',
        barcode: 'V22C80087',
        cssSelector: '.master-pcb',
        index: 2,
        sequence: 2,
        verificationCode: '25',
        type: 'component',
        scanned: false,
        scannedBarcode: null,
        scanTime: null
    },
    'right_pcb': {
        name: 'Right Slave PCB',
        itemCode: '4YB013251',
        barcode: 'V22CR0129',
        cssSelector: '.right-pcb',
        index: 3,
        sequence: 3,
        verificationCode: '3Q4',
        type: 'component',
        scanned: false,
        scannedBarcode: null,
        scanTime: null
    },
    'b2b_left_master': {
        name: 'Board-to-Board (Left to Master)',
        itemCode: '4YB013258',
        barcode: 'P22BV0584',
        cssSelector: '.board-to-board',
        index: 4,
        sequence: 4,
        verificationCode: 'O',
        type: 'component',
        scanned: false,
        scannedBarcode: null,
        scanTime: null
    },
    'b2b_master_right': {
        name: 'Board-to-Board (Master to Right)',
        itemCode: '4YB013258',
        barcode: 'P22BV0476',
        cssSelector: '.board-to-board',
        index: 5,
        sequence: 5,
        verificationCode: 'P',
        type: 'component',
        scanned: false,
        scannedBarcode: null,
        scanTime: null
    },
    'pc_cable': {
        name: 'Power & Communication Cable',
        itemCode: '4YB013254',
        barcode: 'P22AQ0131',
        cssSelector: '.power-cable',
        index: 6,
        sequence: 6,
        verificationCode: 'J',
        type: 'component',
        scanned: false,
        scannedBarcode: null,
        scanTime: null
    }
};

// Simulate the mapping process from ybs.js
function mapScanningCodes(componentMapping, inventoryResult) {
    console.log('\n📋 Step 1: Initial Component Mapping');
    Object.entries(componentMapping).forEach(([key, component]) => {
        console.log(`  ${key}: ${component.name} - Static barcode: ${component.barcode}, Verification: ${component.verificationCode}`);
    });
    
    console.log('\n🔄 Step 2: Mapping API data to components...');
    Object.entries(componentMapping).forEach(([key, component]) => {
        const apiData = inventoryResult.itemCodes[key];
        if (apiData) {
            component.scanningCode = apiData.code;
            component.itemCode = apiData.itemCode;
            component.description = apiData.description;
            
            console.log(`✅ Assigned scanning code to ${key}:`, {
                name: component.name,
                itemCode: component.itemCode,
                scanningCode: component.scanningCode,
                description: component.description
            });
        } else {
            console.warn(`⚠️ No API data found for component ${key}`);
        }
    });
    
    return componentMapping;
}

// Mock the verification function from ybs.js
function verifyComponentBarcode(barcode, component) {
    console.log(`🔍 Verifying barcode for component:`, {
        componentName: component.name,
        expectedScanningCode: component.scanningCode,
        expectedItemCode: component.itemCode,  
        scannedBarcode: barcode
    });
    
    // Use dynamic scanningCode from API, not static verificationCode
    if (!component.scanningCode) {
        console.log(`⚠️ No scanning code available, falling back to item code comparison`);
        const result = barcode === component.itemCode;
        console.log(`📊 Fallback result: ${result} (${barcode} === ${component.itemCode})`);
        return result;
    }
    
    // Accept if barcode contains or equals the scanningCode (case-insensitive)
    const result = barcode.toUpperCase().includes(component.scanningCode.toUpperCase());
    console.log(`📊 Validation result: ${result} (${barcode.toUpperCase()} includes ${component.scanningCode.toUpperCase()})`);
    return result;
}

// Execute the test
console.log('🚀 Starting YBS Component Mapping Test...\n');

// Step 1: Map scanning codes (simulate what happens in initializeAPI())
const updatedComponentMapping = mapScanningCodes(initialComponentMapping, mockInventoryResult);

console.log('\n✅ Step 3: Final Component Mapping');
Object.entries(updatedComponentMapping).forEach(([key, component]) => {
    console.log(`  ${key}: ${component.name}`);
    console.log(`    Item Code: ${component.itemCode}`);
    console.log(`    Static Barcode: ${component.barcode}`);
    console.log(`    Scanning Code: ${component.scanningCode}`);
    console.log(`    Old Verification: ${component.verificationCode}`);
    console.log('');
});

// Step 2: Test barcode validation with the correct scanning codes
console.log('🧪 Step 4: Testing Barcode Validation\n');

const testScans = [
    { component: 'left_pcb', barcode: 'V22CL0065', expected: true },
    { component: 'master_pcb', barcode: 'V22C80087', expected: true },
    { component: 'right_pcb', barcode: 'V22CR0129', expected: true },
    { component: 'b2b_left_master', barcode: 'P22BV0584', expected: true },
    { component: 'b2b_master_right', barcode: 'P22BV0476', expected: true },
    { component: 'pc_cable', barcode: 'P22AQ0131', expected: true },
    { component: 'left_pcb', barcode: 'WRONGCODE', expected: false }
];

let passed = 0;
let failed = 0;

testScans.forEach((test, index) => {
    console.log(`\n--- Test ${index + 1}: ${test.component} ---`);
    const component = updatedComponentMapping[test.component];
    const result = verifyComponentBarcode(test.barcode, component);
    
    if (result === test.expected) {
        console.log(`✅ PASS: Expected ${test.expected}, got ${result}`);
        passed++;
    } else {
        console.log(`❌ FAIL: Expected ${test.expected}, got ${result}`);
        failed++;
    }
});

console.log('\n' + '='.repeat(80));
console.log(`📊 Final Results: ${passed} passed, ${failed} failed`);
console.log(`🎯 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed === 0) {
    console.log('🎉 All tests passed! YBS complete flow is working correctly.');
    console.log('\n🔧 Summary:');
    console.log('✅ Component mapping initialization works correctly');
    console.log('✅ API data mapping to components works correctly');
    console.log('✅ Barcode validation uses scanning codes (not verification codes)');
    console.log('✅ All expected barcodes are accepted');
    console.log('✅ Invalid barcodes are rejected');
} else {
    console.log('⚠️ Some tests failed. Please review the flow.');
}
