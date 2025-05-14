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
    // Get the cache service
    const cacheService = await airtableServices.getAirtableCacheService(config);
    
    // Get cache status
    const cacheStatus = cacheService.getCacheStatus();
    
    // Get the selected base and table from query parameters
    const selectedBase = req.query.base || Object.keys(cacheStatus)[0];
    const selectedTable = req.query.table || 
      (selectedBase && cacheStatus[selectedBase]?.tables 
        ? Object.keys(cacheStatus[selectedBase].tables)[0] 
        : null);
    
    // Get the records for the selected table
    let records = [];
    if (selectedBase && selectedTable) {
      records = cacheService.getAllRecords(selectedBase, selectedTable);
      
      // Limit to 100 records for display
      if (records.length > 100) {
        records = records.slice(0, 100);
      }
    }
    
    // Render the cache viewer
    res.render('airtableCacheViewer', {
      cacheStatus,
      selectedBase,
      selectedTable,
      records,
      totalRecords: cacheService.getAllRecords(selectedBase, selectedTable)?.length || 0,
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
    const cacheService = await airtableServices.getAirtableCacheService(config, console, true);
    
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