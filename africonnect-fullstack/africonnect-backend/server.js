require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
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
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });
app.set('io', io);

const multer = require('multer');
const path = require('path');

// Configuration multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// Servir les fichiers statiques du dossier uploads
app.use('/uploads', express.static('uploads'));

app.use(cors()); app.use(express.json()); app.use('/uploads', express.static('uploads'));
mongoose.connect(process.env.MONGODB_URI).then(()=>console.log('MongoDB connected')).catch(err=>console.error(err));
app.use('/api/auth', authRoutes);
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
io.use((socket,next)=>{ const jwt=require('jsonwebtoken'); const token=socket.handshake.auth.token; if(!token) return next(new Error('Auth error')); try{ const decoded=jwt.verify(token,process.env.JWT_SECRET); socket.userId=decoded.userId; next(); } catch(err){ next(new Error('Invalid token')); } });
io.on('connection',(socket)=>{ console.log('User connected:',socket.userId); socket.join(`user_${socket.userId}`); socket.on('private_message',async(data)=>{ const Message=require('./models/Message'); const message=new Message({from:socket.userId,to:data.toUserId,content:data.content,timestamp:new Date()}); await message.save(); io.to(`user_${data.toUserId}`).emit('new_message',message); io.to(`user_${socket.userId}`).emit('new_message',message); }); });
server.listen(process.env.PORT,()=>console.log(`Server on port ${process.env.PORT}`));