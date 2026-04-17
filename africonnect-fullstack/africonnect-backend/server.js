require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { router: stripeRoutes, webhookHandler: stripeWebhookHandler } = require('./routes/stripe');
const authRoutes = require('./routes/auth');
const forumRoutes = require('./routes/forum');
const marketplaceRoutes = require('./routes/marketplace');
const jobRoutes = require('./routes/jobs');
const solutionRoutes = require('./routes/solutions');
const solidarityRoutes = require('./routes/solidarity');
const eventRoutes = require('./routes/events');
const groupRoutes = require('./routes/groups');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const uploadRoutes = require('./routes/upload');
const advertisementRoutes = require('./routes/advertisements');
const rssRoutes = require('./routes/rss');
const adRequestRoutes = require('./routes/adRequests');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });
app.set('io', io);

// Configuration CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:4200',
  'https://africanconnect.net',
  'https://www.africanconnect.net',
].filter(Boolean);

const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: (origin, cb) => {
    // Autorise les outils (curl/postman) sans Origin
    if (!origin) return cb(null, true);
    // En dev, on autorise toutes les origines (utile quand le frontend est ouvert via IP LAN)
    if (!isProduction) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Stripe webhook needs the raw body for signature verification
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques du dossier uploads
app.use('/uploads', express.static('uploads'));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .then(async () => {
    // Seed a default admin (configurable via env) without hardcoding secrets in code.
    // Required env:
    // - DEFAULT_ADMIN_EMAIL
    // - DEFAULT_ADMIN_PASSWORD
    // Optional:
    // - DEFAULT_ADMIN_PSEUDO
    try {
      const email = process.env.DEFAULT_ADMIN_EMAIL;
      const password = process.env.DEFAULT_ADMIN_PASSWORD;
      const pseudo = process.env.DEFAULT_ADMIN_PSEUDO || 'African';
      if (!email || !password) return;

      const existing = await User.findOne({ email });
      if (!existing) {
        const hashed = await bcrypt.hash(password, 10);
        await new User({
          email,
          password: hashed,
          role: 'admin',
          verified: true,
          pseudo
        }).save();
        console.log(`Default admin created: ${email}`);
      }
    } catch (e) {
      console.error('Default admin seed error:', e);
    }
  })
  .catch(err => console.error(err));
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/solutions', solutionRoutes);
app.use('/api/solidarity', solidarityRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/advertisements', advertisementRoutes);
app.use('/api/rss', rssRoutes);
app.use('/api/ad-requests', adRequestRoutes);
app.use('/api/notifications', require('./routes/notifications'));
io.use((socket,next)=>{ const jwt=require('jsonwebtoken'); const token=socket.handshake.auth.token; if(!token) return next(new Error('Auth error')); try{ const decoded=jwt.verify(token,process.env.JWT_SECRET); socket.userId=decoded.userId; next(); } catch(err){ next(new Error('Invalid token')); } });
io.on('connection',(socket)=>{ console.log('User connected:',socket.userId); socket.join(`user_${socket.userId}`); socket.on('private_message',async(data)=>{ const Message=require('./models/Message'); const message=new Message({from:String(socket.userId),to:String(data.toUserId),subject:data.subject?String(data.subject):'',content:String(data.content||''),timestamp:new Date()}); await message.save(); io.to(`user_${String(data.toUserId)}`).emit('new_message',message); io.to(`user_${String(socket.userId)}`).emit('new_message',message); }); });

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server on port ${PORT}`));