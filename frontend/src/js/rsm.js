/**
 * Universal RSM Assembly Script
 * Handles all RSM PCB assembly types with standardized logic
 * Version: 2.1 - Refactored with Backend Manager
 * 
 * Features:
 * - Auto-detects RSM type from filename or URL
 * - Configurable component mappings per RSM type
 * - Unified barcode scanning and validation
 * - Assembly completion with quantity management
 * - Automatic next assembly progression
 * - Database integration for logging
 * - Component barcode tracking
 * - Separated backend operations via RSMBackendManager
 */

class RSMAssemblyManager {
    constructor() {
        this.API_URL = '/api';
        this.assemblyId = null;
        this.workOrderId = null;
        this.currentRSMType = null;
        this.componentMapping = {};
        this.scannedBarcodes = new Set();
        this.inventoryDataLoaded = false;
        this.apiConnected = false;
        
        // Initialize backend manager - will be created after backend script loads
        this.backendManager = null;
        
        // UI Elements
        this.uiElements = {};
        
        // Configuration for different RSM types
        this.rsmConfigurations = {
            '5RS011027': {
                name: 'RSM Assembly - 5RS011027',
                subtitle: '3Slave 1Master 70 mm',
                title: 'RAP - ILI DUCT ASSEMBLY',
                components: {
                    'slave_pcb_1': {
                        itemCode: '4RS013097',
                        name: 'Slave PCB 1',
                        cssSelector: '.left-pcb',
                        index: 0,
                        sequence: 1
                    },
                    'slave_pcb_2': {
                        itemCode: '4RS013097',
                        name: 'Slave PCB 2',
                        cssSelector: '.left-pcb',
                        index: 1,
                        sequence: 2
                    },
                    'slave_pcb_3': {
                        itemCode: '4RS013097',
                        name: 'Slave PCB 3',
                        cssSelector: '.left-pcb',
                        index: 2,
                        sequence: 3
                    },
                    'master_pcb': {
                        itemCode: '4RS013114',
                        name: 'Master PCB',
                        cssSelector: '.master-pcb',
                        index: 0,
                        sequence: 4
                    },
                    's2s_cable_1': {
                        itemCode: '4RS013120',
                        name: 'Slave to Slave Cable 1',
                        cssSelector: '.board-to-board',
                        index: 0,
                        sequence: 5
                    },
                    's2s_cable_2': {
                        itemCode: '4RS013120',
                        name: 'Slave to Slave Cable 2',
                        cssSelector: '.board-to-board',
                        index: 1,
                        sequence: 6
                    },
                    'm2s_cable': {
                        itemCode: '4RS013121',
                        name: 'Master to Slave Cable',
                        cssSelector: '.board-to-board',
                        index: 2,
                        sequence: 7
                    },
                    'pc_cable': {
                        itemCode: '4RS013122',
                        name: 'Power & Communication Cable',
                        cssSelector: '.power-cable',
                        index: 0,
                        sequence: 8
                    }
                }
            },
            '5RS011028': {
                name: 'RSM Assembly - 5RS011028',
                subtitle: '6Slave 36 mm',
                title: 'RAP - ILI DUCT ASSEMBLY',
                components: {
                    'slave_pcb_1': {
                        itemCode: '4RS013097',
                        name: 'Slave PCB 1',
                        cssSelector: '.left-pcb',
                        index: 0,
                        sequence: 1
                    },
                    'slave_pcb_2': {
                        itemCode: '4RS013097',
                        name: 'Slave PCB 2',
                        cssSelector: '.left-pcb',
                        index: 1,
                        sequence: 2
                    },
                    'slave_pcb_3': {
                        itemCode: '4RS013097',
                        name: 'Slave PCB 3',
                        cssSelector: '.left-pcb',
                        index: 2,
                        sequence: 3
                    },
                    's2s_cable_1': {
                        itemCode: '4RS013120',
                        name: 'Slave to Slave Cable 1',
                        cssSelector: '.board-to-board',
                        index: 0,
                        sequence: 4
                    },
                    's2s_cable_2': {
                        itemCode: '4RS013120',
                        name: 'Slave to Slave Cable 2',
                        cssSelector: '.board-to-board',
                        index: 1,
                        sequence: 5
                    },
                    'pc_cable': {
                        itemCode: '4RS013122',
                        name: 'Power & Communication Cable',
                        cssSelector: '.power-cable',
                        index: 0,
                        sequence: 6
                    }
                }
            },
            '5RS011075': {
                name: 'RSM Assembly - 5RS011075',
                subtitle: '1Master 3Slave 75 mm',
                title: 'RAP - ILI DUCT ASSEMBLY',
                components: {
                    'slave_pcb_1': {
                        itemCode: '4RS013097',
                        name: 'Slave PCB 1',
                        cssSelector: '.slave-pcb',
                        index: 0,
                        sequence: 1
                    },
                    'slave_pcb_2': {
                        itemCode: '4RS013097',
                        name: 'Slave PCB 2',
                        cssSelector: '.slave-pcb',
                        index: 1,
                        sequence: 2
                    },
                    'slave_pcb_3': {
                        itemCode: '4RS013097',
                        name: 'Slave PCB 3',
                        cssSelector: '.slave-pcb',
                        index: 2,
                        sequence: 3
                    },
                    's2s_cable_1': {
                        itemCode: '4RS013147',
                        name: 'Slave to Slave Cable 1',
                        cssSelector: '.board-to-board',
                        index: 0,
                        sequence: 4
                    },
                    's2s_cable_2': {
                        itemCode: '4RS013147',
                        name: 'Slave to Slave Cable 2',
                        cssSelector: '.board-to-board',
                        index: 1,
                        sequence: 5
                    },
                    'pc_cable': {
                        itemCode: '4RS013146',
                        name: 'Power & Communication Cable',
                        cssSelector: '.power-cable',
                        index: 0,
                        sequence: 6
                    }
                }
            },
            '5RS011076': {
                name: 'RSM Assembly - 5RS011076',
                subtitle: '3Slave 75 mm',
                title: 'RAP - ILI DUCT ASSEMBLY',
                components: {
                    'slave_pcb_1': {
                        itemCode: '4RS013097',
                        name: 'Slave PCB 1',
                        cssSelector: '.left-pcb',
                        index: 0,
                        sequence: 1
                    },
                    'slave_pcb_2': {
                        itemCode: '4RS013097',
                        name: 'Slave PCB 2',
                        cssSelector: '.left-pcb',
                        index: 1,
                        sequence: 2
                    },
                    'slave_pcb_3': {
                        itemCode: '4RS013097',
                        name: 'Slave PCB 3',
                        cssSelector: '.left-pcb',
                        index: 2,
                        sequence: 3
                    },
                    's2s_cable_1': {
                        itemCode: '4RS013147',
                        name: 'Slave to Slave Cable 1',
                        cssSelector: '.board-to-board',
                        index: 0,
                        sequence: 4
                    },
                    's2s_cable_2': {
                        itemCode: '4RS013147',
                        name: 'Slave to Slave Cable 2',
                        cssSelector: '.board-to-board',
                        index: 1,
                        sequence: 5
                    },
                    'pc_cable': {
                        itemCode: '4RS013146',
                        name: 'Power & Communication Cable',
                        cssSelector: '.power-cable',
                        index: 0,
                        sequence: 6
                    }
                }
            },
            '5RS011092': {
                name: 'RSM Assembly - 5RS011092',
                subtitle: '3Slave 92 mm',
                title: 'RAP - ILI DUCT ASSEMBLY',
                components: {
                    'slave_pcb_1': {
                        itemCode: '4RS013152',
                        name: 'Slave PCB 1',
                        cssSelector: '.slave-pcb',
                        index: 0,
                        sequence: 1
                    },
                    'slave_pcb_2': {
                        itemCode: '4RS013152',
                        name: 'Slave PCB 2',
                        cssSelector: '.slave-pcb',
                        index: 1,
                        sequence: 2
                    },
                    'slave_pcb_3': {
                        itemCode: '4RS013152',
                        name: 'Slave PCB 3',
                        cssSelector: '.slave-pcb',
                        index: 2,
                        sequence: 3
                    },
                    's2s_cable_1': {
                        itemCode: '4RS013134',
                        name: 'Slave to Slave Cable 1',
                        cssSelector: '.board-to-board-yellow',
                        index: 0,
                        sequence: 4
                    },
                    's2s_cable_2': {
                        itemCode: '4RS013134',
                        name: 'Slave to Slave Cable 2',
                        cssSelector: '.board-to-board-yellow',
                        index: 1,
                        sequence: 5
                    },
                    'pc_cable': {
                        itemCode: '4RS013124',
                        name: 'Power & Communication Cable',
                        cssSelector: '.power-cable',
                        index: 0,
                        sequence: 6
                    }
                }
            },
            '5RS011093': {
                name: 'RSM Assembly - 5RS011093',
                subtitle: '2Slave 93 mm',
                title: 'RAP - ILI DUCT ASSEMBLY',
                components: {
                    'slave_pcb_1': {
                        itemCode: '4RS013152',
                        name: 'Slave PCB 1',
                        cssSelector: '.left-pcb',
                        index: 0,
                        sequence: 1
                    },
                    'slave_pcb_2': {
                        itemCode: '4RS013152',
                        name: 'Slave PCB 2',
                        cssSelector: '.left-pcb',
                        index: 1,
                        sequence: 2
                    },
                    's2s_cable': {
                        itemCode: '4RS013134',
                        name: 'Slave to Slave Cable',
                        cssSelector: '.board-to-board-yellow',
                        index: 0,
                        sequence: 3
                    },
                    'pc_cable': {
                        itemCode: '4RS013124',
                        name: 'Power & Communication Cable',
                        cssSelector: '.power-cable',
                        index: 0,
                        sequence: 4
                    }
                }
            },
            '5RS011111': {
                name: 'RSM Assembly - 5RS011111',
                subtitle: '3Slave 1Master 1Right 111 mm',
                title: 'RAP - ILI DUCT ASSEMBLY',
                components: {
                    'slave_pcb_1': {
                        itemCode: '4RS013097',
                        name: 'Slave PCB 1',
                        cssSelector: '.left-pcb',
                        index: 0,
                        sequence: 1
                    },
                    'slave_pcb_2': {
                        itemCode: '4RS013097',
                        name: 'Slave PCB 2',
                        cssSelector: '.left-pcb',
                        index: 1,
                        sequence: 2
                    },
                    'slave_pcb_3': {
                        itemCode: '4RS013097',
                        name: 'Slave PCB 3',
                        cssSelector: '.left-pcb',
                        index: 2,
                        sequence: 3
                    },
                    'master_pcb': {
                        itemCode: '4RS013114',
                        name: 'Master PCB',
                        cssSelector: '.master-pcb',
                        index: 0,
                        sequence: 4
                    },
                    's2s_cable_1': {
                        itemCode: '4RS013120',
                        name: 'Slave to Slave Cable 1',
                        cssSelector: '.board-to-board',
                        index: 0,
                        sequence: 5
                    },
                    's2s_cable_2': {
                        itemCode: '4RS013120',
                        name: 'Slave to Slave Cable 2',
                        cssSelector: '.board-to-board',
                        index: 1,
                        sequence: 6
                    },
                    'master_to_right': {
                        itemCode: '4RS013121',
                        name: 'Master to Right Cable',
                        cssSelector: '.master-to-right',
                        index: 0,
                        sequence: 7
                    },
                    'pc_cable': {
                        itemCode: '4RS013122',
                        name: 'Power & Communication Cable',
                        cssSelector: '.power-cable',
                        index: 0,
                        sequence: 8
                    }
                }
            },
            '5RS011112': {
                name: 'RSM Assembly - 5RS011112',
                subtitle: '3Slave 112 mm',
                title: 'RAP - ILI DUCT ASSEMBLY',
                components: {
                    'slave_pcb_1': {
                        itemCode: '4RS013097',
                        name: 'Slave PCB 1',
                        cssSelector: '.left-pcb',
                        index: 0,
                        sequence: 1
                    },
                    'slave_pcb_2': {
                        itemCode: '4RS013097',
                        name: 'Slave PCB 2',
                        cssSelector: '.left-pcb',
                        index: 1,
                        sequence: 2
                    },
                    'slave_pcb_3': {
                        itemCode: '4RS013097',
                        name: 'Slave PCB 3',
                        cssSelector: '.left-pcb',
                        index: 2,
                        sequence: 3
                    },
                    's2s_cable_1': {
                        itemCode: '4RS013120',
                        name: 'Slave to Slave Cable 1',
                        cssSelector: '.board-to-board',
                        index: 0,
                        sequence: 4
                    },
                    's2s_cable_2': {
                        itemCode: '4RS013120',
                        name: 'Slave to Slave Cable 2',
                        cssSelector: '.board-to-board',
                        index: 1,
                        sequence: 5
                    },
                    'pc_cable': {
                        itemCode: '4RS013122',
                        name: 'Power & Communication Cable',
                        cssSelector: '.power-cable',
                        index: 0,
                        sequence: 6
                    }
                }
            }
        };
    }

