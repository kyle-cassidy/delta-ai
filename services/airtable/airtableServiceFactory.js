/**
 * AirtableServiceFactory - Factory for creating and initializing Airtable services
 * 
 * This factory creates and initializes the AirtableCacheService and ensures
 * it's properly configured with the necessary API keys and settings.
 */

const AirtableCacheService = require('./airtableCacheService');

class AirtableServiceFactory {
    /**
     * Creates a new instance of the AirtableServiceFactory
     * 
     * @param {Object} config - Application configuration
     * @param {Object} logger - Logger service instance
     */
    constructor(config, logger = console) {
        this.config = config;
        this.logger = logger;
        this.cacheService = null;
    }

    /**
     * Initializes and returns the AirtableCacheService
     * 
     * @param {boolean} [forceCacheRefresh=false] - Whether to force a refresh of the cache on initialization
     * @returns {Promise<AirtableCacheService>} Initialized cache service
     */
    async getAirtableCacheService(forceCacheRefresh = false) {
        if (!this.cacheService) {
            this.logger.info('Initializing AirtableCacheService...');
            
            // Validate API key is available
            const apiKey = this.config.airtable?.apiKey;
            if (!apiKey) {
                throw new Error('Airtable API key not configured. Please set it in your environment or configuration.');
            }
            
            // Create cache service
            const cacheDirectory = this.config.airtable?.cacheDirectory || './data/cache/airtable';
            this.cacheService = new AirtableCacheService(apiKey, cacheDirectory);
            
            // Initialize cache
            await this.cacheService.initializeCache(forceCacheRefresh);
            
            // Set up scheduled refresh if enabled in config
            if (this.config.airtable?.enableScheduledRefresh) {
                const cronExpression = this.config.airtable?.refreshCronExpression || '0 2 * * *'; // Default: 2 AM daily
                this.cacheService.startScheduledJob(cronExpression);
                this.logger.info(`Scheduled cache refresh enabled with cron expression: ${cronExpression}`);
            }
            
            this.logger.info('AirtableCacheService initialized successfully');
        }
        
        return this.cacheService;
    }

    /**
     * Stops any scheduled jobs and cleans up resources
     */
    shutdown() {
        if (this.cacheService) {
            this.cacheService.stopScheduledJob();
            this.logger.info('AirtableCacheService scheduled job stopped');
        }
    }
}

module.exports = AirtableServiceFactory;