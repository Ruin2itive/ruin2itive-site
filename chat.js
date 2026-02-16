/**
 * Chat Room Application
 * Real-time chat with WebRTC via PeerJS for GitHub Pages compatibility
 */

(function() {
  'use strict';

  // Configuration
  const PEER_SERVER_CONFIG = {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    }
  };

  const CONNECTION_CONFIG = {
    timeout: 15000, // 15 seconds timeout
    maxRetries: 3,
    retryDelay: 2000, // 2 seconds initial delay between retries
    maxRetryDelay: 10000, // Maximum delay for exponential backoff
    backoffMultiplier: 2, // Exponential backoff multiplier
    libraryLoadDelay: 2000 // 2 seconds delay to wait for PeerJS library
  };

  const RATE_LIMIT = {
    maxMessages: 5,
    timeWindow: 10000 // 10 seconds
  };

  // State
  let peer = null;
  let connections = new Map();
  let currentUser = null;
  let messageHistory = [];
  let messageTimes = [];
  let isConnected = false;
  let connectionRetries = 0;
  let browserInfo = null;
  let seenMessages = new Set(); // Track message IDs to prevent duplicates

  // DOM Elements
  const joinModal = document.getElementById('join-modal');
  const guestModeBtn = document.getElementById('guest-mode-btn');
  const accountModeBtn = document.getElementById('account-mode-btn');
  const guestForm = document.getElementById('guest-form');
  const accountForm = document.getElementById('account-form');
  const joinBtn = document.getElementById('join-btn');
  const messagesContainer = document.getElementById('messages');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const userDisplay = document.getElementById('user-display');
  const statusIndicator = document.getElementById('status-indicator');

  // Utility: Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Utility: Format timestamp
  function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  }

  // Utility: Generate unique ID
  function generateId() {
    return Math.random().toString(36).substring(2, 11);
  }

  // Browser Detection and Compatibility Check
  function detectBrowser() {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const isFirefox = /firefox/i.test(ua);
    const isChrome = /chrome/i.test(ua) && !/edge/i.test(ua);
    
    let browser = 'Unknown';
    if (isChrome) browser = 'Chrome';
    else if (isFirefox) browser = 'Firefox';
    else if (isSafari) browser = 'Safari';
    
    return {
      isIOS,
      browser,
      userAgent: ua,
      hasWebRTC: !!window.RTCPeerConnection,
      hasWebSocket: !!window.WebSocket
    };
  }

  // Check WebRTC compatibility and return any issues
  function checkWebRTCCompatibility() {
    const issues = [];
    
    if (!window.RTCPeerConnection) {
      issues.push('WebRTC is not supported in this browser.');
      return { compatible: false, issues };
    }
    
    if (!window.WebSocket) {
      issues.push('WebSocket is not supported in this browser.');
      return { compatible: false, issues };
    }
    
    // Check if PeerJS library is loaded
    if (typeof Peer === 'undefined') {
      issues.push('PeerJS library failed to load. Please check your internet connection and try refreshing the page.');
      return { compatible: false, issues };
    }
    
    // Check for iOS-specific issues
    if (browserInfo.isIOS) {
      if (browserInfo.browser === 'Firefox') {
        issues.push('Firefox on iOS has limited WebRTC support. Safari is recommended for best experience.');
      }
      issues.push('iOS browsers may have connection stability issues due to platform limitations.');
    }
    
    return { 
      compatible: true, 
      issues,
      hasWarnings: issues.length > 0
    };
  }

  // Log debug information
  function logDebug(category, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${category}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  // Rate limiting check
  function isRateLimited() {
    const now = Date.now();
    messageTimes = messageTimes.filter(time => now - time < RATE_LIMIT.timeWindow);
    
    if (messageTimes.length >= RATE_LIMIT.maxMessages) {
      return true;
    }
    
    messageTimes.push(now);
    return false;
  }

  // Local storage management
  function saveUserData(userData) {
    if (userData.type === 'account') {
      localStorage.setItem('chat_user_email', userData.email);
      localStorage.setItem('chat_user_username', userData.username);
    }
  }

  function loadUserData() {
    const email = localStorage.getItem('chat_user_email');
    const username = localStorage.getItem('chat_user_username');
    
    if (email && username) {
      return { email, username, type: 'account' };
    }
    return null;
  }

  // Validate username
  function validateUsername(username) {
    if (!username || username.trim().length === 0) {
      return 'Username cannot be empty';
    }
    if (username.length < 2) {
      return 'Username must be at least 2 characters';
    }
    if (username.length > 20) {
      return 'Username must be 20 characters or less';
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return 'Username can only contain letters, numbers, hyphens, and underscores';
    }
    return null;
  }

  // Validate email
  function validateEmail(email) {
    if (!email || email.trim().length === 0) {
      return 'Email cannot be empty';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  // UI: Add message to chat
  function addMessage(message) {
    const messageEl = document.createElement('div');
    
    if (message.type === 'system') {
      messageEl.className = 'system-message';
      messageEl.textContent = message.content;
    } else {
      const isOwn = message.userId === currentUser.id;
      messageEl.className = isOwn ? 'message own' : 'message';
      
      const headerEl = document.createElement('div');
      headerEl.className = 'message-header';
      
      const userEl = document.createElement('span');
      userEl.className = 'message-user';
      userEl.textContent = escapeHtml(message.username);
      
      const timeEl = document.createElement('span');
      timeEl.className = 'message-time';
      timeEl.textContent = formatTime(new Date(message.timestamp));
      
      headerEl.appendChild(userEl);
      headerEl.appendChild(timeEl);
      
      const contentEl = document.createElement('div');
      contentEl.className = 'message-content';
      contentEl.textContent = escapeHtml(message.content);
      
      messageEl.appendChild(headerEl);
      messageEl.appendChild(contentEl);
    }
    
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    messageHistory.push(message);
    
    // Keep message history limited to last 50 messages to prevent memory issues
    if (messageHistory.length > 50) {
      messageHistory = messageHistory.slice(-50);
    }
  }

  // UI: Update connection status
  function updateConnectionStatus(connected, errorMessage = null) {
    isConnected = connected;
    statusIndicator.className = connected ? 'status-indicator' : 'status-indicator disconnected';
    messageInput.disabled = !connected;
    sendBtn.disabled = !connected;
    
    // Show error message if connection failed
    if (!connected && errorMessage) {
      showConnectionError(errorMessage);
    }
  }

  // UI: Show connection error in chat
  function showConnectionError(errorMessage) {
    const errorEl = document.createElement('div');
    errorEl.className = 'connection-error';
    errorEl.innerHTML = `
      <div class="error-header">⚠️ Connection Error</div>
      <div class="error-message">${escapeHtml(errorMessage)}</div>
      <div class="error-actions">
        <button class="retry-btn" onclick="location.reload()">Retry Connection</button>
      </div>
    `;
    messagesContainer.appendChild(errorEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // UI: Show browser compatibility warning
  function showCompatibilityWarning(issues) {
    const warningEl = document.createElement('div');
    warningEl.className = 'compatibility-warning';
    warningEl.innerHTML = `
      <div class="warning-header">⚠️ Browser Compatibility Notice</div>
      <div class="warning-content">
        ${issues.map(issue => `<div class="warning-item">• ${escapeHtml(issue)}</div>`).join('')}
      </div>
      <div class="warning-footer">
        For the best experience, we recommend using Chrome or Safari on desktop, or Safari on iOS devices.
      </div>
    `;
    messagesContainer.appendChild(warningEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Send message
  function sendMessage(content) {
    if (!content.trim() || !isConnected) return;
    
    if (isRateLimited()) {
      addMessage({
        type: 'system',
        content: 'Please slow down. You are sending messages too quickly.'
      });
      return;
    }

    const message = {
      type: 'message',
      id: generateId() + '-' + Date.now(), // Unique message ID
      userId: currentUser.id,
      username: currentUser.username,
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

    // Mark as seen to prevent re-displaying our own message
    seenMessages.add(message.id);

    // Add to local display
    addMessage(message);

    // Broadcast to all connections
    connections.forEach(conn => {
      if (conn.open) {
        conn.send(message);
      }
    });

    messageInput.value = '';
  }

  // Handle incoming connection
  function handleConnection(conn) {
    logDebug('CONNECTION', 'New connection established', { peer: conn.peer });
    connections.set(conn.peer, conn);

    conn.on('data', (data) => {
      logDebug('DATA', 'Received data from peer', { peer: conn.peer, type: data.type });
      
      if (data.type === 'message') {
        // Check for duplicate messages
        if (data.id && seenMessages.has(data.id)) {
          logDebug('DATA', 'Duplicate message detected, skipping', { messageId: data.id });
          return;
        }
        
        // Mark message as seen
        if (data.id) {
          seenMessages.add(data.id);
          
          // Limit seenMessages size to prevent memory issues (keep last 200)
          if (seenMessages.size > 200) {
            const messagesArray = Array.from(seenMessages);
            seenMessages = new Set(messagesArray.slice(-200));
          }
        }
        
        addMessage(data);
        
        // Relay to other connections (not sender)
        connections.forEach((otherConn, peerId) => {
          if (otherConn.open && peerId !== conn.peer) {
            otherConn.send(data);
          }
        });
      } else if (data.type === 'user_joined') {
        addMessage({
          type: 'system',
          content: `${data.username} joined the chat`
        });
      } else if (data.type === 'request_history') {
        // Send message history to new peer
        if (messageHistory.length > 0) {
          logDebug('HISTORY', 'Sending message history to peer', { peer: conn.peer, count: messageHistory.length });
          conn.send({
            type: 'history',
            messages: messageHistory.slice(-50) // Last 50 messages
          });
        }
      } else if (data.type === 'history') {
        // Receive message history
        if (data.messages && data.messages.length > 0) {
          logDebug('HISTORY', 'Received message history', { count: data.messages.length });
          messagesContainer.replaceChildren();
          data.messages.forEach(msg => addMessage(msg));
        }
      }
    });

    conn.on('close', () => {
      logDebug('CONNECTION', 'Connection closed', { peer: conn.peer });
      connections.delete(conn.peer);
    });

    conn.on('error', (err) => {
      logDebug('CONNECTION', 'Connection error', { peer: conn.peer, error: err });
      connections.delete(conn.peer);
    });
  }

  // Initialize peer connection
  function initPeer(userId) {
    return new Promise((resolve, reject) => {
      // Check if PeerJS is available
      if (typeof Peer === 'undefined') {
        const error = new Error('PeerJS library is not loaded. Cannot initialize peer connection.');
        logDebug('PEER', 'PeerJS library not found', { error: error.message });
        reject(error);
        return;
      }
      
      logDebug('PEER', 'Initializing peer connection', { userId, config: PEER_SERVER_CONFIG });
      logDebug('PEER', 'Connecting to signaling server...', { host: PEER_SERVER_CONFIG.host, port: PEER_SERVER_CONFIG.port });
      
      let connectionTimeout = null;
      
      // Set a timeout for the connection
      connectionTimeout = setTimeout(() => {
        logDebug('PEER', 'Connection timeout reached');
        if (peer && !peer.open) {
          const error = new Error('Connection timeout: Unable to connect to signaling server');
          reject(error);
        }
      }, CONNECTION_CONFIG.timeout);

      try {
        peer = new Peer(userId, PEER_SERVER_CONFIG);

        peer.on('open', (id) => {
          clearTimeout(connectionTimeout);
          logDebug('PEER', '✓ Peer connection opened successfully', { peerId: id });
          logDebug('PEER', '✓ Connected to signaling server', { server: PEER_SERVER_CONFIG.host });
          connectionRetries = 0; // Reset retry counter on success
          updateConnectionStatus(true);
          resolve(id);
        });

        peer.on('connection', (conn) => {
          logDebug('PEER', 'Incoming connection received', { from: conn.peer });
          handleConnection(conn);
        });

        peer.on('disconnected', () => {
          logDebug('PEER', '⚠ Peer disconnected from server');
          updateConnectionStatus(false, 'Disconnected from server. Attempting to reconnect...');
          
          // Attempt to reconnect
          if (peer && !peer.destroyed) {
            logDebug('PEER', 'Attempting to reconnect...');
            setTimeout(() => {
              peer.reconnect();
            }, CONNECTION_CONFIG.retryDelay);
          }
        });

        peer.on('error', (err) => {
          clearTimeout(connectionTimeout);
          logDebug('PEER', '✗ Peer error occurred', { error: err.type, message: err.message });
          
          let userMessage = 'Connection error occurred. ';
          
          switch (err.type) {
            case 'peer-unavailable':
              userMessage += 'The peer you are trying to connect to is not available.';
              // Don't show error in UI for peer-unavailable, it's expected
              return;
            case 'network':
              userMessage += 'Network error. Please check your internet connection.';
              break;
            case 'server-error':
              userMessage += 'Unable to connect to the signaling server. The server may be down.';
              break;
            case 'socket-error':
              userMessage += 'WebSocket connection failed. Please check your firewall settings.';
              break;
            case 'socket-closed':
              userMessage += 'Connection to server was closed unexpectedly.';
              break;
            case 'unavailable-id':
              userMessage += 'This ID is already in use. Please try again.';
              break;
            case 'ssl-unavailable':
              userMessage += 'Secure connection unavailable. Please check if your browser supports SSL.';
              break;
            case 'webrtc':
              userMessage += 'WebRTC error. Your browser may not fully support this feature.';
              break;
            default:
              userMessage += `${err.message || 'Unknown error'}`;
          }
          
          updateConnectionStatus(false, userMessage);
          reject(err);
        });
      } catch (err) {
        clearTimeout(connectionTimeout);
        logDebug('PEER', '✗ Failed to create peer instance', { error: err.message });
        reject(err);
      }
    });
  }

  // Connect to other peers (simplified mesh network)
  async function connectToRoom() {
    logDebug('ROOM', 'Attempting to connect to room');
    
    // In a production app, you would have a signaling server
    // For this demo, we'll use localStorage to share peer IDs
    const roomPeers = JSON.parse(localStorage.getItem('chat_room_peers') || '[]');
    
    logDebug('ROOM', 'Found peers in room', { count: roomPeers.length, peers: roomPeers });
    
    // Add our peer ID to the room
    if (!roomPeers.includes(peer.id)) {
      roomPeers.push(peer.id);
      localStorage.setItem('chat_room_peers', JSON.stringify(roomPeers));
      logDebug('ROOM', 'Added self to room peer list');
    }

    // Clean up old peer IDs (keep last 10)
    if (roomPeers.length > 10) {
      roomPeers.splice(0, roomPeers.length - 10);
      localStorage.setItem('chat_room_peers', JSON.stringify(roomPeers));
      logDebug('ROOM', 'Cleaned up old peer IDs');
    }

    // Connect to other peers
    for (const peerId of roomPeers) {
      if (peerId !== peer.id && !connections.has(peerId)) {
        try {
          logDebug('ROOM', 'Connecting to peer', { peerId });
          const conn = peer.connect(peerId, { reliable: true });
          
          conn.on('open', () => {
            logDebug('ROOM', 'Successfully connected to peer', { peerId });
            connections.set(peerId, conn);
            
            // Send join notification
            conn.send({
              type: 'user_joined',
              username: currentUser.username
            });

            // Request message history
            conn.send({
              type: 'request_history'
            });
          });

          conn.on('data', (data) => {
            if (data.type === 'message') {
              // Check for duplicate messages
              if (data.id && seenMessages.has(data.id)) {
                logDebug('DATA', 'Duplicate message detected, skipping', { messageId: data.id });
                return;
              }
              
              // Mark message as seen
              if (data.id) {
                seenMessages.add(data.id);
                
                // Limit seenMessages size to prevent memory issues (keep last 200)
                if (seenMessages.size > 200) {
                  const messagesArray = Array.from(seenMessages);
                  seenMessages = new Set(messagesArray.slice(-200));
                }
              }
              
              addMessage(data);
              
              // Relay message to other connections (mesh network propagation)
              connections.forEach((otherConn, peerId) => {
                if (otherConn.open && peerId !== conn.peer) {
                  otherConn.send(data);
                }
              });
            } else if (data.type === 'user_joined') {
              addMessage({
                type: 'system',
                content: `${data.username} joined the chat`
              });
            } else if (data.type === 'request_history') {
              if (messageHistory.length > 0) {
                conn.send({
                  type: 'history',
                  messages: messageHistory.slice(-50)
                });
              }
            } else if (data.type === 'history') {
              if (data.messages && data.messages.length > 0) {
                messagesContainer.replaceChildren();
                data.messages.forEach(msg => addMessage(msg));
              }
            }
          });

          conn.on('close', () => {
            logDebug('ROOM', 'Peer connection closed', { peerId });
            connections.delete(peerId);
          });

          conn.on('error', (err) => {
            logDebug('ROOM', 'Peer connection error', { peerId, error: err });
            connections.delete(peerId);
          });
        } catch (err) {
          logDebug('ROOM', 'Failed to connect to peer', { peerId, error: err.message });
        }
      }
    }
  }

  // Join chat room
  async function joinChat(userData) {
    try {
      logDebug('JOIN', 'Attempting to join chat', { username: userData.username, type: userData.type });
      
      currentUser = {
        id: generateId(),
        ...userData
      };

      saveUserData(userData);

      // Initialize peer connection with retry logic and exponential backoff
      let lastError = null;
      for (let attempt = 1; attempt <= CONNECTION_CONFIG.maxRetries; attempt++) {
        try {
          logDebug('JOIN', `Connection attempt ${attempt} of ${CONNECTION_CONFIG.maxRetries}`, { attempt, maxRetries: CONNECTION_CONFIG.maxRetries });
          
          // Show connecting message
          if (attempt === 1) {
            addMessage({
              type: 'system',
              content: 'Connecting to signaling server...'
            });
          }
          
          await initPeer(currentUser.id);
          
          // Success - clear any retry messages
          logDebug('JOIN', '✓ Successfully connected to peer network');
          break; // Success, exit retry loop
        } catch (err) {
          lastError = err;
          connectionRetries = attempt;
          
          if (attempt < CONNECTION_CONFIG.maxRetries) {
            // Calculate delay with exponential backoff
            const delay = Math.min(
              CONNECTION_CONFIG.retryDelay * Math.pow(CONNECTION_CONFIG.backoffMultiplier, attempt),
              CONNECTION_CONFIG.maxRetryDelay
            );
            
            logDebug('JOIN', `Connection attempt ${attempt} failed, retrying in ${delay}ms...`, { 
              error: err.message, 
              attempt, 
              delay 
            });
            
            addMessage({
              type: 'system',
              content: `Connection attempt ${attempt} failed. Retrying in ${(delay / 1000).toFixed(1)} seconds... (${attempt}/${CONNECTION_CONFIG.maxRetries})`
            });
            
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            logDebug('JOIN', '✗ All connection attempts failed', { error: err.message, totalAttempts: attempt });
            throw err; // All retries exhausted
          }
        }
      }

      // Connect to room
      await connectToRoom();

      // Update UI
      userDisplay.textContent = `${currentUser.username}${currentUser.type === 'guest' ? ' (Guest)' : ''}`;
      joinModal.style.display = 'none';

      // Show compatibility warnings if any
      const compatibility = checkWebRTCCompatibility();
      if (compatibility.hasWarnings) {
        showCompatibilityWarning(compatibility.issues);
      }

      addMessage({
        type: 'system',
        content: `Welcome, ${currentUser.username}! You are now connected to the chat room.`
      });

      // Broadcast to other peers
      connections.forEach(conn => {
        if (conn.open) {
          conn.send({
            type: 'user_joined',
            username: currentUser.username
          });
        }
      });

    } catch (err) {
      logDebug('JOIN', '✗ Failed to join chat', { error: err.message });
      
      let errorMessage = 'Failed to connect to chat room. ';
      
      if (err.message && err.message.includes('PeerJS library')) {
        errorMessage += 'The PeerJS library failed to load. This is required for the chat feature. ';
        errorMessage += '\n\nPlease check:\n';
        errorMessage += '• Your internet connection is working\n';
        errorMessage += '• No browser extensions are blocking scripts\n';
        errorMessage += '• Try refreshing the page (Ctrl+F5 or Cmd+Shift+R)\n';
      } else if (err.message && err.message.includes('timeout')) {
        errorMessage += 'The connection timed out. This may be due to network issues or the signaling server being unavailable. ';
      } else if (err.type === 'network') {
        errorMessage += 'Network error detected. Please check your internet connection. ';
      } else if (err.type === 'server-error') {
        errorMessage += 'The signaling server is unavailable. Please try again later. ';
      } else {
        errorMessage += err.message || 'Unknown error occurred. ';
      }
      
      if (browserInfo.isIOS) {
        if (browserInfo.browser !== 'Safari') {
          errorMessage += `\n\nNote: You are using ${browserInfo.browser} on iOS. For better WebRTC support, try using Safari instead.`;
        } else {
          errorMessage += '\n\nNote: You are using iOS. WebRTC connections on iOS may have stability issues due to platform limitations.';
        }
      }
      
      errorMessage += '\n\nTroubleshooting tips:\n';
      errorMessage += '• Check your internet connection\n';
      errorMessage += '• Disable any VPN or firewall that might block WebRTC\n';
      errorMessage += '• Try using a different browser (Chrome, Firefox, or Safari)\n';
      errorMessage += '• Clear your browser cache and reload the page';
      
      alert(errorMessage);
    }
  }

  // Event Listeners
  guestModeBtn.addEventListener('click', () => {
    guestModeBtn.classList.add('active');
    accountModeBtn.classList.remove('active');
    guestForm.style.display = 'block';
    accountForm.style.display = 'none';
  });

  accountModeBtn.addEventListener('click', () => {
    accountModeBtn.classList.add('active');
    guestModeBtn.classList.remove('active');
    accountForm.style.display = 'block';
    guestForm.style.display = 'none';
  });

  joinBtn.addEventListener('click', () => {
    const isGuestMode = guestModeBtn.classList.contains('active');
    
    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');

    if (isGuestMode) {
      const guestName = document.getElementById('guest-name').value.trim();
      const error = validateUsername(guestName);
      
      if (error) {
        const errorEl = document.getElementById('guest-error');
        errorEl.textContent = error;
        errorEl.style.display = 'block';
        return;
      }

      joinChat({
        username: guestName,
        type: 'guest'
      });
    } else {
      const email = document.getElementById('account-email').value.trim();
      const username = document.getElementById('account-username').value.trim();
      
      const emailError = validateEmail(email);
      const usernameError = validateUsername(username);
      
      if (emailError) {
        const errorEl = document.getElementById('email-error');
        errorEl.textContent = emailError;
        errorEl.style.display = 'block';
      }
      
      if (usernameError) {
        const errorEl = document.getElementById('username-error');
        errorEl.textContent = usernameError;
        errorEl.style.display = 'block';
      }
      
      if (emailError || usernameError) return;

      joinChat({
        email,
        username,
        type: 'account'
      });
    }
  });

  sendBtn.addEventListener('click', () => {
    sendMessage(messageInput.value);
  });

  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(messageInput.value);
    }
  });

  // Auto-login if user data exists
  window.addEventListener('DOMContentLoaded', () => {
    // Initialize browser detection
    browserInfo = detectBrowser();
    logDebug('BROWSER', 'Browser detected', browserInfo);
    
    // Check if PeerJS library loaded
    if (typeof Peer === 'undefined') {
      logDebug('PEERJS', '✗ PeerJS library not loaded on DOMContentLoaded');
      console.info('[PEERJS] Waiting for library to load (delay: ' + CONNECTION_CONFIG.libraryLoadDelay + 'ms)...');
      
      // Give it a moment in case it's still loading
      setTimeout(() => {
        if (typeof Peer === 'undefined') {
          console.error('[PEERJS] ✗ PeerJS library still not available after delay');
          console.error('[PEERJS] Deployment verification FAILED');
          console.error('[PEERJS] Possible issues:');
          console.error('[PEERJS]   • libs/peerjs.min.js is placeholder file (not actual library)');
          console.error('[PEERJS]   • All CDN sources blocked or unreachable');
          console.error('[PEERJS]   • Local fallback failed to load or not deployed');
          showPeerJSLoadError();
        } else {
          logDebug('PEERJS', '✓ PeerJS library loaded after delay');
          console.info('[PEERJS] Library loaded successfully via fallback mechanism');
          initializeChat();
        }
      }, CONNECTION_CONFIG.libraryLoadDelay);
      return;
    }
    
    logDebug('PEERJS', '✓ PeerJS library loaded successfully on DOMContentLoaded');
    console.info('[PEERJS] Deployment verification PASSED');
    console.info('[PEERJS] Library source: Primary CDN (unpkg.com) or loaded before DOMContentLoaded');
    initializeChat();
  });
  
  // Function to show PeerJS load error
  window.showPeerJSLoadError = function() {
    logDebug('PEERJS', '✗ PeerJS library failed to load from all sources');
    
    joinModal.querySelector('h2').textContent = 'Library Load Error';
    joinModal.querySelector('.mode-buttons').style.display = 'none';
    joinModal.querySelector('#guest-form').innerHTML = `
      <div style="color: var(--red); margin: 20px 0;">
        <p><strong>❌ Failed to load required libraries for the chat room.</strong></p>
        <p style="margin-top: 10px;">The PeerJS library could not be loaded from any source:</p>
        <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.95rem;">
          <li>❌ Primary CDN (unpkg.com) - Failed or blocked</li>
          <li>❌ Secondary CDN (jsdelivr.net) - Failed or blocked</li>
          <li>❌ Local fallback (libs/peerjs.min.js) - Failed, not found (404), or placeholder file detected</li>
        </ul>
        
        <div style="margin: 15px 0; padding: 12px; background: rgba(255,152,0,0.1); border: 1px solid rgba(255,152,0,0.3); border-radius: 8px;">
          <p style="font-weight: 600; color: #f57c00; margin-bottom: 8px;">⚠️ Deployment Issue Detected</p>
          <p style="font-size: 0.9rem; margin: 0;">
            The local fallback file appears to be a placeholder (not the actual PeerJS library). 
            This means the site was deployed without the actual library file.
          </p>
        </div>
        
        <details style="margin: 15px 0; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 8px;">
          <summary style="cursor: pointer; font-weight: bold;">🔍 Common Causes</summary>
          <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.9rem;">
            <li><strong>Network connectivity issues</strong> - No internet or unstable connection</li>
            <li><strong>Browser extensions</strong> - Ad blockers, privacy tools, or script blockers</li>
            <li><strong>Firewall restrictions</strong> - Corporate/institutional networks blocking CDNs</li>
            <li><strong>CDN service outages</strong> - Temporary unavailability of CDN providers</li>
            <li><strong>Local fallback missing</strong> - Placeholder file not replaced with actual library</li>
            <li><strong>CORS policy issues</strong> - Server not configured to serve the library file</li>
            <li><strong>Deployment error</strong> - Local file not included in deployment</li>
          </ul>
        </details>
        
        <details style="margin: 15px 0; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 8px;">
          <summary style="cursor: pointer; font-weight: bold;">🔧 User Troubleshooting Steps</summary>
          <ol style="margin: 10px 0; padding-left: 20px; font-size: 0.9rem;">
            <li>Verify internet connection by visiting other websites</li>
            <li>Disable ad blockers and privacy extensions temporarily</li>
            <li>Check if CDN domains are accessible:
              <ul style="margin: 5px 0; padding-left: 20px;">
                <li>Try visiting <a href="https://unpkg.com/" target="_blank" style="color: var(--red);">unpkg.com</a></li>
                <li>Try visiting <a href="https://cdn.jsdelivr.net/" target="_blank" style="color: var(--red);">jsdelivr.net</a></li>
              </ul>
            </li>
            <li>If on corporate/institutional network:
              <ul style="margin: 5px 0; padding-left: 20px;">
                <li>Contact IT about WebRTC and external script access</li>
                <li>Request unblocking of unpkg.com and cdn.jsdelivr.net</li>
              </ul>
            </li>
            <li>Try different network (mobile hotspot) to rule out restrictions</li>
            <li>Disable VPN temporarily to test connectivity</li>
            <li>Clear browser cache: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)</li>
            <li>Try different browser (Chrome, Firefox, Safari, Edge)</li>
            <li>Open browser console (F12) for detailed error messages</li>
          </ol>
        </details>
        
        <details open style="margin: 15px 0; padding: 10px; background: rgba(139,31,31,0.05); border: 1px solid rgba(139,31,31,0.2); border-radius: 8px;">
          <summary style="cursor: pointer; font-weight: bold;">⚙️ Site Administrator Actions</summary>
          <div style="font-size: 0.9rem; margin-top: 10px;">
            <p><strong>The local fallback is missing or not properly configured.</strong></p>
            <p style="margin-top: 10px;">To fix this issue:</p>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li>Download the actual PeerJS library (two options):
                <div style="margin-top: 5px;">
                  <strong>Option 1 - Using the download script:</strong>
                  <pre style="background: #f5f5f5; padding: 8px; border-radius: 4px; margin: 5px 0; overflow-x: auto; font-size: 0.85rem;">bash scripts/download-peerjs.sh</pre>
                  <strong>Option 2 - Using npm:</strong>
                  <pre style="background: #f5f5f5; padding: 8px; border-radius: 4px; margin: 5px 0; overflow-x: auto; font-size: 0.85rem;">npm install peerjs@1.5.2
cp node_modules/peerjs/dist/peerjs.min.js libs/peerjs.min.js</pre>
                </div>
              </li>
              <li>Verify the file size is ~80-100 KB (not 1 KB placeholder):
                <pre style="background: #f5f5f5; padding: 8px; border-radius: 4px; margin: 5px 0; overflow-x: auto; font-size: 0.85rem;">ls -lh libs/peerjs.min.js</pre>
              </li>
              <li>Verify file content starts with minified JavaScript:
                <pre style="background: #f5f5f5; padding: 8px; border-radius: 4px; margin: 5px 0; overflow-x: auto; font-size: 0.85rem;">head -c 50 libs/peerjs.min.js</pre>
                Should start with: <code style="background: #e8e8e8; padding: 2px 4px; border-radius: 2px; font-size: 0.8rem;">(()=>{function</code>
              </li>
              <li>Commit and deploy the updated libs/peerjs.min.js file</li>
              <li>Test deployment by checking browser console logs</li>
              <li>Verify the file is accessible at: <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px;">https://yoursite.com/libs/peerjs.min.js</code></li>
            </ol>
            <p style="margin-top: 10px;">
              📖 See <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px;">libs/README.md</code> 
              and <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px;">CHAT_FEATURE.md</code> for detailed instructions.
            </p>
          </div>
        </details>
        
        <p style="margin-top: 15px; font-size: 0.85rem; color: var(--muted); font-style: italic;">
          💡 Tip: Open browser console (F12) to see detailed loading status and specific error messages.
        </p>
      </div>
    `;
    joinModal.querySelector('#account-form').style.display = 'none';
    joinBtn.style.display = 'none';
  };
  
  // Initialize chat after checks pass
  function initializeChat() {
    // Check WebRTC compatibility
    const compatibility = checkWebRTCCompatibility();
    logDebug('COMPATIBILITY', 'WebRTC compatibility check', compatibility);
    
    // Show compatibility issues in modal if browser is not compatible
    if (!compatibility.compatible) {
      joinModal.querySelector('h2').textContent = '⚠️ Browser Not Supported';
      joinModal.querySelector('.mode-buttons').style.display = 'none';
      joinModal.querySelector('#guest-form').innerHTML = `
        <div style="color: var(--red); margin: 20px 0;">
          <p><strong>❌ Your browser does not support the required features for this chat room.</strong></p>
          <p style="margin-top: 10px;"><strong>Issues detected:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${compatibility.issues.map(issue => `<li>${escapeHtml(issue)}</li>`).join('')}
          </ul>
          <p style="margin-top: 15px;"><strong>🌐 Please use a modern browser that supports WebRTC:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li><strong>Desktop:</strong> Chrome (recommended), Firefox, Safari, or Edge</li>
            <li><strong>iOS:</strong> Safari (recommended) - avoid Firefox on iOS</li>
            <li><strong>Android:</strong> Chrome (recommended) or Firefox</li>
          </ul>
          <p style="margin-top: 15px;">
            <strong>📖 Learn more:</strong><br>
            <a href="https://caniuse.com/rtcpeerconnection" target="_blank" rel="noopener noreferrer" style="color: var(--red);">
              Check WebRTC browser compatibility →
            </a>
          </p>
          <p style="margin-top: 10px; font-size: 0.9rem; color: var(--muted);">
            Current browser: ${escapeHtml(browserInfo.browser)}<br>
            WebRTC Support: ${browserInfo.hasWebRTC ? '✓ Available' : '✗ Not Available'}<br>
            WebSocket Support: ${browserInfo.hasWebSocket ? '✓ Available' : '✗ Not Available'}
          </p>
        </div>
      `;
      joinModal.querySelector('#account-form').style.display = 'none';
      joinBtn.style.display = 'none';
      return;
    }
    
    // Show warnings for compatible but problematic browsers
    if (compatibility.hasWarnings) {
      const warningDiv = document.createElement('div');
      warningDiv.innerHTML = `
        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 15px 0; font-size: 0.9rem;">
          <strong>⚠️ Compatibility Notice</strong>
          <ul style="margin: 10px 0 0 20px; padding: 0;">
            ${compatibility.issues.map(issue => `<li>${escapeHtml(issue)}</li>`).join('')}
          </ul>
          <p style="margin: 10px 0 0 0; font-size: 0.85rem;">
            For best results, use Safari on iOS or Chrome/Firefox on desktop.
          </p>
        </div>
      `;
      joinModal.querySelector('.mode-buttons').insertAdjacentElement('beforebegin', warningDiv);
    }
    
    // Auto-login if user data exists
    const savedUser = loadUserData();
    if (savedUser) {
      document.getElementById('account-email').value = savedUser.email;
      document.getElementById('account-username').value = savedUser.username;
      accountModeBtn.click();
    }
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (peer && !peer.destroyed) {
      // Notify others that we're leaving
      connections.forEach(conn => {
        if (conn.open) {
          conn.send({
            type: 'system',
            content: `${currentUser?.username || 'A user'} left the chat`
          });
        }
      });
      
      peer.destroy();
    }
  });
})();