    /**
     * Initialize the RSM assembly process
     */    async init() {
        try {
            console.log('🚀 Initializing RSM Assembly Manager...');
            
            // Initialize backend manager
            this.initializeBackendManager();
            
            // Auto-detect RSM type
            this.detectRSMType();
            
            // Load configuration
            this.loadConfiguration();
            
            // Get assembly and work order IDs
            this.extractURLParameters();
            
            // Initialize UI elements
            this.initializeUIElements();
            
            // Setup component mapping
            this.setupComponentMapping();
            
            // Setup event listeners
            this.setupEventListeners();
              // Fetch component codes from API
            await this.fetchComponentCodes();
            
            // Initialize scanning process
            this.highlightNextComponent();
            
            // Update page title and info
            this.updatePageInfo();
            
            console.log('✅ RSM Assembly Manager initialized successfully');
            console.log('📋 Assembly ID:', this.assemblyId);
            console.log('📋 Work Order ID:', this.workOrderId);
            console.log('🔧 RSM Type:', this.currentRSMType);
            
            return true;
        } catch (error) {
            console.error('❌ Error initializing RSM Assembly Manager:', error);
            this.showNotification('Initialization failed: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * Initialize backend manager
     */
    async initializeBackendManager() {
        try {
            // Check if RSMBackendManager is available globally
            if (typeof window !== 'undefined' && window.RSMBackendManager) {
                this.backendManager = new window.RSMBackendManager(this.API_URL);
                await this.backendManager.testApiConnection();
                this.apiConnected = this.backendManager.apiConnected;
                console.log('🔗 Backend manager initialized, API connected:', this.apiConnected);
            } else {
                console.warn('⚠️ RSMBackendManager not available, running in frontend-only mode');
                // Create a minimal backend interface for compatibility
                this.backendManager = {
                    logAssemblyAction: (action, data) => {
                        console.log('📝 Assembly Action (frontend-only):', action, data);
                    },
                    testApiConnection: async () => false,
                    apiConnected: false
                };
            }
        } catch (error) {
            console.error('❌ Error initializing backend manager:', error);
            // Fallback to minimal backend interface
            this.backendManager = {
                logAssemblyAction: (action, data) => {
                    console.log('📝 Assembly Action (fallback):', action, data);
                },
                testApiConnection: async () => false,
                apiConnected: false
            };
        }
    }

    /**
     * Auto-detect RSM type from filename or URL parameter
     */
    detectRSMType() {
        // First try from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        let rsmType = urlParams.get('rsmType') || urlParams.get('itemCode');
        
        // If not in URL, try to extract from filename
        if (!rsmType) {
            const pathParts = window.location.pathname.split('/');
            const filename = pathParts[pathParts.length - 1];
            
            // Extract RSM code from filename (e.g., "5RS011027.html" -> "5RS011027")
            const match = filename.match(/(5RS\d{6})/);
            if (match) {
                rsmType = match[1];
            }
        }
        
        // Fallback to first available configuration
        if (!rsmType || !this.rsmConfigurations[rsmType]) {
            rsmType = Object.keys(this.rsmConfigurations)[0];
            console.warn(`⚠️ Could not detect RSM type, using fallback: ${rsmType}`);
        }
        
        this.currentRSMType = rsmType;
        console.log('🔍 Detected RSM Type:', this.currentRSMType);
    }

    /**
     * Load configuration for the detected RSM type
     */
    loadConfiguration() {
        const config = this.rsmConfigurations[this.currentRSMType];
        if (!config) {
            throw new Error(`No configuration found for RSM type: ${this.currentRSMType}`);
        }
        
        this.config = config;
        console.log('⚙️ Loaded configuration for:', config.name);
    }    /**
     * Extract assembly ID and work order ID from URL parameters
     */
    extractURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Assembly ID can be in 'id' or 'assemblyId' parameter
        this.assemblyId = urlParams.get('id') || urlParams.get('assemblyId') || window.assemblyId;
        this.workOrderId = urlParams.get('workOrderId');
        
        // Check for rework flags
        this.isRework = urlParams.get('isRework') === 'true' || 
                       urlParams.get('rework') === 'true' ||
                       (this.assemblyId && this.assemblyId.toString().startsWith('RW-'));
        
        // Store in window for broader access
        if (this.assemblyId) {
            window.assemblyId = this.assemblyId;
        }
        
        // Store in localStorage for persistence
        if (this.assemblyId) {
            localStorage.setItem('currentRSMAssemblyId', this.assemblyId);
        }
        
        // Store rework status
        if (this.isRework) {
            localStorage.setItem('currentRSMIsRework', 'true');
        }
        
        console.log('🆔 URL Parameters:', {
            assemblyId: this.assemblyId,
            workOrderId: this.workOrderId,
            isRework: this.isRework
        });
    }

    /**
     * Initialize UI elements references
     */
    initializeUIElements() {
        this.uiElements = {
            barcodeInput: document.getElementById('barcodeInput'),
            scanButton: document.getElementById('scanButton'),
            completeButton: document.getElementById('completeButton'),
            restartButton: document.getElementById('restartButton'),
            progressFill: document.getElementById('progressFill'),
            progressPercentage: document.getElementById('progressPercentage'),
            logsContent: document.getElementById('logsContent'),
            currentComponentTitle: document.getElementById('currentComponentTitle'),
            notification: document.getElementById('notification'),
            mainContainer: document.getElementById('mainContainer') || document.querySelector('.container')
        };
        
        // Verify critical elements exist
        const criticalElements = ['barcodeInput', 'scanButton', 'completeButton'];
        for (const elementName of criticalElements) {
            if (!this.uiElements[elementName]) {
                console.warn(`⚠️ Critical UI element not found: ${elementName}`);
            }
        }
    }

    /**
     * Setup component mapping by linking configuration to DOM elements
     */
    setupComponentMapping() {
        this.componentMapping = {};
        let sequence = 1;
        
        for (const [componentKey, componentConfig] of Object.entries(this.config.components)) {
            // Find the DOM element(s) for this component
            const elements = document.querySelectorAll(componentConfig.cssSelector);
            let targetElement = null;
            
            if (elements.length > componentConfig.index) {
                targetElement = elements[componentConfig.index];
            } else if (elements.length === 1) {
                targetElement = elements[0];
            }
            
            if (!targetElement) {
                console.warn(`⚠️ Element not found for component: ${componentKey} (${componentConfig.cssSelector}[${componentConfig.index}])`);
            }
            
            this.componentMapping[componentKey] = {
                itemCode: componentConfig.itemCode,
                name: componentConfig.name,
                element: targetElement,
                verificationCode: '',
                scanned: false,
                scannedBarcode: null,
                index: componentConfig.index,
                sequence: componentConfig.sequence || sequence++
            };
        }
        
        console.log('🗺️ Component mapping setup complete:', Object.keys(this.componentMapping));
    }

    /**
     * Setup event listeners for user interactions
     */
    setupEventListeners() {
        // Barcode input and scanning
        if (this.uiElements.barcodeInput) {
            this.uiElements.barcodeInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.handleScan();
                }
            });
            
            // Auto-focus on barcode input
            this.uiElements.barcodeInput.focus();
        }
        
