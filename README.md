# SpotiLove Frontend

A Next.js TypeScript frontend for the SpotiLove application, a dating app that matches users based on their Spotify music preferences.

## Features

- Spotify authentication
- User profiles with music preferences
- Friend management
- Real-time messaging
- Music compatibility matching

## Prerequisites

- Node.js 18+
- npm or bun
- SpotiLove backend running

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/spotilove-frontend.git
   cd spotilove-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

3. Create a `.env.local` file:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   bun dev
   ```

## API Integration

The frontend integrates with the SpotiLove backend through a set of API services:

- Authentication with Spotify
- User profile management
- Friend relationships
- Real-time messaging
- Spotify data synchronization

## Authentication Flow

1. Users are redirected to Spotify for authentication
2. After successful authentication, they are redirected back to the app
3. JWT tokens are stored in HTTP-only cookies
4. Protected routes require authentication

## Directory Structure

```
src/
├── api/           # API service functions
├── app/           # Next.js app directory
├── components/    # Reusable components
├── context/       # React context providers
├── lib/           # Utility functions
├── middleware/    # Next.js middleware
└── types/         # TypeScript type definitions
```

## Main Components

- `AuthContext` - Authentication state management
- `ProtectedRoute` - Route protection component
- `MusicProfile` - Displays user's Spotify data
- `Chat` - Real-time messaging component

## WebSocket Integration

Real-time features are implemented using Socket.IO:

- Messaging between users
- Online status updates
- Friend request notifications

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [Socket.IO](https://socket.io/)
