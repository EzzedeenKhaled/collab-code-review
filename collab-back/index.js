const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const vm = require('vm');

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);


app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const sessions = new Map();

const getUsernameFromEmail = (email) => {
  if (!email) return 'Anonymous';
  return email.split('@')[0];
};

const cleanupInactiveUsers = (sessionId) => {
  if (!sessions.has(sessionId)) return;

  const session = sessions.get(sessionId);
  const now = Date.now();
  const INACTIVE_THRESHOLD = 30 * 60 * 1000;

  for (const [socketId, user] of session.users) {
    if (now - user.lastActive > INACTIVE_THRESHOLD) {
      session.users.delete(socketId);
      console.log(`Cleaned up inactive user: ${user.name} (${socketId})`);
    }
  }
};


app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    sessions: Array.from(sessions.keys()),
    totalUsers: Array.from(sessions.values()).reduce((total, session) => total + session.users.size, 0),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/sessions/:id', async (req, res) => {
  const sessionId = req.params.id;

  try {
    const dbSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        owner: true,
        _count: {
          select: {
            comments: true
          }
        }
      }
    });

    if (!dbSession) {
      return res.status(404).json({ error: 'Session not found' });
    }


    const memorySession = sessions.get(sessionId);

    res.json({
      id: dbSession.id,
      sessionNumber: dbSession.sessionNumber,
      title: dbSession.title,
      language: dbSession.language,
      isActive: dbSession.isActive,
      createdAt: dbSession.createdAt,
      owner: dbSession.owner,
      commentCount: dbSession._count.comments,
      userCount: memorySession ? memorySession.users.size : 0,
      codeLength: memorySession ? memorySession.code.length : dbSession.code.length,
      users: memorySession ? Array.from(memorySession.users.entries()).map(([id, user]) => ({
        id,
        name: user.name,
        color: user.color,
        joinedAt: user.joinedAt,
        lastActive: user.lastActive
      })) : []
    });
  } catch (err) {
    console.error('Error fetching session:', err);
    res.status(500).json({ error: 'Failed to fetch session', details: err.message });
  }
});


app.post('/api/sessions', async (req, res) => {
  console.log('Creating new session');
  const { userId, userName, title } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    let owner = await prisma.user.findUnique({ where: { clerkId: userId } });

    if (!owner) {
      const tempEmail = userName && userName.includes('@') ? userName : `${userId}@temp.com`;
      owner = await prisma.user.create({
        data: {
          clerkId: userId,
          firstName: userName || 'Anonymous',
          email: tempEmail
        }
      });
    }


    const session = await prisma.session.create({
      data: {
        title: title || `Session ${new Date().toLocaleString()}`,
        ownerId: owner.id,
        code: '// Start coding...',
        language: 'javascript'
      },
      include: {
        owner: true,
        _count: {
          select: {
            comments: true
          }
        }
      }
    });

    console.log('Session created:', session);
    res.json(session);
  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).json({ error: 'Failed to create session', details: err.message });
  }
});


app.get('/api/users/:userId/sessions', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const sessions = await prisma.session.findMany({
      where: { ownerId: user.id },
      include: {
        owner: true,
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json(sessions);
  } catch (err) {
    console.error('Error fetching user sessions:', err);
    res.status(500).json({ error: 'Failed to fetch sessions', details: err.message });
  }
});

app.get('/api/sessions/:id/comments', async (req, res) => {
  const sessionId = req.params.id;
  try {
    const comments = await prisma.comment.findMany({
      where: { sessionId },
      include: { author: true },
      orderBy: { createdAt: 'asc' }
    });
    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.post('/api/sessions/:id/comments', async (req, res) => {
  console.log('Adding comment to session:', req.params.id);
  const sessionId = req.params.id;
  const { content, lineNumber, userId, userName } = req.body;

  if (!content || !lineNumber || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    let author = await prisma.user.findUnique({ where: { clerkId: userId } });

    if (!author) {

      const tempEmail = userName && userName.includes('@') ? userName : `${userName}@temp.com`;
      const displayName = getUsernameFromEmail(userName || '');
      author = await prisma.user.create({
        data: {
          clerkId: userId,
          firstName: displayName,
          email: tempEmail
        }
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        lineNumber: parseInt(lineNumber),
        sessionId,
        authorId: author.id
      },
      include: { author: true }
    });

    console.log('Comment created:', comment);

    io.to(sessionId).emit('comment-added', comment);

    res.json(comment);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Failed to add comment', details: err.message });
  }
});

app.post('/api/sessions/:id/save', async (req, res) => {
  const sessionId = req.params.id;
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        code: code,
        updatedAt: new Date()
      }
    });

    console.log(`Session ${sessionId} code saved to database`);
    res.json({ success: true, message: 'Code saved successfully' });
  } catch (err) {
    console.error('Error saving session code:', err);
    res.status(500).json({ error: 'Failed to save code', details: err.message });
  }
});

app.get('/api/sessions', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.json({ sessions: [] });
    const sessions = await prisma.session.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

app.post('/api/sessions/:id/run', async (req, res) => {
  const sessionId = req.params.id;
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    let output = '';
    let errorOutput = '';


    const sandbox = {
      console: {
        log: (...args) => {
          output += args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ') + '\n';
        },
        error: (...args) => {
          errorOutput += args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ') + '\n';
        },
        warn: (...args) => {
          errorOutput += '[WARN] ' + args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ') + '\n';
        }
      },
      setTimeout, setInterval, clearTimeout, clearInterval,
      Math, Date, JSON, String, Number, Boolean, Array, Object, Buffer,
      process: { env: {}, version: process.version, versions: process.versions }
    };

    const context = vm.createContext(sandbox);
    const result = vm.runInContext(code, context, {
      timeout: 5000,
      displayErrors: true,
      filename: 'user-code.js'
    });
    if (result !== undefined) {
      output += `\n--- Return value ---\n${typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}\n`;
    }
    const finalOutput = (output + errorOutput).trim();

    io.to(sessionId).emit('run-output', {
      output: finalOutput || '(No output)',
      error: null
    });

    res.json({
      output: finalOutput || '(No output)',
      error: null
    });
  } catch (err) {
    io.to(sessionId).emit('run-output', {
      output: '',
      error: err.message
    });
    res.json({
      output: '',
      error: err.message
    });
  }
});


