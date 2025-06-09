# YBS Assembly System Documentation

## Overview
The YBS (York Building System) assembly process manages the assembly verification of YBS Machine Circuit Board Layouts. Similar to the RSM system, it follows a structured component and sensor scanning workflow with real-time validation.

## YBS Assembly Types and Item Code Mappings

### Supported YBS Assembly Types

#### 1. 5YB011056 - YBS Machine - Duct Number 41 - 23 Duct Assembly
- **Title**: "YBS Machine - Duct Number 41 - 23 Duct Assembly"
- **Sensors**: 23 magnetic coil sensors (numbered 1-23)
- **Layout**: 8 left PCB sensors + 8 master PCB sensors + 7 right PCB sensors

#### 2. 5YB011057 - YBS Assembly Verification
- **Title**: "Interactive YBS Machine Circuit Board Layout - Assembly Verification"
- **Layout**: Standard YBS PCB configuration with 24 sensors

#### 3. 5YB011059 - YBS Assembly - 25 Duct Assembly
- **Title**: "YBS Machine - Duct Number 41 - 25 Duct Assembly"
- **Sensors**: 25 magnetic coil sensors
- **Layout**: 8 left PCB + 9 master PCB + 8 right PCB sensors

#### 4. 5YB011099 - YBS Assembly - 23 Duct Assembly
- **Title**: "YBS Machine - Duct Number 41 - 23 Duct Assembly"
- **Sensors**: 23 magnetic coil sensors
- **Layout**: 8 left PCB + 8 master PCB + 7 right PCB sensors

#### 5. 5YB011100 - YBS Assembly - 24 Duct Assembly
- **Title**: "YBS Machine - Duct Number 41 - 24 Duct Assembly"
- **Sensors**: 24 magnetic coil sensors
- **Layout**: 8 left PCB + 8 master PCB + 8 right PCB sensors

#### 6. 5YB011101 - YBS Assembly - 25 Duct Assembly
- **Title**: "YBS Machine - Duct Number 41 - 25 Duct Assembly"
- **Sensors**: 25 magnetic coil sensors
- **Layout**: 8 left PCB + 9 master PCB + 8 right PCB sensors

#### 7. 5YB011111 - YBS Assembly - 23 Duct Assembly
- **Title**: "YBS Machine - Duct Number 41 - 23 Duct Assembly"
- **Sensors**: 23 magnetic coil sensors
- **Layout**: 8 left PCB + 8 master PCB + 7 right PCB sensors

#### 8. 5YB011112 - YBS Assembly - 24 Duct Assembly
- **Title**: "YBS Machine - Duct Number 41 - 24 Duct Assembly"
- **Sensors**: 24 magnetic coil sensors
- **Layout**: 8 left PCB + 8 master PCB + 8 right PCB sensors

#### 9. 5YB011113 - YBS Assembly - 25 Duct Assembly
- **Title**: "YBS Machine - Duct Number 41 - 25 Duct Assembly"
- **Sensors**: 25 magnetic coil sensors
- **Layout**: 8 left PCB + 9 master PCB + 8 right PCB sensors

#### 10. 5YB011446 - YBS REGULAR ILI DUCT ASSEMBLY - 23 SPINDLES - V1
- **Title**: "YBS REGULAR ILI DUCT ASSEMBLY - 23 SPINDLES - V1"
- **Sensors**: 23 magnetic coil sensors
- **Layout**: Advanced YBS configuration

#### 11. 5YB011447 - YBS REGULAR ILI DUCT ASSEMBLY - 24 SPINDLES - V1
- **Title**: "YBS REGULAR ILI DUCT ASSEMBLY - 24 SPINDLES - V1"
- **Sensors**: 24 magnetic coil sensors
- **Layout**: Advanced YBS configuration

#### 12. 5YB011448 - YBS REGULAR ILI DUCT ASSEMBLY - 24 SPINDLES - V1
- **Title**: "YBS REGULAR ILI DUCT ASSEMBLY - 24 SPINDLES - V1"
- **Sensors**: 24 magnetic coil sensors
- **Layout**: Advanced YBS configuration

