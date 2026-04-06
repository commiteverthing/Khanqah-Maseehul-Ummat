// Admin Auth State
let isLoggedIn = false;

// ─── INIT ───

// ─── ADMIN UX EXPERIENCES ───
function showAdminToast(msg, type = 'error') {
  const container = document.getElementById('admin-toast-container');
  if(!container) return;
  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;
  
  const icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>';
  toast.innerHTML = `${icon} <span>${msg}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 400); // Wait for transition
  }, 3500);
}

function renderEmptyState(containerId, iconClass, title, message) {
  const container = document.getElementById(containerId);
  if(!container) return;
  container.innerHTML = `
    <tr>
      <td colspan="100%">
        <div class="admin-empty-state stagger-1">
          <i class="${iconClass}"></i>
          <h3>${title}</h3>
          <p>${message}</p>
        </div>
      </td>
    </tr>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  // Check auth
  try {
    const res = await fetch('/api/admin/check');
    if (res.ok) {
      isLoggedIn = true;
      document.getElementById('login-overlay').classList.remove('active');
      document.getElementById('admin-dashboard').classList.add('active');
      loadAdminData();
    }
  } catch (err) { console.error('Needs login'); }
});

let categories = [];

async function refreshCategoryDropdowns(type = 'bayan') {
  const res = await fetch(`/api/categories?type=${type}`);
  const filteredCategories = await res.json();
  
  // Find which dropdowns to update based on type
  let targetIds = [];
  if (type === 'bayan') targetIds = ['add-bayan-cat'];
  else if (type === 'video') targetIds = ['add-video-cat'];
  else if (type === 'course') targetIds = ['add-course-cat'];
  else if (type === 'question') targetIds = ['ans-cat-global']; // New global selector or in-place
  else if (type === 'notification') targetIds = ['add-notif-type'];

  targetIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = filteredCategories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    }
  });
  
  return filteredCategories;
}

let activeQuickAddType = 'bayan';

