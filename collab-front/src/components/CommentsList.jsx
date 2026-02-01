import { MessageSquare } from "lucide-react";
import { formatTime } from "../utils/userUtils";

const CommentsList = ({ comments, commentsEndRef }) => {
  if (comments.length === 0) {
    return (
      <div className="text-center text-slate-500 py-8">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No comments yet</p>
      </div>
    );
  }

  return (
    <>
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="border-l-4 pl-4 pb-4 border-b border-slate-100 last:border-b-0"
        >
          <div className="flex items-center space-x-2 mb-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: comment.userColor || "#3B82F6" }}
            >
              {comment.userName?.[0]?.toUpperCase() || "U"}
            </div>
            <span className="text-sm font-medium text-slate-900">
              {comment.userName || "Anonymous"}
            </span>
            <span className="text-xs text-slate-500">
              Line {comment.lineNumber}
            </span>
          </div>
          <p className="text-sm text-slate-700 mb-2">{comment.content}</p>
          <span className="text-xs text-slate-500">
            {formatTime(comment.createdAt)}
          </span>
        </div>
      ))}
      <div ref={commentsEndRef} />
    </>
  );
};

export default CommentsList;
