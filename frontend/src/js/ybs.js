/**
 * Universal YBS Assembly Script
 * Handles all YBS PCB assembly types with standardized logic
 * Version: 2.1 - Refactored with Backend Manager
 * 
 * Features:
 * - Auto-detects YBS type from filename or URL
 * - Configurable component mappings per YBS type
 * - Unified barcode scanning and validation
 * - Assembly completion with quantity management
 * - Automatic next assembly progression
 * - Database integration for logging
 * - Component barcode tracking
 * - Separated backend operations via YBSBackendManager
 */

class YBSAssemblyManager {
    constructor() {
        this.API_URL = '/api';
        this.assemblyId = null;
        this.workOrderId = null;
        this.currentYBSType = null;
        this.componentMapping = {};
        this.scannedBarcodes = new Set();
        this.inventoryDataLoaded = false;
        this.apiConnected = false;
        
        // Initialize backend manager - will be created after backend script loads
        this.backendManager = null;
        
        // UI Elements
        this.uiElements = {};
        
        // Current scanning state
        this.currentSensorIndex = 1;
        this.scannedSensors = [];
        this.currentWorkOrderDetails = null;
        
        // Configuration for different YBS types
        this.ybsConfigurations = {
            '5YB011056': {
                name: 'YBS Assembly - 5YB011056',
                subtitle: 'YBS Machine - Duct Number 41 - 23 Duct Assembly',
                title: 'YBS Machine Circuit Board Layout',
                sensorCount: 23,
                components: {
                    'left_pcb': {
                        itemCode: '4YB013250',
                        name: 'Left Slave PCB',
                        barcode: 'V22CL0065',
                        cssSelector: '.left-pcb',
                        index: 1,
                        sequence: 1,
                        verificationCode: '24'
                    },
                    'master_pcb': {
                        itemCode: '4YB013248',
                        name: 'Master PCB',
                        barcode: 'V22C80087',
                        cssSelector: '.master-pcb',
                        index: 2,
                        sequence: 2,
                        verificationCode: '25'
                    },
                    'right_pcb': {
                        itemCode: '4YB013251',
                        name: 'Right Slave PCB',
                        barcode: 'V22CR0129',
                        cssSelector: '.right-pcb',
                        index: 3,
                        sequence: 3,
                        verificationCode: '3Q4'
                    },
                    'b2b_left_master': {
                        itemCode: '4YB013258',
                        name: 'Board-to-Board (Left to Master)',
                        barcode: 'P22BV0584',
                        cssSelector: '.board-to-board',
                        index: 4,
                        sequence: 4,
                        verificationCode: 'O'
                    },
                    'b2b_master_right': {
                        itemCode: '4YB013258',
                        name: 'Board-to-Board (Master to Right)',
                        barcode: 'P22BV0476',
                        cssSelector: '.board-to-board',
                        index: 5,
                        sequence: 5,
                        verificationCode: 'P'
                    },
                    'pc_cable': {
                        itemCode: '4YB013254',
                        name: 'Power & Communication Cable',
                        barcode: 'P22AQ0131',
                        cssSelector: '.power-cable',
                        index: 6,
                        sequence: 6,
                        verificationCode: 'J'
                    }
                },
                sensors: {
                    barcodes: {
                        1: "R22J200177", 2: "R22J102367", 3: "R22J102368", 4: "R22J102440",
                        5: "R22J102371", 6: "R22J102389", 7: "R22J102390", 8: "R22J102391",
                        9: "R22J102392", 10: "R22J102393", 11: "R22J102394", 12: "R22J102395",
                        13: "R22J102396", 14: "R22J102397", 15: "R22J102398", 16: "R22J102399",
                        17: "R22J102400", 18: "R22J102401", 19: "R22J102402", 20: "R22J102403",
                        21: "R22J102404", 22: "R22J102405", 23: "R22J102406"
                    },
                    itemCodes: {
                        special: { // Sensors 1 & 16
                            itemCode: '5YB013255',
                            sensors: [1, 16]
                        },
                        standard: { // Sensors 2-15 & 17-23
                            itemCode: '5YB013254',
                            sensors: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,23]
                        }
                    },
                    verificationCodes: {
                        // Sensors 1-12: code "1"
                        group1: { code: "1", sensors: [1,2,3,4,5,6,7,8,9,10,11,12] },
                        // Sensors 13-22: code "2"  
                        group2: { code: "2", sensors: [13,14,15,16,17,18,19,20,21,22] },
                        // Sensor 23: no code (auto-passes)
                        group3: { code: "", sensors: [23] }
                    }
                }
            },            '5YB011057': {
                name: 'YBS Assembly - 5YB011057',
                subtitle: 'Assembly Verification',
                title: 'Interactive YBS Machine Circuit Board Layout',
                sensorCount: 24,
                // Same component structure as 5YB011056
                components: {
                    'left_pcb': {
                        itemCode: '4YB013250',
                        name: 'Left Slave PCB',
                        cssSelector: '.left-pcb',
                        index: 1,
                        sequence: 1,
                        verificationCode: '24'
                    },
                    'master_pcb': {
                        itemCode: '4YB013248',
                        name: 'Master PCB',
                        cssSelector: '.master-pcb',
                        index: 2,
                        sequence: 2,
                        verificationCode: '25'
                    },
                    'right_pcb': {
                        itemCode: '4YB013251',
                        name: 'Right Slave PCB',
                        cssSelector: '.right-pcb',
                        index: 3,
                        sequence: 3,
                        verificationCode: '3Q4'
                    },
                    'b2b_left_master': {
                        itemCode: '4YB013258',
                        name: 'Board-to-Board (Left to Master)',
                        cssSelector: '.board-to-board',
                        index: 4,
                        sequence: 4,
                        verificationCode: 'O'
                    },
                    'b2b_master_right': {
                        itemCode: '4YB013258',
                        name: 'Board-to-Board (Master to Right)',
                        cssSelector: '.board-to-board',
                        index: 5,
                        sequence: 5,
                        verificationCode: 'P'
                    },                    'pc_cable': {
                        itemCode: '4YB013255',
                        name: 'Power & Communication Cable',
                        cssSelector: '.power-cable',
                        index: 6,
                        sequence: 6,
                        verificationCode: 'J'
                    }
                },
                // Same sensor structure as 5YB011056
                sensors: {
                    barcodes: {
                        1: "R22J200177", 2: "R22J102367", 3: "R22J102368", 4: "R22J102440",
                        5: "R22J102371", 6: "R22J102389", 7: "R22J102390", 8: "R22J102391",
                        9: "R22J102392", 10: "R22J102393", 11: "R22J102394", 12: "R22J102395",
                        13: "R22J102396", 14: "R22J102397", 15: "R22J102398", 16: "R22J102399",                        17: "R22J102400", 18: "R22J102401", 19: "R22J102402", 20: "R22J102403",                        21: "R22J102404", 22: "R22J102405", 23: "R22J102406", 24: "R22J102407"
                    },
                    itemCodes: {
                        special: { // Sensors 1, 16 & 24
                            itemCode: '5YB013255',
                            sensors: [1, 16, 24]
                        },
                        standard: { // Sensors 2-15 & 17-23
                            itemCode: '5YB013254',
                            sensors: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,23]
                        }
                    },                    verificationCodes: {
                        group1: { code: "1", sensors: [1,2,3,4,5,6,7,8,9,10,11,12] },
                        group2: { code: "2", sensors: [13,14,15,16,17,18,19,20,21,22,23] },
                        group3: { code: "", sensors: [24] }
                    }
                }
            },
            
