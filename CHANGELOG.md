# Changelog

All notable changes to the Delta-AI project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Documentation for Paperless-ngx API permissions requirements
- New permission troubleshooting guide in docs/PAPERLESS_PERMISSIONS.md
- Airtable integration with caching system for document classification context
- Administrative interface for viewing Airtable cached data
- Error handling page (error.ejs) for improved user experience

### Fixed
- Addressed 403 Forbidden errors when accessing Paperless-ngx endpoints
- Added clear instructions for configuring user permissions in Paperless-ngx
- Resolved Airtable cache initialization issues with robust error handling
- Fixed EJS templating issues in admin views

### Changed
- Updated README.md with information about required permissions
- Improved error handling for permission-related issues
- Enhanced Docker configuration with volume mounts for persistent cache storage
- Optimized Airtable data caching with scheduled refreshes

## [2.7.6] - Prior Release

### Added
- Support for Delta-DMS integration
- Custom fields integration

### Changed
- Updated branding to Delta-AI
- Improved documentation for Delta-DMS compatibility