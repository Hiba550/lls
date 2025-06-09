/**
 * Comprehensive YBS Item Code Mapping Verification Test
 * Tests all YBS assembly types to ensure they have correct item code mappings
 */

console.log('🧪 Comprehensive YBS Item Code Mapping Test\n');

// Simulate the updated YBS backend getYBSItemCodes method
function getYBSItemCodes(ybsType) {
    const itemCodeMappings = {
        // 5YB011056 - YBS Machine - Duct Number 41 - 23 Duct Assembly
        '5YB011056': {
            components: ['4YB013250', '4YB013248', '4YB013251', '4YB013258', '4YB013258', '4YB013254'],
            sensors: ['5YB013255', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013255', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254']
        },
        // 5YB011057 - YBS Assembly Verification (24 sensors including sensor 24)
        '5YB011057': {
            components: ['4YB013250', '4YB013248', '4YB013251', '4YB013258', '4YB013258', '4YB013255'],
            sensors: ['5YB013255', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013255', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013255']
        },
        // 5YB011059 - YBS Assembly - 25 Duct Assembly
        '5YB011059': {
            components: ['4YB013250', '4YB013249', '4YB013251', '4YB013258', '4YB013258', '4YB013256'],
            sensors: ['5YB013255', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013255', '5YB013255', '5YB013254', '5YB013254', '5YB013254', '5YB013254', '5YB013255', '5YB013255', '5YB013255', '5YB013255']
        },
        // 5YB011099 - YBS Assembly - 23 Duct Assembly
        '5YB011099': {
            components: ['4YB013250', '4YB013248', '4YB013271', '4YB013258', '4YB013258', 'TYB012092'],
            sensors: ['5YB013257', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013257', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256']
        },
        // 5YB011100 - YBS Assembly - 24 Duct Assembly
        '5YB011100': {
            components: ['4YB013250', '4YB013248', '4YB013271', '4YB013258', '4YB013258', 'TYB012093'],
            sensors: ['5YB013257', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013257', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256']
        },
        // 5YB011101 - YBS Assembly - 25 Duct Assembly
        '5YB011101': {
            components: ['4YB013250', '4YB013248', '4YB013271', '4YB013258', '4YB013258', 'TYB012094'],
            sensors: ['5YB013257', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013257', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256', '5YB013256']
        },
        // 5YB011111 - YBS Assembly - 23 Duct Assembly
        '5YB011111': {
            components: ['4YB013250', '4YB013248', '4YB013271', '4YB013275', '4YB013275', 'TYB012092'],
            sensors: ['5YB013263', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013263', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262']
        },
        // 5YB011112 - YBS Assembly - 24 Duct Assembly
        '5YB011112': {
            components: ['4YB013250', '4YB013248', '4YB013271', '4YB013275', '4YB013275', 'TYB012093'],
            sensors: ['5YB013263', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013263', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262']
        },
        // 5YB011113 - YBS Assembly - 25 Duct Assembly
        '5YB011113': {
            components: ['4YB013250', '4YB013248', '4YB013271', '4YB013275', '4YB013275', 'TYB012094'],
            sensors: ['5YB013263', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013263', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262', '5YB013262']
        },
        // 5YB011446 - YBS REGULAR ILI DUCT ASSEMBLY - 23 SPINDLES - V1
        '5YB011446': {
            components: ['4YB013250', '4YB013307', '4YB013271', '4YB013323', '4YB013323', '4YB013317'],
            sensors: ['5YB013286', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013286', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285']
        },
        // 5YB011447 - YBS REGULAR ILI DUCT ASSEMBLY - 24 SPINDLES - V1
        '5YB011447': {
            components: ['4YB013250', '4YB013308', '4YB013271', '4YB013323', '4YB013323', '4YB013318'],
            sensors: ['5YB013286', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013286', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285', '5YB013285']
        },
        // 5YB011448 - YBS REGULAR ILI DUCT ASSEMBLY - 24 SPINDLES - V1
        '5YB011448': {
            components: ['4YB013250', '4YB013308', '4YB013271', '4YB013323', '4YB013323', '4YB013319'],
            sensors: ['5YB013286', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013286', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284', '5YB013284']
        }
    };

    const mapping = itemCodeMappings[ybsType] || { components: [], sensors: [] };
    return mapping;
}

// Expected sensor counts for each YBS type
const expectedSensorCounts = {
    '5YB011056': 23,
    '5YB011057': 24,
    '5YB011059': 25,
    '5YB011099': 23,
    '5YB011100': 24,
    '5YB011101': 25,
    '5YB011111': 23,
    '5YB011112': 24,
    '5YB011113': 25,
    '5YB011446': 23,
    '5YB011447': 24,
    '5YB011448': 24
};

console.log('🔍 Testing all YBS assembly types...\n');

let allPassed = true;
let testResults = [];

Object.keys(expectedSensorCounts).forEach(ybsType => {
    const expectedSensors = expectedSensorCounts[ybsType];
    const expectedComponents = 6; // All YBS types have 6 components
    
    console.log(`--- Testing ${ybsType} ---`);
    
    const mapping = getYBSItemCodes(ybsType);
    
    let testPassed = true;
    let issues = [];
    
    // Check if mapping exists
    if (mapping.components.length === 0 && mapping.sensors.length === 0) {
        issues.push('❌ No mapping found');
        testPassed = false;
    }
    
    // Check component count
    if (mapping.components.length !== expectedComponents) {
        issues.push(`❌ Expected ${expectedComponents} components, got ${mapping.components.length}`);
        testPassed = false;
    }
    
    // Check sensor count
    if (mapping.sensors.length !== expectedSensors) {
        issues.push(`❌ Expected ${expectedSensors} sensors, got ${mapping.sensors.length}`);
        testPassed = false;
    }
    
    // Validate item codes format
    const allCodes = [...mapping.components, ...mapping.sensors];
    const invalidCodes = allCodes.filter(code => !code || typeof code !== 'string' || code.length < 8);
    if (invalidCodes.length > 0) {
        issues.push(`❌ Invalid item codes: ${invalidCodes.join(', ')}`);
        testPassed = false;
    }
    
    if (testPassed) {
        console.log(`✅ ${ybsType}: ${mapping.components.length} components, ${mapping.sensors.length} sensors`);
        console.log(`   Components: ${mapping.components.join(', ')}`);
        console.log(`   Sensors: ${mapping.sensors[0]}, ${mapping.sensors[1]}...${mapping.sensors[mapping.sensors.length-1]} (${mapping.sensors.length} total)`);
    } else {
        console.log(`❌ ${ybsType} FAILED:`);
        issues.forEach(issue => console.log(`   ${issue}`));
        allPassed = false;
    }
    
    testResults.push({
        type: ybsType,
        passed: testPassed,
        components: mapping.components.length,
        sensors: mapping.sensors.length,
        expectedSensors: expectedSensors,
        issues: issues
    });
    
    console.log('');
});

console.log('📊 Test Summary:');
console.log(`Total YBS Types: ${testResults.length}`);
console.log(`Passed: ${testResults.filter(r => r.passed).length}`);
console.log(`Failed: ${testResults.filter(r => !r.passed).length}`);

if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! All YBS types have correct item code mappings.');
} else {
    console.log('\n⚠️ SOME TESTS FAILED. Please review the issues above.');
    
    console.log('\nFailed Tests:');
    testResults.filter(r => !r.passed).forEach(result => {
        console.log(`- ${result.type}: ${result.issues.join(', ')}`);
    });
}

console.log('\n🔬 Special sensor verification for 5YB011057:');
const yb011057 = getYBSItemCodes('5YB011057');
if (yb011057.sensors.length === 24) {
    const sensor1 = yb011057.sensors[0];  // Sensor 1
    const sensor16 = yb011057.sensors[15]; // Sensor 16
    const sensor24 = yb011057.sensors[23]; // Sensor 24
    
    console.log(`Sensor 1: ${sensor1} ${sensor1 === '5YB013255' ? '✅' : '❌'}`);
    console.log(`Sensor 16: ${sensor16} ${sensor16 === '5YB013255' ? '✅' : '❌'}`);
    console.log(`Sensor 24: ${sensor24} ${sensor24 === '5YB013255' ? '✅' : '❌'}`);
    
    const standardSensors = yb011057.sensors.filter((code, index) => 
        ![0, 15, 23].includes(index) && code === '5YB013254'
    );
    console.log(`Standard sensors (5YB013254): ${standardSensors.length}/21 ${standardSensors.length === 21 ? '✅' : '❌'}`);
}

console.log('\n🎯 Test Complete!');
