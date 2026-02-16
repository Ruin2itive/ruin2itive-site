#!/bin/bash
# Automated Cloudflare Worker OAuth Proxy Setup for Decap CMS

set -e

echo "🚀 Decap CMS OAuth Proxy Setup for GitHub Pages"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check if Node.js is installed
if ! command_exists node; then
    print_error "Node.js is not installed!"
    echo "Please install Node.js from: https://nodejs.org/"
    echo "Recommended version: 18.x or higher"
    exit 1
fi

print_success "Node.js is installed ($(node --version))"

# Check if npm is installed
if ! command_exists npm; then
    print_error "npm is not installed!"
    echo "Please install npm (usually comes with Node.js)"
    exit 1
fi

print_success "npm is installed ($(npm --version))"

# Check if wrangler is installed
if ! command_exists wrangler; then
    print_warning "Wrangler CLI is not installed."
    echo ""
    read -p "Do you want to install Wrangler globally? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Installing Wrangler CLI..."
        npm install -g wrangler
        print_success "Wrangler CLI installed successfully!"
    else
        print_error "Wrangler CLI is required for this setup."
        echo "Install it manually: npm install -g wrangler"
        exit 1
    fi
else
    print_success "Wrangler CLI is installed ($(wrangler --version))"
fi

echo ""
echo "================================================"
echo "📋 Prerequisites Checklist"
echo "================================================"
echo ""
echo "Before continuing, please ensure you have:"
echo "  ✅ A Cloudflare account (free tier is fine)"
echo "  ✅ GitHub OAuth App credentials ready:"
echo "     - Client ID"
echo "     - Client Secret"
echo ""
echo "If you haven't created a GitHub OAuth App yet:"
echo "1. Go to: https://github.com/settings/developers"
echo "2. Click 'New OAuth App'"
echo "3. Fill in:"
echo "   - Application name: ruin2itive-cms"
echo "   - Homepage URL: https://ruin2itive.org"
echo "   - Callback URL: (use placeholder for now, we'll update it later)"
echo "4. Save the Client ID and Client Secret"
echo ""
read -p "Do you have your GitHub OAuth App credentials ready? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Please create a GitHub OAuth App first, then run this script again."
    exit 0
fi

echo ""
echo "================================================"
echo "1️⃣  Logging into Cloudflare"
echo "================================================"
echo ""
print_info "Opening browser for Cloudflare authentication..."
print_info "If browser doesn't open, follow the URL displayed below."
echo ""

wrangler login

if [ $? -ne 0 ]; then
    print_error "Cloudflare login failed!"
    echo "Please try running 'wrangler login' manually and then run this script again."
    exit 1
fi

print_success "Successfully logged into Cloudflare!"

echo ""
echo "================================================"
echo "2️⃣  Cloning OAuth Proxy Template"
echo "================================================"
echo ""

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
print_info "Using temporary directory: $TEMP_DIR"

# Clone the OAuth proxy template
print_info "Cloning decap-proxy repository..."
cd "$TEMP_DIR"

if git clone https://github.com/sterlingwes/decap-proxy.git 2>&1; then
    print_success "Repository cloned successfully!"
else
    print_error "Failed to clone repository!"
    echo "Please check your internet connection and try again."
    exit 1
fi

cd decap-proxy

echo ""
echo "================================================"
echo "3️⃣  Configuring Secrets"
echo "================================================"
echo ""

print_info "You'll need to enter your GitHub OAuth App credentials."
print_info "These will be stored securely in Cloudflare Workers."
echo ""

# Get GitHub Client ID
echo -n "Enter your GitHub OAuth App Client ID: "
read -r CLIENT_ID

if [ -z "$CLIENT_ID" ]; then
    print_error "Client ID cannot be empty!"
    exit 1
fi

print_info "Setting GITHUB_CLIENT_ID..."
echo "$CLIENT_ID" | wrangler secret put GITHUB_CLIENT_ID

if [ $? -ne 0 ]; then
    print_error "Failed to set GITHUB_CLIENT_ID!"
    exit 1
fi

print_success "GITHUB_CLIENT_ID configured!"

echo ""

# Get GitHub Client Secret
echo -n "Enter your GitHub OAuth App Client Secret: "
read -rs CLIENT_SECRET
echo ""

if [ -z "$CLIENT_SECRET" ]; then
    print_error "Client Secret cannot be empty!"
    exit 1
fi

print_info "Setting GITHUB_CLIENT_SECRET..."
echo "$CLIENT_SECRET" | wrangler secret put GITHUB_CLIENT_SECRET

if [ $? -ne 0 ]; then
    print_error "Failed to set GITHUB_CLIENT_SECRET!"
    exit 1
fi

print_success "GITHUB_CLIENT_SECRET configured!"

echo ""

# Set allowed origin
print_info "Setting ALLOWED_ORIGIN to https://ruin2itive.org"
echo "https://ruin2itive.org" | wrangler secret put ALLOWED_ORIGIN

if [ $? -ne 0 ]; then
    print_error "Failed to set ALLOWED_ORIGIN!"
    exit 1
fi

print_success "ALLOWED_ORIGIN configured!"

echo ""
echo "================================================"
echo "4️⃣  Deploying Worker"
echo "================================================"
echo ""

print_info "Deploying OAuth proxy to Cloudflare Workers..."
print_info "This may take a minute..."
echo ""

wrangler publish

if [ $? -ne 0 ]; then
    print_error "Deployment failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi

echo ""
print_success "Worker deployed successfully!"

echo ""
echo "================================================"
echo "✅ Setup Complete!"
echo "================================================"
echo ""
print_success "Your OAuth proxy is now deployed and configured!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1️⃣  Note your Worker URL from the output above"
echo "   It should look like: https://decap-proxy.XXXXX.workers.dev"
echo ""
echo "2️⃣  Update your GitHub OAuth App callback URL:"
echo "   - Go to: https://github.com/settings/developers"
echo "   - Select your OAuth App: ruin2itive-cms"
echo "   - Update 'Authorization callback URL' to:"
echo "     https://YOUR-WORKER-URL.workers.dev/callback"
echo "   - Click 'Update application'"
echo ""
echo "3️⃣  Update admin/config.yml in this repository:"
echo "   Add these lines to the backend section:"
echo "   backend:"
echo "     name: github"
echo "     repo: Ruin2itive/ruin2itive-site"
echo "     branch: main"
echo "     base_url: https://YOUR-WORKER-URL.workers.dev"
echo "     auth_endpoint: auth"
echo ""
echo "4️⃣  Commit and push your changes:"
echo "   git add admin/config.yml"
echo "   git commit -m 'Configure OAuth proxy for Decap CMS'"
echo "   git push origin main"
echo ""
echo "5️⃣  Wait for GitHub Pages to rebuild (1-2 minutes)"
echo ""
echo "6️⃣  Test your setup:"
echo "   Visit: https://ruin2itive.org/admin"
echo "   Click 'Login with GitHub'"
echo ""
echo "================================================"
echo "📖 For detailed documentation, see:"
echo "   - OAUTH_SETUP_COMPLETE.md (comprehensive guide)"
echo "   - OAUTH_QUICK_REFERENCE.md (quick reference)"
echo "================================================"
echo ""
print_info "Cleaning up temporary files..."
cd /
rm -rf "$TEMP_DIR"
print_success "Cleanup complete!"
echo ""
print_success "Happy blogging! 🎉"
