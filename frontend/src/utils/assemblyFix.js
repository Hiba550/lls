// Assembly ID Fix Script
// This script fixes the assembly ID parameter mismatch issue

function fixAssemblyIdParameter() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check if assemblyId parameter exists but id parameter doesn't
    const assemblyId = urlParams.get('assemblyId');
    const id = urlParams.get('id');
    
    if (assemblyId && !id) {
        // Add the id parameter to match the existing function expectations
        urlParams.set('id', assemblyId);
        
        // Update the URL without reloading the page
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.replaceState({}, '', newUrl);
        
        console.log(`Fixed assembly ID parameter: assemblyId=${assemblyId} -> id=${assemblyId}`);
        return assemblyId;
    }
    
    return id || assemblyId;
}

// Universal function to get assembly ID that works with both parameter names
function getUniversalAssemblyId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('assemblyId') || urlParams.get('id');
}

// Clear localStorage function to remove stale data
function clearStaleAssemblyData() {
    const keys = [
        'currentYBSAssemblyId',
        'currentRSMAssemblyId', 
        'currentSensorIndex',
        'pendingYBSAssemblies',
        'pendingRSMAssemblies'
    ];
    
    keys.forEach(key => {
        localStorage.removeItem(key);
    });
    
    console.log('Cleared stale assembly data from localStorage');
}

// Function to verify if an assembly ID exists on the server
async function verifyAssemblyExists(assemblyId) {
    if (!assemblyId) return false;
    
    try {
        const response = await fetch(`/api/assembly-process/${assemblyId}/`);
        return response.ok;
    } catch (error) {
        console.error('Error verifying assembly exists:', error);
        return false;
    }
}

// Enhanced assembly ID getter with validation
async function getValidAssemblyId() {
    let assemblyId = getUniversalAssemblyId();
    
    if (assemblyId) {
        const exists = await verifyAssemblyExists(assemblyId);
        if (exists) {
            return assemblyId;
        } else {
            console.warn(`Assembly ID ${assemblyId} does not exist on server`);
            // Clear the invalid ID from localStorage
            localStorage.removeItem('currentYBSAssemblyId');
            localStorage.removeItem('currentRSMAssemblyId');
            return null;
        }
    }
    
    return null;
}

// Export functions for use in assembly pages
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fixAssemblyIdParameter,
        getUniversalAssemblyId,
        clearStaleAssemblyData,
        verifyAssemblyExists,
        getValidAssemblyId
    };
} else {
    // Make functions available globally in browser
    window.AssemblyFix = {
        fixAssemblyIdParameter,
        getUniversalAssemblyId,
        clearStaleAssemblyData,
        verifyAssemblyExists,
        getValidAssemblyId
    };
}
