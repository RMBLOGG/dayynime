/* =====================================================
   DAYYNIME — Realtime Chat
   Supabase Broadcast (tanpa tabel DB)
   ===================================================== */
(function () {
  var SUPABASE_URL = 'https://mafnnqttvkdgqqxczqyt.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hZm5ucXR0dmtkZ3FxeGN6cXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzQyMDEsImV4cCI6MjA4NzQ1MDIwMX0.YRh1oWVKnn4tyQNRbcPhlSyvr7V_1LseWN7VjcImb-Y';

  // ── State ─────────────────────────────────────────
  var chatOpen    = false;
  var unread      = 0;
  var messages    = [];        // buffer max 80 pesan
  var channel     = null;
  var presenceCh  = null;
  var onlineCount = 0;
  var ROOM_ID     = window.CHAT_ROOM_ID || 'global';
  var ME          = window.CHAT_USER    || null;  // { id, name, avatar }
  var client      = null;

  // ── Init ──────────────────────────────────────────
  function init() {
    if (typeof supabase === 'undefined') return;
    client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    buildUI();
    subscribeChat();
    subscribePresence();
  }

  // ── Build UI ──────────────────────────────────────
  function buildUI() {
    // FAB
    var fab = document.createElement('button');
    fab.id = 'chatFab';
    fab.title = 'Live Chat';
    fab.innerHTML = '<i class="fas fa-comments"></i>';
    fab.onclick = toggleChat;
    document.body.appendChild(fab);

    // Popup
    var popup = document.createElement('div');
    popup.id = 'chatPopup';
    popup.innerHTML =
      '<div class="chat-head">' +
        '<div class="chat-head-left">' +
          '<span class="chat-head-dot"></span>' +
          '<div><div class="chat-head-title">Live Chat</div>' +
          '<div class="chat-head-sub" id="chatOnlineLabel">Menghubungkan...</div></div>' +
        '</div>' +
        '<button class="chat-head-close" onclick="window._chatToggle()"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<div class="chat-messages" id="chatMessages"></div>' +
      (ME
        ? '<div class="chat-input-wrap">' +
            '<input class="chat-input" id="chatInput" placeholder="Tulis pesan..." maxlength="200" autocomplete="off">' +
            '<button class="chat-send" id="chatSendBtn" onclick="window._chatSend()"><i class="fas fa-paper-plane"></i></button>' +
          '</div>'
        : '<div class="chat-login-wall">' +
            '<i class="fas fa-lock"></i>' +
            '<p>Login dulu untuk ikut ngobrol di Live Chat</p>' +
            '<a href="/auth/login" class="chat-login-btn">Login</a>' +
          '</div>'
      );
    document.body.appendChild(popup);

    // Expose ke global
    window._chatToggle = toggleChat;
    window._chatSend   = sendMessage;

    // Enter key kirim
    var inp = document.getElementById('chatInput');
    if (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
      });
    }

    renderMessages();
  }

  // ── Toggle popup ──────────────────────────────────
  function toggleChat() {
    chatOpen = !chatOpen;
    var popup = document.getElementById('chatPopup');
    var fab   = document.getElementById('chatFab');
    if (!popup || !fab) return;
    if (chatOpen) {
      popup.classList.add('open');
      fab.innerHTML = '<i class="fas fa-times"></i>';
      fab.classList.remove('has-unread');
      unread = 0;
      scrollBottom();
      var inp = document.getElementById('chatInput');
      if (inp) setTimeout(function () { inp.focus(); }, 200);
    } else {
      popup.classList.remove('open');
      fab.innerHTML = '<i class="fas fa-comments"></i>';
    }
  }

  // ── Subscribe Broadcast ───────────────────────────
  function subscribeChat() {
    channel = client.channel('chat:' + ROOM_ID);
    channel
      .on('broadcast', { event: 'msg' }, function (payload) {
        var msg = payload.payload;
        if (!msg || !msg.text) return;
        pushMessage(msg, false);
      })
      .subscribe();
  }

  // ── Subscribe Presence (online count) ─────────────
  function subscribePresence() {
    var uid = sessionStorage.getItem('dyn_uid') ||
              ('u_' + Math.random().toString(36).substr(2, 9));
    sessionStorage.setItem('dyn_uid', uid);

    presenceCh = client.channel('chat-presence:' + ROOM_ID, {
      config: { presence: { key: uid } }
    });
    presenceCh
      .on('presence', { event: 'sync' }, function () {
        onlineCount = Object.keys(presenceCh.presenceState()).length;
        updateOnlineLabel();
      })
      .subscribe(function (status) {
        if (status === 'SUBSCRIBED') {
          presenceCh.track({ uid: uid, at: Date.now() });
          updateOnlineLabel();
        }
      });
  }

  function updateOnlineLabel() {
    var el = document.getElementById('chatOnlineLabel');
    if (!el) return;
    el.textContent = onlineCount > 0
      ? onlineCount + ' online'
      : 'Terhubung';
  }

  // ── Send ──────────────────────────────────────────
  function sendMessage() {
    if (!ME || !channel) return;
    var inp = document.getElementById('chatInput');
    var btn = document.getElementById('chatSendBtn');
    if (!inp) return;
    var text = inp.value.trim();
    if (!text) return;

    var msg = {
      id:     Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      uid:    ME.id,
      name:   ME.name,
      avatar: ME.avatar || '',
      text:   text,
      time:   Date.now()
    };

    // Optimistic: tampilkan langsung sebagai pesan sendiri
    pushMessage(msg, true);
    inp.value = '';
    if (btn) { btn.disabled = true; setTimeout(function () { btn.disabled = false; }, 600); }

    // Broadcast ke semua
    channel.send({ type: 'broadcast', event: 'msg', payload: msg });
  }

  // ── Push message to buffer & DOM ──────────────────
  function pushMessage(msg, isMe) {
    messages.push({ msg: msg, isMe: isMe });
    if (messages.length > 80) messages.shift();
    appendMessageDOM(msg, isMe);
    if (!chatOpen && !isMe) {
      unread++;
      var fab = document.getElementById('chatFab');
      if (fab) fab.classList.add('has-unread');
    }
  }

  function appendMessageDOM(msg, isMe) {
    var container = document.getElementById('chatMessages');
    if (!container) return;

    // Hapus empty state kalau ada
    var empty = container.querySelector('.chat-empty');
    if (empty) empty.remove();

    var div = document.createElement('div');
    div.className = 'chat-msg' + (isMe ? ' me' : '');

    var avatarHTML = msg.avatar
      ? '<img src="' + escapeHtml(msg.avatar) + '" alt="" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'flex\'">' +
        '<span style="display:none;">' + escapeHtml((msg.name || 'U')[0].toUpperCase()) + '</span>'
      : escapeHtml((msg.name || 'U')[0].toUpperCase());

    var timeStr = formatTime(msg.time);

    div.innerHTML =
      '<div class="chat-avatar">' + avatarHTML + '</div>' +
      '<div class="chat-bubble-wrap">' +
        (!isMe ? '<div class="chat-name">' + escapeHtml(msg.name || 'User') + '</div>' : '') +
        '<div class="chat-bubble">' + escapeHtml(msg.text) + '</div>' +
        '<div class="chat-time">' + timeStr + '</div>' +
      '</div>';

    container.appendChild(div);
    scrollBottom();
  }

  // ── Render all messages ───────────────────────────
  function renderMessages() {
    var container = document.getElementById('chatMessages');
    if (!container) return;
    if (messages.length === 0) {
      container.innerHTML =
        '<div class="chat-empty">' +
          '<i class="fas fa-comments"></i>' +
          '<span>Belum ada pesan. Jadilah yang pertama!</span>' +
        '</div>';
      return;
    }
    container.innerHTML = '';
    messages.forEach(function (m) { appendMessageDOM(m.msg, m.isMe); });
  }

  function scrollBottom() {
    var container = document.getElementById('chatMessages');
    if (container) setTimeout(function () {
      container.scrollTop = container.scrollHeight;
    }, 50);
  }

  // ── Helpers ───────────────────────────────────────
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatTime(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    var h = d.getHours().toString().padStart(2, '0');
    var m = d.getMinutes().toString().padStart(2, '0');
    return h + ':' + m;
  }

  // ── Cleanup ───────────────────────────────────────
  window.addEventListener('beforeunload', function () {
    try {
      if (presenceCh) { presenceCh.untrack(); client.removeChannel(presenceCh); }
      if (channel) client.removeChannel(channel);
    } catch (e) {}
  });

  // ── Boot ──────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
