/**
 * Simple test to fetch completed work orders and understand the exact structure
 */

async function testCompletedWorkOrders() {
    try {
        console.log('Testing completed work orders API...');
        
        const response = await fetch('http://localhost:8000/api/work-order/?status=Completed');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const workOrders = Array.isArray(data) ? data : data.results || [];
        
        console.log(`\nFound ${workOrders.length} completed work orders:`);
        
        workOrders.forEach((order, index) => {
            console.log(`\n${index + 1}. Work Order Details:`);
            console.log(JSON.stringify(order, null, 2));
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testCompletedWorkOrders();
