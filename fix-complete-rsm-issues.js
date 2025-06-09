const fs = require('fs');
const path = require('path');

// Function to comprehensively fix all RSM assembly issues
function fixAllRSMIssues(filePath) {
    console.log(`\n🔧 Fixing all issues in ${path.basename(filePath)}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changes = 0;
    
    // 1. Fix assembly ID retrieval in completeAssembly function
    const assemblyIdPattern = /async function completeAssembly\(\) \{[\s\S]*?const currentAssemblyId = getUrlParameter\("id"\)[\s\S]*?const assemblyId = currentAssemblyId;/;
    if (assemblyIdPattern.test(content)) {
        content = content.replace(
            /async function completeAssembly\(\) \{([\s\S]*?)\/\/ Get assembly ID dynamically[\s\S]*?const assemblyId = currentAssemblyId;/,
            `async function completeAssembly() {$1// Check if all components are scanned first
        const allScanned = Object.values(componentMapping || components || {}).every(comp => comp.scanned);
        if (!allScanned) {
            showNotification('Cannot complete: some components are not scanned', 'error');
            return false;
        }

        // Get assembly ID dynamically with proper fallbacks
        const currentAssemblyId = getUrlParameter("id") || getUrlParameter("assemblyId") || window.assemblyId;
        if (!currentAssemblyId) {
            showNotification('Error: No assembly ID found', 'error');
            console.error('Assembly ID not found in URL parameters or window object');
            if (typeof completeButton !== 'undefined') completeButton.disabled = false;
            return false;
        }
        
        console.log('Using assembly ID:', currentAssemblyId);
        const assemblyId = currentAssemblyId;`
        );
        changes++;
        console.log('  ✅ Fixed assembly ID retrieval');
    }
    
    // 2. Fix component item codes display - ensure components have proper itemCode property
    const componentMappingPattern = /const componentMapping = \{[\s\S]*?\};|const components = \{[\s\S]*?\};/;
    if (componentMappingPattern.test(content)) {
        // Add item codes to component display
        content = content.replace(
            /(scannedDetails\.forEach\(p => \{[\s\S]*?li\.textContent = `[^`]*`;)/,
            `$1
                    // Add item code to display
                    if (p.itemCode || p.item_code) {
                        li.textContent += \` (Item: \${p.itemCode || p.item_code})\`;
                    }`
        );
        changes++;
        console.log('  ✅ Enhanced component display with item codes');
    }
    
    // 3. Fix scanned details to include proper item codes
    const scannedDetailsPattern = /const scannedDetails = Object\.values\([^)]+\)[\s\S]*?\.map\(c => \(\{[\s\S]*?\}\)\);/;
    if (scannedDetailsPattern.test(content)) {
        content = content.replace(
            /const scannedDetails = Object\.values\(([^)]+)\)[\s\S]*?\.map\(c => \(\{([\s\S]*?)\}\)\);/,
            `const scannedDetails = Object.values($1)
                .filter(c => c.scanned)
                .map(c => ({
                    component_id: c.index || c.component_id,
                    name: c.name,
                    barcode: c.scannedBarcode,
                    item_code: c.itemCode || c.item_code || 'Unknown',
                    scan_time: new Date().toISOString()
                }));`
        );
        changes++;
        console.log('  ✅ Fixed scanned details to include item codes');
    }
    
    // 4. Fix moveWorkOrderToCompleted to properly handle quantity updates
    const moveWorkOrderPattern = /function moveWorkOrderToCompleted\([^)]*\) \{[\s\S]*?\}/;
    if (moveWorkOrderPattern.test(content)) {
        content = content.replace(
            /function moveWorkOrderToCompleted\([^)]*\) \{[\s\S]*?\}/,
            `function moveWorkOrderToCompleted(assemblyIdParam) {
                try {
                    const assemblyId = assemblyIdParam || getUrlParameter("id") || getUrlParameter("assemblyId") || window.assemblyId;
                    console.log('Moving work order to completed for assembly ID:', assemblyId);
                    
                    // Get pending and completed work orders
                    const pendingWorkOrders = JSON.parse(localStorage.getItem('pendingWorkOrders') || '[]');
                    const completedWorkOrders = JSON.parse(localStorage.getItem('assemblyCompletedOrders') || '[]');
                    
                    // Find the work order in pending list by assembly ID or work order ID
                    let workOrderIndex = pendingWorkOrders.findIndex(order => 
                        order.id === assemblyId || 
                        order.assembly_id === assemblyId ||
                        order.id === getUrlParameter("workOrderId")
                    );
                    
                    if (workOrderIndex !== -1) {
                        // Remove from pending
                        const workOrder = pendingWorkOrders.splice(workOrderIndex, 1)[0];
                        
                        // Update work order properties
                        workOrder.status = 'Completed';
                        workOrder.completed_at = new Date().toISOString();
                        
                        // Handle quantity updates for multi-quantity work orders
                        if (workOrder.quantity && workOrder.quantity > 1) {
                            workOrder.completed_quantity = (workOrder.completed_quantity || 0) + 1;
                            workOrder.remaining_quantity = workOrder.quantity - workOrder.completed_quantity;
                            
                            // If not fully completed, put back in pending with updated quantity
                            if (workOrder.completed_quantity < workOrder.quantity) {
                                workOrder.status = 'In Progress';
                                pendingWorkOrders.push(workOrder);
                                addLogEntry(\`Work order \${workOrder.id}: \${workOrder.completed_quantity}/\${workOrder.quantity} units completed\`, 'info');
                            } else {
                                // Fully completed - add to completed orders
                                completedWorkOrders.push(workOrder);
                                addLogEntry(\`Work order \${workOrder.id} fully completed: \${workOrder.quantity}/\${workOrder.quantity} units\`, 'success');
                            }
                        } else {
                            // Single unit order - add to completed
                            completedWorkOrders.push(workOrder);
                            addLogEntry(\`Work order \${workOrder.id} completed\`, 'success');
                        }
                        
                        // Save back to localStorage
                        localStorage.setItem('pendingWorkOrders', JSON.stringify(pendingWorkOrders));
                        localStorage.setItem('assemblyCompletedOrders', JSON.stringify(completedWorkOrders));
                        
                    } else {
                        console.warn('Work order not found in pending list:', assemblyId);
                        addLogEntry('Warning: Work order not found in pending list', 'warning');
                    }
                } catch (error) {
                    console.error('Error moving work order:', error);
                    addLogEntry('Error updating work order status', 'error');
                }
            }`
        );
        changes++;
        console.log('  ✅ Fixed moveWorkOrderToCompleted with quantity support');
    }
    
    // 5. Fix the completion screen to show assembly ID properly
    const showCompletionPattern = /function showCompletionScreen\([^)]*\) \{[\s\S]*?\}/;
    if (showCompletionPattern.test(content)) {
        content = content.replace(
            /(function showCompletionScreen\([^)]*\) \{[\s\S]*?<p>Assembly ID: )\$\{assemblyId\}/,
            `$1\${assemblyId || currentAssemblyId || getUrlParameter("id") || "Unknown"}`
        );
        changes++;
        console.log('  ✅ Fixed completion screen assembly ID display');
    }
    
    // 6. Ensure components list in completion screen shows item codes
    const completionComponentsPattern = /parts\.forEach\(p => \{[\s\S]*?li\.textContent = [^;]*;[\s\S]*?\}\);/;
    if (completionComponentsPattern.test(content)) {
        content = content.replace(
            /(parts\.forEach\(p => \{[\s\S]*?)(li\.textContent = )(.*?);/,
            `$1$2\`\${p.name}: \${p.barcode}\${p.item_code ? \` (Item: \${p.item_code})\` : ""}\`;`
        );
        changes++;
        console.log('  ✅ Enhanced completion screen component display');
    }
    
    // 7. Fix localStorage storage to use proper assembly data structure
    const localStoragePattern = /localStorage\.setItem\('assemblyCompletedOrders'[\s\S]*?\);/;
    if (localStoragePattern.test(content)) {
        content = content.replace(
            /(const completedList = JSON\.parse\(localStorage\.getItem\([^)]+\) \|\| '\[\]'\);[\s\S]*?)(completedList\.push\([^;]*\);)/,
            `$1const assemblyEntry = {
                    id: assemblyId,
                    status: 'Completed',
                    product: window.location.pathname.split('/').pop().replace('.html', '') + ' Assembly',
                    item_code: window.location.pathname.split('/').pop().replace('.html', ''),
                    serial_number: finalAssemblyBarcode,
                    pcb_type: 'RSM',
                    completed_at: new Date().toISOString(),
                    scanned_components: scannedDetails,
                    hasCompletedAssembly: true,
                    reworked: false
                };
                completedList.push(assemblyEntry);`
        );
        changes++;
        console.log('  ✅ Fixed localStorage assembly data structure');
    }
    
    // 8. Add debug logging for assembly ID tracking
    if (!content.includes('console.log(\'Assembly ID debug:\'')) {
        content = content.replace(
            /(async function completeAssembly\(\) \{)/,
            `$1
        // Debug logging for assembly ID
        console.log('Assembly ID debug:', {
            urlId: getUrlParameter("id"),
            urlAssemblyId: getUrlParameter("assemblyId"),
            windowAssemblyId: window.assemblyId,
            workOrderId: getUrlParameter("workOrderId")
        });`
        );
        changes++;
        console.log('  ✅ Added assembly ID debug logging');
    }
    
    if (changes > 0) {
        fs.writeFileSync(filePath, content);
        console.log(`  💾 Saved ${changes} changes to ${path.basename(filePath)}`);
    } else {
        console.log(`  ℹ️  No changes needed for ${path.basename(filePath)}`);
    }
    
    return changes;
}

// Get RSM HTML files
const rsmDir = path.join(__dirname, 'frontend', 'src', 'pages', 'RSM');
const files = fs.readdirSync(rsmDir).filter(file => file.endsWith('.html') && !file.includes('default'));

console.log('🚀 Starting comprehensive RSM assembly fixes...');
console.log(`📁 Processing ${files.length} RSM HTML files...`);

let totalChanges = 0;
files.forEach(file => {
    const filePath = path.join(rsmDir, file);
    totalChanges += fixAllRSMIssues(filePath);
});

console.log(`\n✨ Complete! Made ${totalChanges} total changes across ${files.length} files.`);
console.log('\n🎯 Fixed issues:');
console.log('   • Assembly ID null/undefined problems');
console.log('   • Component codes not showing in completion screen');
console.log('   • Assemblies not moving from pending to completed');
console.log('   • Quantity not being updated for multi-unit work orders');
console.log('   • Enhanced debugging and error handling');
