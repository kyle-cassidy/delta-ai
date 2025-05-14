# Delta-AI Development Guide for Claude

This document provides specific instructions for Claude when assisting with the Delta-AI codebase.

## Repository Documentation

- **Maintain REPO_MAP.md**: Whenever code changes are made, update planning/REPO_MAP.md to reflect those changes
- **Commit documentation updates**: Use the message "docs: update repository documentation"
- **Feature completion check**: When completing features, always verify if repository documentation needs updating
- **Immediate documentation**: When any new services, routes, or major components are added, document them immediately
- **Keep documentation aligned**: Ensure that documentation reflects actual code organization and behavior

## Changelog Maintenance

- **Update CHANGELOG.md**: For all meaningful changes, update the CHANGELOG.md file
- **Follow Keep a Changelog format**: Organize entries under Added, Changed, Fixed, Deprecated, Removed, and Security sections
- **Unreleased section**: Keep an [Unreleased] section at the top for changes not yet in a release
- **User perspective**: Write changelog entries from the user's perspective, focusing on why changes matter
- **Detail level**: Include enough detail to understand the impact, but keep entries concise
- **Link to issues**: Reference issue numbers when applicable
- **Version tagging**: When preparing a release, move Unreleased changes to a new version section with the release date

## Commit Practices

- **Regular intervals**: Commit changes after completing logical units of work (don't wait until the end)
- **Interim commits**: When working on large features, create interim commits every ~30 minutes
- **Pre-commit checks**: Always run appropriate linting and tests before committing
- **Conventional commit messages**: Use standard prefixes (feat:, fix:, docs:, refactor:, test:, etc.)
- **Descriptive messages**: Include messages that explain the "why" not just the "what"
- **Linked issues**: Reference issue numbers in commit messages when applicable

## Code Style and Organization

- **Follow existing patterns**: Match coding style of the surrounding code
- **Services organization**: Keep services modular and focused on single responsibilities
- **Document integrations**: Clearly document how external services (Paperless-ngx, AI providers) are integrated
- **Error handling**: Maintain consistent error handling patterns throughout the codebase
- **Comments**: Add helpful comments for complex logic, but prefer self-documenting code

## Delta-AI Specific Guidelines

- **AI Provider abstraction**: Maintain the abstraction between business logic and specific AI providers
- **Document scanning flow**: Preserve the document scanning and processing workflow
- **UI consistency**: Maintain consistent UI patterns across views
- **Configuration flexibility**: Keep configuration options flexible through environment variables and config files
- **Paperless-ngx integration**: Carefully document and test changes to the Paperless-ngx integration

## Testing and Quality Assurance

- **Manual testing**: Describe manual testing steps for significant changes
- **Integration considerations**: Consider how changes affect integration with Paperless-ngx
- **Performance impact**: Evaluate performance impact of changes, especially for document processing
- **Security review**: Review changes for potential security implications

## Troubleshooting

- **Logs**: Use the logging system consistently for debugging
- **Error messages**: Ensure error messages are helpful and user-friendly
- **Debug mode**: Use debug features in development
- **Common issues**: Document solutions to common problems in code comments or README

By following these guidelines, Claude will help maintain a high-quality, well-documented codebase with regular, meaningful commits.