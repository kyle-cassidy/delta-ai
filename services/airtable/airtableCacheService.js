/**
 * AirtableCacheService - Service for caching Airtable data
 * 
 * This service fetches and caches data from Airtable bases to provide quick access
 * for document classification and metadata extraction. It maintains in-memory and
 * file-based caches of Airtable records with strategies for periodic updates.
 */

const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const Airtable = require('airtable');

class AirtableCacheService {
    /**
     * Creates a new instance of the AirtableCacheService
     * 
     * @param {string} apiKey - Airtable API key
     * @param {string} [cacheDirectory='./data/cache/airtable'] - Directory to store cache files
     */
    constructor(apiKey, cacheDirectory = './data/cache/airtable') {
        this.apiKey = apiKey;
        this.cacheDirectory = cacheDirectory;
        
        console.log(`Initializing AirtableCacheService with API key ${apiKey.substring(0, 5)}...`);
        console.log(`Cache directory: ${cacheDirectory}`);
        
        // Configure Airtable
        Airtable.configure({ apiKey: this.apiKey });
        
        // Main cache structure
        this.cache = {
            productRegistrationTracking: { tables: {}, lastFetched: null },
            deltaDocuments: { tables: {}, lastFetched: null }
        };
        
        // Base IDs
        this.baseIds = {
            productRegistrationTracking: 'appkaXsw8Q6dSltKd',
            deltaDocuments: 'appkWl7oSFxka7JEu'
        };
        
        // Service state
        this.isInitialized = false;
        this.cronJob = null;
        
        // Cache configuration
        this.MAX_CACHE_AGE_HOURS = 0; // Force live fetch every time during development
    }

    /**
     * Gets the cache file path for a specific base
     * 
     * @param {string} baseId - ID of the Airtable base
     * @returns {string} Path to the cache file
     * @private
     */
    _getCacheFilePath(baseId) {
        return path.join(this.cacheDirectory, `cache_${baseId}.json`);
    }

    /**
     * Ensures the cache directory exists
     * 
     * @returns {Promise<void>}
     * @private
     */
    async _ensureCacheDirectory() {
        try {
            await fs.mkdir(this.cacheDirectory, { recursive: true });
        } catch (error) {
            console.error(`Error creating cache directory ${this.cacheDirectory}:`, error);
            throw error;
        }
    }

    /**
     * Saves base cache data to a file
     * 
     * @param {string} baseId - ID of the Airtable base
     * @param {Object} baseData - Cache data for the base
     * @returns {Promise<void>}
     * @private
     */
    async _saveBaseCacheToFile(baseId, baseData) {
        await this._ensureCacheDirectory();
        const filePath = this._getCacheFilePath(baseId);
        console.log(`Attempting to save cache to: ${filePath}`);
        
        // Extract just the records without the Maps (which don't serialize well)
        const dataToSave = {
            lastFetched: new Date().toISOString(),
            tables: {}
        };
        
        // For each table, we just save the 'all' array which contains all records
        for (const [tableName, tableData] of Object.entries(baseData.tables)) {
            if (tableData && Array.isArray(tableData.all)) {
                dataToSave.tables[tableName] = tableData.all;
                console.log(`Saving ${tableData.all.length} records for table ${tableName}`);
            } else {
                console.warn(`Table ${tableName} has no 'all' array or it's not an array. Saving empty array.`);
                dataToSave.tables[tableName] = [];
            }
        }
        
        try {
            await fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2));
            console.log(`Cache saved for base ${baseId} to ${filePath}`);
            
