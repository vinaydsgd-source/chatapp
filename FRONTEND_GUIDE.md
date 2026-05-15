# Chat Application — Frontend Integration Guide

**Base URL:** `http://192.168.10.113:5000`  
**Swagger UI (try it out):** `http://192.168.10.113:5000/api/docs`  
**Socket Events Docs:** `http://192.168.10.113:5000/api/socket-docs`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User](#2-user)
3. [Chats](#3-chats)
4. [Messages](#4-messages)
5. [File Upload](#5-file-upload)
6. [Socket.io Events](#6-socketio-events)
7. [Complete Frontend Flow](#7-complete-frontend-flow)

---

## 1. Authentication

All auth endpoints are **public** (no token required).  
After login/signup the server sets a `refreshToken` **httpOnly cookie** automatically.

---

### `POST /api/auth/signup`

Register a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response `201`:**
```json
{
  "message": "Account created successfully",
  "accessToken": "eyJhbGci...",
  "user": {
    "id": "clx1abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": ""
  }
}
```

---

### `POST /api/auth/login`

**Request:**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response `200`:**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGci...",
  "user": {
    "id": "clx1abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": ""
  }
}
```

> **Store `accessToken` in memory (not localStorage).** It expires in 15 minutes — use `/refresh-token` to renew it silently.

---

### `POST /api/auth/logout`

No body required. Clears the refresh token cookie.

**Response `200`:**
```json
{ "message": "Logged out successfully" }
```

---

### `POST /api/auth/refresh-token`

Call this when the access token expires (`401` response on any protected endpoint).  
Uses the `refreshToken` cookie automatically — no body needed.

**Response `200`:**
```json
{ "accessToken": "eyJhbGci..." }
```

---

### `POST /api/auth/forgot-password`

**Request:**
```json
{ "email": "john@example.com" }
```

**Response `200`:**
```json
{
  "message": "Password reset token generated.",
  "resetToken": "a3f9...",
  "resetUrl": "http://localhost:3000/reset-password?token=a3f9...",
  "expiresIn": "1 hour"
}
```

> In production the token will be sent via email. Use `resetToken` to call the next endpoint.

---

### `POST /api/auth/reset-password`

**Request:**
```json
{
  "token": "a3f9...",
  "newPassword": "newSecret123"
}
```

**Response `200`:**
```json
{ "message": "Password reset successful. Please login with your new password." }
```

---

## 2. User

All user endpoints require `Authorization: Bearer <accessToken>` header.

---

### `GET /api/users/profile`

Get the logged-in user's own profile.

**Response `200`:**
```json
{
  "user": {
    "id": "clx1abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://res.cloudinary.com/...",
    "isOnline": true,
    "lastSeen": "2026-05-15T07:00:00Z",
    "createdAt": "2026-05-01T10:00:00Z"
  }
}
```

---

### `PUT /api/users/profile`

Update name or avatar URL.

**Request:**
```json
{
  "name": "John Updated",
  "avatar": "https://res.cloudinary.com/..."
}
```

**Response `200`:**
```json
{ "user": { ...updated user object... } }
```

> **Flow:** Upload image via `POST /api/upload` first → get `url` → pass that `url` as `avatar` here.

---

### `GET /api/users/search?q=john`

Search users by name or email to start a new chat with them.

**Response `200`:**
```json
{
  "users": [
    {
      "id": "clx1abc123",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "",
      "isOnline": false,
      "lastSeen": "2026-05-15T07:00:00Z"
    }
  ]
}
```

---

## 3. Chats

All chat endpoints require `Authorization: Bearer <accessToken>` header.

---

### `GET /api/chats` ← **Call this right after login**

Returns all conversations (1-1 and groups) for the logged-in user, sorted by latest activity.

**Response `200`:**
```json
{
  "chats": [
    {
      "id": "clx2chat456",
      "isGroupChat": false,
      "chatWith": {
        "id": "clx1abc123",
        "name": "Jane Doe",
        "avatar": "https://...",
        "isOnline": true,
        "lastSeen": "2026-05-15T07:00:00Z"
      },
      "latestMessage": {
        "content": "Hey!",
        "type": "TEXT",
        "sender": { "name": "Jane Doe", "avatar": "https://..." },
        "createdAt": "2026-05-15T07:22:00Z"
      },
      "unreadCount": 3,
      "members": [ ...all members... ],
      "groupName": null,
      "groupAdmin": null,
      "updatedAt": "2026-05-15T07:22:00Z"
    },
    {
      "id": "clx2grp789",
      "isGroupChat": true,
      "groupName": "Team Alpha",
      "groupAdmin": { "id": "...", "name": "..." },
      "chatWith": null,
      "unreadCount": 0,
      "members": [ ...all members... ],
      "latestMessage": { ... }
    }
  ]
}
```

**Key fields:**
| Field | Description |
|-------|-------------|
| `chatWith` | Other user's profile — only for 1-1 chats, `null` for groups |
| `unreadCount` | Badge number to show on chat list |
| `latestMessage` | Message preview for the sidebar |
| `isGroupChat` | `false` = 1-1 chat, `true` = group |

---

### `POST /api/chats`

Start a 1-1 chat with someone (or fetch existing one).

**Request:**
```json
{ "userId": "clx1abc123" }
```

**Response `200`:**
```json
{ "chat": { ...chat object... } }
```

---

### `POST /api/chats/group`

Create a group chat.

**Request:**
```json
{
  "groupName": "Team Alpha",
  "members": ["userId1", "userId2"]
}
```
> You (the logged-in user) are added as admin automatically. Minimum 2 other members required.

**Response `201`:**
```json
{ "chat": { ...group chat object... } }
```

---

### `PUT /api/chats/group/add`

Add a member to a group (admin only).

**Request:**
```json
{ "chatId": "clx2grp789", "userId": "clx1abc123" }
```

**Response `200`:**
```json
{ "chat": { ...updated group chat... } }
```

---

### `PUT /api/chats/group/remove`

Remove a member from a group (admin only).

**Request:**
```json
{ "chatId": "clx2grp789", "userId": "clx1abc123" }
```

**Response `200`:**
```json
{ "chat": { ...updated group chat... } }
```

---

## 4. Messages

All message endpoints require `Authorization: Bearer <accessToken>` header.

---

### `GET /api/messages/:chatId` ← **Call this when user opens/clicks a chat**

Returns paginated messages (latest 50 first). Also **auto-marks all unread messages as read** and emits `read_receipt` socket event.

**First load:**
```
GET /api/messages/clx2chat456
```

**Load older messages (infinite scroll up):**
```
GET /api/messages/clx2chat456?cursor=clx3msg001&limit=50
```

**Response `200`:**
```json
{
  "messages": [
    {
      "id": "clx3msg789",
      "chatId": "clx2chat456",
      "sender": { "id": "clx1abc123", "name": "Jane", "avatar": "https://..." },
      "content": "Hello!",
      "type": "TEXT",
      "fileUrl": "",
      "fileName": "",
      "readBy": [{ "userId": "clx1abc123" }],
      "createdAt": "2026-05-15T07:20:00Z"
    }
  ],
  "hasMore": true,
  "nextCursor": "clx3msg001"
}
```

**Pagination logic:**
```js
let cursor = null;

async function loadOlderMessages() {
  if (!hasMore) return;
  const res = await fetch(`/api/messages/${chatId}?cursor=${cursor}`);
  const data = await res.json();
  cursor = data.nextCursor;
  hasMore = data.hasMore;
  prependMessages(data.messages); // add above current messages
}
```

**Message types:**
| `type` | Description |
|--------|-------------|
| `TEXT` | Plain text message |
| `IMAGE` | Image file — use `fileUrl` to display |
| `FILE` | PDF/DOC/TXT — use `fileUrl` as download link, `fileName` as label |

---

### `POST /api/messages`

Send a message (text, image, or file). Uses `multipart/form-data`.

**Text message:**
```js
const formData = new FormData();
formData.append('chatId', 'clx2chat456');
formData.append('content', 'Hello!');
```

**File/image message:**
```js
const formData = new FormData();
formData.append('chatId', 'clx2chat456');
formData.append('content', 'Check this out'); // optional caption
formData.append('file', fileInput.files[0]);
```

**Response `201`:**
```json
{
  "message": {
    "id": "clx3msg789",
    "chatId": "clx2chat456",
    "sender": { "id": "...", "name": "John", "avatar": "..." },
    "content": "Hello!",
    "type": "TEXT",
    "fileUrl": "",
    "fileName": "",
    "readBy": [{ "userId": "clx1abc123" }],
    "createdAt": "2026-05-15T07:22:00Z"
  }
}
```

> The message is also emitted to all chat room members via `message_received` socket event.

---

### `PUT /api/messages/read/:chatId`

Manually mark all messages in a chat as read. Emits `read_receipt` socket event.

> **Note:** You usually don't need to call this manually — `GET /api/messages/:chatId` does it automatically on open.

**Response `200`:**
```json
{ "message": "Messages marked as read" }
```

---

## 5. File Upload

Use this to upload any file (image, PDF, DOC, TXT) to Cloudinary and get back a URL.

**Common use cases:**
- Upload profile photo → get `url` → pass to `PUT /api/users/profile`
- Upload a file to share in chat → get `url` → pass as `file` field in `POST /api/messages`

---

### `POST /api/upload`

Requires `Authorization: Bearer <accessToken>`. Send as `multipart/form-data`.

```js
const formData = new FormData();
formData.append('file', fileInput.files[0]); // field name must be "file"

const res = await fetch('/api/upload', {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
  body: formData,
});
const { upload } = await res.json();
// upload.url — use this anywhere
```

**Response `201`:**
```json
{
  "message": "File uploaded successfully",
  "upload": {
    "id": "cmp6lag4p0005",
    "url": "https://res.cloudinary.com/diuwgxbe4/...",
    "publicId": "chat-app/uploads/abc123",
    "format": "jpg",
    "bytes": 204800,
    "createdAt": "2026-05-15T07:22:04Z"
  }
}
```

**Allowed types:** JPEG, PNG, GIF, WEBP, PDF, DOC, DOCX, TXT — max **10 MB**

---

### `GET /api/upload/my`

List all files uploaded by the logged-in user.

**Response `200`:**
```json
{
  "uploads": [ ...array of upload objects... ]
}
```

---

## 6. Socket.io Events

Connect using the **access token** obtained from login.

```js
import { io } from 'socket.io-client';

const socket = io('http://192.168.10.113:5000', {
  auth: { token: accessToken },
  transports: ['websocket'],
});

socket.on('connect', () => console.log('Connected:', socket.id));
socket.on('connect_error', (err) => console.error('Auth failed:', err.message));
```

---

### Client → Server (aap emit karo)

| Event | Payload | Kab call karo |
|-------|---------|--------------|
| `join_chat` | `chatId: string` | Chat open karte waqt |
| `leave_chat` | `chatId: string` | Chat band karte waqt |
| `typing` | `chatId: string` | User type kar raha ho (debounce lagao) |
| `stop_typing` | `chatId: string` | User ne type karna band kiya |
| `mark_read` | `{ chatId: string }` | User ne messages dekhe |

```js
socket.emit('join_chat', chatId);
socket.emit('typing', chatId);
socket.emit('stop_typing', chatId);
socket.emit('mark_read', { chatId });
socket.emit('leave_chat', chatId);
```

---

### Server → Client (aap listen karo)

| Event | Payload | Action |
|-------|---------|--------|
| `message_received` | `Message object` | New message — append to chat |
| `typing` | `{ chatId, userId }` | Show typing indicator |
| `stop_typing` | `{ chatId, userId }` | Hide typing indicator |
| `read_receipt` | `{ chatId, userId }` | Update double-tick / read status |
| `online_status` | `{ userId, isOnline, lastSeen? }` | Update user's online/offline badge |

```js
socket.on('message_received', (msg) => {
  appendMessageToChat(msg.chatId, msg);
});

socket.on('typing', ({ chatId, userId }) => {
  showTypingIndicator(chatId, userId);
});

socket.on('stop_typing', ({ chatId, userId }) => {
  hideTypingIndicator(chatId, userId);
});

socket.on('read_receipt', ({ chatId, userId }) => {
  markMessagesAsRead(chatId, userId); // show ✓✓
});

socket.on('online_status', ({ userId, isOnline, lastSeen }) => {
  updateUserPresence(userId, isOnline, lastSeen);
});
```

---

### Connection Error Codes

| `error.message` | Reason |
|-----------------|--------|
| `Authentication error: no token` | Token not passed in `auth.token` |
| `Authentication error: invalid token` | Token expired or wrong |
| `Authentication error: user not found` | Account deleted |

---

## 7. Complete Frontend Flow

### App Startup / Login

```
1. POST /api/auth/login              → get accessToken + user
2. Store accessToken in memory (variable, not localStorage)
3. Connect socket with accessToken
4. GET /api/chats                    → load sidebar (all chats)
5. socket.emit('join_chat', chatId)  → for each chat in the list
```

### Opening a Chat

```
1. GET /api/messages/:chatId         → load latest 50 messages (auto-marks as read)
2. socket.emit('join_chat', chatId)  → already done at startup, but safe to call again
3. Render messages
4. Update unreadCount = 0 in sidebar
```

### Sending a Message

```
1. POST /api/messages  (multipart/form-data: chatId + content/file)
2. On success → message is also pushed to room via 'message_received' socket event
3. Optimistic UI: show message immediately, confirm on response
```

### Typing Indicator

```js
let typingTimer;

input.addEventListener('input', () => {
  socket.emit('typing', chatId);
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => socket.emit('stop_typing', chatId), 1500);
});
```

### Sending a File

```
1. POST /api/upload         → get url (Cloudinary link)
2. POST /api/messages       → send message with file field
   OR use the url directly as needed (e.g. avatar update)
```

### Token Refresh (silent, on 401)

```js
async function apiFetch(url, options = {}) {
  let res = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401) {
    const data = await fetch('/api/auth/refresh-token', { method: 'POST' }).then(r => r.json());
    accessToken = data.accessToken; // update in memory
    // reconnect socket with new token
    socket.auth.token = accessToken;
    socket.disconnect().connect();
    // retry original request
    res = await fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${accessToken}` },
    });
  }
  return res;
}
```

### Logout

```
1. POST /api/auth/logout    → clears refresh token cookie
2. Clear accessToken from memory
3. socket.disconnect()
4. Redirect to login page
```

---

## Headers Reference

| Endpoint type | Required headers |
|--------------|-----------------|
| Public (auth) | none |
| Protected REST | `Authorization: Bearer <accessToken>` |
| File upload | `Authorization: Bearer <accessToken>` + `Content-Type: multipart/form-data` (auto-set by FormData) |
| Socket connection | Pass token in `auth: { token: accessToken }` on connect |

---

*Last updated: May 15, 2026 — Backend v1.0.0*
