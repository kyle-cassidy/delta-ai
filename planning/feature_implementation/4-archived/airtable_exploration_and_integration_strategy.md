# Airtable Exploration and Integration Strategy for Delta-AI

This document outlines the findings from exploring our Airtable bases and proposes a strategy for integrating them with the `delta-ai` application. The goal is to leverage Airtable data as context for AI-driven document classification and to use Airtable as a structured repository for processed document information.

## 1. Overview of Airtable Bases and Their Roles

We have two primary Airtable bases involved in this workflow:

### 1.1. Product Registration Tracking (Base ID: `appkaXsw8Q6dSltKd`)
- **Role**: This base serves as the **primary source of contextual information** for the `delta-ai` application. It contains detailed historical and current data about product registrations, clients, states (regulators), and regulatory requirements.
- **Key Tables for Context:**
    - `Registration Tracking` (Table ID: `tblyPyT9SZWkGFcoD`): The central hub containing comprehensive details for each product registration in each state, including statuses, dates, linked products, clients, and specific state regulatory requirements.
    - `Products` (Table ID: `tblYe0DJIkwk758Az`): Information about individual products.
    - `Client List` (Table ID: `tblDSlAkIve4Ap9u8`): Details about clients.
    - `States` (Table ID: `tblU5FD7w4hOEAM8k`): Information about states, often acting as a proxy for regulators.
    - `Reg Reqs` (Table ID: `tbl29guRFK9Q2l7CL`): Detailed regulatory requirements per state/regulation type.

### 1.2. Delta Documents (Base ID: `appkWl7oSFxka7JEu`)
- **Role**: This base serves as the **primary destination and structured repository** for documents processed by the `delta-ai` application. It's where classified documents and their extracted metadata will reside.
- **Key Tables for Destination & Definition:**
    - `documents` (Table ID: `tblR2M4s4UZpq5wWe`): The main landing table for all ingested documents. Each record represents a document processed by `delta-ai` and links to its classification, client, state, and extracted metadata.
    - `document_types` (Table ID: `tblNYeqUgJBa9l2XD`): A crucial definitional table. It lists all valid document classifications (e.g., "REG_CERT", "PROD_LABEL") and, importantly, specifies the `related_table_name` where type-specific metadata for that classification should be stored.
    - **Specialized Sub-Tables** (e.g., `certificates`, `applications`, `reports`, `product_docs`): These tables store detailed metadata specific to a document's type, linked from the main `documents` table. The `document_types` table guides which sub-table to use.
    - `clients` (Table ID: `tbl6CrMvhmVCf7mdQ`): Client definitions.
    - `states` (Table ID: `tblD6G1lBmSsGCxfh`): State definitions.
    - `products` (Table ID: `tblW9piLEHybdSOlT`): Product definitions.
    - `tags` (Table ID: `tblImOnbMhtkhQ1Jt`): Definitions for applicable tags.

## 2. Role of the `delta-ai` Application

The `delta-ai` application (Node.js project detailed in `REPO_MAP.md`) acts as the **intelligent bridge** between Delta-DMS (document ingestion), the `Product Registration Tracking` Airtable base (context), and the `Delta Documents` Airtable base (structured output).

**Core Workflow:**
1. Documents are ingested into Delta-DMS.
2. `delta-ai` picks up new documents from Delta-DMS.
3. `delta-ai` queries its cached contextual data (sourced from `Product Registration Tracking`) to understand the environment of the document.
4. `delta-ai` uses its AI models, informed by this context and the classification logic (inspired by `planning/ideas/2025-05-13-classification-decision-tree.md`), to:
    a. Classify the document (determining its `doc_type`).
    b. Extract key metadata.
5. `delta-ai` then populates the `Delta Documents` base:
    a. Creates/updates a record in the `documents` table.
    b. Creates/updates records in specialized sub-tables as indicated by the `document_types` table.
    c. Applies relevant tags.
6. `delta-ai` may also update the document in Delta-DMS with key pieces of information (e.g., assigned document type, DMS ID for linking).

## 3. Mission of `delta-ai` Concerning Airtable Integration

