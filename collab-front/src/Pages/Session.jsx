import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { Decoration, ViewPlugin, WidgetType } from '@codemirror/view';
import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { Play } from 'lucide-react'
import { useUser } from "@clerk/clerk-react";
import io from 'socket.io-client';
import { ArrowLeft, Users, MessageSquare, Save, Send } from 'lucide-react';

class UserCursorWidget extends WidgetType {
  constructor(userName, userColor) {
    super();
    this.userName = userName;
    this.userColor = userColor;
  }
  toDOM() {
    const wrap = document.createElement('span');
    wrap.style.position = 'relative';

    const cursor = document.createElement('span');
    cursor.style.display = 'inline-block';
    cursor.style.width = '2px';
    cursor.style.height = '1.5em';
    cursor.style.background = this.userColor;
    cursor.style.verticalAlign = 'bottom';
    cursor.style.marginLeft = '-1px';
    cursor.style.marginRight = '1px';
    cursor.style.position = 'absolute';
    cursor.style.left = '0';
    cursor.style.top = '0';


    const label = document.createElement('span');
    label.textContent = this.userName;
    label.style.background = this.userColor;
    label.style.color = '#fff';
    label.style.fontSize = '0.75em';
    label.style.padding = '1px 6px';
    label.style.borderRadius = '6px';
    label.style.position = 'absolute';
    label.style.left = '8px';
    label.style.top = '-0.6em';
    label.style.whiteSpace = 'nowrap';
    label.style.zIndex = '100';

    wrap.appendChild(cursor);
    wrap.appendChild(label);
    return wrap;
  }
}

function userCursorsExtension(cursors, mySocketId) {
  return ViewPlugin.fromClass(class {
    decorations;
    constructor(view) {
      this.decorations = this.buildDecorations(view);
    }
    update(update) {
      if (update.docChanged || update.startState !== update.state) {
        this.decorations = this.buildDecorations(update.view);
      }
    }
    buildDecorations(view) {
      const widgets = [];
      for (const [userId, { cursor, userName, userColor }] of cursors.entries()) {
        if (userId === mySocketId || cursor == null) continue;
        if (cursor >= 0 && cursor <= view.state.doc.length) {
          widgets.push(
            Decoration.widget({
              widget: new UserCursorWidget(userName, userColor),
              side: 1
            }).range(cursor)
          );
        }
      }
      return Decoration.set(widgets, true);
    }
  }, {
    decorations: v => v.decorations
  });
}


const getUsernameFromEmail = (email) => {
  if (!email) return 'Anonymous';
  return email.split('@')[0];
};

