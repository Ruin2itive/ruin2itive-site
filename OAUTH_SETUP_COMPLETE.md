# Complete OAuth Setup Guide for Decap CMS

This guide provides comprehensive step-by-step instructions for setting up GitHub OAuth authentication for Decap CMS (formerly Netlify CMS) on GitHub Pages.

## Prerequisites

Before you begin, ensure you have:

- ✅ **GitHub account** with admin access to `Ruin2itive/ruin2itive-site`
- ✅ **Cloudflare account** (free tier) OR **Vercel account** (free tier)
- ✅ Basic familiarity with command line tools (for Cloudflare setup)

**Estimated time**: 15-20 minutes

---

## Step 1: Create GitHub OAuth App

GitHub OAuth Apps allow external services (like Decap CMS) to authenticate users via GitHub.

### Instructions:

1. **Navigate to GitHub OAuth Apps settings**:
   - Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
   - Or manually: Click your profile → Settings → Developer settings (left sidebar) → OAuth Apps

2. **Create a new OAuth App**:
   - Click **"New OAuth App"** button

3. **Fill in the application details**:
   
   | Field | Value |
   |-------|-------|
   | **Application name** | `ruin2itive-cms` |
   | **Homepage URL** | `https://ruin2itive.org` |
   | **Application description** | `OAuth for Decap CMS on ruin2itive.org` |
   | **Authorization callback URL** | `https://YOUR-WORKER-URL.workers.dev/callback` |
   
   > ⚠️ **Important**: For now, use a placeholder for the callback URL (e.g., `https://placeholder.example.com/callback`). You'll update this after deploying the OAuth proxy in Step 3.

4. **Register the application**:
   - Click **"Register application"**

