// ─── NAVIGATION ───
function showSection(id, el) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-links li a').forEach(a => a.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (el) el.classList.add('active');
  window.scrollTo(0, 0);
  document.querySelector('.nav-links').classList.remove('open');
}

document.querySelector('.hamburger').addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('open');
});

// ─── DATA STORE ───
const store = {
  bayans: [],
  videos: [],
  questions: [],
  notifications: [],
  courses: []
};


let dynamicCategories = [];


// ─── FETCH INITIAL DATA ───
async function initData() {
  try {
    const [bRes, vRes, qRes, nRes, cRes] = await Promise.all([
      fetch('/api/bayans'),
      fetch('/api/videos'),
      fetch('/api/questions'),
      fetch('/api/notifications'),
      fetch('/api/courses'),
      fetch('/api/categories')
    ]);

    
    store.bayans = await bRes.json();
    store.videos = await vRes.json();
    store.questions = await qRes.json();
    store.notifications = await nRes.json();
    store.courses = await cRes.json();
    dynamicCategories = await catRes.json();


    renderNotifications();
    renderCategories();
    renderBayans();
    renderVideos();
    renderCourses();
    renderQA();
    renderQaFilterBtns();
    renderStats();
  } catch (err) {
    console.error('Error loading data:', err);
    showBanner('Error loading data from server.');
  }
}


// ─── NOTIFICATIONS ───
function renderNotifications() {
  const grid = document.getElementById('notif-grid');
  grid.innerHTML = store.notifications.map(n => `
    <div class="notif-card ${n.type}">
      <div class="notif-arabic">${n.arabic}</div>
      <span class="notif-badge badge-${n.type}">${n.badge}</span>
      <div class="notif-title">${n.title}</div>
      <div class="notif-body">${n.body}</div>
      <div class="notif-date">📅 ${n.date}</div>
    </div>
  `).join('');

  // Update navbar badge
  const badge = document.querySelector('.notify-badge');
  if (badge) {
    badge.textContent = store.notifications.length;
    badge.style.display = store.notifications.length > 0 ? 'flex' : 'none';
  }
}
// ─── COURSES ───
// Map emoji shortcuts to Font Awesome classes for professional icons
const COURSE_ICON_MAP = {
  '📚': 'fas fa-book-open',
  '💎': 'fas fa-gem',
  '🌿': 'fas fa-scroll',
  '✨': 'fas fa-star-and-crescent',
  '🌙': 'fas fa-moon',
  '📖': 'fas fa-quran',
  '📿': 'fas fa-infinity',
  '🕌': 'fas fa-mosque',
  '🌸': 'fas fa-seedling',
  '🎓': 'fas fa-graduation-cap',
  '🔑': 'fas fa-key',
  '❤️': 'fas fa-heart',
};

function getCourseIconHtml(iconEmoji) {
  const faClass = COURSE_ICON_MAP[iconEmoji] || 'fas fa-book-open';
  return `<i class="${faClass}" style="font-size:2rem; color:var(--gold-light);"></i>`;
}

function renderCourses() {
  const grid = document.getElementById('courses-grid');
  if (!grid) return;
  
  if (store.courses.length === 0) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fas fa-book-open" style="font-size:2.5rem; color:var(--gold);"></i></div><p>No courses available at the moment.</p></div>`;
    return;
  }

  grid.innerHTML = store.courses.map(c => `
    <div class="course-card">
      <div class="course-header">
        <div class="course-icon">${getCourseIconHtml(c.icon)}</div>
        <span class="course-arabic">${c.arabicTitle || ''}</span>
        <div class="course-title">${c.title}</div>
      </div>
      <div class="course-body">
        <p class="course-desc">${c.description}</p>
        <div class="course-meta">
          <span class="course-meta-item"><i class="fas fa-calendar-alt" style="margin-right:4px; color:var(--gold);"></i> ${c.status}</span>
          <span class="course-meta-item"><i class="fas fa-clock" style="margin-right:4px; color:var(--gold);"></i> ${c.duration}</span>
          <span class="course-meta-item"><i class="fas fa-location-dot" style="margin-right:4px; color:var(--gold);"></i> ${c.location}</span>
        </div>
        <button class="course-enroll" onclick="showSection('qa', null)">Enroll / Inquire</button>
      </div>
    </div>
  `).join('');
}


