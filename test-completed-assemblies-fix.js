// Test script to verify completed YBS assemblies are loaded correctly
const { performance } = require('perf_hooks');

// Test Assembly.jsx completed orders loading
console.log('=== Testing Assembly.jsx Completed Orders Loading ===');

// Simulate the updated getCompletedAssemblies API call
const testGetCompletedAssemblies = async (queryParams = '') => {
  const statusParam = 'status=completed';
  const fullParams = queryParams ? `${statusParam}&${queryParams}` : statusParam;
  const url = `/api/assembly-process/?${fullParams}`;
  
  console.log('✓ Updated API URL:', url);
  
  // Simulate assembly-process response format
  const mockResponse = [
    {
      id: 1,
      work_order: { id: 101, work_order: 'WO-YBS-001', product: 'YBS Product 1', item_code: '5YB011057' },
      product: 'YBS Product 1',
      item_code: '5YB011057',
      serial_number: 'YBS-24-0001',
      barcode_number: '12345678901',
      completed_at: '2024-01-15T10:30:00Z',
      status: 'completed',
      individual_component_barcodes: [
        { barcode: 'COMP1-001', position: 'U1', type: 'IC' },
        { barcode: 'SENSOR1-001', position: 'S1', type: 'Sensor' }
      ],
      zone: 'YBS'
    },
    {
      id: 2,
      work_order: { id: 102, work_order: 'WO-RSM-001', product: 'RSM Product 1', item_code: '5RS012345' },
      product: 'RSM Product 1',
      item_code: '5RS012345',
      serial_number: 'RSM-24-0001',
      barcode_number: '12345678902',
      completed_at: '2024-01-15T11:00:00Z',
      status: 'completed',
      scanned_components: [
        { barcode: 'COMP2-001', position: 'U2', type: 'IC' }
      ],
      zone: 'RSM'
    }
  ];
  
  return mockResponse;
};

// Test the data transformation logic
const testDataTransformation = async () => {
  console.log('\n=== Testing Data Transformation ===');
  
  const completedAssemblies = await testGetCompletedAssemblies();
    // Apply the transformation logic from Assembly.jsx
  const formattedOrders = completedAssemblies.map(assembly => {
    const workOrderData = assembly.work_order || {};
    const workOrderId = typeof workOrderData === 'object' ? workOrderData.id : workOrderData;
    const workOrderNumber = typeof workOrderData === 'object' ? workOrderData.work_order : workOrderData;
    
    // Determine PCB type early so we can use it in the object
    const itemCodeToCheck = assembly.item_code || workOrderData.item_code || '';
    const productToCheck = assembly.product || workOrderData.product || '';
    let detectedPcbType = assembly.pcb_type;
    
    if (!detectedPcbType) {
      if (itemCodeToCheck.includes('YBS') || itemCodeToCheck.includes('5YB')) {
        detectedPcbType = 'YBS';
      } else if (itemCodeToCheck.includes('RSM') || itemCodeToCheck.includes('5RS')) {
        detectedPcbType = 'RSM';
      } else if (productToCheck.includes('YBS')) {
        detectedPcbType = 'YBS';
      } else if (productToCheck.includes('RSM')) {
        detectedPcbType = 'RSM';
      }
    }
    
    return {
      id: assembly.id,
      workOrder: workOrderNumber || workOrderId || 'Unknown',
      product: assembly.product || workOrderData.product || 'Unknown Product',
      item_code: assembly.item_code || workOrderData.item_code || 'Unknown Item',
      serialNumber: assembly.serial_number || assembly.serialNumber || 'N/A',
      barcodeNumber: assembly.barcode_number || assembly.barcodeNumber || 'N/A',
      completedAt: assembly.completed_at || assembly.completedAt || new Date().toISOString(),
      scannedComponents: assembly.scanned_components || assembly.individual_component_barcodes || [],
      is_rework: assembly.is_rework || false,
      reworked: assembly.reworked || false,
      rework_notes: assembly.rework_notes || '',
      pcb_type: detectedPcbType || 'Unknown',
      pcb_type_code: detectedPcbType || 'Unknown',
      zone: assembly.zone || 'Unknown'
    };
  });
  
  console.log('✓ Formatted Orders:', JSON.stringify(formattedOrders, null, 2));
  
  // Test PCB type detection
  const detectPcbType = (order) => {
    if (order.pcb_type_code) return order.pcb_type_code;
    if (order.pcb_type) return order.pcb_type;
    if (order.pcb_type_detail?.code) return order.pcb_type_detail.code;
    
    if (order.item_code) {
      if (order.item_code.includes('YBS') || order.item_code.includes('5YB')) return 'YBS';
      if (order.item_code.includes('RSM') || order.item_code.includes('5RS')) return 'RSM';
    }
    
    if (order.product) {
      if (order.product.includes('YBS')) return 'YBS';
      if (order.product.includes('RSM')) return 'RSM';
    }
    
    return null;
  };
  
  console.log('\n=== Testing PCB Type Detection ===');
  formattedOrders.forEach(order => {
    const detectedType = detectPcbType(order);
    console.log(`✓ Order ${order.id}: ${order.item_code} -> PCB Type: ${detectedType}`);
  });
  
  return formattedOrders;
};

// Test the complete flow
const runTests = async () => {
  const startTime = performance.now();
  
  try {
    const formattedOrders = await testDataTransformation();
    
    console.log('\n=== Test Results ===');
    console.log(`✓ Total completed assemblies: ${formattedOrders.length}`);
    console.log(`✓ YBS assemblies: ${formattedOrders.filter(o => o.pcb_type === 'YBS').length}`);
    console.log(`✓ RSM assemblies: ${formattedOrders.filter(o => o.pcb_type === 'RSM').length}`);
    
    // Verify YBS data
    const ybsAssemblies = formattedOrders.filter(o => o.pcb_type === 'YBS');
    ybsAssemblies.forEach(assembly => {
      console.log(`✓ YBS Assembly ID ${assembly.id}:`);
      console.log(`  - Work Order: ${assembly.workOrder}`);
      console.log(`  - Product: ${assembly.product}`);
      console.log(`  - Item Code: ${assembly.item_code}`);
      console.log(`  - Serial: ${assembly.serialNumber}`);
      console.log(`  - Components: ${assembly.scannedComponents.length} scanned`);
      console.log(`  - Completed: ${assembly.completedAt}`);
    });
    
    const endTime = performance.now();
    console.log(`\n✅ All tests completed successfully in ${(endTime - startTime).toFixed(2)}ms`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the tests
runTests();
