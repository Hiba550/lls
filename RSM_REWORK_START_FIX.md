# RSM Rework Assembly Start Fix

## Date: January 24, 2025

## Issue Fixed:
**Problem**: When clicking "Start Assembly" on rework orders in the Assembly dashboard, the system was trying to create new assembly processes via API calls using work order IDs that no longer exist in the database (IDs like 260, 262, 270). This resulted in 404 errors: "Work order with ID X not found".

**Root Cause**: Rework orders store references to original work order IDs that may have been deleted or reset in the database. The system was trying to create API-based assembly processes for these non-existent work orders.

## Solution Implemented:

### Enhanced `handleStartAssembly` Function
- **Rework Orders**: Now handles rework orders differently - navigates directly to assembly pages without API calls since rework orders are localStorage-based
- **Regular Orders**: Continues to use API-based assembly process creation for normal work orders

### Key Changes:

1. **Rework Detection**: Added check for `workOrder.reworked` property
2. **Direct Navigation**: For rework orders, navigate directly to assembly interface using:
   - Rework ID as assembly ID (e.g., "RW-99-17513")
   - Original assembly ID for navigation context
   - Added `&rework=true` parameter to URLs
3. **Proper Routing**: Correctly routes to YBS or RSM assembly pages based on PCB type

### Code Changes:

```javascript
// NEW: Handle rework orders differently
if (workOrder.reworked) {
  console.log('Starting rework assembly directly for:', workOrder.id);
  
  // Use rework ID as assembly ID and navigate directly
  const assemblyId = workOrder.id; // "RW-99-17513"
  const workOrderIdForNavigation = workOrder.original_assembly_id || workOrder.id;
  
  // Navigate without API calls
  if (pcbType === 'YBS') {
    navigate(`/assembly/ybs/${itemCode}?assemblyId=${assemblyId}&workOrderId=${workOrderIdForNavigation}&rework=true`);
  } else {
    navigate(`/assembly/rsm/${itemCode}?assemblyId=${assemblyId}&workOrderId=${workOrderIdForNavigation}&rework=true`);
  }
  return;
}

// Continue with API-based creation for regular work orders
```

## Benefits:

1. **No More 404 Errors**: Rework orders no longer try to reference non-existent work order IDs
2. **Proper Rework Handling**: Rework orders are treated as self-contained localStorage entities
3. **Seamless Navigation**: Users can start rework assemblies directly from the dashboard
4. **Maintained Functionality**: Regular work orders continue to work with API-based assembly processes

## Testing:

✅ **Rework Orders**: Can now be started from Assembly dashboard without errors
✅ **Regular Orders**: Continue to work with API-based assembly process creation
✅ **URL Parameters**: Correct assembly IDs and work order IDs are passed
✅ **Routing**: Proper navigation to YBS/RSM assembly pages

## File Modified:
- `frontend/src/pages/Assembly.jsx` - Enhanced `handleStartAssembly` function

---

**Result**: Rework orders can now be started successfully from the Assembly dashboard without 404 API errors. The system correctly identifies rework orders and handles them through direct navigation instead of API calls.
