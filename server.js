// server.js
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const multer = require('multer');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');

const sequelize = require('./db');
const User = require('./models/user');
const Blog = require('./models/blog');
const BlogComment = require('./models/blogcomment');
const BlogLike = require('./models/bloglike');
// Store Private Group Codes in Memory
const privateGroups = {};  // Format: { groupId: code }
const PrivateChat = require('./models/privatechat');
const Group = require('./models/group');
const GroupChat = require('./models/groupchat');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // To parse JSON bodies

app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


function requireAuth(req, res, next) {
  if (req.session && req.session.user) next();
  else res.redirect('/');
}

app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/home');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/register', (req, res) => { 
  res.sendFile(path.join(__dirname, 'public', 'register.html')); 
});

// New endpoint to send OTP to the user's email
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.json({ success: false, error: 'Email is required.' });
  }
  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  req.session.otp = otp;
  req.session.otpEmail = email;

  // Configure NodeMailer using Gmail SMTP
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'otpgmali@gmail.com',       // Replace with your Gmail address
      pass: 'fvalhzjlxpxnykja'            // Replace with your Gmail password or app password
    }
  });

  const mailOptions = {
    from: 'yourgmail@gmail.com',
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      return res.json({ success: false, error: 'Failed to send OTP.' });
    } else {
      console.log('OTP email sent: ' + info.response);
      return res.json({ success: true });
    }
  });
});

app.post('/register', async (req, res) => {
  const { username, email, password, otp } = req.body;
  // Verify OTP and email
  if (!req.session.otp || otp !== req.session.otp || email !== req.session.otpEmail) {
    return res.redirect('/register?error=' + encodeURIComponent('Invalid or expired OTP.'));
  }
  try {
    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.redirect('/register?error=' + encodeURIComponent('Username already exists.'));
    }
    const newUser = await User.create({ username, email, password });
    req.session.user = { id: newUser.id, username: newUser.username, email: newUser.email };
    // Clear OTP details from session after successful registration
    req.session.otp = null;
    req.session.otpEmail = null;
    res.redirect('/home');
  } catch (err) {
    console.error(err);
    return res.redirect('/register?error=' + encodeURIComponent('Registration error.'));
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username, password } });
    if (user) {
      req.session.user = { id: user.id, username: user.username, email: user.email };
      res.redirect('/home');
    } else {
      return res.redirect('/?error=' + encodeURIComponent('Invalid credentials.'));
    }
  } catch (err) {
    console.error(err);
    return res.redirect('/?error=' + encodeURIComponent('Login error.'));
  }
});

app.get('/home', requireAuth, (req, res) => { 
  res.sendFile(path.join(__dirname, 'public', 'home.html')); 
});
// API route to return session username
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ username: req.session.user.username });
});

