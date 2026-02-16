# Self-Hosting PeerJS Signaling Server

This guide provides instructions for deploying your own PeerJS signaling server to replace the default cloud signaling server (0.peerjs.com). Self-hosting gives you more control, reliability, and independence from third-party services.

## Why Self-Host a PeerJS Server?

- **Reliability**: No dependency on external cloud services
- **Control**: Full control over server configuration and uptime
- **Privacy**: Your signaling data stays on your infrastructure
- **Customization**: Ability to customize server behavior and features
- **Performance**: Potentially lower latency with geographically optimized deployment

## Prerequisites

- Node.js 14+ installed on your server
- A server or cloud hosting account (Heroku, AWS, DigitalOcean, etc.)
- Basic knowledge of server deployment and DNS configuration
- SSL certificate for HTTPS (required for WebRTC)

## Quick Start with Docker

The easiest way to deploy a PeerJS server is using Docker:

```bash
# Pull the official PeerJS server image
docker pull peerjs/peerjs-server

# Run the server
docker run -p 9000:9000 -d peerjs/peerjs-server
```

For a production deployment with custom configuration:

```bash
docker run -p 9000:9000 -d \
  -e PEERJS_PORT=9000 \
  -e PEERJS_PATH=/myapp \
  -e PEERJS_KEY=mySecretKey \
  peerjs/peerjs-server
```

## Deployment Options

### Option 1: Heroku Deployment

Heroku provides an easy way to deploy a PeerJS server with minimal configuration.

#### Step 1: Create a Heroku App

```bash
# Install Heroku CLI if not already installed
# Visit https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create a new app
heroku create my-peerjs-server
```

#### Step 2: Prepare Your Server Code

Create a `package.json`:

```json
{
  "name": "my-peerjs-server",
  "version": "1.0.0",
  "description": "PeerJS signaling server",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "peer": "^1.0.0"
  },
  "engines": {
    "node": "18.x"
  }
}
```

Create a `server.js`:

```javascript
const { PeerServer } = require('peer');

const port = process.env.PORT || 9000;
const path = process.env.PEERJS_PATH || '/';
const key = process.env.PEERJS_KEY || 'peerjs';

const peerServer = PeerServer({
  port: port,
  path: path,
  key: key,
  allow_discovery: true
});

peerServer.on('connection', (client) => {
  console.log(`Client connected: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`Client disconnected: ${client.getId()}`);
});

console.log(`PeerJS server running on port ${port} with path ${path}`);
```

Create a `Procfile`:

```
web: node server.js
```

#### Step 3: Deploy to Heroku

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial PeerJS server"

# Deploy to Heroku
git push heroku main

# Open your app
heroku open
```

Your PeerJS server will be available at: `https://my-peerjs-server.herokuapp.com`

### Option 2: AWS EC2 Deployment

Deploy on an AWS EC2 instance for more control and scalability.

#### Step 1: Launch EC2 Instance

1. Log in to AWS Console
2. Launch a new EC2 instance (Ubuntu 22.04 recommended)
3. Choose t2.micro (free tier) or larger based on your needs
4. Configure security group to allow:
   - Port 22 (SSH)
   - Port 443 (HTTPS)
   - Port 9000 (PeerJS server, or your chosen port)

#### Step 2: Connect and Install Dependencies

```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

#### Step 3: Setup PeerJS Server

```bash
# Create directory for the server
mkdir ~/peerjs-server
cd ~/peerjs-server

# Initialize npm project
npm init -y

# Install PeerJS server
npm install peer

# Create server file
nano server.js
```

Use the same `server.js` content from the Heroku example above.

#### Step 4: Configure Reverse Proxy with Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/peerjs
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/peerjs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 5: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Certbot will automatically configure Nginx for HTTPS
```

#### Step 6: Start Server with PM2

```bash
# Start the server
pm2 start server.js --name peerjs-server

# Configure PM2 to start on boot
pm2 startup
pm2 save
```

### Option 3: DigitalOcean App Platform

DigitalOcean's App Platform offers easy deployment with automatic SSL.

#### Step 1: Create Git Repository

1. Create a GitHub repository with `package.json`, `server.js`, and any other necessary files
2. Push your code to the repository

#### Step 2: Deploy on DigitalOcean

1. Log in to DigitalOcean
2. Go to App Platform
3. Click "Create App"
4. Connect your GitHub repository
5. Configure:
   - **Environment**: Node.js
   - **Build Command**: (leave empty)
   - **Run Command**: `node server.js`
6. Add environment variables if needed:
   - `PEERJS_PATH`: `/`
   - `PEERJS_KEY`: `your-secret-key`
7. Click "Create Resources"

Your app will be available at a `.ondigitalocean.app` domain with automatic SSL.

### Option 4: Docker Compose for Self-Hosted Environments

For self-hosted environments, use Docker Compose for easy management.

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  peerjs-server:
    image: peerjs/peerjs-server
    container_name: peerjs-server
    ports:
      - "9000:9000"
    environment:
      - PEERJS_PORT=9000
      - PEERJS_PATH=/
      - PEERJS_KEY=your-secret-key
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - peerjs-server
    restart: unless-stopped