            // Additional YBS configurations (based on actual HTML sensor counts)
            '5YB011059': {
                name: 'YBS Assembly - 5YB011059',
                subtitle: 'YBS Machine - Duct Number 41 - 25 Duct Assembly',
                title: 'YBS Machine Circuit Board Layout',
                sensorCount: 25,
                components: {
                    'left_pcb': { itemCode: '4YB013250', name: 'Left Slave PCB', cssSelector: '.left-pcb', index: 1, sequence: 1, verificationCode: '24' },
                    'master_pcb': { itemCode: '4YB013248', name: 'Master PCB', cssSelector: '.master-pcb', index: 2, sequence: 2, verificationCode: '25' },
                    'right_pcb': { itemCode: '4YB013251', name: 'Right Slave PCB', cssSelector: '.right-pcb', index: 3, sequence: 3, verificationCode: '3Q4' },
                    'b2b_left_master': { itemCode: '4YB013258', name: 'Board-to-Board (Left to Master)', cssSelector: '.board-to-board', index: 4, sequence: 4, verificationCode: 'O' },
                    'b2b_master_right': { itemCode: '4YB013258', name: 'Board-to-Board (Master to Right)', cssSelector: '.board-to-board', index: 5, sequence: 5, verificationCode: 'P' },
                    'pc_cable': { itemCode: '4YB013255', name: 'Power & Communication Cable', cssSelector: '.power-cable', index: 6, sequence: 6, verificationCode: 'J' }
                },
                sensors: {
                    barcodes: {
                        1: "R22J200177", 2: "R22J102367", 3: "R22J102368", 4: "R22J102440", 5: "R22J102371", 6: "R22J102389", 7: "R22J102390", 8: "R22J102391",
                        9: "R22J102392", 10: "R22J102393", 11: "R22J102394", 12: "R22J102395", 13: "R22J102396", 14: "R22J102397", 15: "R22J102398", 16: "R22J102399",
                        17: "R22J102400", 18: "R22J102401", 19: "R22J102402", 20: "R22J102403", 21: "R22J102404", 22: "R22J102405", 23: "R22J102406", 24: "R22J102407", 25: "R22J102408"
                    },
                    itemCodes: {
                        special: { itemCode: '5YB013255', sensors: [1, 16, 25] },
                        standard: { itemCode: '5YB013254', sensors: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,23,24] }
                    },
                    verificationCodes: {
                        group1: { code: "1", sensors: [1,2,3,4,5,6,7,8,9,10,11,12,13] },
                        group2: { code: "2", sensors: [14,15,16,17,18,19,20,21,22,23,24] },
                        group3: { code: "", sensors: [25] }
                    }
                }
            },
            
            '5YB011099': {
                name: 'YBS Assembly - 5YB011099',
                subtitle: 'YBS Machine - 23 Duct Assembly',
                title: 'YBS Machine Circuit Board Layout',
                sensorCount: 23,
                components: {
                    'left_pcb': { itemCode: '4YB013250', name: 'Left Slave PCB', cssSelector: '.left-pcb', index: 1, sequence: 1, verificationCode: '24' },
                    'master_pcb': { itemCode: '4YB013248', name: 'Master PCB', cssSelector: '.master-pcb', index: 2, sequence: 2, verificationCode: '25' },
                    'right_pcb': { itemCode: '4YB013251', name: 'Right Slave PCB', cssSelector: '.right-pcb', index: 3, sequence: 3, verificationCode: '3Q4' },
                    'b2b_left_master': { itemCode: '4YB013258', name: 'Board-to-Board (Left to Master)', cssSelector: '.board-to-board', index: 4, sequence: 4, verificationCode: 'O' },
                    'b2b_master_right': { itemCode: '4YB013258', name: 'Board-to-Board (Master to Right)', cssSelector: '.board-to-board', index: 5, sequence: 5, verificationCode: 'P' },
                    'pc_cable': { itemCode: '4YB013255', name: 'Power & Communication Cable', cssSelector: '.power-cable', index: 6, sequence: 6, verificationCode: 'J' }
                },
                sensors: {
                    barcodes: {
                        1: "R22J200177", 2: "R22J102367", 3: "R22J102368", 4: "R22J102440", 5: "R22J102371", 6: "R22J102389", 7: "R22J102390", 8: "R22J102391",
                        9: "R22J102392", 10: "R22J102393", 11: "R22J102394", 12: "R22J102395", 13: "R22J102396", 14: "R22J102397", 15: "R22J102398", 16: "R22J102399",
                        17: "R22J102400", 18: "R22J102401", 19: "R22J102402", 20: "R22J102403", 21: "R22J102404", 22: "R22J102405", 23: "R22J102406"
                    },
                    itemCodes: {
                        special: { itemCode: '5YB013255', sensors: [1, 16] },
                        standard: { itemCode: '5YB013254', sensors: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,23] }
                    },
                    verificationCodes: {
                        group1: { code: "1", sensors: [1,2,3,4,5,6,7,8,9,10,11,12] },
                        group2: { code: "2", sensors: [13,14,15,16,17,18,19,20,21,22] },
                        group3: { code: "", sensors: [23] }
                    }
                }
            },
            
            '5YB011100': {
                name: 'YBS Assembly - 5YB011100',
                subtitle: 'YBS Machine - 24 Duct Assembly',
                title: 'YBS Machine Circuit Board Layout',
                sensorCount: 24,
                components: {
                    'left_pcb': { itemCode: '4YB013250', name: 'Left Slave PCB', cssSelector: '.left-pcb', index: 1, sequence: 1, verificationCode: '24' },
                    'master_pcb': { itemCode: '4YB013248', name: 'Master PCB', cssSelector: '.master-pcb', index: 2, sequence: 2, verificationCode: '25' },
                    'right_pcb': { itemCode: '4YB013251', name: 'Right Slave PCB', cssSelector: '.right-pcb', index: 3, sequence: 3, verificationCode: '3Q4' },
                    'b2b_left_master': { itemCode: '4YB013258', name: 'Board-to-Board (Left to Master)', cssSelector: '.board-to-board', index: 4, sequence: 4, verificationCode: 'O' },
                    'b2b_master_right': { itemCode: '4YB013258', name: 'Board-to-Board (Master to Right)', cssSelector: '.board-to-board', index: 5, sequence: 5, verificationCode: 'P' },
                    'pc_cable': { itemCode: '4YB013255', name: 'Power & Communication Cable', cssSelector: '.power-cable', index: 6, sequence: 6, verificationCode: 'J' }
                },
                sensors: {
                    barcodes: {
                        1: "R22J200177", 2: "R22J102367", 3: "R22J102368", 4: "R22J102440", 5: "R22J102371", 6: "R22J102389", 7: "R22J102390", 8: "R22J102391",
                        9: "R22J102392", 10: "R22J102393", 11: "R22J102394", 12: "R22J102395", 13: "R22J102396", 14: "R22J102397", 15: "R22J102398", 16: "R22J102399",
                        17: "R22J102400", 18: "R22J102401", 19: "R22J102402", 20: "R22J102403", 21: "R22J102404", 22: "R22J102405", 23: "R22J102406", 24: "R22J102407"
                    },
                    itemCodes: {
                        special: { itemCode: '5YB013255', sensors: [1, 16, 24] },
                        standard: { itemCode: '5YB013254', sensors: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,23] }
                    },
                    verificationCodes: {
                        group1: { code: "1", sensors: [1,2,3,4,5,6,7,8,9,10,11,12] },
                        group2: { code: "2", sensors: [13,14,15,16,17,18,19,20,21,22,23] },
                        group3: { code: "", sensors: [24] }
                    }
                }
            },
            
            '5YB011101': {
                name: 'YBS Assembly - 5YB011101',
                subtitle: 'YBS Machine - 25 Duct Assembly',
                title: 'YBS Machine Circuit Board Layout',
                sensorCount: 25,
                components: {
                    'left_pcb': { itemCode: '4YB013250', name: 'Left Slave PCB', cssSelector: '.left-pcb', index: 1, sequence: 1, verificationCode: '24' },
                    'master_pcb': { itemCode: '4YB013248', name: 'Master PCB', cssSelector: '.master-pcb', index: 2, sequence: 2, verificationCode: '25' },
                    'right_pcb': { itemCode: '4YB013251', name: 'Right Slave PCB', cssSelector: '.right-pcb', index: 3, sequence: 3, verificationCode: '3Q4' },
                    'b2b_left_master': { itemCode: '4YB013258', name: 'Board-to-Board (Left to Master)', cssSelector: '.board-to-board', index: 4, sequence: 4, verificationCode: 'O' },
                    'b2b_master_right': { itemCode: '4YB013258', name: 'Board-to-Board (Master to Right)', cssSelector: '.board-to-board', index: 5, sequence: 5, verificationCode: 'P' },
                    'pc_cable': { itemCode: '4YB013255', name: 'Power & Communication Cable', cssSelector: '.power-cable', index: 6, sequence: 6, verificationCode: 'J' }
                },
                sensors: {
                    barcodes: {
                        1: "R22J200177", 2: "R22J102367", 3: "R22J102368", 4: "R22J102440", 5: "R22J102371", 6: "R22J102389", 7: "R22J102390", 8: "R22J102391",
                        9: "R22J102392", 10: "R22J102393", 11: "R22J102394", 12: "R22J102395", 13: "R22J102396", 14: "R22J102397", 15: "R22J102398", 16: "R22J102399",
                        17: "R22J102400", 18: "R22J102401", 19: "R22J102402", 20: "R22J102403", 21: "R22J102404", 22: "R22J102405", 23: "R22J102406", 24: "R22J102407", 25: "R22J102408"
                    },
                    itemCodes: {
                        special: { itemCode: '5YB013255', sensors: [1, 16, 25] },
                        standard: { itemCode: '5YB013254', sensors: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,23,24] }
                    },
                    verificationCodes: {
                        group1: { code: "1", sensors: [1,2,3,4,5,6,7,8,9,10,11,12,13] },
                        group2: { code: "2", sensors: [14,15,16,17,18,19,20,21,22,23,24] },
                        group3: { code: "", sensors: [25] }
                    }
                }
            },
            
            '5YB011111': {
                name: 'YBS Assembly - 5YB011111',
                subtitle: 'YBS Machine - 23 Duct Assembly',
                title: 'YBS Machine Circuit Board Layout',
                sensorCount: 23,
                components: {
                    'left_pcb': { itemCode: '4YB013250', name: 'Left Slave PCB', cssSelector: '.left-pcb', index: 1, sequence: 1, verificationCode: '24' },
                    'master_pcb': { itemCode: '4YB013248', name: 'Master PCB', cssSelector: '.master-pcb', index: 2, sequence: 2, verificationCode: '25' },
                    'right_pcb': { itemCode: '4YB013251', name: 'Right Slave PCB', cssSelector: '.right-pcb', index: 3, sequence: 3, verificationCode: '3Q4' },
                    'b2b_left_master': { itemCode: '4YB013258', name: 'Board-to-Board (Left to Master)', cssSelector: '.board-to-board', index: 4, sequence: 4, verificationCode: 'O' },
                    'b2b_master_right': { itemCode: '4YB013258', name: 'Board-to-Board (Master to Right)', cssSelector: '.board-to-board', index: 5, sequence: 5, verificationCode: 'P' },
                    'pc_cable': { itemCode: '4YB013255', name: 'Power & Communication Cable', cssSelector: '.power-cable', index: 6, sequence: 6, verificationCode: 'J' }
                },
                sensors: {
                    barcodes: {
                        1: "R22J200177", 2: "R22J102367", 3: "R22J102368", 4: "R22J102440", 5: "R22J102371", 6: "R22J102389", 7: "R22J102390", 8: "R22J102391",
                        9: "R22J102392", 10: "R22J102393", 11: "R22J102394", 12: "R22J102395", 13: "R22J102396", 14: "R22J102397", 15: "R22J102398", 16: "R22J102399",
                        17: "R22J102400", 18: "R22J102401", 19: "R22J102402", 20: "R22J102403", 21: "R22J102404", 22: "R22J102405", 23: "R22J102406"
                    },
                    itemCodes: {
                        special: { itemCode: '5YB013255', sensors: [1, 16] },
                        standard: { itemCode: '5YB013254', sensors: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,23] }
                    },
                    verificationCodes: {
                        group1: { code: "1", sensors: [1,2,3,4,5,6,7,8,9,10,11,12] },
                        group2: { code: "2", sensors: [13,14,15,16,17,18,19,20,21,22] },
                        group3: { code: "", sensors: [23] }
                    }
                }
            },
            
            '5YB011112': {
                name: 'YBS Assembly - 5YB011112',
                subtitle: 'YBS Machine - 24 Duct Assembly',
                title: 'YBS Machine Circuit Board Layout',
                sensorCount: 24,
                components: {
                    'left_pcb': { itemCode: '4YB013250', name: 'Left Slave PCB', cssSelector: '.left-pcb', index: 1, sequence: 1, verificationCode: '24' },
                    'master_pcb': { itemCode: '4YB013248', name: 'Master PCB', cssSelector: '.master-pcb', index: 2, sequence: 2, verificationCode: '25' },
                    'right_pcb': { itemCode: '4YB013251', name: 'Right Slave PCB', cssSelector: '.right-pcb', index: 3, sequence: 3, verificationCode: '3Q4' },
                    'b2b_left_master': { itemCode: '4YB013258', name: 'Board-to-Board (Left to Master)', cssSelector: '.board-to-board', index: 4, sequence: 4, verificationCode: 'O' },
                    'b2b_master_right': { itemCode: '4YB013258', name: 'Board-to-Board (Master to Right)', cssSelector: '.board-to-board', index: 5, sequence: 5, verificationCode: 'P' },
                    'pc_cable': { itemCode: '4YB013255', name: 'Power & Communication Cable', cssSelector: '.power-cable', index: 6, sequence: 6, verificationCode: 'J' }
                },
                sensors: {
                    barcodes: {
                        1: "R22J200177", 2: "R22J102367", 3: "R22J102368", 4: "R22J102440", 5: "R22J102371", 6: "R22J102389", 7: "R22J102390", 8: "R22J102391",
                        9: "R22J102392", 10: "R22J102393", 11: "R22J102394", 12: "R22J102395", 13: "R22J102396", 14: "R22J102397", 15: "R22J102398", 16: "R22J102399",
                        17: "R22J102400", 18: "R22J102401", 19: "R22J102402", 20: "R22J102403", 21: "R22J102404", 22: "R22J102405", 23: "R22J102406", 24: "R22J102407"
                    },
                    itemCodes: {
                        special: { itemCode: '5YB013255', sensors: [1, 16, 24] },
                        standard: { itemCode: '5YB013254', sensors: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,23] }
                    },
                    verificationCodes: {
                        group1: { code: "1", sensors: [1,2,3,4,5,6,7,8,9,10,11,12] },
                        group2: { code: "2", sensors: [13,14,15,16,17,18,19,20,21,22,23] },
                        group3: { code: "", sensors: [24] }
                    }
                }
            },
            
            '5YB011113': {
                name: 'YBS Assembly - 5YB011113',
                subtitle: 'YBS Machine - 25 Duct Assembly',
                title: 'YBS Machine Circuit Board Layout',
                sensorCount: 25,
                components: {
                    'left_pcb': { itemCode: '4YB013250', name: 'Left Slave PCB', cssSelector: '.left-pcb', index: 1, sequence: 1, verificationCode: '24' },
                    'master_pcb': { itemCode: '4YB013248', name: 'Master PCB', cssSelector: '.master-pcb', index: 2, sequence: 2, verificationCode: '25' },
                    'right_pcb': { itemCode: '4YB013251', name: 'Right Slave PCB', cssSelector: '.right-pcb', index: 3, sequence: 3, verificationCode: '3Q4' },
                    'b2b_left_master': { itemCode: '4YB013258', name: 'Board-to-Board (Left to Master)', cssSelector: '.board-to-board', index: 4, sequence: 4, verificationCode: 'O' },
                    'b2b_master_right': { itemCode: '4YB013258', name: 'Board-to-Board (Master to Right)', cssSelector: '.board-to-board', index: 5, sequence: 5, verificationCode: 'P' },
                    'pc_cable': { itemCode: '4YB013255', name: 'Power & Communication Cable', cssSelector: '.power-cable', index: 6, sequence: 6, verificationCode: 'J' }
                },
                sensors: {
                    barcodes: {
                        1: "R22J200177", 2: "R22J102367", 3: "R22J102368", 4: "R22J102440", 5: "R22J102371", 6: "R22J102389", 7: "R22J102390", 8: "R22J102391",
                        9: "R22J102392", 10: "R22J102393", 11: "R22J102394", 12: "R22J102395", 13: "R22J102396", 14: "R22J102397", 15: "R22J102398", 16: "R22J102399",
                        17: "R22J102400", 18: "R22J102401", 19: "R22J102402", 20: "R22J102403", 21: "R22J102404", 22: "R22J102405", 23: "R22J102406", 24: "R22J102407", 25: "R22J102408"
                    },
                    itemCodes: {
                        special: { itemCode: '5YB013255', sensors: [1, 16, 25] },
                        standard: { itemCode: '5YB013254', sensors: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,23,24] }
                    },
                    verificationCodes: {
                        group1: { code: "1", sensors: [1,2,3,4,5,6,7,8,9,10,11,12,13] },
                        group2: { code: "2", sensors: [14,15,16,17,18,19,20,21,22,23,24] },
                        group3: { code: "", sensors: [25] }
                    }
                }
            },
            
            '5YB011446': {
                name: 'YBS Assembly - 5YB011446',
                subtitle: 'YBS Machine - 23 Duct Assembly',
                title: 'YBS Machine Circuit Board Layout',
                sensorCount: 23,
                components: {
                    'left_pcb': { itemCode: '4YB013250', name: 'Left Slave PCB', cssSelector: '.left-pcb', index: 1, sequence: 1, verificationCode: '24' },
                    'master_pcb': { itemCode: '4YB013248', name: 'Master PCB', cssSelector: '.master-pcb', index: 2, sequence: 2, verificationCode: '25' },
                    'right_pcb': { itemCode: '4YB013251', name: 'Right Slave PCB', cssSelector: '.right-pcb', index: 3, sequence: 3, verificationCode: '3Q4' },
                    'b2b_left_master': { itemCode: '4YB013258', name: 'Board-to-Board (Left to Master)', cssSelector: '.board-to-board', index: 4, sequence: 4, verificationCode: 'O' },
                    'b2b_master_right': { itemCode: '4YB013258', name: 'Board-to-Board (Master to Right)', cssSelector: '.board-to-board', index: 5, sequence: 5, verificationCode: 'P' },
                    'pc_cable': { itemCode: '4YB013255', name: 'Power & Communication Cable', cssSelector: '.power-cable', index: 6, sequence: 6, verificationCode: 'J' }
                },
                sensors: {
                    barcodes: {
                        1: "R22J200177", 2: "R22J102367", 3: "R22J102368", 4: "R22J102440", 5: "R22J102371", 6: "R22J102389", 7: "R22J102390", 8: "R22J102391",
                        9: "R22J102392", 10: "R22J102393", 11: "R22J102394", 12: "R22J102395", 13: "R22J102396", 14: "R22J102397", 15: "R22J102398", 16: "R22J102399",
                        17: "R22J102400", 18: "R22J102401", 19: "R22J102402", 20: "R22J102403", 21: "R22J102404", 22: "R22J102405", 23: "R22J102406"
                    },
                    itemCodes: {
                        special: { itemCode: '5YB013255', sensors: [1, 16] },
                        standard: { itemCode: '5YB013254', sensors: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,23] }
                    },
                    verificationCodes: {
                        group1: { code: "1", sensors: [1,2,3,4,5,6,7,8,9,10,11,12] },
                        group2: { code: "2", sensors: [13,14,15,16,17,18,19,20,21,22] },
                        group3: { code: "", sensors: [23] }
                    }
                }
            },
              '5YB011447': {
                name: 'YBS Assembly - 5YB011447',
                subtitle: 'YBS Machine - 24 Duct Assembly',
                title: 'YBS Machine Circuit Board Layout',
                sensorCount: 24,
                components: {
                    'left_pcb': { itemCode: '4YB013250', name: 'Left Slave PCB', cssSelector: '.left-pcb', index: 1, sequence: 1, verificationCode: 'L' },
                    'master_pcb': { itemCode: '4YB013308', name: 'Master PCB', cssSelector: '.master-pcb', index: 2, sequence: 2, verificationCode: '09' },
                    'right_pcb': { itemCode: '4YB013271', name: 'Right Slave PCB', cssSelector: '.right-pcb', index: 3, sequence: 3, verificationCode: 'S' },
                    'b2b_left_master': { itemCode: '4YB013323', name: 'Board-to-Board (Left to Master)', cssSelector: '.board-to-board', index: 4, sequence: 4, verificationCode: '0V' },
                    'b2b_master_right': { itemCode: '4YB013323', name: 'Board-to-Board (Master to Right)', cssSelector: '.board-to-board', index: 5, sequence: 5, verificationCode: '0V' },
                    'pc_cable': { itemCode: '4YB013318', name: 'Power & Communication Cable', cssSelector: '.power-cable', index: 6, sequence: 6, verificationCode: '0Q' }
                },
                sensors: {
                    barcodes: {
                        1: "R22J200177", 2: "R22J102367", 3: "R22J102368", 4: "R22J102440", 5: "R22J102371", 6: "R22J102389", 7: "R22J102390", 8: "R22J102391",
                        9: "R22J102392", 10: "R22J102393", 11: "R22J102394", 12: "R22J102395", 13: "R22J102396", 14: "R22J102397", 15: "R22J102398", 16: "R22J102399",                        17: "R22J102400", 18: "R22J102401", 19: "R22J102402", 20: "R22J102403", 21: "R22J102404", 22: "R22J102405", 23: "R22J102406", 24: "R22J102407"
                    },
                    itemCodes: {
                        special: { itemCode: '5YB013286', sensors: [1, 16] },
                        standard: { itemCode: '5YB013285', sensors: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,23,24] }
                    },
                    verificationCodes: {
                        group1: { code: "S8", sensors: [1, 16] },
                        group2: { code: "S3", sensors: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,23,24] }
                    }
                }
            },
            
            '5YB011448': {
                name: 'YBS Assembly - 5YB011448',
                subtitle: 'YBS Machine - 25 Duct Assembly',
                title: 'YBS Machine Circuit Board Layout',
                sensorCount: 25,
                components: {
                    'left_pcb': { itemCode: '4YB013250', name: 'Left Slave PCB', cssSelector: '.left-pcb', index: 1, sequence: 1, verificationCode: '24' },
                    'master_pcb': { itemCode: '4YB013248', name: 'Master PCB', cssSelector: '.master-pcb', index: 2, sequence: 2, verificationCode: '25' },
                    'right_pcb': { itemCode: '4YB013251', name: 'Right Slave PCB', cssSelector: '.right-pcb', index: 3, sequence: 3, verificationCode: '3Q4' },
                    'b2b_left_master': { itemCode: '4YB013258', name: 'Board-to-Board (Left to Master)', cssSelector: '.board-to-board', index: 4, sequence: 4, verificationCode: 'O' },
                    'b2b_master_right': { itemCode: '4YB013258', name: 'Board-to-Board (Master to Right)', cssSelector: '.board-to-board', index: 5, sequence: 5, verificationCode: 'P' },
                    'pc_cable': { itemCode: '4YB013255', name: 'Power & Communication Cable', cssSelector: '.power-cable', index: 6, sequence: 6, verificationCode: 'J' }
                },
                sensors: {
                    barcodes: {
                        1: "R22J200177", 2: "R22J102367", 3: "R22J102368", 4: "R22J102440", 5: "R22J102371", 6: "R22J102389", 7: "R22J102390", 8: "R22J102391",
                        9: "R22J102392", 10: "R22J102393", 11: "R22J102394", 12: "R22J102395", 13: "R22J102396", 14: "R22J102397", 15: "R22J102398", 16: "R22J102399",
                        17: "R22J102400", 18: "R22J102401", 19: "R22J102402", 20: "R22J102403", 21: "R22J102404", 22: "R22J102405", 23: "R22J102406", 24: "R22J102407", 25: "R22J102408"
                    },
                    itemCodes: {
                        special: { itemCode: '5YB013255', sensors: [1, 16, 25] },
                        standard: { itemCode: '5YB013254', sensors: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,23,24] }
                    },
                    verificationCodes: {
                        group1: { code: "1", sensors: [1,2,3,4,5,6,7,8,9,10,11,12,13] },
                        group2: { code: "2", sensors: [14,15,16,17,18,19,20,21,22,23,24] },
                        group3: { code: "", sensors: [25] }
                    }
                }
            }
        };
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    /**
     * Initialize the assembly manager
     */
    async initialize() {
        console.log('🚀 Initializing YBS Assembly Manager...');
        
        try {
            // Wait for backend manager to be available
            if (typeof YBSBackendManager !== 'undefined') {
                this.backendManager = new YBSBackendManager(this.API_URL);
            } else {
                console.warn('YBS Backend Manager not found, some features may not work');
            }
            
            // Detect YBS type from URL or filename
            this.currentYBSType = this.detectYBSType();
            console.log(`🔍 Detected YBS Type: ${this.currentYBSType}`);
            
            if (!this.currentYBSType) {
                this.showError('Unable to detect YBS assembly type from URL');
                return;
            }
            
            // Initialize UI elements
            this.initializeUIElements();
            
            // Setup component mapping
            this.setupComponentMapping();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup visual interactions
            this.setupInteractionEffects();
            
            // Load assembly state or create new one
            await this.loadOrCreateAssembly();
            
            // Initialize API connection
            await this.initializeAPI();
            
            console.log('✅ YBS Assembly Manager initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing YBS Assembly Manager:', error);
            this.showError(`Initialization failed: ${error.message}`);
        }
    }    /**
     * Detect YBS type from URL or filename with improved detection
     */
    detectYBSType() {
        // First try URL path
        const path = window.location.pathname;
        const match = path.match(/\/YBS\/([^\/]+)\.html/);
        
        if (match && match[1]) {
            const ybsType = match[1].replace('_refactored', '');
            // Return the detected type even if not configured - we'll handle it in setupComponentMapping
            return ybsType;
        }
        
        // Try document title
        const title = document.title;
        for (const type of Object.keys(this.ybsConfigurations)) {
            if (title.includes(type)) {
                return type;
            }
        }
        
        // Try part-id element
        const partIdElement = document.querySelector('.part-id');
        if (partIdElement) {
            const partId = partIdElement.textContent.trim();
            // Return the detected part ID even if not configured
            return partId;
        }
        
        // Last resort - check for any 5YB pattern in the URL or title
        const ybsPattern = /5YB\d{6}/;
        const urlMatch = path.match(ybsPattern);
        if (urlMatch) {
            return urlMatch[0];
        }
        
        const titleMatch = title.match(ybsPattern);
        if (titleMatch) {
            return titleMatch[0];
        }
        
        // Default fallback only if nothing is detected
        return Object.keys(this.ybsConfigurations)[0] || '5YB011056';
    }/**
     * Initialize UI elements
     */
    initializeUIElements() {
        this.uiElements = {
            barcodeInput: document.getElementById('barcodeInput'),
            scanButton: document.getElementById('scanButton'),
            completeButton: document.getElementById('completeButton'),
            restartButton: document.getElementById('restartButton'),
            progressFill: document.getElementById('progressFill'),
            progressPercentage: document.getElementById('progressPercentage'),
            logsContent: document.getElementById('logsContent'),
            notification: document.getElementById('notification'),
            tooltip: document.getElementById('tooltip'),
            mainContainer: document.getElementById('mainContainer'),
            // Board-to-board title element (supports multiple possible IDs)
            boardToBoardTitle: document.getElementById('scanningTitle') || 
                              document.getElementById('scanning-status-title') || 
                              document.getElementById('scanningStatusTitle') || 
                              document.getElementById('scanningInstructions') ||
                              document.querySelector('.board-to-board-title')
        };

        // Focus barcode input
        if (this.uiElements.barcodeInput) {
            this.uiElements.barcodeInput.focus();
        }
    }    /**
     * Setup component mapping for the current YBS type
     */
    setupComponentMapping() {
        const config = this.ybsConfigurations[this.currentYBSType];
        
        if (!config) {
            console.warn(`⚠️ YBS Type '${this.currentYBSType}' not configured, using dynamic detection`);
            this.setupDynamicConfiguration();
            return;
        }
        
        console.log(`✅ Using configured settings for ${this.currentYBSType}`);
        console.log(`📊 Sensor count: ${config.sensorCount}`);
        
        this.componentMapping = {};
        
        // Map components
        if (config.components) {
            Object.entries(config.components).forEach(([key, component]) => {
                const element = document.querySelector(component.cssSelector);
                if (element) {
                    // For components with multiple elements, handle by index
                    const elements = document.querySelectorAll(component.cssSelector);
                    const targetElement = elements[component.index] || element;
                    
                    this.componentMapping[key] = {
                        ...component,
                        element: targetElement,
                        scanned: false,
                        scannedBarcode: null,
                        scanTime: null,
                        type: 'component'
                    };
                }
            });
        }

        // Setup sensors
        if (config.sensors) {
            const sensorCells = document.querySelectorAll('.sensor-cell');
            console.log(`📱 Found ${sensorCells.length} sensor cells in DOM`);
        }
        
        console.log(`📦 Mapped ${Object.keys(this.componentMapping).length} components`);
    }
    
    /**
     * Setup dynamic configuration for unconfigured YBS types
     */
    setupDynamicConfiguration() {
        console.log(`🔧 Setting up dynamic configuration for ${this.currentYBSType}`);
        
        // Count sensors dynamically from HTML
        const sensorElements = document.querySelectorAll('[data-sensor-id]');
        const sensorCount = sensorElements.length;
        
        console.log(`📊 Detected ${sensorCount} sensors in HTML`);
        
        // Create a basic configuration
        const dynamicConfig = {
            name: `YBS Assembly - ${this.currentYBSType}`,
            subtitle: `YBS Machine - ${sensorCount} Duct Assembly`,
            title: 'YBS Machine Circuit Board Layout',
            sensorCount: sensorCount,
            components: {
                'left_pcb': { itemCode: '4YB013250', name: 'Left Slave PCB', cssSelector: '.left-pcb', index: 1, sequence: 1, verificationCode: '24' },
                'master_pcb': { itemCode: '4YB013248', name: 'Master PCB', cssSelector: '.master-pcb', index: 2, sequence: 2, verificationCode: '25' },
                'right_pcb': { itemCode: '4YB013251', name: 'Right Slave PCB', cssSelector: '.right-pcb', index: 3, sequence: 3, verificationCode: '3Q4' },
                'b2b_left_master': { itemCode: '4YB013258', name: 'Board-to-Board (Left to Master)', cssSelector: '.board-to-board', index: 4, sequence: 4, verificationCode: 'O' },
                'b2b_master_right': { itemCode: '4YB013258', name: 'Board-to-Board (Master to Right)', cssSelector: '.board-to-board', index: 5, sequence: 5, verificationCode: 'P' },
                'pc_cable': { itemCode: '4YB013255', name: 'Power & Communication Cable', cssSelector: '.power-cable', index: 6, sequence: 6, verificationCode: 'J' }
            },
            sensors: {
                barcodes: this.generateDynamicSensorBarcodes(sensorCount),
                itemCodes: this.generateDynamicItemCodes(sensorCount),
                verificationCodes: this.generateDynamicVerificationCodes(sensorCount)
            }
        };
        
        // Add to configurations and setup mapping
        this.ybsConfigurations[this.currentYBSType] = dynamicConfig;
        
        console.log(`✅ Dynamic configuration created for ${this.currentYBSType} with ${sensorCount} sensors`);
        
        // Now setup component mapping with the new config
        this.componentMapping = {};
        
        // Map components
        Object.entries(dynamicConfig.components).forEach(([key, component]) => {
            const element = document.querySelector(component.cssSelector);
            if (element) {
                // For components with multiple elements, handle by index
                const elements = document.querySelectorAll(component.cssSelector);
                const targetElement = elements[component.index] || element;
                
                this.componentMapping[key] = {
                    ...component,
                    element: targetElement,
                    scanned: false,
                    scannedBarcode: null,
                    scanTime: null,
                    type: 'component'
                };
            }
        });
        
        console.log(`📦 Mapped ${Object.keys(this.componentMapping).length} components for ${this.currentYBSType}`);
    }
    
    /**
     * Generate dynamic sensor barcodes for unconfigured YBS types
     */
    generateDynamicSensorBarcodes(sensorCount) {
        const barcodes = {};
        const baseBarcodes = [
            "R22J200177", "R22J102367", "R22J102368", "R22J102440", "R22J102371", "R22J102389", "R22J102390", "R22J102391",
            "R22J102392", "R22J102393", "R22J102394", "R22J102395", "R22J102396", "R22J102397", "R22J102398", "R22J102399",
            "R22J102400", "R22J102401", "R22J102402", "R22J102403", "R22J102404", "R22J102405", "R22J102406", "R22J102407", "R22J102408"
        ];
        
        for (let i = 1; i <= sensorCount; i++) {
            barcodes[i] = baseBarcodes[i - 1] || `R22J10240${i}`;
        }
        
        return barcodes;
    }
    
    /**
     * Generate dynamic item codes for unconfigured YBS types
     */
    generateDynamicItemCodes(sensorCount) {
        const specialSensors = [1, 16];
        if (sensorCount >= 24) specialSensors.push(sensorCount); // Last sensor is usually special
        
        const standardSensors = [];
        for (let i = 1; i <= sensorCount; i++) {
            if (!specialSensors.includes(i)) {
                standardSensors.push(i);
            }
        }
        
        return {
            special: { itemCode: '5YB013255', sensors: specialSensors },
            standard: { itemCode: '5YB013254', sensors: standardSensors }
        };
    }
    
    /**
     * Generate dynamic verification codes for unconfigured YBS types
     */
    generateDynamicVerificationCodes(sensorCount) {
        const group1Sensors = [];
        const group2Sensors = [];
        const group3Sensors = [];
        
        // Group 1: sensors 1-12 (or half of total sensors)
        const halfPoint = Math.ceil(sensorCount / 2);
        for (let i = 1; i <= Math.min(12, halfPoint); i++) {
            group1Sensors.push(i);
        }
        
        // Group 2: middle sensors
        for (let i = group1Sensors.length + 1; i < sensorCount; i++) {
            group2Sensors.push(i);
        }
        
        // Group 3: last sensor (no verification code)
        if (sensorCount > 0) {
            group3Sensors.push(sensorCount);
        }
          return {
            group1: { code: "1", sensors: group1Sensors },
            group2: { code: "2", sensors: group2Sensors },
            group3: { code: "", sensors: group3Sensors }
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Scan button
        if (this.uiElements.scanButton) {
            this.uiElements.scanButton.addEventListener('click', () => this.handleScan());
        }

        // Barcode input
        if (this.uiElements.barcodeInput) {
            this.uiElements.barcodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleScan();
                }
            });
        }

        // Complete button
        if (this.uiElements.completeButton) {
            this.uiElements.completeButton.addEventListener('click', () => this.completeAssembly());
        }

        // Restart button
        if (this.uiElements.restartButton) {
            this.uiElements.restartButton.addEventListener('click', () => this.restartAssembly());
        }
    }

    /**
     * Setup interaction effects (tooltips, hover, etc.)
     */
    setupInteractionEffects() {
        const cells = document.querySelectorAll('.cell');
        
        cells.forEach(cell => {
            // Tooltip on hover
            cell.addEventListener('mouseenter', (e) => {
                const tooltipText = cell.getAttribute('data-tooltip');
                if (tooltipText && this.uiElements.tooltip) {
                    this.showTooltip(tooltipText, e.target);
                }
            });

            cell.addEventListener('mouseleave', () => {
                if (this.uiElements.tooltip) {
                    this.hideTooltip();
                }
            });
        });
    }

    /**
     * Show tooltip
     */
    showTooltip(text, element) {
        if (!this.uiElements.tooltip) return;
        
        this.uiElements.tooltip.textContent = text;
        this.uiElements.tooltip.classList.add('show');
        
        const rect = element.getBoundingClientRect();
        this.uiElements.tooltip.style.left = rect.left + (rect.width / 2) - (this.uiElements.tooltip.offsetWidth / 2) + 'px';
        this.uiElements.tooltip.style.top = rect.bottom + 10 + 'px';
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        if (this.uiElements.tooltip) {
            this.uiElements.tooltip.classList.remove('show');
        }
    }

    /**
     * Handle barcode scanning
     */
    async handleScan() {
        const barcode = this.uiElements.barcodeInput?.value?.trim();
        if (!barcode) return;

        try {
            const success = await this.verifyBarcode(barcode);
            if (success) {
                this.uiElements.barcodeInput.value = '';
                this.uiElements.barcodeInput.focus();
            }
        } catch (error) {
            console.error('Error during scan:', error);
            this.showNotification(`Scan error: ${error.message}`, 'error');
        }
    }    /**
     * Verify scanned barcode
     */
    async verifyBarcode(barcode) {
        // Check if inventory data is loaded
        if (!this.inventoryDataLoaded) {
            this.updateBoardToBoardTitle('⚠️ Loading component data, please wait...', 'warning');
            this.showNotification('Please wait for component data to load before scanning', 'warning');
            this.addLogEntry('⚠️ Scanning attempted before inventory data loaded', 'warning');
            return false;
        }
        
        // Check for duplicate
        if (this.scannedBarcodes.has(barcode)) {
            this.updateBoardToBoardTitle('⚠️ Duplicate barcode detected', 'warning');
            this.showNotification('Duplicate barcode! This code was already used.', 'error');
            this.addLogEntry(`Error: Duplicate barcode ${barcode}`, 'error');
            return false;
        }

        // Component scanning phase (1-6)
        if (this.currentSensorIndex <= 6) {
            return await this.scanComponent(barcode);
        }
        
        // Sensor scanning phase (7-29)
        return await this.scanSensor(barcode);
    }

    /**
     * Scan component
     */
    async scanComponent(barcode) {
        const nextComponent = this.getNextComponent();
        if (!nextComponent) {
            this.showNotification('No component to scan', 'error');
            return false;
        }        // Verify barcode matches expected component
        console.log('🔍 DEBUG - About to verify component barcode:');
        console.log('   Component:', nextComponent.name);
        console.log('   Component data:', {
            scanningCode: nextComponent.scanningCode,
            itemCode: nextComponent.itemCode,
            verificationCode: nextComponent.verificationCode
        });
        console.log('   Scanned barcode:', barcode);
        console.log('   Calling verifyComponentBarcode...');
        
        const verificationResult = this.verifyComponentBarcode(barcode, nextComponent);
        console.log('   Verification result:', verificationResult);
        
        if (!verificationResult) {
            this.updateBoardToBoardTitle(`❌ Invalid barcode for ${nextComponent.name}`, 'error');
            this.showNotification(`Wrong component! Expected ${nextComponent.name}`, 'error');
            this.addLogEntry(`Error: Expected ${nextComponent.name}, got ${barcode}`, 'error');
            this.flashError(nextComponent.element);
            return false;
        }

        // Mark component as scanned
        nextComponent.scanned = true;
        nextComponent.scannedBarcode = barcode;
        nextComponent.scanTime = new Date().toISOString();
        nextComponent.element.style.backgroundColor = 'var(--status-success)';
        
        // Add to scanned list
        this.scannedBarcodes.add(barcode);
        this.scannedSensors.push({
            sensorId: `component_${nextComponent.index}`,
            barcode: barcode,
            timestamp: new Date(),
            status: 'success',
            componentName: nextComponent.name
        });

        // Save progress
        await this.saveCurrentScan({
            sensorId: nextComponent.index,
            barcode: barcode
        });

        // Update progress
        this.currentSensorIndex++;
        await this.updateCurrentSensorIndex();
        this.updateProgress();        // Show success
        this.updateBoardToBoardTitle(`✅ ${nextComponent.name} scanned successfully`, 'success');
        this.showNotification(`${nextComponent.name} verified successfully!`, 'success');
        
        // Enhanced logging with item code details
        const componentDetails = this.getComponentDetails(nextComponent);
        let logMessage = `${nextComponent.name} verified: ${barcode}`;
        if (componentDetails.itemCode) {
            logMessage += ` (Item: ${componentDetails.itemCode})`;
        }
        if (componentDetails.scanningCode) {
            logMessage += ` [Expected: ${componentDetails.scanningCode}]`;
        }
        this.addLogEntry(logMessage, 'success');        // Check if we've completed all components and should move to sensors
        // FIXED: Proper component completion logic
        const completedComponents = Object.values(this.componentMapping).filter(c => c.scanned).length;
        const totalComponents = Object.keys(this.componentMapping).length;
        
        console.log(`📦 Component progress: ${completedComponents}/${totalComponents} completed`);
        
        // If all components are done, start sensors; otherwise, highlight next component
        if (completedComponents >= totalComponents && this.currentSensorIndex <= 6) {
            // All components done, move to sensor phase
            this.currentSensorIndex = 7; // Start sensors
            await this.updateCurrentSensorIndex();
            console.log(`✅ All ${totalComponents} components completed - moving to sensor scanning phase`);
        }
        
        // Highlight next item and update title
        this.highlightNextItem();
        
        // Update title for next scan
        setTimeout(() => {
            if (this.currentSensorIndex <= 6) {
                this.updateTitleForNextComponent();
            } else {
                this.updateTitleForNextSensor();
            }
        }, 1500); // Delay to show success message first

        return true;
    }

    /**
     * Scan sensor
     */
    async scanSensor(barcode) {
        const sensorId = this.currentSensorIndex - 6; // Convert to 1-23 range
        const config = this.ybsConfigurations[this.currentYBSType];
          if (!config.sensors || sensorId > config.sensorCount) {
            this.showNotification('All sensors completed', 'info');
            return false;
        }
        
        // ENHANCED VALIDATION: Check for duplicate sensor scanning
        const alreadyScannedSensor = this.scannedSensors.find(s => s.sensorId === sensorId);
        if (alreadyScannedSensor) {
            this.updateBoardToBoardTitle(`❌ Sensor already scanned`, 'error');
            this.showNotification(`Sensor #${sensorId} was already scanned!`, 'error');
            this.addLogEntry(`Error: Sensor #${sensorId} already scanned with barcode ${alreadyScannedSensor.barcode}`, 'error');
            return false;
        }
        
        // ENHANCED VALIDATION: Check for duplicate barcode scanning
        if (this.scannedBarcodes.has(barcode)) {
            this.updateBoardToBoardTitle(`❌ Barcode already used`, 'error');
            this.showNotification(`Barcode ${barcode} was already scanned!`, 'error');
            this.addLogEntry(`Error: Duplicate barcode ${barcode} - already used for another sensor`, 'error');
            return false;
        }
        
        console.log(`🔍 Scanning Sensor #${sensorId} with barcode: ${barcode}`);
        console.log(`📊 Current progress: ${this.scannedSensors.length}/${config.sensorCount} sensors completed`);// Verify sensor barcode
        if (!this.verifySensorBarcode(barcode, sensorId)) {
            this.updateBoardToBoardTitle(`❌ Invalid sensor barcode`, 'error');
            this.showNotification(`Wrong sensor! Expected Sensor #${sensorId}`, 'error');
            this.addLogEntry(`Error: Expected Sensor #${sensorId}, got ${barcode}`, 'error');
            this.flashSensorError(sensorId);
            return false;
        }

        // Mark sensor as scanned
        const sensorCell = document.querySelector(`[data-sensor-id="${sensorId}"]`);
        if (sensorCell) {
            sensorCell.classList.remove('next');
            sensorCell.classList.add('success');
        }

        // Add to scanned data
        this.scannedBarcodes.add(barcode);
        this.scannedSensors.push({
            sensorId: sensorId,
            barcode: barcode,
            timestamp: new Date(),
            status: 'success'
        });

        // Save progress
        await this.saveCurrentScan({
            sensorId: this.currentSensorIndex,
            barcode: barcode
        });

        // Update progress
        this.currentSensorIndex++;
        await this.updateCurrentSensorIndex();
        this.updateProgress();        // Show success
        this.updateBoardToBoardTitle(`✅ Sensor #${sensorId} scanned successfully`, 'success');
        this.showNotification(`Sensor #${sensorId} verified successfully!`, 'success');
        
        // Enhanced sensor logging with details
        const sensorDetails = this.getSensorDetails(sensorId);
        let logMessage = `Sensor #${sensorId} verified: ${barcode}`;
        if (sensorDetails.itemCode) {
            logMessage += ` (Item: ${sensorDetails.itemCode})`;
        }
        if (sensorDetails.sensorType) {
            logMessage += ` [Type: ${sensorDetails.sensorType}]`;
        }
        this.addLogEntry(logMessage, 'success');        // Check completion or highlight next
        // ENHANCED: Strict completion logic - require ALL components AND ALL sensors with validation
        const totalRequiredComponents = 6; // Always 6 components
        const totalRequiredSensors = config.sensorCount; // Sensor count from configuration
        const totalRequiredItems = totalRequiredComponents + totalRequiredSensors;
        
        // Count completed items with validation
        const completedComponents = Object.values(this.componentMapping).filter(c => c.scanned).length;
        const completedSensors = this.scannedSensors.filter(s => s.sensorId !== undefined).length;
        const completedItems = completedComponents + completedSensors;
        
        console.log(`🎯 STRICT Completion check: ${completedItems}/${totalRequiredItems} items completed`);
        console.log(`   - Components: ${completedComponents}/${totalRequiredComponents} (Required: ALL ${totalRequiredComponents})`);
        console.log(`   - Sensors: ${completedSensors}/${totalRequiredSensors} (Required: ALL ${totalRequiredSensors})`);
        
        // STRICT VALIDATION: Must have ALL components AND ALL sensors
        const allComponentsComplete = completedComponents === totalRequiredComponents;
        const allSensorsComplete = completedSensors === totalRequiredSensors;
        const allItemsComplete = completedItems === totalRequiredItems;
        
        console.log(`🔍 Completion validation:`);
        console.log(`   - All components complete: ${allComponentsComplete}`);
        console.log(`   - All sensors complete: ${allSensorsComplete}`);
        console.log(`   - Total items match: ${allItemsComplete}`);
        
        if (allComponentsComplete && allSensorsComplete && allItemsComplete) {
            console.log(`✅ STRICT VALIDATION PASSED: All ${totalRequiredItems} items completed - showing complete button`);
            console.log(`   📊 Final counts: ${completedComponents}/${totalRequiredComponents} components + ${completedSensors}/${totalRequiredSensors} sensors = ${completedItems}/${totalRequiredItems} total`);
            this.updateTitleForCompletion();
            this.showCompleteButton();
        } else {
            const remaining = totalRequiredItems - completedItems;
            console.log(`⏳ STRICT VALIDATION: ${remaining} items remaining before completion`);
            
            if (!allComponentsComplete) {
                const remainingComponents = totalRequiredComponents - completedComponents;
                console.log(`   🔸 ${remainingComponents} components still needed`);
            }
            
            if (!allSensorsComplete) {
                const remainingSensors = totalRequiredSensors - completedSensors;
                console.log(`   🔸 ${remainingSensors} sensors still needed`);
            }
            
            this.highlightNextItem();
            // Update title for next sensor
            setTimeout(() => {
                this.updateTitleForNextSensor();
            }, 1500); // Delay to show success message first
        }

        return true;
    }    /**
     * Verify component barcode
     */    verifyComponentBarcode(barcode, component) {
        const barcodeUpper = barcode.toUpperCase();
        let scanningCode = null;
        let verificationSource = '';
        
        console.log(`🔍 Verifying barcode "${barcode}" for ${component.name} (${component.itemCode})`);
        
        // Try to get scanning code from API data first
        if (component.scanningCode) {
            scanningCode = component.scanningCode.toUpperCase();
            verificationSource = 'API';
            console.log(`📋 Using API scanning code: "${scanningCode}"`);
        } else {
            // Fallback to static configuration's verificationCode
            if (component.verificationCode) {
                scanningCode = component.verificationCode.toUpperCase();
                verificationSource = 'Static Config';
                console.log(`📋 API data missing, using static verification code: "${scanningCode}"`);
            } else {
                console.warn(`⚠️ No scanning code available from API or static config for ${component.name}`);
                
                // Last resort: check if barcode matches itemCode exactly (legacy support)
                if (barcodeUpper === component.itemCode.toUpperCase()) {
                    console.log(`✅ Legacy fallback: barcode matches itemCode exactly`);
                    return true;
                }
                
                console.log(`❌ No valid verification method available`);
                return false;
            }
        }
        
        console.log(`🎯 Verification source: ${verificationSource}`);
        console.log(`🔍 Expected code: "${scanningCode}" | Barcode: "${barcode}"`);
        
        // Handle multi-character verification codes (like "25", "3Q4")
        if (scanningCode.length > 1) {
            // For multi-character codes, check if they appear anywhere in the barcode
            if (barcodeUpper.includes(scanningCode)) {
                console.log(`✅ Multi-character code "${scanningCode}" found in barcode`);
                return true;
            } else {
                console.log(`❌ Multi-character code "${scanningCode}" not found in barcode`);
                return false;
            }
        }
        
        // Single character verification - position-based validation at position 5
        if (barcodeUpper.length >= 5) {
            const char5 = barcodeUpper.charAt(4); // Position 5 (index 4)
            console.log(`🔍 Position validation: Expected "${scanningCode}" at position 5, found "${char5}"`);
            
            if (char5 === scanningCode) {
                console.log(`✅ Position validation passed`);
                return true;
            } else {
                console.log(`❌ Position validation failed`);
                
                // Additional diagnostic for debugging
                const occurrences = (barcodeUpper.match(new RegExp(scanningCode, 'g')) || []).length;
                if (occurrences > 0) {
                    console.log(`⚠️ Code "${scanningCode}" appears ${occurrences} times in barcode but not at position 5`);
                }
            }
        } else {
            console.log(`❌ Barcode too short (${barcodeUpper.length} chars) for position validation`);
        }
        
        // Final fallback: exact match for special cases
        if (barcodeUpper === scanningCode) {
            console.log(`✅ Exact match fallback passed`);
            return true;
        }
        
        console.log(`❌ All verification methods failed`);
        return false;
    }/**
     * Verify sensor barcode
     * ENHANCED: Better logging and validation for sensor verification
     */
    verifySensorBarcode(barcode, sensorId) {
        console.log(`🔍 Verifying sensor barcode: "${barcode}" for Sensor #${sensorId}`);
        
        // Try to get verification code from API data first (preferred method)
        const sensorDetails = this.getSensorDetails(sensorId);
        if (sensorDetails && sensorDetails.verificationCode) {
            // Use API-provided verification code
            const expectedCode = sensorDetails.verificationCode;
            
            console.log(`📋 API verification code for Sensor #${sensorId}: "${expectedCode}"`);
            console.log(`📋 Sensor details:`, sensorDetails);
            
            // Special handling for sensors that auto-pass (like sensor 23)
            if (expectedCode === "" || expectedCode === null) {
                console.log(`✅ Sensor #${sensorId} auto-passes (no verification code required)`);
                return true;
            }
            
            const extractedCode = this.extractVerificationCode(barcode, expectedCode);
            const isValid = extractedCode === expectedCode;
            
            console.log(`🎯 Verification result for Sensor #${sensorId}: ${isValid ? 'PASS' : 'FAIL'}`);
            console.log(`   Expected: "${expectedCode}", Extracted: "${extractedCode}"`);
            
            return isValid;
        }
        
        // Fallback to static configuration if API data not available
        const config = this.ybsConfigurations[this.currentYBSType];
        
        console.log(`⚠️ No API data for Sensor #${sensorId}, using static configuration`);
        
        // Find which verification group this sensor belongs to
        let expectedCode = "";
        let groupName = "";
        for (const [groupKey, group] of Object.entries(config.sensors.verificationCodes)) {
            if (group.sensors.includes(sensorId)) {
                expectedCode = group.code;
                groupName = groupKey;
                break;
            }
        }
        
        console.log(`📋 Static verification group for Sensor #${sensorId}: "${groupName}" with code "${expectedCode}"`);

        // Sensor 23 and others with no verification code (auto-passes)
        if (sensorId === 23 || expectedCode === "") {
            console.log(`✅ Sensor #${sensorId} auto-passes (static config: no verification code)`);
            return true;
        }

        const extractedCode = this.extractVerificationCode(barcode, expectedCode);
        const isValid = extractedCode === expectedCode;
        
        console.log(`🎯 Static verification result for Sensor #${sensorId}: ${isValid ? 'PASS' : 'FAIL'}`);
        console.log(`   Expected: "${expectedCode}", Extracted: "${extractedCode}"`);
        
        return isValid;
    }/**
     * Extract verification code from barcode
     * ENHANCED FIX: Strictly check ONLY position 5 for single-digit codes with better validation
     */
    extractVerificationCode(barcode, expectedCode) {
        if (!barcode || barcode.length < 5) {
            console.log(`⚠️ Barcode "${barcode}" too short (< 5 chars) for position-based validation`);
            return "";
        }
        
        // Special cases for multi-character codes
        if (expectedCode === "3Q4") {
            return barcode.includes("3Q4") ? "3Q4" : "";
        }
        
        if (expectedCode === "25") {
            return barcode.includes("25") ? "25" : "";
        }
        
        // For single-digit codes, check ONLY position 5 (index 4) - NO FALLBACKS OR MULTIPLE CHECKS
        if (expectedCode.length === 1) {
            // YBS standard: verification code MUST be at position 5 (index 4) exactly
            // CRITICAL FIX: Enhanced position validation with logging
            const char5 = barcode.charAt(4); // Character at position 5 (index 4)
            
            console.log(`🔍 Position validation: Expected "${expectedCode}" at position 5, found "${char5}" in barcode "${barcode}"`);
            
            // Check EXACT position match only
            if (char5 === expectedCode) {
                console.log(`✅ Position validation PASSED: Found "${expectedCode}" at position 5`);
                return expectedCode;
            } else {
                console.log(`❌ Position validation FAILED: Expected "${expectedCode}" at position 5, but found "${char5}"`);
                
                // Additional diagnostic: count occurrences to help debug the issue
                const occurrences = (barcode.match(new RegExp(expectedCode, 'g')) || []).length;
                if (occurrences > 1) {
                    console.log(`⚠️ DIAGNOSTIC: Code "${expectedCode}" appears ${occurrences} times in barcode - this may be causing confusion`);
                }
                
                return "";
            }
        } else if (expectedCode.length === 2) {
            // For two-digit codes, check if they appear in the barcode at valid positions
            return barcode.includes(expectedCode) ? expectedCode : "";
        }
        
        return "";
    }

    /**
     * Get next component to scan
     */
    getNextComponent() {
        const components = Object.values(this.componentMapping).filter(c => c.type === 'component');
        return components.find(c => !c.scanned && c.sequence === this.currentSensorIndex);
    }

    /**
     * Highlight next item to scan
     */
    highlightNextItem() {
        // Clear existing highlights
        document.querySelectorAll('.next').forEach(el => el.classList.remove('next'));

        if (this.currentSensorIndex <= 6) {
            // Highlight next component
            const nextComponent = this.getNextComponent();
            if (nextComponent?.element) {
                nextComponent.element.classList.add('next');
                this.addLogEntry(`Next: ${nextComponent.name}`, 'info');
            }
        } else {
            // Highlight next sensor
            const sensorId = this.currentSensorIndex - 6;
            const config = this.ybsConfigurations[this.currentYBSType];
            
            if (sensorId <= config.sensorCount) {
                const sensorCell = document.querySelector(`[data-sensor-id="${sensorId}"]`);
                if (sensorCell) {
                    sensorCell.classList.add('next');
                    this.addLogEntry(`Next: Sensor #${sensorId}`, 'info');
                }
            }
        }
    }

    /**
     * Flash error effect
     */
    flashError(element) {
        if (!element) return;
        
        const originalColor = element.style.backgroundColor;
        element.style.backgroundColor = 'var(--status-error)';
        setTimeout(() => {
            element.style.backgroundColor = originalColor;
        }, 1000);
    }

    /**
     * Flash sensor error
     */
    flashSensorError(sensorId) {
        const sensorCell = document.querySelector(`[data-sensor-id="${sensorId}"]`);
        if (sensorCell) {
            sensorCell.classList.add('error');
            setTimeout(() => {
                sensorCell.classList.remove('error');
            }, 1000);
        }
    }

    /**
     * Show complete button
     */
    showCompleteButton() {
        if (this.uiElements.completeButton) {
            this.uiElements.completeButton.classList.remove('hidden');
            this.uiElements.completeButton.disabled = false;
        }
        this.showNotification('All items verified! Click Complete to finish assembly.', 'success');
        this.addLogEntry('All components and sensors scanned - ready to complete', 'success');
    }    /**
     * Update progress bar
     * FIXED: Proper progress calculation distinguishing components and sensors
     */
    updateProgress() {
        const config = this.ybsConfigurations[this.currentYBSType];
        const totalItems = 6 + config.sensorCount; // 6 components + sensors
        
        // Count completed components and sensors separately for accuracy
        const completedComponents = Object.values(this.componentMapping).filter(c => c.scanned).length;
        const completedSensors = this.scannedSensors.filter(s => s.sensorId !== undefined).length;
        const completedItems = completedComponents + completedSensors;
        
        const progressPercent = Math.round((completedItems / totalItems) * 100);
        
        console.log(`📊 Progress update: ${completedItems}/${totalItems} (${progressPercent}%) - Components: ${completedComponents}/6, Sensors: ${completedSensors}/${config.sensorCount}`);
        
        if (this.uiElements.progressFill) {
            this.uiElements.progressFill.style.width = `${progressPercent}%`;
        }
        
        if (this.uiElements.progressPercentage) {
            this.uiElements.progressPercentage.textContent = `${progressPercent}%`;
        }
    }

    /**
     * Complete assembly
     */
    async completeAssembly() {
        if (!this.assemblyId) {
            this.showNotification('Error: No assembly ID found', 'error');
            return false;
        }

        // Disable button to prevent double-clicks
        if (this.uiElements.completeButton) {
            this.uiElements.completeButton.disabled = true;
        }

        try {
            this.showNotification('Processing...', 'info');
            this.addLogEntry('Completing assembly process...', 'info');            // Use backend manager if available
            if (this.backendManager) {
                // Create a combined mapping that includes both components AND sensors
                const combinedMapping = {
                    ...this.componentMapping
                };
                  // Add sensors to the mapping (CRITICAL - every sensor is a component)
                this.scannedSensors.forEach((sensor, index) => {
                    const sensorKey = `sensor_${sensor.index || index + 1}`;
                    combinedMapping[sensorKey] = {
                        ...sensor,
                        type: 'sensor',
                        scanned: true,
                        name: sensor.name || `Sensor ${sensor.index || index + 1}`,
                        sequence: sensor.index || index + 1,
                        // CRITICAL FIX: Ensure scannedBarcode is available for backend processing
                        scannedBarcode: sensor.barcode || sensor.scannedBarcode,
                        itemCode: sensor.itemCode || '5YB013254', // Default YBS sensor item code
                        scanTime: sensor.scanTime || sensor.timestamp || new Date().toISOString()
                    };
                });                console.log(`📦 YBS Frontend: Preparing completion with ${Object.keys(this.componentMapping).length} components and ${this.scannedSensors.length} sensors`);
                console.log('📦 YBS Frontend: Component mapping:', this.componentMapping);
                console.log('📦 YBS Frontend: Scanned sensors:', this.scannedSensors);
                console.log('📦 YBS Frontend: Combined mapping:', combinedMapping);
                console.log(`🔧 YBS Frontend: WorkOrderId for completion: ${this.workOrderId}`);
                
                const result = await this.backendManager.completeAssembly({
                    assemblyId: this.assemblyId,
                    componentMapping: combinedMapping, // Now includes both components AND sensors
                    currentYBSType: this.currentYBSType,
                    workOrderId: this.workOrderId,
                    config: this.ybsConfigurations[this.currentYBSType],
                    scannedSensors: [] // Pass empty array since sensors are already in combinedMapping
                });

                console.log('🎯 YBS Frontend: Backend completion result:', result);

                if (result.success) {
                    console.log('🎯 YBS Frontend: Completion data for screen:', result.completionData);
                    console.log('🎯 YBS Frontend: Scanned components in completion data:', result.completionData?.scannedComponents);
                    this.showCompletionScreen(result.completionData);
                    this.cleanupLocalStorage();
                    return true;
                } else {
                    throw new Error(result.message || 'Assembly completion failed');
                }
            } else {
                // Fallback completion without backend manager
                const assemblyBarcode = this.generateAssemblyBarcode();
                this.showCompletionScreen(assemblyBarcode);
                this.cleanupLocalStorage();
                return true;
            }

        } catch (error) {
            console.error('Error completing assembly:', error);
            this.showNotification(`Failed to complete assembly: ${error.message}`, 'error');
            this.addLogEntry(`Error completing assembly: ${error.message}`, 'error');
            
            // Re-enable button
            if (this.uiElements.completeButton) {
                this.uiElements.completeButton.disabled = false;
            }
            return false;
        }
    }

    /**
     * Generate assembly barcode (fallback)
     */
    generateAssemblyBarcode() {
        const prefix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const suffix = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        return prefix + '24' + suffix;
    }

       /* Show completion screen with assembly details and barcode - Enhanced to match RSM style
     */    showCompletionScreen(assemblyData) {
        if (!this.uiElements.mainContainer) return;

        console.log('🎯 YBS Frontend: showCompletionScreen called with data:', assemblyData);

        // Handle both old (barcode string) and new (completion data object) formats
        let completionData;
        if (typeof assemblyData === 'string') {
            // Fallback for old format - create minimal completion data
            completionData = {
                assemblyId: this.assemblyId,
                itemCode: this.currentYBSType,
                barcodeNumber: assemblyData,
                scannedComponents: [],
                completedAt: new Date().toISOString()
            };
            console.log('🎯 YBS Frontend: Using fallback format, created completion data:', completionData);
        } else {
            completionData = assemblyData;
            console.log('🎯 YBS Frontend: Using full completion data format');
        }

        console.log('🎯 YBS Frontend: Final completion data for display:', completionData);
        console.log('🎯 YBS Frontend: Scanned components count:', completionData.scannedComponents?.length || 0);
        console.log('🎯 YBS Frontend: Scanned components data:', completionData.scannedComponents);

        // Check if this is a rework order
        const isRework = completionData.is_rework || completionData.reworked || 
                        completionData.rework_reason || completionData.rework_count > 0 ||
                        (completionData.status && completionData.status.toLowerCase().includes('rework'));

        // Generate rework badge HTML if it's a rework order
        const reworkBadgeHtml = isRework ? `
            <div style="display: inline-block; background: #fef3c7; color: #92400e; padding: 0.5rem 1rem; 
                        border-radius: 9999px; font-size: 0.875rem; font-weight: 600; margin-bottom: 1rem;">
                🔄 REWORKED
            </div>
        ` : '';

        this.uiElements.mainContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; max-width: 800px; margin: 0 auto; background: white; border-radius: 0.5rem;">
                <div style="background: linear-gradient(135deg, #10b981, #16a34a); color: white; padding: 2rem; border-radius: 0.5rem; margin-bottom: 2rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
                    ${reworkBadgeHtml}
                    <h1 style="margin: 0 0 1rem 0; font-size: 2rem;">Assembly Completed!</h1>
                    <p style="margin: 0; font-size: 1.2rem; opacity: 0.9;">
                        ${this.ybsConfigurations[this.currentYBSType]?.name || 'YBS Assembly'} successfully assembled
                    </p>
                </div>
                
                <div style="background: #f8fafc; padding: 2rem; border-radius: 0.5rem; margin-bottom: 2rem;">
                    <h2 style="color: #1f2937; margin-bottom: 1.5rem;">Assembly Details</h2>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; text-align: left;">
                        <div style="background: white; padding: 1rem; border-radius: 0.375rem; border-left: 4px solid #10b981;">
                            <strong>Assembly ID:</strong><br>
                            <span style="color: #6b7280;">${completionData.assemblyId || 'N/A'}</span>
                        </div>
                        <div style="background: white; padding: 1rem; border-radius: 0.375rem; border-left: 4px solid #3b82f6;">
                            <strong>YBS Type:</strong><br>
                            <span style="color: #6b7280;">${completionData.itemCode || this.currentYBSType}</span>
                        </div>
                        <div style="background: white; padding: 1rem; border-radius: 0.375rem; border-left: 4px solid #f59e0b;">
                            <strong>Barcode:</strong><br>
                            <span style="color: #6b7280; font-family: monospace; font-size: 0.9rem;">${completionData.barcodeNumber || 'N/A'}</span>
                        </div>
                        <div style="background: white; padding: 1rem; border-radius: 0.375rem; border-left: 4px solid #8b5cf6;">
                            <strong>Components:</strong><br>
                            <span style="color: #6b7280;">${completionData.scannedComponents?.length || 0} scanned</span>
                        </div>
                        <div style="background: white; padding: 1rem; border-radius: 0.375rem; border-left: 4px solid #ef4444; grid-column: span 2;">
                            <strong>Completed At:</strong><br>
                            <span style="color: #6b7280;">${new Date(completionData.completedAt || Date.now()).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 2rem;">
                    <h3 style="color: #374151; margin-bottom: 1rem; font-size: 1.1rem;">Generated Assembly Barcode</h3>
                    <div id="assemblyBarcodeContainer" style="background: white; padding: 1rem; border-radius: 0.375rem; border: 1px solid #d1d5db;">
                        <svg id="finalAssemblyBarcode" style="max-width: 100%; height: auto;"></svg>
                    </div>
                    <div style="margin-top: 0.5rem; font-family: monospace; font-size: 0.9rem; color: #6b7280;">
                        ${completionData.barcodeNumber || 'N/A'}
                    </div>
                </div>
                  ${completionData.scannedComponents && completionData.scannedComponents.length > 0 ? `
                <div style="background: #f0f9ff; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 2rem; border: 1px solid #0ea5e9;">
                    <h3 style="color: #0369a1; margin-bottom: 1rem;">Scanned Components & Sensors (${completionData.scannedComponents.length} total)</h3>
                    <div style="max-height: 200px; overflow-y: auto; text-align: left;">
                        ${completionData.scannedComponents.map((comp, idx) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: white; margin-bottom: 0.5rem; border-radius: 0.25rem; border: 1px solid #e5e7eb; ${comp.type === 'sensor' ? 'border-left: 4px solid #10b981;' : 'border-left: 4px solid #3b82f6;'}">
                                <div style="flex: 1;">
                                    <div><strong>${idx + 1}. ${comp.name || comp.componentName || 'Unknown Component'}</strong></div>
                                    <div style="color: #6b7280; font-size: 0.9rem;">
                                        Item Code: ${comp.itemCode || comp.item_code || 'N/A'}
                                        ${comp.type === 'sensor' ? ' • <span style="background: #dcfce7; color: #166534; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600;">🔍 SENSOR</span>' : ' • <span style="background: #dbeafe; color: #1e40af; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600;">📦 COMPONENT</span>'}
                                    </div>
                                </div>
                                <div style="color: #6b7280; font-family: monospace; font-size: 0.9rem; text-align: right;">
                                    <div style="font-weight: 600;">${comp.barcode || comp.scannedBarcode || 'N/A'}</div>
                                    <div style="font-size: 0.8rem;">Seq: ${comp.sequence || idx + 1} • Code: ${comp.code || 'N/A'}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 0.375rem; border: 1px solid #e2e8f0;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; text-align: center; font-size: 0.9rem;">
                            <div>
                                <div style="font-weight: 600; color: #1f2937;">Total Components</div>
                                <div style="color: #3b82f6;">${(completionData.scannedComponents || []).filter(c => c.type !== 'sensor').length}</div>
                            </div>
                            <div>
                                <div style="font-weight: 600; color: #1f2937;">Total Sensors</div>
                                <div style="color: #10b981;">${(completionData.scannedComponents || []).filter(c => c.type === 'sensor').length}</div>
                            </div>
                            <div>
                                <div style="font-weight: 600; color: #1f2937;">Total Scanned</div>
                                <div style="color: #8b5cf6;">${(completionData.scannedComponents || []).length}</div>
                            </div>
                        </div>
                    </div>
                </div>
                ` : `
                <div style="background: #fef3c7; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 2rem; border: 1px solid #f59e0b;">
                    <h3 style="color: #92400e; margin-bottom: 0.5rem;">⚠️ No Components/Sensors Data</h3>
                    <p style="color: #92400e; margin: 0; font-size: 0.9rem;">No scanned components or sensors were found in the completion data. This might indicate a data processing issue.</p>
                </div>
                `}
                
                <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button onclick="window.location.href='/assembly/ybs'"
                            style="background: #3b82f6; color: white; padding: 0.75rem 1.5rem;
                                   border: none; border-radius: 0.375rem; cursor: pointer; font-size: 1rem;">
                        Return to YBS Assembly List
                    </button>
                    <button onclick="window.location.reload()"
                            style="background: #10b981; color: white; padding: 0.75rem 1.5rem;
                                   border: none; border-radius: 0.375rem; cursor: pointer; font-size: 1rem;">
                        Start New Assembly
                    </button>
                </div>
            </div>
        `;

        // Render barcode if available
        const barcodeValue = completionData.barcodeNumber || (typeof assemblyData === 'string' ? assemblyData : 'N/A');
        this.renderBarcode('finalAssemblyBarcode', barcodeValue);
    }
     /* Render barcode using JsBarcode
     */
    renderBarcode(elementId, barcodeValue) {
        try {
            if (typeof JsBarcode !== 'undefined') {
                JsBarcode(`#${elementId}`, barcodeValue, {
                    format: "CODE128",
                    lineColor: "#000",
                    width: 2,
                    height: 60,
                    displayValue: true,
                    fontSize: 16,
                    margin: 10
                });
            } else {
                console.warn('JsBarcode not available');
                const element = document.getElementById(elementId);
                if (element) {
                    element.innerHTML = `<div style="padding: 1rem; background: #f3f4f6; border-radius: 0.25rem;">
                        <strong>Barcode: ${barcodeValue}</strong>
                    </div>`;
                }
            }
        } catch (error) {
            console.error("Error rendering barcode:", error);
        }
    }

    /**
     * Restart assembly
     */
    async restartAssembly() {
        if (!confirm("Are you sure you want to restart this assembly? All current progress will be lost.")) {
            return;
        }

        try {
            // Reset UI state
            document.querySelectorAll('.success, .next, .error').forEach(el => {
                el.classList.remove('success', 'next', 'error');
            });

            // Reset component states
            Object.values(this.componentMapping).forEach(component => {
                if (component.element) {
                    component.element.style.backgroundColor = '';
                }
                component.scanned = false;
                component.scannedBarcode = null;
                component.scanTime = null;
            });

            // Reset variables
            this.currentSensorIndex = 1;
            this.scannedSensors = [];
            this.scannedBarcodes.clear();

            // Reset progress
            this.updateProgress();

            // Clear logs
            if (this.uiElements.logsContent) {
                this.uiElements.logsContent.innerHTML = '';
            }

            // Hide complete button
            if (this.uiElements.completeButton) {
                this.uiElements.completeButton.classList.add('hidden');
                this.uiElements.completeButton.disabled = true;
            }

            // Reset backend state if available
            if (this.backendManager && this.assemblyId) {
                await this.backendManager.resetAssemblyState(this.assemblyId);
            }

            // Clear local storage
            this.clearLocalStorage();

            // Highlight first item
            this.highlightNextItem();

            this.showNotification('Assembly has been restarted', 'info');
            this.addLogEntry('Assembly restarted - scanning from beginning', 'info');

        } catch (error) {
            console.error('Error restarting assembly:', error);
            this.showNotification(`Failed to restart assembly: ${error.message}`, 'error');
        }
    }    /**
     * Load or create assembly
     */
    async loadOrCreateAssembly() {
        const urlParams = new URLSearchParams(window.location.search);
        const assemblyId = urlParams.get('assemblyId') || urlParams.get('id');
        const workOrderId = urlParams.get('workOrderId');

        // Always set workOrderId if available - this is critical for database operations
        if (workOrderId) {
            this.workOrderId = workOrderId;
            localStorage.setItem('currentYBSWorkOrderId', workOrderId);
            console.log(`🔧 YBS: Set workOrderId to ${workOrderId} from URL params`);
        } else {
            // Try to restore from localStorage if not in URL
            const storedWorkOrderId = localStorage.getItem('currentYBSWorkOrderId');
            if (storedWorkOrderId) {
                this.workOrderId = storedWorkOrderId;
                console.log(`🔧 YBS: Restored workOrderId ${storedWorkOrderId} from localStorage`);
            } else {
                console.warn('⚠️ YBS: No workOrderId found in URL or localStorage - work order operations may fail');
            }
        }

        if (assemblyId) {
            // Load existing assembly
            await this.loadAssemblyState(assemblyId);
        } else if (workOrderId) {
            // Create new assembly
            await this.createNewAssembly(workOrderId);
        } else {
            // Show error - no context provided
            this.showError('No assembly ID or work order ID provided');
        }
    }    /**
     * Load assembly state
     */
    async loadAssemblyState(assemblyId) {
        this.assemblyId = assemblyId;
        localStorage.setItem('currentYBSAssemblyId', assemblyId);

        // Ensure workOrderId is preserved when loading existing assembly
        if (!this.workOrderId) {
            const storedWorkOrderId = localStorage.getItem('currentYBSWorkOrderId');
            if (storedWorkOrderId) {
                this.workOrderId = storedWorkOrderId;
                console.log(`🔧 YBS: Restored workOrderId ${storedWorkOrderId} when loading assembly ${assemblyId}`);
            }
        }

        try {
            if (this.backendManager) {
                const data = await this.backendManager.loadAssemblyState(assemblyId);
                this.restoreAssemblyState(data);
            } else {
                // Load from localStorage as fallback
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Error loading assembly state:', error);
            this.showNotification('Error loading assembly. Starting fresh.', 'warning');
        }
    }

    /**
     * Create new assembly
     */    async createNewAssembly(workOrderId) {
        this.workOrderId = workOrderId;

        try {
            if (this.backendManager) {
                const data = await this.backendManager.createAssemblyProcess(workOrderId, this.currentYBSType);
                this.assemblyId = data.id;
                localStorage.setItem('currentYBSAssemblyId', this.assemblyId.toString());
            }
            
            this.addLogEntry(`Created new assembly for work order ${workOrderId}`, 'info');
            this.highlightNextItem();
            
            // Set initial title
            if (this.currentSensorIndex <= 6) {
                this.updateTitleForNextComponent();
            } else {
                this.updateTitleForNextSensor();
            }
        } catch (error) {
            console.error('Error creating assembly:', error);
            this.showError(`Failed to create assembly: ${error.message}`);
        }
    }

    /**
     * Restore assembly state from data
     */
    restoreAssemblyState(data) {
        // Restore scanning index
        this.currentSensorIndex = data.current_sensor_index || 1;

        // Restore scanned items
        if (data.metadata?.scanned_sensors) {
            this.scannedSensors = data.metadata.scanned_sensors.map(s => ({
                sensorId: s.id,
                barcode: s.barcode,
                timestamp: new Date(s.scan_time),
                status: 'success'
            }));

            // Mark items as scanned in UI
            this.scannedSensors.forEach(scan => {
                this.scannedBarcodes.add(scan.barcode);
                
                if (scan.sensorId <= 6) {
                    // Component
                    const component = Object.values(this.componentMapping).find(c => c.sequence === scan.sensorId);
                    if (component) {
                        component.scanned = true;
                        component.scannedBarcode = scan.barcode;
                        component.element.style.backgroundColor = 'var(--status-success)';
                    }
                } else {
                    // Sensor
                    const sensorId = scan.sensorId - 6;
                    const sensorCell = document.querySelector(`[data-sensor-id="${sensorId}"]`);
                    if (sensorCell) {
                        sensorCell.classList.add('success');
                    }
                }
            });
        }        this.updateProgress();
        this.highlightNextItem();
        this.addLogEntry('Assembly state restored', 'info');
        
        // Set appropriate title based on current state
        const config = this.ybsConfigurations[this.currentYBSType];
        if (this.currentSensorIndex > (6 + config.sensorCount)) {
            this.updateTitleForCompletion();
        } else if (this.currentSensorIndex <= 6) {
            this.updateTitleForNextComponent();
        } else {
            this.updateTitleForNextSensor();
        }
    }

    /**
     * Load from localStorage (fallback)
     */
    loadFromLocalStorage() {
        try {
            const storedIndex = localStorage.getItem('currentSensorIndex');
            if (storedIndex) {
                this.currentSensorIndex = parseInt(storedIndex);
            }

            const storedSensors = localStorage.getItem('scannedSensors');
            if (storedSensors) {
                this.scannedSensors = JSON.parse(storedSensors);
                this.scannedSensors.forEach(scan => {
                    this.scannedBarcodes.add(scan.barcode);
                });
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
    }

    /**
     * Save current scan
     */
    async saveCurrentScan(scanData) {
        // Save to localStorage
        localStorage.setItem('scannedSensors', JSON.stringify(this.scannedSensors));

        // Save to backend if available
        if (this.backendManager && this.assemblyId) {
            try {
                await this.backendManager.updateAssemblyProgress(this.assemblyId, {
                    metadata: {
                        scanned_sensors: this.scannedSensors.map(s => ({
                            id: s.sensorId,
                            barcode: s.barcode,
                            scan_time: s.timestamp.toISOString()
                        }))
                    }
                });
            } catch (error) {
                console.error('Error saving to backend:', error);
            }
        }
    }

    /**
     * Update current sensor index
     */
    async updateCurrentSensorIndex() {
        localStorage.setItem('currentSensorIndex', this.currentSensorIndex.toString());

        if (this.backendManager && this.assemblyId) {
            try {
                await this.backendManager.updateAssemblyProgress(this.assemblyId, {
                    current_sensor_index: this.currentSensorIndex
                });
            } catch (error) {
                console.error('Error updating sensor index:', error);
            }
        }
    }    /**
     * Initialize API connection
     */
    async initializeAPI() {
        if (this.backendManager) {
            this.apiConnected = await this.backendManager.testApiConnection();
            
            if (!this.apiConnected) {
                this.updateBoardToBoardTitle('⚠️ API Connection Failed - Check Network', 'error');
                this.showNotification('API connection failed. Operating in offline mode.', 'warning');            } else {
                // Load inventory data from backend (fetches scanning codes)
                try {
                    this.addLogEntry('🔄 Fetching YBS component data from inventory API...', 'info');
                    const inventoryResult = await this.backendManager.loadInventoryData(this.currentYBSType);                      if (inventoryResult && inventoryResult.success) {
                        this.updateTitleForAPIStatus(true, inventoryResult.message);                        // Map scanning codes to componentMapping
                        Object.entries(this.componentMapping).forEach(([key, component]) => {
                            // Use the component's itemCode to look up the scanning code
                            const apiData = inventoryResult.itemCodes[component.itemCode];
                            if (apiData) {
                                component.scanningCode = apiData.code;
                                component.description = apiData.description;
                                console.log(`📋 Mapped ${component.name}: ${component.itemCode} → Scanning Code: "${apiData.code}"`);
                            } else {
                                console.warn(`⚠️ No API data found for ${component.name} (${component.itemCode})`);
                            }
                        });
                        // Log detailed item code information
                        this.logItemCodeDetails(inventoryResult.fetchResults || []);
                        
                        // Set flag to indicate data is loaded
                        this.inventoryDataLoaded = true;
                        this.addLogEntry('✅ All component scanning codes loaded successfully', 'success');
                        
                        // Show initial scanning instruction after item codes loaded
                        setTimeout(() => {
                            if (this.currentSensorIndex <= 6) {
                                this.updateTitleForNextComponent();
                            } else {
                                this.updateTitleForNextSensor();
                            }
                        }, 2000);
                    } else {
                        this.updateTitleForAPIStatus(false, inventoryResult ? inventoryResult.message : 'Failed to load item codes');
                        
                        // Log failed fetch results if available
                        if (inventoryResult && inventoryResult.fetchResults) {
                            this.logItemCodeDetails(inventoryResult.fetchResults);
                        }
                    }
                } catch (error) {
                    this.updateTitleForAPIStatus(false, `API Error: ${error.message}`);
                    this.addLogEntry(`❌ Error connecting to inventory API: ${error.message}`, 'error');
                }
            }
        } else {
            // No backend manager - show ready message
            this.updateBoardToBoardTitle('Ready to Start Assembly', 'info');
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (!this.uiElements.notification) return;

        this.uiElements.notification.textContent = message;
        this.uiElements.notification.className = 'notification';
        this.uiElements.notification.classList.add(type);
        this.uiElements.notification.style.display = 'block';
        
        setTimeout(() => {
            this.uiElements.notification.style.opacity = '1';
        }, 10);
        
        setTimeout(() => {
            this.uiElements.notification.style.opacity = '0';
            setTimeout(() => {
                this.uiElements.notification.style.display = 'none';
            }, 300);
        }, 3000);
    }

    /**
     * Add log entry
     */
    addLogEntry(message, type = 'info') {
        if (!this.uiElements.logsContent) return;

        const timestamp = new Date().toLocaleTimeString();
        const logItem = document.createElement('div');
        logItem.classList.add('log-item', type);
        logItem.innerHTML = `
            <span class="log-time">${timestamp}</span>
            <span class="log-message">${message}</span>
        `;
        
        this.uiElements.logsContent.appendChild(logItem);
        this.uiElements.logsContent.scrollTop = this.uiElements.logsContent.scrollHeight;
    }

    /**
     * Show error
     */
    showError(message) {
        if (this.uiElements.mainContainer) {
            this.uiElements.mainContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h2 style="color: #dc2626; margin-bottom: 1rem;">Error</h2>
                    <p style="margin-bottom: 2rem;">${message}</p>
                    <button onclick="window.location.href='/assembly/ybs'" 
                            style="background: #3b82f6; color: white; padding: 0.75rem 1.5rem; 
                                   border: none; border-radius: 0.375rem; cursor: pointer;">
                        Return to YBS Assembly List
                    </button>
                </div>
            `;
        }
    }

    /**
     * Clear local storage
     */
    clearLocalStorage() {
        const keys = ['currentSensorIndex', 'scannedSensors'];
        keys.forEach(key => localStorage.removeItem(key));
    }

    /**
     * Clean up local storage on completion
     */
    cleanupLocalStorage() {
        if (this.backendManager) {
            this.backendManager.cleanupLocalStorage(this.assemblyId);
        } else {
            this.clearLocalStorage();
            localStorage.removeItem('currentYBSAssemblyId');
        }
    }

    /**
     * Update board-to-board title with current scanning status
     */
    updateBoardToBoardTitle(message, type = 'info') {
        if (!this.uiElements.boardToBoardTitle) return;
        
        let colorClass = '';
        switch(type) {
            case 'success':
                colorClass = 'color: #16a34a; font-weight: bold;';
                break;
            case 'error':
                colorClass = 'color: #dc2626; font-weight: bold;';
                break;
            case 'warning':
                colorClass = 'color: #f59e0b; font-weight: bold;';
                break;
            case 'info':
            default:
                colorClass = 'color: #3b82f6; font-weight: bold;';
                break;
        }
        
        this.uiElements.boardToBoardTitle.innerHTML = message;
        this.uiElements.boardToBoardTitle.style.cssText = colorClass;
        
        // Reset to default style after 3 seconds if it's a temporary message
        if (type !== 'info') {
            setTimeout(() => {
                if (this.uiElements.boardToBoardTitle) {
                    this.uiElements.boardToBoardTitle.style.cssText = 'color: #3b82f6; font-weight: bold;';
                }
            }, 3000);
        }
    }

    /**
     * Update title for next component scan
     */
    updateTitleForNextComponent() {
        const nextComponent = this.getNextComponent();
        if (nextComponent) {
            this.updateBoardToBoardTitle(`Scan ${nextComponent.name}`, 'info');
        }
    }

    /**
     * Update title for next sensor scan
     */
    updateTitleForNextSensor() {
        const config = this.ybsConfigurations[this.currentYBSType];
        const sensorId = this.currentSensorIndex - 6;
        
        if (sensorId <= config.sensorCount) {
            this.updateBoardToBoardTitle(`Scan Sensor #${sensorId}`, 'info');
        }
    }

    /**
     * Update title for API status
     */    updateTitleForAPIStatus(success, message = '') {
        if (success) {
            this.updateBoardToBoardTitle(message ? `📋 ${message}` : `📋 Item codes loaded successfully`, 'success');
        } else {
            this.updateBoardToBoardTitle(`❌ Failed to load item codes: ${message}`, 'error');
        }
    }

    /**
     * Update title for assembly completion
     */
    updateTitleForCompletion() {
        this.updateBoardToBoardTitle('🎉 Assembly Complete!', 'success');
    }

    /**
     * Log detailed item code information to assembly logs
     */
    logItemCodeDetails(fetchResults) {
        if (!fetchResults || fetchResults.length === 0) {
            this.addLogEntry('⚠️ No item code details available', 'warning');
            return;
        }

        this.addLogEntry('📋 YBS Component Item Code Details:', 'info');
        
        // Group results by status
        const successful = fetchResults.filter(r => r.status === 'success');
        const failed = fetchResults.filter(r => r.status !== 'success');
        
        // Log successful fetches
        if (successful.length > 0) {
            this.addLogEntry(`✅ Successfully loaded ${successful.length} component codes:`, 'success');
            successful.forEach(result => {
                const componentName = this.getComponentDisplayName(result.component);
                const logMessage = `  • ${componentName}: ${result.itemCode}`;
                if (result.scanningCode) {
                    this.addLogEntry(`${logMessage} → Scanning Code: "${result.scanningCode}"`, 'success');
                } else {
                    this.addLogEntry(`${logMessage} → No scanning code available`, 'warning');
                }
                if (result.description && result.description !== result.itemCode) {
                    this.addLogEntry(`    Description: ${result.description}`, 'info');
                }
            });
        }
        
        // Log failed fetches
        if (failed.length > 0) {
            this.addLogEntry(`❌ Failed to load ${failed.length} component codes:`, 'error');
            failed.forEach(result => {
                const componentName = this.getComponentDisplayName(result.component);
                this.addLogEntry(`  • ${componentName}: ${result.itemCode} - ${result.description}`, 'error');
            });
        }
        
        // Summary
        const totalComponents = fetchResults.length;
        const successRate = Math.round((successful.length / totalComponents) * 100);
        this.addLogEntry(`📊 Item Code Fetch Summary: ${successful.length}/${totalComponents} components (${successRate}% success rate)`, 
                        successful.length === totalComponents ? 'success' : 'warning');
    }

    /**
     * Get display name for component key
     */
    getComponentDisplayName(componentKey) {
        const displayNames = {
            'left_pcb': 'Left Slave PCB',
            'master_pcb': 'Master PCB', 
            'right_pcb': 'Right Slave PCB',
            'b2b_left_master': 'Board-to-Board (Left-Master)',
            'b2b_master_right': 'Board-to-Board (Master-Right)',
            'pc_cable': 'Power & Communication Cable',
            'sensor_1_16': 'Special Sensors (1 & 16)',
            'sensor_standard': 'Standard Sensors (2-15, 17-23)'
        };
        return displayNames[componentKey] || componentKey;
    }

    /**
     * Get component details including item code and scanning code
     */
    getComponentDetails(component) {
        // Try to get item code from component or configuration
        const config = this.ybsConfigurations[this.currentYBSType];
        const itemCode = component.itemCode || 
                        (config && config.components && config.components[component.name]?.itemCode) || 
                        'Unknown';
        
        // Get scanning code from loaded inventory data if available
        let scanningCode = '';
        if (this.backendManager && this.loadedItemCodes) {
            const componentKey = this.getComponentKeyFromName(component.name);
            if (componentKey && this.loadedItemCodes[componentKey] && this.loadedItemCodes[componentKey].code) {
                scanningCode = this.loadedItemCodes[componentKey].code;
            }
        }
        
        return {
            itemCode: itemCode,
            scanningCode: scanningCode,
            description: component.description || ''
        };
    }

    /**
     * Get component key from component name
     */
    getComponentKeyFromName(componentName) {
        const keyMappings = {
            'Left Slave PCB': 'left_pcb',
            'Master PCB': 'master_pcb',
            'Right Slave PCB': 'right_pcb',
            'Board-to-Board (Left to Master)': 'b2b_left_master',
            'Board-to-Board (Master to Right)': 'b2b_master_right',
            'Power & Communication Cable': 'pc_cable'
        };
        return keyMappings[componentName] || null;
    }    /**
     * Get sensor details including item code and verification code from API data
     * Updated to use per-sensor item code mapping from backend
     */
    getSensorDetails(sensorId) {
        let itemCode = 'Unknown';
        let sensorType = 'Standard';
        let verificationCode = null;
        
        // Get the correct item code for this specific sensor from backend
        if (this.backendManager && this.currentYBSType) {
            const sensorItemCode = this.backendManager.getSensorItemCode(this.currentYBSType, sensorId);
            if (sensorItemCode) {
                itemCode = sensorItemCode;
                console.log(`🔍 YBS Frontend: Sensor ${sensorId} item code: ${itemCode}`);
            } else {
                console.warn(`⚠️ YBS Frontend: Could not get item code for sensor ${sensorId} in ${this.currentYBSType}`);
            }
        }
        
        // Determine sensor type based on position (sensors 1 and 16 are typically special)
        // But this will vary by YBS type according to your mappings
        if (this.currentYBSType) {
            const sensorMapping = this.backendManager?.getSensorItemCodeMapping(this.currentYBSType) || {};
            
            // Check if this sensor has a different item code than the "default" sensors
            const itemCodes = Object.values(sensorMapping);
            const mostCommonCode = itemCodes.reduce((a, b, _, array) => 
                array.filter(v => v === a).length >= array.filter(v => v === b).length ? a : b
            );
            
            if (itemCode !== mostCommonCode) {
                sensorType = 'Special';
            } else {
                sensorType = 'Standard';
            }
        }
        
        // Get verification code from loaded inventory data if available
        if (this.loadedInventoryData && this.loadedInventoryData.itemCodes && itemCode !== 'Unknown') {
            const inventoryItem = this.loadedInventoryData.itemCodes[itemCode];
            if (inventoryItem && inventoryItem.code) {
                verificationCode = inventoryItem.code;
                console.log(`🔍 YBS Frontend: Sensor ${sensorId} verification code: ${verificationCode}`);
            } else {
                console.warn(`⚠️ YBS Frontend: No verification code found for sensor ${sensorId} item code ${itemCode}`);
            }
        }
        
        return {
            itemCode: itemCode,
            sensorType: sensorType,
            position: sensorId,
            verificationCode: verificationCode
        };
    }
}

// Initialize YBS Assembly Manager when script loads
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on a YBS assembly page
    if (window.location.pathname.includes('/YBS/') || document.querySelector('.part-id')) {
        window.ybsAssemblyManager = new YBSAssemblyManager();
    }
});

// Export for use in other scripts
window.YBSAssemblyManager = YBSAssemblyManager;