app.get('/friend', requireAuth, (req, res) => { 
  res.sendFile(path.join(__dirname, 'public', 'friend.html')); 
});
app.get('/group', requireAuth, (req, res) => { 
  res.sendFile(path.join(__dirname, 'public', 'group.html')); 
});
app.get('/admin', requireAuth, async (req, res) => {
  if (req.session.user.username !== 'admin') return res.send("Access denied. (Admin: username=admin, password=000)");
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
app.get('/logout', (req, res) => { 
  req.session.destroy(); 
  res.redirect('/');
});

// API endpoints for admin management and chat retrieval...
app.get('/api/users', requireAuth, async (req, res) => { 
  const users = await User.findAll(); 
  res.json(users); 
});
app.delete('/api/users/:id', requireAuth, async (req, res) => {
  try { 
    await User.destroy({ where: { id: req.params.id } }); 
    res.json({ success: true }); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});
app.get('/api/blogs', requireAuth, async (req, res) => { 
  const blogs = await Blog.findAll({ order: [['id', 'DESC']] }); 
  res.json(blogs); 
});
app.delete('/api/blogs/:id', requireAuth, async (req, res) => {
  try { 
    await Blog.destroy({ where: { id: req.params.id } }); 
    res.json({ success: true }); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});
app.get('/api/groups', requireAuth, async (req, res) => { 
  const groups = await Group.findAll({ order: [['id', 'DESC']] }); 
  res.json(groups); 
});
app.delete('/api/groups/:id', requireAuth, async (req, res) => {
  try { 
    await Group.destroy({ where: { id: req.params.id } }); 
    res.json({ success: true }); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});
// Admin can delete blog comments
app.delete('/api/blogcomments/:id', requireAuth, async (req, res) => {
  if (req.session.user.username !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    await BlogComment.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin can delete group chat messages (text or media)
app.delete('/api/groupchats/:id', requireAuth, async (req, res) => {
  if (req.session.user.username !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    await GroupChat.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/blogcomments', requireAuth, async (req, res) => {
  const blogId = req.query.blogId;
  try { 
    const comments = await BlogComment.findAll({ where: { blogId }, order: [['createdAt', 'ASC']] }); 
    res.json(comments); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});
app.get('/api/privatechats', requireAuth, async (req, res) => {
  const { user1, user2 } = req.query;
  try {
    const chats = await PrivateChat.findAll({
      where: { 
        [Op.or]: [ 
          { sender: user1, receiver: user2 }, 
          { sender: user2, receiver: user1 } 
        ] 
      },
      order: [['createdAt', 'ASC']]
    });
    res.json(chats);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});
app.get('/api/groupchats', requireAuth, async (req, res) => {
  const { groupId } = req.query;
  try {
    const chats = await GroupChat.findAll({ where: { groupId }, order: [['createdAt', 'ASC']] });
    res.json(chats);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// File upload endpoint for blog images
const storage = multer.diskStorage({
  destination: (req, file, cb) => { 
    cb(null, 'public/uploads/'); 
  },
  filename: (req, file, cb) => { 
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); 
  }
});
const upload = multer({ storage });
const tempUpload = multer({ storage: multer.memoryStorage() });
app.post('/upload', upload.single('blogImage'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});
// 📁 Group Chat Media Upload (images, PDFs etc.)
const groupStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/group_media'); // Make sure this folder exists!
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
// 📁 Private Chat Media Upload
const privateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/private_media');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const privateUpload = multer({ storage: privateStorage });

app.post('/upload/privatemedia', requireAuth, privateUpload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/private_media/${req.file.filename}`;
  res.json({
    url,
    name: req.file.originalname
  });
});

const groupUpload = multer({ storage: groupStorage });

app.post('/upload/groupmedia', requireAuth, groupUpload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/group_media/${req.file.filename}`;
  res.json({
    url,
    name: req.file.originalname
  });
});

app.get('/search/users', requireAuth, async (req, res) => {
  const q = req.query.q;
  try { 
    const results = await User.findAll({ where: { username: { [Op.like]: `%${q}%` } } }); 
    res.json(results); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});
app.post('/chat-upload', tempUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const base64 = req.file.buffer.toString('base64');
  const mimeType = req.file.mimetype;
  const originalName = req.file.originalname;

  res.json({
    base64,
    mimeType,
    name: originalName
  });
});


// Socket.IO events
const onlineUsers = {};
io.on('connection', (socket) => {
  console.log("Socket connected: " + socket.id);
  
  // Register user and store their socket ID
  socket.on('register user', (data) => { 
    onlineUsers[data.username] = socket.id; 
  });
  
  // --- Whiteboard Event Handlers ---
 socket.on('whiteboard start', (data) => {
  const room = 'group-' + data.groupId;
  socket.to(room).emit('whiteboard start', data);
});

socket.on('whiteboard draw', (data) => {
  const room = 'group-' + data.groupId;
  socket.to(room).emit('whiteboard draw', data);
});
 socket.on('whiteboard end', (data) => {
  const room = 'group-' + data.groupId;
  socket.to(room).emit('whiteboard end', data);
});
 socket.on('whiteboard clear', (data) => {
  const room = 'group-' + data.groupId;
  socket.to(room).emit('whiteboard clear', data);
});
  
  // Group room events
  socket.on('join group', (data) => {
    const room = 'group-' + data.groupId;
    socket.join(room);
    console.log(`${data.username} joined room ${room}`);
  });
  socket.on('leave group', (data) => {
    const room = 'group-' + data.groupId;
    socket.leave(room);
    console.log(`${data.username} left room ${room}`);
  });
  
  // Private chat
  socket.on('private message', async (data) => {
    await PrivateChat.create({ sender: data.from, receiver: data.to, message: data.message });
    const targetSocket = onlineUsers[data.to];
    if (targetSocket) io.to(targetSocket).emit('private message', data);
    socket.emit('private message', data);
  });
  
  // Group chat - broadcast only to the room for that group
  socket.on('group message', async (data) => {
    await GroupChat.create({ groupId: data.groupId, username: data.username, message: data.message });
    const room = 'group-' + data.groupId;
    io.to(room).emit('group message', data);
  });
  
  // Blog creation
 socket.on('create blog', async (data) => {
  if (!data.username || !data.content) {
    return socket.emit('error', { message: 'Missing blog content or username.' });
  }

  try {
    const newBlog = await Blog.create({
      username: data.username,
      content: data.content,
      image: data.image || '',
      likes: 0
    });
    io.emit('new blog', newBlog);
  } catch (err) {
    console.error('Error creating blog:', err);
    socket.emit('error', { message: 'Failed to create blog.' });
  }
});

  
  // Blog like toggle
  socket.on('blog like', async (data) => {
    const existing = await BlogLike.findOne({ where: { blogId: data.blogId, username: data.username } });
    if (existing) { 
      await existing.destroy(); 
    } else { 
      await BlogLike.create({ blogId: data.blogId, username: data.username }); 
    }
    const count = await BlogLike.count({ where: { blogId: data.blogId } });
    const blog = await Blog.findByPk(data.blogId);
    blog.likes = count;
    await blog.save();
    io.emit('blog updated', blog);
  });
  
  // Blog comment
  socket.on('blog comment', async (data) => {
    await BlogComment.create({ blogId: data.blogId, username: data.username, comment: data.comment });
    io.emit('blog comment', data);
  });
  
  // Create group event handler
socket.on('create group', async (data) => {
  try {
    const newGroup = await Group.create({
      groupName: data.groupName,
      createdBy: data.createdBy,
      code: data.isPrivate ? data.code : null
    });
    io.emit('new group', newGroup);
  } catch (err) {
    console.error("Error creating group:", err);
  }
});

// Check if group is private
socket.on('check private group', async (data, callback) => {
  try {
    const group = await Group.findByPk(data.groupId);
    callback(!!group.code);
  } catch {
    callback(false);
  }
});


// Verify private group code
socket.on('verify group code', async (data, callback) => {
  try {
    const group = await Group.findByPk(data.groupId);
    callback(group && group.code === data.code);
  } catch (err) {
    console.error("Code verification error:", err);
    callback(false);
  }
});


  
  // --- Mic (Voice Chat) Signaling ---
  socket.on('voice-ready', (data) => {
    const room = 'group-' + data.groupId;
    const usersInRoom = [];

    const clients = io.sockets.adapter.rooms.get(room);
    if (clients) {
        clients.forEach(socketId => {
            for (const [username, id] of Object.entries(onlineUsers)) {
                if (id === socketId) {
                    usersInRoom.push(username);
                }
            }
        });
    }

    io.to(room).emit('voice-users', { users: usersInRoom });
});

  socket.on('voice-offer', (data) => {
    const targetSocket = onlineUsers[data.to];
    if (targetSocket) io.to(targetSocket).emit('voice-offer', data);
  });
  socket.on('voice-answer', (data) => {
    const targetSocket = onlineUsers[data.to];
    if (targetSocket) io.to(targetSocket).emit('voice-answer', data);
  });
  socket.on('voice-candidate', (data) => {
    const targetSocket = onlineUsers[data.to];
    if (targetSocket) io.to(targetSocket).emit('voice-candidate', data);
  });
  socket.on('voice-stop', (data) => {
    socket.broadcast.emit('voice-stop', data);
  });
  
  // --- Screen Sharing Signaling ---
 socket.on('screen-share-ready', (data) => {
    const room = 'group-' + data.groupId;
    const usersInRoom = [];

    const clients = io.sockets.adapter.rooms.get(room);
    if (clients) {
        clients.forEach(socketId => {
            for (const [username, id] of Object.entries(onlineUsers)) {
                if (id === socketId) {
                    usersInRoom.push(username);
                }
            }
        });
    }

    io.to(room).emit('screen-share-users', { users: usersInRoom });
});

  socket.on('screen-share-offer', (data) => {
    const targetSocket = onlineUsers[data.to];
    if (targetSocket) io.to(targetSocket).emit('screen-share-offer', data);
  });
  socket.on('screen-share-answer', (data) => {
    const targetSocket = onlineUsers[data.to];
    if (targetSocket) io.to(targetSocket).emit('screen-share-answer', data);
  });
  socket.on('screen-share-candidate', (data) => {
    const targetSocket = onlineUsers[data.to];
    if (targetSocket) io.to(targetSocket).emit('screen-share-candidate', data);
  });
  socket.on('screen-share-stop', (data) => {
    socket.broadcast.emit('screen-share-stop', data);
  });
  
  // Existing mic toggle and placeholder for screen share
  socket.on('mic toggle', (data) => { 
    io.emit('mic toggle', data); 
  });
  socket.on('screen share', (data) => { 
    io.emit('screen share', data); 
  });
  
  socket.on('disconnect', () => {
    for (const [username, id] of Object.entries(onlineUsers)) {
      if (id === socket.id) { 
        delete onlineUsers[username]; 
        break; 
      }
    }
    console.log("Socket disconnected: " + socket.id);
  });
});

sequelize.sync({ force: false }).then(async () => {
  // Create admin user if not exists
  const adminExists = await User.findOne({ where: { username: 'admin' } });
  if (!adminExists) {
    await User.create({ username: 'admin', email: 'admin@example.com', password: '000' });
    console.log("Admin user created: admin/000");
  }
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => console.error("DB sync error:", err));