// ─── AUDIO ───
let currentBayanId = null;
let audioPlaying = false;
let audioProgress = 0;
let progressInterval = null;
let activeCat = 'All';

let ytPlayer = null;
let scWidget = null;
let activePlayerType = 'none'; // 'direct', 'yt', 'sc'

// Initialize YouTube API
window.onYouTubeIframeAPIReady = function() {
  const container = document.getElementById('embed-container');
  const ytDiv = document.createElement('div');
  ytDiv.id = 'yt-player-placeholder';
  container.appendChild(ytDiv);
  
  ytPlayer = new YT.Player('yt-player-placeholder', {
    height: '0',
    width: '0',
    events: {
      'onStateChange': onPlayerStateChange
    }
  });
};

function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING) {
    audioPlaying = true;
    updateNpUI();
  } else if (event.data == YT.PlayerState.PAUSED || event.data == YT.PlayerState.ENDED) {
    audioPlaying = false;
    updateNpUI();
    if (event.data == YT.PlayerState.ENDED) nextBayan();
  }
}

function renderCategories() {
  const counts = {};
  store.bayans.forEach(b => { counts[b.category] = (counts[b.category] || 0) + 1; });
  const total = store.bayans.length;
  const list = document.getElementById('cat-list');
  
  const cats = [{ name: 'All', icon: '☰' }, ...dynamicCategories];
  
  list.innerHTML = cats.map(c => `
    <li class="${c.name === activeCat ? 'active' : ''}" onclick="filterBayans('${c.name}', this)">
      <span>${c.icon}</span> ${c.name}
      <span class="count">${c.name === 'All' ? total : (counts[c.name] || 0)}</span>
    </li>
  `).join('');
}


function getCatIcon(cat) {
  const icons = { Tasawwuf:'✦', Ibaadat:'🕌', Akhlaq:'🌿', Quran:'📖', Ramadan:'🌙', Islah:'💫' };
  return icons[cat] || '▪';
}

function filterBayans(cat, el) {
  activeCat = cat;
  document.querySelectorAll('#cat-list li').forEach(li => li.classList.remove('active'));
  if (el) el.classList.add('active');
  renderBayans();
}

function renderBayans() {
  const filtered = activeCat === 'All' ? store.bayans : store.bayans.filter(b => b.category === activeCat);
  const list = document.getElementById('bayan-list');
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fas fa-headphones"></i></div><p>No bayans in this category yet.</p></div>`;
    return;
  }
  list.innerHTML = filtered.map(b => {
    const bid = String(b.id || b._id);
    const isPlaying = currentBayanId === bid;
    return `
    <div class="bayan-item ${isPlaying ? 'playing' : ''}" onclick="playBayan('${bid}')">
      <div class="bayan-play-icon">${isPlaying && audioPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>'}</div>
      <div class="bayan-info">
        <div class="bayan-title">${b.title}</div>
        <div class="bayan-meta"><i class="fas fa-calendar-alt" style="margin-right:4px;"></i>${b.date}</div>
      </div>
      <span class="bayan-cat-badge">${b.category}</span>
      <div class="bayan-duration"><i class="fas fa-clock" style="margin-right:4px;"></i>${b.duration}</div>
    </div>`;
  }).join('');
}


