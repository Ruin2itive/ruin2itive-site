#!/bin/bash
# Download PeerJS Library Script
# This script downloads the actual PeerJS library to replace the placeholder

set -e  # Exit on error

PEERJS_VERSION="1.5.2"
PRIMARY_URL="https://unpkg.com/peerjs@${PEERJS_VERSION}/dist/peerjs.min.js"
SECONDARY_URL="https://cdn.jsdelivr.net/npm/peerjs@${PEERJS_VERSION}/dist/peerjs.min.js"
OUTPUT_FILE="libs/peerjs.min.js"
EXPECTED_MIN_SIZE=50000  # 50 KB minimum

echo "========================================"
echo "PeerJS Library Download Script"
echo "========================================"
echo ""
echo "Version: ${PEERJS_VERSION}"
echo "Output: ${OUTPUT_FILE}"
echo ""

# Check if libs directory exists
if [ ! -d "libs" ]; then
    echo "Error: libs/ directory not found. Run this script from the repository root."
    exit 1
fi

# Backup existing file if it exists
if [ -f "$OUTPUT_FILE" ]; then
    BACKUP_FILE="${OUTPUT_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "Backing up existing file to: $BACKUP_FILE"
    cp "$OUTPUT_FILE" "$BACKUP_FILE"
fi

# Try primary CDN
echo "Attempting download from primary CDN (unpkg.com)..."
if curl -L -f -o "$OUTPUT_FILE" "$PRIMARY_URL" 2>/dev/null; then
    echo "✓ Successfully downloaded from primary CDN"
else
    echo "⚠ Primary CDN failed, trying secondary CDN (jsdelivr.net)..."
    if curl -L -f -o "$OUTPUT_FILE" "$SECONDARY_URL" 2>/dev/null; then
        echo "✓ Successfully downloaded from secondary CDN"
    else
        echo "✗ Both CDNs failed. Please check your internet connection."
        exit 1
    fi
fi

echo ""

# Verify download
FILE_SIZE=$(wc -c < "$OUTPUT_FILE")
echo "File size: $FILE_SIZE bytes"

if [ $FILE_SIZE -lt $EXPECTED_MIN_SIZE ]; then
    echo "✗ Error: Downloaded file is too small ($FILE_SIZE bytes)"
    echo "   Expected at least $EXPECTED_MIN_SIZE bytes"
    echo "   The download may have failed or returned an error page"
    exit 1
fi

# Check file content
FIRST_CHARS=$(head -c 20 "$OUTPUT_FILE")
if [[ $FIRST_CHARS == !function* ]] || [[ $FIRST_CHARS == \(function* ]]; then
    echo "✓ File content verified: Valid minified JavaScript"
else
    echo "✗ Warning: File may not be valid JavaScript"
    echo "   First 20 characters: $FIRST_CHARS"
fi

echo ""
echo "========================================"
echo "Download complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Verify the file: head -n 1 $OUTPUT_FILE"
echo "2. Check file size: ls -lh $OUTPUT_FILE"
echo "3. Test locally: Start HTTP server and test chat.html"
echo "4. Commit changes: git add $OUTPUT_FILE && git commit -m 'Add actual PeerJS library'"
echo "5. Deploy to production"
echo ""
echo "Testing instructions:"
echo "- See TESTING.md for comprehensive fallback testing procedures"
echo "- See CHAT_FEATURE.md for verification steps"
echo ""
