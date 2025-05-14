# Delta-DMS Paperless-NGX Complete Schema Documentation

This document provides a comprehensive overview of all schema components in the Delta-DMS Paperless-NGX system, including document types, tags, correspondents, custom fields, and metadata structures.

## 1. Document Types

The system has 18 document types organized into logical categories:

### Communication Documents
| ID | Name | Document Count | Matching Algorithm |
|----|------|---------------|-------------------|
| 13 | Correspondence_Email | 144 | Any (0) |
| 15 | Correspondence_Mail | 2 | Regular Expression (6) |

### Product Information Documents
| ID | Name | Document Count | Matching Algorithm |
|----|------|---------------|-------------------|
| 14 | Product_CofA | 1 | Regular Expression (6)|
| 11 | Product_CSF | 1 | Regular Expression (6) |
| 7 | Product_label | 6 | Regular Expression (6) |
| 9 | Product_labs | 1 | Regular Expression (6) |
| 8 | Product_SDS | 1 | Regular Expression (6) |

### Registration and License Documents
| ID | Name | Document Count | Matching Algorithm |
|----|------|---------------|-------------------|
| 20 | REG_APP | 1 | Regular Expression (6) |
| 22 | REG_APP_NEW | 0 | Regular Expression (6) |
| 23 | REG_APP_RENEW | 0 | Regular Expression (6) |
| 21 | REG_APP_SUB | 39 | Regular Expression (6) |
| 17 | REG_CERT | 122 | Regular Expression (6) |
| 18 | REP_TON | 22 | Regular Expression (6) |

### Other Documents
| ID | Name | Document Count | Matching Algorithm |
|----|------|---------------|-------------------|
| 25 | Certificate | 5 | Any (1) |
| 26 | Notice | 1 | Any (1) |
| 24 | Notification | 1 | Any (1) |
| 27 | Report | 1 | Any (1) |
| 5 | scanned | 1 | Any (0) |

## 2. Tags

The system contains 103 tags organized into the following categories:

### Special Purpose Tags
| ID | Name | Color | Document Count |
|----|------|-------|---------------|
| 67 | INBOX | #8d3fcf | 56 |
| 103 | ai-done | #a6cee3 | 9 |
| 99 | ai-todo | #ce3e56 | 9 |
| 78 | confidential | #e493a1 | 1 |
| 66 | delta-docs-gpt | #af722b | 0 |
| 101 | delta_docs_gpt_auto | #e18aba | 0 |
| 65 | paperless-gpt | #a0cd39 | 0 |
| 72 | payment | #e59ad0 | 1 |

### Client Tags (Selected Sample)
| ID | Name | Color | Document Count |
|----|------|-------|---------------|
| 6 | Clients/ABM | #dfe8a3 | 0 |
| 7 | Clients/AGR | #39cd72 | 0 |
| 8 | Clients/APHIS | #e9aae6 | 0 |
| 64 | Clients/ARB | #a4e28c | 68 |
| 9 | Clients/BIN | #d65e60 | 53 |
| 10 | Clients/BOR | #d6af5b | 37 |
| 12 | Clients/ECO | #c57331 | 1 |
| 1 | Clients/EEA | #58D5D3 | 20 |
| 13 | Clients/GWB | #e18ac1 | 18 |
| 14 | Clients/IBA | #a552d3 | 7 |
| 95 | Clients/MBF | #c0db70 | 1 |
| 2 | Clients/OMY | #7274db | 56 |
| 68 | Clients/PLL | #69bf2f | 13 |
| 15 | Clients/SAG | #dd7acc | 6 |
| 87 | Clients/SEI | #e6d29b | 1 |
| 5 | Clients/SYM | #6a2fbe | 40 |
| 105 | Clients/USB | #a6cee3 | 1 |

### Regulator Tags
| ID | Name | Color | Document Count |
|----|------|-------|---------------|
| 35 | Regulators/AZ | #c0db70 | 3 |
| 34 | Regulators/CA | #c0db70 | 1 |
| 53 | Regulators/CT | #c0db70 | 2 |


### Product Tags
| ID | Name | Color | Document Count |
|----|------|-------|---------------|
| 82 | Product/CofA | #7baf2b | 1 |
| 79 | Product/CSF | #2ebb8d | 1 |

