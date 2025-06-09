/**
 * Detailed YBS Assembly Investigation
 * Deep dive into what assemblies exist and their work order relationships
 */

const API_BASE = 'http://localhost:8000/api';

class YBSAssemblyInvestigation {
    constructor() {
        this.completedAssemblies = [];
        this.workOrders = [];
    }

    async investigate() {
        console.log('🔍 Deep Investigation: YBS Assembly and Work Order Status...\n');

        try {
            await this.fetchCompletedAssemblies();
            await this.fetchWorkOrders();
            await this.analyzeAssemblies();
            await this.checkWorkOrderRelationships();
            await this.provideSolution();
        } catch (error) {
            console.error('❌ Investigation failed:', error);
        }
    }

    async fetchCompletedAssemblies() {
        try {
            console.log('📊 Fetching completed assemblies...');
            const response = await fetch(`${API_BASE}/assembly-process/?status=completed`);
            const data = await response.json();
            this.completedAssemblies = data.results || [];
            console.log(`✅ Found ${this.completedAssemblies.length} completed assemblies`);
        } catch (error) {
            console.error('❌ Error fetching completed assemblies:', error);
        }
    }

    async fetchWorkOrders() {
        try {
            console.log('📊 Fetching work orders...');
            const response = await fetch(`${API_BASE}/work-order/`);
            const data = await response.json();
            this.workOrders = data.results || data;
            console.log(`✅ Found ${this.workOrders.length} work orders`);
            
            // Show status distribution
            const statusCounts = {};
            this.workOrders.forEach(wo => {
                const status = wo.status || 'undefined';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            });
            console.log('📊 Work Order Status Distribution:', statusCounts);
        } catch (error) {
            console.error('❌ Error fetching work orders:', error);
        }
    }

    async analyzeAssemblies() {
        console.log('\n🔍 Analyzing completed assemblies...');
        
        if (this.completedAssemblies.length === 0) {
            console.log('⚠️ No completed assemblies found');
            return;
        }

        // Analyze first 10 assemblies
        const samplesToAnalyze = this.completedAssemblies.slice(0, 10);
        
        console.log('\n📋 Assembly Details:');
        samplesToAnalyze.forEach((assembly, index) => {
            console.log(`\n${index + 1}. Assembly ID: ${assembly.id}`);
            console.log(`   Item Code: ${assembly.item_code || 'N/A'}`);
            console.log(`   Product: ${assembly.product || 'N/A'}`);
            console.log(`   PCB Type: ${assembly.pcb_type || 'N/A'}`);
            console.log(`   Work Order ID: ${assembly.work_order_id || 'N/A'}`);
            console.log(`   Work Order: ${assembly.work_order ? JSON.stringify(assembly.work_order) : 'N/A'}`);
            console.log(`   Status: ${assembly.status}`);
            console.log(`   Completed At: ${assembly.completed_at || 'N/A'}`);
            
            // Check if this is YBS
            const isYBS = this.isYBSAssembly(assembly);
            console.log(`   Is YBS: ${isYBS ? '✅' : '❌'}`);
        });
    }

    async checkWorkOrderRelationships() {
        console.log('\n🔍 Checking work order relationships...');
        
        // Create a map of work order IDs to work orders
        const workOrderMap = {};
        this.workOrders.forEach(wo => {
            workOrderMap[wo.id] = wo;
        });

        console.log('\n📋 Assembly -> Work Order Mapping:');
        this.completedAssemblies.slice(0, 10).forEach((assembly, index) => {
            const workOrderId = assembly.work_order_id || (assembly.work_order && assembly.work_order.id);
            const workOrder = workOrderMap[workOrderId];
            
            console.log(`\n${index + 1}. Assembly ${assembly.id}:`);
            console.log(`   Work Order ID: ${workOrderId || 'MISSING'}`);
            if (workOrder) {
                console.log(`   Work Order Status: ${workOrder.status}`);
                console.log(`   Work Order Product: ${workOrder.product || 'N/A'}`);
                console.log(`   Work Order Item Code: ${workOrder.item_code || 'N/A'}`);
                console.log(`   Completed Quantity: ${workOrder.completed_quantity || 0}/${workOrder.quantity || 'N/A'}`);
                
                // Check if work order should be marked as completed
                const shouldBeCompleted = (workOrder.completed_quantity || 0) >= (workOrder.quantity || 1);
                console.log(`   Should be completed: ${shouldBeCompleted ? '✅' : '❌'}`);
                
                if (shouldBeCompleted && workOrder.status !== 'Completed') {
                    console.log(`   ⚠️ STATUS MISMATCH: Should be "Completed" but is "${workOrder.status}"`);
                }
            } else {
                console.log(`   ❌ Work Order NOT FOUND`);
            }
        });
    }

    async provideSolution() {
        console.log('\n' + '='.repeat(80));
        console.log('💡 SOLUTION ANALYSIS');
        console.log('='.repeat(80));

        // Check if there are YBS assemblies
        const ybsAssemblies = this.completedAssemblies.filter(assembly => this.isYBSAssembly(assembly));
        console.log(`\n📊 YBS Assembly Count: ${ybsAssemblies.length} out of ${this.completedAssemblies.length} total`);

        if (ybsAssemblies.length === 0) {
            console.log('\n🔍 ISSUE IDENTIFIED: No YBS assemblies found in completed assemblies');
            console.log('   Possible causes:');
            console.log('   1. YBS assemblies are not being marked as completed');
            console.log('   2. YBS assemblies are not being saved to the database');
            console.log('   3. YBS detection logic is incorrect');
            console.log('   4. No YBS assemblies have been completed yet');
        } else {
            console.log('\n✅ YBS assemblies found in database');
            
            // Check their work orders
            const ybsWorkOrderIds = ybsAssemblies.map(assembly => 
                assembly.work_order_id || (assembly.work_order && assembly.work_order.id)
            ).filter(id => id);
            
            const uniqueYbsWorkOrderIds = [...new Set(ybsWorkOrderIds)];
            const completedYbsWorkOrders = uniqueYbsWorkOrderIds.filter(woId => {
                const wo = this.workOrders.find(w => w.id === woId);
                return wo && wo.status === 'Completed';
            });
            
            console.log(`\n📊 YBS Work Order Analysis:`);
            console.log(`   Total YBS work orders referenced: ${uniqueYbsWorkOrderIds.length}`);
            console.log(`   YBS work orders marked "Completed": ${completedYbsWorkOrders.length}`);
            
            if (completedYbsWorkOrders.length < uniqueYbsWorkOrderIds.length) {
                console.log('\n⚠️ ISSUE IDENTIFIED: YBS work orders not properly marked as "Completed"');
            }
        }

        console.log('\n🔧 RECOMMENDED ACTIONS:');
        console.log('1. Complete a YBS assembly to test the new status update logic');
        console.log('2. Check the YBS backend status update code is using "Completed" (capital C)');
        console.log('3. Verify that work order quantity updates are working correctly');
        console.log('4. Test the Assembly.jsx completed work orders tab after completing a YBS assembly');
    }

    isYBSAssembly(assembly) {
        // Check multiple possible indicators
        const itemCode = assembly.item_code || '';
        const product = assembly.product || '';
        const pcbType = assembly.pcb_type || '';
        
        return itemCode.includes('YBS') || 
               itemCode.includes('5YB') ||
               product.includes('YBS') ||
               pcbType === 'YBS' ||
               pcbType === 'ybs';
    }
}

// Run the investigation
const investigation = new YBSAssemblyInvestigation();
investigation.investigate().catch(console.error);
