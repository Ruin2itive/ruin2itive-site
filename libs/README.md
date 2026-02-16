# Third-Party Libraries

This directory contains local copies of third-party JavaScript libraries used as fallbacks when CDN sources are unavailable.

## PeerJS Library

**⚠️ CRITICAL**: The current `peerjs.min.js` file is a **PLACEHOLDER**. For production deployment, you **MUST** replace it with the actual PeerJS library.

### Why This Matters

The chat feature uses a three-tier fallback system for reliability:

1. **Primary CDN**: unpkg.com (fastest, with SRI integrity check)
2. **Secondary CDN**: cdn.jsdelivr.net (reliable alternative)
3. **Local Fallback**: libs/peerjs.min.js (this file) - **ONLY USED WHEN BOTH CDNs FAIL**

If both CDN sources fail (due to network restrictions, outages, or blocked domains), the chat will attempt to load the local fallback. **Without the actual library file, the chat will not function** when CDNs are unavailable.

### Current Status Check

To verify if you need to replace the placeholder:

```bash
# Check file size - should be ~80-100 KB for actual library
ls -lh libs/peerjs.min.js

# If size is ~1 KB, it's the placeholder and needs replacement
```

### How to Add the Actual PeerJS Library

#### Option 1: Download from CDN (Recommended)

**Using curl:**
```bash
curl -L -o libs/peerjs.min.js "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"
```

**Using wget:**
```bash
wget -O libs/peerjs.min.js "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"
```

#### Option 2: Manual Download

1. Visit: https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js
2. Save the file content (Right-click → Save As) as `peerjs.min.js` in this directory
3. Alternative URL: https://cdn.jsdelivr.net/npm/peerjs@1.5.2/dist/peerjs.min.js

#### Option 3: Using npm (For Development Environments)

```bash
npm install peerjs@1.5.2
cp node_modules/peerjs/dist/peerjs.min.js libs/peerjs.min.js
```

### Verification

After downloading, verify the file is correct:

**1. Check file size:**
```bash
ls -lh libs/peerjs.min.js
# Should show approximately 80-100 KB
```

**2. Check file content:**
```bash
head -n 1 libs/peerjs.min.js
# Should start with minified JavaScript code like: !function(e,t){"object"==typeof...
# NOT with a comment like: /** PeerJS Local Fallback Placeholder
```

**3. Calculate checksum (optional but recommended):**
```bash
sha256sum libs/peerjs.min.js
# Expected: Should match official PeerJS v1.5.2 checksum
```

### Testing the Fallback

To test that the local fallback works correctly:

#### Method 1: Browser Extension (Recommended)
1. Install a browser extension like "Block Site" or "uBlock Origin"
2. Block domains: `unpkg.com` and `cdn.jsdelivr.net`
3. Open `chat.html` in your browser
4. Open browser console (F12)
5. Look for: `[PEERJS] ✓ Local fallback (libs/peerjs.min.js) loaded successfully`
6. Verify chat functionality works normally

#### Method 2: Network Simulation
1. Disconnect from internet temporarily
2. Use local development server: `python3 -m http.server 8000`
3. Open `http://localhost:8000/chat.html`
4. Check console logs for local fallback loading

#### Method 3: Modify Hosts File (Advanced)
```bash
# Add to /etc/hosts (Linux/Mac) or C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1 unpkg.com
127.0.0.1 cdn.jsdelivr.net
```

### Deployment Checklist

Before deploying to production:

- [ ] Download actual PeerJS library (not placeholder)
- [ ] Verify file size is ~80-100 KB
- [ ] Verify file starts with minified JavaScript code
- [ ] Test local fallback loading with blocked CDNs
- [ ] Check browser console for successful loading
- [ ] Commit and push the updated file
- [ ] Verify deployment includes the file (check 404 errors)
- [ ] Test on deployed site with and without CDN access

### Common Deployment Issues

#### Issue: "404 Not Found" for libs/peerjs.min.js

**Causes:**
- File not committed to repository
- Build process excluding `libs/` directory
- `.gitignore` blocking the file
- Deployment configuration not including the file

**Solutions:**
1. Check `.gitignore` doesn't exclude `libs/*.js`
2. Verify file is committed: `git ls-files libs/peerjs.min.js`
3. Check deployment logs for file copying
4. Test deployed URL directly: `https://yoursite.com/libs/peerjs.min.js`

#### Issue: File loads but PeerJS still fails

**Causes:**
- Placeholder file not replaced with actual library
- File corrupted during download/transfer
- Wrong version downloaded

**Solutions:**
1. Verify file size is ~80-100 KB
2. Re-download from official CDN
3. Check file integrity with checksum

#### Issue: CORS errors when loading local file

**Causes:**
- Server not configured to serve JavaScript files
- CORS headers missing

**Solutions:**
1. Verify server configuration allows serving `.js` files
2. Check Content-Type header is `application/javascript`
3. For GitHub Pages: Usually not an issue (works by default)
4. For other hosts: Configure server to serve static files

### File Information

- **Library**: PeerJS
- **Version**: 1.5.2
- **License**: MIT
- **Official Repository**: https://github.com/peers/peerjs
- **License Details**: https://github.com/peers/peerjs/blob/master/LICENSE
- **Documentation**: https://peerjs.com/docs/

### Need Help?

See additional documentation:
- `CHAT_FEATURE.md` - Complete chat feature documentation
- `TESTING.md` - Testing procedures including fallback testing
- `PEERJS_SERVER_SETUP.md` - PeerJS signaling server setup (optional)

### Version History

- **v1.5.2** (Current) - Latest stable version with WebRTC improvements
- Placeholder file included in repository for structure demonstration
- Actual library must be downloaded before production deployment
