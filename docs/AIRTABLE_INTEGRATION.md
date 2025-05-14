# Airtable Integration for Delta-AI

This document describes how to set up and use the Airtable integration in the Delta-AI application.

## Overview

The Airtable integration provides a way to cache data from Airtable bases and tables for use in document classification and metadata extraction. It maintains both an in-memory cache for quick access and a file-based cache for persistence between application restarts.

## Configuration

The Airtable integration can be configured using environment variables. These can be added to your `.env` file.

### Required Configuration

- `AIRTABLE_API_KEY`: Your Airtable API key. This is required for the integration to work.

### Optional Configuration

- `AIRTABLE_CACHE_DIR`: Directory to store cache files. Defaults to `./data/cache/airtable`.
- `AIRTABLE_ENABLE_SCHEDULED_REFRESH`: Whether to enable scheduled cache refresh. Values: `yes` or `no`. Defaults to `yes`.
- `AIRTABLE_REFRESH_CRON`: Cron expression for refresh schedule. Defaults to `0 2 * * *` (2 AM daily).

Example `.env` configuration:

```
AIRTABLE_API_KEY=your_api_key_here
AIRTABLE_CACHE_DIR=./data/cache/airtable
AIRTABLE_ENABLE_SCHEDULED_REFRESH=yes
AIRTABLE_REFRESH_CRON=0 2 * * *
```

## Configured Airtable Bases

The Airtable integration is currently configured to work with two specific Airtable bases:

1. **Product Registration Tracking** (Base ID: `appkaXsw8Q6dSltKd`)
   - Used as the primary source of contextual information
   - Key tables:
     - Registration Tracking (Table ID: `tblyPyT9SZWkGFcoD`)
     - Products (Table ID: `tblYe0DJIkwk758Az`)
     - Client List (Table ID: `tblDSlAkIve4Ap9u8`)
     - States (Table ID: `tblU5FD7w4hOEAM8k`)
     - Reg Reqs (Table ID: `tbl29guRFK9Q2l7CL`)

2. **Delta Documents** (Base ID: `appkWl7oSFxka7JEu`)
   - Used as the primary destination and structured repository
   - Key tables:
     - document_types (Table ID: `tblNYeqUgJBa9l2XD`)
     - clients (Table ID: `tbl6CrMvhmVCf7mdQ`)
     - states (Table ID: `tblD6G1lBmSsGCxfh`)
     - products (Table ID: `tblW9piLEHybdSOlT`)
     - tags (Table ID: `tblImOnbMhtkhQ1Jt`)

## Admin Interface

The Airtable integration includes an admin interface to view and manage the cache. This can be accessed at the following URL:

```
/admin/airtable/cache-viewer
```

### Admin Interface Features

- View the status of the cache for each base
- Browse the tables and records in the cache
- Manually trigger a cache refresh

## Using the Airtable Cache Service in Code

To use the AirtableCacheService in your code, you can import it from the `services/airtable` module.

```javascript
const { getAirtableCacheService } = require('./services/airtable');
const config = require('./config/config');

async function example() {
  // Get the cache service
  const cacheService = await getAirtableCacheService(config);
  
  // Get all records from a table
  const records = cacheService.getAllRecords('deltaDocuments', 'documentTypes');
  
  // Get a specific record by ID
  const record = cacheService.getRecordById('deltaDocuments', 'documentTypes', 'recXXXXXXXXXXXXXX');
  
  // Get a document type by doc_type_id
  const docType = cacheService.getDocumentTypeByDocTypeId('REG_CERT');
  
  // Get the status of the cache
  const status = cacheService.getCacheStatus();
}
```

## Cache Refresh Mechanism

The cache is refreshed in the following ways:

1. **On Application Startup**: The cache is initialized when the application starts. It will try to load from the file-based cache first, and if the cache is not found or is stale, it will fetch fresh data from Airtable.

2. **Scheduled Refresh**: If enabled, the cache will be refreshed on a schedule defined by the cron expression in the configuration. The default is daily at 2 AM.

3. **Manual Refresh**: The cache can be manually refreshed through the admin interface by clicking the "Refresh Cache" button.

## Cache Structure

The cache is stored in memory and on disk with the following structure:

```javascript
{
  "productRegistrationTracking": {
    "lastFetched": "2023-05-13T12:00:00.000Z",
    "tables": {
      "registrationTracking": [...],
      "products": [...],
      // Other tables
    }
  },
  "deltaDocuments": {
    "lastFetched": "2023-05-13T12:00:00.000Z",
    "tables": {
      "documentTypes": [...],
      "clients": [...],
      // Other tables
    }
  }
}
```

Each table in the cache has two data structures:

1. `all`: An array of all records in the table
2. `byId`: A Map with record IDs as keys and record objects as values for quick lookups

## Error Handling

The Airtable integration includes error handling for common issues:

- If the Airtable API key is not configured, the integration will log a warning and skip initialization.
- If a table cannot be fetched from Airtable, the integration will log an error and continue with other tables.
- If the cache file cannot be read or written, the integration will log an error and proceed with the in-memory cache.

## Implementation Details

The Airtable integration is implemented using the following components:

- `AirtableCacheService`: The main service that handles fetching, caching, and retrieving data from Airtable.
- `AirtableServiceFactory`: A factory that creates and manages instances of the AirtableCacheService.
- Routes and views for the admin interface.

The integration uses the official Airtable.js package for API access and Node's built-in file system module for persistence.

## Additional Documentation

For more detailed documentation on the Airtable API, please refer to the [Airtable API documentation](https://airtable.com/developers/web/api/introduction).

For a detailed strategy on how the Airtable integration is used in the Delta-AI application, see the [Airtable Exploration and Integration Strategy](../planning/airtable_exploration_and_integration_strategy.md) document.