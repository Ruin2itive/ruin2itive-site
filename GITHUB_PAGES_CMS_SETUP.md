# Netlify CMS Setup for GitHub Pages

## Overview
This site is configured with Netlify CMS for managing blog posts, optimized for GitHub Pages hosting with direct GitHub authentication.

## Configuration

The admin interface is accessible at `/admin` and uses the following configuration:

### Backend Configuration
- **Backend**: `github` (direct GitHub authentication)
- **Repository**: `Ruin2itive/ruin2itive-site`
- **Branch**: `main`
- **Posts Location**: `content/posts/`
- **Media Uploads**: `static/images/uploads/`

### Post Schema
Each blog post includes the following fields:
- **Title** (string): The post title
- **Date** (datetime): Publication date and time
- **Author** (string): Post author name
- **Body** (markdown): Post content in Markdown format

## Using the Admin Interface

### For GitHub Pages Deployment

1. **Access the Admin Interface**
   - Visit `https://ruin2itive.org/admin` (or your GitHub Pages URL + `/admin`)
   - You'll be prompted to authenticate with GitHub

2. **GitHub Authentication**
   - Click "Login with GitHub"
   - Authorize the application to access your repository
   - You must have write access to the `Ruin2itive/ruin2itive-site` repository

3. **Create a New Post**
   - Click "New Posts" in the CMS interface
   - Fill in the required fields:
     - **Title**: Your post title
     - **Date**: Publication date/time
     - **Author**: Your name
     - **Body**: Write your content in Markdown
   - Click "Save" to save as draft or "Publish" to commit immediately

4. **Edit Existing Posts**
   - Browse posts in the CMS interface
   - Click on any post to edit
   - Make your changes
   - Click "Publish" to commit changes to GitHub

5. **Upload Images**
   - Use the image button in the Markdown editor toolbar
   - Upload files - they'll be saved to `static/images/uploads/`
   - Images will be automatically inserted into your post

## How It Works

When you save or publish a post:
1. Netlify CMS creates/updates a Markdown file in `content/posts/`
2. The file includes YAML frontmatter with metadata (title, date, author)
3. Changes are committed directly to the GitHub repository
4. GitHub Pages automatically rebuilds and deploys your site
5. Your post appears on the live site within minutes

## Post File Format

Posts are stored as Markdown files with YAML frontmatter:

```markdown
---
title: Your Post Title
date: 2026-02-16T12:00:00.000Z
author: Your Name
---

Your post content here in **Markdown** format.

## Headings
- Lists
- *Italic* and **bold** text
```

## Manual Post Management

You can also create posts manually if preferred:

1. Create a new `.md` file in `content/posts/`
2. Add YAML frontmatter with title, date, and author
3. Write your content in Markdown
4. Commit and push to the repository
5. GitHub Pages will automatically deploy the changes

## Access Requirements

To use the admin interface, you need:
- Write access to the GitHub repository
- GitHub account for authentication
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Troubleshooting

### "Unable to authenticate with GitHub"
- Ensure you have write access to the repository
- Check that you're logged into GitHub
- Try clearing browser cache and cookies
- Verify the repository URL in `admin/config.yml` is correct

### "Config not found"
- Verify `admin/config.yml` exists in the repository
- Check that the file is deployed to GitHub Pages
- Clear browser cache and reload the page

### Posts not appearing after publishing
- Wait 1-2 minutes for GitHub Pages to rebuild
- Check the GitHub Actions tab for build status
- Verify the post file was created in `content/posts/`
- Check that the frontmatter format is correct

### Images not loading
- Verify images are in `static/images/uploads/`
- Check that the image path in your Markdown is correct: `/images/uploads/filename.jpg`
- Ensure images were committed to the repository

## Security Notes

- Only users with write access to the repository can use the admin interface
- All changes are tracked in Git history with proper author attribution
- Authentication is handled securely through GitHub OAuth
- No API keys or credentials are stored in the repository

## Files and Directories

```
/
├── admin/
│   ├── index.html          # Admin interface HTML
│   └── config.yml          # CMS configuration
├── content/
│   └── posts/              # Blog posts directory
│       └── .gitkeep        # Ensures directory is tracked in Git
└── static/
    └── images/
        └── uploads/        # Media upload directory
            └── .gitkeep    # Ensures directory is tracked in Git
```

## Differences from Netlify Hosting

This configuration uses the `github` backend instead of `git-gateway`:

| Feature | git-gateway (Netlify) | github (GitHub Pages) |
|---------|----------------------|----------------------|
| Authentication | Netlify Identity | GitHub OAuth |
| Repository Access | Via Git Gateway | Direct GitHub access |
| User Management | Netlify Dashboard | GitHub repo permissions |
| Deployment | Netlify auto-deploy | GitHub Pages auto-deploy |
| Best For | Netlify hosting | GitHub Pages hosting |

## Next Steps

1. Ensure you have write access to the repository
2. Visit the admin interface at `/admin`
3. Authenticate with your GitHub account
4. Start creating and managing blog posts!

## Support

For issues or questions:
- Check the [Netlify CMS Documentation](https://www.netlifycms.org/docs/)
- Review GitHub Pages documentation
- Check repository issues and discussions
