import { useRef } from "react";
import { useParams } from "react-router-dom";
import SessionHeader from "../components/Sessionheader";
import CodeEditor from "../components/CodeEditor";
import CommentsSidebar from "../components/CommentsSidebar";
import { useSocket } from "../hooks/useSocket";
import { useCodeSync } from "../hooks/useCodeSync";
import { useComments } from "../hooks/useComments";
import { useCodeExecution } from "../hooks/useCodeExeciton";
import { getUserId, getUserName, generateUserColor } from "../utils/userUtils";

const Session = () => {
  const { id } = useParams();

  // User info
  const userInfo = useRef({
    name: getUserName(),
    color: generateUserColor(),
  });

  // Custom hooks
  const { socket, isConnected, users } = useSocket(id, userInfo.current);
  const { code, typingUsers, handleCodeChange } = useCodeSync(
    socket,
    id,
    isConnected,
  );
  const {
    comments,
    commentText,
    setCommentText,
    commentLine,
    setCommentLine,
    isSubmittingComment,
    handleAddComment,
    commentsEndRef,
  } = useComments(socket, id);
  const { runOutput, handleRunCode } = useCodeExecution(socket, id, code);

  // Wrapper for handleAddComment to include user info
  const onAddComment = () => {
    const userId = getUserId();
    const userName = getUserName();
    handleAddComment(userId, userName, userInfo.current.color);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <SessionHeader
        sessionId={id}
        isConnected={isConnected}
        users={users}
        onRunCode={handleRunCode}
      />

      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <CodeEditor
              code={code}
              isConnected={isConnected}
              typingUsers={typingUsers}
              runOutput={runOutput}
              onCodeChange={handleCodeChange}
            />
          </div>

          <div className="lg:col-span-1">
            <CommentsSidebar
              users={users}
              typingUsers={typingUsers}
              comments={comments}
              commentText={commentText}
              setCommentText={setCommentText}
              commentLine={commentLine}
              setCommentLine={setCommentLine}
              codeLines={code.split("\n").length}
              isSubmittingComment={isSubmittingComment}
              onAddComment={onAddComment}
              commentsEndRef={commentsEndRef}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Session;
