# Admin OAuth 404 Error - Fix Documentation

## Problem
The `/admin` page encountered a 404 error when attempting to authenticate with GitHub OAuth, displaying:
```json
{
  "message": "Not Found",
  "documentation_url": "https://docs.github.com/rest"
}
```

## Root Cause
The Netlify CMS configuration in `/admin/config.yml` was incorrectly set up:

```yaml
backend:
  name: github  # ← Incorrect: requires custom OAuth backend
  base_url: https://api.github.com  # ← Incorrect: causes 404 errors
```

This configuration attempts direct GitHub OAuth authentication, which requires a custom OAuth backend proxy server (not present in this repository).

## Solution
Changed the backend configuration to use Netlify's managed authentication:

```yaml
backend:
  name: git-gateway  # ✓ Correct: uses Netlify Identity + Git Gateway
  # No base_url needed
```

## Technical Details

### Why This Works
- **git-gateway**: Netlify's managed service that bridges Netlify CMS to GitHub
- **Authentication**: Uses Netlify Identity (not direct GitHub OAuth)
- **Commits**: Git Gateway makes commits on behalf of authenticated users
- **No Custom Backend**: No need for custom OAuth proxy server

### Backend Comparison

| Feature | `github` backend | `git-gateway` backend |
|---------|------------------|----------------------|
| Authentication | GitHub OAuth (direct) | Netlify Identity |
| OAuth Server | Custom proxy required | Netlify managed |
| Repository Access | Each user needs write access | Only Git Gateway needs access |
| Best For | Self-hosted with OAuth proxy | Netlify hosting |
| Setup Complexity | High (requires OAuth server) | Low (built into Netlify) |

## Deployment Checklist

To complete the fix, ensure these steps are done in the Netlify dashboard:

### 1. Enable Netlify Identity
1. Go to your site in [Netlify Dashboard](https://app.netlify.com)
2. Navigate to **Site settings** → **Identity**
3. Click **Enable Identity**
4. Set **Registration preferences** to **Invite only** (recommended)
5. (Optional) Enable external providers like GitHub for user login

### 2. Enable Git Gateway
1. In **Identity** settings, scroll to **Services**
2. Click **Enable Git Gateway**
3. This authorizes the CMS to commit to your GitHub repository

### 3. Invite Users
1. Go to the **Identity** tab
2. Click **Invite users**
3. Enter email addresses of content editors
4. Users will receive invitation emails to set up accounts

### 4. Test Authentication
1. Visit `https://your-site.netlify.app/admin`
2. Click **Login with Netlify Identity**
3. Should see Netlify Identity login (not GitHub OAuth)
4. After login, you should access the CMS successfully

## Files Modified

### `/admin/config.yml`
```diff
 backend:
-  name: github
+  name: git-gateway
   repo: Ruin2itive/ruin2itive-site
   branch: main
-  base_url: https://api.github.com
```

### `/NETLIFY_CMS_SETUP.md`
Added comprehensive troubleshooting section explaining:
- The 404 OAuth error and its cause
- Difference between `github` and `git-gateway` backends
- Steps to ensure proper configuration

## Verification

You can verify the configuration is correct by running:

```bash
# Check backend is set to git-gateway
grep "name: git-gateway" admin/config.yml

# Check no incorrect base_url
! grep "base_url: https://api.github.com" admin/config.yml

# Check Netlify Identity widget is included
grep "netlify-identity-widget.js" admin/index.html
```

All checks should pass ✓

## Alternative: Using GitHub Backend with OAuth Proxy

If you prefer direct GitHub authentication (not recommended for this setup), you would need:

1. **Deploy OAuth Proxy**: Use a service like:
   - [netlify-cms-github-oauth-provider](https://github.com/vencax/netlify-cms-github-oauth-provider)
   - Deploy to Netlify Functions, Vercel, or Heroku

2. **Configure GitHub OAuth App**:
   - Create OAuth App in GitHub Developer settings
   - Set callback URL to your OAuth proxy: `https://oauth-proxy.com/callback`

3. **Update config.yml**:
   ```yaml
   backend:
     name: github
     repo: Ruin2itive/ruin2itive-site
     branch: main
     base_url: https://oauth-proxy.com
     auth_endpoint: auth
   ```

4. **Set Environment Variables** on OAuth proxy:
   - `OAUTH_CLIENT_ID` (GitHub OAuth App Client ID)
   - `OAUTH_CLIENT_SECRET` (GitHub OAuth App Client Secret)

**Note**: This approach is more complex and unnecessary for Netlify hosting.

## References

- [Netlify CMS Git Gateway Documentation](https://decapcms.org/docs/git-gateway-backend/)
- [Netlify Identity Documentation](https://docs.netlify.com/visitor-access/identity/)
- [Git Gateway GitHub Repository](https://github.com/netlify/git-gateway)
- [NETLIFY_CMS_SETUP.md](./NETLIFY_CMS_SETUP.md) - Full setup guide

## Support

If you continue to experience issues:

1. Verify Netlify Identity is enabled
2. Verify Git Gateway is enabled
3. Check browser console for error messages
4. Ensure you've been invited as a user
5. Try clearing browser cache and cookies

For additional help, consult the [Netlify Support Forum](https://answers.netlify.com/).
