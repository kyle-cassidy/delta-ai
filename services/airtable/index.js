/**
 * Airtable Services Index
 * 
 * This file exports all Airtable-related services for easy access
 * throughout the application.
 */

const AirtableCacheService = require('./airtableCacheService');
const AirtableServiceFactory = require('./airtableServiceFactory');

// Export singleton factory instance with lazy initialization
let serviceFactoryInstance = null;

/**
 * Gets the AirtableServiceFactory singleton instance
 * 
 * @param {Object} config - Application configuration
 * @param {Object} [logger=console] - Logger service instance
 * @returns {AirtableServiceFactory} Factory instance
 */
function getAirtableServiceFactory(config, logger = console) {
    if (!serviceFactoryInstance) {
        serviceFactoryInstance = new AirtableServiceFactory(config, logger);
    }
    return serviceFactoryInstance;
}

/**
 * Gets the AirtableCacheService instance (initialized lazily)
 * 
 * @param {Object} config - Application configuration
 * @param {Object} [logger=console] - Logger service instance
 * @param {boolean} [forceCacheRefresh=false] - Whether to force a refresh of the cache
 * @returns {Promise<AirtableCacheService>} Initialized cache service
 */
async function getAirtableCacheService(config, logger = console, forceCacheRefresh = false) {
    const factory = getAirtableServiceFactory(config, logger);
    return await factory.getAirtableCacheService(forceCacheRefresh);
}

/**
 * Shutdown Airtable services gracefully
 */
function shutdown() {
    if (serviceFactoryInstance) {
        serviceFactoryInstance.shutdown();
    }
}

module.exports = {
    AirtableCacheService,
    AirtableServiceFactory,
    getAirtableServiceFactory,
    getAirtableCacheService,
    shutdown
};