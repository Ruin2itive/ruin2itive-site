# PeerJS Library Deployment Guide

## Critical: Replace Placeholder Before Production

The `libs/peerjs.min.js` file in this repository is a **PLACEHOLDER** and must be replaced with the actual PeerJS library before deploying to production. Without this, the chat feature will fail when CDN access is blocked or unavailable.

## Quick Start

### Option 1: Automated Script (Recommended)

```bash
# From repository root
./scripts/download-peerjs.sh
```

This script will:
- Download PeerJS v1.5.2 from CDN
- Verify file size and content
- Create backup of existing file
- Provide verification steps

### Option 2: Manual Download with curl

```bash
curl -L -o libs/peerjs.min.js "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"
```

### Option 3: Manual Download with wget

```bash
wget -O libs/peerjs.min.js "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"
```

### Option 4: Using npm

```bash
npm install peerjs@1.5.2
cp node_modules/peerjs/dist/peerjs.min.js libs/peerjs.min.js
```

## Verification Steps

### 1. Check File Size

```bash
ls -lh libs/peerjs.min.js
```

**Expected**: ~80-100 KB
**Problem**: ~1 KB indicates placeholder file still present

### 2. Check File Content

```bash
head -n 1 libs/peerjs.min.js
```

**Expected**: Starts with minified JavaScript like `!function(e,t){"object"==typeof...`
**Problem**: Starts with comment about placeholder

### 3. Calculate Checksum (Optional)

```bash
sha256sum libs/peerjs.min.js
```

Compare with official PeerJS v1.5.2 checksum for extra security.

### 4. Test Locally

```bash
# Start local server
python3 -m http.server 8000

# Open in browser
# http://localhost:8000/chat.html

# Open browser console (F12)
# Look for: [PEERJS] ✓ PeerJS library loaded successfully
```

## Pre-Deployment Checklist

Before deploying to production:

- [ ] Downloaded actual PeerJS library (not placeholder)
- [ ] Verified file size is ~80-100 KB
- [ ] Verified file starts with minified JavaScript
- [ ] Tested with local HTTP server
- [ ] Verified `typeof Peer` returns `"function"` in console
- [ ] Tested chat functionality works
- [ ] Committed file to git repository
- [ ] Verified file is included in deployment build

## Testing Fallback System

### Test 1: Primary CDN (Normal)

1. Open chat.html with normal internet access
2. Check console: `[PEERJS] ✓ PeerJS library loaded successfully`
3. Library loads from unpkg.com

### Test 2: Secondary CDN

1. Block unpkg.com in browser (use extension like uBlock Origin)
2. Reload chat.html
3. Check console: `[PEERJS] ✓ Secondary CDN (jsdelivr.net) loaded successfully`

### Test 3: Local Fallback

1. Block both unpkg.com AND cdn.jsdelivr.net
2. Reload chat.html
3. Check console: `[PEERJS] ✓ Local fallback (libs/peerjs.min.js) loaded successfully`
4. Verify chat works normally

### Test 4: Complete Failure (Expected if placeholder not replaced)

1. Block both CDNs
2. Have placeholder file in libs/
3. Check console: `[PEERJS] ✗ All PeerJS sources failed to load`
4. Modal shows "Library Load Error" with troubleshooting steps

## Deployment Platforms

### GitHub Pages

```bash
# 1. Download library
./scripts/download-peerjs.sh

# 2. Commit and push
git add libs/peerjs.min.js
git commit -m "Add actual PeerJS library for local fallback"
git push origin main

# 3. Wait for GitHub Pages to rebuild
# 4. Test deployed site
```

**Note**: GitHub Pages automatically serves all files in the repository, so no additional configuration needed.

### Netlify

```bash
# 1. Download library
./scripts/download-peerjs.sh

# 2. Commit changes
git add libs/peerjs.min.js
git commit -m "Add actual PeerJS library"

# 3. Push to trigger deployment
git push origin main

# Netlify will automatically deploy
```

**Netlify Configuration**: No special configuration needed. Ensure `netlify.toml` doesn't exclude `libs/` directory.

### Vercel

```bash
# 1. Download library
./scripts/download-peerjs.sh

# 2. Commit and push
git add libs/peerjs.min.js
git commit -m "Add actual PeerJS library"
git push origin main

# Vercel will auto-deploy
```

### Custom Server (Apache, Nginx, etc.)

1. Download library as shown above
2. Ensure your web server serves `.js` files with correct MIME type:
   - Content-Type: `application/javascript`
