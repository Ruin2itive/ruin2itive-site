# ruin2itive-site
Static-first, reliability-focused open-source discovery front page.

## Features

- Curated feeds from multiple sources (Hacker News, BBC, Reuters, etc.)
- Real-time chat room for community interaction
- Content management system (Netlify CMS) for blog posts
- Responsive design with glass morphism UI
- GitHub Pages compatible

## Content Management

The site includes Netlify CMS for managing blog content through a user-friendly admin interface at `/admin`.

**⚠️ Important for GitHub Pages**: To use the admin interface, you must first set up an OAuth proxy. See [GITHUB_PAGES_OAUTH_SETUP.md](GITHUB_PAGES_OAUTH_SETUP.md) for quick setup instructions (free Cloudflare Workers or Vercel deployment).

- **For GitHub Pages hosting**: See [GITHUB_PAGES_OAUTH_SETUP.md](GITHUB_PAGES_OAUTH_SETUP.md) for OAuth setup (required)
- **Setup guide**: [GITHUB_PAGES_CMS_SETUP.md](GITHUB_PAGES_CMS_SETUP.md) for complete usage instructions
- **For Netlify hosting**: See [NETLIFY_CMS_SETUP.md](NETLIFY_CMS_SETUP.md) for setup instructions (no OAuth proxy needed)

**Recent Fix**: Added proper OAuth configuration for GitHub Pages - see [GITHUB_PAGES_OAUTH_SETUP.md](GITHUB_PAGES_OAUTH_SETUP.md) for details.

## Chat Room

The site includes a real-time chat feature that allows users to interact with each other. See [CHAT_FEATURE.md](CHAT_FEATURE.md) for detailed documentation.
