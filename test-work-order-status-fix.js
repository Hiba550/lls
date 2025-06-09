/**
 * Test YBS Work Order Status Fix
 * Tests that work orders are properly marked as "Completed" (with capital C) when YBS assemblies are completed
 */

const API_BASE = 'http://localhost:8000/api';

class WorkOrderStatusTest {
    constructor() {
        this.testResults = [];
    }

    async testWorkOrderStatusUpdate() {
        console.log('🧪 Testing YBS Work Order Status Update Fix...\n');

        try {
            // 1. Test that completed assemblies exist
            await this.testCompletedAssembliesExist();

            // 2. Test work order status values
            await this.testWorkOrderStatusValues();

            // 3. Test API consistency
            await this.testAPIConsistency();

            // 4. Display results
            this.displayResults();

        } catch (error) {
            console.error('❌ Test setup failed:', error);
        }
    }

    async testCompletedAssembliesExist() {
        try {
            console.log('📊 Testing: Completed assemblies exist...');
            
            const response = await fetch(`${API_BASE}/assembly-process/?status=completed`);
            const data = await response.json();
            
            const completedCount = data.results ? data.results.length : 0;
            console.log(`✅ Found ${completedCount} completed assemblies`);
            
            if (completedCount > 0) {
                // Check if these are YBS assemblies
                const ybsAssemblies = data.results.filter(assembly => 
                    assembly.item_code && (
                        assembly.item_code.includes('YBS') || 
                        assembly.item_code.includes('5YB')
                    )
                );
                console.log(`✅ Found ${ybsAssemblies.length} YBS completed assemblies`);
                
                this.testResults.push({
                    test: 'Completed Assemblies Exist',
                    status: 'PASS',
                    details: `${completedCount} total, ${ybsAssemblies.length} YBS`
                });
            } else {
                this.testResults.push({
                    test: 'Completed Assemblies Exist',
                    status: 'FAIL',
                    details: 'No completed assemblies found'
                });
            }
        } catch (error) {
            console.error('❌ Error testing completed assemblies:', error);
            this.testResults.push({
                test: 'Completed Assemblies Exist',
                status: 'ERROR',
                details: error.message
            });
        }
    }

    async testWorkOrderStatusValues() {
        try {
            console.log('\n📊 Testing: Work order status values...');
            
            const response = await fetch(`${API_BASE}/work-order/`);
            const data = await response.json();
            const workOrders = data.results || data;
            
            // Count different status values
            const statusCounts = {};
            workOrders.forEach(wo => {
                const status = wo.status || 'undefined';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            });

            console.log('📊 Work Order Status Distribution:');
            Object.entries(statusCounts).forEach(([status, count]) => {
                console.log(`   ${status}: ${count}`);
            });

            // Check for the correct "Completed" status
            const completedCount = statusCounts['Completed'] || 0;
            const completedLowercase = statusCounts['completed'] || 0;
            
            if (completedCount > 0) {
                console.log(`✅ Found ${completedCount} work orders with "Completed" status (correct case)`);
                this.testResults.push({
                    test: 'Work Order Status Case',
                    status: 'PASS',
                    details: `${completedCount} "Completed", ${completedLowercase} "completed"`
                });
            } else if (completedLowercase > 0) {
                console.log(`⚠️ Found ${completedLowercase} work orders with "completed" status (wrong case)`);
                this.testResults.push({
                    test: 'Work Order Status Case',
                    status: 'FAIL',
                    details: `0 "Completed", ${completedLowercase} "completed" - case mismatch`
                });
            } else {
                console.log('⚠️ No completed work orders found with either case');
                this.testResults.push({
                    test: 'Work Order Status Case',
                    status: 'FAIL',
                    details: 'No completed work orders found'
                });
            }

        } catch (error) {
            console.error('❌ Error testing work order status:', error);
            this.testResults.push({
                test: 'Work Order Status Values',
                status: 'ERROR',
                details: error.message
            });
        }
    }

    async testAPIConsistency() {
        try {
            console.log('\n📊 Testing: API consistency between assemblies and work orders...');
            
            // Get completed assemblies
            const assemblyResponse = await fetch(`${API_BASE}/assembly-process/?status=completed`);
            const assemblyData = await assemblyResponse.json();
            const completedAssemblies = assemblyData.results || [];

            // Get work orders
            const workOrderResponse = await fetch(`${API_BASE}/work-order/`);
            const workOrderData = await workOrderResponse.json();
            const workOrders = workOrderData.results || workOrderData;

            // Map work order IDs to their status
            const workOrderStatusMap = {};
            workOrders.forEach(wo => {
                workOrderStatusMap[wo.id] = wo.status;
            });

            // Check consistency
            let consistentCount = 0;
            let inconsistentCount = 0;
            const inconsistentDetails = [];

            completedAssemblies.forEach(assembly => {
                const workOrderId = assembly.work_order_id || (assembly.work_order && assembly.work_order.id);
                if (workOrderId) {
                    const workOrderStatus = workOrderStatusMap[workOrderId];
                    if (workOrderStatus === 'Completed') {
                        consistentCount++;
                    } else {
                        inconsistentCount++;
                        inconsistentDetails.push({
                            assemblyId: assembly.id,
                            workOrderId: workOrderId,
                            workOrderStatus: workOrderStatus
                        });
                    }
                }
            });

            console.log(`✅ Consistent: ${consistentCount} assemblies have work orders with "Completed" status`);
            console.log(`❌ Inconsistent: ${inconsistentCount} assemblies have work orders with other status`);

            if (inconsistentCount > 0) {
                console.log('\n🔍 Inconsistent Examples:');
                inconsistentDetails.slice(0, 5).forEach(detail => {
                    console.log(`   Assembly ${detail.assemblyId} -> Work Order ${detail.workOrderId} (status: "${detail.workOrderStatus}")`);
                });
            }

            this.testResults.push({
                test: 'Assembly-WorkOrder Consistency',
                status: inconsistentCount === 0 ? 'PASS' : 'FAIL',
                details: `${consistentCount} consistent, ${inconsistentCount} inconsistent`
            });

        } catch (error) {
            console.error('❌ Error testing API consistency:', error);
            this.testResults.push({
                test: 'API Consistency',
                status: 'ERROR',
                details: error.message
            });
        }
    }

    displayResults() {
        console.log('\n' + '='.repeat(80));
        console.log('📋 TEST RESULTS SUMMARY');
        console.log('='.repeat(80));

        this.testResults.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
            console.log(`${icon} ${result.test}: ${result.status}`);
            console.log(`   ${result.details}`);
        });

        const passCount = this.testResults.filter(r => r.status === 'PASS').length;
        const totalCount = this.testResults.length;

        console.log('\n' + '='.repeat(80));
        console.log(`📊 OVERALL: ${passCount}/${totalCount} tests passed`);
        
        if (passCount === totalCount) {
            console.log('🎉 All tests passed! YBS work order status fix is working correctly.');
        } else {
            console.log('⚠️ Some tests failed. The work order status fix may need additional work.');
        }
    }
}

// Run the test
const test = new WorkOrderStatusTest();
test.testWorkOrderStatusUpdate().catch(console.error);