3. Verify CORS headers if needed
4. Upload/deploy `libs/` directory to server

## Post-Deployment Verification

### Check File Accessibility

```bash
# Replace with your actual domain
curl -I https://yourdomain.com/libs/peerjs.min.js
```

**Expected Response**:
```
HTTP/2 200
content-type: application/javascript
content-length: 80000-100000 (approximately)
```

**Common Issues**:
- `404 Not Found`: File not deployed or wrong path
- `Content-Length: 986`: Placeholder file deployed instead of actual library
- `Content-Type: text/plain`: Server misconfigured

### Test in Production

1. Open: `https://yourdomain.com/chat.html`
2. Open browser console (F12)
3. Verify library loads successfully
4. Block CDNs and test local fallback

### Monitor Console Logs

Look for these messages:
- ✓ Success: `[PEERJS] ✓ PeerJS library loaded successfully`
- ⚠ Fallback: `[PEERJS] → Attempting secondary CDN fallback...`
- ⚠ Local: `[PEERJS] ✓ Local fallback (libs/peerjs.min.js) loaded successfully`
- ✗ Error: `[PEERJS] ✗ All PeerJS sources failed to load`

## Common Deployment Issues

### Issue 1: 404 Not Found

**Symptom**: `libs/peerjs.min.js` returns 404

**Causes**:
- File not committed to repository
- Build process excludes libs/ directory
- `.gitignore` blocks .js files in libs/

**Solutions**:
```bash
# Check if file is tracked
git ls-files libs/peerjs.min.js

# Check .gitignore
cat .gitignore | grep libs

# Add if missing
git add -f libs/peerjs.min.js
git commit -m "Force add PeerJS library"
```

### Issue 2: File Too Small

**Symptom**: File loads but is only ~1 KB

**Cause**: Placeholder file deployed instead of actual library

**Solution**:
```bash
# Re-download
./scripts/download-peerjs.sh

# Verify size
ls -lh libs/peerjs.min.js

# Should be ~80-100 KB, not 986 bytes
```

### Issue 3: CORS Errors

**Symptom**: Browser shows CORS error loading local file

**Cause**: Server not configured to serve JavaScript files

**Solution**:
- Ensure `Content-Type: application/javascript` header
- For most static hosts (GitHub Pages, Netlify): Works by default
- For custom servers: Check server configuration

### Issue 4: Chat Still Fails

**Symptom**: Library loads but chat doesn't work

**Diagnosis**:
```javascript
// Type in browser console:
typeof Peer
// Should return: "function"

// If "undefined", library didn't load properly
```

**Solution**:
- Verify file content isn't corrupted
- Re-download library
- Check browser console for other errors

## Maintenance

### Updating PeerJS Version

When a new PeerJS version is released:

1. Update version in `scripts/download-peerjs.sh`
2. Update version references in `chat.html`
3. Update version in `libs/README.md`
4. Download new version
5. Test thoroughly before deploying
6. Update documentation if API changes

### Monitoring

Set up monitoring to alert on:
- 404 errors for `libs/peerjs.min.js`
- Frequent local fallback usage (indicates CDN issues)
- Failed PeerJS initialization errors

## Security Considerations

### Subresource Integrity (SRI)

The primary CDN load uses SRI hash for security:

```html
<script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js" 
        integrity="sha384-OLBgp1GsljhM2TJ+sbHjaiH9txEUvgdDTAzHv2P24donTt6/529l+9Ua0vFImLlb" 
        crossorigin="anonymous"></script>
```

For local fallback, verify checksum:
```bash
sha384sum libs/peerjs.min.js
```

### Keeping Dependencies Updated

- Monitor PeerJS releases: https://github.com/peers/peerjs/releases
- Review changelogs for security fixes
- Test updates in staging before production
- Keep local fallback in sync with CDN versions

## Documentation References

- **libs/README.md**: Detailed local fallback information
- **CHAT_FEATURE.md**: Complete chat feature documentation with verification procedures
- **TESTING.md**: Comprehensive testing procedures including fallback tests
- **PEERJS_SERVER_SETUP.md**: Self-hosting PeerJS signaling server

## Support

If you encounter issues:

1. Check browser console for error messages
2. Review this deployment guide
3. See CHAT_FEATURE.md troubleshooting section
4. Test the download script: `./scripts/download-peerjs.sh`
5. Report issues with full error details

## License

PeerJS is licensed under MIT License.
See: https://github.com/peers/peerjs/blob/master/LICENSE
