# Third-Party Libraries

This directory contains local copies of third-party JavaScript libraries used as fallbacks when CDN sources are unavailable.

## PeerJS Library

To add the PeerJS library for local fallback:

1. Download the PeerJS library from one of these sources:
   - https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js
   - https://cdn.jsdelivr.net/npm/peerjs@1.5.2/dist/peerjs.min.js

2. Save the file as `peerjs.min.js` in this directory

3. The chat.html file is already configured to use this as a fallback

## Manual Download Command

```bash
# Using curl
curl -L -o libs/peerjs.min.js "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"

# Or using wget
wget -O libs/peerjs.min.js "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"
```

## Verification

After downloading, verify the file:
- File size should be approximately 80-100 KB
- File should start with minified JavaScript code
- You can test by opening chat.html and checking the browser console

## License

PeerJS is licensed under the MIT License.
