# Third-Party Libraries

This directory contains local copies of third-party JavaScript libraries used as fallbacks when CDN sources are unavailable.

## PeerJS Library

**IMPORTANT**: The current `peerjs.min.js` file is a PLACEHOLDER. For production deployment, you must replace it with the actual PeerJS library.

### Why This Matters

The chat feature uses a three-tier fallback system:
1. **Primary CDN**: unpkg.com
2. **Secondary CDN**: cdn.jsdelivr.net
3. **Local Fallback**: libs/peerjs.min.js (this file)

If both CDN sources fail (due to network restrictions, outages, or blocked domains), the chat will attempt to load the local fallback. Without the actual library, the chat will not function.

### How to Add the Actual PeerJS Library

#### Option 1: Download from CDN (Recommended)

```bash
# Using curl
curl -L -o libs/peerjs.min.js "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"

# Or using wget
wget -O libs/peerjs.min.js "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"
```

#### Option 2: Manual Download

1. Visit: https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js
2. Save the file as `peerjs.min.js` in this directory
3. Alternatively, use: https://cdn.jsdelivr.net/npm/peerjs@1.5.2/dist/peerjs.min.js

### Verification

After downloading, verify the file:
- File size should be approximately 80-100 KB
- File should start with minified JavaScript code (not a placeholder comment)
- Test by opening chat.html in a browser with blocked CDN access

### Testing the Fallback

To test the local fallback works:
1. Block access to unpkg.com and cdn.jsdelivr.net in your browser (e.g., using browser extensions)
2. Open chat.html
3. Check browser console for: `[PEERJS] ✓ Local PeerJS library loaded successfully`
4. Verify chat functionality works normally

## License

PeerJS is licensed under the MIT License.
See: https://github.com/peers/peerjs/blob/master/LICENSE