5. **Save your credentials**:
   - ✅ **Client ID**: Copy and save this immediately (it's visible on the screen)
   - ✅ **Client Secret**: Click **"Generate a new client secret"**, then copy and save it
   
   > 🔒 **Security Note**: The Client Secret is only shown once! Store it securely (password manager recommended). Never commit it to your repository.

---

## Step 2: Deploy Cloudflare Worker OAuth Proxy

The OAuth proxy acts as a secure intermediary between Decap CMS and GitHub's OAuth API, handling the token exchange process.

### Option A: Automated Setup (Recommended)

We've created an automated setup script that handles the entire deployment process.

1. **Download and run the setup script**:
   ```bash
   chmod +x setup-oauth-proxy.sh
   ./setup-oauth-proxy.sh
   ```

2. **Follow the prompts**:
   - The script will install Wrangler CLI (if needed)
   - Log you into Cloudflare
   - Clone the OAuth proxy template
   - Set up your GitHub OAuth credentials as secrets
   - Deploy the worker

3. **Note your Worker URL**:
   - At the end of deployment, you'll see output like:
     ```
     Published decap-proxy
     https://decap-proxy.your-subdomain.workers.dev
     ```
   - **Save this URL** - you'll need it for the next steps!

### Option B: Manual Setup

If you prefer manual control or the automated script doesn't work:

1. **Install Wrangler CLI** (Cloudflare's CLI tool):
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Clone the OAuth proxy template**:
   ```bash
   git clone https://github.com/sterlingwes/decap-proxy.git
   cd decap-proxy
   ```

4. **Configure secrets**:
   
   Set your GitHub OAuth App Client ID:
   ```bash
   wrangler secret put GITHUB_CLIENT_ID
   # Paste your Client ID when prompted
   ```
   
   Set your GitHub OAuth App Client Secret:
   ```bash
   wrangler secret put GITHUB_CLIENT_SECRET
   # Paste your Client Secret when prompted
   ```
   
   Set the allowed origin (your website):
   ```bash
   wrangler secret put ALLOWED_ORIGIN
   # Enter: https://ruin2itive.org
   ```

5. **Deploy the worker**:
   ```bash
   wrangler publish
   ```

6. **Note your Worker URL** from the deployment output.

---

## Step 3: Update GitHub OAuth App Callback URL

Now that you have your Worker URL, you need to update the OAuth App's callback URL.

### Instructions:

1. **Go back to GitHub OAuth Apps**:
   - Navigate to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)

2. **Select your OAuth App**:
   - Click on **"ruin2itive-cms"** (the app you just created)

3. **Update the Authorization callback URL**:
   - Replace the placeholder with your actual Worker URL + `/callback`
   - Example: `https://decap-proxy.your-subdomain.workers.dev/callback`

4. **Save changes**:
   - Click **"Update application"**

---

## Step 4: Update CMS Configuration

Update your CMS configuration to use the OAuth proxy.

### Instructions:

1. **Open `admin/config.yml`** in your repository

2. **Add the OAuth configuration** to the `backend` section:
   
   ```yaml
   backend:
     name: github
     repo: Ruin2itive/ruin2itive-site
     branch: main
     base_url: https://YOUR-WORKER-URL.workers.dev  # Replace with your actual Worker URL
     auth_endpoint: auth
   ```

3. **Example of complete configuration**:
   
   ```yaml
   backend:
     name: github
     repo: Ruin2itive/ruin2itive-site
     branch: main
     base_url: https://decap-proxy.your-subdomain.workers.dev
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

4. **Commit and push your changes**:
   ```bash
   git add admin/config.yml
   git commit -m "Configure OAuth proxy for Decap CMS"
   git push origin main
   ```

5. **Wait for GitHub Pages to rebuild** (usually takes 1-2 minutes)

---

## Step 5: Alternative - Vercel Deployment

If you prefer Vercel over Cloudflare Workers, here's a quick alternative setup:

### Instructions:

1. **Fork the OAuth proxy repository**:
   - Go to: https://github.com/ublabs/netlify-cms-oauth
   - Click **"Fork"** to create your own copy

2. **Deploy to Vercel**:
   - Go to [Vercel](https://vercel.com)
   - Click **"New Project"**
   - Import your forked repository
   - Click **"Deploy"**

3. **Configure environment variables** in Vercel dashboard:
   - Go to your project settings → Environment Variables
   - Add the following:
     
     | Name | Value |
     |------|-------|
     | `GITHUB_CLIENT_ID` | Your OAuth App Client ID |
     | `GITHUB_CLIENT_SECRET` | Your OAuth App Client Secret |

4. **Redeploy** the project for changes to take effect

5. **Note your Vercel deployment URL** (e.g., `https://your-project.vercel.app`)

6. **Update your GitHub OAuth App callback URL**:
   - Set it to: `https://your-project.vercel.app/callback`

7. **Update `admin/config.yml`**:
   ```yaml
   backend:
     name: github
     repo: Ruin2itive/ruin2itive-site
     branch: main
     base_url: https://your-project.vercel.app
     auth_endpoint: auth
   ```

---

## Step 6: Testing Your Setup

Time to test if everything works!

### Instructions:

1. **Visit the admin interface**:
   - Go to: https://ruin2itive.org/admin

2. **Click "Login with GitHub"**:
   - You should see a GitHub authorization page
   - If you see "Not Found" or an error, double-check your configuration

3. **Authorize the application**:
   - Review the permissions
   - Click **"Authorize"** to grant access

4. **Verify you're logged in**:
   - You should be redirected back to the CMS dashboard
   - You should see the CMS interface with your posts collection

5. **Try creating a test post**:
   - Click **"New Posts"**
   - Fill in the form
   - Click **"Publish"**
   - Verify the post appears in your repository under `content/posts/`

### Success Indicators:

- ✅ GitHub authorization page appears
- ✅ Redirect back to CMS dashboard after authorization
- ✅ Can see the CMS interface and collections
- ✅ Can create, edit, and save content
- ✅ Changes appear as commits in your GitHub repository

---

## Step 7: Troubleshooting

If something isn't working, here are common issues and solutions:

### Issue: "Not Found" or "404" Error

**Possible causes:**
- Worker URL is incorrect in `config.yml`
- Worker is not deployed or has deployment errors
- OAuth App callback URL doesn't match Worker URL

**Solutions:**
- ✅ Verify your `base_url` in `config.yml` matches your Worker URL exactly
- ✅ Check Cloudflare Workers dashboard for deployment status
- ✅ Ensure no trailing slashes in URLs
- ✅ Check browser console (F12) for detailed error messages

### Issue: "Callback URL Mismatch" Error

**Possible causes:**
- GitHub OAuth App callback URL doesn't match the Worker URL

**Solutions:**
- ✅ Go to GitHub OAuth Apps settings
- ✅ Ensure callback URL is: `https://your-worker-url.workers.dev/callback`
- ✅ Must include `/callback` at the end
- ✅ Must match your Worker URL exactly

### Issue: "Forbidden" or "403" Error After Login

**Possible causes:**
- User doesn't have write access to the repository
- GitHub token doesn't have required permissions

**Solutions:**
- ✅ Verify you have write/push access to `Ruin2itive/ruin2itive-site`
- ✅ Check repository settings → Collaborators
- ✅ Try revoking and re-authorizing the OAuth App

### Issue: Worker Not Responding

**Possible causes:**
- Secrets not properly configured
- CORS issues
- Worker deployment failed

**Solutions:**
- ✅ Check Cloudflare Workers dashboard for errors
- ✅ Verify all three secrets are set: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ALLOWED_ORIGIN`
- ✅ Ensure `ALLOWED_ORIGIN` is exactly: `https://ruin2itive.org` (no trailing slash)
- ✅ Check Worker logs for error details

### Issue: "Authentication Popup Closes Immediately"

**Possible causes:**
- CORS configuration issue
- `ALLOWED_ORIGIN` doesn't match site URL

**Solutions:**
- ✅ Verify `ALLOWED_ORIGIN` secret in Cloudflare Workers
- ✅ Must be exactly: `https://ruin2itive.org`
- ✅ No trailing slash
- ✅ Match protocol (https)

### Issue: Changes Not Appearing in Repository

**Possible causes:**
- OAuth App doesn't have write permissions
- Branch name is incorrect

**Solutions:**
- ✅ Verify `branch: main` in `config.yml` matches your repository's default branch
- ✅ Check if OAuth App has required repository permissions
- ✅ Look for error messages in browser console

### Still Having Issues?

1. **Check browser console** (F12 → Console tab) for detailed error messages
2. **Review Worker logs** in Cloudflare dashboard
3. **Verify all URLs** match exactly (no extra slashes, correct protocol)
4. **Test OAuth App** by visiting the Worker URL directly (you should see a simple message)
5. **Review existing documentation**:
   - [Decap CMS Documentation](https://decapcms.org/)
   - [Cloudflare Workers OAuth Proxy](https://github.com/sterlingwes/decap-proxy)
6. **Open an issue** in this repository with:
   - Error messages from console
   - Screenshots of the issue
   - Your configuration (without secrets!)

---

## Security Best Practices

🔒 **Important security considerations:**

1. **Never commit secrets**:
   - Client Secret should only exist in Cloudflare/Vercel environment
   - Never add it to `config.yml` or any code

2. **Use environment secrets**:
   - Always use Cloudflare Secrets or Vercel Environment Variables
   - Never hardcode credentials

3. **Limit access**:
   - Only grant CMS access to trusted collaborators
   - Review repository permissions regularly

4. **Monitor access**:
   - All CMS edits are tracked in Git history
   - Review commits regularly for unexpected changes

5. **Keep OAuth App secure**:
   - Rotate Client Secret periodically
   - Revoke OAuth App if compromised

---

## Summary

You've successfully configured GitHub OAuth for Decap CMS! Here's what you accomplished:

✅ Created a GitHub OAuth App  
✅ Deployed an OAuth proxy (Cloudflare Workers or Vercel)  
✅ Configured the callback URL  
✅ Updated your CMS configuration  
✅ Tested the authentication flow  

**Next steps:**
- Start creating content at https://ruin2itive.org/admin
- Add collaborators to your repository
- Customize your CMS collections and fields

**Quick reference**: See [OAUTH_QUICK_REFERENCE.md](OAUTH_QUICK_REFERENCE.md) for a one-page cheat sheet.

**Need help?** Open an issue in this repository or check the [Decap CMS documentation](https://decapcms.org/).

---

## Additional Resources

- 📖 [Decap CMS Official Documentation](https://decapcms.org/)
- 🔧 [Cloudflare Workers OAuth Proxy](https://github.com/sterlingwes/decap-proxy)
- 🚀 [Vercel OAuth Proxy](https://github.com/ublabs/netlify-cms-oauth)
- 💬 [Decap CMS Community](https://github.com/decaporg/decap-cms/discussions)
- 📝 [GitHub OAuth Apps Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)

---

**Last updated**: February 2026  
**Maintained by**: Ruin2itive project contributors
