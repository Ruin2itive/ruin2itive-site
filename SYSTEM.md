# System Architecture & Reliability

## Overview
This is a **reliability-first, static-first** site that aggregates news feeds from multiple sources. The system is designed to be self-sufficient and work properly without maintenance.

## Core Principles
1. **Static First**: Content is pre-built into JSON files, avoiding runtime dependencies
2. **Graceful Degradation**: Every feed has working fallback links if fetching fails
3. **Network Resilience**: All fetch operations include 3 retries with exponential backoff
4. **No Broken Links**: Fallback URLs point to real, stable pages (no 404s)
5. **Automated Updates**: GitHub Actions workflows run hourly to keep content fresh

## Architecture

### Data Flow
```
RSS Feeds → Build Scripts → JSON Files → Frontend
                ↓ (on failure)
           Fallback Data (real URLs)
```

### Build Scripts
Located in `/scripts/`:

- **build_decrypt.js** - Fetches Decrypt.co crypto news
- **build_home_feed.js** - Aggregates Hacker News, BBC, Decrypt, and Hackster feeds
- **build_raspi_news.js** - Fetches Raspberry Pi news

All scripts include:
- Retry logic (3 attempts with backoff)
- Real fallback URLs (no fake/404 links)
- Error logging
- Graceful degradation

### GitHub Actions Workflows
Located in `/.github/workflows/`:

- **hourly_decrypt.yml** - Updates Decrypt feed every hour
- **build-home-feed.yml** - Updates home feed every hour
- **update-raspi-news.yml** - Updates Raspberry Pi news every hour

All workflows use:
- `npm ci` for deterministic installs
- npm caching for reliability
- Concurrency control to prevent conflicts
- `fetch-depth: 1` for fast checkouts
- Consistent git configuration

### Data Files
Located in `/data/`:
- `decrypt.json` - Crypto news (5 items)
- `home.json` - Aggregated feeds
- `raspi.json` - Raspberry Pi news (3 items)

## Reliability Features

### 1. Network Resilience
All fetch operations retry up to 3 times with increasing delays:
- Attempt 1: Immediate
- Attempt 2: After 2 seconds
- Attempt 3: After 4 seconds

### 2. Fallback Data
Every feed has fallback data with **real, working URLs**:
- Links point to stable pages (home, categories, feeds)
- No placeholder/fake articles that return 404
- Professional appearance even during outages

### 3. Workflow Reliability
- **npm ci** instead of npm install (uses exact versions from lockfile)
- **npm caching** prevents failures if npm is slow/unavailable
- **Concurrency control** prevents race conditions
- **Shallow clones** (fetch-depth: 1) for speed

### 4. Visual Design
The UI uses a glass-morphism design with:
- Transparent boxes to show background image
- Dark mode with reduced opacity (.14 vs .24)
- Backdrop blur for readability while maintaining aesthetics
- Background image opacity increased to .065 for better visibility

## Monitoring

### How to Verify System Health

1. **Check GitHub Actions**:
   - Visit: https://github.com/Ruin2itive/ruin2itive-site/actions
   - All workflows should show green checkmarks
   - Look for hourly runs without failures

2. **Check Feed Data**:
   ```bash
   # Verify data files exist and are recent
   ls -lh data/*.json
   
   # Check for SEED vs LIVE stamps
   cat data/decrypt.json | grep -o '"stamp":"[^"]*"'
   ```

3. **Test Links**:
   - All links in fallback data point to real pages
   - No 404 errors should occur

4. **Build Scripts**:
   ```bash
   # Test each script manually
   node scripts/build_decrypt.js
   node scripts/build_home_feed.js
   node scripts/build_raspi_news.js
   ```

## Maintenance

### This System Should Work Without Maintenance

The system is designed to be self-sufficient:
- ✅ Automated hourly updates via GitHub Actions
- ✅ Retry logic handles temporary network issues
- ✅ Fallback data ensures no broken links
- ✅ Deterministic builds (npm ci)
- ✅ No external services required (uses static JSON)

### When Manual Intervention Is Needed

You may need to intervene if:
1. **Feed URL changes** - Update the URL in the build script
2. **Feed format changes** - Adjust the parsing logic
3. **Site goes down permanently** - Remove that feed source
4. **GitHub Actions quota exhausted** - Reduce cron frequency

### How to Update Feed Sources

To add/remove/modify feed sources:

1. Edit the relevant build script in `/scripts/`
2. Update fallback URLs to real, working links
3. Test locally: `node scripts/build_[name].js`
4. Commit and push - GitHub Actions will take over

## Recovery

### If Something Goes Wrong

1. **Check workflow logs**: `.github/workflows/` and GitHub Actions UI
2. **Fallback is automatic**: Site will show fallback data with real links
3. **Manual rebuild**: Run build scripts locally and commit results
4. **Rollback available**: Use `maintenance.html` if needed

### Emergency Fallback

The `maintenance.html` file provides a static fallback page if the main site has issues.

## Dependencies

### Runtime (None)
- Frontend is pure HTML/CSS/JavaScript
- No build step required for frontend
- Fetches local JSON files only

### Build Time
- **Node.js 20+** (has native fetch)
- **npm packages**:
  - rss-parser: ^3.13.0
  - fast-xml-parser: ^4.5.0

### External Services
- **RSS Feeds** (with fallbacks):
  - Decrypt.co
  - Hacker News Firebase API
  - BBC News
  - Hackster.io
  - Raspberry Pi

## Trust & Professional Standards

This system maintains professional standards by:
- ✅ No broken links (404 errors)
- ✅ Real fallback URLs to actual content
- ✅ Graceful error handling
- ✅ Automated, self-healing updates
- ✅ Transparent operation (logs, status)
- ✅ Predictable, deterministic builds
- ✅ Professional visual design

## Questions?

For issues or questions about the system:
1. Check GitHub Actions workflow logs
2. Review this documentation
3. Test build scripts locally
4. Examine data files for recent updates
