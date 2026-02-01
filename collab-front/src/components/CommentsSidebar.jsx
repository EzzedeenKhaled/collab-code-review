import { MessageSquare } from "lucide-react";
import ActiveUsers from "./ActiveUsers";
import CommentsList from "./CommentsList";
import CommentForm from "./CommentForm";

const CommentsSidebar = ({
  users,
  typingUsers,
  comments,
  commentText,
  setCommentText,
  commentLine,
  setCommentLine,
  codeLines,
  isSubmittingComment,
  onAddComment,
  commentsEndRef,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 h-full flex flex-col">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">
            Comments ({comments.length})
          </h3>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <ActiveUsers users={users} typingUsers={typingUsers} />

        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          <CommentsList comments={comments} commentsEndRef={commentsEndRef} />
        </div>

        <CommentForm
          commentText={commentText}
          setCommentText={setCommentText}
          commentLine={commentLine}
          setCommentLine={setCommentLine}
          codeLines={codeLines}
          isSubmittingComment={isSubmittingComment}
          onAddComment={onAddComment}
        />
      </div>
    </div>
  );
};

export default CommentsSidebar;