## Component Mappings

### PCB Components (Sequence 1-3):
```javascript
{
    "left_pcb": {
        barcode: "V22CL0065",
        name: "Left Slave PCB",
        itemCode: "4YB013250",
        verificationCode: "24"
    },
    "master_pcb": {
        barcode: "V22C80087", 
        name: "Master PCB",
        itemCode: "4YB013248",
        verificationCode: "25"
    },
    "right_pcb": {
        barcode: "V22CR0129",
        name: "Right Slave PCB", 
        itemCode: "4YB013251",
        verificationCode: "3Q4"
    }
}
```

### Connection Components (Sequence 4-5):
```javascript
{
    "b2b_left_master": {
        barcode: "P22BV0584",
        name: "Board-to-Board (Left to Master)",
        itemCode: "4YB013258",
        verificationCode: "O"
    },
    "b2b_master_right": {
        barcode: "P22BV0476", 
        name: "Board-to-Board (Master to Right)",
        itemCode: "4YB013258",
        verificationCode: "P"
    }
}
```

### Power & Communication Cable (Sequence 6):
```javascript
{
    "pc_cable": {
        barcode: "P22AQ0131",
        name: "Power & Communication Cable", 
        itemCode: "4YB013254",
        verificationCode: "J"
    }
}
```

## Sensor Mappings (Sequence 7-29)

### Sensor Item Codes:
- **Sensors 1 & 16**: Item Code `5YB013255` (Special sensors)
- **Sensors 2-15 & 17-23**: Item Code `5YB013254` (Standard sensors)

### Sensor Verification Codes:
- **Sensors 1-12**: Verification code "1"
- **Sensors 13-22**: Verification code "2"  
- **Sensor 23**: No verification code (auto-passes)

### Sensor Barcode Mappings:
```javascript
{
    1: "R22J200177",
    2: "R22J102367", 
    3: "R22J102368",
    4: "R22J102440",
    5: "R22J102371",
    6: "R22J102389",
    7: "R22J102390",
    8: "R22J102391",
    9: "R22J102392",
    10: "R22J102393",
    11: "R22J102394",
    12: "R22J102395",
    13: "R22J102396",
    14: "R22J102397",
    15: "R22J102398",
    16: "R22J102399",
    17: "R22J102400",
    18: "R22J102401",
    19: "R22J102402",
    20: "R22J102403",
    21: "R22J102404",
    22: "R22J102405",
    23: "R22J102406"
}
```

## Item Code Mapping System

The YBS backend now dynamically loads the correct item codes based on the detected assembly type. Each YBS assembly has its own specific component and sensor item codes that exist in the item master database.

### Component Item Codes by Assembly Type:

**5YB011056:**
- Left PCB: `4YB013250`
- Master PCB: `4YB013248` 
- Right PCB: `4YB013251`
- Board-to-Board: `4YB013258`
- Power Cable: `4YB013254`
- Special Sensors (1,16): `5YB013255`
- Standard Sensors: `5YB013254`

**5YB011057:**
- Similar to 5YB011056 but Power Cable: `4YB013255`
- Special Sensors (1,16,24): `5YB013255`

**5YB011059:**
- Master PCB: `4YB013249` (different from 056)
- Power Cable: `4YB013256`
- Special Sensors (1,16,17,22,23,24,25): `5YB013255`

**5YB011099-5YB011113 Series:**
- Right PCB: `4YB013271` (updated)
- Various Power Cable codes: `TYB012092`, `TYB012093`, `TYB012094`
- Board-to-Board: `4YB013275` (for 111x series)
- Sensor codes: `5YB013257` (special), `5YB013256` (standard) for 0xx series
- Sensor codes: `5YB013263` (special), `5YB013262` (standard) for 111x series

**5YB011446-5YB011448 Series:**
- Master PCB: `4YB013307`, `4YB013308`
- Board-to-Board: `4YB013323`
- Power Cable: `4YB013317`, `4YB013318`, `4YB013319`
- Multiple sensor types: `5YB013286`, `5YB013285`, `5YB013284`

