# Netlify CMS Setup Guide

## Overview
This site now includes Netlify CMS integration for managing blog entries in the Sketchbook section. The CMS provides a user-friendly admin interface accessible at `/admin`.

## What Was Added

### 1. Admin Interface (`/admin`)
- **`/admin/index.html`**: Netlify CMS admin interface
- **`/admin/config.yml`**: Configuration file defining content structure

### 2. Blog Post Management
- **`/sketchbook/posts/`**: Directory for blog post markdown files
- **`/sketchbook/blog-loader.js`**: JavaScript to load and display posts
- **`/assets/uploads/`**: Media upload directory

### 3. Configuration Files
- **`netlify.toml`**: Netlify deployment configuration with security headers

## Deployment on Netlify

To enable the CMS functionality, follow these steps:

### 1. Connect to Netlify
1. Log in to [Netlify](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Select GitHub and authorize Netlify
4. Choose the `Ruin2itive/ruin2itive-site` repository
5. Configure build settings:
   - **Branch to deploy**: `main`
   - **Build command**: (leave empty)
   - **Publish directory**: `.` (root)

### 2. Enable Netlify Identity
1. Go to your site's settings in Netlify
2. Navigate to "Identity" in the sidebar
3. Click "Enable Identity"
4. Under "Registration preferences", select "Invite only"
5. Under "External providers", enable your preferred login method (GitHub recommended)

### 3. Enable Git Gateway
1. In the Identity settings, scroll to "Services"
2. Click "Enable Git Gateway"
3. This allows the CMS to commit changes back to your GitHub repository

### 4. Invite Users
1. Go to the "Identity" tab in your Netlify dashboard
2. Click "Invite users"
3. Enter the email addresses of content creators
4. They'll receive an invitation email to set up their account

## Using the CMS

### For Content Creators:

1. **Access the Admin Interface**
   - Visit `https://your-site-url.netlify.app/admin`
   - Log in with your Netlify Identity credentials

2. **Create a New Blog Post**
   - Click "New Blog" in the CMS interface
   - Fill in the required fields:
     - **Title**: Post title
     - **Publish Date**: When to publish
     - **Body**: Your content in Markdown format
   - Click "Publish" to save

3. **Edit Existing Posts**
   - Click on any post in the list
   - Make your changes
   - Click "Publish" to save

4. **Upload Media**
   - Use the image button in the Markdown editor
   - Upload files to `/assets/uploads/`

## Blog Post Format

Blog posts are stored as Markdown files with YAML frontmatter:

```markdown
---
title: Your Post Title
date: 2024-02-15T12:00:00.000Z
---

Your content here in **Markdown** format.

## Headings work
- Lists work
- *Italic* and **bold** text work
```

## Manual Blog Post Management

If you prefer to create posts manually:

1. Create a new `.md` file in `/sketchbook/posts/`
2. Use the naming convention: `YYYY-MM-DD-post-slug.md`
3. Add frontmatter (title and date)
4. Write your content in Markdown
5. Update `/sketchbook/blog-loader.js` to include the new filename in the `postFiles` array

## Security Notes

- The CMS uses Git Gateway for authentication (secure)
- Only invited users can access the admin interface
- All changes are committed to GitHub with proper author attribution
- Security headers are configured in `netlify.toml`

## Troubleshooting

### "Unable to load identity"
- Ensure Netlify Identity is enabled in your site settings
- Check that you're accessing the site via the correct Netlify URL

### "Config.yml not found"
- Verify `/admin/config.yml` is deployed
- Check the file path in your repository

### Posts not appearing
- Ensure the markdown file is in `/sketchbook/posts/`
- Verify the frontmatter format is correct
- Check that the filename is added to `blog-loader.js`

## Local Development

When developing locally, the Netlify Identity and CMS features won't work as they require Netlify's infrastructure. You can:

1. Test with the sample blog post included
2. Preview the admin interface structure
3. Create posts manually for testing

## Files Modified

- `/index.html` - Added Netlify Identity widget
- `/sketchbook/index.html` - Added Identity widget and blog loader
- Created `/admin/` directory with CMS files
- Created `/sketchbook/posts/` for blog content
- Added `netlify.toml` for deployment configuration

## Next Steps

1. Deploy the site to Netlify
2. Enable Netlify Identity and Git Gateway
3. Invite content creators
4. Start creating blog posts via `/admin`!