function playBayan(id) {
  const bid = String(id);
  const bayan = store.bayans.find(b => String(b.id || b._id) === bid);
  if (!bayan) { console.error('Bayan not found:', id); return; }
  
  stopAllPlayers();
  currentBayanId = bid;
  const url = bayan.url || '';

  if (!url) {
    showBanner('No audio URL found for this bayan.');
    return;
  }

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    activePlayerType = 'yt';
    const ytId = extractYtId(url);
    if (ytPlayer && ytPlayer.loadVideoById) {
      ytPlayer.loadVideoById(ytId);
    } else {
      showBanner('YouTube player not ready. Please try again.');
    }
  } else if (url.includes('soundcloud.com')) {
    activePlayerType = 'sc';
    loadScWidget(url);
  } else {
    activePlayerType = 'direct';
    const audio = document.getElementById('main-audio-player');
    audio.src = url;
    audio.play().catch(err => {
      console.error('Audio play error:', err);
      showBanner('Could not play this audio. Check the URL.');
    });
  }

  audioPlaying = true;
  const np = document.getElementById('now-playing');
  np.classList.add('visible');
  document.getElementById('np-title').textContent = bayan.title;
  document.getElementById('np-category').textContent = `${bayan.category}`;
  
  updateNpUI();
  startProgressTracker();
  renderBayans();
}


function stopAllPlayers() {
  // YT
  if (ytPlayer && ytPlayer.stopVideo) ytPlayer.stopVideo();
  // SC
  if (scWidget) {
    scWidget.pause();
    document.getElementById('embed-container').innerHTML = '';
    scWidget = null;
  }
  // Direct
  const audio = document.getElementById('main-audio-player');
  audio.pause();
  audio.src = '';
  
  audioPlaying = false;
  activePlayerType = 'none';
}

function loadScWidget(url) {
  const container = document.getElementById('embed-container');
  container.innerHTML = `<iframe id="sc-iframe" width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=true"></iframe>`;
  const iframe = document.getElementById('sc-iframe');
  scWidget = SC.Widget(iframe);
  
  scWidget.bind(SC.Widget.Events.READY, () => {
    audioPlaying = true;
    updateNpUI();
  });
  scWidget.bind(SC.Widget.Events.PLAY, () => {
    audioPlaying = true;
    updateNpUI();
  });
  scWidget.bind(SC.Widget.Events.PAUSE, () => {
    audioPlaying = false;
    updateNpUI();
  });
  scWidget.bind(SC.Widget.Events.FINISH, () => {
    nextBayan();
  });
}

function togglePlay() {
  if (!currentBayanId) return;
  
  if (activePlayerType === 'yt') {
    if (audioPlaying) ytPlayer.pauseVideo();
    else ytPlayer.playVideo();
  } else if (activePlayerType === 'sc') {
    scWidget.toggle();
  } else if (activePlayerType === 'direct') {
    const audio = document.getElementById('main-audio-player');
    if (audioPlaying) audio.pause();
    else audio.play();
  }
  
  audioPlaying = !audioPlaying;
  updateNpUI();
}

function updateNpUI() {
  const btn = document.getElementById('np-play-btn');
  if (btn) btn.textContent = audioPlaying ? '⏸' : '▶';
  renderBayans();
}

function startProgressTracker() {
  if (progressInterval) clearInterval(progressInterval);
  progressInterval = setInterval(() => {
    let current = 0;
    let total = 1;
    
    if (activePlayerType === 'yt' && ytPlayer && ytPlayer.getDuration) {
      current = ytPlayer.getCurrentTime();
      total = ytPlayer.getDuration();
    } else if (activePlayerType === 'sc' && scWidget) {
      scWidget.getPosition(p => { 
          scWidget.getDuration(d => {
              updateProgressBar(p / 1000, d / 1000);
          });
      });
      return; 
    } else if (activePlayerType === 'direct') {
      const audio = document.getElementById('main-audio-player');
      current = audio.currentTime;
      total = audio.duration || 1;
      if (audio.ended) nextBayan();
    }
    
    updateProgressBar(current, total);
  }, 1000);
}

function updateProgressBar(current, total) {
  if (!total) return;
  const pct = (current / total) * 100;
  document.getElementById('np-bar').style.width = pct + '%';
  document.getElementById('np-time').textContent = `${formatTime(current)} / ${formatTime(total)}`;
}

function formatTime(s) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const rs = Math.floor(s % 60);
  return `${m}:${String(rs).padStart(2, '0')}`;
}

function extractYtId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
  return m ? m[1] : '';
}

