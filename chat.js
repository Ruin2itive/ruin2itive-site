/**
 * Chat Room Application
 * Real-time chat with WebRTC via PeerJS for GitHub Pages compatibility
 */

(function() {
  'use strict';

  // Configuration
  const PEER_SERVER_CONFIG = {
    host: 'peerjs-server.herokuapp.com',
    port: 443,
    path: '/',
    secure: true,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    }
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
  function updateConnectionStatus(connected) {
    isConnected = connected;
    statusIndicator.className = connected ? 'status-indicator' : 'status-indicator disconnected';
    messageInput.disabled = !connected;
    sendBtn.disabled = !connected;
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
      userId: currentUser.id,
      username: currentUser.username,
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

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
    console.log('New connection:', conn.peer);
    connections.set(conn.peer, conn);

    conn.on('data', (data) => {
      console.log('Received:', data);
      
      if (data.type === 'message') {
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
          conn.send({
            type: 'history',
            messages: messageHistory.slice(-50) // Last 50 messages
          });
        }
      } else if (data.type === 'history') {
        // Receive message history
        if (data.messages && data.messages.length > 0) {
          messagesContainer.replaceChildren();
          data.messages.forEach(msg => addMessage(msg));
        }
      }
    });

    conn.on('close', () => {
      console.log('Connection closed:', conn.peer);
      connections.delete(conn.peer);
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
      connections.delete(conn.peer);
    });
  }

  // Initialize peer connection
  function initPeer(userId) {
    return new Promise((resolve, reject) => {
      peer = new Peer(userId, PEER_SERVER_CONFIG);

      peer.on('open', (id) => {
        console.log('Peer ID:', id);
        updateConnectionStatus(true);
        resolve(id);
      });

      peer.on('connection', handleConnection);

      peer.on('disconnected', () => {
        console.log('Peer disconnected');
        updateConnectionStatus(false);
        // Attempt to reconnect
        if (peer && !peer.destroyed) {
          peer.reconnect();
        }
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        updateConnectionStatus(false);
        reject(err);
      });
    });
  }

  // Connect to other peers (simplified mesh network)
  async function connectToRoom() {
    // In a production app, you would have a signaling server
    // For this demo, we'll use localStorage to share peer IDs
    const roomPeers = JSON.parse(localStorage.getItem('chat_room_peers') || '[]');
    
    // Add our peer ID to the room
    if (!roomPeers.includes(peer.id)) {
      roomPeers.push(peer.id);
      localStorage.setItem('chat_room_peers', JSON.stringify(roomPeers));
    }

    // Clean up old peer IDs (keep last 10)
    if (roomPeers.length > 10) {
      roomPeers.splice(0, roomPeers.length - 10);
      localStorage.setItem('chat_room_peers', JSON.stringify(roomPeers));
    }

    // Connect to other peers
    for (const peerId of roomPeers) {
      if (peerId !== peer.id && !connections.has(peerId)) {
        try {
          const conn = peer.connect(peerId, { reliable: true });
          
          conn.on('open', () => {
            console.log('Connected to:', peerId);
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
              addMessage(data);
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
            connections.delete(peerId);
          });

          conn.on('error', (err) => {
            console.error('Connection error:', err);
            connections.delete(peerId);
          });
        } catch (err) {
          console.error('Failed to connect to peer:', peerId, err);
        }
      }
    }
  }

  // Join chat room
  async function joinChat(userData) {
    try {
      currentUser = {
        id: generateId(),
        ...userData
      };

      saveUserData(userData);

      // Initialize peer connection
      await initPeer(currentUser.id);

      // Connect to room
      await connectToRoom();

      // Update UI
      userDisplay.textContent = `${currentUser.username}${currentUser.type === 'guest' ? ' (Guest)' : ''}`;
      joinModal.style.display = 'none';

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
      console.error('Failed to join chat:', err);
      alert('Failed to connect to chat room. Please try again.');
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
    const savedUser = loadUserData();
    if (savedUser) {
      document.getElementById('account-email').value = savedUser.email;
      document.getElementById('account-username').value = savedUser.username;
      accountModeBtn.click();
    }
  });

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

  // Check for WebSocket support
  if (!window.RTCPeerConnection) {
    joinModal.querySelector('h2').textContent = 'Browser Not Supported';
    joinModal.querySelector('.mode-buttons').style.display = 'none';
    joinModal.querySelector('#guest-form').innerHTML = '<p style="color: var(--muted);">Your browser does not support WebRTC, which is required for the chat feature. Please use a modern browser like Chrome, Firefox, Safari, or Edge.</p>';
    joinModal.querySelector('#account-form').style.display = 'none';
    joinBtn.style.display = 'none';
  }
})();
