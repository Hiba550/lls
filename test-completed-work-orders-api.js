/**
 * Test script to verify completed work orders are properly returned by API
 * This tests both the general work order API and the completed work orders API
 */

const API_BASE_URL = 'http://localhost:3000/api';

async function testCompletedWorkOrdersAPI() {
    console.log('🔍 Testing Completed Work Orders API Integration');
    console.log('=' .repeat(60));
    
    try {
        // Test 1: Get all work orders
        console.log('\n📊 Test 1: Fetching all work orders...');
        const allWorkOrdersResponse = await fetch(`${API_BASE_URL}/work-order/`);
        if (!allWorkOrdersResponse.ok) {
            throw new Error(`HTTP ${allWorkOrdersResponse.status}: ${allWorkOrdersResponse.statusText}`);
        }
        const allWorkOrders = await allWorkOrdersResponse.json();
        
        console.log(`✅ Total work orders: ${allWorkOrders.length}`);
        
        // Filter by status (check both uppercase and lowercase)
        const completedFromAll = allWorkOrders.filter(wo => 
            wo.status === 'Completed' || wo.status === 'completed'
        );
        const pendingFromAll = allWorkOrders.filter(wo => 
            wo.status === 'Pending' || wo.status === 'pending'
        );
        const inProgressFromAll = allWorkOrders.filter(wo => 
            wo.status === 'In Progress' || wo.status === 'in progress' || wo.status === 'in_progress'
        );
        
        console.log(`   📈 Completed: ${completedFromAll.length}`);
        console.log(`   ⏳ Pending: ${pendingFromAll.length}`);
        console.log(`   🔄 In Progress: ${inProgressFromAll.length}`);
        
        // Show details of completed work orders
        if (completedFromAll.length > 0) {
            console.log('\n🎯 Completed Work Orders Details:');
            completedFromAll.forEach((wo, index) => {
                console.log(`   ${index + 1}. ID: ${wo.id || wo.work_order_id} | PCB: ${wo.pcb_assembly || wo.pcb_type} | Status: ${wo.status}`);
                console.log(`      WorkOrderId: ${wo.workOrderId || wo.work_order_id || 'N/A'}`);
                console.log(`      Completed At: ${wo.completed_at || wo.completedAt || 'N/A'}`);
            });
        }
        
        // Test 2: Get specifically completed work orders
        console.log('\n📊 Test 2: Fetching specifically completed work orders...');
        const completedResponse = await fetch(`${API_BASE_URL}/work-order/?status=Completed`);
        if (!completedResponse.ok) {
            throw new Error(`HTTP ${completedResponse.status}: ${completedResponse.statusText}`);
        }
        const completedOrders = await completedResponse.json();
        
        console.log(`✅ Completed work orders (direct): ${completedOrders.length}`);
        
        // Also try lowercase
        console.log('\n📊 Test 2b: Fetching completed work orders (lowercase)...');
        const completedResponseLower = await fetch(`${API_BASE_URL}/work-order/?status=completed`);
        if (completedResponseLower.ok) {
            const completedOrdersLower = await completedResponseLower.json();
            console.log(`✅ Completed work orders (lowercase): ${completedOrdersLower.length}`);
        }
        
        if (completedOrders.length > 0) {
            console.log('\n🎯 Direct Completed Work Orders Details:');
            completedOrders.forEach((wo, index) => {
                console.log(`   ${index + 1}. ID: ${wo.id || wo.work_order_id} | PCB: ${wo.pcb_assembly || wo.pcb_type} | Status: ${wo.status}`);
                console.log(`      Assembly Type: ${wo.assembly_type || wo.assemblyType || 'N/A'}`);
                console.log(`      WorkOrderId: ${wo.workOrderId || wo.work_order_id || 'N/A'}`);
            });
        }
        
        // Test 3: Check for YBS-specific completed work orders
        console.log('\n📊 Test 3: Looking for YBS-specific completed work orders...');
        const ybsCompleted = completedFromAll.filter(wo => 
            (wo.pcb_assembly && wo.pcb_assembly.startsWith('5YB')) ||
            (wo.pcb_type && wo.pcb_type.startsWith('5YB')) ||
            (wo.assembly_type && wo.assembly_type.toLowerCase().includes('ybs'))
        );
        
        console.log(`✅ YBS Completed work orders: ${ybsCompleted.length}`);
        
        if (ybsCompleted.length > 0) {
            console.log('\n🎯 YBS Completed Work Orders Details:');
            ybsCompleted.forEach((wo, index) => {
                console.log(`   ${index + 1}. ID: ${wo.id || wo.work_order_id} | PCB: ${wo.pcb_assembly || wo.pcb_type}`);
                console.log(`      WorkOrderId: ${wo.workOrderId || wo.work_order_id || 'N/A'}`);
                console.log(`      Assembly Type: ${wo.assembly_type || wo.assemblyType || 'N/A'}`);
                console.log(`      Status: ${wo.status}`);
                console.log(`      Completed At: ${wo.completed_at || wo.completedAt || 'N/A'}`);
            });
        } else {
            console.log('⚠️  No YBS completed work orders found in API response');
            console.log('   This might explain why they are not showing in the UI');
        }
        
        // Test 4: Check recent database updates
        console.log('\n📊 Test 4: Checking recent work order updates...');
        const recentOrders = allWorkOrders
            .filter(wo => wo.updated_at || wo.updatedAt)
            .sort((a, b) => new Date(b.updated_at || b.updatedAt) - new Date(a.updated_at || a.updatedAt))
            .slice(0, 5);
            
        if (recentOrders.length > 0) {
            console.log('🕒 Most recently updated work orders:');
            recentOrders.forEach((wo, index) => {
                console.log(`   ${index + 1}. ID: ${wo.id || wo.work_order_id} | Status: ${wo.status} | Updated: ${wo.updated_at || wo.updatedAt}`);
                console.log(`      PCB: ${wo.pcb_assembly || wo.pcb_type}`);
            });
        }
        
        console.log('\n✅ API Tests Complete');
        console.log('=' .repeat(60));
        
        // Summary
        console.log('\n📋 SUMMARY:');
        console.log(`   • Total work orders: ${allWorkOrders.length}`);
        console.log(`   • Completed (from all): ${completedFromAll.length}`);
        console.log(`   • Completed (direct API): ${completedOrders.length}`);
        console.log(`   • YBS Completed: ${ybsCompleted.length}`);
        
        if (ybsCompleted.length === 0) {
            console.log('\n⚠️  ISSUE IDENTIFIED:');
            console.log('   YBS completed work orders are not being returned by the API.');
            console.log('   This explains why they are not showing in the Dashboard/Reports UI.');
            console.log('   The work order completion in YBS backend may not be updating the status correctly.');
        } else {
            console.log('\n✅ YBS completed work orders are available via API.');
            console.log('   The frontend should be able to display them.');
        }
        
    } catch (error) {
        console.error('❌ Error testing completed work orders API:', error.message);
        
        if (error.message.includes('fetch')) {
            console.log('\n💡 Suggestion: Make sure the backend server is running on port 3000');
            console.log('   Run: npm run server or python manage.py runserver');
        }
    }
}

// Run the test
if (require.main === module) {
    testCompletedWorkOrdersAPI();
}

module.exports = { testCompletedWorkOrdersAPI };
