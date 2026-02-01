class SessionService {
  constructor() {
    this.sessions = new Map();
    this.userSessions = new Map();
  }

  createSession(userId, userName, title) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newSession = {
      id: sessionId,
      title,
      userId,
      userName,
      code: "// Start coding...",
      language: "javascript",
      comments: [],
      users: new Map(),
      createdAt: new Date().toISOString(),
    };

    this.sessions.set(sessionId, newSession);

    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, []);
    }
    this.userSessions.get(userId).push(sessionId);

    return newSession;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  getUserSessions(userId) {
    const sessionIds = this.userSessions.get(userId) || [];
    return sessionIds
      .map((id) => this.sessions.get(id))
      .filter(Boolean)
      .map((session) => ({
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
        commentCount: session.comments.length,
      }));
  }

  updateCode(sessionId, code) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.code = code;
      return true;
    }
    return false;
  }

  addComment(sessionId, commentData) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...commentData,
      createdAt: new Date().toISOString(),
    };

    session.comments.push(comment);
    return comment;
  }

  getComments(sessionId) {
    const session = this.sessions.get(sessionId);
    return session ? session.comments : null;
  }

  addUser(sessionId, socketId, userData) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.users.set(socketId, {
        ...userData,
        isTyping: false,
        joinedAt: Date.now(),
        lastActive: Date.now(),
      });
      return true;
    }
    return false;
  }

  removeUser(sessionId, socketId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      return session.users.delete(socketId);
    }
    return false;
  }

  updateUserActivity(sessionId, socketId) {
    const session = this.sessions.get(sessionId);
    if (session && session.users.has(socketId)) {
      session.users.get(socketId).lastActive = Date.now();
    }
  }

  setUserTyping(sessionId, socketId, isTyping) {
    const session = this.sessions.get(sessionId);
    if (session && session.users.has(socketId)) {
      const user = session.users.get(socketId);
      user.isTyping = isTyping;
      user.lastActive = Date.now();
      return user;
    }
    return null;
  }

  getUsersList(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return Array.from(session.users.entries()).map(([socketId, user]) => ({
      id: socketId,
      name: user.name,
      color: user.color,
      isTyping: user.isTyping,
    }));
  }

  cleanupInactiveUsers(sessionId, threshold) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const now = Date.now();
    for (const [socketId, user] of session.users) {
      if (now - user.lastActive > threshold) {
        session.users.delete(socketId);
      }
    }
  }

  getAllSessionIds() {
    return Array.from(this.sessions.keys());
  }
}

module.exports = new SessionService();
