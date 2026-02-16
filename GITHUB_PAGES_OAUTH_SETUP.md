# GitHub Pages OAuth Setup for Netlify/Decap CMS

## Problem: "Not Found" Error on `/admin` Login

When using Netlify CMS (now Decap CMS) with GitHub Pages, you'll encounter a "Not Found" error during authentication because **GitHub's OAuth requires a server-side component** to securely exchange authorization codes for access tokens.

## Why This Happens

- **GitHub backend** in Decap CMS uses OAuth Authorization Code Flow
- This flow requires a backend server to handle the OAuth exchange
- GitHub does NOT support implicit/client-side-only authentication
- **Solution**: Deploy a free OAuth proxy server

## Quick Fix: Deploy a Free OAuth Proxy

### Option 1: Cloudflare Workers (Recommended - Free Forever)

**Step 1: Create a GitHub OAuth Application**

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: `Ruin2itive CMS` (or your preferred name)
   - **Homepage URL**: `https://ruin2itive.org`
   - **Authorization callback URL**: `https://your-worker-name.your-subdomain.workers.dev/callback` (you'll get this after deploying the worker)
4. Click "Register application"
5. **Save the Client ID** and generate a **Client Secret** - you'll need these

**Step 2: Deploy the OAuth Proxy to Cloudflare Workers**

1. Fork or clone: https://github.com/sterlingwes/decap-proxy
2. Or use this one-click deploy button (if available in the repo)
3. Set environment variables in Cloudflare Workers:
   - `GITHUB_CLIENT_ID`: Your GitHub OAuth App Client ID
   - `GITHUB_CLIENT_SECRET`: Your GitHub OAuth App Client Secret
   - `ALLOWED_ORIGIN`: `https://ruin2itive.org`
4. Deploy the worker
5. Note your worker URL (e.g., `https://cms-oauth.your-subdomain.workers.dev`)

**Step 3: Update GitHub OAuth App Callback URL**

Go back to your GitHub OAuth App settings and update:
- **Authorization callback URL**: `https://your-worker-url/callback`

**Step 4: Update CMS Configuration**

Update `/admin/config.yml`:

```yaml
backend:
  name: github
  repo: Ruin2itive/ruin2itive-site
  branch: main
  base_url: https://your-worker-url  # Your Cloudflare Worker URL
  auth_endpoint: auth

media_folder: static/images/uploads
public_folder: /images/uploads

site_url: https://ruin2itive.org
display_url: https://ruin2itive.org

collections:
  - name: "posts"
    label: "Posts"
    folder: "content/posts"
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "Date", name: "date", widget: "datetime" }
      - { label: "Author", name: "author", widget: "string" }
      - { label: "Body", name: "body", widget: "markdown" }
```

**Step 5: Test**

1. Visit `https://ruin2itive.org/admin`
2. Click "Login with GitHub"
3. You'll be redirected to GitHub for authorization
4. After authorizing, you'll be redirected back to the CMS
5. You should now see the CMS dashboard!

### Option 2: Vercel (Also Free)

1. Fork: https://github.com/ublabs/netlify-cms-oauth
2. Deploy to Vercel with one click
3. Set environment variables:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
4. Update your CMS config with the Vercel URL

### Option 3: Self-Hosted Docker

For complete control:

1. Clone: https://github.com/njfamirm/decap-cms-github-backend
2. Deploy to your own server or Docker container
3. Configure environment variables
4. Update CMS config with your server URL

## Alternative: Use Netlify Hosting with Git Gateway

If you prefer not to manage an OAuth proxy, consider:

1. **Host on Netlify** (free tier available)
2. Use **Git Gateway** backend instead of GitHub backend
3. Enable **Netlify Identity** for user management

Update `/admin/config.yml`:

```yaml
backend:
  name: git-gateway
  repo: Ruin2itive/ruin2itive-site
  branch: main
```

Then enable Netlify Identity and Git Gateway in your Netlify dashboard.

## Understanding the Error

The "Not Found" error occurs because:

1. Decap CMS tries to make an OAuth request to GitHub
2. GitHub requires a server-side `client_secret` to exchange authorization codes
3. Without `base_url` pointing to an OAuth proxy, the request fails
4. Result: 404 "Not Found" from GitHub API

## Access Requirements

To use the CMS, users need:
- **Write access** to the `Ruin2itive/ruin2itive-site` repository
- A **GitHub account**
- Authorization to allow the OAuth app to access the repository

## Security Notes

- **Never commit** your `client_secret` to the repository
- Store secrets as environment variables in your OAuth proxy
- Only authorized GitHub users with repo access can edit content
- All edits are tracked in Git history with proper attribution

## Troubleshooting

### "Error: Failed to load config"
- Ensure `/admin/config.yml` exists and is accessible
- Check for YAML syntax errors

### "Authentication popup closes immediately"
- Check that `ALLOWED_ORIGIN` matches your site URL exactly
- Ensure no trailing slashes in URLs

### "Still getting Not Found"
- Verify your `base_url` is correct and the proxy is running
- Check browser console for detailed error messages
- Ensure GitHub OAuth App callback URL matches proxy URL

### "403 Forbidden after login"
- User needs write access to the repository
- Check repository permissions in GitHub

## Resources

- [Decap CMS Documentation](https://decapcms.org/)
- [Cloudflare Workers OAuth Proxy](https://github.com/sterlingwes/decap-proxy)
- [Vercel OAuth Proxy](https://github.com/ublabs/netlify-cms-oauth)
- [Self-Hosted OAuth Backend](https://github.com/njfamirm/decap-cms-github-backend)

## Quick Reference: OAuth Proxies

| Provider | Free Tier | Deployment | Recommended |
|----------|-----------|------------|-------------|
| Cloudflare Workers | ✓ Forever Free (100k requests/day) | Very Easy | ⭐ Best |
| Vercel | ✓ Free Tier | Easy | ⭐ Good |
| Self-Hosted | Depends | Advanced | For experts |

## Next Steps

1. Choose an OAuth proxy option (Cloudflare Workers recommended)
2. Create GitHub OAuth App
3. Deploy the OAuth proxy
4. Update `/admin/config.yml` with `base_url`
5. Test the login at `/admin`
6. Start creating content!

## Support

For issues:
- Check the [Decap CMS GitHub Issues](https://github.com/decaporg/decap-cms/issues)
- Review [OAuth proxy documentation](https://decapcms.org/docs/external-oauth-clients/)
- Open an issue in this repository