```

## Configuring Your Chat Application

Once your PeerJS server is deployed, update the chat application to use your server.

### Update chat.js Configuration

Open `chat.js` and modify the `PEER_SERVER_CONFIG`:

```javascript
const PEER_SERVER_CONFIG = {
  // Replace with your server details
  host: 'your-domain.com',  // or 'your-app.herokuapp.com'
  port: 443,                 // Use 443 for HTTPS
  path: '/',                 // Use the path you configured
  secure: true,              // Always use true for production
  key: 'your-secret-key',    // Optional: if you set a key on your server
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }
};
```

### Testing Your Server

Test your PeerJS server is working:

```bash
# Test basic connectivity
curl https://your-domain.com/

# You should see a response like:
# {"name":"PeerJS Server","description":"A server for PeerJS clients.","website":"https://peerjs.com/"}
```

## Server Configuration Options

### Environment Variables

- `PORT`: Server port (default: 9000)
- `PEERJS_PATH`: API path prefix (default: `/`)
- `PEERJS_KEY`: API key for authentication (optional)
- `PEERJS_EXPIRE_TIMEOUT`: Connection expiration timeout in milliseconds (default: 5000)
- `PEERJS_ALIVE_TIMEOUT`: Heartbeat timeout in milliseconds (default: 60000)
- `PEERJS_ALLOW_DISCOVERY`: Allow peer discovery (default: false)

### Advanced Configuration

For advanced configuration, create a config object in your `server.js`:

```javascript
const peerServer = PeerServer({
  port: port,
  path: path,
  key: key,
  
  // Connection timeouts
  expire_timeout: 5000,        // Cleanup timeout for disconnected peers
  alive_timeout: 60000,        // Keep-alive timeout
  
  // Security
  allow_discovery: false,       // Disable peer discovery for security
  
  // SSL (if not using reverse proxy)
  ssl: {
    key: fs.readFileSync('/path/to/key.pem'),
    cert: fs.readFileSync('/path/to/cert.pem')
  },
  
  // CORS
  corsOptions: {
    origin: 'https://your-domain.com',
    credentials: true
  }
});
```

## Monitoring and Maintenance

### Health Checks

Add health check endpoints to monitor your server:

```javascript
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime() });
});

app.listen(3000, () => {
  console.log('Health check available on port 3000');
});
```

### Logging

Configure logging for debugging and monitoring:

```javascript
peerServer.on('connection', (client) => {
  console.log(`[${new Date().toISOString()}] Client connected: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`[${new Date().toISOString()}] Client disconnected: ${client.getId()}`);
});

peerServer.on('error', (error) => {
  console.error(`[${new Date().toISOString()}] Server error:`, error);
});
```

### Scaling Considerations

For high-traffic applications:

1. **Horizontal Scaling**: Deploy multiple PeerJS server instances behind a load balancer
2. **Redis**: Use Redis for session storage across instances
3. **Sticky Sessions**: Configure load balancer for sticky sessions
4. **Monitoring**: Use tools like Prometheus or Datadog to monitor server health
5. **Auto-scaling**: Configure auto-scaling based on CPU/memory usage

## Troubleshooting

### Common Issues

**Issue**: Clients can't connect to the server

**Solutions**:
- Verify server is running: `curl https://your-domain.com/`
- Check firewall rules allow traffic on the server port
- Ensure SSL certificate is valid
- Verify DNS records point to your server

**Issue**: WebSocket connection fails

**Solutions**:
- Check Nginx/proxy configuration includes WebSocket upgrade headers
- Verify no intermediate proxies are blocking WebSocket connections
- Test WebSocket connection directly to the server

**Issue**: Connection works locally but not in production

**Solutions**:
- Ensure SSL is properly configured (WebRTC requires HTTPS in production)
- Check CORS settings allow your domain
- Verify `secure: true` is set in client configuration for HTTPS

## Security Best Practices

1. **Use SSL/TLS**: Always use HTTPS in production
2. **API Keys**: Use API keys to prevent unauthorized server access
3. **CORS**: Configure CORS to only allow your domain
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Monitoring**: Set up monitoring and alerts for suspicious activity
6. **Updates**: Keep PeerJS server and dependencies updated
7. **Firewall**: Only expose necessary ports
8. **Authentication**: Consider adding authentication for peer connections

## Cost Estimates

### Heroku
- **Hobby**: $7/month (dyno) - Good for small applications
- **Production**: $25-50/month - For production workloads

### AWS EC2
- **t2.micro**: Free tier for 1 year, then ~$10/month
- **t2.small**: ~$17/month - Recommended for production

### DigitalOcean
- **Basic Droplet**: $6-12/month
- **App Platform**: $5-12/month

### Docker on VPS
- **Self-hosted VPS**: $5-20/month (various providers)

## Support and Resources

- **PeerJS Documentation**: https://peerjs.com/docs/
- **PeerJS Server GitHub**: https://github.com/peers/peerjs-server
- **WebRTC Resources**: https://webrtc.org/
- **Community Support**: https://discuss.peerjs.com/

## Conclusion

Self-hosting a PeerJS signaling server provides greater control, reliability, and independence. Choose the deployment option that best fits your technical expertise and infrastructure requirements. Remember to always use HTTPS in production and implement proper security measures.

For questions or issues with the chat implementation, please refer to the main `CHAT_FEATURE.md` documentation or open an issue on GitHub.