The `delta-ai` application will enhance Delta-DMS by:
1.  **Ingesting documents** from Delta-DMS.
2.  **Leveraging contextual data** from the **`Product Registration Tracking` Airtable base** to understand existing product registrations, client details, state/regulator requirements, and submission statuses.
3.  **Classifying documents** based on their content and the contextual data, assigning a `doc_type` (composed of `doc_purpose` and `doc_base_type`) as defined in the `Delta Documents` -> `document_types` table.
4.  **Extracting relevant metadata** from the documents (e.g., expiration dates, amounts, responsible parties, product names).
5.  **Populating the `Delta Documents` Airtable base:**
    *   Creating a primary record in the `documents` table with the core classification, extracted metadata, and links to `clients`, `states`, and `document_types`.
    *   Creating linked records in specialized sub-tables (e.g., `certificates`, `applications`) based on the `related_table_name` found in the `document_types` table, and populating them with type-specific metadata.
    *   Applying appropriate `tags`.
6.  **Updating the corresponding document in Delta-DMS** with key metadata for consistency and searchability within Delta-DMS.

## 4. Airtable Data Caching and Utilization Strategy for `delta-ai`

To operate efficiently and ensure data consistency, `delta-ai` will implement a data caching strategy:

1.  **Establish Connections:** `delta-ai` will maintain connections to both Airtable bases.
2.  **Cache Contextual Data (from `Product Registration Tracking`):**
    *   **`Registration Tracking` table:** Fetch and periodically refresh a local cache of these records. This is the richest source of context, including product-state registration links, statuses, dates, client info, and regulatory requirements (often via lookups).
    *   **Other supporting tables for context:** `Products`, `Client List`, `States`, `Reg Reqs` should also be cached as needed to resolve links and provide full context.
3.  **Cache Definitional Data (from `Delta Documents`):**
    *   **`document_types` table:** Cache all records. This is essential for knowing valid classification outputs, the `doc_type_id` structure, and the `related_table_name` for routing metadata to specialized sub-tables.
    *   **Other supporting tables for IDs/linking:** `clients`, `states`, `products`, `tags` from this base will be cached to ensure `delta-ai` uses correct linked record IDs when populating data.
4.  **Utilizing the Cache:**
    *   **Pre-Classification Context:** When a new document is processed, `delta-ai` will use its cached `Product Registration Tracking` data to provide rich context to the AI classification models. This helps in disambiguating document purpose (e.g., new vs. renewal, expected vs. unexpected document).
    *   **Classification Validation:** The AI's proposed `doc_type` will be validated against the cached `document_types` data.
    *   **Metadata Routing:** The `related_table_name` from the cached `document_types` will direct where specialized extracted metadata should be stored.
    *   **Entity Linking:** Cached IDs for clients, products, states, etc., from both bases will be used to populate linked record fields accurately in `Delta Documents`, maintaining data integrity.
    *   **Reduced API Calls:** Caching minimizes direct Airtable API calls during the processing of each document, improving performance and reducing rate limit risks.
    *   **Periodic Refresh:** The cache will need a strategy for periodic updates to stay current with changes made directly in Airtable.

## 5. Key Table Schema Summaries

### 5.1. `Product Registration Tracking` -> `Registration Tracking` (Table ID: `tblyPyT9SZWkGFcoD`)
- **Purpose:** Provides deep contextual information about ongoing and historical product registrations.
- **Key Field Categories:**
    - **Identifiers:** `ID` (PK), `State ID` (link), `Reg/Lic Number`.
    - **Core Registration Details:** `Product Name` (link), `Company` (link), `State Regulation` (link), `Initial Registration Status`, `Renewal Registration Status`, `Certificate Exp` (date), `Initial Sub Date`, `Approval Received`.
    - **Financials:** Links to `Payments`, lookup fields for estimates and actual costs.
    - **Product & Label Info:** Lookups from `Products`, links to `Label Versions`.
    - **Regulatory Requirements:** Many lookups from `Reg Reqs` via `State Regulation` link (e.g., `New Reg Sub Docs Needed`, `Labs Required For Reg`).
    - **Contact/Access:** Links to `Client Logins`, looked up credentials, state contact details.
    - **Internal Workflow:** Notes, statuses (`Next Renewal Plans`, `Internal Action Needed`).