function nextBayan() {
  const idx = store.bayans.findIndex(b => b.id === currentBayanId);
  if (idx !== -1 && idx > 0) playBayan(store.bayans[idx - 1].id);
  else if (store.bayans.length > 0) playBayan(store.bayans[store.bayans.length - 1].id);
}

function prevBayan() {
  const idx = store.bayans.findIndex(b => b.id === currentBayanId);
  if (idx !== -1 && idx < store.bayans.length - 1) playBayan(store.bayans[idx + 1].id);
}

function seekAudio(event) {
  if (!currentBayanId) return;
  const bar = event.currentTarget;
  const rect = bar.getBoundingClientRect();
  const pct = (event.clientX - rect.left) / rect.width;
  
  if (activePlayerType === 'yt' && ytPlayer && ytPlayer.getDuration) {
    ytPlayer.seekTo(ytPlayer.getDuration() * pct);
  } else if (activePlayerType === 'sc' && scWidget) {
    scWidget.getDuration(d => scWidget.seekTo(d * pct));
  } else if (activePlayerType === 'direct') {
    const audio = document.getElementById('main-audio-player');
    audio.currentTime = audio.duration * pct;
  }
}


// ─── VIDEO ───
function renderVideos() {
  const grid = document.getElementById('videos-grid');
  grid.innerHTML = store.videos.map(v => `
    <div class="video-card">
      <div class="video-thumb" onclick="openVideoModal('${v.ytId}', '${v.title.replace(/'/g,"\\'")}')">
        <img src="https://img.youtube.com/vi/${v.ytId}/mqdefault.jpg" 
             alt="${v.title}"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
        <div class="video-thumb-placeholder" style="display:none">🎥</div>
        <div class="play-overlay"><div class="play-circle">▶</div></div>
      </div>
      <div class="video-info">
        <div class="video-title">${v.title}</div>
        <div class="video-meta">📅 ${v.date}</div>
        <div class="video-actions">
          <button class="btn-watch-web" onclick="openVideoModal('${v.ytId}', '${v.title.replace(/'/g,"\\'")}')">▶ Watch Here</button>
          <a class="btn-watch-yt" href="https://www.youtube.com/watch?v=${v.ytId}" target="_blank">▶ YouTube</a>
        </div>
      </div>
    </div>
  `).join('');
}

function openVideoModal(ytId, title) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-iframe').src = `https://www.youtube.com/embed/${ytId}?autoplay=1`;
  document.getElementById('video-modal').classList.add('open');
}

function closeVideoModal() {
  document.getElementById('modal-iframe').src = '';
  document.getElementById('video-modal').classList.remove('open');
}

// ─── Q&A ───
let qaFilter = 'All';

function renderQA() {
  const filtered = qaFilter === 'All' ? store.questions : store.questions.filter(q => q.category === qaFilter);
  const list = document.getElementById('qa-list');

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">❓</div><p>No questions in this category yet.</p></div>`;
    return;
  }

  list.innerHTML = filtered.map(q => {
    const qid = String(q.id || q._id);
    return `
    <div class="question-card" id="q-${qid}">
      <div class="question-header" onclick="toggleQuestion('${qid}')">
        <div class="q-icon"><i class="fas fa-question"></i></div>
        <div class="q-content">
          <div class="q-text">${q.question}</div>
          <div class="q-meta">👤 ${q.name} &nbsp;•&nbsp; <i class="fas fa-calendar-alt"></i> ${q.date}
            <span class="q-cat-badge">${q.category}</span>
          </div>
        </div>
        <div class="q-expand-icon"><i class="fas fa-chevron-down"></i></div>
      </div>
      <div class="question-answer">
        <span class="answer-label"><i class="fas fa-reply-all"></i> Answer from Khanqah</span>
        <div class="answer-text ${!q.answered ? 'pending' : ''}">${q.answered ? q.answer : '⏳ Answer pending. JazakAllah for your patience.'}</div>
      </div>
    </div>`;
  }).join('');


  const statEl = document.getElementById('qa-cat-stats');
  const counts = {};
  store.questions.forEach(q => { counts[q.category] = (counts[q.category] || 0) + 1; });
  statEl.innerHTML = Object.entries(counts).map(([cat, n]) => `
    <div class="qa-cat-stat"><span>${cat}</span><span class="num">${n}</span></div>
  `).join('');
}

