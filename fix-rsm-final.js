const fs = require('fs');
const path = require('path');

// RSM files to fix
const rsmFiles = [
    'frontend/src/pages/RSM/5RS011027.html',
    'frontend/src/pages/RSM/5RS011028.html', 
    'frontend/src/pages/RSM/5RS011075.html',
    'frontend/src/pages/RSM/5RS011076.html',
    'frontend/src/pages/RSM/5RS011092.html',
    'frontend/src/pages/RSM/5RS011093.html',
    'frontend/src/pages/RSM/5RS011111.html',
    'frontend/src/pages/RSM/5RS011112.html',
    'frontend/src/pages/RSM/default.html'
];

function fixRSMFile(filePath) {
    console.log(`Processing ${filePath}...`);
    
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix malformed template literals and syntax errors
    content = content.replace(/\}: \$\{/g, '} ${');
    content = content.replace(/^\s*\}: /gm, '        console.log(`Work Order ${workOrder.work_order_number || workOrder.id');
    
    // Fix duplicate variable declarations by using different variable names
    let allScannedCounter = 1;
    content = content.replace(/const allScanned =/g, () => `const allScanned${allScannedCounter++} =`);
    
    let assemblyEntryCounter = 1;
    content = content.replace(/const assemblyEntry =/g, () => `const assemblyEntry${assemblyEntryCounter++} =`);
    
    // Fix orphaned closing braces and catch blocks
    content = content.replace(/^\s*\} catch \(error\) \{[^}]*\}\s*$/gm, '');
    content = content.replace(/^\s*\}\s*$/gm, '');
    content = content.replace(/^\s*\} else \{[^}]*\}\s*$/gm, '');
    
    // Remove malformed async function declarations within arrays
    content = content.replace(/,\s*async function initialize\(\) \{[\s\S]*?\}\s*,/g, ',');
    content = content.replace(/,\s*initialize\(\);\s*,/g, ',');
    
    // Comprehensive assembly completion function - replace any existing implementations
    const newCompleteAssemblyFunction = `
        async function completeAssembly() {
            console.log('🎯 Starting assembly completion process...');
            
            // Get assembly ID from multiple sources with debug logging
            let assemblyId = getUrlParameter('id') || getUrlParameter('assemblyId') || window.currentAssemblyId;
            console.log('🔍 Assembly ID sources:', {
                urlId: getUrlParameter('id'),
                urlAssemblyId: getUrlParameter('assemblyId'), 
                windowId: window.currentAssemblyId,
                finalId: assemblyId
            });
            
            if (!assemblyId) {
                console.error('❌ No assembly ID found for completion');
                showMessage('Error: No assembly ID found', 'error');
                return;
            }
            
            try {
                console.log('📝 Starting assembly completion for ID:', assemblyId);
                
                // Get current component state
                const componentData = {};
                const componentCodes = [];
                
                // Collect component codes from the DOM and component mapping
                if (window.componentMapping) {
                    Object.keys(window.componentMapping).forEach(code => {
                        componentCodes.push(code);
                        componentData[code] = window.componentMapping[code];
                    });
                }
                
                // Also check for component codes in the DOM
                document.querySelectorAll('[data-component-code]').forEach(el => {
                    const code = el.getAttribute('data-component-code');
                    if (code && !componentCodes.includes(code)) {
                        componentCodes.push(code);
                    }
                });
                
                console.log('🔧 Component codes found:', componentCodes);
                console.log('📋 Component data:', componentData);
                
                // Prepare completion data
                const completionData = {
                    status: 'completed',
                    component_codes: componentCodes,
                    completed_at: new Date().toISOString(),
                    assembly_data: componentData
                };
                
                console.log('📤 Sending completion data:', completionData);
                
                // Call the API to complete the assembly
                const response = await fetch(\`/api/assembly-process/\${assemblyId}/\`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify(completionData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('❌ Assembly completion failed:', errorData);
                    throw new Error(\`Failed to complete assembly: \${errorData.detail || response.statusText}\`);
                }
                
                const completedAssembly = await response.json();
                console.log('✅ Assembly completed successfully:', completedAssembly);
                
                // Update work order status and quantity
                if (completedAssembly.work_order) {
                    await moveWorkOrderToCompleted(completedAssembly.work_order, completedAssembly);
                }
                
                // Update localStorage with completed assembly info
                const completedAssemblies = JSON.parse(localStorage.getItem('completedAssemblies') || '[]');
                const assemblyRecord = {
                    id: assemblyId,
                    assembly_id: assemblyId,
                    pcb_type: completedAssembly.pcb_type || 'RSM',
                    component_codes: componentCodes,
                    completed_at: new Date().toISOString(),
                    work_order_id: completedAssembly.work_order
                };
                
                completedAssemblies.push(assemblyRecord);
                localStorage.setItem('completedAssemblies', JSON.stringify(completedAssemblies));
                console.log('💾 Saved to localStorage:', assemblyRecord);
                
                // Show completion screen with proper data
                showCompletionScreen(assemblyRecord);
                
            } catch (error) {
                console.error('❌ Error completing assembly:', error);
                showMessage(\`Error completing assembly: \${error.message}\`, 'error');
            }
        }
        
        async function moveWorkOrderToCompleted(workOrderId, assemblyData) {
            try {
                console.log('📋 Moving work order to completed:', workOrderId);
                
                // Get current work order
                const workOrderResponse = await fetch(\`/api/work-orders/\${workOrderId}/\`);
                if (!workOrderResponse.ok) {
                    throw new Error('Failed to fetch work order');
                }
                
                const workOrder = await workOrderResponse.json();
                console.log('📄 Current work order:', workOrder);
                
                // Calculate new completed quantity
                const newCompletedQuantity = (workOrder.completed_quantity || 0) + 1;
                const isFullyCompleted = newCompletedQuantity >= workOrder.quantity;
                
                console.log('🔢 Quantity update:', {
                    current: workOrder.completed_quantity || 0,
                    total: workOrder.quantity,
                    newCompleted: newCompletedQuantity,
                    isFullyCompleted
                });
                
                // Update work order
                const updateData = {
                    completed_quantity: newCompletedQuantity,
                    status: isFullyCompleted ? 'completed' : 'in_progress'
                };
                
                const updateResponse = await fetch(\`/api/work-orders/\${workOrderId}/\`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify(updateData)
                });
                
                if (updateResponse.ok) {
                    const updatedWorkOrder = await updateResponse.json();
                    console.log('✅ Work order updated:', updatedWorkOrder);
                    
                    if (isFullyCompleted) {
                        showMessage(\`Work Order \${workOrder.work_order_number || workOrder.id} completed! All \${workOrder.quantity} units finished.\`, 'success');
                    } else {
                        showMessage(\`Work Order \${workOrder.work_order_number || workOrder.id}: \${newCompletedQuantity}/\${workOrder.quantity} units completed\`, 'info');
                    }
                } else {
                    console.error('❌ Failed to update work order');
                    showMessage('Warning: Assembly completed but work order update failed', 'warning');
                }
                
            } catch (error) {
                console.error('❌ Error updating work order:', error);
                showMessage('Warning: Assembly completed but work order update failed', 'warning');
            }
        }
        
        function showCompletionScreen(assemblyData) {
            console.log('🎉 Showing completion screen with data:', assemblyData);
            
            const completionHtml = \`
                <div class="completion-container">
                    <div class="completion-card">
                        <div class="completion-header">
                            <div class="success-icon">✅</div>
                            <h2>Assembly Completed Successfully!</h2>
                        </div>
                        
                        <div class="completion-details">
                            <div class="detail-row">
                                <span class="label">Assembly ID:</span>
                                <span class="value">\${assemblyData.assembly_id || assemblyData.id}</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="label">PCB Type:</span>
                                <span class="value">\${assemblyData.pcb_type || 'RSM'}</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="label">Component Codes:</span>
                                <span class="value">\${assemblyData.component_codes ? assemblyData.component_codes.join(', ') : 'None'}</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="label">Completed At:</span>
                                <span class="value">\${new Date(assemblyData.completed_at).toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <div class="completion-actions">
                            <button onclick="startNewAssembly()" class="btn btn-primary">
                                Start New Assembly
                            </button>
                            <button onclick="goBack()" class="btn btn-secondary">
                                Back to Assembly List
                            </button>
                        </div>
                    </div>
                </div>
            \`;
            
            // Hide the main assembly interface
            const mainContent = document.querySelector('.container, .main-content, body > div');
            if (mainContent) {
                mainContent.style.display = 'none';
            }
            
            // Show completion screen
            document.body.insertAdjacentHTML('beforeend', completionHtml);
        }
        
        function startNewAssembly() {
            // Go back to assembly selection
            if (window.parent && window.parent.location) {
                window.parent.location.href = '/assembly';
            } else {
                window.location.href = '/assembly';
            }
        }
        
        function goBack() {
            // Go back to previous page
            if (window.parent && window.parent.history) {
                window.parent.history.back();
            } else {
                window.history.back();
            }
        }`;
    
    // Remove any existing completeAssembly function and replace with new one
    content = content.replace(/async function completeAssembly\(\)[^{]*\{[\s\S]*?^        \}/gm, '');
    content = content.replace(/function completeAssembly\(\)[^{]*\{[\s\S]*?^        \}/gm, '');
    
    // Insert the new function before the closing script tag
    content = content.replace(/(\s*<\/script>)/, newCompleteAssemblyFunction + '\n$1');
    
    // Ensure getUrlParameter function exists
    if (!content.includes('function getUrlParameter(')) {
        const getUrlParameterFunction = `
        function getUrlParameter(name) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name);
        }`;
        content = content.replace(/(\s*<\/script>)/, getUrlParameterFunction + '\n$1');
    }
    
    // Ensure getCookie function exists  
    if (!content.includes('function getCookie(')) {
        const getCookieFunction = `
        function getCookie(name) {
            let cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }`;
        content = content.replace(/(\s*<\/script>)/, getCookieFunction + '\n$1');
    }
    
    // Ensure showMessage function exists
    if (!content.includes('function showMessage(')) {
        const showMessageFunction = `
        function showMessage(message, type = 'info') {
            console.log(\`\${type.toUpperCase()}: \${message}\`);
            
            // Create or update message element
            let messageEl = document.getElementById('message-display');
            if (!messageEl) {
                messageEl = document.createElement('div');
                messageEl.id = 'message-display';
                messageEl.style.cssText = \`
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    border-radius: 4px;
                    color: white;
                    font-weight: bold;
                    z-index: 10000;
                    max-width: 300px;
                \`;
                document.body.appendChild(messageEl);
            }
            
            // Set message and styling
            messageEl.textContent = message;
            messageEl.className = \`message-\${type}\`;
            
            // Set background color based on type
            const colors = {
                success: '#28a745',
                error: '#dc3545', 
                warning: '#ffc107',
                info: '#17a2b8'
            };
            messageEl.style.backgroundColor = colors[type] || colors.info;
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 5000);
        }`;
        content = content.replace(/(\s*<\/script>)/, showMessageFunction + '\n$1');
    }
    
    // Fix any remaining syntax issues
    content = content.replace(/^\s*\}\s*$/gm, ''); // Remove orphaned closing braces
    content = content.replace(/\n\n\n+/g, '\n\n'); // Clean up extra newlines
    
    // Write the fixed content back to file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
}

// Process all RSM files
rsmFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    fixRSMFile(fullPath);
});

console.log('🎉 All RSM files have been fixed!');
console.log('\nKey fixes applied:');
console.log('- Fixed duplicate variable declarations');
console.log('- Cleaned up malformed syntax and template literals');
console.log('- Added comprehensive assembly completion logic');
console.log('- Ensured proper assembly ID retrieval');
console.log('- Added component code collection and display');
console.log('- Fixed work order quantity and status updates');
console.log('- Added proper error handling and user feedback');
console.log('- Ensured all helper functions are present');
