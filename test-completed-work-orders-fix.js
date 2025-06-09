/**
 * Test to verify the completed work orders fix in Assembly.jsx
 * Should show 4 work orders instead of 35 assemblies
 */

const fetch = require('node-fetch');

async function testCompletedWorkOrdersFix() {
    try {
        console.log('🔍 Testing Completed Work Orders Fix...');
        console.log('========================================');
        
        // Test 1: Get completed work orders (what Assembly.jsx should now use)
        console.log('\n📊 Test 1: Completed Work Orders Endpoint');
        const workOrdersResponse = await fetch('http://localhost:8000/api/work-order/?status=Completed');
        
        if (workOrdersResponse.ok) {
            const workOrdersData = await workOrdersResponse.json();
            const workOrders = Array.isArray(workOrdersData) ? workOrdersData : workOrdersData.results || [];
            
            console.log(`✅ Found ${workOrders.length} completed work orders`);
            
            if (workOrders.length > 0) {
                console.log('\n📋 Work Orders Summary:');
                workOrders.forEach((order, index) => {
                    const pcbType = order.pcb_type_code || order.pcb_type_detail?.code || 'Unknown';
                    const displayId = order.display_id || order.item_code || `WO-${order.id}`;
                    console.log(`${index + 1}. ${displayId} - ${pcbType} - ${order.product}`);
                });
                
                // Count by type
                const rsmCount = workOrders.filter(order => {
                    const pcbType = order.pcb_type_code || order.pcb_type_detail?.code || '';
                    return pcbType.includes('RSM');
                }).length;
                
                const ybsCount = workOrders.filter(order => {
                    const pcbType = order.pcb_type_code || order.pcb_type_detail?.code || '';
                    return pcbType.includes('YBS');
                }).length;
                
                console.log(`\n🏷️  RSM Work Orders: ${rsmCount}`);
                console.log(`🏷️  YBS Work Orders: ${ybsCount}`);
                console.log(`🏷️  Total: ${workOrders.length}`);
                
                // Verify the expected count
                if (workOrders.length === 4 && rsmCount === 3 && ybsCount === 1) {
                    console.log('\n✅ SUCCESS: Work orders count matches expected (4 total: 3 RSM + 1 YBS)');
                } else {
                    console.log(`\n⚠️  WARNING: Count doesn't match expected (4 total: 3 RSM + 1 YBS)`);
                    console.log(`   Found: ${workOrders.length} total, ${rsmCount} RSM, ${ybsCount} YBS`);
                }
            }
        } else {
            console.log('❌ Failed to fetch work orders:', workOrdersResponse.status);
        }
        
        // Test 2: Get completed assemblies (what Assembly.jsx was using before)
        console.log('\n\n📊 Test 2: Completed Assemblies Endpoint (for comparison)');
        const assembliesResponse = await fetch('http://localhost:8000/api/assembly-process/?status=completed');
        
        if (assembliesResponse.ok) {
            const assembliesData = await assembliesResponse.json();
            const assemblies = Array.isArray(assembliesData) ? assembliesData : assembliesData.results || [];
            
            console.log(`📦 Found ${assemblies.length} completed assemblies`);
            
            if (assemblies.length > 0) {
                const assemblyRsmCount = assemblies.filter(assembly => {
                    const itemCode = assembly.item_code || '';
                    const product = assembly.product || '';
                    return itemCode.includes('RSM') || product.includes('RSM');
                }).length;
                
                const assemblyYbsCount = assemblies.filter(assembly => {
                    const itemCode = assembly.item_code || '';
                    const product = assembly.product || '';
                    return itemCode.includes('YBS') || product.includes('YBS');
                }).length;
                
                console.log(`🏷️  RSM Assemblies: ${assemblyRsmCount}`);
                console.log(`🏷️  YBS Assemblies: ${assemblyYbsCount}`);
                console.log(`🏷️  Total: ${assemblies.length}`);
            }
        } else {
            console.log('❌ Failed to fetch assemblies:', assembliesResponse.status);
        }
        
        console.log('\n📝 Summary:');
        console.log('- Assembly.jsx has been updated to use /api/work-order/?status=Completed');
        console.log('- This should now show completed WORK ORDERS instead of completed ASSEMBLIES');
        console.log('- UI tab says "Completed Work Orders" and content should match');
        console.log('- Expected: 4 work orders (3 RSM + 1 YBS)');
        console.log('- Before fix: Was showing ~35 assemblies');
        console.log('- After fix: Should show 4 work orders');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Make sure the backend server is running on http://localhost:8000');
        }
    }
}

// Run the test
testCompletedWorkOrdersFix();