### Backend Integration:

The YBS backend manager (`ybs_backend.js`) includes:
- `getYBSItemCodes(ybsType)` method that returns correct codes for each assembly
- `loadInventoryData(ybsType)` method that accepts the assembly type parameter
- Automatic detection of YBS type from filename/URL
- Proper error handling for missing item codes

### Assembly Logs:

When item codes are successfully fetched, the assembly logs will show:
- ✅ Component count and sensor type count loaded
- 📋 Detailed fetch results for each item code
- Item codes mapped to their scanning verification codes
- Success/failure status for each API fetch

This ensures that the YBS system uses only existing item codes from the database and provides detailed logging of the inventory data loading process.

## Assembly Process Flow

### Phase 1: Component Scanning (Sequence 1-6)
1. **Left PCB** - Must scan barcode with verification code "24"
2. **Master PCB** - Must scan barcode with verification code "25"
3. **Right PCB** - Must scan barcode with verification code "3Q4"
4. **Board-to-Board (Left-Master)** - Must scan barcode with verification code "O"
5. **Board-to-Board (Master-Right)** - Must scan barcode with verification code "P"
6. **Power & Communication Cable** - Must scan barcode with verification code "J"

### Phase 2: Sensor Scanning (Sequence 7-29)
- Sensors must be scanned in sequential order (1-23)
- Each sensor has a specific barcode that must match
- Verification codes are validated based on sensor position
- Progress tracking shows completion percentage

## Verification Logic

### Component Code Validation:
- **Position-based**: Verification codes are checked at specific positions in barcodes
- **1-character codes**: Check position 5 (index 4)
- **2-character codes**: Check positions 5-6 (indices 4-5)  
- **3-character codes**: Check positions 5-7 (indices 4-6)

### Special Cases:
- **Right PCB**: Searches for "3Q4" pattern anywhere in barcode
- **Master PCB**: Searches for "25" pattern anywhere in barcode
- **Sensor 23**: No verification required (auto-passes)

## API Integration

### Endpoints Used:
- `GET /api/assembly-process/{id}/` - Load assembly state
- `PATCH /api/assembly-process/{id}/` - Update assembly progress  
- `POST /api/assembly-process/` - Create new assembly
- `GET /api/work-order/` - Fetch work orders
- `GET /api/item-master/?search={itemCode}` - Get verification codes

### Data Structure:
```javascript
{
    id: "assembly_id",
    work_order: "work_order_id", 
    status: "in_progress|completed",
    current_sensor_index: 1-29,
    metadata: {
        current_sequence_index: 1-29,
        scanned_sensors: [
            {
                id: sensor_id,
                barcode: "scanned_barcode",
                scan_time: "ISO_timestamp"
            }
        ],
        scanned_parts: [...] // Component and sensor details
    }
}
```

## URL Parameters

### Required Parameters:
- `assemblyId` or `id` - Existing assembly to continue
- `workOrderId` - Work order for new assembly creation

### Example URLs:
- Continue assembly: `/ybs/5YB011056.html?assemblyId=123`
- New assembly: `/ybs/5YB011056.html?workOrderId=456`

## Local Storage Management

### Keys Used:
- `currentYBSAssemblyId` - Current assembly being worked on
- `currentSensorIndex` - Current position in scanning sequence
- `scannedSensors` - Backup of scanned data
- `scannedBarcodes_{assemblyId}` - Prevent duplicate scanning

## Error Handling

### Common Error Scenarios:
1. **Duplicate Barcode**: Same barcode scanned twice
2. **Wrong Component**: Scanned component doesn't match expected sequence
3. **Wrong Sensor**: Scanned sensor doesn't match expected position
4. **API Failures**: Network or server errors
5. **Missing Assembly ID**: No assembly context available

### Recovery Mechanisms:
- LocalStorage backup for offline operation
- Assembly restart functionality
- Error logging and notification system
- Graceful degradation when API unavailable

## Completion Process