async function openCatModal(type = 'bayan') {
  activeQuickAddType = type;
  document.getElementById('cat-modal').classList.add('active');
  document.getElementById('quick-cat-name').focus();
  
  // Render existing
  const cats = await refreshCategoryDropdowns(type);
  const list = document.getElementById('quick-cat-list');
  if (cats.length === 0) {
    list.innerHTML = '<p style="font-size:0.75rem; color:#95a5a6; text-align:center;">No categories yet.</p>';
  } else {
    list.innerHTML = cats.map(c => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:#f8fafc; margin-bottom:4px; border-radius:6px; font-size:0.85rem;">
        <span>${c.icon} ${c.name}</span>
        <button onclick="deleteQuickAddCategory('${c.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:0.8rem;"><i class="fas fa-trash"></i></button>
      </div>
    `).join('');
  }
}

async function deleteQuickAddCategory(id) {
  if (!confirm('Are you sure you want to delete this category?')) return;
  const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
  if (res.ok) {
    await refreshCategoryDropdowns(activeQuickAddType);
    openCatModal(activeQuickAddType); // Refresh list
  }
}
function closeCatModal() {
  document.getElementById('cat-modal').classList.remove('active');
  document.getElementById('quick-cat-name').value = '';
  document.getElementById('quick-cat-icon').value = '';
}

async function submitQuickAddCategory() {
  const name = document.getElementById('quick-cat-name').value.trim();
  const icon = document.getElementById('quick-cat-icon').value.trim() || '▪';
  if (!name) return showAdminToast('Name required');

  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, icon, order: 0, type: activeQuickAddType })
  });

  if (res.ok) {
    await refreshCategoryDropdowns(activeQuickAddType);
    closeCatModal();
  }
}



async function adminLogin() {
  const password = document.getElementById('admin-password').value;
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      isLoggedIn = true;
      document.getElementById('login-overlay').classList.remove('active');
      document.getElementById('login-error').textContent = '';
      document.getElementById('admin-dashboard').classList.add('active');
      loadAdminData();
    } else {
      document.getElementById('login-error').textContent = data.message || 'Invalid password';
    }
  } catch (err) {
    document.getElementById('login-error').textContent = 'Net Error';
  }
}

async function adminLogout() {
  await fetch('/api/admin/logout');
  isLoggedIn = false;
  document.getElementById('admin-dashboard').classList.remove('active');
  document.getElementById('login-overlay').classList.add('active');
  document.getElementById('admin-password').value = '';
}

// Handle sidebar click via event delegation — fixes bug where clicking icon/span breaks navigation
function handleSidebarClick(event) {
  const li = event.target.closest('li[data-tab]');
  if (!li) return;
  const tabId = li.dataset.tab;
  showAdminTab(tabId, li);
}

function showAdminTab(tabId, el) {
  // Hide all tabs and show target
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  const targetTab = document.getElementById(tabId);
  if (targetTab) targetTab.classList.add('active');

  // Update sidebar active state
  document.querySelectorAll('.admin-menu li').forEach(li => li.classList.remove('active'));
  
  const activeLi = el || document.querySelector(`.admin-menu li[data-tab="${tabId}"]`);
  if (activeLi) activeLi.classList.add('active');


  if (tabId === 'tab-bayans') loadBayans();
  if (tabId === 'tab-videos') loadVideos();
  if (tabId === 'tab-courses') loadCourses();
  if (tabId === 'tab-questions') loadQuestions();
  if (tabId === 'tab-notifications') loadNotifications();
  if (tabId === 'tab-dashboard') loadDashboardStats();
}



async function loadDashboardStats() {
  try {
    const [b, v, c, q] = await Promise.all([
      fetch('/api/bayans').then(r => r.json()),
      fetch('/api/videos').then(r => r.json()),
      fetch('/api/courses').then(r => r.json()),
      fetch('/api/questions').then(r => r.json())
    ]);
    
    document.getElementById('stat-bayans').textContent = b.length;
    document.getElementById('stat-videos').textContent = v.length;
    document.getElementById('stat-courses').textContent = c.length;
    document.getElementById('stat-questions').textContent = q.filter(it => !it.answered).length;
  } catch (err) {
    console.error('Stats error:', err);
  }
}

// ─── ADMIN TOOLS: AUTO-FETCHER ───
async function fetchMetadata(type) {
  const urlEl = document.getElementById(`add-${type}-url`);
  const url = urlEl.value.trim();
  if (!url) return showAdminToast('Please paste a URL first.');

  const btn = event.currentTarget;
  btn.classList.add('loading');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching...';

  try {
    const res = await fetch(`/api/admin/fetch-metadata?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.title) {
        document.getElementById(`add-${type}-title`).value = data.title;
        // Auto-detect category from title
        autoDetectCategory(type, data.title);
      }
    } else {
      showAdminToast('Could not fetch metadata for this link.');
    }
  } catch (err) {
    console.error(err);
    showAdminToast('Fetch failed.');
  } finally {
    btn.classList.remove('loading');
    btn.innerHTML = '<i class="fas fa-magic"></i> Fetch Info';
  }
}

function autoDetectCategory(type, title) {
  const t = title.toLowerCase();
  const select = document.getElementById(`add-${type}-cat`);
  if (!select) return;

  if (t.includes('quran') || t.includes('tilawat')) select.value = 'Quran';
  else if (t.includes('ramadan') || t.includes('roza')) select.value = 'Ramadan';
  else if (t.includes('tasawwuf') || t.includes('majlis')) select.value = 'Tasawwuf';
  else if (t.includes('akhlaq') || t.includes('character')) select.value = 'Akhlaq';
}



// ─── LOAD DATA ───
async function loadAdminData() {
  await Promise.all([
    refreshCategoryDropdowns('bayan'),
    refreshCategoryDropdowns('video'),
    refreshCategoryDropdowns('course'),
    refreshCategoryDropdowns('question'),
    refreshCategoryDropdowns('notification')
  ]);
  loadDashboardStats();
  loadBayans();
  loadVideos();
  loadCourses();
  loadQuestions();
  loadNotifications();
}



