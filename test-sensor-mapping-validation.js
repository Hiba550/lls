/**
 * YBS Sensor Mapping Validation Test
 * Validates that sensor item codes are correctly mapped for all YBS types
 * Tests the new getSensorItemCode() method and sensor validation logic
 */

console.log('🧪 Starting YBS Sensor Mapping Validation Test...\n');

// Import or create backend manager
if (typeof YBSBackendManager === 'undefined') {
    console.error('❌ YBSBackendManager not found. Please run this script in the browser console where ybs_backend.js is loaded.');
    process.exit(1);
}

const backendManager = new YBSBackendManager();

// Define test data based on user-provided mappings
const testCases = {
    '5YB011056': {
        expectedSensorCount: 23,
        specialSensors: {
            1: '5YB013255',
            16: '5YB013255'
        },
        standardSensorCode: '5YB013254'
    },
    '5YB011057': {
        expectedSensorCount: 24,
        specialSensors: {
            1: '5YB013255',
            16: '5YB013255',
            24: '5YB013255'
        },
        standardSensorCode: '5YB013254'
    },
    '5YB011059': {
        expectedSensorCount: 25,
        specialSensors: {
            1: '5YB013255',
            16: '5YB013255',
            17: '5YB013255',
            22: '5YB013255',
            23: '5YB013255',
            24: '5YB013255',
            25: '5YB013255'
        },
        standardSensorCode: '5YB013254'
    },
    '5YB011099': {
        expectedSensorCount: 23,
        specialSensors: {
            1: '5YB013257',
            16: '5YB013257'
        },
        standardSensorCode: '5YB013256'
    },
    '5YB011100': {
        expectedSensorCount: 24,
        specialSensors: {
            1: '5YB013257',
            16: '5YB013257'
        },
        standardSensorCode: '5YB013256'
    },
    '5YB011101': {
        expectedSensorCount: 25,
        specialSensors: {
            1: '5YB013257',
            16: '5YB013257'
        },
        standardSensorCode: '5YB013256'
    },
    '5YB011111': {
        expectedSensorCount: 23,
        specialSensors: {
            1: '5YB013263',
            16: '5YB013263'
        },
        standardSensorCode: '5YB013262'
    },
    '5YB011112': {
        expectedSensorCount: 24,
        specialSensors: {
            1: '5YB013263',
            16: '5YB013263'
        },
        standardSensorCode: '5YB013262'
    },
    '5YB011113': {
        expectedSensorCount: 25,
        specialSensors: {
            1: '5YB013263',
            16: '5YB013263'
        },
        standardSensorCode: '5YB013262'
    },
    '5YB011446': {
        expectedSensorCount: 23,
        specialSensors: {
            1: '5YB013286',
            16: '5YB013286'
        },
        standardSensorCode: '5YB013285'
    },
    '5YB011447': {
        expectedSensorCount: 24,
        specialSensors: {
            1: '5YB013286',
            16: '5YB013286'
        },
        standardSensorCode: '5YB013285'
    },
    '5YB011448': {
        expectedSensorCount: 24,
        specialSensors: {
            1: '5YB013286',
            16: '5YB013286'
        },
        standardSensorCode: '5YB013284'
    }
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Test each YBS type
for (const [ybsType, testCase] of Object.entries(testCases)) {
    console.log(`\n📋 Testing ${ybsType}...`);
    
    // Validate configuration
    const validation = backendManager.validateSensorConfiguration(ybsType);
    totalTests++;
    
    if (validation.valid) {
        console.log(`  ✅ Configuration validation: PASSED`);
        passedTests++;
    } else {
        console.log(`  ❌ Configuration validation: FAILED`);
        console.log(`     Errors: ${validation.errors.join(', ')}`);
        failedTests++;
    }
    
    // Test sensor count
    totalTests++;
    if (validation.sensorCount === testCase.expectedSensorCount) {
        console.log(`  ✅ Sensor count (${validation.sensorCount}): PASSED`);
        passedTests++;
    } else {
        console.log(`  ❌ Sensor count: FAILED (expected ${testCase.expectedSensorCount}, got ${validation.sensorCount})`);
        failedTests++;
    }
    
    // Test individual sensor mappings
    for (let sensorIndex = 1; sensorIndex <= testCase.expectedSensorCount; sensorIndex++) {
        totalTests++;
        
        const actualItemCode = backendManager.getSensorItemCode(ybsType, sensorIndex);
        const expectedItemCode = testCase.specialSensors[sensorIndex] || testCase.standardSensorCode;
        
        if (actualItemCode === expectedItemCode) {
            console.log(`  ✅ Sensor ${sensorIndex} (${actualItemCode}): PASSED`);
            passedTests++;
        } else {
            console.log(`  ❌ Sensor ${sensorIndex}: FAILED (expected ${expectedItemCode}, got ${actualItemCode})`);
            failedTests++;
        }
    }
    
    // Test sensor mapping object generation
    totalTests++;
    const sensorMapping = backendManager.getSensorItemCodeMapping(ybsType);
    const expectedMappingSize = testCase.expectedSensorCount;
    
    if (Object.keys(sensorMapping).length === expectedMappingSize) {
        console.log(`  ✅ Sensor mapping object: PASSED (${Object.keys(sensorMapping).length} sensors)`);
        passedTests++;
    } else {
        console.log(`  ❌ Sensor mapping object: FAILED (expected ${expectedMappingSize}, got ${Object.keys(sensorMapping).length})`);
        failedTests++;
    }
}

// Test component mappings
console.log(`\n📋 Testing Component Mappings...`);
const testYbsType = '5YB011056';
const expectedComponents = ['4YB013250', '4YB013248', '4YB013251', '4YB013258', '4YB013258', '4YB013254'];

for (let componentIndex = 0; componentIndex < expectedComponents.length; componentIndex++) {
    totalTests++;
    
    const actualItemCode = backendManager.getComponentItemCode(testYbsType, componentIndex);
    const expectedItemCode = expectedComponents[componentIndex];
    
    if (actualItemCode === expectedItemCode) {
        console.log(`  ✅ Component ${componentIndex} (${actualItemCode}): PASSED`);
        passedTests++;
    } else {
        console.log(`  ❌ Component ${componentIndex}: FAILED (expected ${expectedItemCode}, got ${actualItemCode})`);
        failedTests++;
    }
}

// Summary
console.log(`\n📊 Test Results Summary:`);
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
console.log(`Failed: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);

if (failedTests === 0) {
    console.log(`\n🎉 All tests PASSED! YBS sensor mapping is working correctly.`);
} else {
    console.log(`\n⚠️  ${failedTests} tests FAILED. Please review the sensor mappings.`);
}

// Test error cases
console.log(`\n📋 Testing Error Cases...`);

// Test invalid YBS type
totalTests++;
const invalidResult = backendManager.getSensorItemCode('INVALID_TYPE', 1);
if (invalidResult === null) {
    console.log(`  ✅ Invalid YBS type handling: PASSED`);
    passedTests++;
} else {
    console.log(`  ❌ Invalid YBS type handling: FAILED`);
    failedTests++;
}

// Test invalid sensor index
totalTests++;
const invalidSensorResult = backendManager.getSensorItemCode('5YB011056', 999);
if (invalidSensorResult === null) {
    console.log(`  ✅ Invalid sensor index handling: PASSED`);
    passedTests++;
} else {
    console.log(`  ❌ Invalid sensor index handling: FAILED`);
    failedTests++;
}

console.log(`\n🏁 YBS Sensor Mapping Validation Test Completed!`);
console.log(`Final Results: ${passedTests}/${totalTests} tests passed`);

if (failedTests === 0) {
    console.log(`✅ SUCCESS: All sensor mappings are correctly implemented!`);
} else {
    console.log(`❌ FAILURE: ${failedTests} issues need to be addressed.`);
}