            // Verify file was created
            try {
                const stats = await fs.stat(filePath);
                console.log(`Cache file created successfully, size: ${stats.size} bytes`);
            } catch (statError) {
                console.error(`Failed to verify cache file creation:`, statError);
            }
        } catch (error) {
            console.error(`Error saving cache for base ${baseId} to ${filePath}:`, error);
        }
    }

    /**
     * Loads base cache data from a file
     * 
     * @param {string} baseId - ID of the Airtable base
     * @returns {Promise<Object|null>} Cache data or null if not available/stale
     * @private
     */
    async _loadBaseCacheFromFile(baseId) {
        const filePath = this._getCacheFilePath(baseId);
        try {
            const fileData = await fs.readFile(filePath, 'utf-8');
            const parsedData = JSON.parse(fileData);
            if (parsedData.lastFetched && parsedData.tables) {
                const cacheAgeHours = (new Date() - new Date(parsedData.lastFetched)) / (1000 * 60 * 60);
                if (cacheAgeHours <= this.MAX_CACHE_AGE_HOURS) {
                    console.log(`Loaded fresh cache for base ${baseId} from ${filePath}`);
                    return parsedData; // { lastFetched, tables }
                }
                console.log(`Cache for base ${baseId} from ${filePath} is stale (age: ${cacheAgeHours.toFixed(1)}h).`);
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`Error loading cache for base ${baseId} from ${filePath}:`, error);
            } else {
                console.log(`Cache file not found for base ${baseId} at ${filePath}. Will fetch live.`);
            }
        }
        return null; // Not found, error, or stale
    }

    /**
     * Fetches all records for a specific table from Airtable API
     * 
     * @param {string} baseId - ID of the Airtable base
     * @param {string} tableIdOrName - ID or name of the table
     * @returns {Promise<Array>} Array of records
     * @private
     */
    async _fetchAllRecordsForTable(baseId, tableIdOrName) {
        console.log(`Fetching all records for ${baseId}/${tableIdOrName}...`);
        const base = Airtable.base(baseId);
        const allRecords = [];
        
        try {
            await base(tableIdOrName).select({
                // We can add view, fields, etc. options here if needed
            }).eachPage((records, fetchNextPage) => {
                allRecords.push(...records);
                fetchNextPage();
            });
            
            console.log(`Fetched ${allRecords.length} records for ${baseId}/${tableIdOrName}`);
            return allRecords;
        } catch (error) {
            console.error(`Error fetching records for ${baseId}/${tableIdOrName}:`, error);
            throw error;
        }
    }

    /**
     * Populates the in-memory cache for a specific table
     * 
     * @param {string} baseId - ID of the Airtable base (or base name in cache)
     * @param {string} tableName - Name of the table in cache
     * @param {Array} records - Array of records to cache
     * @param {Function} [primaryKeyFn] - Function to extract primary key from record
     * @private
     */
    _populateInMemoryCacheForTable(baseId, tableName, records, primaryKeyFn) {
        if (!this.cache[baseId]) this.cache[baseId] = { tables: {}, lastFetched: null };
        if (!this.cache[baseId].tables[tableName]) this.cache[baseId].tables[tableName] = {};

        // Ensure records is an array
        const recordsArray = Array.isArray(records) ? records : [];
        
        this.cache[baseId].tables[tableName].all = recordsArray;
        const byIdMap = new Map();
        
        recordsArray.forEach(record => {
            const key = primaryKeyFn ? primaryKeyFn(record) : record.id;
            if (key) byIdMap.set(key, record);
        });
        
        this.cache[baseId].tables[tableName].byId = byIdMap;
    }

    /**
     * Performs a live fetch and caches all tables for a specific base
     * 
     * @param {string} baseName - Name of the base in cache structure
     * @param {string} baseId - ID of the Airtable base
     * @param {Array} tablesConfig - Configuration for tables to fetch
     * @returns {Promise<boolean>} Success status
     * @private
     */
    async _fetchAndCacheBaseLive(baseName, baseId, tablesConfig) {
        console.log(`Performing live fetch for all tables in base ${baseName} (${baseId})...`);
        const liveBaseData = { tables: {} };
        
        for (const tableConfig of tablesConfig) {
            try {
                const records = await this._fetchAllRecordsForTable(baseId, tableConfig.tableId);
                liveBaseData.tables[tableConfig.nameInCache] = records; // Store raw records array
                this._populateInMemoryCacheForTable(baseName, tableConfig.nameInCache, records, tableConfig.pkFn);
            } catch (error) {
                console.error(`Failed to fetch live data for table ${tableConfig.tableId} in base ${baseName}. Skipping this table. Error: ${error.message}`);
                // Continue to fetch other tables in the base
            }
        }
        
        this.cache[baseName].lastFetched = new Date().toISOString();
        await this._saveBaseCacheToFile(baseId, this.cache[baseName]);
        return true;
    }

    /**
     * Initializes the cache, either from file or by fetching from Airtable
     * 
     * @param {boolean} [forceLiveFetch=false] - Whether to force a live fetch regardless of cache state
     * @returns {Promise<void>}
     */
    async initializeCache(forceLiveFetch = false) {
        if (this.isInitialized && !forceLiveFetch) {
            console.log("Cache already initialized.");
            return;
        }
        
        console.log(`Initializing Airtable cache${forceLiveFetch ? ' (forcing live fetch)' : ''}...`);
        await this._ensureCacheDirectory();

        const baseConfigs = {
            productRegistrationTracking: [
                { tableId: 'tblyPyT9SZWkGFcoD', nameInCache: 'registrationTracking', pkFn: (r) => r.id },
                { tableId: 'tblYe0DJIkwk758Az', nameInCache: 'products', pkFn: (r) => r.fields?.['Product ID'] || r.id },
                { tableId: 'tblDSlAkIve4Ap9u8', nameInCache: 'clientList', pkFn: (r) => r.fields?.['Client ID'] || r.id },
                { tableId: 'tblU5FD7w4hOEAM8k', nameInCache: 'states', pkFn: (r) => r.fields?.['State Abbreviation'] || r.id },
                { tableId: 'tbl29guRFK9Q2l7CL', nameInCache: 'regReqs', pkFn: (r) => r.fields?.['Requirement ID'] || r.id },
            ],
            deltaDocuments: [
                { tableId: 'tblNYeqUgJBa9l2XD', nameInCache: 'documentTypes', pkFn: (r) => r.fields?.doc_type_id },
                { tableId: 'tbl6CrMvhmVCf7mdQ', nameInCache: 'clients', pkFn: (r) => r.fields?.['Client ID'] || r.id },
                { tableId: 'tblD6G1lBmSsGCxfh', nameInCache: 'states', pkFn: (r) => r.fields?.['State Name'] || r.id },
                { tableId: 'tblW9piLEHybdSOlT', nameInCache: 'products', pkFn: (r) => r.fields?.['Product Name'] || r.id },
                { tableId: 'tblImOnbMhtkhQ1Jt', nameInCache: 'tags', pkFn: (r) => r.fields?.['Tag Name'] || r.id },
            ]
        };

        for (const baseName of Object.keys(this.baseIds)) {
            this.cache[baseName] = this.cache[baseName] || { tables: {}, lastFetched: null };
            const tablesForThisBase = baseConfigs[baseName];

            if (!tablesForThisBase) {
                console.warn(`No table configurations found for base: ${baseName}. Skipping this base.`);
                continue;
            }

            // Ensure all configured table structures are initialized in the in-memory cache
            for (const tableConfig of tablesForThisBase) {
                if (!this.cache[baseName].tables[tableConfig.nameInCache]) {
                    this.cache[baseName].tables[tableConfig.nameInCache] = { all: [], byId: new Map() };
                }
            }
            
            let loadedSuccessfullyFromCacheFile = false;
            if (!forceLiveFetch) {
                const cacheFilePath = this._getCacheFilePath(this.baseIds[baseName]);
                try {
                    const cachedBase = await this._loadBaseCacheFromFile(this.baseIds[baseName]);
                    if (cachedBase && cachedBase.lastFetched) {
                        console.log(`Found cache file for base ${baseName} at ${cacheFilePath}. Last fetched: ${cachedBase.lastFetched}`);
                        this.cache[baseName].lastFetched = cachedBase.lastFetched;

                        for (const tableConfig of tablesForThisBase) {
                            const tableName = tableConfig.nameInCache;
                            if (cachedBase.tables && cachedBase.tables[tableName] && Array.isArray(cachedBase.tables[tableName])) {
                                console.log(`Loading ${cachedBase.tables[tableName].length} records for table ${tableName} in base ${baseName} from cache file.`);
                                this._populateInMemoryCacheForTable(baseName, tableName, cachedBase.tables[tableName], tableConfig.pkFn);
                            } else {
                                console.warn(`Data for table ${tableName} in base ${baseName} is missing or not in expected format in cache file. Will attempt live fetch.`);
                            }
                        }
                        loadedSuccessfullyFromCacheFile = true;
                        console.log(`Finished attempting to populate in-memory cache for base ${baseName} from file.`);
                    } else {
                        console.log(`Cache file not found or invalid for base ${baseName} at ${cacheFilePath}. Will fetch live.`);
                    }
                } catch (error) {
                    console.error(`Error loading cache for base ${baseName} from ${cacheFilePath}: ${error.message}. Will fetch live.`);
                }
            }

            if (forceLiveFetch || !loadedSuccessfullyFromCacheFile) {
                console.log(`Fetching live data for base ${baseName} (Force live: ${forceLiveFetch}, Not loaded from file: ${!loadedSuccessfullyFromCacheFile})`);
                await this._fetchAndCacheBaseLive(baseName, this.baseIds[baseName], tablesForThisBase);
            }
        }

        this.isInitialized = true;
        console.log("Airtable cache initialization process completed.");
    }

    /**
     * Performs a scheduled daily fetch and persists cache to disk
     * 
     * @returns {Promise<void>}
     */
    async scheduledDailyFetchAndPersist() {
        console.log("Executing scheduled daily cache refresh and persist...");
        await this.initializeCache(true); // Force live fetch and persist
        console.log("Scheduled daily cache refresh and persist completed.");
    }

    /**
     * Starts a scheduled job to refresh the cache
     * 
     * @param {string} [cronExpression='0 2 * * *'] - Cron expression for scheduling (default: 2 AM daily)
     */
    startScheduledJob(cronExpression = '0 2 * * *') {
        if (this.cronJob) {
            this.cronJob.stop();
        }
        
        if (cron.validate(cronExpression)) {
            this.cronJob = cron.schedule(cronExpression, () => this.scheduledDailyFetchAndPersist(), {
                scheduled: true,
                timezone: "America/New_York"
            });
            console.log(`Airtable cache refresh job scheduled with cron expression: ${cronExpression}`);
        } else {
            console.error(`Invalid cron expression: ${cronExpression}. Scheduled job not started.`);
        }
    }

    /**
     * Stops the scheduled job
     */
    stopScheduledJob() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = null;
            console.log("Airtable cache refresh job stopped.");
        }
    }

    /**
     * Gets a record by ID from a specific table and base
     * 
     * @param {string} baseName - Name of the base in cache
     * @param {string} tableName - Name of the table in cache
     * @param {string} recordId - ID of the record to retrieve
     * @returns {Object|undefined} The record or undefined if not found
     */
    getRecordById(baseName, tableName, recordId) {
        return this.cache[baseName]?.tables[tableName]?.byId.get(recordId);
    }

    /**
     * Gets a document type by doc_type_id
     * 
     * @param {string} docTypeId - The doc_type_id to look up
     * @returns {Object|undefined} The document type record or undefined if not found
     */
    getDocumentTypeByDocTypeId(docTypeId) {
        return this.cache.deltaDocuments?.tables.documentTypes?.byId.get(docTypeId);
    }

    /**
     * Gets all records from a specific table and base
     * 
     * @param {string} baseName - Name of the base in cache
     * @param {string} tableName - Name of the table in cache
     * @returns {Array} Array of records (empty if not found)
     */
    getAllRecords(baseName, tableName) {
        console.log(`Getting all records for ${baseName}/${tableName}`);
        
        if (!this.cache[baseName]) {
            console.log(`Base ${baseName} not found in cache`);
            return [];
        }
        
        if (!this.cache[baseName].tables || !this.cache[baseName].tables[tableName]) {
            console.log(`Table ${tableName} not found in base ${baseName}`);
            return [];
        }
        
        const records = this.cache[baseName].tables[tableName].all;
        if (!records) {
            console.log(`No 'all' property found for table ${tableName} in base ${baseName}`);
            return [];
        }
        
        if (!Array.isArray(records)) {
            console.log(`Records for ${baseName}/${tableName} is not an array, type: ${typeof records}`);
            return [];
        }
        
        console.log(`Found ${records.length} records for ${baseName}/${tableName}`);
        return records;
    }

    /**
     * Gets cache status information for all bases
     * 
     * @returns {Object} Cache status information
     */
    getCacheStatus() {
        const status = {};
        console.log('Getting cache status...');
        console.log('Cache keys:', Object.keys(this.cache));
        
        for (const [baseName, baseData] of Object.entries(this.cache)) {
            console.log(`Processing base: ${baseName}`);
            status[baseName] = {
                lastFetched: baseData.lastFetched,
                tables: {}
            };
            
            if (baseData.tables) {
                console.log(`Tables in ${baseName}:`, Object.keys(baseData.tables));
                
                for (const [tableName, tableData] of Object.entries(baseData.tables)) {
                    const recordCount = tableData.all?.length || 0;
                    console.log(`Table ${tableName} has ${recordCount} records`);
                    
                    status[baseName].tables[tableName] = {
                        recordCount: recordCount
                    };
                }
            } else {
                console.log(`No tables found in ${baseName}`);
            }
        }
        
        return status;
    }
}

module.exports = AirtableCacheService;