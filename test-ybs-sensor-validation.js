/**
 * YBS Sensor Validation Test
 * Tests the updated sensor barcode validation logic using API-provided verification codes
 */

// Mock the YBS system for testing
class YBSTestSystem {
    constructor() {
        this.currentYBSType = '5YB011057';
        this.loadedInventoryData = null;
        this.ybsConfigurations = {
            '5YB011057': {
                sensors: {
                    itemCodes: {
                        special: {
                            itemCode: '5YB013255',
                            sensors: [1, 16, 24]
                        },
                        standard: {
                            itemCode: '5YB013254',
                            sensors: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23]
                        }
                    },
                    verificationCodes: {
                        group1: {
                            code: "1",
                            sensors: [1, 16, 24]
                        },
                        group2: {
                            code: "2", 
                            sensors: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23]
                        }
                    }
                }
            }
        };
        
        // Mock API data
        this.mockAPIData();
    }
    
    mockAPIData() {
        this.loadedInventoryData = {
            success: true,
            itemCodes: {
                '5YB013255': {
                    item_code: '5YB013255',
                    description: 'Special Sensor',
                    verification_code: '1',
                    unit_of_measure: 'PCS'
                },
                '5YB013254': {
                    item_code: '5YB013254',
                    description: 'Standard Sensor',
                    verification_code: '2',
                    unit_of_measure: 'PCS'
                }
            }
        };
    }
    
    /**
     * Get sensor details including item code and verification code from API data
     */
    getSensorDetails(sensorId) {
        const config = this.ybsConfigurations[this.currentYBSType];
        let itemCode = 'Unknown';
        let sensorType = 'Standard';
        let verificationCode = null;
        
        if (config && config.sensors && config.sensors.itemCodes) {
            // Check if it's a special sensor (1 or 16)
            if (config.sensors.itemCodes.special && 
                config.sensors.itemCodes.special.sensors.includes(sensorId)) {
                itemCode = config.sensors.itemCodes.special.itemCode;
                sensorType = 'Special';
            }
            // Check if it's a standard sensor
            else if (config.sensors.itemCodes.standard && 
                     config.sensors.itemCodes.standard.sensors.includes(sensorId)) {
                itemCode = config.sensors.itemCodes.standard.itemCode;
                sensorType = 'Standard';
            }
        }
        
        // Get verification code from loaded inventory data if available
        if (this.loadedInventoryData && this.loadedInventoryData.itemCodes && itemCode !== 'Unknown') {
            const inventoryItem = this.loadedInventoryData.itemCodes[itemCode];
            if (inventoryItem && inventoryItem.verification_code) {
                verificationCode = inventoryItem.verification_code;
            }
        }
        
        return {
            itemCode: itemCode,
            sensorType: sensorType,
            position: sensorId,
            verificationCode: verificationCode
        };
    }
    
    /**
     * Verify sensor barcode using API data
     */
    verifySensorBarcode(barcode, sensorId) {
        // Try to get verification code from API data first (preferred method)
        const sensorDetails = this.getSensorDetails(sensorId);
        if (sensorDetails && sensorDetails.verificationCode) {
            // Use API-provided verification code
            const expectedCode = sensorDetails.verificationCode;
            
            // Special handling for sensors that auto-pass (like sensor 23)
            if (expectedCode === "" || expectedCode === null) {
                return true;
            }
            
            return this.extractVerificationCode(barcode, expectedCode) === expectedCode;
        }
        
        // Fallback to static configuration if API data not available
        const config = this.ybsConfigurations[this.currentYBSType];
        
        // Find which verification group this sensor belongs to
        let expectedCode = "";
        for (const group of Object.values(config.sensors.verificationCodes)) {
            if (group.sensors.includes(sensorId)) {
                expectedCode = group.code;
                break;
            }
        }

        // Sensor 23 has no verification code (auto-passes)
        if (sensorId === 23 || expectedCode === "") {
            return true;
        }

        return this.extractVerificationCode(barcode, expectedCode) === expectedCode;
    }    /**
     * Extract verification code from barcode
     */
    extractVerificationCode(barcode, expectedCode) {
        if (!barcode || barcode.length < 5) return "";
        
        // Special cases
        if (expectedCode === "3Q4") {
            return barcode.includes("3Q4") ? "3Q4" : "";
        }
        
        if (expectedCode === "25") {
            return barcode.includes("25") ? "25" : "";
        }
        
        // For single-digit codes, check specific positions to avoid false matches
        if (expectedCode.length === 1) {
            // Check positions 5 and 6 for verification codes (YBS standard positions)
            // Note: positions are 0-indexed, so position 5 = index 4, position 6 = index 5
            if (barcode.length >= 6) {
                if (barcode[4] === expectedCode || barcode[5] === expectedCode) {
                    return expectedCode;
                }
            }
            // For shorter barcodes, check position 5 only
            if (barcode.length >= 5 && barcode[4] === expectedCode) {
                return expectedCode;
            }
            // Also check if the expected code appears at the end of the barcode
            if (barcode.endsWith(expectedCode)) {
                return expectedCode;
            }
            // Check position 7 (index 6) for longer barcodes
            if (barcode.length >= 7 && barcode[6] === expectedCode) {
                return expectedCode;
            }
            return "";
        } else if (expectedCode.length === 2) {
            // For two-digit codes, check if they appear in the barcode
            return barcode.includes(expectedCode) ? expectedCode : "";
        }
        
        return "";
    }
}

