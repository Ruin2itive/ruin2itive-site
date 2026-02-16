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

#### Known Browser Limitations

**iOS Devices:**
- **Firefox on iOS**: Has limited WebRTC support. Safari is strongly recommended for best experience on iOS devices.
- **All iOS Browsers**: May experience connection stability issues due to iOS platform limitations with WebRTC.
- **Background Connections**: iOS may close WebRTC connections when the browser is in the background.

**General Browser Requirements:**
- WebRTC support (RTCPeerConnection API)
- WebSocket support
- Modern JavaScript (ES6+)
- Local Storage enabled

#### Browser-Specific Recommendations

| Browser | Platform | Support Level | Notes |
|---------|----------|---------------|-------|
| Chrome | Desktop | ✅ Excellent | Recommended for desktop |
| Firefox | Desktop | ✅ Excellent | Full WebRTC support |
| Safari | Desktop | ✅ Good | Reliable WebRTC support |
| Edge | Desktop | ✅ Excellent | Chromium-based, full support |
| Safari | iOS | ✅ Good | Best option for iOS devices |
| Chrome | iOS | ⚠️ Limited | Uses Safari WebKit, same limitations |
| Firefox | iOS | ⚠️ Limited | Uses Safari WebKit, limited WebRTC |
| Chrome | Android | ✅ Excellent | Full WebRTC support |
| Firefox | Android | ✅ Good | Full WebRTC support |

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
  host: '0.peerjs.com',
  port: 443,
  path: '/',
  secure: true,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }
};

const CONNECTION_CONFIG = {
  timeout: 15000,           // 15 seconds connection timeout
  maxRetries: 3,            // Maximum connection retry attempts
  retryDelay: 2000,         // 2 seconds initial delay between retries
  maxRetryDelay: 10000,     // Maximum delay for exponential backoff
  backoffMultiplier: 2,     // Exponential backoff multiplier
  libraryLoadDelay: 2000    // 2 seconds delay to wait for PeerJS library
};

const RATE_LIMIT = {
  maxMessages: 5,
  timeWindow: 10000 // 10 seconds
};
```

**Note**: The PeerJS server has been updated from the deprecated `peerjs-server.herokuapp.com` to `0.peerjs.com` for improved reliability. The new configuration includes:
- **Triple-Tier CDN Fallback**: Primary CDN (unpkg.com) → Secondary CDN (jsdelivr.net) → Local fallback (libs/peerjs.min.js)
- **Local Library Fallback**: Local copy of PeerJS library for offline/CDN-failure scenarios
- **Library Availability Checks**: Verifies PeerJS is loaded before initialization
- **Enhanced Error Handling**: Comprehensive error messages with network troubleshooting guidance
- **Browser Compatibility Checks**: Blocking compatibility warnings for non-WebRTC browsers
- **Exponential Backoff Retry**: Automatic retry with increasing delays (4s, 8s, 10s)
- **Connection Timeout**: 15 seconds for initial connection
- **Visual Logging**: Console logs with visual indicators (✓, ✗, ⚠) for easier debugging
- **Multiple STUN Servers**: Better NAT traversal for peer connections

#### Self-Hosting PeerJS Signaling Server

For improved reliability, control, and independence from cloud services, you can self-host your own PeerJS signaling server. See **[PEERJS_SERVER_SETUP.md](PEERJS_SERVER_SETUP.md)** for detailed deployment instructions including:

- **Quick Start with Docker**: Easy deployment using Docker containers
- **Cloud Provider Deployments**: Step-by-step guides for Heroku, AWS EC2, DigitalOcean
- **Configuration Options**: Environment variables and advanced server settings
- **Security Best Practices**: SSL/TLS, API keys, CORS, and authentication
- **Monitoring & Scaling**: Health checks, logging, and horizontal scaling
- **Cost Estimates**: Expected costs for different hosting providers

After deploying your own server, update the `PEER_SERVER_CONFIG` in `chat.js`:

```javascript
const PEER_SERVER_CONFIG = {
  host: 'your-domain.com',      // Your server domain
  port: 443,                     // HTTPS port
  path: '/',                     // Server path
  secure: true,                  // Always true for production
  key: 'your-secret-key',        // Optional API key
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }
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

