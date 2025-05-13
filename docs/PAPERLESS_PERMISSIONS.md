# Paperless-ngx API Permissions for Delta-AI

This document outlines the required permissions that need to be configured in Paperless-ngx for the Delta-AI integration to function correctly.

## Permission Requirements

The Delta-AI application uses an API token to authenticate with Paperless-ngx. This token must be associated with a user that has sufficient permissions to access various endpoints.

### Required Endpoints

The following endpoints must be accessible to the Delta-AI user:

- `/api/tags/` - For fetching and creating tags
- `/api/correspondents/` - For fetching and creating correspondents
- `/api/documents/` - For fetching and updating documents
- `/api/document_types/` - For fetching and creating document types
- `/api/custom_fields/` - For fetching and updating custom fields
- `/api/users/` - For accessing user information

### Setting Up Permissions

1. Log into Paperless-ngx admin panel
2. Navigate to Admin → Users
3. Find or create a user specifically for Delta-AI (recommended name: `delta-ai`)
4. Ensure this user has at least "View" permissions for:
   - Documents
   - Document Types
   - Correspondents
   - Tags
   - Custom Fields
   - Users
5. Generate an API token for this user
6. Set this token in the Delta-AI `.env` file as `PAPERLESS_API_TOKEN`

## Troubleshooting

If you encounter 403 Forbidden errors in the Delta-AI logs, the most common cause is insufficient permissions for the API token user in Paperless-ngx.

Error example:
```
[ERROR] fetching tags page 1: Request failed with status code 403
[DEBUG] Response data: { detail: 'You do not have permission to perform this action.' }
```

To resolve this, verify that:

1. The correct API token is being used
2. The user associated with the token has the necessary permissions
3. The user has not been deactivated in Paperless-ngx

## Permission Validation

Delta-AI validates API permissions during setup using the `validateApiPermissions` function in `setupService.js`. This function checks access to all required endpoints before allowing the application to connect to Paperless-ngx.