### Steps:
1. Validate all 29 items scanned (6 components + 23 sensors)
2. Generate 11-digit assembly barcode with "24" in positions 5-6
3. Update assembly status to "completed"
4. Store detailed scan history
5. Update work order quantities
6. Move from pending to completed work orders
7. Display completion screen with generated barcode

### Generated Barcode Format:
- **Format**: `XXXX24XXXXX` (11 digits total)
- **Positions 5-6**: Always "24" for YBS assemblies
- **Other positions**: Random digits

## UI Components

### Main Elements:
- Circuit board visualization table
- Component highlighting system
- Sensor progress tracking
- Barcode input and scanning interface
- Progress bar and percentage display
- Assembly logs and history
- Completion and restart controls

### Visual States:
- **Next**: Yellow highlight for next item to scan
- **Success**: Green background for completed items
- **Error**: Red flash for scanning errors
- **Pulse**: Animated highlighting for current target

## UI Element Identification

### Dynamic Title Element
- **Class**: `.board-to-board-title`
- **Purpose**: Shows current scanning status
- **Various IDs used**:
  - `scanningTitle` (5YB011099)
  - `scanning-status-title` (5YB011100)
  - `scanningStatusTitle` (5YB011112)
  - `scanningInstructions` (5YB011113)
  - Default: `.board-to-board-title` (most files)

### Status Messages for Board-to-Board Title
```javascript
{
    "ready": "Ready to Start Assembly",
    "scanning_component": "Scan {componentName}",
    "component_success": "✅ {componentName} scanned successfully",
    "component_invalid": "❌ Invalid barcode for {componentName}",
    "component_duplicate": "⚠️ Duplicate barcode detected",
    "scanning_sensor": "Scan Sensor #{sensorNumber}",
    "sensor_success": "✅ Sensor #{sensorNumber} scanned successfully", 
    "sensor_invalid": "❌ Invalid sensor barcode",
    "sensor_duplicate": "⚠️ Duplicate sensor barcode",
    "assembly_complete": "🎉 Assembly Complete!",
    "api_failure": "⚠️ API Connection Failed - Check Network",
    "item_codes_loaded": "📋 Item codes loaded: {itemCodes}",
    "item_codes_failed": "❌ Failed to load item codes: {errorMessage}"
}
```

### Assembly Progress Indicators
- **Progress Bar**: `#progressFill`
- **Progress Percentage**: `#progressPercentage`
- **Logs Container**: `#logsContent`

## API Integration

### Endpoints Used
- `POST /api/pcb-assemblies/` - Create new assembly
- `GET /api/pcb-assemblies/{id}/` - Get assembly details
- `PATCH /api/pcb-assemblies/{id}/` - Update assembly
- `GET /api/inventory/` - Fetch item codes and verification
- `POST /api/work-orders/{id}/complete/` - Complete work order

### Error Handling
- **Network failures**: Display connection status in board-to-board title
- **Invalid barcodes**: Show specific error messages
- **Duplicate scanning**: Warn user with visual feedback
- **Assembly completion**: Handle quantity management and progression

## Key Features Implementation

### 1. Dynamic Board-to-Board Title Updates
- Shows current scanning component/sensor
- Indicates scan success/failure with emojis
- Displays completion status
- Shows API connection status
- Indicates item code loading status

### 2. Visual Component Highlighting
- Highlight current component to scan
- Success/error visual feedback
- Progress indication

### 3. Barcode Validation
- Real-time validation against database
- Duplicate detection
- Component-specific verification codes

### 4. Assembly Completion
- Automatic progression to next assembly
- Quantity management
- Database logging
- Work order completion

## Browser Compatibility
- Modern browsers with ES6+ support
- JsBarcode library for barcode generation
- CSS Grid and Flexbox for responsive layout
- LocalStorage for data persistence

## Security Considerations
- Barcode validation prevents incorrect assemblies
- Duplicate prevention ensures data integrity
- Assembly state persistence prevents data loss
- API authentication integration ready

## Future Enhancements
- Multi-language support
- Mobile device optimization
- Advanced reporting features
- Integration with production systems
- Quality control checkpoints
