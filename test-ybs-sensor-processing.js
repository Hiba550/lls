/**
 * YBS Sensor Processing Test
 * Test if sensors are now correctly processed with scannedBarcode property
 */

// Test data - simulate sensors as they come from the frontend
const testSensors = [
    {
        index: 1,
        name: 'Sensor 1',
        barcode: 'SENSOR_001_TEST',
        timestamp: '2025-06-19T15:40:00.000Z',
        itemCode: '5YB013254'
    },
    {
        index: 2,
        name: 'Sensor 2', 
        barcode: 'SENSOR_002_TEST',
        timestamp: '2025-06-19T15:40:01.000Z',
        itemCode: '5YB013254'
    },
    {
        index: 3,
        name: 'Sensor 3',
        barcode: 'SENSOR_003_TEST',
        timestamp: '2025-06-19T15:40:02.000Z',
        itemCode: '5YB013254'
    }
];

// Test components
const testComponentMapping = {
    component1: {
        name: 'Test Component 1',
        itemCode: 'COMP001',
        scannedBarcode: 'COMP001_BARCODE',
        scanned: true,
        scanTime: '2025-06-19T15:40:03.000Z',
        sequence: 1,
        type: 'component'
    }
};

console.log('🧪 === YBS SENSOR PROCESSING TEST ===');

// Simulate the frontend combinedMapping creation (with the fix)
const combinedMapping = {
    ...testComponentMapping
};

// Add sensors to the mapping (with the fix applied)
testSensors.forEach((sensor, index) => {
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
});

console.log('📦 Combined Mapping (with fix):', combinedMapping);

// Simulate the backend prepareComponentData function logic
function simulatePrepareComponentData(componentMapping, scannedSensors = []) {
    const scannedComponents = [];
    
    console.log('📦 Backend: prepareComponentData called with:', {
        componentMappingKeys: Object.keys(componentMapping),
        scannedSensorsLength: scannedSensors.length
    });
    
    // Process traditional components (PCBs, cables, etc.)
    Object.entries(componentMapping).forEach(([key, component]) => {
        console.log(`📦 Backend: Processing component ${key}:`, component);
        if (component.scanned && component.scannedBarcode) {
            const componentData = {
                component_id: component.index || component.sequence || key,
                name: component.name,
                componentName: component.name,
                item_code: component.itemCode,
                itemCode: component.itemCode,
                barcode: component.scannedBarcode,
                scannedBarcode: component.scannedBarcode,
                scan_time: component.scanTime || new Date().toISOString(),
                sequence: component.sequence || 0,
                code: component.code || 'N/A',
                type: component.type || 'component'
            };
            scannedComponents.push(componentData);
            console.log(`✅ Backend: Added component ${key}:`, componentData);
        } else {
            console.log(`⚠️ Backend: Skipping component ${key} - not scanned or no barcode`);
        }
    });
    
    // Process sensors as components (CRITICAL - every sensor is a component)
    console.log(`📦 Backend: Processing ${scannedSensors.length} sensors as components...`);
    if (scannedSensors && scannedSensors.length > 0) {
        scannedSensors.forEach((sensor, index) => {
            console.log(`📦 Backend: Processing sensor ${index + 1}:`, sensor);
            
            // Fix: Check for both 'barcode' and 'scannedBarcode' properties
            const sensorBarcode = sensor.scannedBarcode || sensor.barcode;
            
            if (sensorBarcode) {
                const sensorData = {
                    component_id: sensor.sensorId || sensor.index || `sensor_${index + 1}`,
                    name: sensor.name || `Sensor ${sensor.sensorId || sensor.index || index + 1}`,
                    componentName: sensor.name || `Sensor ${sensor.sensorId || sensor.index || index + 1}`,
                    item_code: sensor.itemCode || '5YB013254', // Default YBS sensor item code
                    itemCode: sensor.itemCode || '5YB013254',
                    barcode: sensorBarcode,
                    scannedBarcode: sensorBarcode,
                    scan_time: sensor.scanTime || sensor.timestamp || new Date().toISOString(),
                    sequence: sensor.sensorId || sensor.index || index + 1,
                    code: sensor.code || 'N/A',
                    type: 'sensor',
                    sensor_id: sensor.sensorId || sensor.index || index + 1
                };
                scannedComponents.push(sensorData);
                console.log(`✅ Backend: Added sensor ${sensor.sensorId || index + 1} as component:`, sensorData);
            } else {
                console.log(`⚠️ Backend: Skipping sensor ${index + 1} - no barcode found (checked 'scannedBarcode' and 'barcode' properties)`);
                console.log(`⚠️ Backend: Sensor data:`, sensor);
            }
        });
    } else {
        console.log('⚠️ Backend: No sensors provided or sensors array is empty');
    }
    
    return scannedComponents;
}

// Test the component preparation
const resultComponents = simulatePrepareComponentData(combinedMapping, testSensors);

console.log('📊 === RESULTS ===');
console.log(`Total components processed: ${resultComponents.length}`);
console.log(`Components by type:`, resultComponents.reduce((acc, comp) => {
    acc[comp.type] = (acc[comp.type] || 0) + 1;
    return acc;
}, {}));

console.log('📋 All processed components:');
resultComponents.forEach((comp, index) => {
    console.log(`${index + 1}. ${comp.name} (${comp.type}) - Barcode: ${comp.barcode}`);
});

console.log('✅ === TEST COMPLETED ===');