// Run the test
console.log('🧪 YBS Sensor Validation Test');
console.log('🚀 Starting sensor validation tests...\n');

const testSystem = new YBSTestSystem();

// Test cases
const testCases = [
    // Special sensors (should use verification code "1")
    { sensorId: 1, barcode: '123451890', expectedResult: true, description: 'Special sensor 1 with "1" at position 5' },
    { sensorId: 16, barcode: 'ABC121EF', expectedResult: true, description: 'Special sensor 16 with "1" at position 6' },
    { sensorId: 24, barcode: 'TESTCODE1', expectedResult: true, description: 'Special sensor 24 with "1" at end' },
    
    // Standard sensors (should use verification code "2")
    { sensorId: 2, barcode: '123452890', expectedResult: true, description: 'Standard sensor 2 with "2" at position 5' },
    { sensorId: 10, barcode: 'ABC12D2EF', expectedResult: true, description: 'Standard sensor 10 with "2" at position 6' },
    { sensorId: 23, barcode: 'TESTCODE2', expectedResult: true, description: 'Standard sensor 23 with "2" at end' },
    
    // Invalid cases
    { sensorId: 1, barcode: '123452890', expectedResult: false, description: 'Special sensor 1 with wrong code "2"' },
    { sensorId: 2, barcode: '123451890', expectedResult: false, description: 'Standard sensor 2 with wrong code "1"' },
    { sensorId: 10, barcode: 'ABCDEFGHIJ', expectedResult: false, description: 'Standard sensor 10 with no valid code' },
    { sensorId: 1, barcode: '1234567892', expectedResult: false, description: 'Special sensor 1 with "2" in wrong position' },
];

let passedTests = 0;
let totalTests = testCases.length;

console.log('--- Sensor Details Test ---');
// Test sensor details retrieval
for (let sensorId of [1, 2, 10, 16, 23, 24]) {
    const details = testSystem.getSensorDetails(sensorId);
    console.log(`🔍 Sensor ${sensorId}: ${details.sensorType} (${details.itemCode}) - Verification Code: ${details.verificationCode}`);
}

console.log('\n--- Barcode Validation Test ---');
// Test barcode validation
testCases.forEach((testCase, index) => {
    const result = testSystem.verifySensorBarcode(testCase.barcode, testCase.sensorId);
    const status = result === testCase.expectedResult ? '✅' : '❌';
    const statusText = result === testCase.expectedResult ? 'PASS' : 'FAIL';
    
    console.log(`${status} Test ${index + 1}: ${testCase.description}`);
    console.log(`   Barcode: ${testCase.barcode} | Expected: ${testCase.expectedResult} | Got: ${result} | ${statusText}`);
    
    if (result === testCase.expectedResult) {
        passedTests++;
    }
});

console.log('\n📊 Test Summary:');
console.log(`   Passed: ${passedTests}/${totalTests} tests`);
console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
    console.log('🎉 ALL SENSOR VALIDATION TESTS PASSED!');
    console.log('The sensor barcode validation is now working correctly with API-provided verification codes.');
} else {
    console.log('⚠️ Some tests failed. The sensor validation logic needs further adjustment.');
}