        if (this.uiElements.scanButton) {
            this.uiElements.scanButton.addEventListener('click', () => {
                this.handleScan();
            });
        }
        
        // Assembly completion
        if (this.uiElements.completeButton) {
            this.uiElements.completeButton.addEventListener('click', () => {
                this.completeAssembly();
            });
        }
        
        // Assembly restart
        if (this.uiElements.restartButton) {
            this.uiElements.restartButton.addEventListener('click', () => {
                this.restartAssembly();
            });
        }
        
        console.log('👂 Event listeners setup complete');
    }    /**
     * Fetch component codes from inventory API
     */    async fetchComponentCodes() {
        try {
            console.log('🔄 Fetching component codes from inventory API...');
            this.addLogEntry('Fetching component data from inventory API...', 'info');
            
            let successCount = 0;
            let failedComponents = [];
            const totalComponents = Object.keys(this.componentMapping).length;
              for (const [key, component] of Object.entries(this.componentMapping)) {
                try {
                    const response = await fetch(`${this.API_URL}/item-master/?search=${component.itemCode}`);
                    if (response.ok) {
                        const data = await response.json();
                        
                        // Debug: Log the actual API response structure
                        console.log(`🔍 API Response for ${component.itemCode}:`, data);
                        
                        // Try different response structures
                        let itemData = null;
                        if (data.results && data.results.length > 0) {
                            itemData = data.results[0];
                        } else if (data.data && data.data.length > 0) {
                            itemData = data.data[0];
                        } else if (Array.isArray(data) && data.length > 0) {
                            itemData = data[0];
                        } else if (data.item_code) {
                            itemData = data;
                        }
                        
                        if (itemData) {
                            // Store the 'code' field from item master for barcode validation
                            component.code = itemData.code || itemData.barcode || itemData.verification_code;
                            component.item_name = itemData.item_name || itemData.name || itemData.description;
                            successCount++;
                            
                            // Log individual component codes that were fetched successfully
                            this.addLogEntry(`📋 ${component.name} (${component.itemCode}) → Code: ${component.code}`, 'success');
                            console.log(`✅ Fetched ${component.name}: ${component.itemCode} → ${component.code}`);
                        } else {
                            failedComponents.push(`${component.name} (${component.itemCode})`);
                            this.addLogEntry(`⚠️ No data found for ${component.name} (${component.itemCode}) - Response: ${JSON.stringify(data)}`, 'warning');
                            console.warn(`No data found for ${component.itemCode}. API response:`, data);
                        }
                    } else {
                        failedComponents.push(`${component.name} (${component.itemCode})`);
                        this.addLogEntry(`❌ API error fetching ${component.name} (${component.itemCode}): ${response.status}`, 'error');
                    }
                } catch (error) {
                    console.warn(`Failed to fetch component code for ${component.name}:`, error);
                    failedComponents.push(`${component.name} (${component.itemCode})`);
                    this.addLogEntry(`❌ Network error fetching ${component.name} (${component.itemCode}): ${error.message}`, 'error');
                }
            }
              // Also fetch RSM assembly type code for barcode generation
            try {
                const response = await fetch(`${this.API_URL}/item-master/?search=${this.currentRSMType}`);
                if (response.ok) {
                    const data = await response.json();
                    
                    // Debug: Log the actual API response structure
                    console.log(`🔍 RSM API Response for ${this.currentRSMType}:`, data);
                    
                    // Try different response structures
                    let rsmData = null;
                    if (data.results && data.results.length > 0) {
                        rsmData = data.results[0];
                    } else if (data.data && data.data.length > 0) {
                        rsmData = data.data[0];
                    } else if (Array.isArray(data) && data.length > 0) {
                        rsmData = data[0];
                    } else if (data.item_code) {
                        rsmData = data;
                    }
                    
                    if (rsmData) {
                        this.rsmAssemblyCode = rsmData.code || rsmData.barcode || rsmData.verification_code;
                        this.addLogEntry(`🏭 RSM Assembly Code: ${this.currentRSMType} → ${this.rsmAssemblyCode}`, 'success');
                        console.log(`🏷️ RSM Assembly Code: ${this.rsmAssemblyCode}`);
                    } else {
                        this.addLogEntry(`⚠️ No RSM assembly code found for ${this.currentRSMType} - Response: ${JSON.stringify(data)}`, 'warning');
                        console.warn(`No RSM assembly data found for ${this.currentRSMType}. API response:`, data);
                    }
                } else {
                    this.addLogEntry(`❌ Failed to fetch RSM assembly code: ${response.status}`, 'error');
                }
            } catch (error) {
                console.warn('Failed to fetch RSM assembly code:', error);
                this.addLogEntry(`❌ Network error fetching RSM assembly code: ${error.message}`, 'error');
            }
            
            this.inventoryDataLoaded = true;
            this.apiConnected = successCount > 0;
            
            if (this.apiConnected) {
                this.addLogEntry(`✅ API connected! Loaded ${successCount}/${totalComponents} component codes`, 'success');
                this.showNotification(`API connected! Loaded ${successCount}/${totalComponents} components`, 'success');
                
                // Show failed components if any
                if (failedComponents.length > 0) {
                    this.addLogEntry(`⚠️ Failed to load ${failedComponents.length} components: ${failedComponents.join(', ')}`, 'warning');
                }
            } else {
                this.addLogEntry('❌ API connection failed - running in permissive mode for development', 'error');
                this.showNotification('API connection failed - running in permissive mode', 'warning');
                
                // In development mode, still allow assembly to proceed
                console.log('🔧 Running in permissive development mode - assembly can proceed without API');
            }
            
        } catch (error) {
            console.error('❌ Error fetching component codes:', error);
            this.addLogEntry(`❌ Error connecting to inventory API: ${error.message}`, 'error');
            this.showNotification('API connection error - running in permissive mode', 'warning');
            this.inventoryDataLoaded = false;
            this.apiConnected = false;
            
            // Still allow development to continue
            console.log('🔧 Running in permissive development mode - assembly can proceed without API');
        }
    }

    /**
     * Handle barcode scanning
     */
    handleScan() {
        if (!this.uiElements.barcodeInput) {
            console.error('Barcode input element not found');
            return;
        }
        
        const barcode = this.uiElements.barcodeInput.value.trim();
        if (!barcode) {
            this.showNotification('Please scan or enter a barcode', 'error');
            return;
        }
        
        console.log('🔍 Processing scan:', barcode);
        
        // Check for duplicate scans
        if (this.scannedBarcodes.has(barcode)) {
            this.showNotification('Duplicate barcode: ' + barcode, 'warning');
            this.provideFeedback(null, 'duplicate');
            this.uiElements.barcodeInput.value = '';
            return;
        }
        
        // Find the next component to scan
        const nextComponent = this.getNextComponentToScan();
        if (!nextComponent) {
            this.showNotification('All components already scanned', 'info');
            this.uiElements.barcodeInput.value = '';
            return;
        }
        
        // Validate barcode (in offline mode, accept any barcode)        // Validate barcode format and API connection
        // In development mode, be permissive if API is not available
        if (!this.apiConnected) {
            this.addLogEntry('⚠️ API not connected - running in permissive development mode', 'warning');
            console.log('🔧 Development mode: Accepting barcode without API validation');
        }

        const isValid = this.validateComponentBarcode(barcode, nextComponent);
          if (isValid) {
            // Mark component as scanned
            nextComponent.scanned = true;
            nextComponent.scannedBarcode = barcode;
            this.scannedBarcodes.add(barcode);
              // Log successful scan via backend manager
            if (this.backendManager) {
                this.backendManager.logAssemblyAction('component_scanned', {
                    componentName: nextComponent.name,
                    componentCode: nextComponent.itemCode,
                    scannedBarcode: barcode,
                    sequence: nextComponent.sequence
                });
            }
            
            // Provide success feedback
            this.provideFeedback(nextComponent, 'success');
            
            // Update progress
            this.updateProgress();
            
            // Highlight next component
            this.highlightNextComponent();
            
            // Log the scan
            this.addLogEntry(`✅ Scanned ${nextComponent.name}: ${barcode}`, 'success');
            
            // Check if assembly is complete
            this.checkAssemblyCompletion();
            
        } else {            // Log failed scan via backend manager
            if (this.backendManager) {
                this.backendManager.logAssemblyAction('component_scan_failed', {
                    componentName: nextComponent.name,
                    componentCode: nextComponent.itemCode,
                    scannedBarcode: barcode,
                    reason: 'validation_failed'
                });
            }
            
            this.provideFeedback(nextComponent, 'error');
            this.addLogEntry(`❌ Invalid barcode for ${nextComponent.name}: ${barcode}`, 'error');
        }
        
        // Clear input and refocus
        this.uiElements.barcodeInput.value = '';
        this.uiElements.barcodeInput.focus();
    }    /**
     * Validate component barcode against expected code from item master
     * Match the 'code' field to the 5th, 5-6th, or 5-7th position of the scanned barcode
     */    validateComponentBarcode(barcode, component) {
        // In development mode without API connection, be permissive
        if (!this.apiConnected || !component || !component.code) {
            if (!this.apiConnected) {
                console.log('🔧 Development mode: Accepting barcode without strict validation');
                this.addLogEntry(`🔧 DEV: Accepting barcode ${barcode} for ${component.name} (no API validation)`, 'info');
                return true; // Accept any barcode in development mode
            }
            
            console.warn('Component or component code not available for validation');
            this.addLogEntry(`❌ Cannot validate ${component.name}: missing component code from API`, 'error');
            return false;
        }

        const componentCode = component.code.toString();
        const codeLength = componentCode.length;
        
        // Extract the relevant portion of the barcode based on code length
        let extractedCode = '';
        
        if (codeLength === 1) {
            // Match at 5th position (index 4)
            extractedCode = barcode.charAt(4);
        } else if (codeLength === 2) {
            // Match at 5th-6th positions (indices 4-5)
            extractedCode = barcode.substring(4, 6);
        } else if (codeLength === 3) {
            // Match at 5th-7th positions (indices 4-6)
            extractedCode = barcode.substring(4, 7);
        } else {
            console.warn(`Unsupported component code length: ${codeLength}`);
            this.addLogEntry(`⚠️ Unsupported component code length (${codeLength}) for ${component.name}`, 'warning');
            return false;
        }
        
        const isValid = extractedCode === componentCode;
        
        console.log(`🔍 Barcode Validation:`, {
            barcode: barcode,
            componentCode: componentCode,
            extractedCode: extractedCode,
            positions: codeLength === 1 ? '5th' : codeLength === 2 ? '5th-6th' : '5th-7th',
            isValid: isValid
        });
        
        if (isValid) {
            this.addLogEntry(`✅ Valid barcode for ${component.name}: ${barcode} matches code ${componentCode}`, 'success');
        } else {
            this.addLogEntry(`❌ Invalid barcode for ${component.name}: expected code ${componentCode} at positions, got ${extractedCode}`, 'error');
        }
        
        return isValid;
    }

    /**
     * Get the next component that needs to be scanned
     */
    getNextComponentToScan() {
        const unscannedComponents = Object.values(this.componentMapping)
            .filter(comp => !comp.scanned)
            .sort((a, b) => a.sequence - b.sequence);
        
        return unscannedComponents.length > 0 ? unscannedComponents[0] : null;
    }

    /**
     * Provide visual and audio feedback for scanning
     */
    provideFeedback(component, result) {
        if (!component && result !== 'duplicate') return;
        
        switch (result) {
            case 'success':
                // Visual feedback
                if (component.element) {
                    component.element.classList.remove('next', 'error');
                    component.element.classList.add('success');
                }
                
                // Update title
                if (this.uiElements.currentComponentTitle) {
                    this.uiElements.currentComponentTitle.innerHTML = `✅ ${component.name} scanned successfully`;
                    this.uiElements.currentComponentTitle.style.color = '#16a34a';
                }
                
                // Play success sound (if available)
                this.playSound('/assets/sounds/success-beep.mp3', 0.3);
                break;
                
            case 'error':
                // Visual feedback
                if (component.element) {
                    component.element.classList.remove('next', 'success');
                    component.element.classList.add('error');
                    
                    // Remove error class after animation
                    setTimeout(() => {
                        component.element.classList.remove('error');
                        component.element.classList.add('next');
                    }, 800);
                }
                
                // Update title
                if (this.uiElements.currentComponentTitle) {
                    this.uiElements.currentComponentTitle.innerHTML = `❌ Invalid barcode for ${component.name}`;
                    this.uiElements.currentComponentTitle.style.color = '#dc2626';
                }
                
                // Play error sound (if available)
                this.playSound('/assets/sounds/error-beep.mp3', 0.5);
                break;
                
            case 'duplicate':
                // Play warning sound (if available)
                this.playSound('/assets/sounds/warning-beep.mp3', 0.5);
                
                // Update title
                if (this.uiElements.currentComponentTitle) {
                    this.uiElements.currentComponentTitle.innerHTML = `⚠️ Duplicate barcode detected`;
                    this.uiElements.currentComponentTitle.style.color = '#f59e0b';
                }
                break;
        }
    }

    /**
     * Play sound effect (with error handling)
     */
    playSound(src, volume = 0.5) {
        try {
            const audio = new Audio(src);
            audio.volume = volume;
            audio.play().catch(e => console.log('Sound not supported or enabled'));
        } catch (error) {
            // Silently fail if audio not supported
        }
    }

    /**
     * Update scanning progress display
     */
    updateProgress() {
        const totalComponents = Object.keys(this.componentMapping).length;
        const scannedComponents = Object.values(this.componentMapping).filter(comp => comp.scanned).length;
        const progressPercentage = Math.round((scannedComponents / totalComponents) * 100);
        
        // Update progress bar
        if (this.uiElements.progressFill) {
            this.uiElements.progressFill.style.width = `${progressPercentage}%`;
        }
        
        // Update progress text
        if (this.uiElements.progressPercentage) {
            this.uiElements.progressPercentage.textContent = `${progressPercentage}%`;
        }
        
        console.log(`📊 Progress: ${scannedComponents}/${totalComponents} (${progressPercentage}%)`);
    }

    /**
     * Highlight the next component to be scanned
     */
    highlightNextComponent() {
        // Remove highlighting from all components
        Object.values(this.componentMapping).forEach(comp => {
            if (comp.element) {
                comp.element.classList.remove('next', 'error');
            }
        });
        
        // Highlight the next component
        const nextComponent = this.getNextComponentToScan();
        if (nextComponent && nextComponent.element) {
            nextComponent.element.classList.add('next');
            
            // Update title
            if (this.uiElements.currentComponentTitle) {
                this.uiElements.currentComponentTitle.textContent = `Scan ${nextComponent.name}`;
                this.uiElements.currentComponentTitle.style.color = '#3b82f6';
            }
        } else {
            // All components scanned
            if (this.uiElements.currentComponentTitle) {
                this.uiElements.currentComponentTitle.textContent = 'All components scanned - Ready to complete!';
                this.uiElements.currentComponentTitle.style.color = '#16a34a';
            }
        }
    }    /**
     * Check if assembly is complete and enable completion button
     */
    checkAssemblyCompletion() {
        const allScanned = Object.values(this.componentMapping).every(comp => comp.scanned);
        
        if (allScanned) {
            // Enable and show complete button
            if (this.uiElements.completeButton) {
                this.uiElements.completeButton.disabled = false;
                this.uiElements.completeButton.classList.remove('disabled', 'hidden');
                this.uiElements.completeButton.classList.add('ready');
                this.uiElements.completeButton.style.display = 'block'; // Ensure it's visible
            }
            
            this.showNotification('All components scanned! Ready to complete assembly.', 'success');
            this.addLogEntry('🎉 All components scanned! Complete Assembly button is now available.', 'success');
        }
    }    /**
     * Complete the assembly process - now using backend manager
     */
    async completeAssembly() {
        try {
            console.log('🎯 Starting assembly completion...');
            
            // Validate that all components are scanned
            const allScanned = Object.values(this.componentMapping).every(comp => comp.scanned);
            if (!allScanned) {
                this.showNotification('Cannot complete: some components are not scanned', 'error');
                return false;
            }
            
            // Validate assembly ID
            if (!this.assemblyId) {
                this.showNotification('Error: No assembly ID found', 'error');
                return false;
            }
            
            // Disable complete button to prevent double submission
            if (this.uiElements.completeButton) {
                this.uiElements.completeButton.disabled = true;
            }
            
            this.showNotification('Processing assembly completion...', 'info');
            this.addLogEntry('🔄 Completing assembly process...', 'info');
            
            // Prepare data for backend manager
            const assemblyData = {
                assemblyId: this.assemblyId,
                componentMapping: this.componentMapping,
                currentRSMType: this.currentRSMType,
                workOrderId: this.workOrderId,
                config: this.config
            };
            
            // Use backend manager to complete assembly if available
            if (this.backendManager && this.backendManager.completeAssembly) {
                const result = await this.backendManager.completeAssembly(assemblyData);
                
                if (result.success) {
                    // Show completion screen with the returned data
                    this.showCompletionScreen(result.completionData);
                    
                    // Handle next assembly if needed
                    if (result.workOrderResult && result.workOrderResult.success && !result.workOrderResult.isFullyCompleted) {
                        this.handleNextAssembly(result.workOrderResult.workOrder, result.workOrderResult.newCompletedQuantity);
                    } else if (result.workOrderResult && result.workOrderResult.isFullyCompleted) {
                        this.showNotification(`Work order completed! All ${result.workOrderResult.workOrder.quantity} units finished.`, 'success');
                    }
                    
                    this.addLogEntry('✅ Assembly completed successfully!', 'success');
                    return true;
                } else {
                    throw new Error(result.message || 'Backend completion failed');
                }
            } else {
                // Fallback to basic completion without backend manager
                console.warn('⚠️ Backend manager not available, using fallback completion');
                return await this.fallbackCompleteAssembly(assemblyData);
            }
            
        } catch (error) {
            console.error('❌ Error completing assembly:', error);
            this.showNotification(`Error completing assembly: ${error.message}`, 'error');
            this.addLogEntry(`❌ Error: ${error.message}`, 'error');
            
            // Re-enable complete button
            if (this.uiElements.completeButton) {
                this.uiElements.completeButton.disabled = false;
            }
            
            return false;
        }
    }

    /**
     * Fallback completion method when backend manager is not available
     */
    async fallbackCompleteAssembly(assemblyData) {
        try {
            // Generate barcode
            const assemblyBarcode = this.generateFallbackBarcode();
            
            // Prepare component data
            const scannedComponents = Object.values(assemblyData.componentMapping)
                .filter(comp => comp.scanned)
                .map(comp => ({
                    component_id: comp.index || comp.sequence,
                    name: comp.name,
                    item_code: comp.itemCode,
                    barcode: comp.scannedBarcode,
                    scan_time: new Date().toISOString(),
                    sequence: comp.sequence
                }));
            
            // Create completion data
            const completionData = {
                id: assemblyData.assemblyId,
                assemblyId: assemblyData.assemblyId,
                assemblyType: 'RSM',
                product: assemblyData.config?.name || `RSM Assembly - ${assemblyData.currentRSMType}`,
                itemCode: assemblyData.currentRSMType,
                barcodeNumber: assemblyBarcode,
                completedAt: new Date().toISOString(),
                scannedComponents: scannedComponents,
                workOrderId: assemblyData.workOrderId,
                componentCount: scannedComponents.length
            };
            
            // Store in localStorage (basic fallback)
            this.storeFallbackCompletion(completionData);
            
            // Show completion screen
            this.showCompletionScreen(completionData);
            
            this.addLogEntry('✅ Assembly completed (fallback mode)!', 'success');
            return true;
            
        } catch (error) {
            console.error('❌ Error in fallback completion:', error);
            throw error;
        }
    }

    /**
     * Generate barcode for fallback mode
     */
    generateFallbackBarcode() {
        const timestamp = Date.now().toString();
        const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
        const typeCode = this.currentRSMType || 'RSM';
        
        return `${typeCode}-${this.assemblyId || 'UNK'}-${timestamp.slice(-6)}-${randomSuffix}`;
    }

    /**
     * Store completion data in fallback mode
     */
    storeFallbackCompletion(completionData) {
        try {
            const completed = JSON.parse(localStorage.getItem('completedAssemblies') || '[]');
            completed.push({
                ...completionData,
                fallbackMode: true,
                sessionId: this.getSessionId()
            });
            
            // Keep only last 100 entries
            if (completed.length > 100) {
                completed.splice(0, completed.length - 100);
            }
            
            localStorage.setItem('completedAssemblies', JSON.stringify(completed));
            console.log('💾 Assembly stored in fallback mode');
            
        } catch (error) {
            console.error('❌ Error storing fallback completion:', error);
        }
    }

    /**
     * Get session ID for tracking
     */
    getSessionId() {
        let sessionId = localStorage.getItem('rsmSessionId');
        if (!sessionId) {
            sessionId = 'rsm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('rsmSessionId', sessionId);
        }
        return sessionId;
    }/**
     * Add method to handle rework scenarios
     */    async handleRework(assemblyId, reason = 'Quality issue') {
        try {
            this.showNotification('Processing rework request...', 'info');
            
            if (!this.backendManager) {
                throw new Error('Backend manager not available');
            }
              const result = await this.backendManager.handleRework(assemblyId, reason);            if (result.success) {
                this.showNotification('Assembly moved to rework successfully', 'success');
                this.addLogEntry(`📋 Assembly ${assemblyId} moved to rework: ${reason}`, 'warning');
                
                // Navigate to main Assembly Dashboard to show the rework order in pending list
                setTimeout(() => {
                    this.addLogEntry('🔄 Navigating to Assembly Dashboard...', 'info');
                    // Navigate to the main Assembly Dashboard page (not RSM-specific)
                    window.location.href = '/assembly';
                }, 2000);
                
                return true;
            }else {
                throw new Error(result.message);
            }
            
        } catch (error) {
            console.error('❌ Error handling rework:', error);
            this.showNotification(`Error handling rework: ${error.message}`, 'error');
            return false;
        }
    }/**
     * Handle starting the next assembly in sequence
     */
    async handleNextAssembly(workOrder, completedQuantity) {
        if (completedQuantity >= workOrder.quantity) {
            // Log via backend manager
            if (this.backendManager) {
                this.backendManager.logAssemblyAction('work_order_completed', {
                    workOrderId: this.workOrderId,
                    totalQuantity: workOrder.quantity,
                    rsmType: this.currentRSMType
                });
            }
            return; // Work order is fully completed
        }
        
        // Log via backend manager
        if (this.backendManager) {
            this.backendManager.logAssemblyAction('next_assembly_requested', {
                workOrderId: this.workOrderId,
                completedQuantity: completedQuantity,
                totalQuantity: workOrder.quantity
            });
        }
        
        try {
            // Show transition screen
            this.showNextAssemblyScreen(workOrder, completedQuantity);
            
            // Auto-start next assembly after a brief delay
            setTimeout(() => {
                this.startNextAssemblyUnit();
            }, 3000);
            
        } catch (error) {
            console.error('Failed to handle next assembly:', error);
            if (this.backendManager) {
                this.backendManager.logAssemblyAction('next_assembly_error', { error: error.message });
            }
        }
    }

    /**
     * Start the next assembly unit
     */
    startNextAssemblyUnit() {
        // Log via backend manager
        if (this.backendManager) {
            this.backendManager.logAssemblyAction('assembly_unit_started', {
                workOrderId: this.workOrderId,
                rsmType: this.currentRSMType
            });
        }
        
        // Reset current assembly state
        this.resetAssemblyState();
        
        // Show ready to start screen
        this.showReadyToStartScreen();
    }

    /**
     * Show screen for next assembly in queue
     */
    showNextAssemblyScreen(workOrder, completedQuantity) {
        const remainingQuantity = workOrder.quantity - completedQuantity;
        
        if (!this.uiElements.mainContainer) return;
        
        this.uiElements.mainContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; max-width: 600px; margin: 0 auto;">
                <div style="background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 0.5rem; padding: 2rem; margin-bottom: 2rem;">
                    <h2 style="color: #0369a1; margin-bottom: 1rem; font-size: 1.5rem;">✅ Assembly Complete!</h2>
                    <p style="color: #075985; margin-bottom: 1rem;">
                        ${this.config.name} unit completed successfully
                    </p>
                    
                    <div style="background: white; padding: 1.5rem; border-radius: 0.375rem; margin: 1rem 0;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                            <span><strong>Completed:</strong></span>
                            <span>${completedQuantity}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                            <span><strong>Remaining:</strong></span>
                            <span>${remainingQuantity}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                            <span><strong>Total:</strong></span>
                            <span>${workOrder.quantity}</span>
                        </div>
                        <div style="width: 100%; background: #e5e7eb; border-radius: 0.5rem; height: 1rem; margin-top: 1rem;">
                            <div style="width: ${(completedQuantity / workOrder.quantity) * 100}%; background: #10b981; border-radius: 0.5rem; height: 100%;"></div>
                        </div>
                    </div>
                </div>
                
                <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 2rem;">
                    <h3 style="color: #92400e; margin-bottom: 1rem;">⏳ Next Assembly Starting...</h3>
                    <p style="color: #92400e; margin-bottom: 1rem;">
                        Preparing ${this.config.name} unit ${completedQuantity + 1} of ${workOrder.quantity}
                    </p>
                    <div style="display: flex; justify-content: center; align-items: center;">
                        <div style="width: 2rem; height: 2rem; border: 3px solid #f59e0b; border-top: 3px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button onclick="RSMManager.startNextAssemblyUnit()" 
                            style="background: #10b981; color: white; padding: 0.75rem 1.5rem; border: none; 
                                   border-radius: 0.375rem; cursor: pointer; font-weight: 500;">
                        Start Next Assembly Now
                    </button>
                    <button onclick="window.history.back()" 
                            style="background: #6b7280; color: white; padding: 0.75rem 1.5rem; border: none; 
                                   border-radius: 0.375rem; cursor: pointer; font-weight: 500;">
                        Return to Dashboard
                    </button>
                </div>
            </div>
            
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }

    /**
     * Show ready to start screen for next assembly unit
     */
    showReadyToStartScreen() {
        if (!this.uiElements.mainContainer) return;
        
        this.uiElements.mainContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; max-width: 600px; margin: 0 auto;">
                <div style="background: #f0fdf4; border: 2px solid #16a34a; border-radius: 0.5rem; padding: 2rem; margin-bottom: 2rem;">
                    <h2 style="color: #15803d; margin-bottom: 1rem; font-size: 1.5rem;">🚀 Ready to Start</h2>
                    <p style="color: #166534; margin-bottom: 1rem;">
                        Next ${this.config.name} assembly ready to begin
                    </p>
                    
                    <div style="background: white; padding: 1.5rem; border-radius: 0.375rem; margin: 1rem 0;">
                        <h3 style="margin-bottom: 1rem; color: #374151;">Required Components</h3>
                        <div style="text-align: left;">
                            ${Object.values(this.config.components).map(comp => 
                                `<div style="margin-bottom: 0.5rem;">• ${comp.name} (${comp.itemCode})</div>`
                            ).join('')}
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button onclick="location.reload()" 
                            style="background: #16a34a; color: white; padding: 0.75rem 1.5rem; border: none; 
                                   border-radius: 0.375rem; cursor: pointer; font-weight: 500; font-size: 1.1rem;">
                        Start Assembly Process
                    </button>
                    <button onclick="window.history.back()" 
                            style="background: #6b7280; color: white; padding: 0.75rem 1.5rem; border: none; 
                                   border-radius: 0.375rem; cursor: pointer; font-weight: 500;">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        `;
    }    /**
     * Restart the assembly process
     */
    restartAssembly() {
        // Confirm with user before restarting
        if (confirm('Are you sure you want to restart the assembly? All scanned components will be cleared.')) {
            this.addLogEntry('🔄 Assembly restart requested by user', 'info');
            
            // Log via backend manager
            if (this.backendManager) {
                this.backendManager.logAssemblyAction('assembly_restarted', {
                    previouslyScannedComponents: Object.values(this.componentMapping).filter(c => c.scanned).length,
                    assemblyId: this.assemblyId,
                    workOrderId: this.workOrderId,
                    rsmType: this.currentRSMType
                });
            }
            
            // Reset the assembly state
            this.resetAssemblyState();
            
            // Show notification
            this.showNotification('Assembly restarted - ready to begin scanning', 'info');
            
            console.log('� Assembly process restarted');
        }
    }/**
     * Show completion screen with assembly details and barcode
     */    showCompletionScreen(assemblyData) {
        const container = this.uiElements.mainContainer || document.body;
        
        // Check if this is a rework order by checking various flags
        const isRework = assemblyData.is_rework || assemblyData.reworked || 
                        assemblyData.rework_reason || assemblyData.rework_count > 0 ||
                        (assemblyData.status && assemblyData.status.toLowerCase().includes('rework'));
          // Generate rework badge HTML if it's a rework order
        const reworkBadgeHtml = isRework ? `
            <div style="display: inline-block; background: #fef3c7; color: #92400e; padding: 0.5rem 1rem; 
                        border-radius: 9999px; font-size: 0.875rem; font-weight: 600; margin-bottom: 1rem;">
                🔄 REWORKED
            </div>
        ` : '';
        
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; max-width: 800px; margin: 0 auto; background: white; border-radius: 0.5rem;">
                <div style="background: linear-gradient(135deg, #10b981, #16a34a); color: white; padding: 2rem; border-radius: 0.5rem; margin-bottom: 2rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
                    ${reworkBadgeHtml}
                    <h1 style="margin: 0 0 1rem 0; font-size: 2rem;">Assembly Completed!</h1>
                    <p style="margin: 0; font-size: 1.2rem; opacity: 0.9;">
                        ${this.config.name} successfully assembled
                    </p>
                </div>
                
                <div style="background: #f8fafc; padding: 2rem; border-radius: 0.5rem; margin-bottom: 2rem;">
                    <h2 style="color: #1f2937; margin-bottom: 1.5rem;">Assembly Details</h2>
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; text-align: left;">
                        <div style="background: white; padding: 1rem; border-radius: 0.375rem; border-left: 4px solid #10b981;">
                            <strong>Assembly ID:</strong><br>
                            <span style="color: #6b7280;">${assemblyData.assemblyId || 'N/A'}</span>
                        </div>
                        <div style="background: white; padding: 1rem; border-radius: 0.375rem; border-left: 4px solid #3b82f6;">
                            <strong>RSM Type:</strong><br>
                            <span style="color: #6b7280;">${assemblyData.itemCode}</span>
                        </div>
                        <div style="background: white; padding: 1rem; border-radius: 0.375rem; border-left: 4px solid #f59e0b;">
                            <strong>Barcode:</strong><br>
                            <span style="color: #6b7280; font-family: monospace; font-size: 0.9rem;">${assemblyData.barcodeNumber}</span>
                        </div>
                        <div style="background: white; padding: 1rem; border-radius: 0.375rem; border-left: 4px solid #8b5cf6;">
                            <strong>Components:</strong><br>
                            <span style="color: #6b7280;">${assemblyData.scannedComponents.length} scanned</span>
                        </div>
                        <div style="background: white; padding: 1rem; border-radius: 0.375rem; border-left: 4px solid #ef4444; grid-column: span 2;">
                            <strong>Completed At:</strong><br>
                            <span style="color: #6b7280;">${new Date(assemblyData.completedAt || Date.now()).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 2rem;">
                    <h3 style="color: #374151; margin-bottom: 1rem; font-size: 1.1rem;">Generated Assembly Barcode</h3>
                    <div id="assemblyBarcodeContainer" style="background: white; padding: 1rem; border-radius: 0.375rem; border: 1px solid #d1d5db;">
                        <svg id="assemblyBarcode" style="max-width: 100%; height: auto;"></svg>
                    </div>
                    <div style="margin-top: 0.5rem; font-family: monospace; font-size: 0.9rem; color: #6b7280;">
                        ${assemblyData.barcodeNumber}
                    </div>
                </div>
                
                <div style="background: #f0f9ff; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 2rem; border: 1px solid #0ea5e9;">
                    <h3 style="color: #0369a1; margin-bottom: 1rem;">Scanned Components</h3>                    <div style="max-height: 200px; overflow-y: auto; text-align: left;">
                        ${assemblyData.scannedComponents.map((comp, idx) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: white; margin-bottom: 0.5rem; border-radius: 0.25rem; border: 1px solid #e5e7eb;">
                                <div style="flex: 1;">
                                    <div><strong>${idx + 1}. ${comp.name || comp.componentName || 'Unknown Component'}</strong></div>
                                    <div style="color: #6b7280; font-size: 0.9rem;">Item Code: ${comp.itemCode || comp.item_code || 'N/A'}</div>
                                </div>
                                <div style="color: #6b7280; font-family: monospace; font-size: 0.9rem; text-align: right;">
                                    <div>${comp.barcode || comp.scannedBarcode || 'N/A'}</div>
                                    <div style="font-size: 0.8rem;">Code: ${comp.code || 'N/A'}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button onclick="window.print()" 
                            style="background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border: none; 
                                   border-radius: 0.375rem; cursor: pointer; font-weight: 500;">
                        🖨️ Print Details
                    </button>
                    <button onclick="location.reload()" 
                            style="background: #10b981; color: white; padding: 0.75rem 1.5rem; border: none; 
                                   border-radius: 0.375rem; cursor: pointer; font-weight: 500;">
                        🔄 Start New Assembly
                    </button>
                    <button onclick="window.history.back()" 
                            style="background: #6b7280; color: white; padding: 0.75rem 1.5rem; border: none; 
                                   border-radius: 0.375rem; cursor: pointer; font-weight: 500;">
                        ← Return to Dashboard
                    </button>
                </div>
            </div>
        `;
        
        // Generate barcode using JsBarcode after DOM is updated
        this.generateBarcodeDisplay(assemblyData.barcodeNumber);
        
        // Auto-scroll to top
        window.scrollTo(0, 0);
        
        console.log('🎉 Completion screen displayed with barcode generation');
        this.addLogEntry('🎉 Assembly completion screen displayed', 'success');
    }    /**
     * Update page title and info based on RSM configuration
     */
    updatePageInfo() {
        // Update page title
        if (this.config && this.config.name) {
            document.title = this.config.name;
        }
        
        // Update any page header elements if they exist
        const headerTitle = document.querySelector('h1, .main-title, .assembly-title');
        if (headerTitle && this.config) {
            headerTitle.textContent = this.config.name;
        }
        
        // Update subtitle if element exists
        const subtitle = document.querySelector('.subtitle, .assembly-subtitle');
        if (subtitle && this.config && this.config.subtitle) {
            subtitle.textContent = this.config.subtitle;
        }
          // Add rework indicator if this is a rework order
        if (this.isRework) {
            const reworkBadge = document.createElement('div');
            reworkBadge.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #fef3c7;
                color: #92400e;
                padding: 0.5rem 1rem;
                border-radius: 9999px;
                font-size: 0.875rem;
                font-weight: 600;
                z-index: 9999;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                border: 1px solid #f3e8a1;
            `;
            reworkBadge.innerHTML = '🔄 REWORK ORDER';
            document.body.appendChild(reworkBadge);
            
            // Also update the current component title
            const currentTitle = document.getElementById('currentComponentTitle');
            if (currentTitle) {
                currentTitle.innerHTML = '🔄 REWORK ORDER - Ready to Start Scanning';
            }
        }
        
        // Log assembly session start via backend manager
        if (this.backendManager) {
            this.backendManager.logAssemblyAction('assembly_session_started', {
                rsmType: this.currentRSMType,
                configName: this.config.name,
                totalComponents: Object.keys(this.componentMapping).length,
                isRework: this.isRework
            });
        }
        
        console.log(`📄 Page info updated for ${this.config.name}${this.isRework ? ' (REWORK)' : ''}`);
    }/**
     * Add entry to assembly logs with timestamp and styling
     */
    addLogEntry(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        
        // Log to console with appropriate styling
        const consoleStyles = {
            'success': '✅',
            'error': '❌', 
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        
        console.log(`${consoleStyles[type] || 'ℹ️'} [${timestamp}] ${message}`);
        
        // Add to UI logs if element exists
        const logsContainer = document.getElementById('logsContent');
        if (logsContainer) {
            const logEntry = document.createElement('div');
            logEntry.className = `log-item ${type}`;
            logEntry.innerHTML = `
                <span class="log-time">${timestamp}</span>
                <span class="log-message">${message}</span>
            `;
            
            logsContainer.appendChild(logEntry);
            
            // Auto-scroll to bottom
            logsContainer.scrollTop = logsContainer.scrollHeight;
            
            // Keep only last 100 entries to prevent memory issues
            const logItems = logsContainer.querySelectorAll('.log-item');
            if (logItems.length > 100) {
                logItems[0].remove();
            }
        }
        
        // Also log via backend manager for database tracking
        if (this.backendManager) {
            this.backendManager.logAssemblyAction('log_entry', {
                message: message,
                type: type,
                timestamp: timestamp,
                assemblyId: this.assemblyId,
                workOrderId: this.workOrderId,
                rsmType: this.currentRSMType
            });
        }
    }

    /**
     * Show notification to user with auto-dismiss
     */
    showNotification(message, type = 'info') {
        const notificationEl = document.getElementById('notification');
        if (!notificationEl) {
            // Fallback to console if no notification element
            console.log(`NOTIFICATION [${type.toUpperCase()}]: ${message}`);
            return;
        }
        
        // Clear existing classes and content
        notificationEl.className = 'notification';
        notificationEl.textContent = message;
        
        // Add type class and show
        notificationEl.classList.add(type, 'show');
        
        // Auto-dismiss after delay (longer for errors)
        const dismissDelay = type === 'error' ? 8000 : type === 'warning' ? 6000 : 4000;
        
        setTimeout(() => {
            notificationEl.classList.remove('show');
        }, dismissDelay);
        
        // Also log significant notifications
        if (type === 'error' || type === 'warning') {
            this.addLogEntry(`NOTIFICATION: ${message}`, type);
        }
    }    /**
     * Update page title and info based on RSM configuration
     */
    updatePageInfo() {
        try {
            // Update page title
            if (document.title) {
                document.title = this.config.name;
            }
            
            // Update main title if it exists
            const titleElement = document.querySelector('h1, .title');
            if (titleElement) {
                titleElement.textContent = this.config.title || this.config.name;
            }
            
            // Update subtitle if it exists
            const subtitleElement = document.querySelector('.subtitle, .part-id');
            if (subtitleElement) {
                subtitleElement.textContent = this.config.subtitle || this.currentRSMType;
            }
            
            // Log assembly session start via backend manager
            if (this.backendManager) {
                this.backendManager.logAssemblyAction('assembly_session_started', {
                    rsmType: this.currentRSMType,
                    assemblyId: this.assemblyId,
                    workOrderId: this.workOrderId,
                    componentCount: Object.keys(this.componentMapping).length
                });
            }
            
            console.log('📄 Page info updated for', this.config.name);
            
        } catch (error) {
            console.warn('Failed to update page info:', error);
        }
    }    /**
     * Generate visual barcode display
     */    generateBarcodeDisplay(barcodeNumber) {
        try {
            this.addLogEntry(`🏷️ Generating barcode: ${barcodeNumber}`, 'info');
            
            // Function to actually create the barcode
            const createBarcode = () => {
                if (window.JsBarcode && document.getElementById('assemblyBarcode')) {
                    try {
                        window.JsBarcode("#assemblyBarcode", barcodeNumber, {
                            format: "CODE128",
                            lineColor: "#000",
                            width: 2,
                            height: 60,
                            displayValue: true,
                            fontSize: 16,
                            margin: 10
                        });
                        console.log('🏷️ Barcode generated successfully');
                        this.addLogEntry(`🏷️ Barcode generated successfully: ${barcodeNumber}`, 'success');
                        return true;
                    } catch (error) {
                        console.error('❌ JsBarcode error:', error);
                        return false;
                    }
                }
                return false;
            };
            
            // Function to ensure JsBarcode is loaded
            const ensureJsBarcode = () => {
                return new Promise((resolve) => {
                    // If already loaded, resolve immediately
                    if (window.JsBarcode) {
                        resolve(true);
                        return;
                    }
                    
                    // Check if script tag exists
                    let scriptTag = document.querySelector('script[src*="jsbarcode"]');
                    
                    // If no script tag exists, create one
                    if (!scriptTag) {
                        scriptTag = document.createElement('script');
                        scriptTag.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js';
                        scriptTag.async = true;
                        document.head.appendChild(scriptTag);
                    }
                    
                    // Wait for the script to load
                    const checkLoaded = () => {
                        if (window.JsBarcode) {
                            resolve(true);
                        } else {
                            setTimeout(checkLoaded, 100);
                        }
                    };
                    
                    scriptTag.onload = () => checkLoaded();
                    scriptTag.onerror = () => resolve(false);
                    
                    // Also start checking immediately in case it's already loading
                    checkLoaded();
                });
            };
            
            // Try to create the barcode immediately
            if (createBarcode()) {
                return; // Success!
            }
            
            // If immediate creation failed, ensure JsBarcode is loaded and retry
            ensureJsBarcode().then((loaded) => {
                if (loaded) {
                    // Try with delays to ensure DOM is ready
                    const retryTimes = [100, 500, 1000, 2000];
                    let retryIndex = 0;
                    
                    const retryBarcode = () => {
                        if (retryIndex >= retryTimes.length) {
                            // All retries failed, use text fallback
                            this.showBarcodeTextFallback(barcodeNumber);
                            return;
                        }
                        
                        setTimeout(() => {
                            if (createBarcode()) {
                                return; // Success!
                            }
                            retryIndex++;
                            retryBarcode(); // Try again
                        }, retryTimes[retryIndex]);
                    };
                    
                    retryBarcode();
                } else {
                    // JsBarcode failed to load, use text fallback
                    this.showBarcodeTextFallback(barcodeNumber);
                }
            });
            
        } catch (error) {
            console.error('❌ Failed to generate barcode:', error);
            this.addLogEntry(`❌ Barcode generation failed: ${error.message}`, 'error');
            this.showBarcodeTextFallback(barcodeNumber);
        }
    }
    
    /**
     * Show text fallback when barcode generation fails
     */
    showBarcodeTextFallback(barcodeNumber) {
        const container = document.getElementById('assemblyBarcodeContainer');
        if (container) {
            container.innerHTML = `
                <div style="font-family: monospace; font-size: 1.2rem; padding: 1rem; background: #f9fafb; border: 1px solid #d1d5db; border-radius: 0.25rem; text-align: center;">
                    <div style="margin-bottom: 0.5rem; font-weight: bold;">Assembly Barcode:</div>
                    <div style="color: #1f2937;">${barcodeNumber}</div>
                    <div style="font-size: 0.8rem; color: #6b7280; margin-top: 0.5rem;">
                        (Barcode library not available - text fallback)
                    </div>
                </div>
            `;
        }
        console.warn('⚠️ JsBarcode not available after retries, using text fallback');
        this.addLogEntry('⚠️ Barcode library not available, showing text fallback', 'warning');
    }/**
     * Get cookie value by name (for CSRF tokens)
     */
    getCookie(name) {
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
    }

    /**
     * Reset assembly state for next unit
     */
    resetAssemblyState() {
        // Clear scanned components
        Object.values(this.componentMapping).forEach(comp => {
            comp.scanned = false;
            comp.scannedBarcode = null;
            if (comp.element) {
                comp.element.classList.remove('success', 'error', 'next');
            }
        });
       
        // Clear scanned barcodes set
        this.scannedBarcodes.clear();
        
        // Reset UI elements
        if (this.uiElements.barcodeInput) {
            this.uiElements.barcodeInput.value = '';
            this.uiElements.barcodeInput.disabled = false;
        }
          if (this.uiElements.completeButton) {
            this.uiElements.completeButton.disabled = true;
            this.uiElements.completeButton.classList.remove('ready');
            this.uiElements.completeButton.classList.add('disabled');
        }
        
        // Reset progress
        this.updateProgress();
        this.highlightNextComponent();
        
        console.log('🔄 Assembly state reset for next unit');
    }
}

/**
 * Global instance and initialization
 */
let RSMManager;

/**
 * Initialize when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing RSM Assembly System...');
    
    try {
        RSMManager = new RSMAssemblyManager();
        const success = await RSMManager.init();
        
        if (success) {
            console.log('✅ RSM Assembly System initialized successfully!');
        } else {
            console.error('❌ RSM Assembly System initialization failed!');
        }
    } catch (error) {
        console.error('❌ Fatal error initializing RSM Assembly System:', error);
    }
});

// Export for global access
window.RSMManager = RSMManager;

// Helper functions for backward compatibility
window.getUrlParameter = function(name) {
    return new URLSearchParams(window.location.search).get(name);
};

window.getAssemblyId = function() {
    return RSMManager ? RSMManager.assemblyId : null;
};
