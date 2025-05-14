/**
 * Tests for AirtableCacheService
 * 
 * This file contains tests for the AirtableCacheService functionality.
 */

const fs = require('fs').promises;
const path = require('path');
const Airtable = require('airtable');
const AirtableCacheService = require('../services/airtable/airtableCacheService');

// Mock dependencies
jest.mock('airtable');
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn().mockResolvedValue(undefined),
  }
}));

describe('AirtableCacheService', () => {
  let cacheService;
  const mockApiKey = 'test_api_key';
  const testCacheDir = './test_cache';
  
  // Sample data for testing
  const sampleRecords = [
    { id: 'rec1', fields: { name: 'Record 1', doc_type_id: 'TYPE_A' } },
    { id: 'rec2', fields: { name: 'Record 2', doc_type_id: 'TYPE_B' } },
  ];
  
  const sampleCacheFile = {
    lastFetched: new Date().toISOString(),
    tables: {
      documentTypes: sampleRecords
    }
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock Airtable.configure
    Airtable.configure = jest.fn();
    
    // Mock Airtable.base
    const mockBase = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eachPage: jest.fn((callback) => {
          callback(sampleRecords, () => {});
          return Promise.resolve();
        })
      })
    });
    Airtable.base = jest.fn().mockReturnValue(mockBase);
    
    // Create service instance
    cacheService = new AirtableCacheService(mockApiKey, testCacheDir);
  });
  
  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(cacheService.apiKey).toBe(mockApiKey);
      expect(cacheService.cacheDirectory).toBe(testCacheDir);
      expect(cacheService.isInitialized).toBe(false);
      expect(cacheService.cronJob).toBeNull();
      expect(Airtable.configure).toHaveBeenCalledWith({ apiKey: mockApiKey });
    });
  });
  
  describe('_getCacheFilePath', () => {
    it('should return correct cache file path', () => {
      const baseId = 'test_base_id';
      const expectedPath = path.join(testCacheDir, `cache_${baseId}.json`);
      
      expect(cacheService._getCacheFilePath(baseId)).toBe(expectedPath);
    });
  });
  
  describe('_ensureCacheDirectory', () => {
    it('should create cache directory if it does not exist', async () => {
      await cacheService._ensureCacheDirectory();
      
      expect(fs.promises.mkdir).toHaveBeenCalledWith(testCacheDir, { recursive: true });
    });
    
    it('should handle errors when creating directory', async () => {
      const error = new Error('Failed to create directory');
      fs.promises.mkdir.mockRejectedValueOnce(error);
      
      await expect(cacheService._ensureCacheDirectory()).rejects.toThrow(error);
    });
  });
  
  describe('_loadBaseCacheFromFile', () => {
    it('should load cache from file if it exists and is fresh', async () => {
      const baseId = 'test_base_id';
      const filePath = path.join(testCacheDir, `cache_${baseId}.json`);
      
      fs.promises.readFile.mockResolvedValueOnce(JSON.stringify(sampleCacheFile));
      
      const result = await cacheService._loadBaseCacheFromFile(baseId);
      
      expect(fs.promises.readFile).toHaveBeenCalledWith(filePath, 'utf-8');
      expect(result).toEqual(sampleCacheFile);
    });
    
    it('should return null if file does not exist', async () => {
      const error = { code: 'ENOENT' };
      fs.promises.readFile.mockRejectedValueOnce(error);
      
      const result = await cacheService._loadBaseCacheFromFile('test_base_id');
      
      expect(result).toBeNull();
    });
    
    it('should return null if cache is stale', async () => {
      const staleCache = {
        ...sampleCacheFile,
        lastFetched: new Date(Date.now() - (26 * 60 * 60 * 1000)).toISOString() // 26 hours old
      };
      
      fs.promises.readFile.mockResolvedValueOnce(JSON.stringify(staleCache));
      
      const result = await cacheService._loadBaseCacheFromFile('test_base_id');
      
      expect(result).toBeNull();
    });
  });
  
  describe('_fetchAllRecordsForTable', () => {
    it('should fetch all records for a table', async () => {
      const baseId = 'test_base_id';
      const tableId = 'test_table_id';
      
      const records = await cacheService._fetchAllRecordsForTable(baseId, tableId);
      
      expect(Airtable.base).toHaveBeenCalledWith(baseId);
      expect(records).toEqual(sampleRecords);
    });
  });
  
  describe('_populateInMemoryCacheForTable', () => {
    it('should populate in-memory cache with records', () => {
      const baseId = 'test_base';
      const tableName = 'testTable';
      
      cacheService._populateInMemoryCacheForTable(baseId, tableName, sampleRecords);
      
      expect(cacheService.cache[baseId].tables[tableName].all).toEqual(sampleRecords);
      expect(cacheService.cache[baseId].tables[tableName].byId.get('rec1')).toEqual(sampleRecords[0]);
      expect(cacheService.cache[baseId].tables[tableName].byId.get('rec2')).toEqual(sampleRecords[1]);
    });
    
    it('should use custom primary key function if provided', () => {
      const baseId = 'test_base';
      const tableName = 'testTable';
      const pkFn = (record) => record.fields.doc_type_id;
      
      cacheService._populateInMemoryCacheForTable(baseId, tableName, sampleRecords, pkFn);
      
      expect(cacheService.cache[baseId].tables[tableName].byId.get('TYPE_A')).toEqual(sampleRecords[0]);
      expect(cacheService.cache[baseId].tables[tableName].byId.get('TYPE_B')).toEqual(sampleRecords[1]);
    });
  });
  
  describe('accessor methods', () => {
    beforeEach(() => {
      // Set up in-memory cache for testing
      cacheService.cache = {
        testBase: {
          tables: {
            testTable: {
              all: sampleRecords,
              byId: new Map([
                ['rec1', sampleRecords[0]],
                ['rec2', sampleRecords[1]]
              ])
            }
          }
        },
        deltaDocuments: {
          tables: {
            documentTypes: {
              all: sampleRecords,
              byId: new Map([
                ['TYPE_A', sampleRecords[0]],
                ['TYPE_B', sampleRecords[1]]
              ])
            }
          }
        }
      };
    });
    
    it('getRecordById should return record by ID', () => {
      const record = cacheService.getRecordById('testBase', 'testTable', 'rec1');
      expect(record).toEqual(sampleRecords[0]);
    });
    
    it('getDocumentTypeByDocTypeId should return document type by doc_type_id', () => {
      const docType = cacheService.getDocumentTypeByDocTypeId('TYPE_A');
      expect(docType).toEqual(sampleRecords[0]);
    });
    
    it('getAllRecords should return all records for a table', () => {
      const records = cacheService.getAllRecords('testBase', 'testTable');
      expect(records).toEqual(sampleRecords);
    });
    
    it('getCacheStatus should return cache status', () => {
      const status = cacheService.getCacheStatus();
      
      expect(status.testBase.tables.testTable.recordCount).toBe(2);
      expect(status.deltaDocuments.tables.documentTypes.recordCount).toBe(2);
    });
  });
});