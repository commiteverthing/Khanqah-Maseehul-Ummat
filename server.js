require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false
}));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});


// ─── AUTHENTICATION ───
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

app.get('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/admin/check', (req, res) => {
  if (req.session.isAdmin) {
    res.json({ isAdmin: true });
  } else {
    res.status(401).json({ isAdmin: false });
  }
});

// Admin Middleware
const requireAdmin = (req, res, next) => {
  if (req.session.isAdmin) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Helper to map _id to id for frontend compatibility
const mapId = (doc) => {
  const obj = doc.toObject();
  obj.id = obj._id;
  return obj;
};

// ─── BAYANS ───
app.get('/api/bayans', async (req, res) => {
  try {
    const bayans = await db.Bayan.find().sort({ _id: -1 });
    res.json(bayans.map(mapId));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bayans', requireAdmin, async (req, res) => {
  try {
    const newBayan = new db.Bayan(req.body);
    await newBayan.save();
    res.json({ success: true, id: newBayan._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/bayans/:id', requireAdmin, async (req, res) => {
  try {
    await db.Bayan.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── VIDEOS ───
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await db.Video.find().sort({ _id: -1 });
    res.json(videos.map(mapId));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/videos', requireAdmin, async (req, res) => {
  try {
    const newVideo = new db.Video(req.body);
    await newVideo.save();
    res.json({ success: true, id: newVideo._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/videos/:id', requireAdmin, async (req, res) => {
  try {
    await db.Video.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── QUESTIONS ───
app.get('/api/questions', async (req, res) => {
  try {
    const questions = await db.Question.find().sort({ _id: -1 });
    res.json(questions.map(mapId));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/questions', async (req, res) => {
  try {
    const newQuestion = new db.Question({ ...req.body, answered: false });
    await newQuestion.save();
    res.json({ success: true, id: newQuestion._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/questions/:id/answer', requireAdmin, async (req, res) => {
  try {
    await db.Question.findByIdAndUpdate(req.params.id, {
      answer: req.body.answer,
      answered: true
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/questions/:id', requireAdmin, async (req, res) => {
  try {
    await db.Question.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── NOTIFICATIONS ───
app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await db.Notification.find().sort({ _id: -1 });
    res.json(notifications.map(mapId));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/notifications', requireAdmin, async (req, res) => {
  try {
    const newNotification = new db.Notification(req.body);
    await newNotification.save();
    res.json({ success: true, id: newNotification._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/notifications/:id', requireAdmin, async (req, res) => {
  try {
    await db.Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── COURSES ───
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await db.Course.find().sort({ _id: -1 });
    res.json(courses.map(mapId));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/courses', requireAdmin, async (req, res) => {
  try {
    const newCourse = new db.Course(req.body);
    await newCourse.save();
    res.json({ success: true, id: newCourse._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/courses/:id', requireAdmin, async (req, res) => {
  try {
    await db.Course.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

async function startServer() {
  try {
    // 1. Wait for database connection
    console.log('Connecting to MongoDB...');
    await db.initDb();
    
    // 2. Start listening
    app.listen(PORT, () => {
      console.log(`✅ Server successfully connected and listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  }
}

startServer();