**Symptom**: Unable to join the chat room, connection timeout, or "Failed to connect" error.

**Solutions**:

1. **Check Browser Compatibility**
   - Ensure you're using a modern browser (Chrome, Firefox, Safari, or Edge)
   - On iOS devices, use Safari for best results
   - Check if WebRTC is enabled in your browser settings

2. **Check Internet Connection**
   - Verify you have a stable internet connection
   - Test your connection speed and latency
   - Try accessing other websites to confirm connectivity

3. **Firewall and Network Issues**
   - Disable VPN temporarily to test connection
   - Check if your firewall is blocking WebRTC or WebSocket connections
   - On corporate networks, ask IT if WebRTC traffic is allowed
   - Some restrictive firewalls block UDP traffic required for WebRTC

4. **Browser-Specific Issues**
   - Clear browser cache and cookies
   - Disable browser extensions that might interfere (ad blockers, privacy tools)
   - Try opening the chat in an incognito/private window
   - Update your browser to the latest version

5. **Retry Connection**
   - The chat includes automatic retry logic (3 attempts)
   - Click the "Retry Connection" button if it appears
   - Refresh the page completely (Ctrl+F5 or Cmd+Shift+R)

### Messages Not Appearing

**Symptom**: Messages don't show up or only appear for you.

**Solutions**:

1. **Check Connection Status**
   - Look for the status indicator (green = connected, red = disconnected)
   - Ensure the indicator is green before sending messages
   - If disconnected, wait for automatic reconnection or refresh the page

2. **Verify Peer Connections**
   - Open browser console (F12) and look for connection logs
   - Check if there are any error messages
   - You should see logs indicating connections to other peers

3. **Rate Limiting**
   - If you see "Please slow down" message, you've hit the rate limit
   - Wait 10 seconds before sending more messages
   - Rate limit is 5 messages per 10 seconds

4. **Room is Empty**
   - If no other users are connected, your messages will only appear for you
   - Wait for other users to join, or open the chat in another browser tab to test

### iOS-Specific Issues

**Symptom**: Chat works on desktop but not on iOS device.

**Solutions**:

1. **Use Safari Browser**
   - Safari has the best WebRTC support on iOS
   - Other browsers on iOS (Chrome, Firefox) use Safari's WebKit engine with limitations
   - Avoid using Firefox on iOS for the chat feature

2. **iOS Permissions**
   - Ensure Safari has permission to use network features
   - Check Settings > Safari > Advanced
   - Enable JavaScript if it's disabled

3. **iOS Background Issues**
   - iOS may close WebRTC connections when the browser is in the background
   - Keep the browser active and in the foreground while chatting
   - iOS may also close connections to save battery

4. **iOS Version**
   - Ensure you're running iOS 14 or later for best WebRTC support
   - Update to the latest iOS version if possible

### Connection Drops Frequently

**Symptom**: Connection works initially but drops after a few minutes.

**Solutions**:

1. **Network Stability**
   - Use a stable Wi-Fi connection instead of mobile data if possible
   - Move closer to your Wi-Fi router to improve signal strength
   - Avoid switching between Wi-Fi and mobile data