// ─── BAYANS ───
async function loadBayans() {
  const res = await fetch('/api/bayans');
  const items = await res.json();
  const tb = document.getElementById('table-bayans');
  if (items.length === 0) {
    renderEmptyState('table-bayans', 'fas fa-headphones', 'No Bayans Uploaded', 'Your library is empty. Add a new audio bayan above.');
  } else {
    tb.innerHTML = items.map(b => `
      <tr>
        <td style="font-weight:600">${b.title}</td>
        <td><span class="badge-cat">${b.category}</span></td>
        <td style="color:var(--admin-text-muted)">${b.date}</td>
        <td><button class="btn-del" onclick="deleteBayan('${b.id}')">Delete</button></td>
      </tr>
    `).join('');
  }
}

async function addBayan() {
  const title = document.getElementById('add-bayan-title').value;
  const url = document.getElementById('add-bayan-url').value;
  const category = document.getElementById('add-bayan-cat').value;
  let duration = document.getElementById('add-bayan-dur').value || '00:00';
  const date = new Date().toISOString().split('T')[0];

  if (!title || !url) return showAdminToast('Title and URL required');

  await fetch('/api/bayans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, url, category, duration, date })
  });

  document.getElementById('add-bayan-title').value = '';
  document.getElementById('add-bayan-url').value = '';
  document.getElementById('add-bayan-dur').value = '';
  showAdminToast('Audio Bayan published successfully!', 'success');
  loadBayans();
}

async function deleteBayan(id) {
  if (!confirm('Are you sure?')) return;
  await fetch('/api/bayans/' + id, { method: 'DELETE' });
  loadBayans();
}

// ─── VIDEOS ───
async function loadVideos() {
  const res = await fetch('/api/videos');
  const items = await res.json();
  const tb = document.getElementById('table-videos');
  if (items.length === 0) {
    renderEmptyState('table-videos', 'fas fa-video', 'No Videos Uploaded', 'Share visual guidance by adding a video above.');
  } else {
    tb.innerHTML = items.map(v => `
      <tr>
        <td style="font-weight:600">${v.title}</td>
        <td style="font-family:monospace; color:var(--admin-secondary)"><a href="https://youtu.be/${v.ytId}" target="_blank">Play <i class="fas fa-external-link-alt"></i></a></td>
        <td style="color:var(--admin-text-muted)">${v.date}</td>
        <td><button class="btn-del" onclick="deleteVideo('${v.id}')">Delete</button></td>
      </tr>
    `).join('');
  }

}

async function addVideo() {
  const title = document.getElementById('add-video-title').value;
  const url = document.getElementById('add-video-url').value;
  const date = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  if (!title || !url) return showAdminToast('Title and URL required');

  const ytId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
  if (!ytId) return showAdminToast('Invalid YT URL');

  await fetch('/api/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      title, 
      ytId: ytId[1], 
      category: document.getElementById('add-video-cat').value,
      date, 
      thumb: '' 
    })
  });


  document.getElementById('add-video-title').value = '';
  document.getElementById('add-video-url').value = '';
  showAdminToast('Video guidance added successfully!', 'success');
  loadVideos();
}

async function deleteVideo(id) {
  if (!confirm('Are you sure?')) return;
  await fetch('/api/videos/' + id, { method: 'DELETE' });
  loadVideos();
}

// ─── COURSES ───
async function loadCourses() {
  const res = await fetch('/api/courses');
  const items = await res.json();
  const tb = document.getElementById('table-courses');
  if (items.length === 0) {
    renderEmptyState('table-courses', 'fas fa-book-open', 'No Courses Running', 'Launch an online or physical course here.');
  } else {
    tb.innerHTML = items.map(c => `
      <tr>
        <td style="font-weight:600">${c.title}</td>
        <td><span class="badge-cat" style="background:#fef3c7; color:#92400e;">${c.status}</span></td>
        <td style="color:var(--admin-text-muted)">${c.duration}</td>
        <td><button class="btn-del" onclick="deleteCourse('${c.id}')">Delete</button></td>
      </tr>
    `).join('');
  }

}