## 3. Correspondents

The system has 60 correspondents categorized as follows:

### State Departments of Agriculture
| ID | Name | Document Count |
|----|------|---------------|
| 60 | Arizona Department of Agriculture | 0 |
| 35 | AZ-DOA | 3 |
| 34 | CA-CDFA | 1 |
| 53 | CT-DOA | 2 |
| 36 | IL-DOA | 16 |
| 1 | ILLINOIS DEPARTMENT OF AGRICULTURE | 0 |
| 47 | IN-OISC | 1 |
| 56 | Kansas Department of Agriculture | 0 |
| 48 | KY-DRS | 3 |
| 50 | MA-DOA | 2 |

### Email Addresses (Selected Sample)
| ID | Name | Document Count |
|----|------|---------------|
| 9 | biofertregistration@delta-ac.com | 42 |
| 13 | bobbette.b.gosselin@agr.nh.gov | 4 |
| 54 | Brenda.Eller@illinois.gov | 4 |
| 21 | cbaker@delta-ac.com | 1 |
| 29 | Cheryl.Benton@illinois.gov | 2 |
| 14 | dcorywatson@delta-ac.com | 16 |
| 18 | deltascanner12510@gmail.com | 2 |
| 17 | Deven.Chiasson@mass.gov | 4 |
| 7 | eipas@mass.gov | 3 |
| 20 | emjacobs@delta-ac.com | 10 |
| 12 | FertilizerTonnage@agr.wa.gov | 1 |
| 55 | kda.no_reply@ks.gov | 1 |
| 25 | lmermoud@purdue.edu | 9 |

## 4. Custom Fields

The system defines 9 custom fields to extend document metadata:

| Field Name | Data Type | Description | Document Count |
|------------|-----------|-------------|---------------|
| is_new_registration | Boolean | Indicates whether a document represents a new registration (as opposed to a renewal) | 114 |
| document_content | Text | Stores additional textual content or notes related to the document | 192 |
| airtable_record_url | Text | Reference link to the associated Airtable record | 85 |
| google_drive_url | Text | Reference link to the associated Google Drive file | 86 |
| document_subtype | Select | Categorizes documents within their primary type (finer granularity) | 211 |
| document_type | Select | High-level categorization of document purpose/function | 211 |
| processing_status | Select | Tracks the current state of document processing in workflows | 206 |
| regulator_id | Select | References the regulatory authority associated with the document | 330 |
| client_id | Select | References the client associated with the document | 332 |

## 5. Core Document Structure

Each document in the system has the following core attributes:

### Basic Metadata
- ID (unique identifier)
- Title
- Document Type (reference to document_types table)
- Correspondent (reference to correspondents table)
- Tags (multiple references to tags table)
- Created Date/Time
- Modified Date/Time
- Added Date/Time
- Owner (user ID, can be null)

### File Information
- Original Filename
- Archived Filename
- MIME Type
- Page Count
- Storage Path (can be null)
- Archive Serial Number (can be null)

### Content
- Full text content extracted from the document

### Custom Fields
- One entry per custom field defined in the system (references custom_fields table)

## 6. Storage Paths


## 7. Integration Points

The schema suggests integration with multiple external systems:
- Airtable for structured data management (`airtable_record_url`)
- Google Drive for additional document storage (`google_drive_url`)
- Google Cloud Storage for ultimate single source of truth

## 8. Workflow Structure

The document schema supports a workflow that includes:

1. **Intake**:
   - Document capture and OCR
   - Assignment to inbox (INBOX tag)
   - Initial classification by document type and correspondent
   - After consumption by Delta DMS, another tag is applied: `delta-docs-gpt` or similar that triggers the next processing step: Better OCR? DocumentAI, etc.
   
Key Entity Recognition (Client, Regulator, Product, etc.)

2. **Processing**:
   - Assignment of custom metadata (client_id, regulator_id)
   - Classification with document type/subtype
   - Tracking via processing_status
   - Integration with external systems (Airtable, Google Drive)

3. **Organization**:
   - Client-based tagging
   - Product-specific tagging
   - Categorization by document type



---

*Note: This schema documentation is based on the configuration of the Delta-DMS Paperless-NGX system as of May 13, 2025.*
