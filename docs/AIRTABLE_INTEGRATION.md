# Airtable Integration for Delta-AI

This document describes the Airtable integration in Delta-AI, which provides contextual data for document classification and metadata extraction.

## Overview

Delta-AI integrates with Airtable to access and utilize structured data for improved document processing. It connects to two primary Airtable bases:

1. **Product Registration Tracking** (Base ID: `appkaXsw8Q6dSltKd`)
   - Provides contextual information about product registrations, clients, states, and regulatory requirements
   - Used to enhance document classification and metadata extraction with relevant context

2. **Delta Documents** (Base ID: `appkWl7oSFxka7JEu`)
   - Serves as a structured repository for document data
   - Provides classification schemas and document type definitions

## Setup and Configuration

### Environment Variables

Add the following environment variables to your `.env` file or Docker environment:

```
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_CACHE_DIR=./data/cache/airtable
AIRTABLE_ENABLE_SCHEDULED_REFRESH=yes
AIRTABLE_REFRESH_CRON=0 2 * * *
```

### Docker Volume Configuration

To ensure cache persistence between container restarts, add a volume mount in your `docker-compose.yml`:

```yaml
volumes:
  - ./data/cache/airtable:/app/data/cache/airtable
```

## Cache Structure

The Airtable integration uses a two-tiered caching system:

1. **In-Memory Cache**
   - Fast access during document processing
   - Organized by base, table, and record
   - Uses Maps for O(1) lookups by ID

2. **File-Based Cache**
   - Persists between application restarts
   - Located in `AIRTABLE_CACHE_DIR`
   - Filename pattern: `cache_<baseId>.json`

## Key Components

### AirtableCacheService

Primary service that handles fetching, caching, and providing access to Airtable data.

**Location**: `services/airtable/airtableCacheService.js`

**Key Features**:
- Fetches data from Airtable API
- Maintains in-memory cache structure
- Manages file-based cache persistence
- Provides accessor methods for cached data
- Handles scheduled cache refresh

### AirtableServiceFactory

Factory for creating and managing AirtableCacheService instances.

**Location**: `services/airtable/airtableServiceFactory.js`

**Key Features**:
- Singleton pattern implementation
- Handles initialization and configuration
- Manages scheduled refresh jobs

### Admin Interface

A web interface for viewing and managing the Airtable cache.

**Access URL**: `/admin/airtable/cache-viewer`

**Features**:
- Browse cached data by base and table
- View record details
- Manually refresh the cache

## Using Cached Airtable Data

### Accessing the Cache Service

```javascript
const airtableServices = require('./services/airtable');
const config = require('./config/config');

// Get the cache service instance
const cacheService = await airtableServices.getAirtableCacheService(config);
```

### Retrieving Records

```javascript
// Get all records from a table
const allDocumentTypes = cacheService.getAllRecords('deltaDocuments', 'documentTypes');

// Get a specific record by ID
const client = cacheService.getRecordById('deltaDocuments', 'clients', 'rec123456');

// Get a document type by doc_type_id
const certificateType = cacheService.getDocumentTypeByDocTypeId('REG_CERT');
```

### Refreshing the Cache

```javascript
// Force refresh the entire cache
await cacheService.initializeCache(true);
```

## Refresh Schedule

By default, the cache refreshes daily at 2 AM. You can customize this schedule by changing the `AIRTABLE_REFRESH_CRON` environment variable to a valid cron expression.

## Cached Tables

### Product Registration Tracking Base

- `registrationTracking`: Product registration data
- `products`: Product information
- `clientList`: Client details
- `states`: State information
- `regReqs`: Regulatory requirements

### Delta Documents Base

- `documentTypes`: Document classification definitions
- `clients`: Client information
- `states`: State information
- `products`: Product details
- `tags`: Document tag definitions

## Troubleshooting

If you encounter issues with the Airtable integration:

1. **Check API Key**: Ensure your `AIRTABLE_API_KEY` is correct and has access to the required bases
2. **Verify Cache Directory**: Make sure the `AIRTABLE_CACHE_DIR` exists and is writable
3. **Force Cache Refresh**: Visit `/admin/airtable/cache-viewer` and use the refresh button
4. **Check Logs**: Look for Airtable-related messages in the application logs

## Additional Notes

- Cache files can be large for bases with many records
- Consider field selection optimizations for production use with very large bases
- The admin interface limits display to 100 records per table to maintain performance
EOL < /dev/null