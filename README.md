# ruin2itive-site
Static-first, reliability-focused open-source discovery front page.

## Features

- Curated feeds from multiple sources (Hacker News, BBC, Reuters, etc.)
- Real-time chat room for community interaction
- Content management system (Decap CMS) for blog posts
- Responsive design with glass morphism UI
- GitHub Pages compatible

## 🔐 CMS Authentication Setup

The site includes Decap CMS for content management at `/admin`. To enable authentication:

### Quick Setup (15 minutes)

1. **Run the automated setup**:
   ```bash
   chmod +x setup-oauth-proxy.sh
   ./setup-oauth-proxy.sh
   ```

2. **Follow the prompts** - you'll need:
   - GitHub OAuth App credentials (the script will guide you to create one)
   - Cloudflare account (free tier)

3. **Update configuration** - After deployment, update `admin/config.yml` with your Worker URL

📖 **Complete guide**: See [OAUTH_SETUP_COMPLETE.md](OAUTH_SETUP_COMPLETE.md) for detailed step-by-step instructions.

📋 **Quick reference**: See [OAUTH_QUICK_REFERENCE.md](OAUTH_QUICK_REFERENCE.md) for a one-page cheat sheet.

### Alternative: Use Netlify Hosting

Don't want to manage OAuth? Deploy to Netlify instead:
- No OAuth proxy needed
- Uses Netlify Identity + Git Gateway
- See [NETLIFY_CMS_SETUP.md](NETLIFY_CMS_SETUP.md)

## Content Management

Additional CMS resources:
- **Setup guide**: [GITHUB_PAGES_CMS_SETUP.md](GITHUB_PAGES_CMS_SETUP.md) for complete usage instructions
- **OAuth setup**: [GITHUB_PAGES_OAUTH_SETUP.md](GITHUB_PAGES_OAUTH_SETUP.md) for manual OAuth configuration

## Chat Room

The site includes a real-time chat feature that allows users to interact with each other. See [CHAT_FEATURE.md](CHAT_FEATURE.md) for detailed documentation.
