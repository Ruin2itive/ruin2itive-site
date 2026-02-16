#!/bin/bash
# Simple test script to verify admin setup

# Configuration
REPO_NAME="Ruin2itive/ruin2itive-site"
BRANCH_NAME="main"

# Try to detect from git if available
if command -v git &> /dev/null && [ -d ".git" ]; then
    DETECTED_REPO=$(git config --get remote.origin.url | sed -E 's#.*[:/]([^/]+/[^/]+)(\.git)?$#\1#')
    if [ -n "$DETECTED_REPO" ]; then
        REPO_NAME="$DETECTED_REPO"
    fi
fi

echo "==================================="
echo "Admin Interface Setup Verification"
echo "==================================="
echo "Repository: $REPO_NAME"
echo ""

# Check if required files exist
echo "1. Checking required files..."
files_ok=true

if [ -f "admin/index.html" ]; then
    echo "   ✓ admin/index.html exists"
else
    echo "   ✗ admin/index.html is missing!"
    files_ok=false
fi

if [ -f "admin/config.yml" ]; then
    echo "   ✓ admin/config.yml exists"
else
    echo "   ✗ admin/config.yml is missing!"
    files_ok=false
fi

if [ -f ".nojekyll" ]; then
    echo "   ✓ .nojekyll exists (prevents Jekyll from ignoring admin/)"
else
    echo "   ✗ .nojekyll is missing! Creating it..."
    touch .nojekyll
fi

if [ -f "GITHUB_PAGES_OAUTH_SETUP.md" ]; then
    echo "   ✓ GITHUB_PAGES_OAUTH_SETUP.md exists"
else
    echo "   ✗ GITHUB_PAGES_OAUTH_SETUP.md is missing!"
    files_ok=false
fi

echo ""

# Check directory structure
echo "2. Checking directory structure..."
if [ -d "content/posts" ]; then
    echo "   ✓ content/posts/ directory exists"
else
    echo "   ✗ content/posts/ directory is missing!"
    files_ok=false
fi

if [ -d "static/images/uploads" ]; then
    echo "   ✓ static/images/uploads/ directory exists"
else
    echo "   ✗ static/images/uploads/ directory is missing!"
    files_ok=false
fi

echo ""

# Check config.yml content
echo "3. Checking config.yml configuration..."
if grep -q "name: github" admin/config.yml; then
    echo "   ✓ Backend is set to 'github'"
else
    echo "   ✗ Backend is not set to 'github'!"
    files_ok=false
fi

if grep -q "repo: $REPO_NAME" admin/config.yml; then
    echo "   ✓ Repository is correctly configured"
else
    echo "   ⚠ Repository configuration might need verification"
    echo "     Expected: $REPO_NAME"
fi

if grep -q "branch: $BRANCH_NAME" admin/config.yml; then
    echo "   ✓ Branch is set to '$BRANCH_NAME'"
else
    echo "   ⚠ Branch configuration might need verification"
fi

if grep -q "base_url:" admin/config.yml; then
    echo "   ✓ OAuth proxy (base_url) is configured"
    echo "     NOTE: Verify the OAuth proxy is actually deployed!"
else
    echo "   ⚠ OAuth proxy (base_url) is NOT configured"
    echo "     ACTION REQUIRED: Set up OAuth proxy (see GITHUB_PAGES_OAUTH_SETUP.md)"
fi

echo ""

# Final summary
echo "==================================="
if [ "$files_ok" = true ]; then
    echo "✓ Basic setup verification passed!"
    echo ""
    echo "Next steps:"
    echo "1. Set up OAuth proxy (if not done yet)"
    echo "   See: GITHUB_PAGES_OAUTH_SETUP.md"
    echo "2. Deploy to GitHub Pages"
    echo "3. Visit https://ruin2itive.org/admin"
else
    echo "✗ Setup verification failed!"
    echo "Please fix the errors above."
fi
echo "==================================="
