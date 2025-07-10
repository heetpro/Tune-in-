# SpotiLove Integration

This document provides information about how the frontend integrates with the SpotiLove backend.

## API Integration

The frontend communicates with the SpotiLove backend through a set of API services:

- `auth.ts` - Handles authentication with Spotify
- `user.ts` - Manages user profile information
- `friends.ts` - Manages friend relationships
- `messages.ts` - Handles messaging between users
- `spotify.ts` - Interfaces with Spotify API functionality

## Authentication Flow

1. Users are redirected to Spotify for authentication using the `/spotify/login` endpoint
2. After successful authentication, they are redirected back to the callback URL
3. The backend sets JWT tokens in HTTP-only cookies
4. The frontend uses these tokens for subsequent authenticated requests
5. Token refreshing is handled automatically

## WebSocket Communication

Real-time communication is handled using Socket.IO:

1. The frontend initializes a socket connection when authenticated
2. The socket connection is used for real-time features like:
   - Instant messaging
   - Online status updates
   - Friend request notifications

## Component Structure

The main components for the SpotiLove integration include:

- `AuthContext` - Manages authentication state and user information
- `ProtectedRoute` - HOC for routes that require authentication
- `Chat` - Component for real-time messaging

## Environment Configuration

The following environment variables are required:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

For production, these should be set to the appropriate URLs.

## Security Considerations

- JWT tokens are stored in HTTP-only cookies
- All API requests include CSRF protection
- WebSocket connections are authenticated
- Sensitive operations require valid authentication

## Development Workflow

1. Ensure the backend server is running
2. Configure environment variables
3. Start the Next.js development server
4. Use the API services to interact with the backend

## Error Handling

The API services include error handling for common scenarios:
- Network errors
- Authentication errors
- API-specific errors

Errors are logged to the console and handled appropriately in the UI.

## Data Models

The frontend uses TypeScript interfaces that match the backend models:
- `IUser` - User profile information
- `IMessage` - Chat messages
- `IFriendRequest` - Friend requests 