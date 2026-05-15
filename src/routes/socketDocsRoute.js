const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const host = `${req.protocol}://${req.headers.host}`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(/* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Socket.io Events — Chat App</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f1117; color: #e2e8f0; line-height: 1.6; }
    a { color: #7c3aed; text-decoration: none; } a:hover { text-decoration: underline; }

    /* Layout */
    header { background: #1a1d27; border-bottom: 1px solid #2d3148; padding: 20px 40px; display: flex; align-items: center; gap: 16px; }
    header svg { flex-shrink: 0; }
    header h1 { font-size: 1.4rem; font-weight: 700; color: #fff; }
    header span { font-size: 0.8rem; background: #7c3aed22; color: #a78bfa; border: 1px solid #7c3aed55; border-radius: 20px; padding: 2px 10px; }
    .subtitle { font-size: 0.85rem; color: #64748b; margin-top: 2px; }

    .container { max-width: 960px; margin: 0 auto; padding: 40px 24px; }
    .api-link { display: inline-flex; align-items: center; gap: 8px; background: #1e2033; border: 1px solid #2d3148; border-radius: 8px; padding: 10px 18px; font-size: 0.85rem; color: #a78bfa; margin-bottom: 40px; transition: border-color 0.2s; }
    .api-link:hover { border-color: #7c3aed; text-decoration: none; }

    /* Section headers */
    h2 { font-size: 1.1rem; font-weight: 600; color: #fff; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #1e2033; display: flex; align-items: center; gap: 10px; }
    h2 .badge { font-size: 0.7rem; padding: 2px 8px; border-radius: 20px; font-weight: 500; }
    .badge-blue { background: #1e40af22; color: #60a5fa; border: 1px solid #1e40af55; }
    .badge-green { background: #16653422; color: #4ade80; border: 1px solid #16653455; }
    .badge-purple { background: #7c3aed22; color: #c4b5fd; border: 1px solid #7c3aed55; }

    section { margin-bottom: 48px; }

    /* Connection box */
    .connection-box { background: #1a1d27; border: 1px solid #2d3148; border-radius: 12px; padding: 24px; }
    .connection-box p { font-size: 0.9rem; color: #94a3b8; margin-bottom: 16px; }

    /* Code blocks */
    pre { background: #0d0f18; border: 1px solid #1e2033; border-radius: 8px; padding: 16px 20px; overflow-x: auto; font-size: 0.82rem; line-height: 1.7; }
    code { font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace; }
    .cm  { color: #4a5568; } /* comment */
    .kw  { color: #c4b5fd; } /* keyword */
    .str { color: #86efac; } /* string */
    .fn  { color: #60a5fa; } /* function */
    .ev  { color: #fbbf24; } /* event name */
    .obj { color: #e2e8f0; } /* object key */

    /* Event cards */
    .event-grid { display: flex; flex-direction: column; gap: 16px; }
    .event-card { background: #1a1d27; border: 1px solid #2d3148; border-radius: 12px; overflow: hidden; }
    .event-card-header { display: flex; align-items: center; gap: 12px; padding: 14px 20px; background: #1e2033; border-bottom: 1px solid #2d3148; }
    .event-name { font-family: 'Fira Code', Consolas, monospace; font-size: 0.9rem; font-weight: 600; color: #fbbf24; }
    .direction-badge { font-size: 0.7rem; padding: 2px 8px; border-radius: 20px; border: 1px solid; }
    .dir-emit  { color: #60a5fa; border-color: #1e40af55; background: #1e40af18; }
    .dir-on    { color: #4ade80; border-color: #16653455; background: #16653418; }
    .event-card-body { padding: 16px 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media(max-width:640px){ .event-card-body { grid-template-columns: 1fr; } }
    .event-card-body label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.07em; color: #475569; font-weight: 600; display: block; margin-bottom: 6px; }
    .event-desc { font-size: 0.88rem; color: #94a3b8; }
    .payload-type { font-family: 'Fira Code', Consolas, monospace; font-size: 0.8rem; color: #c4b5fd; background: #0d0f18; border: 1px solid #1e2033; border-radius: 6px; padding: 8px 12px; }

    /* Auth error table */
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th { text-align: left; padding: 10px 14px; background: #1e2033; color: #94a3b8; font-weight: 500; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #2d3148; }
    td { padding: 10px 14px; border-bottom: 1px solid #1a1d27; color: #cbd5e1; }
    tr:last-child td { border-bottom: none; }
    .err-code { font-family: 'Fira Code', Consolas, monospace; color: #f87171; }

    footer { text-align: center; padding: 32px; font-size: 0.8rem; color: #334155; border-top: 1px solid #1a1d27; }
  </style>
</head>
<body>
<header>
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#7c3aed"/>
    <path d="M8 20l6-12 4 8 3-5 3 9" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  <div>
    <h1>Socket.io Events &nbsp;<span>v1.0</span></h1>
    <div class="subtitle">Real-time events reference for the Chat Application</div>
  </div>
</header>

<div class="container">
  <a class="api-link" href="${host}/api/docs" target="_blank">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    REST API Docs (Swagger UI)
  </a>

  <!-- Connection -->
  <section>
    <h2><span class="badge badge-purple">1</span> Connecting</h2>
    <div class="connection-box">
      <p>Pass your JWT access token (from <code>/api/auth/login</code>) in the <code>auth</code> option. The server rejects connections without a valid token.</p>
      <pre><code><span class="cm">// npm install socket.io-client</span>
<span class="kw">import</span> { io } <span class="kw">from</span> <span class="str">'socket.io-client'</span>;

<span class="kw">const</span> socket = <span class="fn">io</span>(<span class="str">'${host}'</span>, {
  <span class="obj">auth</span>: { <span class="obj">token</span>: <span class="str">'&lt;ACCESS_TOKEN&gt;'</span> },
  <span class="obj">transports</span>: [<span class="str">'websocket'</span>],
});

socket.<span class="fn">on</span>(<span class="str">'connect'</span>, () =&gt; console.<span class="fn">log</span>(<span class="str">'connected:'</span>, socket.id));
socket.<span class="fn">on</span>(<span class="str">'connect_error'</span>, (err) =&gt; console.<span class="fn">error</span>(err.message));</code></pre>
    </div>
  </section>

  <!-- Client → Server -->
  <section>
    <h2><span class="badge badge-blue">Client → Server</span> Events you emit</h2>
    <div class="event-grid">

      <div class="event-card">
        <div class="event-card-header">
          <span class="event-name">join_chat</span>
          <span class="direction-badge dir-emit">emit</span>
        </div>
        <div class="event-card-body">
          <div>
            <label>Description</label>
            <p class="event-desc">Join a chat room to start receiving real-time messages and typing indicators for that chat. Call this after fetching or creating a chat.</p>
          </div>
          <div>
            <label>Payload</label>
            <div class="payload-type">chatId: string</div>
            <pre style="margin-top:8px"><code>socket.<span class="fn">emit</span>(<span class="ev">'join_chat'</span>, chatId);</code></pre>
          </div>
        </div>
      </div>

      <div class="event-card">
        <div class="event-card-header">
          <span class="event-name">leave_chat</span>
          <span class="direction-badge dir-emit">emit</span>
        </div>
        <div class="event-card-body">
          <div>
            <label>Description</label>
            <p class="event-desc">Leave a chat room. You will stop receiving real-time events for that chat until you rejoin.</p>
          </div>
          <div>
            <label>Payload</label>
            <div class="payload-type">chatId: string</div>
            <pre style="margin-top:8px"><code>socket.<span class="fn">emit</span>(<span class="ev">'leave_chat'</span>, chatId);</code></pre>
          </div>
        </div>
      </div>

      <div class="event-card">
        <div class="event-card-header">
          <span class="event-name">typing</span>
          <span class="direction-badge dir-emit">emit</span>
        </div>
        <div class="event-card-body">
          <div>
            <label>Description</label>
            <p class="event-desc">Notify others in the chat that the current user is typing. Emit while the input has focus and content changes.</p>
          </div>
          <div>
            <label>Payload</label>
            <div class="payload-type">chatId: string</div>
            <pre style="margin-top:8px"><code>socket.<span class="fn">emit</span>(<span class="ev">'typing'</span>, chatId);</code></pre>
          </div>
        </div>
      </div>

      <div class="event-card">
        <div class="event-card-header">
          <span class="event-name">stop_typing</span>
          <span class="direction-badge dir-emit">emit</span>
        </div>
        <div class="event-card-body">
          <div>
            <label>Description</label>
            <p class="event-desc">Notify others the current user stopped typing. Emit on input blur or after a debounce timeout with no new keystrokes.</p>
          </div>
          <div>
            <label>Payload</label>
            <div class="payload-type">chatId: string</div>
            <pre style="margin-top:8px"><code>socket.<span class="fn">emit</span>(<span class="ev">'stop_typing'</span>, chatId);</code></pre>
          </div>
        </div>
      </div>

      <div class="event-card">
        <div class="event-card-header">
          <span class="event-name">mark_read</span>
          <span class="direction-badge dir-emit">emit</span>
        </div>
        <div class="event-card-body">
          <div>
            <label>Description</label>
            <p class="event-desc">Mark all messages in a chat as read by the current user. The server broadcasts a <code>read_receipt</code> to other members. Also call <code>POST /api/messages/:chatId/read</code> to persist to the database.</p>
          </div>
          <div>
            <label>Payload</label>
            <div class="payload-type">{ chatId: string }</div>
            <pre style="margin-top:8px"><code>socket.<span class="fn">emit</span>(<span class="ev">'mark_read'</span>, { chatId });</code></pre>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- Server → Client -->
  <section>
    <h2><span class="badge badge-green">Server → Client</span> Events you listen for</h2>
    <div class="event-grid">

      <div class="event-card">
        <div class="event-card-header">
          <span class="event-name">message_received</span>
          <span class="direction-badge dir-on">on</span>
        </div>
        <div class="event-card-body">
          <div>
            <label>Description</label>
            <p class="event-desc">A new message was sent in a chat room you have joined. Append it to the message list.</p>
          </div>
          <div>
            <label>Payload — Message object</label>
            <div class="payload-type">{
  id: string
  chatId: string
  sender: User
  content: string
  type: "TEXT" | "IMAGE" | "FILE"
  fileUrl: string | null
  fileName: string | null
  readBy: { userId }[]
  createdAt: string
}</div>
            <pre style="margin-top:8px"><code>socket.<span class="fn">on</span>(<span class="ev">'message_received'</span>, (msg) =&gt; {
  <span class="cm">// append msg to chat</span>
});</code></pre>
          </div>
        </div>
      </div>

      <div class="event-card">
        <div class="event-card-header">
          <span class="event-name">typing</span>
          <span class="direction-badge dir-on">on</span>
        </div>
        <div class="event-card-body">
          <div>
            <label>Description</label>
            <p class="event-desc">Another member in the chat started typing. Show a typing indicator for that user.</p>
          </div>
          <div>
            <label>Payload</label>
            <div class="payload-type">{ chatId: string, userId: string }</div>
            <pre style="margin-top:8px"><code>socket.<span class="fn">on</span>(<span class="ev">'typing'</span>, ({ chatId, userId }) =&gt; {
  <span class="cm">// show typing indicator</span>
});</code></pre>
          </div>
        </div>
      </div>

      <div class="event-card">
        <div class="event-card-header">
          <span class="event-name">stop_typing</span>
          <span class="direction-badge dir-on">on</span>
        </div>
        <div class="event-card-body">
          <div>
            <label>Description</label>
            <p class="event-desc">Another member stopped typing. Hide the typing indicator for that user.</p>
          </div>
          <div>
            <label>Payload</label>
            <div class="payload-type">{ chatId: string, userId: string }</div>
            <pre style="margin-top:8px"><code>socket.<span class="fn">on</span>(<span class="ev">'stop_typing'</span>, ({ chatId, userId }) =&gt; {
  <span class="cm">// hide typing indicator</span>
});</code></pre>
          </div>
        </div>
      </div>

      <div class="event-card">
        <div class="event-card-header">
          <span class="event-name">read_receipt</span>
          <span class="direction-badge dir-on">on</span>
        </div>
        <div class="event-card-body">
          <div>
            <label>Description</label>
            <p class="event-desc">Another member read all messages in a chat. Update the read indicator on messages (e.g. double-tick).</p>
          </div>
          <div>
            <label>Payload</label>
            <div class="payload-type">{ chatId: string, userId: string }</div>
            <pre style="margin-top:8px"><code>socket.<span class="fn">on</span>(<span class="ev">'read_receipt'</span>, ({ chatId, userId }) =&gt; {
  <span class="cm">// mark messages as read by userId</span>
});</code></pre>
          </div>
        </div>
      </div>

      <div class="event-card">
        <div class="event-card-header">
          <span class="event-name">online_status</span>
          <span class="direction-badge dir-on">on</span>
        </div>
        <div class="event-card-body">
          <div>
            <label>Description</label>
            <p class="event-desc">Broadcast to all connected clients when any user connects or disconnects. Use to show online/offline status and last seen time.</p>
          </div>
          <div>
            <label>Payload</label>
            <div class="payload-type">{ userId: string, isOnline: boolean, lastSeen?: string }</div>
            <pre style="margin-top:8px"><code>socket.<span class="fn">on</span>(<span class="ev">'online_status'</span>, ({ userId, isOnline, lastSeen }) =&gt; {
  <span class="cm">// update user presence in UI</span>
});</code></pre>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- Auth errors -->
  <section>
    <h2><span class="badge badge-purple">Auth</span> Connection errors</h2>
    <div class="connection-box">
      <p style="margin-bottom:16px">If the connection is rejected the <code>connect_error</code> event fires with one of these messages:</p>
      <table>
        <thead>
          <tr><th>error.message</th><th>Cause</th></tr>
        </thead>
        <tbody>
          <tr><td class="err-code">Authentication error: no token</td><td>No token supplied in <code>auth.token</code></td></tr>
          <tr><td class="err-code">Authentication error: invalid token</td><td>Token is expired, malformed, or signed with wrong secret</td></tr>
          <tr><td class="err-code">Authentication error: user not found</td><td>Token belongs to a deleted account</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- Full example -->
  <section>
    <h2><span class="badge badge-blue">Example</span> Full integration snippet</h2>
    <div class="connection-box">
      <pre><code><span class="kw">import</span> { io } <span class="kw">from</span> <span class="str">'socket.io-client'</span>;

<span class="kw">const</span> socket = <span class="fn">io</span>(<span class="str">'${host}'</span>, {
  <span class="obj">auth</span>: { <span class="obj">token</span>: accessToken },
  <span class="obj">transports</span>: [<span class="str">'websocket'</span>],
});

<span class="cm">// Connection lifecycle</span>
socket.<span class="fn">on</span>(<span class="str">'connect'</span>, () =&gt; {
  socket.<span class="fn">emit</span>(<span class="ev">'join_chat'</span>, currentChatId);
});
socket.<span class="fn">on</span>(<span class="str">'connect_error'</span>, (err) =&gt; console.<span class="fn">error</span>(err.message));
socket.<span class="fn">on</span>(<span class="str">'disconnect'</span>, () =&gt; console.<span class="fn">log</span>(<span class="str">'disconnected'</span>));

<span class="cm">// Incoming events</span>
socket.<span class="fn">on</span>(<span class="ev">'message_received'</span>,  (msg)                       =&gt; appendMessage(msg));
socket.<span class="fn">on</span>(<span class="ev">'typing'</span>,            ({ chatId, userId })          =&gt; showTyping(userId));
socket.<span class="fn">on</span>(<span class="ev">'stop_typing'</span>,       ({ chatId, userId })          =&gt; hideTyping(userId));
socket.<span class="fn">on</span>(<span class="ev">'read_receipt'</span>,      ({ chatId, userId })          =&gt; markRead(chatId, userId));
socket.<span class="fn">on</span>(<span class="ev">'online_status'</span>,     ({ userId, isOnline, lastSeen }) =&gt; updatePresence(userId, isOnline));

<span class="cm">// Outgoing events</span>
<span class="kw">function</span> <span class="fn">joinChat</span>(chatId)  { socket.<span class="fn">emit</span>(<span class="ev">'join_chat'</span>,   chatId); }
<span class="kw">function</span> <span class="fn">leaveChat</span>(chatId) { socket.<span class="fn">emit</span>(<span class="ev">'leave_chat'</span>,  chatId); }
<span class="kw">function</span> <span class="fn">sendTyping</span>(chatId){ socket.<span class="fn">emit</span>(<span class="ev">'typing'</span>,      chatId); }
<span class="kw">function</span> <span class="fn">stopTyping</span>(chatId){ socket.<span class="fn">emit</span>(<span class="ev">'stop_typing'</span>, chatId); }
<span class="kw">function</span> <span class="fn">markAsRead</span>(chatId){ socket.<span class="fn">emit</span>(<span class="ev">'mark_read'</span>,   { chatId }); }</code></pre>
    </div>
  </section>
</div>

<footer>Chat Application &mdash; Socket.io Events Reference &mdash; REST API docs at <a href="${host}/api/docs">/api/docs</a></footer>
</body>
</html>`);
});

module.exports = router;