const Session = () => {
  const { id } = useParams();
  const { user } = useUser();
  const [runOutput, setRunOutput] = useState('');
  const [code, setCode] = useState('// Start coding...');
  const [mySocketId, setMySocketId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentLine, setCommentLine] = useState(1);
  const [users, setUsers] = useState([]);
  const [cursors, setCursors] = useState(new Map());
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const codeRef = useRef('');
  const socketRef = useRef(null);
  const isUpdatingFromSocket = useRef(false);
  const editorRef = useRef(null);
  const commentsEndRef = useRef(null);

  const handleRunCode = async () => {
    setRunOutput('Running...');
    try {
      const res = await fetch(`http://localhost:3001/api/sessions/${id}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ code })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setRunOutput(data.error ? `Error: ${data.error}` : data.output || '(No output)');
    } catch (err) {
      console.error('Failed to run code:', err);
      setRunOutput(`Failed to run code: ${err.message}`);
    }
  };


  const userInfo = useRef({
    name: user?.primaryEmailAddress?.emailAddress
      ? getUsernameFromEmail(user.primaryEmailAddress.emailAddress)
      : `User${Math.floor(Math.random() * 1000)}`,
    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
  });

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  useEffect(() => {
    if (!user) return;


    userInfo.current.name = user?.primaryEmailAddress?.emailAddress
      ? getUsernameFromEmail(user.primaryEmailAddress.emailAddress)
      : `User${Math.floor(Math.random() * 1000)}`;


    socketRef.current = io('http://localhost:3001', {
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;


    fetch(`http://localhost:3001/api/sessions/${id}/comments`)
      .then(res => res.json())
      .then(data => {
        setComments(data);
      })
      .catch(err => console.error('Error fetching comments:', err));


    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
      setMySocketId(socket.id);
      setIsConnected(true);


      socket.emit('join-session', {
        sessionId: id,
        userName: userInfo.current.name,
        userColor: userInfo.current.color
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });


    socket.on('comment-added', (comment) => {
      console.log('New comment received:', comment);
      setComments(prev => [...prev, comment]);
    });

    socket.on('comments-init', (initComments) => {
      console.log('Initial comments received:', initComments);
      setComments(initComments);
    });


    socket.on('users-update', (userList) => {
      console.log('Users update:', userList);
      setUsers(userList);
    });


    socket.on('cursor-update', ({ userId, cursor, userName, userColor }) => {
      setCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.set(userId, { cursor, userName, userColor });
        return newCursors;
      });
    });

    socket.on('code-update', (newCode) => {
      console.log('Received code update:', newCode.length, 'characters');
      if (newCode !== codeRef.current) {
        isUpdatingFromSocket.current = true;
        setCode(newCode);
        codeRef.current = newCode;
        setTimeout(() => {
          isUpdatingFromSocket.current = false;
        }, 100);
      }
    });

    return () => {
      socket.off('comment-added');
      socket.off('comments-init');
      socket.off('users-update');
      socket.off('cursor-update');
      socket.off('code-update');
      socket.disconnect();
    };
  }, [id, user]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !user || isSubmittingComment) return;

    setIsSubmittingComment(true);

    try {

      const response = await fetch(`http://localhost:3001/api/sessions/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: commentText,
          lineNumber: commentLine,
          userId: user.id,
          userName: getUsernameFromEmail(user.primaryEmailAddress.emailAddress),
          email: user.primaryEmailAddress.emailAddress
        })
      });

      if (response.ok) {
        setCommentText('');

      } else {
        console.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCodeChange = (value, viewUpdate) => {
    if (isUpdatingFromSocket.current) {
      return;
    }

    console.log('Local code change:', value.length, 'characters');
    setCode(value);
    codeRef.current = value;


    if (viewUpdate && viewUpdate.state) {
      const cursor = viewUpdate.state.selection.main.head;
      if (socketRef.current && isConnected) {
        socketRef.current.emit('cursor-update', { sessionId: id, cursor });
      }
    }


    if (socketRef.current && isConnected) {
      socketRef.current.emit('code-change', { sessionId: id, code: value });
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/sessions/${id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Code saved successfully!');
      } else {
        toast.error('Failed to save code: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      toast.error('Failed to save code: ' + err.message);
    }
  };

  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;

    const handleRunOutput = (data) => {
      setRunOutput(data.error ? `Error: ${data.error}` : data.output || '(No output)');
    };

    socket.on('run-output', handleRunOutput);

    return () => {
      socket.off('run-output', handleRunOutput);
    };
  }, []);

  const cursorTrackerPlugin = ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.sendCursor(view);
      }
      update(update) {
        if (update.selectionSet) {
          this.sendCursor(update.view);
        }
      }
      sendCursor(view) {
        const cursor = view.state.selection.main.head;
        if (socketRef.current && isConnected) {
          socketRef.current.emit('cursor-update', {
            sessionId: id,
            cursor
          });
        }
      }
    }
  );

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
            <div className="h-6 w-px bg-slate-300"></div>
            <h1 className="text-xl font-semibold text-slate-900">
              Session {id}
              <button
                className="ml-2 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                title="Copy Session ID"
                onClick={() => {
                  navigator.clipboard.writeText(id);
                  toast.success('Session ID copied! Share with your friends to join!');
                }}
                type="button"
              >
                <Copy className="w-4 h-4 text-slate-500" />
              </button>
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <Users className="h-4 w-4" />
              <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                {isConnected ? `${users.length} user${users.length !== 1 ? 's' : ''}` : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={handleSave}
              className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </button>
            <button
              onClick={handleRunCode}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm cursor-pointer"
            >
              <Play className="w-4 h-4 mr-2" />

              Run Code
            </button>
          </div>
        </div>
      </header>


      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-8">

          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">Code Review</h2>
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>{isConnected ? 'Live' : 'Offline'}</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <CodeMirror
                  ref={editorRef}
                  value={code}
                  height="600px"
                  extensions={[
                    javascript(),
                    userCursorsExtension(cursors, mySocketId),
                    cursorTrackerPlugin
                  ]}
                  onChange={handleCodeChange}
                  theme="light"
                  className="text-sm"
                />
              </div>
              <div className="px-6 py-2 border-t border-slate-200 bg-slate-50">
                <div className="font-mono text-xs text-slate-700 whitespace-pre-wrap">
                  <strong>Output:</strong>
                  <div>{runOutput}</div>
                </div>
              </div>
            </div>
          </div>


          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 h-full flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-slate-600" />
                  <h3 className="font-semibold text-slate-900">Comments ({comments.length})</h3>
                </div>
              </div>

              <div className="flex-1 flex flex-col">

                <div className="p-4 border-b border-slate-200">
                  <div className="text-sm font-medium text-slate-700 mb-2">Active Users:</div>
                  {users.length > 0 ? (
                    <div className="space-y-2">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: user.color }}
                          ></div>
                          <span className="text-sm text-slate-600">{user.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">Only you</div>
                  )}
                </div>


                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {comments.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No comments yet</p>
                    </div>
                  ) : (
                    comments.map((comment) => {
                      const displayName = userInfo.current.name;

                      return (
                        <div key={comment.id} className="border-l-4 pl-4 pb-4 border-b border-slate-100 last:border-b-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                              {displayName[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="text-sm font-medium text-slate-900">
                              {displayName}
                            </span>
                            <span className="text-xs text-slate-500">Line {comment.lineNumber}</span>
                          </div>
                          <p className="text-sm text-slate-700 mb-2">{comment.content}</p>
                          <span className="text-xs text-slate-500">
                            {formatTime(comment.createdAt)}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={commentsEndRef} />
                </div>


                <div className="border-t border-slate-200 p-4">
                  <div className="flex items-center mb-2">
                    <label className="mr-2 text-sm text-slate-600">Line:</label>
                    <input
                      type="number"
                      min={1}
                      max={code.split('\n').length}
                      value={commentLine}
                      onChange={e => setCommentLine(Number(e.target.value))}
                      className="w-16 p-1 border border-slate-200 rounded text-sm mr-2"
                    />
                    <span className="text-xs text-slate-400">of {code.split('\n').length}</span>
                  </div>
                  <div className="flex space-x-2">
                    <textarea
                      placeholder="Add a comment..."
                      className="flex-1 p-3 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                    />
                  </div>
                  <button
                    className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || isSubmittingComment}
                    type="button"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmittingComment ? 'Adding...' : 'Add Comment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Session;