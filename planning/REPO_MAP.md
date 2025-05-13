# Delta-AI Repository Map

This document provides a comprehensive guide to the Delta-AI application's architecture, codebase structure, and key components. It's designed to help developers quickly understand how different parts of the application work together.

## Application Overview

Delta-AI is a Node.js application that integrates with Delta-DMS, (a document management system forked from Paperless-ngx), to provide AI-enhanced document processing capabilities. This readme may refer to Delta-DMS and Paperless-ngx interchangeably. The application:

1. Automatically scans and analyzes documents in a Delta-DMS instance
2. Uses AI to extract metadata (tags, document types, correspondents, dates)
3. Updates documents in Delta-DMS with this extracted metadata
4. Provides a chat interface for interacting with documents using AI
5. Offers a playground for testing document analysis

## Core Architecture

The application follows a modular architecture with these main components:

- **Express.js Web Server**: Handles HTTP requests and serves web interfaces
- **Services Layer**: Contains business logic and integrations with external APIs
- **Data Models**: Handles data persistence and retrieval
- **View Templates**: EJS templates for rendering dynamic UI components
- **Client-side Scripts**: JavaScript for interactive UI features

## Key Components

### 1. Server Configuration and Initialization

**Main Files**:
- `server.js`: Application entry point, sets up Express server, middleware, routes, and scheduled tasks
- `ecosystem.config.js`: PM2 process manager configuration
- `docker-compose.yml`: Multi-container Docker configuration
- `Dockerfile`: Container build instructions

**Functionality**:
- Configures Express.js server and middleware
- Sets up error handling and logging
- Initializes scheduled document scanning
- Handles graceful shutdown
- Registers API routes and serves frontend interfaces

### 2. Services

The `/services` directory contains core business logic and integrations:

#### AI Services
- `aiServiceFactory.js`: Factory pattern implementation that creates appropriate AI service instances
- `openaiService.js`: Integrates with OpenAI API for document analysis and chat
- `azureService.js`: Integrates with Azure AI services
- `ollamaService.js`: Integrates with Ollama for local AI models
- `customService.js`: Support for custom AI provider integrations

#### Document Processing
- `paperlessService.js`: Core service for interacting with Paperless-ngx API
  - Document retrieval and updating
  - Tag and correspondent management
  - Content extraction
  - Permission handling
  - Custom field management
- `documentsService.js`: Handles document operations and metadata

#### Application Features
- `chatService.js`: Manages document-based chat sessions
  - Chat history tracking
  - Streaming AI responses
  - Document content context management
- `ragService.js`: Implements Retrieval Augmented Generation functionality
- `setupService.js`: Manages application configuration and initialization
- `autoSetupService.js`: Handles automated setup processes

#### Utilities
- `configService.js`: Manages application configuration
- `loggerService.js`: Custom logging implementation
- `debugService.js`: Debugging utilities and helpers
- `manualService.js`: Manual operation handling

### 3. Models

The `/models` directory contains data model definitions:

- `document.js`: Core document data model
  - Document status tracking
  - Processing metrics storage
  - History logging

### 4. Routes

The `/routes` directory defines API endpoints and request handlers:

- `auth.js`: Authentication-related routes
- `setup.js`: Application setup and configuration routes
- Additional routes defined directly in server.js:
  - Dashboard routes
  - Chat interface routes
  - Document processing routes
  - Health check endpoint

### 5. Views

The `/views` directory contains EJS templates for UI rendering:

- `chat.ejs`: Document chat interface
- `dashboard.ejs`: Main application dashboard
- `history.ejs`: Document processing history
- `index.ejs`: Application landing page
- `layout.ejs`: Base layout template
- `login.ejs`: Authentication interface
- `manual.ejs`: Manual document processing interface
- `playground.ejs`: AI analysis testing interface
- `settings.ejs`: Application configuration interface
- `setup.ejs`: Initial setup wizard
- `template.ejs`: Generic template for new pages

### 6. Public Assets

The `/public` directory contains static assets:

