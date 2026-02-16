# OAuth Setup Quick Reference

> **One-page cheat sheet for Decap CMS OAuth configuration**

---

## Prerequisites Checklist

- [ ] GitHub account with admin access to `Ruin2itive/ruin2itive-site`
- [ ] Cloudflare account (free tier) OR Vercel account (free tier)
- [ ] 15 minutes to complete setup

---

## Quick Setup Steps

### 1. Create GitHub OAuth App

📍 **Location**: [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)

**Click**: "New OAuth App"

**Fill in**:
- **Application name**: `ruin2itive-cms`
- **Homepage URL**: `https://ruin2itive.org`
- **Authorization callback URL**: `https://YOUR-WORKER.workers.dev/callback` *(placeholder for now)*
- **Description**: `OAuth for Decap CMS on ruin2itive.org`

**Save**:
- ✅ Client ID *(visible immediately)*
- ✅ Client Secret *(click "Generate", copy immediately)*

---

### 2. Deploy OAuth Proxy

**Quick method** (automated):
```bash
chmod +x setup-oauth-proxy.sh
./setup-oauth-proxy.sh
```

**Manual method** (Cloudflare Workers):
```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Clone and deploy
git clone https://github.com/sterlingwes/decap-proxy.git
cd decap-proxy

# Set secrets
wrangler secret put GITHUB_CLIENT_ID       # Paste your Client ID
wrangler secret put GITHUB_CLIENT_SECRET   # Paste your Client Secret
wrangler secret put ALLOWED_ORIGIN         # Enter: https://ruin2itive.org

# Deploy
wrangler publish
```

**Note your Worker URL**: `https://decap-proxy.XXXXX.workers.dev`

---

### 3. Update GitHub OAuth App

📍 **Location**: [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)

**Select**: `ruin2itive-cms`

**Update**:
- **Authorization callback URL**: `https://YOUR-WORKER.workers.dev/callback`

**Click**: "Update application"

---

### 4. Update CMS Configuration

**File**: `admin/config.yml`

**Add** to backend section:
```yaml
backend:
  name: github
  repo: Ruin2itive/ruin2itive-site
  branch: main
  base_url: https://YOUR-WORKER-URL.workers.dev  # ← Replace with your Worker URL
  auth_endpoint: auth
```

**Commit and push**:
```bash
git add admin/config.yml
git commit -m "Configure OAuth proxy for Decap CMS"
git push origin main
```

---

### 5. Test Setup

1. **Visit**: https://ruin2itive.org/admin
2. **Click**: "Login with GitHub"
3. **Authorize**: Grant access when prompted
4. **Success**: You should see the CMS dashboard

---

## Troubleshooting Quick Fixes

| Error | Quick Fix |
|-------|-----------|
| **"Not Found"** | Check `base_url` in config.yml matches Worker URL exactly |
| **"Callback mismatch"** | Verify GitHub OAuth App callback = `YOUR-WORKER-URL/callback` |
| **"Forbidden"** | Ensure you have write access to repository |
| **Popup closes** | Check `ALLOWED_ORIGIN` = `https://ruin2itive.org` (no trailing slash) |
| **Worker not responding** | Check Cloudflare dashboard for deployment errors |

---

## Alternative: Vercel Deployment

**Quick steps**:
1. Fork: https://github.com/ublabs/netlify-cms-oauth
2. Deploy to [Vercel](https://vercel.com) (one-click)
3. Add environment variables in Vercel dashboard:
   - `GITHUB_CLIENT_ID` = Your Client ID
   - `GITHUB_CLIENT_SECRET` = Your Client Secret
4. Note Vercel URL (e.g., `https://your-project.vercel.app`)
5. Update GitHub OAuth callback to: `https://your-project.vercel.app/callback`
6. Update `config.yml` with Vercel URL as `base_url`

---

## Your Configuration Record

**Keep this for your records (do NOT commit Client Secret!):**

```
GitHub OAuth App:
├─ Name: ruin2itive-cms
├─ Client ID: _________________________________
├─ Client Secret: _____________________________ (stored securely)
└─ Callback URL: ______________________________

OAuth Proxy:
├─ Provider: Cloudflare Workers / Vercel
├─ Worker URL: _________________________________
└─ Status: Deployed ☐

CMS Configuration:
├─ Repository: Ruin2itive/ruin2itive-site
├─ Branch: main
├─ base_url: ___________________________________
└─ Updated: ☐

Testing:
├─ Admin login: ☐
├─ Test post created: ☐
└─ Commit visible in GitHub: ☐
```

---

## Useful Links

- 📖 [Complete Guide](OAUTH_SETUP_COMPLETE.md)
- 🔧 [Cloudflare OAuth Proxy](https://github.com/sterlingwes/decap-proxy)
- 🚀 [Vercel OAuth Proxy](https://github.com/ublabs/netlify-cms-oauth)
- 💬 [Decap CMS Docs](https://decapcms.org/)
- 🐛 [Report Issues](https://github.com/Ruin2itive/ruin2itive-site/issues)

---

## Security Reminders

🔒 **Never commit your Client Secret!**  
🔒 Store secrets in Cloudflare/Vercel environment  
🔒 Rotate secrets periodically  
🔒 Review repository access regularly  

---

**Last updated**: February 2026  
**Version**: 1.0
