# Chat Room Feature Documentation

## Overview

The ruin2itive chat room is a real-time communication feature that allows users to interact with each other directly on the website. It supports both registered users (account-based) and temporary guests.

## Features

### User Types

1. **Account-Based Users**
   - Register with an email address and username
   - Username and email are persisted in browser local storage
   - Auto-login on return visits
   - More trusted identity in the community

2. **Guest Users**
   - Choose a temporary guest name
   - Valid for the current session only
   - No registration required
   - Quick access to chat

### Chat Functionality

- **Real-time Messaging**: Messages appear instantly for all connected users
- **Message History**: New users receive the last 50 messages when joining
- **Timestamps**: Every message displays the time it was sent
- **User Identification**: Messages show the sender's username
- **Visual Distinction**: Your own messages are visually distinguished from others

### Security Features

1. **XSS Protection**
   - All user input is HTML-escaped before display
   - Prevents injection of malicious scripts

2. **Rate Limiting**
   - Maximum 5 messages per 10 seconds per user
   - Prevents spam and abuse
   - Users are notified when rate limit is reached

3. **Input Validation**
   - Username: 2-20 characters, alphanumeric plus hyphens and underscores
   - Email: Standard email format validation
   - Real-time validation feedback

### Browser Compatibility

- **Supported Browsers**: Chrome, Firefox, Safari, Edge (modern versions)
- **Required Technology**: WebRTC (for peer-to-peer connections)
- **Fallback**: Clear message displayed for unsupported browsers

## Technical Architecture

### Technology Stack

- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks)
- **Real-time Communication**: PeerJS (WebRTC wrapper)
- **Peer Discovery**: Local storage-based peer sharing
- **Network Architecture**: Mesh network topology

### Why PeerJS for GitHub Pages?

GitHub Pages is a static hosting service without backend server support. PeerJS provides:
- Peer-to-peer connections via WebRTC
- Signaling server hosted by PeerJS community
- No backend server required
- Compatible with static site deployment

### Data Flow

1. User joins chat with chosen username
2. PeerJS creates a unique peer ID
3. Peer ID is stored in local storage for peer discovery
4. New user connects to existing peers in the room
5. Messages are broadcast to all connected peers
6. Each peer relays messages to their connections (mesh network)

### Limitations

- **Room Size**: Best performance with 2-10 concurrent users
- **Message Persistence**: Messages are not saved to a database
- **User Discovery**: Limited to peers in local storage (last 10)
- **Connection Stability**: Depends on peer connections, not server

## Usage Guide

### For Users

1. **Accessing the Chat**
   - Click "Chat" in the main navigation
   - Or visit `chat.html` directly

2. **Joining as a Guest**
   - Select "Guest Mode"
   - Enter a guest name (2-20 characters)
   - Click "Join Chat"

3. **Joining with an Account**
   - Select "Account Mode"
   - Enter your email and username
   - Click "Join Chat"
   - Your credentials will be saved for next time

4. **Sending Messages**
   - Type your message in the input field
   - Press Enter or click "Send"
   - Messages appear instantly for all users

5. **Rate Limiting**
   - You can send up to 5 messages per 10 seconds
   - If you exceed this, wait a few seconds before sending again

### For Developers

#### File Structure

```
/chat.html          # Chat room page
/chat.js            # Chat application logic
/data/chat.json     # User data storage (for future use)
```

#### Key Components

**chat.html**
- Modal for user authentication
- Message display container
- Input field and send button
- Status indicators

**chat.js**
- PeerJS initialization and connection management
- Message handling and broadcasting
- User validation and authentication
- Rate limiting implementation
- XSS protection via HTML escaping

#### Configuration

```javascript
const PEER_SERVER_CONFIG = {
  host: 'peerjs-server.herokuapp.com',
  port: 443,
  path: '/',
  secure: true
};

const RATE_LIMIT = {
  maxMessages: 5,
  timeWindow: 10000 // 10 seconds
};
```

#### Customization

**Styling**: Edit the `<style>` section in `chat.html`
- Colors: Modify CSS variables in `:root`
- Layout: Adjust `.chat-wrapper` and child components
- Animations: Edit `@keyframes slideIn`

**Rate Limits**: Change `RATE_LIMIT` constants in `chat.js`

**Message History**: Adjust history size in the `slice(-50)` call

## Future Enhancements

Potential improvements for future versions:

1. **Persistent Storage**
   - Backend API for message history
   - User account database
   - Message search functionality

2. **Enhanced Features**
   - Private messaging
   - User profiles with avatars
   - Emoji support
   - File sharing
   - Notification sounds

3. **Moderation Tools**
   - Admin controls
   - User blocking
   - Message reporting
   - Profanity filter

4. **Scalability**
   - Dedicated signaling server
   - Room-based chat (multiple rooms)
   - Better peer discovery mechanism
   - Connection status indicators

## Troubleshooting

### Cannot Connect to Chat

1. Check browser compatibility (WebRTC support required)
2. Ensure JavaScript is enabled
3. Check browser console for errors
4. Try refreshing the page
5. Clear browser local storage if issues persist

### Messages Not Appearing

1. Check connection status indicator (should be green)
2. Verify you're not rate-limited
3. Ensure other users are connected
4. Check browser console for errors

### Username Already Taken

- Choose a different username
- Guest names are session-specific, so conflicts are rare

## Privacy & Data

### What We Store

**Local Storage (Browser)**
- Account email (if using account mode)
- Account username (if using account mode)
- Peer IDs for room discovery

**Not Stored**
- Messages (not persisted)
- Guest usernames (session only)
- Connection history

### Data Sharing

- Messages are only shared with connected peers
- No server stores your messages
- No analytics or tracking

## Support

For issues or questions:
- Open an issue on GitHub
- Check browser console for error messages
- Ensure you're using a supported browser

## License

This feature is part of the ruin2itive-site project and is licensed under the MIT License.
