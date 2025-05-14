const fs = require('fs').promises;
const path = require('path');

class ConfigService {
  constructor() {
    this.documentTypes = null;
    this.correspondents = null;
    this.configDir = path.join(process.cwd(), 'config');
  }

  async loadDocumentTypes() {
    if (this.documentTypes) return this.documentTypes;
    
    try {
      const filePath = path.join(this.configDir, 'documentTypes.json');
      const data = await fs.readFile(filePath, 'utf8');
      this.documentTypes = JSON.parse(data);
      return this.documentTypes;
    } catch (error) {
      console.error('[ERROR] Failed to load document types:', error);
      return { document_types: [] };
    }
  }

  async loadCorrespondents() {
    if (this.correspondents) return this.correspondents;
    
    try {
      const filePath = path.join(this.configDir, 'correspondents.json');
      const data = await fs.readFile(filePath, 'utf8');
      this.correspondents = JSON.parse(data);
      return this.correspondents;
    } catch (error) {
      console.error('[ERROR] Failed to load correspondents:', error);
      return { correspondents: [] };
    }
  }

  async getDocumentTypePrompt() {
    const documentTypes = await this.loadDocumentTypes();
    
    if (!documentTypes || !documentTypes.document_types || documentTypes.document_types.length === 0) {
      return '';
    }

    let prompt = 'Document Types Reference:\n';
    documentTypes.document_types.forEach(docType => {
      prompt += `- ${docType.name}: ${docType.description}\n`;
      if (docType.common_terms && docType.common_terms.length > 0) {
        prompt += `  Common terms: ${docType.common_terms.join(', ')}\n`;
      }
    });

    return prompt;
  }

  async getCorrespondentPrompt() {
    const correspondents = await this.loadCorrespondents();
    
    if (!correspondents || !correspondents.correspondents || correspondents.correspondents.length === 0) {
      return '';
    }

    let prompt = 'Correspondent Reference:\n';
    correspondents.correspondents.forEach(correspondent => {
      prompt += `- ${correspondent.name}: ${correspondent.description}\n`;
      
      // Add specific identifiers based on correspondent type
      if (correspondent.id === 'internal') {
        prompt += `  Identifiers: ${correspondent.identifiers.join(', ')}\n`;
        prompt += `  Email domains: ${correspondent.email_domains.join(', ')}\n`;
      }
      else if (correspondent.common_vendors) {
        prompt += '  Common vendors:\n';
        correspondent.common_vendors.forEach(vendor => {
          prompt += `    * ${vendor.name}\n`;
        });
      }
      else if (correspondent.common_clients) {
        prompt += '  Common clients:\n';
        correspondent.common_clients.forEach(client => {
          prompt += `    * ${client.name}\n`;
        });
      }
      else if (correspondent.agencies) {
        prompt += '  Government agencies:\n';
        correspondent.agencies.forEach(agency => {
          prompt += `    * ${agency.name}\n`;
        });
      }
      else if (correspondent.institutions) {
        prompt += '  Financial institutions:\n';
        correspondent.institutions.forEach(institution => {
          prompt += `    * ${institution.name}\n`;
        });
      }
      else if (correspondent.providers && correspondent.id === 'utilities') {
        prompt += '  Utility providers:\n';
        correspondent.providers.forEach(provider => {
          prompt += `    * ${provider.name}\n`;
        });
      }
      else if (correspondent.companies) {
        prompt += '  Shipping companies:\n';
        correspondent.companies.forEach(company => {
          prompt += `    * ${company.name}\n`;
        });
      }
      else if (correspondent.providers && correspondent.id === 'insurance') {
        prompt += '  Insurance providers:\n';
        correspondent.providers.forEach(provider => {
          prompt += `    * ${provider.name}\n`;
        });
      }
    });

    return prompt;
  }

  async getEnhancedPrompt() {
    const documentTypePrompt = await this.getDocumentTypePrompt();
    const correspondentPrompt = await this.getCorrespondentPrompt();
    
    return `
${documentTypePrompt}

${correspondentPrompt}

Use the provided document types and correspondent information to accurately classify the document. If the document doesn't match any of the provided categories, you may suggest a new appropriate category.
`;
  }
}

module.exports = new ConfigService();