async function addCourse() {
  const title = document.getElementById('add-course-title').value;
  const arabicTitle = document.getElementById('add-course-arabic').value;
  const description = document.getElementById('add-course-desc').value;
  const status = document.getElementById('add-course-status').value || 'Ongoing';
  const duration = document.getElementById('add-course-dur').value || 'TBA';
  const location = document.getElementById('add-course-loc').value || 'Online';
  const category = document.getElementById('add-course-cat').value;
  const thumbnailInput = document.getElementById('add-course-thumbnail');

  if (!title || !description) return showAdminToast('Title and Description required');

  const formData = new FormData();
  formData.append('title', title);
  formData.append('arabicTitle', arabicTitle);
  formData.append('description', description);
  formData.append('category', category);
  formData.append('status', status);
  formData.append('duration', duration);
  formData.append('location', location);
  
  if (thumbnailInput.files.length > 0) {
    if (thumbnailInput.files[0].size > 2 * 1024 * 1024) {
      return showAdminToast('Thumbnail size exceeds 2MB limit.');
    }
    formData.append('thumbnail', thumbnailInput.files[0]);
  }

  try {
    const response = await fetch('/api/courses', {
      method: 'POST',
      body: formData // Fetch handles multipart boundaries natively
    });
    
    if (!response.ok) {
      const errData = await response.json();
      return showAdminToast(errData.error || 'Upload failed');
    }

    document.getElementById('add-course-title').value = '';
    document.getElementById('add-course-arabic').value = '';
    document.getElementById('add-course-desc').value = '';
    document.getElementById('add-course-status').value = '';
    document.getElementById('add-course-dur').value = '';
    document.getElementById('add-course-loc').value = '';
    thumbnailInput.value = ''; // Reset file input
    showAdminToast('Course published successfully!', 'success');
  } catch(err) {
    showAdminToast('A network error occurred.');
  }
  loadCourses();
}

async function deleteCourse(id) {
  if (!confirm('Are you sure?')) return;
  await fetch('/api/courses/' + id, { method: 'DELETE' });
  loadCourses();
}