io.on('connection', (socket) => {
  console.log('User connected:', socket.id);


  socket.on('join-session', async ({ sessionId, userName, userColor }) => {
    console.log(`Join session request for: ${sessionId} from ${socket.id} (${userName})`);

    try {

      const dbSession = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { owner: true }
      });

      if (!dbSession) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }


      const comments = await prisma.comment.findMany({
        where: { sessionId },
        include: { author: true },
        orderBy: { createdAt: 'asc' }
      });
      socket.emit('comments-init', comments);
    } catch (err) {
      console.error('Error fetching session/comments for new user:', err);
      socket.emit('comments-init', []);
    }

    if (!sessions.has(sessionId)) {
      try {
        const dbSession = await prisma.session.findUnique({
          where: { id: sessionId }
        });

        sessions.set(sessionId, {
          code: dbSession?.code || '// Start coding...',
          users: new Map()
        });
        console.log(`Created new in-memory session: ${sessionId}`);
      } catch (err) {
        console.error('Error initializing session from database:', err);
        sessions.set(sessionId, {
          code: '// Start coding...',
          users: new Map()
        });
      }
    }

    const session = sessions.get(sessionId);


    session.users.set(socket.id, {
      name: userName,
      color: userColor,
      cursor: null,
      joinedAt: Date.now(),
      lastActive: Date.now()
    });

    socket.join(sessionId);
    socket.sessionId = sessionId;


    socket.emit('code-update', session.code);


    const userList = Array.from(session.users.entries()).map(([socketId, user]) => ({
      id: socketId,
      name: user.name,
      color: user.color,
      cursor: user.cursor
    }));
    io.to(sessionId).emit('users-update', userList);

    console.log(`User ${userName} (${socket.id}) joined session ${sessionId}. Total users: ${session.users.size}`);
  });


  socket.on('cursor-update', ({ sessionId, cursor }) => {
    if (sessions.has(sessionId)) {
      const session = sessions.get(sessionId);
      if (session.users.has(socket.id)) {
        const user = session.users.get(socket.id);
        user.cursor = cursor;
        user.lastActive = Date.now();

        socket.to(sessionId).emit('cursor-update', {
          userId: socket.id,
          cursor: cursor,
          userName: user.name,
          userColor: user.color,
          lastActive: user.lastActive
        });
      }
    }
  });


  socket.on('code-change', ({ sessionId, code }) => {
    console.log(`Code change from ${socket.id} in session ${sessionId}. New code length: ${code.length}`);

    if (sessions.has(sessionId)) {
      const session = sessions.get(sessionId);
      session.code = code;

      if (session.users.has(socket.id)) {
        session.users.get(socket.id).lastActive = Date.now();
      }


      socket.to(sessionId).emit('code-update', code);
      console.log(`Broadcasted code update to session ${sessionId}`);
    } else {
      console.log(`Session ${sessionId} not found!`);
    }
  });

  socket.on('leave-session', (sessionId) => {
    handleUserLeave(socket, sessionId);
  });


  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);


    if (socket.sessionId) {
      handleUserLeave(socket, socket.sessionId);
    }
  });


  socket.on('debug-sessions', () => {
    console.log('Current sessions:', Array.from(sessions.keys()));
    sessions.forEach((session, sessionId) => {
      console.log(`Session ${sessionId}: ${session.users.size} users, code: ${session.code.substring(0, 50)}...`);
      console.log('Users in session:', Array.from(session.users.entries()).map(([id, user]) => ({
        id,
        name: user.name,
        color: user.color,
        lastActive: new Date(user.lastActive).toLocaleTimeString()
      })));
    });
  });


  socket.on('save-code', async ({ sessionId, code }) => {
    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          code: code,
          updatedAt: new Date()
        }
      });

      socket.emit('save-success', { message: 'Code saved successfully' });
      console.log(`Session ${sessionId} code saved via socket`);
    } catch (err) {
      console.error('Error saving code via socket:', err);
      socket.emit('save-error', { message: 'Failed to save code' });
    }
  });
});


function handleUserLeave(socket, sessionId) {
  if (sessions.has(sessionId)) {
    const session = sessions.get(sessionId);

    if (session.users.has(socket.id)) {
      const user = session.users.get(socket.id);
      session.users.delete(socket.id);
      socket.leave(sessionId);

      console.log(`User ${user.name} (${socket.id}) left session ${sessionId}`);


      const userList = Array.from(session.users.entries()).map(([socketId, user]) => ({
        id: socketId,
        name: user.name,
        color: user.color,
        cursor: user.cursor
      }));
      io.to(sessionId).emit('users-update', userList);


      if (session.users.size === 0) {
        sessions.delete(sessionId);
        console.log(`Deleted empty session: ${sessionId}`);
      }
    }
  }
}



app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

setInterval(() => {
  sessions.forEach((session, sessionId) => {
    cleanupInactiveUsers(sessionId);
  });
}, 5 * 60 * 1000);


process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});


const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on http://localhost:${PORT}`);
});