![GitHub commit activity](https://img.shields.io/github/commit-activity/t/Delta-Analytical-Corp/delta-data-platform) ![GitHub License](https://img.shields.io/github/license/Delta-Analytical-Corp/delta-data-platform?cacheSeconds=1)

# Delta-AI

An automated document analyzer for Delta-DMS (Paperless-ngx fork) using OpenAI API, Ollama and all OpenAI API compatible Services to automatically analyze and tag your documents. \
It features: Automode, Manual Mode, Ollama and OpenAI, a Chat function to query your documents with AI, a modern and intuitive Webinterface. \
\
**Following Services and OpenAI API compatible services have been successfully tested:**
- Ollama
- OpenAI
- DeepSeek.ai
- OpenRouter.ai
- Perplexity.ai
- Together.ai
- VLLM
- LiteLLM
- Fastchat
- Gemini (Google)
- ... and there are possibly many more

![Delta-AI Showcase](Delta-Analytical-logo.png)


## Features

### Automated Document Management
- **Automatic Scanning**: Identifies and processes new documents within Paperless-ngx.
- **AI-Powered Analysis**: Leverages OpenAI API and Ollama (Mistral, Llama, Phi 3, Gemma 2) for precise document analysis.
- **Metadata Assignment**: Automatically assigns titles, tags, document_type and correspondent details.

### Advanced Customization Options
- **Predefined Processing Rules**: Specify which documents to process based on existing tags. *(Optional)* 🆕
- **Selective Tag Assignment**: Use only selected tags for processing. *(Disables the prompt dialog)* 🆕
- **Custom Tagging**: Assign a specific tag (of your choice) to AI-processed documents for easy identification. 🆕

### Manual Mode
- **AI-Assisted Analysis**: Manually analyze documents with AI support in a modern web interface. *(Accessible via the `/manual` endpoint)* 🆕

### Interactive Chat Functionality
- **Document Querying**: Ask questions about your documents and receive accurate, AI-generated answers. 🆕

## Installation

See Delta Analytical documentation for detailed installation instructions.

### Paperless-ngx API Permissions

Delta-AI requires specific permissions in Paperless-ngx to function correctly. The user associated with your API token must have the following permissions:

- **View** access to Documents
- **View** access to Document Types
- **View** access to Correspondents
- **View** access to Tags
- **View** access to Custom Fields
- **View** access to Users

If you encounter 403 Forbidden errors, check the permissions for your API user in the Paperless-ngx admin panel.

For more details, see [Paperless Permissions](docs/PAPERLESS_PERMISSIONS.md).

-------------------------------------------


## Docker Support

The application comes with full Docker support:

- Automatic container restart on failure
- Health monitoring
- Volume persistence for database
- Resource management
- Graceful shutdown handling

## Development

To run the application locally without Docker:

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Delta-DMS](Paperless-ngx fork) for the amazing document management system
- OpenAI API
- The Express.js and Node.js communities for their excellent tools

## Support

If you encounter any issues or have questions:

1. Contact Delta Analytical Support
2. Report issues through the official support channels
3. Provide detailed information about your setup and the problem

## Roadmap (DONE)

- [x] Support for custom AI models
- [x] Support for multiple language analysis
- [x] Advanced tag matching algorithms
- [x] Custom rules for document processing
- [x] Enhanced web interface with statistics