function toggleQuestion(id) {
  document.getElementById('q-' + id).classList.toggle('open');
}

function setQaFilter(cat, el) {
  qaFilter = cat;
  document.querySelectorAll('.qa-filter-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  renderQA();
}

function renderQaFilterBtns() {
  const cats = ['All', ...dynamicCategories.map(c => c.name)];
  document.getElementById('qa-filter-bar').innerHTML = cats.map(c => `
    <button class="qa-filter-btn ${c === 'All' ? 'active' : ''}" onclick="setQaFilter('${c}', this)">${c}</button>
  `).join('');
}


// Submit Question mapped to Backend API
async function submitQuestion() {
  const name = document.getElementById('q-name').value.trim();
  const question = document.getElementById('q-text').value.trim();
  const catSelect = document.getElementById('q-cat-select');
  const manualCat = catSelect ? catSelect.value : '';

  if (!name || !question) { alert('Please enter your name and question.'); return; }

  const badge = document.getElementById('auto-cat-badge');
  badge.textContent = '🔍 Assigning category...';
  badge.style.display = 'inline-block';

  let category = manualCat || autoDetectQaCategoryLocal(question);
  badge.textContent = `📂 Category: ${category}`;

  try {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        question,
        category,
        date: new Date().toISOString().split('T')[0]
      })
    });
    
    if (res.ok) {
        document.getElementById('q-name').value = '';
        document.getElementById('q-text').value = '';
        if (catSelect) catSelect.selectedIndex = 0;
        
        setTimeout(() => { badge.textContent = ''; badge.style.display = 'none'; }, 3000);
        showBanner('Question submitted! JazakAllah Khair.');
        initData();
    } else {
        showBanner('Error submitting question.');
    }
  } catch (err) {
      console.error(err);
      showBanner('Network Error.');
  }
}

async function populateQaFormDropdown() {
  const res = await fetch('/api/categories');
  const cats = await res.json();
  const select = document.getElementById('q-cat-select');
  if (select) {
    select.innerHTML = cats.map(c => `<option>${c.name}</option>`).join('');
  }
}
populateQaFormDropdown();


function autoDetectQaCategoryLocal(text) {
  const t = text.toLowerCase();
  if (t.includes('tasawwuf') || t.includes('sheikh') || t.includes('murakab')) return 'Tasawwuf';
  if (t.includes('salah') || t.includes('prayer') || t.includes('namaz')) return 'Ibaadat';
  if (t.includes('quran') || t.includes('ayah') || t.includes('tafsir')) return 'Quran';
  if (t.includes('halal') || t.includes('haram') || t.includes('permiss')) return 'Fiqh';
  if (t.includes('ramadan') || t.includes('roza')) return 'Ramadan';
  if (t.includes('character') || t.includes('akhlaq')) return 'Akhlaq';
  return 'General';
}

// ─── NOTIFICATIONS BANNER ───
function showBanner(msg) {
  const banner = document.getElementById('notif-banner');
  document.getElementById('banner-text').textContent = msg;
  banner.classList.add('visible');
  setTimeout(() => banner.classList.remove('visible'), 4000);
}

function closeBanner() {
  document.getElementById('notif-banner').classList.remove('visible');
}

// ─── LIVE STATS ───
function animateCount(el, target, suffix = '') {
  if (!el) return;
  // simplified for static quick update
  el.textContent = target + suffix; 
}

function renderStats() {
  animateCount(document.getElementById('stat-bayans'), store.bayans.length);
  animateCount(document.getElementById('stat-videos'), store.videos.length);
  animateCount(document.getElementById('stat-questions'), store.questions.length);
  animateCount(document.getElementById('stat-answered'), store.questions.filter(q => q.answered).length);
}

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
  initData();
  setTimeout(() => showBanner('Welcome to Khanqah Maseehul Ummat!'), 1500);
});