// ─── QUESTIONS ───
async function loadQuestions() {
  try {
    const [qRes, cRes] = await Promise.all([
      fetch('/api/questions'),
      fetch('/api/categories?type=question')
    ]);
    const items = await qRes.json();
    const questionCategories = await cRes.json();
    
    const pending = items.filter(q => !q.answered);
    const answered = items.filter(q => q.answered);

    // Pass categories to each pending item
    pending.forEach(q => q.questionCategories = questionCategories);

    // Render Pending
    const pendingList = document.getElementById('pending-questions-list');
    if (pending.length === 0) {
      pendingList.innerHTML = `
        <div class="admin-empty-state stagger-1">
          <i class="fas fa-check-double"></i>
          <h3>All Caught Up!</h3>
          <p>There are no pending questions to answer at the moment.</p>
        </div>
      `;
    } else {
      pendingList.innerHTML = pending.map(q => `
        <div class="q-card">
          <h4>
            <span><i class="fas fa-clock"></i> Received: ${q.date}</span> 
            <span class="badge-cat" style="background:#fef3c7; color:#92400e;">Pending</span>
          </h4>
          <div class="q-text">${q.question}</div>
          <div style="color:var(--admin-text-muted); font-size:0.85rem; margin-bottom:1.5rem; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-user-circle"></i> From seeker: <strong>Anonymous Seeker</strong>
          </div>
          
          <div class="form-group" style="margin-bottom:1.5rem; background:#f8fafc; padding:1rem; border-radius:12px;">
            <label class="form-label" style="font-size:0.75rem; color:var(--admin-secondary)">Categorize Quest: <a href="javascript:void(0)" onclick="openCatModal('question')" style="font-size:0.65rem; color:var(--admin-primary); margin-left:8px;">(+ New)</a></label>
            <select id="ans-cat-${q.id}" class="form-input" style="border-color:var(--admin-border)">
              ${q.questionCategories.map(c => `<option value="${c.name}" ${c.name === q.category ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          </div>

          <label class="form-label" style="font-size:0.75rem; color:var(--admin-primary)">Your Spiritual Guidance:</label>
          <textarea id="ans-text-${q.id}" class="form-input" rows="5" style="margin-bottom:1.5rem; border-color:var(--admin-border)" placeholder="Write a compassionate and helpful response..."></textarea>

          <div style="display:flex; justify-content:flex-end; gap:12px;">
            <button class="btn-del" onclick="deleteQuestion('${q.id}')"><i class="fas fa-times"></i> Dismiss</button>
            <button class="btn-primary" onclick="submitAnswer('${q.id}')"><i class="fas fa-paper-plane"></i> Publish Answer</button>
          </div>
        </div>
      `).join('');
    }

    // Render Answered
    const answeredList = document.getElementById('answered-questions-list');
    if (answered.length === 0) {
      answeredList.innerHTML = `
        <div class="admin-empty-state stagger-2">
          <i class="fas fa-inbox"></i>
          <h3>No Answered Questions</h3>
          <p>Published answers to seeker questions will appear here.</p>
        </div>
      `;
    } else {
      answeredList.innerHTML = answered.map(q => `
        <div class="q-card answered" id="q-card-${q.id}">
          <h4>
            <span><i class="fas fa-calendar-alt"></i> ${q.date}</span> 
            <span class="badge-cat">${q.category}</span>
          </h4>
          <div class="q-text">${q.question}</div>
          <div style="color:var(--admin-text-muted); font-size:0.85rem; margin-bottom:1.5rem; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-user-circle"></i> Asked by: <strong>Anonymous Seeker</strong>
          </div>
          
          <div id="ans-display-${q.id}" class="ans-section">
            <span class="ans-label">Verified Answer</span>
            <div class="ans-content" style="line-height:1.7; color:var(--admin-text-main)">${q.answer}</div>
            <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:1.5rem; border-top:1px solid #e2e8f0; padding-top:1rem;">
              <button class="btn-del" onclick="deleteQuestion('${q.id}')"><i class="fas fa-trash"></i> Delete</button>
              <button class="btn-primary" style="padding:8px 18px; font-size:0.8rem;" onclick="showEditMode('${q.id}', '${q.answer.replace(/'/g, "\\'").replace(/\n/g, "\\n")}')"><i class="fas fa-edit"></i> Edit Answer</button>
            </div>
          </div>
          
          <div id="ans-edit-${q.id}" style="display:none; margin-top:1.5rem; background:#fff; padding:1rem; border-radius:12px; border:1px solid var(--admin-primary)">
            <label style="font-weight:700; font-size:0.9rem; display:block; margin-bottom:1rem; color:var(--admin-primary)">Edit Spiritual Response:</label>
            <textarea id="edit-text-${q.id}" class="form-input" rows="6" style="margin-bottom:1rem; border-color:var(--admin-primary)"></textarea>
            <div style="display:flex; justify-content:flex-end; gap:12px;">
              <button onclick="cancelEdit('${q.id}')" style="background:#f1f5f9; color:#475569; border:none; padding:8px 16px; border-radius:8px; cursor:pointer; font-weight:600;">Cancel</button>
              <button class="btn-primary" onclick="updateAnswer('${q.id}')">Save Changes</button>
            </div>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading questions:', err);
  }
}

async function submitAnswer(id) {
  const answer = document.getElementById('ans-text-' + id).value.trim();
  if (!answer) return showAdminToast('Please enter an answer.');

  const category = document.getElementById('ans-cat-' + id).value;

  await fetch(`/api/questions/${id}/answer`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer, category })
  });

  
  loadQuestions();
}

function showEditMode(id, currentAnswer) {
  document.getElementById(`ans-display-${id}`).style.display = 'none';
  document.getElementById(`ans-edit-${id}`).style.display = 'block';
  document.getElementById(`edit-text-${id}`).value = currentAnswer;
}

