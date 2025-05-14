/**
 * Airtable Admin Routes
 * 
 * These routes provide administrative access to view and manage the Airtable cache.
 */

const express = require('express');
const router = express.Router();
const airtableServices = require('../services/airtable');
const config = require('../config/config');

/**
 * Renders the Airtable cache admin view
 */
router.get('/cache-viewer', async (req, res) => {
  try {
    console.log('Cache viewer requested');
    
    // Get the cache service
    const cacheService = await airtableServices.getAirtableCacheService(config);
    
    // Get cache status
    const cacheStatus = cacheService.getCacheStatus();
    console.log('Cache status retrieved:', Object.keys(cacheStatus));
    
    // Log cache structure
    for (const [baseName, baseData] of Object.entries(cacheStatus)) {
      console.log(`Base: ${baseName}, Tables: ${Object.keys(baseData.tables).length}`);
      for (const [tableName, tableInfo] of Object.entries(baseData.tables)) {
        console.log(`  Table: ${tableName}, Records: ${tableInfo.recordCount}`);
      }
    }
    
    // Get the selected base and table from query parameters
    const selectedBase = req.query.base || Object.keys(cacheStatus)[0];
    console.log(`Selected base: ${selectedBase}`);
    
    const selectedTable = req.query.table || 
      (selectedBase && cacheStatus[selectedBase]?.tables 
        ? Object.keys(cacheStatus[selectedBase].tables)[0] 
        : null);
    console.log(`Selected table: ${selectedTable}`);
    
    // Get the records for the selected table
    let records = [];
    let totalRecords = 0;
    if (selectedBase && selectedTable) {
      const allRecords = cacheService.getAllRecords(selectedBase, selectedTable);
      console.log(`getAllRecords returned ${allRecords ? (Array.isArray(allRecords) ? allRecords.length : 'non-array') : 'null'} records`);
      
      // Ensure records is an array
      records = Array.isArray(allRecords) ? allRecords : [];
      totalRecords = records.length;
      console.log(`Total records for ${selectedBase}/${selectedTable}: ${totalRecords}`);
      
      // Limit to 100 records for display
      if (records.length > 100) {
        records = records.slice(0, 100);
        console.log(`Limited to 100 records for display`);
      }
    }
    
    // Render the cache viewer
    console.log(`Rendering view with ${records.length} records`);
    res.render('airtableCacheViewer', {
      cacheStatus,
      selectedBase,
      selectedTable,
      records,
      totalRecords,
      refreshed: req.query.refreshed,
      pageTitle: 'Airtable Cache Viewer'
    });
  } catch (error) {
    console.error('Error loading Airtable cache viewer:', error);
    res.status(500).render('error', { 
      message: 'Error loading Airtable cache viewer', 
      error,
      pageTitle: 'Error'
    });
  }
});

/**
 * Forces a refresh of the Airtable cache
 */
router.post('/refresh-cache', async (req, res) => {
  try {
    console.log('Forcing cache refresh...');
    // Force live fetch by passing true as the third parameter
    const cacheService = await airtableServices.getAirtableCacheService(config);
    
    // Force initialization with live fetch
    await cacheService.initializeCache(true);
    console.log('Cache refreshed successfully');
    
    res.redirect('/admin/airtable/cache-viewer?refreshed=true');
  } catch (error) {
    console.error('Error refreshing Airtable cache:', error);
    res.status(500).render('error', { 
      message: 'Error refreshing Airtable cache', 
      error,
      pageTitle: 'Error'
    });
  }
});

module.exports = router;