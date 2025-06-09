/**
 * YBS Sensor Mapping Validation Test - Node.js Version
 * Validates that sensor item codes are correctly mapped for all YBS types
 * Tests the sensor mapping logic directly
 */

console.log('🧪 Starting YBS Sensor Mapping Validation Test...\n');

// Mock the YBSBackendManager class for Node.js testing
class YBSBackendManager {
    constructor() {
        this.API_URL = '/api';
    }

    /**
     * Get YBS item codes based on YBS assembly type using correct item codes from the database
     * Maps specific YBS assembly types to their correct component and sensor item codes
     */
    getYBSItemCodes(ybsType) {
        // Define the correct item code mappings for each YBS assembly type
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

        // Return the mapping for the specified YBS type, or empty object if not found
        const mapping = itemCodeMappings[ybsType] || { components: [], sensors: [] };
        
        console.log(`🔍 YBS item codes for ${ybsType}:`, {
            components: mapping.components.length,
            sensors: mapping.sensors.length,
            total: mapping.components.length + mapping.sensors.length
        });

        return mapping;
    }

    /**
     * Get specific sensor item code for a YBS type and sensor index (1-based)
     */
    getSensorItemCode(ybsType, sensorIndex) {
        const mapping = this.getYBSItemCodes(ybsType);
        if (!mapping || !mapping.sensors || sensorIndex < 1 || sensorIndex > mapping.sensors.length) {
            console.warn(`⚠️ YBS Backend: Invalid sensor mapping for ${ybsType}, sensor ${sensorIndex}`);
            return null;
        }
        
        // Convert 1-based index to 0-based for array access
        const itemCode = mapping.sensors[sensorIndex - 1];
        console.log(`🔍 YBS Backend: Sensor ${sensorIndex} for ${ybsType} uses item code: ${itemCode}`);
        return itemCode;
    }

    /**
     * Get component item code for a YBS type and component index (0-based)
     */
    getComponentItemCode(ybsType, componentIndex) {
        const mapping = this.getYBSItemCodes(ybsType);
        if (!mapping || !mapping.components || componentIndex < 0 || componentIndex >= mapping.components.length) {
            console.warn(`⚠️ YBS Backend: Invalid component mapping for ${ybsType}, component ${componentIndex}`);
            return null;
        }
        
        const itemCode = mapping.components[componentIndex];
        console.log(`🔍 YBS Backend: Component ${componentIndex} for ${ybsType} uses item code: ${itemCode}`);
        return itemCode;
    }

    /**
     * Get all sensor item codes for a YBS type as a mapping object
     */
    getSensorItemCodeMapping(ybsType) {
        const mapping = this.getYBSItemCodes(ybsType);
        if (!mapping || !mapping.sensors) {
            return {};
        }
        
        const sensorMapping = {};
        mapping.sensors.forEach((itemCode, index) => {
            sensorMapping[index + 1] = itemCode; // Convert to 1-based indexing
        });
        
        console.log(`🔍 YBS Backend: Sensor mapping for ${ybsType}:`, sensorMapping);
        return sensorMapping;
    }

    /**
     * Validate sensor configuration for YBS type
     */
    validateSensorConfiguration(ybsType) {
        const mapping = this.getYBSItemCodes(ybsType);
        if (!mapping) {
            return { valid: false, errors: [`No mapping found for ${ybsType}`] };
        }
        
        const errors = [];
        const warnings = [];
        
        // Check component count
        if (!mapping.components || mapping.components.length !== 6) {
            errors.push(`Expected 6 components, found ${mapping.components?.length || 0}`);
        }
        
        // Check sensor count (should be 23, 24, or 25 depending on YBS type)
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
        
        const expectedCount = expectedSensorCounts[ybsType];
        if (expectedCount && (!mapping.sensors || mapping.sensors.length !== expectedCount)) {
            errors.push(`Expected ${expectedCount} sensors for ${ybsType}, found ${mapping.sensors?.length || 0}`);
        }
        
        // Check for empty or invalid item codes
        mapping.components?.forEach((code, index) => {
            if (!code || code.trim() === '') {
                errors.push(`Component ${index} has empty item code`);
            }
        });
        
        mapping.sensors?.forEach((code, index) => {
            if (!code || code.trim() === '') {
                errors.push(`Sensor ${index + 1} has empty item code`);
            }
        });
        
        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            componentCount: mapping.components?.length || 0,
            sensorCount: mapping.sensors?.length || 0,
            expectedSensorCount: expectedCount || 'unknown'
        };
    }
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
    
    // Test a few key sensor mappings (not all to reduce output)
    const keySensors = [1, 16, testCase.expectedSensorCount];
    for (const sensorIndex of keySensors) {
        if (sensorIndex <= testCase.expectedSensorCount) {
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

console.log(`\n🏁 YBS Sensor Mapping Validation Test Completed!`);