- `/css`: Stylesheets for application UI
- `/js`: Client-side scripts for interactive features
  - `chat.js`: Chat interface functionality
  - `dashboard.js`: Dashboard interactions
  - `history.js`: History view interactions
  - `playground.js` & `playground-analyzer.js`: Playground functionality
  - `settings.js`: Settings page interactions
  - `setup.js`: Setup wizard functionality
- `/images`: Application images and assets

### 7. Configuration

The `/config` directory contains configuration files:

- `config.js`: Main application configuration
- `correspondents.json`: Predefined correspondents mapping
- `documentTypes.json`: Predefined document types

## Key Workflows

### Document Scanning Process

1. **Initialization**: `server.js` starts the scanning process
2. **Document Discovery**: `paperlessService.js` retrieves documents from Paperless-ngx
3. **Processing Check**: `documentModel.js` checks if documents need processing
4. **Content Extraction**: `paperlessService.js` extracts document content
5. **AI Analysis**: `openaiService.js` (or other AI provider) analyzes document content
6. **Metadata Extraction**: AI service extracts tags, dates, correspondents, document types
7. **Document Update**: `paperlessService.js` updates documents with new metadata

### Chat Workflow

1. **Document Selection**: User selects document in UI
2. **Chat Initialization**: `chatService.js` loads document content as context
3. **Message Handling**: User messages sent to AI with document context
4. **Response Streaming**: AI responses streamed back to UI
5. **History Management**: Chat history maintained for the session

## API Endpoints

The application exposes these key endpoints:

- **Document Processing**
  - `GET /documents`: List all documents
  - `GET /documents/:id`: Get document details
  - `POST /documents/:id/analyze`: Analyze a specific document

- **Chat Interface**
  - `GET /chat`: Chat interface
  - `GET /chat/init/:documentId`: Initialize chat for a document
  - `POST /chat/message`: Send message in a chat session

- **System Management**
  - `GET /health`: System health check
  - `GET /setup`: Setup interface
  - `POST /setup/configure`: Configure application

## Configuration Options

The application can be configured through:

1. **Environment Variables**:
   - `DELTA_AI_PORT`: Application port
   - `AI_PROVIDER`: AI provider selection (openai, azure, ollama, custom)
   - `OPENAI_API_KEY`: OpenAI API key
   - Various provider-specific settings

2. **Configuration Files**:
   - `/config/config.js`: Main configuration
   - Custom field definitions
   - System prompts

## Development Practices

### Code Organization
- Services use singleton pattern (exports instantiated class)
- Routes follow RESTful patterns where possible
- Views use EJS templating with layout inheritance
- Client-side code separates concerns (UI, data fetching, state)

### Error Handling
- Consistent error logging patterns
- Graceful degradation for API failures
- User-friendly error messages in UI

### Performance Considerations
- Document streaming for large documents
- Response streaming from AI services
- Caching strategies for tags and metadata

## Common Customization Points

1. **AI Provider Integration**:
   - Modify `aiServiceFactory.js` to add new providers
   - Create new service files following pattern of existing providers

2. **Document Analysis Logic**:
   - Adjust AI prompts in `openaiService.js`
   - Modify metadata extraction in `server.js`

3. **UI Customization**:
   - Modify EJS templates in `/views`
   - Update stylesheets in `/public/css`

4. **New Features**:
   - Add new service modules in `/services`
   - Create corresponding routes and views

## Troubleshooting

Common issues and solutions:

1. **AI Provider Connection**:
   - Check credentials in environment variables
   - Verify network connectivity to AI provider

2. **Paperless Integration**:
   - Confirm Paperless-ngx API credentials
   - Check user permissions in Paperless-ngx

3. **Document Processing**:
   - Check logs for token limit errors
   - Verify document content is extractable

## Future Development Areas

Potential areas for enhancement:

1. **Multi-document Analysis**: Cross-referencing multiple documents
2. **Workflow Automation**: Rule-based document routing
3. **Enhanced UI**: More interactive document visualization
4. **API Expansion**: More comprehensive REST API
5. **User Management**: Role-based access control