2. **Browser Settings**
   - Disable browser power-saving features
   - Prevent the browser from automatically sleeping inactive tabs
   - Keep the chat tab active (don't minimize or switch tabs frequently)

3. **Signaling Server**
   - The issue might be with the PeerJS signaling server
   - The chat will attempt to reconnect automatically
   - Check browser console for specific error messages

### Debugging Tips for Developers

1. **Enable Console Logging**
   - Open browser console (F12)
   - The chat now includes detailed debug logs with visual indicators:
     - `[PEERJS]` - PeerJS library loading status (✓ success, ✗ failure)
     - `[BROWSER]` - Browser detection information
     - `[COMPATIBILITY]` - WebRTC compatibility checks
     - `[PEER]` - Peer connection lifecycle (✓ connected, ⚠ disconnected, ✗ error)
     - `[CONNECTION]` - Individual peer connections
     - `[DATA]` - Message passing and data exchange
     - `[ROOM]` - Room joining and peer discovery
     - `[JOIN]` - User join attempts and errors (✓ success, ✗ failure)
     - `[HISTORY]` - Message history synchronization

2. **Check PeerJS Library Loading**
   - Verify the library loaded: Check console for `[PEERJS] ✓ PeerJS library loaded successfully`
   - If library failed: Look for fallback CDN attempt or load error message
   - Manual check: Type `typeof Peer` in console - should return "function"
   
3. **Monitor Connection Attempts**
   - Watch for retry attempts with exponential backoff
   - Each attempt logs the delay and reason for failure
   - Example: `[JOIN] Connection attempt 1 failed, retrying in 4000ms...`

### Verifying PeerJS Library Loading

The chat feature uses a three-tier fallback system for loading the PeerJS library. Understanding this system helps troubleshoot loading issues.

#### Three-Tier Fallback System

1. **Primary CDN (unpkg.com)**
   - Fastest option with SRI (Subresource Integrity) hash check
   - Automatically loaded first
   - Console: `[PEERJS] ✓ PeerJS library loaded successfully` (if successful)

2. **Secondary CDN (cdn.jsdelivr.net)**
   - Fallback if primary CDN fails
   - Console: `[PEERJS] ⚠ Primary CDN (unpkg.com) failed to load`
   - Console: `[PEERJS] → Attempting secondary CDN fallback (jsdelivr.net)...`
   - Console: `[PEERJS] ✓ Secondary CDN (jsdelivr.net) loaded successfully` (if successful)

3. **Local Fallback (libs/peerjs.min.js)**
   - Final fallback if both CDNs fail
   - Console: `[PEERJS] ⚠ Secondary CDN (jsdelivr.net) failed to load`
   - Console: `[PEERJS] → Attempting local fallback (libs/peerjs.min.js)...`
   - Console: `[PEERJS] ✓ Local fallback (libs/peerjs.min.js) loaded successfully` (if successful)

#### Verification in Local Environment

**Testing During Development:**

1. **Normal Loading (Primary CDN):**
   ```bash
   # Start local development server
   python3 -m http.server 8000
   # or
   npx http-server -p 8000
   ```
   
   Open browser to `http://localhost:8000/chat.html` and check console:
   ```
   [PEERJS] ✓ PeerJS library loaded successfully
   ```

2. **Test Secondary CDN Fallback:**
   - Block unpkg.com using browser extension (uBlock Origin, Block Site)
   - Reload chat.html
   - Console should show:
   ```
   [PEERJS] ⚠ Primary CDN (unpkg.com) failed to load
   [PEERJS] → Attempting secondary CDN fallback (jsdelivr.net)...
   [PEERJS] ✓ Secondary CDN (jsdelivr.net) loaded successfully
   ```

3. **Test Local Fallback:**
   - Block both unpkg.com AND cdn.jsdelivr.net
   - **IMPORTANT**: Ensure `libs/peerjs.min.js` contains actual PeerJS library (not placeholder)
   - Reload chat.html
   - Console should show:
   ```
   [PEERJS] ⚠ Primary CDN (unpkg.com) failed to load
   [PEERJS] → Attempting secondary CDN fallback (jsdelivr.net)...
   [PEERJS] ⚠ Secondary CDN (jsdelivr.net) failed to load
   [PEERJS] → Attempting local fallback (libs/peerjs.min.js)...
   [PEERJS] ✓ Local fallback (libs/peerjs.min.js) loaded successfully
   ```

4. **Verify Library is Functional:**
   ```javascript
   // Type in browser console:
   typeof Peer
   // Should return: "function"
   
   // Test creating a peer instance:
   const testPeer = new Peer();
   // Should not throw errors
   ```

#### Verification in Remote/Deployed Environment

**Testing Production Deployment:**

1. **Check File Deployment:**
   ```bash
   # Verify the local fallback file is deployed
   curl -I https://yoursite.com/libs/peerjs.min.js
   
   # Should return:
   # HTTP/2 200
   # content-type: application/javascript
   # content-length: ~80000-100000 (for actual library, not 1KB placeholder)
   ```

2. **Test CDN Access:**
   - Open chat page: `https://yoursite.com/chat.html`
   - Open browser console (F12)
   - Look for successful loading message
   - If primary CDN works: `[PEERJS] ✓ PeerJS library loaded successfully`

3. **Test Local Fallback on Deployed Site:**
   - Open browser with developer tools (F12)
   - Go to Network tab
   - Block unpkg.com and cdn.jsdelivr.net in browser
   - Reload page
   - Check Network tab shows successful load of `libs/peerjs.min.js`
   - Check Console shows local fallback success message

4. **Common Deployment Issues:**

   **Issue: 404 Not Found for libs/peerjs.min.js**
   - **Cause**: File not included in deployment
   - **Fix**: Verify file is committed to git: `git ls-files libs/peerjs.min.js`
   - **Fix**: Check `.gitignore` doesn't exclude libs directory
   - **Fix**: Verify deployment process includes static files

   **Issue: Library loads but is placeholder**
   - **Symptom**: Console shows warning about placeholder
   - **Cause**: Actual PeerJS library not downloaded
   - **Fix**: Download real library (see `libs/README.md`)
   - **Fix**: Verify file size is ~80-100 KB, not ~1 KB

   **Issue: CORS errors loading local file**
   - **Cause**: Server misconfiguration
   - **Fix**: Ensure server serves .js files with correct MIME type
   - **Fix**: For GitHub Pages: Should work by default
   - **Fix**: For other hosts: Check server configuration

5. **Automated Verification Script:**
   ```bash
   #!/bin/bash
   # Save as test-peerjs-fallback.sh
   
   SITE_URL="https://yoursite.com"
   
   echo "Testing PeerJS library deployment..."
   
   # Test local fallback file exists and size
   echo "1. Checking local fallback file..."
   RESPONSE=$(curl -sI "$SITE_URL/libs/peerjs.min.js")
   if echo "$RESPONSE" | grep -q "200"; then
       SIZE=$(curl -s "$SITE_URL/libs/peerjs.min.js" | wc -c)
       if [ $SIZE -gt 50000 ]; then
           echo "   ✓ Local fallback file exists and has correct size ($SIZE bytes)"
       else
           echo "   ✗ WARNING: File too small ($SIZE bytes) - likely a placeholder"
       fi
   else
       echo "   ✗ Local fallback file not found (404)"
   fi
   
   # Test chat page loads
   echo "2. Checking chat page..."
   if curl -s "$SITE_URL/chat.html" | grep -q "peerjs"; then
       echo "   ✓ Chat page loads and references PeerJS"
   else
       echo "   ✗ Chat page issue detected"
   fi
   
   echo "Done!"
   ```

#### Troubleshooting Loading Failures

**All sources fail to load:**

Console shows:
```
[PEERJS] ✗ All PeerJS sources failed to load
[PEERJS]   → Primary CDN (unpkg.com): FAILED
[PEERJS]   → Secondary CDN (jsdelivr.net): FAILED
[PEERJS]   → Local fallback (libs/peerjs.min.js): FAILED or NOT FOUND (404)
```

**Checklist:**
- [ ] Internet connection is working (test other websites)
- [ ] Browser extensions aren't blocking scripts (disable ad blockers)
- [ ] Firewall/proxy isn't blocking CDN domains
- [ ] Local fallback file exists and is the actual library (not placeholder)
- [ ] Local fallback file is properly deployed (check URL directly)
- [ ] Server is serving .js files correctly (check Content-Type header)
- [ ] No CORS issues (check browser console for CORS errors)

**For Users:**
1. Check internet connection
2. Disable browser extensions
3. Try different browser
4. Try different network (e.g., mobile hotspot)
5. Contact site administrator

**For Administrators:**
1. Download actual PeerJS library to replace placeholder
2. Verify file is committed to repository
3. Check deployment includes libs/ directory
4. Test deployed URL directly in browser
5. Check server logs for errors
6. Verify Content-Type header is `application/javascript`

#### Best Practices for Deployment

1. **Always Replace Placeholder:**
   - Download actual PeerJS v1.5.2 library
   - Verify file size is ~80-100 KB
   - Commit to repository before deployment

2. **Test All Three Fallback Tiers:**
   - Test with normal internet (primary CDN)
   - Test with blocked unpkg.com (secondary CDN)
   - Test with both CDNs blocked (local fallback)

3. **Monitor Console Logs:**
   - Check which tier successfully loads
   - Investigate if always falling back to local
   - May indicate CDN access issues

4. **Document Custom Deployments:**
   - If using custom build process, ensure libs/ is included
   - If using custom CDN, update fallback URLs in chat.html
   - Document any deployment-specific requirements

5. **Set Up Monitoring:**
   - Monitor for 404 errors on libs/peerjs.min.js
   - Alert if local fallback is frequently used
   - Track PeerJS loading success rates

4. **Check WebRTC Stats**
   - Chrome: chrome://webrtc-internals
   - Firefox: about:webrtc
   - These pages show detailed WebRTC connection statistics

5. **Verify PeerJS Server**
   - Test server connectivity: https://0.peerjs.com/
   - Check if the PeerJS cloud service is operational
   - Consider deploying your own PeerJS server for better control

6. **Test Network Connectivity**
   - Use online STUN/TURN server testers
   - Verify NAT traversal is working
   - Check if UDP ports are open

7. **Local Storage Issues**
   - Check if local storage is enabled and working
   - Clear local storage and try again: `localStorage.clear()`
   - Peer IDs are stored in local storage for room discovery

### Error Messages Explained

- **"PeerJS library failed to load. Please check your internet connection and try refreshing the page."**
  - The PeerJS library couldn't be loaded from any CDN
  - Check if browser extensions are blocking external scripts
  - Verify internet connection is working
  - Try disabling ad blockers or privacy extensions
  - Refresh the page with Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

- **"PeerJS library is not loaded. Cannot initialize peer connection."**
  - Attempted to initialize peer connection before library was loaded
  - This is an internal error that should be caught by compatibility checks
  - Refresh the page and wait for the library to load

- **"Connection timeout: Unable to connect to signaling server"**
  - The PeerJS server didn't respond within 15 seconds
  - Check internet connection and firewall settings
  - The server might be temporarily down
  - Automatic retry will attempt 3 times with exponential backoff

- **"Network error. Please check your internet connection."**
  - General network connectivity issue
  - Verify you're connected to the internet
  - Check if other websites work

- **"Unable to connect to the signaling server. The server may be down."**
  - The PeerJS signaling server is unavailable
  - Wait a few minutes and try again
  - Check PeerJS service status

- **"WebSocket connection failed. Please check your firewall settings."**
  - Firewall or proxy is blocking WebSocket connections
  - Try disabling VPN or connecting from a different network
  - Contact network administrator if on corporate network

- **"Your browser does not support WebRTC"**
  - Browser is too old or doesn't support required features
  - Update to the latest browser version
  - Try a different browser (Chrome, Firefox, Safari)

### Getting Additional Help

If issues persist after trying these solutions:

1. **Check Browser Console**
   - Open developer tools (F12)
   - Look for red error messages
   - Note any specific error codes or messages

2. **Report Issue on GitHub**
   - Include browser type and version
   - Include operating system
   - Include any error messages from console
   - Describe the exact steps to reproduce the issue

3. **Provide Debug Information**
   - Browser: [Your browser and version]
   - OS: [Your operating system]
   - Network: [Home WiFi / Mobile / Corporate]
   - Console Errors: [Copy relevant error messages]

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