function cancelEdit(id) {
  document.getElementById(`ans-display-${id}`).style.display = 'block';
  document.getElementById(`ans-edit-${id}`).style.display = 'none';
}

async function updateAnswer(id) {
  const newAnswer = document.getElementById(`edit-text-${id}`).value.trim();
  if (!newAnswer) return showAdminToast('Answer cannot be empty.');

  await fetch(`/api/questions/${id}/answer`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer: newAnswer })
  });
  
  loadQuestions();
}

async function deleteQuestion(id) {
  if (!confirm('Are you sure you want to permanently delete this question?')) return;
  await fetch(`/api/questions/${id}`, { method: 'DELETE' });
  loadQuestions();
}



// ─── NOTIFICATIONS ───
async function loadNotifications() {
  const res = await fetch('/api/notifications');
  const items = await res.json();
  const tb = document.getElementById('table-notifications');
  if (items.length === 0) {
    renderEmptyState('table-notifications', 'fas fa-bell', 'No Active Alerts', 'Keep your community informed. Send a push notification above.');
  } else {
    tb.innerHTML = items.map(n => `
      <tr>
        <td style="font-weight:600">${n.title}</td>
        <td><span class="badge-cat">${n.type}</span></td>
        <td style="color:var(--admin-text-muted)">${n.date}</td>
        <td><button class="btn-del" onclick="deleteNotification('${n.id}')">Delete</button></td>
      </tr>
    `).join('');
  }

}

async function addNotification() {
  const type = document.getElementById('add-notif-type').value;
  const badge = document.getElementById('add-notif-badge').value || 'Alert';
  const arabic = document.getElementById('add-notif-arabic').value || 'إِعْلَان';
  const title = document.getElementById('add-notif-title').value;
  const body = document.getElementById('add-notif-body').value;
  const date = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  if (!title || !body) return showAdminToast('Title and body required');

  await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, badge, arabic, title, body, date })
  });

  document.getElementById('add-notif-title').value = '';
  document.getElementById('add-notif-body').value = '';
  showAdminToast('Notification published successfully!', 'success');
  loadNotifications();
}

async function deleteNotification(id) {
  if (!confirm('Are you sure?')) return;
  await fetch('/api/notifications/' + id, { method: 'DELETE' });
  loadNotifications();
}

// ─── CATEGORIES ───
async function loadCategories() {
  const res = await fetch('/api/categories');
  const items = await res.json();
  categories = items;
  const tb = document.getElementById('table-categories');
  if (items.length === 0) {
    renderEmptyState('table-categories', 'fas fa-tags', 'No Categories Defined', 'Organize your content by adding categories.');
  } else {
    tb.innerHTML = items.map(c => `
      <tr>
        <td style="font-weight:600">${c.name}</td>
        <td style="font-size:1.2rem">${c.icon}</td>
        <td>${c.order}</td>
        <td><button class="btn-del" onclick="deleteCategory('${c.id}')">Delete</button></td>
      </tr>
    `).join('');
  }
}

async function addCategory() {
  const name = document.getElementById('add-cat-name').value.trim();
  const icon = document.getElementById('add-cat-icon').value.trim() || '▪';
  const order = parseInt(document.getElementById('add-cat-order').value) || 0;

  if (!name) return showAdminToast('Category name is required');

  await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, icon, order })
  });

  document.getElementById('add-cat-name').value = '';
  document.getElementById('add-cat-icon').value = '';
  document.getElementById('add-cat-order').value = '0';
  
  showAdminToast('Category added successfully!', 'success');
  await refreshCategoryDropdowns();
  loadCategories();
}

async function deleteCategory(id) {
  if (!confirm('Are you sure? Removing a category will not delete items in that category, but they may not show up in filters.')) return;
  await fetch('/api/categories/' + id, { method: 'DELETE' });
  await refreshCategoryDropdowns();
  loadCategories();
}