### 5.2. `Delta Documents` -> `documents` (Table ID: `tblR2M4s4UZpq5wWe`)
- **Purpose:** The central landing table for all documents processed by `delta-ai`.
- **Key Field Categories:**
    - **Identifiers:** `id` (PK), `dms_doc_id` (for Delta-DMS sync), `doc_natural_id` (formula).
    - **Content & Links:** `document` (attachment), `dms_file_link`, `title`.
    - **Classification Fields:** `state_id` (link), `client_id` (link), `doc_type` (link to `document_types`), `doc_type_ai_classification` (single select for AI's initial thought).
    - **Relationships to Sub-tables:** `related_certificates`, `related_applications`, `product_docs`, etc. (links).
    - **Metadata:** `tags` (link), timestamps.

### 5.3. `Delta Documents` -> `document_types` (Table ID: `tblNYeqUgJBa9l2XD`)
- **Purpose:** Defines all valid document classifications and how they map to specialized data storage. "Small but mighty."
- **Key Field Categories:**
    - **`doc_type_id` (Formula):** Primary Identifier, `CONCATENATE({doc_purpose}, "_", {doc_base_type})` (e.g., "REG_CERT"). This is the target for `delta-ai`'s classification output for linking.
    - **`doc_type` (Single Line Text):** Human-readable name (e.g., "Registration Certificate").
    - **`doc_purpose` (Single Line Text):** High-level purpose (PROD, REG, COM, REP).
    - **`doc_base_type` (Single Line Text):** Granular type (CERT, APP, LABEL, SDS).
    - **`related_table_name` (Single Line Text):** **Crucial field.** Name of the specialized Airtable table (e.g., "certificates") where detailed metadata for this `doc_type` is stored.
    - **`linked_table_id` (Single Line Text):** Airtable ID of the `related_table_name`.
    - **`linked_dms_doc_type_id` (Single Line Text):** Potential ID for mapping to Delta-DMS document types.
    - **`documents` (Link):** Shows all documents of this type.


This strategy should provide a solid foundation for building the Airtable integration within the `delta-ai` application.

## 6. Airtable Data Caching: Services, Fetching, and Storage

To effectively leverage Airtable data within `delta-ai`, a robust caching mechanism is essential. This ensures fast access to contextual and definitional data, reducing reliance on live API calls for every document processed and improving performance.

### 6.1. Proposed Service: `AirtableCacheService`

We will implement an `AirtableCacheService` within the `delta-ai` (Node.js) application. This service will encapsulate all logic related to fetching data from Airtable, storing it in an in-memory cache, and providing access methods for other parts of the application.

### 6.2. Data Fetching Strategy

-   **Primary Tool:** The `mcp_airtable_list_records` tool will be used to fetch records from the specified Airtable tables.
-   **Process per Table:**
    -   Provide the `baseId` and `tableId` to `mcp_airtable_list_records`.
    -   Initially, fetch all fields for all records to ensure comprehensive data. Field selection can be optimized later if specific performance bottlenecks are identified.
    -   **Pagination Handling:** The `mcp_airtable_list_records` tool defaults to `maxRecords = 100`. The `AirtableCacheService` must implement logic to handle pagination, making multiple calls if necessary to retrieve all records from a table.

### 6.3. Data Storage (In-Memory Cache)

-   **Structure:** Data will be stored in memory within the `AirtableCacheService` for the fastest possible access during document processing.
-   **Format per Table:** For each cached table, we will maintain:
    -   An **array of all records**: Useful for scenarios requiring iteration over the entire dataset (e.g., `cache[baseName].tables[tableName].all = [{record1}, {record2}]`).
    -   A **`Map` keyed by Record ID** (or another designated unique identifier): Essential for efficient O(1) average time complexity lookups (e.g., `cache[baseName].tables[tableName].byId = new Map([['recXXXXXXXXXXXXXX', record1]])`).
-   **Namespace:** The cache will be organized hierarchically for clarity, typically `this.cache.<baseName>.tables.<tableName>`. For instance:
    -   `this.cache.productRegistrationTracking.tables.registrationTracking`
    -   `this.cache.deltaDocuments.tables.documentTypes`

### 6.4. Key Tables for Caching

**From `Product Registration Tracking` (Base ID: `appkaXsw8Q6dSltKd`):**
-   `Registration Tracking` (Table ID: `tblyPyT9SZWkGFcoD`)
-   `Products` (Table ID: `tblYe0DJIkwk758Az`)
-   `Client List` (Table ID: `tblDSlAkIve4Ap9u8`)
-   `States` (Table ID: `tblU5FD7w4hOEAM8k`)
-   `Reg Reqs` (Table ID: `tbl29guRFK9Q2l7CL`)

**From `Delta Documents` (Base ID: `appkWl7oSFxka7JEu`):**
-   `document_types` (Table ID: `tblNYeqUgJBa9l2XD`) - Keyed by `doc_type_id` (formula field) for its `byId` Map.
-   `clients` (Table ID: `tbl6CrMvhmVCf7mdQ`)
-   `states` (Table ID: `tblD6G1lBmSsGCxfh`)
-   `products` (Table ID: `tblW9piLEHybdSOlT`)
-   `tags` (Table ID: `tblImOnbMhtkhQ1Jt`)

### 6.5. Conceptual Structure of `AirtableCacheService`

```javascript
// Filename: services/AirtableCacheService.js (illustrative)
// Dependencies: an HTTP client (e.g., axios), node-cron, fs (built-in)

const fs = require('fs').promises; // Using promises version of fs
const path = require('path');
const cron = require('node-cron'); // Assuming node-cron is installed

class AirtableCacheService {
    constructor(apiKey, httpClient, cacheDirectory = './data/cache/airtable') {
        this.apiKey = apiKey;
        this.httpClient = httpClient;
        this.cacheDirectory = cacheDirectory;
        this.cache = {
            productRegistrationTracking: { tables: {}, lastFetched: null },
            deltaDocuments: { tables: {}, lastFetched: null }
        };
        this.isInitialized = false;
        this.cronJob = null;
        this.AIRTABLE_API_BASE_URL = 'https://api.airtable.com/v0';
        this.RATE_LIMIT_DELAY_MS = 250; // ~4 req/sec to be safe
        this.MAX_CACHE_AGE_HOURS = 25; // How old can file cache be before forcing live fetch
    }

    _getCacheFilePath(baseId) {
        return path.join(this.cacheDirectory, `cache_${baseId}.json`);
    }

    async _ensureCacheDirectory() {
        try {
            await fs.mkdir(this.cacheDirectory, { recursive: true });
        } catch (error) {
            console.error(`Error creating cache directory ${this.cacheDirectory}:`, error);
            throw error;
        }
    }

    async _saveBaseCacheToFile(baseId, baseData) {
        await this._ensureCacheDirectory();
        const filePath = this._getCacheFilePath(baseId);
        const dataToSave = {
            lastFetched: new Date().toISOString(),
            tables: baseData.tables // Assuming baseData.tables contains the actual table records
        };
        try {
            await fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2));
            console.log(`Cache saved for base ${baseId} to ${filePath}`);
        } catch (error) {
            console.error(`Error saving cache for base ${baseId} to ${filePath}:`, error);
        }
    }

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

    async _fetchAllRecordsForTable(baseId, tableIdOrName) {
        let allRecords = [];
        let offset = undefined;
        const requestUrlBase = `${this.AIRTABLE_API_BASE_URL}/${baseId}/${encodeURIComponent(tableIdOrName)}`;
        console.log(`Fetching all records for ${baseId}/${tableIdOrName}...`);
        try {
            do {
                const params = { pageSize: 100 };
                if (offset) params.offset = offset;
                // const response = await this.httpClient.get(requestUrlBase, { headers: { 'Authorization': `Bearer ${this.apiKey}` }, params });
                // const responseData = response.data;
                // --- Placeholder for actual HTTP request logic (from previous version) --- 
                await new Promise(resolve => setTimeout(resolve, 50)); 
                let simulatedResponseData;
                if (tableIdOrName === 'tblyPyT9SZWkGFcoD' && !offset) { 
                     simulatedResponseData = { records: Array.from({length: 100}, (_, i) => ({ id: `recRegFake${i}`, fields: { name: `RegTrack ${i}` }})), offset: 'offset1' };
                } else if (tableIdOrName === 'tblyPyT9SZWkGFcoD' && offset === 'offset1') {
                     simulatedResponseData = { records: Array.from({length: 30}, (_, i) => ({ id: `recRegFake1${i+100}`, fields: { name: `RegTrack ${i+100}` }})), offset: undefined };
                } else if (tableIdOrName === 'tblNYeqUgJBa9l2XD') { 
                     simulatedResponseData = { records: [{id: 'recDocType1', fields: { doc_type_id: 'REG_CERT'} }, {id: 'recDocType2', fields: { doc_type_id: 'PROD_LABEL'} }], offset: undefined };
                } else {
                    simulatedResponseData = { records: [], offset: undefined }; 
                }
                // --- End of Placeholder --
                if (simulatedResponseData.records) allRecords.push(...simulatedResponseData.records);
                offset = simulatedResponseData.offset;
                await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY_MS)); 
            } while (offset);
            
            console.log(`Fetched ${allRecords.length} records for ${baseId}/${tableIdOrName}`);
        } catch (error) {
            console.error(`Error fetching records for ${baseId}/${tableIdOrName}:`, error);
            throw error; 
        }
        return allRecords;
    }

    _populateInMemoryCacheForTable(baseId, tableName, records, primaryKeyFn) {
        if (!this.cache[baseId]) this.cache[baseId] = { tables: {}, lastFetched: null };
        if (!this.cache[baseId].tables[tableName]) this.cache[baseId].tables[tableName] = {};

        this.cache[baseId].tables[tableName].all = records;
        const byIdMap = new Map();
        records.forEach(record => {
            const key = primaryKeyFn ? primaryKeyFn(record) : record.id;
            if (key) byIdMap.set(key, record);
        });
        this.cache[baseId].tables[tableName].byId = byIdMap;
    }

    async _fetchAndCacheBaseLive(baseId, tablesConfig) {
        console.log(`Performing live fetch for all tables in base ${baseId}...`);
        const liveBaseData = { tables: {} };
        for (const tableConfig of tablesConfig) {
            try {
                const records = await this._fetchAllRecordsForTable(baseId, tableConfig.tableId);
                liveBaseData.tables[tableConfig.nameInCache] = records; // Store raw records array
                this._populateInMemoryCacheForTable(baseId, tableConfig.nameInCache, records, tableConfig.pkFn);
            } catch (error) {
                console.error(`Failed to fetch live data for table ${tableConfig.tableId} in base ${baseId}. Skipping this table. Error: ${error.message}`);
                // Continue to fetch other tables in the base
            }
        }
        this.cache[baseId].lastFetched = new Date().toISOString();
        await this._saveBaseCacheToFile(baseId, this.cache[baseId]); // Save the structured cache with .all and .byId
        return true;
    }

    async initializeCache(forceLiveFetch = false) {
        if (this.isInitialized && !forceLiveFetch) {
            console.log("Cache already initialized.");
            return;
        }
        console.log(`Initializing Airtable cache${forceLiveFetch ? ' (forcing live fetch)' : ''}...`);
        await this._ensureCacheDirectory();

        const baseConfigs = {
            productRegistrationTracking: [
                { tableId: 'tblyPyT9SZWkGFcoD', nameInCache: 'registrationTracking' },
                { tableId: 'tblYe0DJIkwk758Az', nameInCache: 'products' },
                { tableId: 'tblDSlAkIve4Ap9u8', nameInCache: 'clientList' },
                { tableId: 'tblU5FD7w4hOEAM8k', nameInCache: 'states' },
                { tableId: 'tbl29guRFK9Q2l7CL', nameInCache: 'regReqs' },
            ],
            deltaDocuments: [
                { tableId: 'tblNYeqUgJBa9l2XD', nameInCache: 'documentTypes', pkFn: (r) => r.fields?.doc_type_id },
                { tableId: 'tbl6CrMvhmVCf7mdQ', nameInCache: 'clients' },
                { tableId: 'tblD6G1lBmSsGCxfh', nameInCache: 'states' },
                { tableId: 'tblW9piLEHybdSOlT', nameInCache: 'products' },
                { tableId: 'tblImOnbMhtkhQ1Jt', nameInCache: 'tags' },
            ]
        };

        for (const [baseId, tablesConfig] of Object.entries(baseConfigs)) {
            let loadedFromStorage = false;
            if (!forceLiveFetch) {
                const storedBaseData = await this._loadBaseCacheFromFile(baseId);
                if (storedBaseData && storedBaseData.tables) {
                    this.cache[baseId] = { tables: {}, lastFetched: storedBaseData.lastFetched };
                    for (const tableConfig of tablesConfig) {
                        const records = storedBaseData.tables[tableConfig.nameInCache] || [];
                         this._populateInMemoryCacheForTable(baseId, tableConfig.nameInCache, records, tableConfig.pkFn);
                    }
                    loadedFromStorage = true;
                    console.log(`Successfully populated in-memory cache for base ${baseId} from stored file.`);
                }
            }

            if (!loadedFromStorage || forceLiveFetch) {
                console.log(`${forceLiveFetch ? 'Forcing live fetch' : 'Cache not loaded from file or stale'} for base ${baseId}. Fetching live...`);
                await this._fetchAndCacheBaseLive(baseId, tablesConfig);
            }
        }

        this.isInitialized = true;
        console.log("Airtable cache initialization process completed.");
    }

    async scheduledDailyFetchAndPersist() {
        console.log("Executing scheduled daily cache refresh and persist...");
        await this.initializeCache(true); // Force live fetch and persist
        console.log("Scheduled daily cache refresh and persist completed.");
    }

    startScheduledJob(cronExpression = '0 2 * * *') { // Default to 2 AM daily
        if (this.cronJob) {
            this.cronJob.stop();
        }
        if (cron.validate(cronExpression)) {
            this.cronJob = cron.schedule(cronExpression, () => this.scheduledDailyFetchAndPersist(), {
                scheduled: true,
                timezone: "America/New_York" // Example: Use an appropriate timezone
            });
            console.log(`Airtable cache refresh job scheduled with cron expression: ${cronExpression}`);
        } else {
            console.error(`Invalid cron expression: ${cronExpression}. Scheduled job not started.`);
        }
    }

    stopScheduledJob() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = null;
            console.log("Airtable cache refresh job stopped.");
        }
    }

    // --- Accessor Methods (similar to previous version) ---
    getRecordById(baseName, tableName, recordId) {
        return this.cache[baseName]?.tables[tableName]?.byId.get(recordId);
    }
    getDocumentTypeByDocTypeId(docTypeId) {
        return this.cache.deltaDocuments?.tables.documentTypes?.byId.get(docTypeId);
    }
    getAllRecords(baseName, tableName) {
        return this.cache[baseName]?.tables[tableName]?.all || [];
    }
}

// Example Usage (conceptual):
// const apiKey = process.env.AIRTABLE_API_KEY;
// const axios = require('axios');
// const airtableCache = new AirtableCacheService(apiKey, axios.create(), './my_cache_dir');
// async function main() {
//     await airtableCache.initializeCache();
//     airtableCache.startScheduledJob('0 3 * * *'); // Run daily at 3 AM
//     // ... application logic using cache ...
// }
// main().catch(console.error);

// module.exports = AirtableCacheService;
```

**Key changes in the conceptual code:**
-   **File I/O**: Added `_getCacheFilePath`, `_ensureCacheDirectory`, `_saveBaseCacheToFile`, `_loadBaseCacheFromFile` using Node.js `fs.promises`.
-   **Cache Structure in File**: JSON files will store an object with `lastFetched` (ISO string timestamp) and a `tables` object containing the raw arrays of records for each table within that base.
-   **`initializeCache` Logic**: 
    -   Attempts to load from file first.
    -   Checks `lastFetched` timestamp against `MAX_CACHE_AGE_HOURS`.
    -   If file is missing, stale, or `forceLiveFetch` is true, it calls `_fetchAndCacheBaseLive`.
    -   `_fetchAndCacheBaseLive` fetches all tables for a given base, populates the in-memory cache, and then calls `_saveBaseCacheToFile`.
-   **`_populateInMemoryCacheForTable`**: Helper to build the `.all` array and `.byId` Map in `this.cache` from a given set of records (either from file or live fetch).
-   **Scheduled Job**: 
    -   `scheduledDailyFetchAndPersist()` calls `initializeCache(true)`.
    -   `startScheduledJob(cronExpression)` uses `node-cron` to schedule the daily task. Configurable cron expression and timezone.
    -   `stopScheduledJob()` to stop the cron task.
-   The `baseConfigs` in `initializeCache` now map more directly to how data for each base and its tables would be fetched and stored.

### 6.6. Cache Update Strategy

-   **Initial Fetch & Load on Startup:**
    -   When `delta-ai` starts, the `AirtableCacheService.initializeCache()` method is invoked.
    -   It first attempts to load cached data for each configured Airtable base from corresponding JSON files (e.g., `data/cache/airtable/cache_productRegistrationTracking.json`).
    -   It checks a `lastFetched` timestamp within each file. If the data is considered fresh (e.g., fetched within the last 25 hours), it's used to populate the in-memory cache.
    -   If a cache file is missing, stale, or if `forceLiveFetch` is true (e.g., during the scheduled daily update), the service performs a live fetch from the Airtable API for all tables in that base. The fetched data populates the in-memory cache and then overwrites the corresponding JSON cache file with the new data and an updated `lastFetched` timestamp.
-   **Scheduled Daily Refresh & Persistence:**
    -   A cron job (e.g., using `node-cron`, scheduled to run daily at a specific time like 2:00 AM) will trigger the `AirtableCacheService.scheduledDailyFetchAndPersist()` method.
    -   This method forces a live fetch of all configured Airtable data, updates the in-memory cache, and saves the fresh data to the respective JSON files.
-   **Manual Trigger (Still Recommended as Optional):**
    -   An API endpoint in `delta-ai` could still be exposed to allow for on-demand cache refreshes. This would call `AirtableCacheService.scheduledDailyFetchAndPersist()`.

This revised strategy provides a balance of performance (loading from local files), data freshness (daily updates), and robustness.

## 7. Admin View for Airtable Cache Visualization

To facilitate debugging, monitoring, and understanding of the data `delta-ai` utilizes from Airtable, a dedicated administrative view will be created. This view will allow inspection of the in-memory cache managed by the `AirtableCacheService`.

### 7.1. Purpose and Goals

-   **Transparency:** Provide a clear view into the data fetched and cached from both the `Product Registration Tracking` and `Delta Documents` Airtable bases.
-   **Debugging:** Help developers verify the correctness of the caching mechanism, including data freshness and completeness.
-   **Monitoring:** Allow for quick checks on the cache status, such as `lastFetched` timestamps and record counts.

### 7.2. Key Components and Features

1.  **Express.js Route:**
    -   A new route will be established, for example, `/admin/airtable-cache-viewer`. This route should be protected and accessible only to authenticated administrators.
    -   The route handler will interact with the `AirtableCacheService` instance to retrieve the cached data.
    -   It will then pass this data to a new EJS template for rendering.
2.  **EJS Template (`views/airtableCacheViewer.ejs`):**
    -   A new EJS file dedicated to displaying the cache content.
    -   **Layout:**
        -   The page should allow users to select an Airtable base (e.g., `Product Registration Tracking` or `Delta Documents`).
        -   Upon selecting a base, it should display the `lastFetched` timestamp for that base's cache.
        -   It should then list all cached tables for the selected base.
        -   Users should be able to select a table to view its records.
    -   **Data Display:**
        -   For a selected table, records will be displayed, likely in an HTML table format.
        -   Each row will represent an Airtable record, and columns will represent fields.
        -   Given the potential for many fields and complex data types (linked records, attachments, long text), the view might initially display key fields or a summary. An option to view the full raw JSON for a specific record could be provided.
        -   Display the total number of records cached for the selected table.
3.  **Interaction with `AirtableCacheService`:**
    -   The route handler will primarily use accessor methods from the `AirtableCacheService`, such as:
        -   `getAllRecords(baseName, tableName)`: To get all records for a specific table.
        -   A new method like `getCacheOverview()` or `getAllCachedData()`: To get a structured representation of the entire cache, including base names, table names within each base, their record counts, and `lastFetched` timestamps for each base.
        -   `getBasesStatus()`: To retrieve a list of cached bases and their `lastFetched` timestamps for the initial base selection.
4.  **User Interface (UI) Considerations:**
    -   Use clear, navigable sections for bases and tables.
    -   Dropdown menus for selecting the base and then the table to view can improve usability.
    -   A button to manually trigger a cache refresh (calling an admin-only endpoint that invokes `airtableCacheService.scheduledDailyFetchAndPersist()`) could be beneficial for debugging and immediate updates.
    -   The styling should be consistent with other admin/debug views in the application (e.g., using elements from `settings.ejs` or `debug.ejs` as a reference if applicable).

### 7.3. Data to Display per Table View

-   Base Name
-   Table Name
-   `lastFetched` timestamp for the base.
-   Total number of cached records for the table.
-   A paginated or scrollable table of records, showing:
    -   Record ID (Airtable's `id` field).
    -   Key fields (configurable or a sensible default set initially).
    -   A way to view the full JSON of a single record if needed.

This view will be an invaluable tool for the development and maintenance of the Airtable integration within `delta-ai`.
