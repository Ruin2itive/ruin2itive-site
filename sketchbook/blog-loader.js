/**
 * Sketchbook Blog Post Loader
 * Loads and displays blog posts from markdown files in the sketchbook/posts directory
 */

// Function to escape HTML entities to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Function to parse markdown frontmatter and content
function parseMarkdown(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return null;
  }
  
  const frontmatter = {};
  const frontmatterLines = match[1].split('\n');
  
  frontmatterLines.forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > -1) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }
  });
  
  const body = match[2].trim();
  
  return {
    title: frontmatter.title || 'Untitled',
    date: frontmatter.date ? new Date(frontmatter.date) : new Date(),
    body: body
  };
}

// Function to convert markdown to basic HTML
function markdownToHtml(markdown) {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Paragraphs
  html = html.split('\n\n').map(para => {
    if (!para.startsWith('<h') && para.trim()) {
      return '<p>' + para + '</p>';
    }
    return para;
  }).join('\n');
  
  return html;
}

// Function to create an excerpt from the body
function createExcerpt(body, maxLength = 200) {
  // Use DOMParser to safely strip HTML tags
  const doc = new DOMParser().parseFromString(body, 'text/html');
  const plainText = doc.body.textContent || '';
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  return plainText.substring(0, maxLength).trim() + '...';
}

// Function to format date
function formatDate(date) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Function to load and display blog posts
async function loadBlogPosts() {
  const postsContainer = document.querySelector('.posts-list');
  
  if (!postsContainer) {
    return;
  }
  
  try {
    // IMPORTANT: This array must be manually maintained.
    // When new posts are created via Netlify CMS, add their filenames here.
    // For automated generation, consider implementing a build-time script.
    const postFiles = [
      '2024-02-15-welcome-to-sketchbook.md'
      // Add more post filenames here as they are created
    ];
    
    if (postFiles.length === 0) {
      postsContainer.innerHTML = '<li class="empty-state">No blog posts yet. Check back soon!</li>';
      return;
    }
    
    const posts = [];
    
    for (const filename of postFiles) {
      const response = await fetch(`posts/${filename}`);
      if (response.ok) {
        const content = await response.text();
        const post = parseMarkdown(content);
        
        if (post) {
          post.filename = filename;
          posts.push(post);
        }
      }
    }
    
    // Sort posts by date (newest first)
    posts.sort((a, b) => b.date - a.date);
    
    if (posts.length === 0) {
      postsContainer.innerHTML = '<li class="empty-state">No blog posts yet. Check back soon!</li>';
      return;
    }
    
    // Render posts
    postsContainer.innerHTML = posts.map(post => {
      const htmlBody = markdownToHtml(post.body);
      const excerpt = createExcerpt(htmlBody);
      
      return `
        <li class="post-item">
          <h2><a href="#${escapeHtml(post.filename)}">${escapeHtml(post.title)}</a></h2>
          <div class="post-meta">${escapeHtml(formatDate(post.date))}</div>
          <div class="post-excerpt">${escapeHtml(excerpt)}</div>
        </li>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Error loading blog posts:', error);
    postsContainer.innerHTML = '<li class="empty-state">Error loading blog posts.</li>';
  }
}

// Load posts when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadBlogPosts);
} else {
  loadBlogPosts();
}
